'use strict';

var url = require('url');
var read = require('read');
var _ = require('lodash');
var request = require('request');
var env = require('./env');

module.exports = function* (apiUser, apiHost, apiPassword) {

    var result = {};

    if (apiHost) {
        env.set('apiUrl', composeApiUrl(apiHost));
        env.set('apiToken', null);
    }

    var currentUrl = env.get('apiUrl');

    var apiToken = env.get('apiToken');

    if (arguments.length > 0) {
        var server = apiHost || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'API host: ',
                default: currentUrl && url.parse(currentUrl).hostname || ''
            }, function (err, res) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }
                resolve(res);
            });
        }));

        server = composeApiUrl(server);
        result.url = server;

        if (!server) {
            return result;
        }

        var username = apiUser || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'User name: '
            }, function (err, res) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }
                resolve(res);
            });
        }));

        result.username = username;

        if (!username) {
            return result;
        }

        var password = apiPassword || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'Password: ',
                silent: true
            }, function (err, res) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }
                resolve(res);
            });
        }));

        result.password = password;

        if (!password) {
            return result;
        }


        env.set('apiUrl', server);
        env.set('apiToken', null);

        return yield new Promise (function (resolve, reject) {
            request({
                url: url.resolve(server, '/tredly/v1/auth/login'),
                method: 'POST',
                json: true,
                strictSSL: false,
                body: {
                    username: username,
                    password: password
                }
            }, function (err, response, data) {
                if (err) {
                    console.log(err.message.red);
                    return resolve(result);
                }

                apiToken = data.data && data.data.token || data.token;
                if (apiToken) {
                    env.set('apiToken', apiToken);
                }
                result.token = apiToken;
                resolve(result);
            });
        });
    } else if (apiToken && currentUrl) {
        return yield new Promise (function (resolve, reject) {
            request({
                url: url.resolve(currentUrl, '/tredly/v1/auth/refresh'),
                method: 'POST',
                json: true,
                strictSSL: false,
                body: {
                    token: apiToken
                }
            }, function (err, response, data) {
                if (err) {
                    console.log(err.message.red);
                    return resolve(result);
                }

                apiToken = data.data && data.data.token || data.token;
                if (apiToken) {
                    env.set('apiToken', apiToken);
                }
                result.token = apiToken;
                resolve(result);
            });
        });
    } else {
        return result;
    }
};


function composeApiUrl(host, port) {
    return 'https://' + host + ':' + (port || 65223) + '/';
}

