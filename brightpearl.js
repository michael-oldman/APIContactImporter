var request = require('request'),
    querystring = require('querystring');

var delay = 0;

module.exports = function(datacentre, accountId, appRef, token) {

    var call = function (method, path, body, callback) {

        setTimeout(function() {

            if (!callback) callback = function(){};

            var options = {
                uri: 'https://ws-' + datacentre + '.brightpearl.com/2.0.0/' + accountId + path,
                method: method,
                headers: {
                    'brightpearl-app-ref': appRef,
                    'brightpearl-account-token': token
                }
            };

            request(options, function (error, response, body) {
                //console.log(options.uri);

                if (error) {
                    return callback(Error(error));
                }

                if (response.statusCode == 503) {
                    var nextPeriod = response.headers['brightpearl-next-throttle-period'];
                    if (delay == 0) {
                        //console.log('Next throttling period in ' + (nextPeriod / 1000) + 's');
                    }
                    delay = nextPeriod;
                    call(method, path, body, callback);
                    return;
                }

                delay = 0;

                return callback(null, response.statusCode, JSON.parse(body).response);
            });
        }, delay);
    };

    var fullSearch = function (path, params, callback) {
        if (!callback) callback = function(){};

        var allResults = [];

        search(1);

        function search(firstResult) {

            params.firstResult = firstResult;
            var queryParams = querystring.stringify(params);
            var searchQuery = path + '?' + queryParams;

            call('GET', searchQuery, '{}', function (err, statusCode, results) {

                if (err) {
                    return callback(Error(err));
                }

                results.results.forEach(function (result) {
                    allResults.push(result);
                });

                if (results.metaData.lastResult) {
                    search(results.metaData.lastResult + 1);
                } else {
                    callback(null, allResults);
                }
            });
        }
    };

    return {
        call: call,
        fullSearch: fullSearch
    }
};
