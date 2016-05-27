var fs      = require('fs');
var path    = require('path');
var wrench  = require('wrench');
var common  = require('./common/common.js');
var errMsg  = common.messages.error;
var Validator    = require('./validator/ADXValidator.js').Validator;
var Builder      = require('./builder/ADXBuilder.js').Builder;
var Show         = require('./show/ADXShow.js').Show;
var Generator    = require('./generator/ADXGenerator.js').Generator;
var Configurator = require('./configurator/ADXConfigurator.js').Configurator;
var InteractiveADXShell = require('./common/InteractiveADXShell.js').InteractiveADXShell;
var preferences = require('./preferences/ADXPreferences.js').preferences;


/**
 * Object used to generate, validate, show and build an ADX
 *
 *
 * Example of usage of existing ADX
 *
 *      var ADX = require('adxutil').ADX;
 *      var myAdx = new ADX('path/to/adx/dir');
 *
 *      // Validate an ADX
 *      myAdx.validate({test : false, autoTest : false}, function (err, report) {
 *          // Callback when the ADX structure has been validated
 *      });
 *
 *      // Show the output of an ADX
 *      myAdx.show({ output : 'fallback', fixture : 'single.xml'  },  function (err, output) {
 *          // Callback with the output of the ADX
 *      });
 *
 *      // Build the ADX (package it)
 *      myAdx.build({test : false, autoTest : false}, function (err, path, report) {
 *          // Callback when the ADX has been built
 *      });
 *
 * Generate and use the new ADX instance
 *
 *      ADX.generate('adc', 'myNewADC', {output : '/path/of/parent/dir', template : 'blank'}, function (err, adc) {
 *          console.log(adc.path);
 *          adc.load(function (err) {
 *              if (err) {
 *                  console.log(err);
 *                  return;
 *              }
 *              console.log(adc.configurator.info.get());
 *          });
 *      });
 *
 *
 * @class ADX
 */
function ADX(adxDirPath) {
    if (!adxDirPath) {
        throw new Error(errMsg.invalidPathArg);
    }

    // Let it throw an exception
    fs.statSync(adxDirPath);

    /**
     * Path to the ADX directory
     * @type {string}
     */
    this.path = path.normalize(adxDirPath);

    /**
     * Configurator of the ADX
     * Expose the object to manipulate the config.xml
     *
     * @type {ADX.Configurator}
     */
    this.configurator = null;

    /**
     * Interactive ADX Shell
     *
     * @type {*|InteractiveADXShell}
     * @private
     */
    this._adxShell = new InteractiveADXShell(this.path);
}

/**
 * Create a new instance of ADX object
 *
 *
 *      var ADX = require('adxutil').ADX;
 *      var myAdx = new ADX('path/to/adx/dir');
 *
 * @constructor
 * @param {String} adxDirPath Path of the ADX directory
 */
ADX.prototype.constructor = ADX;

/**
 * Load the config of the current ADX instance
 *
 *
 *      var ADX = require('adxutil').ADX;
 *      var myAdx = new ADX('path/to/adx/dir');
 *
 *      // Load an ADX
 *      myAdx.load(function (err) {
 *          // Callback when the ADX has been loaded
 *      });
 *
 * @param {Function} [callback] Callback function
 * @param {Error} [callback.err] Error
 */
ADX.prototype.load = function load(callback) {
    var configurator = new Configurator(this.path),
        self        = this;
    callback = callback || function (){};
    configurator.load(function (err) {
        if (err) {
            callback(err);
            return;
        }
        self.configurator = configurator;
        callback(null);
    });
};

/**
 * Validate the current ADX instance
 *
 *
 *      var ADX = require('adxutil').ADX;
 *      var myAdx = new ADX('path/to/adx/dir');
 *
 *      // Validate an ADX
 *      myAdx.validate({test : false, autoTest : false}, function (err, report) {
 *          // Callback when the ADX structure has been validated
 *      });
 *
 * @param {Object} [options] Options of validation
 * @param {String|'default'|'html'} [options.printMode='default'] Print mode (default console or html)
 * @param {Boolean} [options.test=true] Run unit tests
 * @param {Boolean} [options.autoTest=true] Run auto unit tests
 * @param {Boolean} [options.xml=true] Validate the config.xml file
 * @param {Object} [options.logger] Logger
 * @param {Function} [options.writeMessage] Function where regular messages will be print
 * @param {Function} [options.writeSuccess] Function where success messages will be print
 * @param {Function} [options.writeWarning] Function where warning messages will be print
 * @param {Function} [options.writeError] Function where error messages will be print
 * @param {Function} [callback] Callback function
 * @param {Error} [callback.err] Error
 * @param {Object} [callback.report] Validation report
 */
ADX.prototype.validate = function validate(options, callback) {
    var validator = new Validator(this.path);
    options = options || {};
    options.adxShell = this._adxShell;
    validator.validate(options, callback);
};

/**
 * Build the ADX
 *
 *      var ADX = require('adxutil').ADX;
 *      var myAdx = new ADX('path/to/adx/dir');
 *
 *      // Build the ADX (package it)
 *      myAdx.build({test : false, autoTest : false}, function (err, path, report) {
 *          // Callback when the ADX has been built
 *      });
 *
 * @param {Object} [options] Options of validation
 * @param {String|'default'|'html'} [options.printMode='default'] Print mode (default console or html)
 * @param {Boolean} [options.test=true] Run unit tests
 * @param {Boolean} [options.autoTest=true] Run auto unit tests
 * @param {Object} [options.logger] Logger
 * @param {Function} [options.writeMessage] Function where regular messages will be print
 * @param {Function} [options.writeSuccess] Function where success messages will be print
 * @param {Function} [options.writeWarning] Function where warning messages will be print
 * @param {Function} [options.writeError] Function where error messages will be print
 * @param {Function} [callback] Callback function
 * @param {Error} [callback.err] Error
 * @param {String} [callback.outputPath] Path of the output
 * @param {Object} [callback.report] Validation report
 */
ADX.prototype.build = function build(options, callback){
    var builder = new Builder(this.path);
    options = options || {};
    options.adxShell = this._adxShell;
    builder.build(options, callback);
};

/**
 * Show the ADX output
 *
 *      var ADX = require('adxutil').ADX;
 *      var myAdx = new ADX('path/to/adx/dir');
 *
 *      // Show the output of an ADX
 *      myAdx.show({ output : 'fallback', fixture : 'single.xml'  },  function (err, output) {
 *          // Callback with the output of the ADX
 *      });
 *
 * @param {Object} options Options
 * @param {String} options.output Name of the ADX Output to use
 * @param {String} options.fixture FileName of the ADX fixture to use
 * @param {String} [options.masterPage] Path of the master page to use (ADC Only)
 * @param {Boolean} [options.silent=false] Silent mode: Don't message in the console but only through the callback
 * @param {Function} callback Callback function
 * @param {Error} callback.err Error
 * @param {String} callback.output Output string
 */
ADX.prototype.show = function show(options, callback) {
    var show = new Show(this.path);
    options = options || {};
    options.adxShell = this._adxShell;
    show.show(options, callback);
};

/**
 * Returns the list of fixtures
 *
 *      var ADX = require('adxutil').ADX;
 *      var myAdx = new ADX('path/to/adx/dir');
 *
 *      // List all fixtures on the ADX
 *      myAdx.getFixtureList(function (err, list) {
 *          console.log(list[0]); // -> "Single.xml"
 *      });
 *
 * @param {Function} callback Callback
 * @param {Error} callback.err Error
 * @param {String[]} callback.list List of fixtures
 */
ADX.prototype.getFixtureList = function getFixtureList(callback) {
    var fixturePath = path.join(this.path, common.FIXTIRES_DIR_PATH);
    fs.readdir(fixturePath, function (err, files) {
        if (err) {
            callback(err, null);
            return;
        }
        var fixtures = [], i, l;
        for (i = 0, l  = files.length; i < l; i += 1) {
            if (/\.xml$/.test(files[i])) {
                fixtures.push(files[i]);
            }
        }
        callback(null, fixtures);
    });
};

/**
 * Verify if the fixture exist and create it if it doesn't
 * @param {Function} callback Callback when the operation is complete
 * @param {Error} callback.err Error that occured during the operation
 */
ADX.prototype.checkFixtures = function checkFixtures(callback) {
    var self = this;

    function check(loadErr) {
        if (loadErr) {
            if (typeof callback === 'function') {
                callback(loadErr);
            }
            return;
        }
        var projectType = self.configurator.projectType;
        if (projectType !== 'adc' && projectType !== 'adp') {
            if (typeof callback === 'function') {
                callback(new Error(errMsg.incorrectADXType));
            }
            return;
        }

        var fixturePath = path.join(self.path, common.FIXTIRES_DIR_PATH);
        common.dirExists(fixturePath, function (err, isExist) {
            if (isExist) {
                if (typeof callback === 'function') {
                    callback();
                }
                return;
            }
            var testPath =  path.join(fixturePath, '../');
            var sourcePath = path.join(path.resolve(__dirname, "../"), common.TEMPLATES_PATH, projectType, common.DEFAULT_TEMPLATE_NAME, common.FIXTIRES_DIR_PATH);

            fs.mkdir(testPath, function () {
                wrench.copyDirRecursive(sourcePath, fixturePath, {
                    forceDelete       : false,
                    excludeHiddenUnix : true,
                    preserveFiles     : true
                }, function () {
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            });
        });
    }

    // If the adx was not loaded, load it now
    if (!this.configurator) {
        this.load(check);
    } else {
        check(null);
    }
};

/**
 * Generate a new ADX structure
 *
 *      // Generate the ADC structure in '/path/of/parent/dir/myNewADC'
 *      ADX.generate('adc', 'myNewADC', {output : '/path/of/parent/dir', template : 'blank'}, function (err, adc) {
 *          console.log(adc.path);
 *      });
 *
 *      // Generate the ADP structure in '/path/of/parent/dir/myMewADP'
 *      ADX.generate('adp', 'myNewADP', {output : '/path/of/parent/dir', template : 'blank', function (err, adp) {
 *          console.log(adp.path);
 *      });
 *
 * @param {'adc'|'adp'} type Type of the ADX ('adc' or 'adp')
 * @param {String} name Name of the ADX to generate
 * @param {Object} [options] Options
 * @param {String} [options.description=''] Description of the ADX
 * @param {Object} [options.author] Author of the ADX
 * @param {String} [options.author.name=''] Author name
 * @param {String} [options.author.email=''] Author email
 * @param {String} [options.author.company=''] Author Company
 * @param {String} [options.author.website=''] Author web site
 * @param {String} [options.output=process.cwd()] Path of the output director
 * @param {String} [options.template="blank"] Name of the template to use
 * @param {Function} [callback]
 * @param {Error} [callback.err] Error
 * @param {ADX} [callback.adx] Instance of the new generated ADX
 * @static
 */
ADX.generate = function generate(type, name, options, callback) {
    var generator = new Generator();
    // Swap the options
    if (typeof  options === 'function') {
        callback = options;
        options  = null;
    }
    callback = callback || function () {};

    generator.generate(type, name, options, function (err, outputPath) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, new ADX(outputPath));
    });
};

/**
 * Returns the list of templates directory
 *
 * @param {"adc"|"adp"} type Type of the template list to obtain (`adc` or `adp`)
 * @param {Function} callback Callback
 * @param {Error} callback.err Error
 * @param {Object[]} callback.dirs List of template
 * @param {String} callback.dirs[].name Name of the template
 * @param {String} callback.dirs[].path Path of the template directory
 * @static
 */
ADX.getTemplateList = function getTemplateList(type, callback) {
    common.getTemplateList(type, callback);
};

/**
 * Instance of the object to manage the preferences
 *
 * @type {ADX.Preferences}
 */
ADX.preferences = preferences;


// Make it public
exports.ADX = ADX;
exports.Configurator = Configurator;

