'use strict';

var _ = require('lodash');


module.exports = {
    createToken: createToken
};


function createToken (length) {
    length = length || 32;

    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }

    return str;
}
