
var _ = require('lodash');
var DataStore = require('data-store');

var mode = process.argv[2];

if (mode == null) {
    console.error('Store mode required');
    process.exit(1);
}

var store = DataStore('store');

switch (mode) {
    case 'get':
    case 'clear':
    case 'all':
        break;
    default:
        console.error('Store mode ' + mode + ' not recognised');
        process.exit(1);
}

if (mode == 'clear') {
    store.del({force: true});
}

if (mode == 'all') {
    var ids = store.get();
    _.each(_.pairs(ids), function(codeId) {
        console.log("Code: " + codeId[0] + " ID: " + codeId[1]);
    });
}

if (mode == 'get') {
    var code = process.argv[3];
    var id = store.get(code);
    console.log("ID: " + id);
}