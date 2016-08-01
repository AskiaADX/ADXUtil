var Client          = require('../../node_modules/github/lib/index');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var async           = require('async');
var _               = require('underscore');
var git             = require('simple-git')();




git.add('./*'/*path.join(__dirname,'../../../ADCs/adc2_gender/')*/)
    .commit('first commit')
    .push('test', 'master');


