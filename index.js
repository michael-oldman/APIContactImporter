var _ = require('lodash');
var q = require('q');
var config = require('config');

var datacentre = config.get('Brightpearl.datacentre');
var accountId = config.get('Brightpearl.accountId');
var appRef = config.get('Brightpearl.private-app-ref');
var token = config.get('Brightpearl.private-account-token');