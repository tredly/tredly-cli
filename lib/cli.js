'use strict';

require('colors');

var url = require('url');
var _ = require('lodash');
var co = require('co');
var request = require('request');
var minimist = require('minimist');
var env = require('./env');
var connect = require('./connect');
var push = require('./push');
var password = require('./password');
var tools = require('./tools');

process.on('uncaughtException', function (p) {
    console.log('Error: '.red, p);
});
process.on('unhandledRejection', function (reason, p) {
    console.log('Error: '.red, p);
});

co(function* () {
    var args = minimist(process.argv.slice(2));

    var apiToken = yield tryConnect(args);

    if (!apiToken) {
        return;
    }

    if (yield tryPush(args)) {
        return;
    }

    if (yield tryDisconnect(args)) {
        return;
    }

    yield replaceCommands(args);

    var apiUrl = env.get('apiUrl');
    apiUrl = url.resolve(apiUrl, '/tredly/v1/');

    console.log('Tredly API - ', apiUrl.green);

    var fullUrl = apiUrl;
    var body = {};

    _.forEach(args._, function (arg) {
        fullUrl += arg + '/';
    });

    delete args._;

    var sessionId = tools.createToken();

    var stream = request({
        url: fullUrl,
        method: 'POST',
        body: JSON.stringify(args),
        strictSSL: false,
        headers: {
            // Test JSON output
            // 'accept': 'application/json',

            'authorization': 'Bearer ' + apiToken,
            'content-type': 'application/json',
            'x-tredly-api-session': sessionId
        }
    });

    stream.pipe(process.stdout);

    var stdinUrl = url.resolve(apiUrl, 'api/stdin/');

    process.stdin.on('data', function (data) {
        request({
            url: stdinUrl,
            method: 'POST',
            body: data && data.toString() || '',
            strictSSL: false,
            headers: {
                'authorization': 'Bearer ' + apiToken,
                'content-type': 'text/plain',
                'x-tredly-api-session': sessionId
            }
        });
    });

    stream.on('error', function (err) {
        if (err) {
            console.log('Error: '.red, err && err.message);
        }
        process.stdin.destroy();
    });

    stream.on('end', function () {
        process.stdin.destroy();
    });
});

function* tryConnect (args) {
    var connection = {};
    var helpText = 'Please, use "tredly connect --username=[user] --password=[password] --host=[host]" command format'.red;

    if (args._[0] && args._[0].toLowerCase() === 'connect') {
        var userParam = args.username || '';
        var passwordParam = args.password || '';
        var hostParam = args.host || '';
        connection = yield connect(userParam, hostParam, passwordParam);
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

    return apiToken;
}


function* tryPush (args) {
    if (args._[0] && args._[0].toLowerCase() === 'push') {

        var mode = args._[1] && args._[1].toLowerCase();
        var serverPath = args.location;
        var partition = args._[2];

        switch (mode) {
            case 'container':
                if (!serverPath || !partition) {
                    console.log('Please, use "tredly push container [partition] --location=[server path]" command format'.red);
                    return true;
                }
                break;
            case 'files':
                if (!serverPath) {
                    console.log('Please, use "tredly push files --location=[server path]" command format'.red);
                    return true;
                }
                break;
            default:
                return;
        }

        delete args._;

        yield push(mode, serverPath, partition, args);

        return true;
    }
}

function* tryDisconnect (args) {
    if (args._[0] && args._[0].toLowerCase() === 'disconnect') {

        env.set('apiToken', null);

        return true;
    }
}

function* replaceCommands (args) {
    if (args._[0] && args._[0].toLowerCase() === 'change' &&
        args._[1] && args._[1].toLowerCase() === 'password') {

        args._ = ['edit', 'user'];

        yield password(args);

        return true;
    }
}
