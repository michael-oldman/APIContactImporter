// External imports
var _ = require('lodash'),
    config = require('config'),
    fs = require('fs'),
    Converter = require('csvtojson').Converter,
    objectPath = require('object-path'),
    nullPrune = require('null-prune'),
    async = require('async'),
    dataStore = require('data-store');

// Internal imports
var Contact = require('./lib/domain/contact'),
    Address = require('./lib/domain/postal-address');

var push = false;

if (process.argv[2] == 'push') {
    push = true;
}

var datacentre = config.get('brightpearl.datacentre'),
    accountId = config.get('brightpearl.accountId'),
    appRef = config.get('brightpearl.private-app-ref'),
    token = config.get('brightpearl.private-account-token');

var brightpearl = require('./lib/brightpearl')(datacentre, accountId, appRef, token),
    multimessage = require('./lib/multimessage')(brightpearl),
    store = dataStore('store');

var count = complete = sucesses = filesOpen = 0;

brightpearl.call('GET', '/accounting-service/tax-code', null, (err, statusCode, taxCodes) => {

    if (err) {
        console.error('Unable to fetch tax codes, check connection config');
        process.exit(1);
    }

    console.log(taxCodes.length + ' tax codes found');
    var taxCodeMap = {};

    _.each(taxCodes, (taxCode) => {
        taxCodeMap[taxCode.id] = taxCode.id;
        taxCodeMap[taxCode.code] = taxCode.id;
    });

    var files = fs.readdirSync('spreadsheets');

    files.forEach((file) =>
    {
        console.log('Processing: ' + file);

        var rs = fs.createReadStream('spreadsheets/' + file);
        filesOpen++;

        var csvConverter = new Converter({
            constructResult: false,
            ignoreEmpty: true
        });

        var q = async.queue((row, done) => {
            processRow(row, (success) => {

                complete++;
                if (success) {
                    sucesses++;
                }

                if (filesOpen == 0 && count == complete) {
                    console.log(complete + " contacts processed " + sucesses + " successful " + (complete - sucesses) + " failures");
                    multimessage.close();
                }
                done();
            });
        }, 10);

        q.saturated = () => rs.pause();
        q.empty = () => rs.resume();

        csvConverter.transform = (json) => q.push(json);

        rs.pipe(csvConverter);
        rs.on('end', () => filesOpen--);
    });

    function processRow(row, callback) {

        var log = ++count;
        var valid = true;

        _.keys(row).forEach((key) => {
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

        _.each(_.pairs(config.get('columns')), (columnPath) => {
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

        multimessage.call('POST', '/contact-service/postal-address/', nullPrune(resources.address), (err, statusCode, id) => {
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

            multimessage.call('POST', '/contact-service/contact/', nullPrune(resources.contact), (err, statusCode, id) => {
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