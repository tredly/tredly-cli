'use strict';

var url = require('url');
var read = require('read');
var _ = require('lodash');
var request = require('request');
var env = require('./env');

module.exports = function* (options) {

    options.username = options.username || (yield new Promise (function (resolve, reject) {
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

    options.password = options.password || (yield new Promise (function (resolve, reject) {
        read({
            prompt: 'New password: ',
            silent: true
        }, function (err, res) {
            if (err) {
                console.log(err.message.red);
                return resolve();
            }
            resolve(res);
        });
    }));
};

