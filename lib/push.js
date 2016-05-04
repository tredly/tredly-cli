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
var fs = require('fs');
var zlib = require('zlib');
var path = require('path');
var async = require('async');
var _ = require('lodash');
var tar = require('tar-stream');
var request = require('request');
var env = require('./env');

module.exports = function* (mode, serverPath, partition, options) {

    if (!mode) {
        return null;
    }

    if (!serverPath) {
        return null;
    }

    if (mode === 'container' && !partition) {
        return null;
    }

    return yield new Promise (function (resolve, reject) {

        var files = getAllFiles('./');

        if (mode === 'container' &&
            !_.find(files, function (file) { return file.name === 'Tredlyfile'; })) {
            console.log('Tredlyfile not found'.red);
            return resolve();
        }

        var apiToken = env.get('apiToken');
        var apiUrl = env.get('apiUrl');

        var error = null;
        var pack = tar.pack();

        var stream = request({
            url: url.resolve(apiUrl, '/tredly/v1/push/' + mode),
            method: 'POST',
            strictSSL: false,
            headers: {
                'authorization': 'Bearer ' + apiToken
            }
        }, function (err, response, data) {
            error = error || err;
            if (error) {
                console.log('Error: '.red, err && err.message);
                return resolve(error);
            }

            if (!response || response.statusCode !== 200) {
                return resolve(new Error ('Unknown error'));
            }

            return resolve();
        });

        pack.pipe(zlib.createGzip()).pipe(stream).pipe(process.stdout);

        stream.on('error', function (err) {
            error = error || err;
        });

        pack.entry({ name: '.tredlyapi' }, JSON.stringify(_.extend({
            path: serverPath,
            partition: partition
        }, options)));

        async.eachSeries(files, function (file, done) {
            var entry = pack.entry({
                name: file.name,
                size: file.stats.size
            }, function (err, data) {
                done(err);
            });

            fs.createReadStream(file.name).pipe(entry);

        }, function (err) {
            error = error || err;
            pack.finalize();
        });

    });
};

function getAllFiles (dir) {
    var files = [];
    var contents = fs.readdirSync(dir);

    var stats = null;;

    _.forEach(contents, function (name) {
        if (name === '.tredlyapi') {
            return;
        }
        name = path.join(dir, name);
        stats = fs.statSync(name);

        if (stats.isDirectory()) {
            if (name !== '.git') {
                files.push(getAllFiles(name));
            }
        } else {
            files.push({ name: name, stats: stats });
        }
    });

    files = _.flatten(files);

    return files;
};
