var fs          = require('fs');
var format      = require('util').format;
var pathHelper  = require('path');
var common      = require('../common/common.js');
var preferences = require('../preferences/ADXPreferences.js');
var wrench      = require('wrench');
var uuid        = require('node-uuid');
var errMsg      = common.messages.error;
var successMsg  = common.messages.success;


/**
 * Generate the file structure of an ADX using a template
 *
 * @class ADX.Generator
 * @private
 */
function Generator() {
    /**
     * Root dir of the current ADXUtil
     */
    this.rootdir = pathHelper.resolve(__dirname, "../../");

    /**
     * Type of the ADX
     * @type {"adc"|"adp"}
     */
    this.adxType = '';

    /**
     * Name of the ADX
     * @type {string}
     */
    this.adxName = '';

    /**
     * Description of the ADX
     * @type {string}
     */
    this.adxDescription = '';

    /**
     * Author
     * @type {Object}
     */
    this.adxAuthor = {
        name : '',
        email : '',
        company : '',
        website : ''
    };


    /**
     * Path of the template directory
     * @type {string}
     */
    this.templateSrc = '';

    /**
     * Output directory
     * @type {string}
     */
    this.outputDirectory = '';

    /**
     * Name of the template to use
     * @type {string}
     */
    this.template = common.DEFAULT_TEMPLATE_NAME;

    /**
     * Sequence of calls
     * @type {*|Sequence}
     */
    this.sequence = new common.Sequence([
        this.verifyOutputDirExist,
        this.verifyADXDirNotAlreadyExist,
        this.copyFromTemplate,
        this.updateFiles
    ], this.done, this);

}

/**
 * Create a new instance of ADX Generator
 *
 * @constructor
 */
Generator.prototype.constructor = Generator;

/**
 * Write an error output in the console
 * @param {String} text Text to write in the console
 */
Generator.prototype.writeError = function writeError(text) {
    common.writeError.apply(common, arguments);
};

/**
 * Write a warning output in the console
 * @param {String} text Text to write in the console
 */
Generator.prototype.writeWarning = function writeWarning(text) {
    common.writeWarning.apply(common, arguments);
};

/**
 * Write a success output in the console
 * @param {String} text Text to write in the console
 */
Generator.prototype.writeSuccess = function writeSuccess(text) {
    common.writeSuccess.apply(common, arguments);
};

/**
 * Write an arbitrary message in the console without specific prefix
 * @param {String} text Text to write in the console
 */
Generator.prototype.writeMessage = function writeMessage(text) {
    common.writeMessage.apply(common, arguments);
};


/**
 * Generate a new ADX structure
 *
 * @param {"adc"|"adp"} type Type of the ADX project
 * @param {String} name Name of the ADX project to generate
 * @param {Object} [options] Options
 * @param {String} [options.output=process.cwd()] Path of the output director
 * @param {String} [options.description=''] Description of the ADX
 * @param {Object} [options.author] Author of the ADX
 * @param {String} [options.author.name=''] Author name
 * @param {String} [options.author.email=''] Author email
 * @param {String} [options.author.company=''] Author Company
 * @param {String} [options.author.website=''] Author web site
 * @param {String} [options.template="blank"] Name of the template to use
 * @param {Function} [callback]
 * @param {Error} [callback.err] Error
 * @param {String} [callback.outputDirectory] Path of the output directory
 */
Generator.prototype.generate = function generate(type, name, options, callback) {
    // Swap the options & callback
    if (typeof  options === 'function') {
        callback = options;
        options  = null;
    }

    this.generateCallback = callback;

    if (!type) {
        this.done(new Error(errMsg.missingTypeArgument));
        return;
    }
    if (type !== 'adc' && type !== 'adp') {
        this.done(new Error(errMsg.incorrectADXType));
        return;
    }

    if (!name) {
        this.done(new Error(errMsg.missingNameArgument));
        return;
    }

    if (!/^([a-z0-9_ .-]+)$/gi.test(name)) {
        this.done(new Error(errMsg.incorrectADXName));
        return;
    }

    this.outputDirectory = (options && options.output) || process.cwd();
    if (!this.outputDirectory) {
        this.done(new Error(errMsg.missingOutputArgument));
        return;
    }

    var self = this;
    preferences.read({silent : true}, function (prefs) {
        var prefAuthor = (prefs && prefs.author) || {};

        self.adxName = name;
        self.adxType = type;
        self.adxDescription = (options && options.description) || '';
        self.adxAuthor = (options && options.author) || {};
        self.adxAuthor.name = self.adxAuthor.name || prefAuthor.name || '';
        self.adxAuthor.email = self.adxAuthor.email || prefAuthor.email || '';
        self.adxAuthor.company = self.adxAuthor.company || prefAuthor.company || '';
        self.adxAuthor.website = self.adxAuthor.website || prefAuthor.website || '';

        self.template = (options && options.template) || common.DEFAULT_TEMPLATE_NAME;
        self.templateSrc = pathHelper.join(self.rootdir, common.TEMPLATES_PATH, self.template);

        common.getTemplatePath(self.adxType, self.template, function (err, src) {
            if (err) {
                return self.done(err);
            }
            self.templateSrc = src;
            return self.sequence.resume();
        });
    });
};

/**
 * End of the sequence chain
 * @param {Error} err Error
 */
Generator.prototype.done = function done(err) {
    if (err) {
        this.writeError(err.message);
        if (typeof this.generateCallback === 'function') {
            this.generateCallback(err, this.outputDirectory);
        }
        return;
    }
    var self = this;
    common.getDirStructure(self.outputDirectory, function getDirStructure(err, structure) {
        if (err) {
            self.writeError(err.message);
            if (typeof self.generateCallback === 'function') {
                self.generateCallback(err, self.outputDirectory);
            }
            return;
        }
        var level = 0,
            s     = [];

        function indent(text) {
            var str = '|--';
            for (var i = 0; i < level; i++) {
                str += '|--';
            }
            str += ' ' + text;
            return str;
        }

        structure.forEach(function write(o) {
            if (typeof o === 'string') {
                s.push(indent(o));
            } else {
                s.push(indent(o.name) + '\\');
                level++;
                if (o.sub) {
                    o.sub.forEach(write);
                }
                level--;
            }
        });

        s = s.join('\r\n');
        self.writeSuccess(successMsg.adxStructureGenerated, s, self.adxName, self.outputDirectory);

        if (typeof self.generateCallback === 'function') {
            self.generateCallback(err, self.outputDirectory);
        }
    });
};


/**
 * Verify that the output directory
 */
Generator.prototype.verifyOutputDirExist = function verifyOutputDirExist() {
    // Validate the existence of the specify the output directory
    var self = this;
    common.dirExists(self.outputDirectory, function outputDirExist(err, exists) {
        if (!exists || err) {
            return self.sequence.resume(new Error(format(errMsg.noSuchFileOrDirectory, self.outputDirectory)));
        }
        self.outputDirectory = pathHelper.join(self.outputDirectory, self.adxName);
        return self.sequence.resume();
    });
};

/**
 * Verify that the ADX directory doesn't exist
 */
Generator.prototype.verifyADXDirNotAlreadyExist = function verifyADXDirNotAlreadyExist() {
    var self = this;
    common.dirExists(self.outputDirectory, function adxDirExist(err, exists) {
        if (exists && !err) {
            return self.sequence.resume(new Error(format(errMsg.directoryAlreadyExist, self.outputDirectory)));
        }
        return self.sequence.resume();
    });
};

/**
 * Copy an ADC structure from the template
 */
Generator.prototype.copyFromTemplate =  function copyFromTemplate() {
    var self = this;
    wrench.copyDirRecursive(self.templateSrc, self.outputDirectory, {
        forceDelete       : false,
        excludeHiddenUnix : true,
        preserveFiles     : true
    }, function copyDirRecursive(err) {
        self.sequence.resume(err);
    });
};

/**
 * Update the config.xml and the readme files with the name of the ADC, the GUID and the creation date
 */
Generator.prototype.updateFiles = function updateFiles() {
    var self  = this,
        files  = [
            pathHelper.join(self.outputDirectory, common.CONFIG_FILE_NAME),
            pathHelper.join(self.outputDirectory, common.README_FILE_NAME)
        ], treat = 0;
    files.forEach(function (file) {
        fs.readFile(file, 'utf8', function readFile(err, data) {
            if (err) {
                treat++;
                self.sequence.resume(err);
                return;
            }

            var result = common.evalTemplate(data, {
                info : {
                    name : self.adxName ,
                    type :	 self.adxType, 
                    description : self.adxDescription,
                    author : self.adxAuthor.name,
                    email : self.adxAuthor.email,
                    company : self.adxAuthor.company,
                    site : self.adxAuthor.website
                }
            });

            fs.writeFile(file, result, function writeFileCallback(err) {
                treat++;
                if (treat === files.length) {
                    return self.sequence.resume(err);
                }
            });
        });
    });
};

// Make it public
exports.Generator = Generator;

/*
 * Generate a new ADC structure
 *
 * @param {Command} program Commander object which hold the arguments pass to the program
 * @param {"adc"|"adp"} type Type of the ADX project
 * @param {String} name Name of the ADC to generate
 */
exports.generate = function generate(program, type, name) {
    var generator = new Generator();
    generator.generate(type, name, program);
};