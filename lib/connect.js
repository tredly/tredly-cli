'use strict';

//////////////////////////////////////////////////////////////////////////
// Copyright 2016 Vuid Pty Ltd
// https://www.vuid.com
//
// This file is part of tredly-cli.
//
// tredly-cli is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// tredly-cli is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with tredly-cli.  If not, see <http://www.gnu.org/licenses/>.
//////////////////////////////////////////////////////////////////////////

var url = require('url');
var read = require('read');
var _ = require('lodash');
var request = require('request');
var env = require('./env');

module.exports = function* (apiUser, apiUrl, apiPassword) {

    var result = {};

    if (apiUrl) {
        env.set('apiUrl', apiUrl);
        env.set('apiToken', null);
    }

    var currentUrl = env.get('apiUrl');

    var apiToken = env.get('apiToken');

    if (arguments.length > 0) {
        var server = apiUrl || (yield new Promise (function (resolve, reject) {
            read({
                prompt: 'API url: ' + (currentUrl ? '' : '(protocol://host:port)'),
                default: currentUrl || ''
            }, function (err, res) {
                if (err) {
                    console.log(err.message.red);
                    return resolve();
                }
                resolve(res);
            });
        }));

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
