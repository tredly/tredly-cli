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

    var stream = request({
        url: fullUrl,
        method: 'POST',
        body: JSON.stringify(args),
        strictSSL: false,
        headers: {
            'authorization': 'Bearer ' + apiToken,
            'content-type': 'application/json',

            // Test JSON output
            // 'accept': 'application/json'
        }
    });

    stream.pipe(process.stdout);

    stream.on('error', function (err) {
        if (err) {
            console.log('Error: '.red, err && err.message);
        }
    });

    stream.on('end', function () {
        console.log('');
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
        var serverPath = args.path;
        var partition = args._[2];

        switch (mode) {
            case 'container':
                if (!serverPath || !partition) {
                    console.log('Please, use "tredly push container [partition] --path=[server path]" command format'.red);
                    return true;
                }
                break;
            case 'files':
                if (!serverPath) {
                    console.log('Please, use "tredly push files --path=[server path]" command format'.red);
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
