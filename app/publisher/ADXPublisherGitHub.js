var Client          = require('../../node_modules/github/lib/index');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var async           = require('async');
var _               = require('underscore');
console.log(path.join(__dirname,'../../../ADCs/adc2_gender/'));
var git             = require('simple-git')();


var default_options = {
    username: 'LouisAskia', //
    token: '3b94fab02e1cf926056ff07ce29ca4872287a8fd' //Must be a token with delete_repo permisssion
};

git.add('./*'/*path.join(__dirname,'../../../ADCs/adc2_gender/')*/)
    .commit('first commit')
    .push('origin', 'test');


