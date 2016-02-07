// External imports
var _ = require('lodash');
var config = require('config');
var fs = require('fs');
var Converter = require('csvtojson').Converter;
var objectPath = require('object-path');
var nullPrune = require('null-prune');
var async = require('async');
var dataStore = require('data-store');

// Internal imports
var Contact = require('./lib/domain/contact');
var Address = require('./lib/domain/postal-address');

var push = false;

if (process.argv[2] == 'push') {
    push = true;
}

var datacentre = config.get('brightpearl.datacentre');
var accountId = config.get('brightpearl.accountId');
var appRef = config.get('brightpearl.private-app-ref');
var token = config.get('brightpearl.private-account-token');

var brightpearl = require('./lib/brightpearl')(datacentre, accountId, appRef, token);
var multimessage = require('./lib/multimessage')(brightpearl);
var store = dataStore('store');

var count = 0;
var complete = 0;
var filesOpen = 0;

brightpearl.call('GET', '/accounting-service/tax-code', null, function(err, statusCode, taxCodes){

    if (err) {
        console.error('Unable to fetch tax codes, check connection config');
        process.exit(1);
    }

    var taxCodeMap = {};

    _.each(taxCodes, function(taxCode){
        taxCodeMap[taxCode.id] = taxCode.id;
        taxCodeMap[taxCode.code] = taxCode.id;
    });

    var files = fs.readdirSync('spreadsheets');

    files.forEach(function(file) {
        console.log('Processing: ' + file);

        var rs = fs.createReadStream('spreadsheets\\' + file);
        filesOpen++;

        var csvConverter = new Converter({
            constructResult: false,
            ignoreEmpty: true
        });

        var q = async.queue(function(row, done){
            processRow(row, function(success){
                complete++;
                if (filesOpen == 0 && count == complete) {
                    multimessage.close();
                }
                done();
            });
        }, 10);

        q.saturated = function() {
            rs.pause();
        };

        q.empty = function() {
            rs.resume();
        };

        csvConverter.transform = function(json) {
            q.push(json);
        };

        rs.pipe(csvConverter);

        rs.on('end', function(){
            filesOpen--;
        });
    });

    function processRow(row, callback) {

        var log = ++count;
        var valid = true;

        _.keys(row).forEach(function(key) {
            if (!_.contains(_.keys(config.get('columns')), key)){
                log += " Column mismatch! " + key + " not configured";
                valid = true;
            }
        });

        if (!valid) {
            console.error(log);
            return callback(false);
        }

        var resources  = {
            "address": Address(),
            "contact": Contact()
        };

        _.each(_.pairs(config.get('columns')), function (columnPath) {
            if (columnPath[1] && row[columnPath[0]] != null) {
                objectPath.set(resources, columnPath[1], row[columnPath[0]]);
            }
        });

        var contactRef = resources.contact.assignment.current.accountCode;

        if (contactRef == null || contactRef.length == 0) {
            log += " contact code required";
            console.error(log);
            return callback(true);
        }

        if (!push) {
            log += "\n" + JSON.stringify(nullPrune(resources));
            console.log(log);
            return callback(true);
        }

        var importedId = store.get(contactRef);

        if (importedId != null) {
            log += " " + contactRef + " already imported with ID " + importedId;
            console.log(log);
            return callback(true);
        }

        log += " importing " + contactRef + " ";

        multimessage.call('POST', '/contact-service/postal-address/', nullPrune(resources.address), function(err, statusCode, id) {
            if (err) {
                log += "Address error: " + JSON.stringify(err);
                console.error(log);
                return callback(false);
            }
            log += "Address ID: " + id + " ";

            resources.contact.postAddressIds.DEF = id;
            resources.contact.postAddressIds.BIL = id;
            resources.contact.postAddressIds.DEL = id;

            resources.contact.financialDetails.taxCodeId = taxCodeMap[resources.contact.financialDetails.taxCodeId];

            resources.contact = nullPrune(resources.contact);

            multimessage.call('POST', '/contact-service/contact/', nullPrune(resources.contact), function(err, statusCode, id) {
                if (err) {
                    log += "Contact error: " + JSON.stringify(err);
                    console.error(log);
                    return callback(false);
                }

                store.set(contactRef, id);
                store.save();

                log += "Contact ID: " + id;
                console.log(log);
                callback(true);
            });
        });
    }
});