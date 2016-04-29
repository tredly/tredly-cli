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

require('colors');

var url = require('url');
var _ = require('lodash');
var co = require('co');
var request = require('request');
var minimist = require('minimist');
var env = require('./env');
var connect = require('./connect');
var push = require('./push');

process.on('uncaughtException', function (p) {
    console.log('Error: '.red, p);
});
process.on('unhandledRejection', function (reason, p) {
    console.log('Error: '.red, p);
});

co(function* () {
    var args = minimist(process.argv.slice(2));

    var connection = {};
    var helpText = 'Please, use "tredly connect --username=[user] --password=[password] --url=[protocol://host:port]" command format'.red;

    if (args._[0].toLowerCase() === 'connect') {
        var userParam = args.username || '';
        var passwordParam = args.password || '';
        var urlParam = args.url || '';
        connection = yield connect(userParam, urlParam, passwordParam);
        if (!connection.token) {
            console.log('Cannot connect: user=%s, url=%s"'.red, connection.username, connection.url);
        } else {
            console.log('Connected: user=%s, url=%s"'.green, connection.username, connection.url);
        }
        return;
    }

    var apiUrl = env.get('apiUrl');
    if (!apiUrl) {
        console.log(helpText);
        return;
    }

    connection = yield connect();

    var apiToken = connection.token;

    if (!apiToken) {
        console.log(helpText);
        return;
    }

    if (args._[0].toLowerCase() === 'push' &&
        args._[1].toLowerCase() === 'container') {
        var serverPath = args.path;
        var partition = args._[2];

        delete args._;

        if (serverPath && partition) {
            yield push(serverPath, partition, args);
        } else {
            console.log('Please, use "tredly push [partition] --path=[server path]" command format'.red);
        }
        return;
    }

    apiUrl = url.resolve(apiUrl, '/tredly/v1/');

    console.log('Tredly API - ', apiUrl.green);

    var fullUrl = apiUrl;
    var body = {};

    _.forEach(args._, function (arg) {
        fullUrl += arg + '/';
    });

    delete args._;

    var stream = request({
        url: fullUrl,
        method: 'POST',
        body: JSON.stringify(args),
        strictSSL: false,
        headers: {
            'authorization': 'Bearer ' + apiToken,
            'content-type': 'application/json'
        }
    });

    stream.pipe(process.stdout);

    stream.on('error', function (err) {
        if (err) {
            console.log('Error: '.red, err && err.message);
        }
    });
});

