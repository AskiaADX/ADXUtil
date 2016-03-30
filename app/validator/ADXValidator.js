/*

ASP Classic
 asp

ASP.NET
 aspx
 axd
 asx
 asmx
 ashx
 axd
 ascx

CSS
 css
 hss
 sass
 less
 ccss
 pcss

Coldfusion
 cfm

Erlang
 yaws

Flash
 swf

HTML
 html
 htm
 xhtml
 jhtml

Java
 jsp
 jspx
 wss
 do
 action

JavaScript
 js

Perl
 pl

PHP
 php
 php4
 php3
 phtml

Python
 py

Ruby
 rb
 rhtml
 rjs
 erb

XML
 xml
 rss
 atom
 svg

Other (C, perl etc.)
 cgi
 dll

Executable
 Extension	Format	                                    Operating System(s)
 ACTION	    Automator Action	                        Mac OS
 APK	    Application	                                Android
 APP	    Executable	                                Mac OS
 BAT	    Batch File	                                Windows
 BIN	    Binary Executable	                        Windows, Mac OS, Linux
 CMD	    Command Script	                            Windows
 COM	    Command File	                            Windows
 COMMAND	Terminal Command	                        Mac OS
 CPL	    Control Panel Extension	                    Windows
 CSH	    C Shell Script	                            Mac OS, Linux
 EXE	    Executable	                                Windows
 GADGET	    Windows Gadget	                            Windows
 INF1	    Setup Information File	                    Windows
 INS	    Internet Communication Settings	            Windows
 INX	    InstallShield Compiled Script	            Windows
 IPA	    Application	                                iOS
 ISU	    InstallShield Uninstaller Script	        Windows
 JOB	    Windows Task Scheduler Job File	            Windows
 JSE	    JScript Encoded File	                    Windows
 KSH	    Unix Korn Shell Script	                    Linux
 LNK	    File Shortcut	                            Windows
 MSC	    Microsoft Common Console Document	        Windows
 MSI	    Windows Installer Package	                Windows
 MSP	    Windows Installer Patch	                    Windows
 MST	    Windows Installer Setup Transform File	    Windows
 OSX	    Executable	                                Mac OS
 OUT	    Executable	                                Linux
 PAF	    Portable Application Installer File	        Windows
 PIF	    Program Information File	                Windows
 PRG	    Executable	                                GEM
 PS1	    Windows PowerShell Cmdlet	                Windows
 REG	    Registry Data File	                        Windows
 RGS	    Registry Script	                            Windows
 RUN	    Executable	                                Linux
 SCT	    Windows Scriptlet	                        Windows
 SHB	    Windows Document Shortcut	                Windows
 SHS	    Shell Scrap Object	                        Windows
 U3P	    U3 Smart Application	                    Windows
 VB	        VBScript File	                            Windows
 VBE	    VBScript Encoded Script	                    Windows
 VBS	    VBScript File	                            Windows
 VBSCRIPT	Visual Basic Script	                        Windows
 WORKFLOW	Automator Workflow	                        Mac OS
 WS	        Windows Script	                            Windows
 WSF	    Windows Script                              Windows


 Audio File Types and Formats
 .aif	Audio Interchange File Format
 .iff	Interchange File Format
 .m3u	Media Playlist File
 .m4a	MPEG-4 Audio File
 .mid	MIDI File
 .mp3	MP3 Audio File
 .mpa	MPEG-2 Audio File
 .ra	Real Audio File
 .wav	WAVE Audio File
 .wma	Windows Media Audio File
  AddType audio/ogg ogg
 AddType audio/ogg oga
 AddType audio/webm webma



 Video Files Types and Formats
 .3g2	3GPP2 Multimedia File
 .3gp	3GPP Multimedia File
 .asf	Advanced Systems Format File
 .asx	Microsoft ASF Redirector File
 .avi	Audio Video Interleave File
 .flv	Flash Video File
 .mov	Apple QuickTime Movie
 .mp4	MPEG-4 Video File
 .mpg	MPEG Video File
 .rm	Real Media File
 .swf	Shockwave Flash Movie
 .vob	DVD Video Object File
 .wmv	Windows Media Video File

Markdown
 md



white
xml|rss|atom|svg|js|xhtml|htm|html|swf|css|hss|sass|less|ccss|pcss|txt|csv|json|
gif|jpeg|jpg|tif|tiff|png|bmp|pdf|ico|cur|
aif|iff|m4a|mid|mp3|mpa|ra|wav|wma|ogg|oga|webma|
3g2|3gp|avi|flv|mov|mp4|mpg|rm|wmv|webm
md|


black
cgi|dll|erb|rjs|rhtml|rb|py|phtml|php3|php4|php|pl|action|do|wss|jspx|jsp|jhtml|yaws|cfm|aspx|axd|asx|asmx|ashx|axd|ascx|asp|config|
action|apk|app|bat|bin|cmd|com|command|cpl|csh|exe|gadget|inf1|ins|inx|ipa|isu|
job|jse|ksh|lnk|msc|msi|msp|mst|ocx|osx|out|paf|pif|prg|ps1|reg|rgs|run|sct|shb|shs|u3p|
vb|vbe|vbs|vbscript|workflow|ws|wsf|cs|cpp|
zip|rar|sql|ini|dmg|iso|vcd|class|java|htaccess


*/


var fs           = require('fs');
var pathHelper   = require('path');
var xml2js       = require('xml2js');
var util         = require('util');
var common       = require('../common/common.js');
var Configurator = require('../configurator/ADXConfigurator.js').Configurator;
var errMsg       = common.messages.error;
var warnMsg      = common.messages.warning;
var successMsg   = common.messages.success;
var msg          = common.messages.message;
//  Test the file extension
var fileExt      = {
    blacklist : /\.(cgi|dll|erb|rjs|rhtml|rb|py|phtml|php3|php4|php|pl|action|do|wss|jspx|jsp|jhtml|yaws|cfm|aspx|axd|asx|asmx|ashx|axd|ascx|asp|config|action|apk|app|bat|bin|cmd|com|command|cpl|csh|exe|gadget|inf1|ins|inx|ipa|isu|job|jse|ksh|lnk|msc|msi|msp|mst|ocx|osx|out|paf|pif|prg|ps1|reg|rgs|run|sct|shb|shs|u3p|vb|vbe|vbs|vbscript|workflow|ws|wsf|cs|cpp|zip|rar|sql|ini|dmg|iso|vcd|class|java|htaccess)$/gi,
    whitelist : /\.(xml|rss|atom|svg|js|xhtml|htm|html|swf|css|hss|sass|less|ccss|pcss|txt|csv|json|gif|jpeg|jpg|tif|tiff|png|bmp|pdf|ico|cur|aif|iff|m4a|mid|mp3|mpa|ra|wav|wma|ogg|oga|webma|3g2|3gp|avi|flv|mov|mp4|mpg|rm|wmv|ogv|webm|md)$/gi
};
// Hash with all content type
var contentType  = {
    'text'      : 'text',
    'html'      : 'text',
    'javascript': 'text',
    'css'       : 'text',
    'binary'    : 'binary',
    'image'     : 'binary',
    'video'     : 'binary',
    'audio'     : 'binary',
    'flash'     : 'binary'
};

/*
 * Hash with the rule of the <attribute> node in the <content>
 * Indicates if the attribute is overridable or not
 * true for not-overridable
 */
var contentSealAttr = {
    'javascript' : {
        'src'  : true,
        'type' : false
    },
    'css'       : {
        'href' : true,
        'rel'  : false
    },
    'image'     : {
        'src'   : true,
        'alt'   : false
    },
    'video'     : {
        'src'   : true
    },
    'audio'     : {
        'src'   : true
    }
};

// Hash with the rule of the constraint attribute node.
var constraintAttributeRules = {
    questions : ['chapter', 'single', 'multiple', 'open', 'numeric', 'date', 'requireParentLoop'],
    responses : ['min', 'max'],
    controls  : ['label', 'textbox', 'checkbox', 'listbox', 'radiobutton', 'responseblock']
};

/*
 * Build a new error message
 * @param {String} message Error message
 * @return {Error} New error
 */
function newError(message) {
    return new Error(util.format.apply(null, arguments));
}

/**
 * Validate the ADX files structure, configuration and logical
 *
 * @class ADX.Validator
 * @private
 */
function Validator(adxDirPath) {
    /**
     * Root dir of the current ADXUtil
     */
    this.rootdir    = pathHelper.resolve(__dirname, "../../");

    /**
     * Name of the ADX
     * @type {string}
     */
    this.adxName    = '';

    /**
     * Path to the ADX directory
     * @type {string}
     */
    this.adxDirectoryPath = adxDirPath ? pathHelper.normalize(adxDirPath) : process.cwd();

    /**
     * Validators
     *
     * @type {{current: number, sequence: string[]}}
     */
    this.validators =  {
        current  : -1,
        sequence : [
            'validatePathArg',
            'validateADXDirectoryStructure',
            'validateFileExtensions',
            'initConfigXMLDoc',
            'validateXMLAgainstXSD',
            'validateADXInfo',
            'validateADXInfoConstraints',
            'validateADXOutputs',
            'validateADXProperties',
            'runAutoTests',
            'runADXUnitTests'
        ]
    };

    /**
     * Report of the validation
     *
     * @type {{startTime: null, endTime: null, runs: number, total: number, success: number, warnings: number, errors: number}}
     */
    this.report     = {
        startTime : null,
        endTime   : null,
        runs      : 0,
        total     : 0,
        success   : 0,
        warnings  : 0,
        errors    : 0
    };

    /**
     * Map all files in the resources directory
     *
     * @type {{isExist: boolean, dynamic: {isExist: boolean}, statics: {isExist: boolean}, share: {isExist: boolean}}}
     */
    this.dirResources  = {
        isExist  : false,
        dynamic  : {
            isExist : false
        },
        statics  : {
            isExist : false
        },
        share   : {
            isExist : false
        }
    };

    /**
     * Instance of configurator
     * @type {ADX.Configurator}
     */
    this.adxConfigurator = null;

    /**
     * Logger to override with an object
     * @type {{writeMessage : function, writeSuccess : function, writeWarning: function, writeError : function}}
     */
    this.logger = null;
}

/**
 * Create a new instance of ADX validator
 *
 * @constructor
 * @param {String} adxDirPath Path of the ADX directory
 */
Validator.prototype.constructor = Validator;

/**
 * Validate the current ADX instance
 *
 * @param {Object} [options] Options of validation
 * @param {Boolean} [options.test=true] Run unit tests
 * @param {Boolean} [options.autoTest=true] Run auto unit tests
 * @param {Boolean} [options.xml=true] Validate the config.xml file
 * @param {InteractiveADXShell} [options.adxShell] Interactive ADXShell process
 * @param {Object} [options.logger] Logger
 * @param {Function} [options.writeMessage] Function where regular messages will be print
 * @param {Function} [options.writeSuccess] Function where success messages will be print
 * @param {Function} [options.writeWarning] Function where warning messages will be print
 * @param {Function} [options.writeError] Function where error messages will be print
 * @param {Function} [callback] Callback function
 * @param {Error} [callback.err] Error
 * @param {Object} [callback.report] Validation report
 */
Validator.prototype.validate = function validate(options, callback) {

    // Start timer
    this.report.startTime  = new Date().getTime();

    // Swap optional options arguments
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }
    if (!options) {
        options = {
            test     : true,
            autoTest : true,
            xml      : true
        }
    }

    // Register the end callback for future usage
    this.validationCallback = callback;


    this._adxShell = (options && options.adxShell) || null;

    // Validate according to the options
    if (options) {

        // Set the logger
        if (options.logger) {
            this.logger = options.logger;
        }

        // --no-autoTest
        if (options.autoTest === false) { // Check bool value not falsy
            this.removeOnSequence(['runAutoTests']);
        }

        // --no-test
        if (options.test === false) { // Check bool value not falsy
            this.removeOnSequence(['runADXUnitTests']);
        }

        // --no-xml
        if (options.xml === false) { // Check bool value not falsy
            this.removeOnSequence([
                'initConfigXMLDoc',
                'validateXMLAgainstXSD',
                'validateADXInfo',
                'validateADXInfoConstraints',
                'validateADXOutputs',
                'validateADXProperties'
            ]);
        }

    }

    this.report.total = this.validators.sequence.length;
    this.resume(null);
};

/**
 * Remove the specified validators on the validators sequence
 *
 * @param {Array} validators Validators to remove
 */
Validator.prototype.removeOnSequence = function removeOnSequence(validators) {
    var sequence = this.validators.sequence,
        index;

    validators.forEach(function (value) {
        index = sequence.indexOf(value);
        if (index !== -1) {
            sequence.splice(index, 1);
        }
    });
};

/**
 * Summarize the validation
 *
 * @param {Error} [err] Last error
 */
Validator.prototype.done  = function done(err) {
    this.report.endTime = new Date().getTime();
    var executionTime = this.report.endTime - this.report.startTime,
        report        = this.report,
        message;

    if (err) {
        this.writeError(err.message);
    }

    // Write the summary
    this.writeMessage(msg.validationFinishedIn, executionTime);
    message = util.format(msg.validationReport,
        report.runs,
        report.total,
        report.success,
        report.warnings,
        report.errors,
        report.total - report.runs);

    if (report.errors) {
        this.writeError(message);
    } else if (report.warnings) {
        this.writeWarning(message);
    } else {
        this.writeSuccess(message);
    }

    if (typeof this.validationCallback === 'function') {
        this.validationCallback(err, this.report);
    }
};

/**
 * Execute the next validation
 *
 * @param {Error|void} err Error which occurred during the previous validation
 */
Validator.prototype.resume = function resume(err) {
    if (err) {
        // Mark the error
        this.report.errors++;
        this.done(err);
        return;
    }

    var validators = this.validators;


    // Mark the success
    if (validators.current !== -1 && this[validators.sequence[validators.current]])  {
        this.report.success++;
    }

    validators.current++;
    if (validators.current >= validators.sequence.length) {
        this.done(err);
        return;
    }

    // Search the next validators (recursive call)
    var validatorName = validators.sequence[validators.current];
    if (!this[validatorName]) {
        this.resume(null);
        return;
    }

    // Execute the find validator
    // Mark the runs
    this.report.runs++;
    this[validatorName]();
};

/**
 * Write an error output in the console or in the logger
 * @param {String} text Text to write in the console
 */
Validator.prototype.writeError = function writeError(text) {
    if (this.logger && typeof this.logger.writeError === 'function') {
        this.logger.writeError.apply(this.logger, arguments);
    } else {
        common.writeError.apply(common, arguments);
    }
};

/**
 * Write a warning output in the console or in the logger
 * @param {String} text Text to write in the console
 */
Validator.prototype.writeWarning = function writeWarning(text) {
    if (this.logger && typeof this.logger.writeWarning === 'function') {
        this.logger.writeWarning.apply(this.logger, arguments);
    } else {
        common.writeWarning.apply(common, arguments);
    }
};

/**
 * Write a success output in the console or in the logger
 * @param {String} text Text to write in the console
 */
Validator.prototype.writeSuccess = function writeSuccess(text) {
    if (this.logger && typeof this.logger.writeSuccess === 'function') {
        this.logger.writeSuccess.apply(this.logger, arguments);
    } else {
        common.writeSuccess.apply(common, arguments);
    }
};

/**
 * Write an arbitrary message in the console  or in the logger without specific prefix or in the logger
 * @param {String} text Text to write in the console
 */
Validator.prototype.writeMessage = function writeMessage(text) {
    if (this.logger && typeof this.logger.writeMessage === 'function') {
        this.logger.writeMessage.apply(this.logger, arguments);
    } else {
        common.writeMessage.apply(common, arguments);
    }
};


/**
* Validate that the `path` argument is correct
*/
Validator.prototype.validatePathArg = function validatePathArg() {
    if (!this.adxDirectoryPath) {
        this.resume(newError(errMsg.missingArgPath));
        return;
    }

    // Validate the existence of the specify ADX directory
    var self = this;
    common.dirExists(self.adxDirectoryPath, function verifyADXDirectory(err, exists) {
        var er;
        if (!exists) {
            er = newError(errMsg.noSuchFileOrDirectory, pathHelper.normalize(self.adxDirectoryPath));
        } else {
            self.writeSuccess(successMsg.pathValidate);
        }
        self.resume(er);
    });
};


/**
 * Validate the structure of the ADX directory
 */
Validator.prototype.validateADXDirectoryStructure = function validateADXDirectoryStructure() {
    // Verify if the config.xml exists
    var self = this;
    fs.exists(pathHelper.join(self.adxDirectoryPath, common.CONFIG_FILE_NAME), function verifyConfigFileExist(exists) {
        var resourcesPath = pathHelper.join(self.adxDirectoryPath, common.RESOURCES_DIR_NAME),
            dirResources  = self.dirResources;

        // Check  the resources directory
        function loadResources() {
            common.dirExists(resourcesPath, function initResourcesFileMap(er, find) {
                if (!find) {
                    self.resume(null);
                    return;
                }
                dirResources.isExist = true;
                loadDynamic();
            });
        }

        // Check the dynamic directory
        function loadDynamic() {
            common.dirExists(pathHelper.join(resourcesPath, common.DYNAMIC_DIR_NAME), function initDynamicFileMap(er, find) {
                var dirDynamic = dirResources.dynamic;
                dirDynamic.isExist = find;
                if (find) {
                    try {
                        var files = fs.readdirSync(pathHelper.join(resourcesPath, common.DYNAMIC_DIR_NAME));
                        files.forEach(function (file) {
                            if (common.isIgnoreFile(file)) {
                                return;
                            }
                            dirDynamic[file.toLocaleLowerCase()] = file;
                        })
                    } catch (ex) {
                        // Do nothing
                    }
                }
                loadStatic();
            });
        }

        // Check the static directory
        function loadStatic(){
            common.dirExists(pathHelper.join(resourcesPath, common.STATIC_DIR_NAME), function initStaticFileMap(er, find) {
                var dirStatic = dirResources.statics;
                dirStatic.isExist = find;
                if (find) {
                    try {
                        var files = fs.readdirSync(pathHelper.join(resourcesPath, common.STATIC_DIR_NAME));
                        files.forEach(function (file) {
                            if (common.isIgnoreFile(file)) {
                                return;
                            }
                            dirStatic[file.toLocaleLowerCase()] = file;
                        })
                    } catch (ex) {
                        // Do nothing
                    }
                }

                loadShare();
            });
        }

        // Check the share directory and resume the validation
        function loadShare() {
            common.dirExists(pathHelper.join(resourcesPath, common.SHARE_DIR_NAME), function initShareFileMap(er, find) {
                var dirShare = dirResources.share;
                dirShare.isExist = find;
                if (find) {
                    try {
                        var files = fs.readdirSync(pathHelper.join(resourcesPath, common.SHARE_DIR_NAME));
                        files.forEach(function (file) {
                            if (common.isIgnoreFile(file)) {
                                return;
                            }
                            dirShare[file.toLocaleLowerCase()] = file;
                        })
                    } catch (ex) {
                        // Do nothing
                    }
                }

                self.resume(null);
            });
        }


        if (!exists) {
            self.resume(newError(errMsg.noConfigFile));
        } else {
            self.writeSuccess(successMsg.directoryStructureValidate);
            loadResources();
        }
    });
};


/**
 * Validate all file extension against the white list and the black list
 */
Validator.prototype.validateFileExtensions = function validateFileExtensions() {
    var dirResources = this.dirResources,
        dir   = [dirResources.dynamic, dirResources.statics, dirResources.share],
        current, i, l, key, match;

    if (!dirResources.isExist) {
        this.resume(null);
    }

    for (i = 0, l = dir.length; i < l; i++) {
        current = dir[i];
        if (current.isExist) {
            for (key in current) {
                if (current.hasOwnProperty(key) && key !== 'isExist') {
                    // Test against the black list
                    match = key.toString().match(fileExt.blacklist);
                    if (match) {
                        this.resume(newError(errMsg.fileExtensionForbidden, match[0]));
                        return;
                    }

                    // Test against the white list
                    match = key.toString().match(fileExt.whitelist);
                    if (!match) {
                        this.report.warnings++;
                        this.writeWarning(warnMsg.untrustExtension, key);
                    }
                }
            }
        }
    }

    this.writeSuccess(successMsg.fileExtensionValidate);
    this.resume(null);
};


/**
 * Validate the config.xml file of the ADX against the XSD schema
 */
Validator.prototype.validateXMLAgainstXSD = function validateXMLAgainstXSD() {
    var projectType     = this.adxConfigurator.projectType,
        schemaName      = projectType === 'adp' ? common.SCHEMA_ADP : common.SCHEMA_ADC,
        projectVersion  = this.adxConfigurator.projectVersion,
        exec            = require('child_process').exec,
        xmlLintPath     = pathHelper.join(this.rootdir, common.XML_LINT_PATH),
        xmlSchemaPath   = pathHelper.join(this.rootdir, common.SCHEMA_PATH, projectVersion, schemaName),
        xmlPath         = pathHelper.join(this.adxDirectoryPath, common.CONFIG_FILE_NAME),

        self = this,

        commandLine = '"' + xmlLintPath + '" --noout --schema "' + xmlSchemaPath + '" "' + xmlPath + '"';

    exec(commandLine, function callback(err) {
        if (!err) {
            self.writeSuccess(successMsg.xsdValidate);
        }
        self.resume(err);
    });
};


/**
 * Initialize the XMLDoc using the config.xml
 */
Validator.prototype.initConfigXMLDoc = function initConfigXMLDoc() {
    var self = this;

    self.adxConfigurator = new Configurator(self.adxDirectoryPath);
    self.adxConfigurator.load(function (err) {
        if (err) {
            self.resume(err);
            return;
        }
        if (self.adxConfigurator.projectType === 'adp') {
            self.removeOnSequence(['validateADXInfoConstraints']);
            self.report.total = self.validators.sequence.length;
        }
        self.writeSuccess(successMsg.xmlInitialize);
        self.resume(null);

    });
};

/**
 * Validate the info of the ADX config file
 */
Validator.prototype.validateADXInfo = function validateADXInfo() {
    var xmldoc = this.adxConfigurator.xmldoc;
    var elInfo = xmldoc.find("info");
    var elName = elInfo && elInfo.find("name");

    if (!elInfo) {
        this.resume(newError(errMsg.missingInfoNode));
        return;
    }

    if (!elName || !elName.text) {
        this.resume(newError(errMsg.missingOrEmptyNameNode));
        return;
    }

    // The `style` and `categories` tags is mark as deprecated since the version 2.1.0
    if (this.adxConfigurator.projectVersion !== "2.0.0") {
        var elStyle = elInfo && elInfo.find("style");
        if (elStyle) {
            this.report.warnings++;
            this.writeWarning(warnMsg.deprecatedInfoStyleTag);
        }

        var elCategories = elInfo && elInfo.find("categories");
        if (elCategories) {
            this.report.warnings++;
            this.writeWarning(warnMsg.deprecatedInfoCategoriesTag);
        }
    }

    this.adxName = elName.text;
    this.writeSuccess(successMsg.xmlInfoValidate);
    this.resume(null);
};


/**
 * Validate the info/constraints of the ADX config file
 */
Validator.prototype.validateADXInfoConstraints = function validateADXInfoConstraints() {
    var xmldoc = this.adxConfigurator.xmldoc;
    var elInfo = xmldoc.find("info");
    var elConstraints = elInfo && elInfo.find("constraints");
    var constraintsOn  = {
        questions : 0,
        responses : 0,
        controls  : 0
    };
    var self = this;
    var exitIter = false;

    elConstraints.iter('constraint', function (constraint) {
        if (exitIter) {
            return;
        }
        var hasRule = false;
        var attrOn  = constraint.get("on");
        if (!attrOn) {
            return;
        }

        // Validate the duplicate constraints
        constraintsOn[attrOn]++;
        if (constraintsOn[attrOn] > 1) {
            self.resume(newError(errMsg.duplicateConstraints, attrOn));
            exitIter = true;
            return;
        }


        // Validate the attribute logic
        var attr = constraint.attrib;
        for (var key in attr) {
            if (attr.hasOwnProperty(key) && key !== 'on') {
                if (constraintAttributeRules[attrOn].indexOf(key) === -1) {
                    self.resume(newError(errMsg.invalidConstraintAttribute, attrOn, key));
                    exitIter = true;
                    return;
                }
                if (key !== 'min' && key !== 'max') {
                    if (attr[key] == '1' || attr[key] == 'true') {
                        hasRule = true;
                    }
                } else {
                    hasRule = true;
                }
            }
        }

        // No rule specified
        if (!hasRule) {
            self.resume(newError(errMsg.noRuleOnConstraint, attrOn));
            exitIter = true;
        }
    });

    if (exitIter) {
        return;
    }

    if (!constraintsOn.questions) {
        this.resume(newError(errMsg.requireConstraintOn, 'questions'));
        return;
    }

    if (!constraintsOn.controls) {
        this.resume(newError(errMsg.requireConstraintOn, 'controls'));
        return;
    }

    this.writeSuccess(successMsg.xmlInfoConstraintsValidate);
    this.resume(null);
};


/**
 * Validate the outputs of the ADX config file
 */
Validator.prototype.validateADXOutputs = function validateADXOutputs() {
    var xmldoc = this.adxConfigurator.xmldoc;
    var elOutputs = xmldoc.find("outputs");
    var exitIter = false;
    var conditions              = {};
    var outputsEmptyCondition   = [];
    var htmlFallBackCount       = 0;
    var self = this;
    var err;
    var projectType    = this.adxConfigurator.projectType;
    var projectVersion = this.adxConfigurator.projectVersion;
    var dirResources   = this.dirResources;

    elOutputs.iter("output", function (output) {
        if (exitIter) {
            return;
        }
        var id          = output.get("id");
        var elCondition = output.find("condition");
        var condition   = elCondition && elCondition.text;
        var defaultGeneration = output.get("defaultGeneration") || false;

        // Require a `masterPage` attribute that represent an existing dynamic file for ADP
        if (projectType === 'adp') {
            var masterPage = output.get('masterPage');

            // Verify the presence of a non-empty masterPage attribute
            if (!masterPage) {
                err = newError(errMsg.missingOrEmptyMasterPageAttr, id);
                self.resume(err);
                exitIter = true;
                return;
            }

            // Verify that the masterPage exist in the `dynamic` folder
            if (!dirResources.dynamic || !dirResources.dynamic[masterPage.toLocaleLowerCase()]) {
                err = newError(errMsg.cannotFindFileInDirectory, id, masterPage, 'dynamic');
                self.resume(err);
                exitIter = true;
                return;
            }
        }


        if (!condition) {
            outputsEmptyCondition.push(id);
        }

        if (condition && conditions[condition]) {
            self.report.warnings++;
            self.writeWarning(warnMsg.duplicateOutputCondition, conditions[condition], id);
        }

        // defaultGeneration attribute is mark as deprecated in the 2.1.0
        if (projectVersion !== '2.0.0') {
            if ("defaultGeneration" in output.attrib) {
                self.report.warnings++;
                self.writeWarning(warnMsg.deprecatedDefaultGenerationAttr);
            }
        }

        conditions[condition] = id;

        var lastOutput = {
            id                : id,
            defaultGeneration : defaultGeneration,
            contents          : output.findall("content") || [],
            condition         : condition,
            dynamicContentCount     : 0,
            javascriptContentCount  : 0,
            flashContentCount       : 0
        };

        err = self.validateADXContents(lastOutput);

        if (defaultGeneration || !lastOutput.javascriptContentCount) {
            htmlFallBackCount++;
        }

        if (err) {
            self.resume(err);
            exitIter = true;
        }
    });

    if (exitIter) {
        return;
    }

    if (outputsEmptyCondition.length > 1) {
        err = newError(errMsg.tooManyEmptyCondition, outputsEmptyCondition.join(", "));
    }

    if (!htmlFallBackCount) {
        this.report.warnings++;
        this.writeWarning(warnMsg.noHTMLFallBack);
    }

    if (!err) {
        this.writeSuccess(successMsg.xmlOutputsValidate);
    }
    this.resume(err);
};


/**
 * Validate the contents of an ADX output
 *
 * @param {Object} output Helper output object
 * @return {Error|void} Return the error or null when no error.
 */
Validator.prototype.validateADXContents = function validateADXContents(output) {
    var projectType = this.adxConfigurator.projectType,
        contents = output.contents,
        i, l,
        err = null,
        condition = output.condition || "";

    if (contents.length && !this.dirResources.isExist) {
        return newError(errMsg.noResourcesDirectory);
    }

    for (i = 0, l = contents.length; i < l; i++) {
        err = this.validateADXContent(output, contents[i]);
        if (err) {
            return err;
        }
    }

    // ADP doesn't require content, it already have at least one masterPage
    if (projectType !== 'adp' ) {
        if (!output.defaultGeneration && !output.dynamicContentCount) {
            return newError(errMsg.dynamicFileRequire, output.id);
        }

        if (!output.defaultGeneration && output.javascriptContentCount && !/browser\.support\("javascript"\)/gi.test(condition)) {
            this.report.warnings++;
            this.writeWarning(warnMsg.javascriptUseWithoutBrowserCheck, output.id);
        }

        if (!output.defaultGeneration && output.flashContentCount  && !/browser\.support\("flash"\)/gi.test(condition)) {
            this.report.warnings++;
            this.writeWarning(warnMsg.flashUseWithoutBrowserCheck, output.id);
        }
    }

    return err;
};


/**
 * Validate the content of an ADX output
 *
 * @param {Object} output Helper output object
 * @param {Object} content Content node
 * @return {Error|void} Return the error or null when no error.
 */
Validator.prototype.validateADXContent = function validateADXContent(output, content) {
    var atts        = content.attrib,
        type        = atts.type,
        position    = atts.position,
        mode        = atts.mode,
        key         = (mode !== 'static') ? mode : 'statics',
        fileName    = atts.fileName,
        yieldNode   = content.find('yield'),
        dirResources = this.dirResources;

    // Missing directory
    if (!dirResources[key].isExist) {
        return newError(errMsg.cannotFindDirectory, mode);
    }

    // Missing file
    if (!dirResources[key][fileName.toLocaleLowerCase()]) {
        return newError(errMsg.cannotFindFileInDirectory, output.id, fileName, mode);
    }

    // A binary file could not be dynamic
    if (mode === 'dynamic' && contentType[type] === 'binary') {
        return newError(errMsg.typeCouldNotBeDynamic, output.id, type, fileName);
    }

    // A binary file require a 'yield' node or 'position=none'
    if (type === 'binary' && position !== 'none' && (!yieldNode || !yieldNode.text)) {
        return newError(errMsg.yieldRequireForBinary, output.id, fileName);
    }

    // Increment the information about the dynamic content
    if (position !== 'none' && mode === 'dynamic' && (type === 'javascript' || type === 'html')) {
        output.dynamicContentCount++;
    }

    // Increment the information about the javascript content
    if (type === 'javascript') {
        output.javascriptContentCount++;
    }

    // Increment the information about the flash content
    if (type === 'flash') {
        output.flashContentCount++;
    }

    // Validate attribute
    return this.validateADXContentAttribute(output, content);
};


/**
 * Validate the attribute tag of the content node
 *
 * @param {Object} output Helper output object
 * @param {Object} content Content node
 * @return {Error|void} Return error or null when no error
 */
Validator.prototype.validateADXContentAttribute = function validateADXContentAttribute(output, content) {
    var attributes = content.findall('attribute');
    if (!attributes || !attributes.length) {
        return null;
    }

    var atts        = content.attrib,
        type        = atts.type,
        mode        = atts.mode,
        fileName    = atts.fileName,
        yieldNode   = content.find("yield"),
        attribute,
        attName,
        attMap      = {},
        i, l;

    // Attribute nodes are ignored for the following type
    if (/(text|binary|html|flash)/.test(type)) {
        this.report.warnings++;
        this.writeWarning(warnMsg.attributeNodeWillBeIgnored, output.id, type, fileName);
    }

    // Attribute nodes are ignored for dynamic mode
    if (mode === 'dynamic') {
        this.report.warnings++;
        this.writeWarning(warnMsg.attributeNodeAndDynamicContent, output.id, fileName);
    }

    // Attribute nodes are ignored with yield
    if (yieldNode && yieldNode.text) {
        this.report.warnings++;
        this.writeWarning(warnMsg.attributeNodeAndYieldNode, output.id, fileName);
    }

    for (i = 0, l = attributes.length; i < l; i++) {
        attribute = attributes[i];
        attName     = (attribute.attrib && attribute.attrib.name && attribute.attrib.name.toLocaleLowerCase()) || '';

        if (contentSealAttr[type] && contentSealAttr[type][attName]) {
            return newError(errMsg.attributeNotOverridable, output.id, attName, fileName);
        }
        if (attMap[attName]) {
            return newError(errMsg.duplicateAttributeNode, output.id, attName, fileName);
        }
        if (attName) {
            attMap[attName] = attName;
        }
    }

    return null;
};

/**
 * Validate the ADX properties node
 */
Validator.prototype.validateADXProperties = function validateADXProperties() {
    var xmldoc = this.adxConfigurator.xmldoc;
    var elProperties = xmldoc.find("properties");
    var categories = elProperties.findall('category');
    var properties = elProperties.findall('property');

    if ((!properties || !properties.length) && (!categories || !categories.length)) {
        this.report.warnings++;
        this.writeWarning(warnMsg.noProperties);
    }
    this.writeSuccess(successMsg.xmlPropertiesValidate);
    this.resume(null);
};

/**
 * Run the ADX Unit tests process with specify arguments
 * @param {Array} args
 * @param {String} message
 */
Validator.prototype.runTests = function runTests(args, message) {
    var self = this;
    // Validate the existence of the specify unit test directory
    common.dirExists(pathHelper.join(self.adxDirectoryPath, common.UNIT_TEST_DIR_PATH), function verifyUnitTestDirectory(err, exists) {
        if (!exists) {
            self.resume(null);
            return ;
        }
        function execCallback(err, data, stderr) {
            if (stderr) {
                err = new Error(stderr);
            }
            self.writeMessage(message);
            if (err) {
                self.report.warnings++;
                self.writeWarning("\r\n" + err.message);
                if (data) {
                    self.writeMessage(data);
                }
            } else {
                self.writeMessage(data);
                self.writeSuccess(successMsg.adxUnitSucceed);
            }
            self.resume(null);
        }

        if (!self._adxShell) {
            var execFile =  require('child_process').execFile;
            execFile('.\\' + common.ADX_UNIT_PROCESS_NAME, args, {
                cwd   : pathHelper.join(self.rootdir, common.ADX_UNIT_DIR_PATH),
                env   : process.env
            }, execCallback);
        } else {
            var escapedArgs = [];
            for (var i = 0,  l = args.length; i < l; i += 1) {
                escapedArgs.push('"' + args[i] + '"');
            }
            self._adxShell.exec('test ' + escapedArgs.join(' '), execCallback);
        }
    });
};

/**
 * Run the ADX unit tests auto-generated
 */
Validator.prototype.runAutoTests = function runAutoTests() {
    this.runTests(['--auto', this.adxDirectoryPath], msg.runningAutoUnit);
};

/**
 * Run the ADX unit tests
 */
Validator.prototype.runADXUnitTests  = function runADXUnitTests() {
    this.runTests([this.adxDirectoryPath], msg.runningADXUnit);
};

// Export the Validator object
exports.Validator = Validator;

/*
 * Validate an ADX (CLI)
 *
 * @param {Command} program Commander object which hold the arguments pass to the program
 * @param {String} path Path to the ADX directory
 * @param {Function} callback Callback function to run at the end it take a single Error argument
 */
exports.validate = function validate(program, path, callback) {
    var validator = new Validator(path);
    validator.validate(program, callback);
};
