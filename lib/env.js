'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var configFile = path.join(os.homedir(), '.tredly');
var config = null;

try {
    if (fs.existsSync(configFile)) {
        config = fs.readFileSync(configFile);
        config = JSON.parse(config);
    }
} catch (err) {
    console.log(err.message);
}

config = config || {};

_.forEach (config, function (val, key) {
    key = getEnvVarName(key);
    process.env[key] = process.env[key] || val;
});

module.exports = {
    set: set,
    get: get
};

function set (key, val) {
   process.env[getEnvVarName(key)] = val;
   config[getConfigName(key)] = val;
   fs.writeFileSync(configFile, JSON.stringify(config, null, '    '));
}

function get (key) {
   return process.env[getEnvVarName(key)];
}

function getEnvVarName (key) {
    return _.snakeCase(key).toUpperCase();
}

function getConfigName (key) {
    return _.camelCase(key);
}
