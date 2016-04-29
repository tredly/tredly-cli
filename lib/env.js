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
