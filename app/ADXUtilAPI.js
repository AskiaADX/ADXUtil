var fs      = require('fs');
var path    = require('path');
var wrench  = require('wrench');
var common  = require('./common/common.js');
var errMsg  = common.messages.error;
var Validator    = require('./validator/ADCValidator.js').Validator;
var Builder      = require('./builder/ADCBuilder.js').Builder;
var Show         = require('./show/ADCShow.js').Show;
var Generator    = require('./generator/ADCGenerator.js').Generator;
var Configurator = require('./configurator/ADCConfigurator.js').Configurator;
var InteractiveADXShell = require('./common/InteractiveADXShell.js').InteractiveADXShell;
var preferences = require('./preferences/ADCPreferences.js').preferences;


/**
 * Object used to generate, validate, show and build an ADC
 *
 *
 * Example of usage of existing ADC
 *
 *      var ADC = require('adcutil').ADC;
 *      var myAdc = new ADC('path/to/adc/dir');
 *
 *      // Validate an ADC
 *      myAdc.validate({test : false, autoTest : false}, function (err, report) {
 *          // Callback when the ADC structure has been validated
 *      });
 *
 *      // Show the output of an ADC
 *      myAdc.show({ output : 'fallback', fixture : 'single.xml'  },  function (err, output) {
 *          // Callback with the output of the ADC
 *      });
 *
 *      // Build the ADC (package it)
 *      myAdc.build({test : false, autoTest : false}, function (err, path, report) {
 *          // Callback when the ADC has been built
 *      });
 *
 * Generate and use the new ADC instance
 *
 *      ADC.generate('myNewADC', {output : '/path/of/parent/dir', template : 'blank'}, function (err, adc) {
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
 * @class ADC
 */
function ADC(adcDirPath) {
    if (!adcDirPath) {
        throw new Error(errMsg.invalidPathArg);
    }

    // Let it throw an exception
    fs.statSync(adcDirPath);

    /**
     * Path to the ADC directory
     * @type {string}
     */
    this.path = path.normalize(adcDirPath);

    /**
     * Configurator of the ADC
     * Expose the object to manipulate the config.xml
     *
     * @type {ADC.Configurator}
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
 * Create a new instance of ADC object
 *
 *
 *      var ADC = require('adcutil').ADC;
 *      var myAdc = new ADC('path/to/adc/dir');
 *
 * @constructor
 * @param {String} adcDirPath Path of the ADC directory
 */
ADC.prototype.constructor = ADC;

/**
 * Load the config of the current ADC instance
 *
 *
 *      var ADC = require('adcutil').ADC;
 *      var myAdc = new ADC('path/to/adc/dir');
 *
 *      // Load an ADC
 *      myAdc.load(function (err) {
 *          // Callback when the ADC has been loaded
 *      });
 *
 * @param {Function} [callback] Callback function
 * @param {Error} [callback.err] Error
 */
ADC.prototype.load = function load(callback) {
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
 * Validate the current ADC instance
 *
 *
 *      var ADC = require('adcutil').ADC;
 *      var myAdc = new ADC('path/to/adc/dir');
 *
 *      // Validate an ADC
 *      myAdc.validate({test : false, autoTest : false}, function (err, report) {
 *          // Callback when the ADC structure has been validated
 *      });
 *
 * @param {Object} [options] Options of validation
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
ADC.prototype.validate = function validate(options, callback) {
    var validator = new Validator(this.path);
    options = options || {};
    options.adxShell = this._adxShell;
    validator.validate(options, callback);
};

/**
 * Build the ADC
 *
 *      var ADC = require('adcutil').ADC;
 *      var myAdc = new ADC('path/to/adc/dir');
 *
 *      // Build the ADC (package it)
 *      myAdc.build({test : false, autoTest : false}, function (err, path, report) {
 *          // Callback when the ADC has been built
 *      });
 *
 * @param {Object} [options] Options of validation
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
 * @param {String} [callback.outputPath] Path of the output
 * @param {Object} [callback.report] Validation report
 */
ADC.prototype.build = function build(options, callback){
    var builder = new Builder(this.path);
    options = options || {};
    options.adxShell = this._adxShell;
    builder.build(options, callback);
};

/**
 * Show the ADC output
 *
 *      var ADC = require('adcutil').ADC;
 *      var myAdc = new ADC('path/to/adc/dir');
 *
 *      // Show the output of an ADC
 *      myAdc.show({ output : 'fallback', fixture : 'single.xml'  },  function (err, output) {
 *          // Callback with the output of the ADC
 *      });
 *
 * @param {Object} options Options
 * @param {String} options.output Name of the ADC Output to use
 * @param {String} options.fixture FileName of the ADC fixture to use
 * @param {String} [options.masterPage] Path of the master page to use
 * @param {Boolean} [options.silent=false] Silent mode: Don't message in the console but only through the callback
 * @param {Function} callback Callback function
 * @param {Error} callback.err Error
 * @param {String} callback.output Output string
 */
ADC.prototype.show = function show(options, callback) {
    var show = new Show(this.path);
    options = options || {};
    options.adxShell = this._adxShell;
    show.show(options, callback);
};

/**
 * Returns the list of fixtures
 *
 *      var ADC = require('adcutil').ADC;
 *      var myAdc = new ADC('path/to/adc/dir');
 *
 *      // List all fixtures on the ADC
 *      myAdc.getFixtureList(function (err, list) {
 *          console.log(list[0]); // -> "Single.xml"
 *      });
 *
 * @param {Function} callback Callback
 * @param {Error} callback.err Error
 * @param {String[]} callback.list List of fixtures
 */
ADC.prototype.getFixtureList = function getFixtureList(callback) {
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
 */
ADC.prototype.checkFixtures = function checkFixtures(callback) {
    var fixturePath = path.join(this.path, common.FIXTIRES_DIR_PATH);
    var self = this;
    common.dirExists(fixturePath, function (err, isExist) {
        if (isExist) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }
        var testPath =  path.join(fixturePath, '../');
        var sourcePath = path.join(path.resolve(__dirname, "../"), common.TEMPLATES_PATH, common.DEFAULT_TEMPLATE_NAME, common.FIXTIRES_DIR_PATH);

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
};

/**
 * Generate a new ADC structure
 *
 *      // Generate the ADC structure in '/path/of/parent/dir/myNewADC'
 *      ADC.generate('myNewADC', {output : '/path/of/parent/dir', template : 'blank'}, function (err, adc) {
 *          console.log(adc.path);
 *      });
 *
 * @param {String} name Name of the ADC to generate
 * @param {Object} [options] Options
 * @param {String} [options.description=''] Description of the ADC
 * @param {Object} [options.author] Author of the ADC
 * @param {String} [options.author.name=''] Author name
 * @param {String} [options.author.email=''] Author email
 * @param {String} [options.author.company=''] Author Company
 * @param {String} [options.author.website=''] Author web site
 * @param {String} [options.output=process.cwd()] Path of the output director
 * @param {String} [options.template="blank"] Name of the template to use
 * @param {Function} [callback]
 * @param {Error} [callback.err] Error
 * @param {ADC} [callback.adc] Instance of the new generated ADC
 * @static
 */
ADC.generate = function generate(name, options, callback) {
    var generator = new Generator();
    // Swap the options
    if (typeof  options === 'function') {
        callback = options;
        options  = null;
    }
    callback = callback || function () {};

    generator.generate(name, options, function (err, outputPath) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, new ADC(outputPath));
    });
};

/**
 * Returns the list of templates directory
 *
 * @param {Function} callback Callback
 * @param {Error} callback.err Error
 * @param {Object[]} callback.dirs List of template
 * @param {String} callback.dirs[].name Name of the template
 * @param {String} callback.dirs[].path Path of the template directory
 * @static
 */
ADC.getTemplateList = function getTemplateList(callback) {
    common.getTemplateList(callback);
};

/**
 * Instance of the object to manage the preferences
 *
 * @type {ADC.Preferences}
 */
ADC.preferences = preferences;


// Make it public
exports.ADC = ADC;
exports.Configurator = Configurator;

