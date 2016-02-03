var _ = require('lodash');
var q = require('q');
var config = require('config');
var fs = require('fs');
var Converter = require('csvtojson').Converter;
var objectPath = require('object-path');
var nullPrune = require('null-prune');

var Contact = require('./contact');
var Address = require('./postal-address');

var datacentre = config.get('brightpearl.datacentre');
var accountId = config.get('brightpearl.accountId');
var appRef = config.get('brightpearl.private-app-ref');
var token = config.get('brightpearl.private-account-token');

var Brightpearl = require('./brightpearl')(datacentre, accountId, appRef, token);

var csvConverter = new Converter({
    constructResult: false,
    ignoreEmpty: true
});

Brightpearl.call('GET', '/accounting-service/tax-code', null, function(err, statusCode, taxCodes){
    if (err) {
        console.error('Unable to fetch tax codes, check connection config');
        process.exit(1)
    }

    var taxCodeMap = {};

    _.each(taxCodes, function(taxCode){
        taxCodeMap[taxCode.id] = taxCode.id;
        taxCodeMap[taxCode.code] = taxCode.id;
    });

    console.log('Tax codes: ' + JSON.stringify(taxCodeMap));

    var files = fs.readdirSync('spreadsheets');

    _.forEach(files, function(file) {
        console.log('Processing: ' + file);

        fs.createReadStream('spreadsheets\\' + file)
            .pipe(csvConverter)
            .on('data', function(row){
                processRow(JSON.parse(row.toString()));
            });
    });

    function processRow(row) {

        row.fax = 3;
        console.log(row);

        var resources  = {
            "address": Address(),
            "contact": Contact()
        };

        _.each(_.pairs(config.get('columns')), function (columnPath) {
            if (columnPath[1] && row[columnPath[0]] != null) {
                objectPath.set(resources, columnPath[1], row[columnPath[0]]);
            }
        });

        console.log("Importing name: " + resources.contact.lastName + ", " + resources.contact.firstName + " @ " + resources.contact.organisation.name);

        Brightpearl.call('POST', '/contact-service/postal-address/', nullPrune(resources.address), function(err, statusCode, id) {
            if (err) return console.log(err);
            console.log("Address ID: " + id);

            resources.contact.postAddressIds.DEF = id;
            resources.contact.postAddressIds.BIL = id;
            resources.contact.postAddressIds.DEL = id;

            resources.contact.financialDetails.taxCodeId = taxCodeMap[resources.contact.financialDetails.taxCodeId];

            resources.contact = nullPrune(resources.contact);

            Brightpearl.call('POST', '/contact-service/contact/', nullPrune(resources.contact), function(err, statusCode, id) {
                if (err) return console.log(err);
                console.log("Contact ID: " + id);
            });
        });
    }
});