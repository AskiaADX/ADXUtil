describe('ADCValidator', function () {

    var fs              = require('fs'),
        spies           = {},
        format          = require('util').format,
        clc             = require('cli-color'),
        common,
        adcValidator,
        Validator,
        errMsg,
        warnMsg,
        successMsg,
        msg;

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the ADCValidator each time
        var adcValidatorKey = require.resolve('../../app/validator/ADCValidator.js'),
            commonKey = require.resolve('../../app/common/common.js');

        delete require.cache[commonKey];
        common = require('../../app/common/common.js');

        delete require.cache[adcValidatorKey];
        adcValidator = require('../../app/validator/ADCValidator.js');

        Validator = adcValidator.Validator;

        var oldValidate = Validator.prototype.validate;

        spies.validateHook = function () {};
        spies.sequence = null;


        Validator.prototype.validate = function () {
            this.rootdir =   '/root';
            if (spies.sequence) {
                this.validators.sequence = spies.sequence;
            }
            spies.validateHook.apply(this, arguments);
            oldValidate.apply(this, arguments);
        };

        // Messages
        errMsg      = common.messages.error;
        warnMsg     = common.messages.warning;
        successMsg  = common.messages.success;
        msg         = common.messages.message;

        // Court-circuit the validation outputs
        spyOn(common, 'writeError');
        spyOn(common, 'writeWarning');
        spyOn(common, 'writeSuccess');
        spyOn(common, 'writeMessage');

        // Court-circuit the access of the filesystem
        spies.fs = {
            stat        : spyOn(fs, 'stat'),
            exists      : spyOn(fs, 'exists'),
            readdirSync : spyOn(fs, 'readdirSync'),
            readFile    : spyOn(fs, 'readFile')
        };


        // Add matchers
        this.addMatchers({
            /**
             * Validate that the actual array contains the expected value
             * @param {*} expected
             * @returns {Boolean}
             */
            toContains: function(expected) {
                var actual = this.actual,
                    notText = this.isNot ? " not" : "",
                    expectedValue = expected;

                this.message = function () {
                    return "Expected " + actual + notText + " contains " + expectedValue;
                };

                if (!Array.isArray(actual)) {
                     return false;
                }
                return actual.some(function (value) {
                    if (Array.isArray(expected)) {
                        expectedValue = value;
                        return (expected.indexOf(value) !== -1);
                    }

                    return value === expected;
                });
            }
        });
    });

    // Add extra hook
    function extraHook(fn){
        var previousHook = spies.validateHook;
        spies.validateHook = function () {
            previousHook.apply(this, arguments);
            fn.apply(this, arguments);
        };
    }

    describe('#validate', function () {

        beforeEach(function () {
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it("should call each function in the ADCValidator.validators.sequence", function () {
            var seqLen, callCount = 0;
            function increment() {
                callCount++;
                this.resume(null);
            }
            spies.validateHook = function () {
                var i, seq = this.validators.sequence;
                for (i = 0, seqLen = seq.length; i < seqLen; i++) {
                    this[seq[i]] = increment;
                }
            };
            adcValidator.validate(null, 'adc/path/dir');
            expect(callCount).toBe(seqLen);
        });

        it("should break the validations when at least one validators call #resume with an error", function () {
            var key, callCount = 0;
            function increment() {
                var err = null;
                callCount++;
                if (callCount === 3) {
                    err = new Error("An error occurred in the third validation");
                }
                this.resume(err);
            }
            spies.validateHook = function () {
                var i, seq = this.validators.sequence;
                for (i = 0, seqLen = seq.length; i < seqLen; i++) {
                    this[seq[i]] = increment;
                }
            };
            adcValidator.validate(null, 'adc/path/dir');
            expect(callCount).toBe(3);
        });

        it("should call the callback function in arg at the end of the validation", function () {
            var key, wasCalled = false;
            function fakeValidation() {
                this.resume(null);
            }
            spies.validateHook = function () {
                var i, seq = this.validators.sequence;
                for (i = 0, seqLen = seq.length; i < seqLen; i++) {
                    this[seq[i]] = fakeValidation;
                }
            };
            adcValidator.validate(null, 'adc/path/dir', function () {
                wasCalled = true;
            });
            expect(wasCalled).toBe(true);
        });

        it("should output error message of the failed validator", function () {
            spies.validateHook = function () {
                this.validators.sequence = ['raiseError'];
                this.raiseError = function () {
                    this.resume(new Error("An error occurred"));
                };
            };

            adcValidator.validate(null, 'adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalledWith("An error occurred");
        });

        it("should run the unit tests when called with the `program#test=true`", function () {
            var seq;
            spies.validateHook = function () {
                this.resume = function () {
                    seq = this.validators.sequence;
                };
            };

            adcValidator.validate({
                test : true
            }, 'adc/path/dir');

            expect(seq).toContains(['runADCUnitTests']);
        });

        it("should not run the unit tests when called with the `program#test=false`", function () {
            var seq;
            spies.validateHook = function () {
                this.resume = function () {
                    seq = this.validators.sequence;
                };
            };

            adcValidator.validate({
                test : false
            }, 'adc/path/dir');

            expect(seq).not.toContains(['runADCUnitTests']);
        });

        it("should run the auto unit tests when called with the `program#autoTest=true`", function () {
            var seq;
            spies.validateHook = function () {
                this.resume = function () {
                    seq = this.validators.sequence;
                };
            };

            adcValidator.validate({
                autoTest : true
            }, 'adc/path/dir');

            expect(seq).toContains(['runAutoTests']);
        });

        it("should not run the auto unit tests when called with the `program#autoTest=false`", function () {
            var seq;
            spies.validateHook = function () {
                this.resume = function () {
                    seq = this.validators.sequence;
                };
            };


            adcValidator.validate({
                autoTest : false
            }, 'adc/path/dir');

            expect(seq).not.toContains(['runAutoTests']);
        });

        it("should run the xml validation when called with the `program#xml=true`", function () {
            var seq;
            spies.validateHook = function () {
                this.resume = function () {
                    seq = this.validators.sequence;
                };
            };

            adcValidator.validate({
                xml : true
            }, 'adc/path/dir');

            expect(seq).toContains([
                'validateXMLAgainstXSD',
                'initConfigXMLDoc',
                'validateADCInfo',
                'validateADCInfoConstraints',
                'validateADCOutputs',
                'validateADCProperties'
            ]);
        });

        it("should not run the xml validation when called with the `program#xml=false`", function () {
            var seq;
            spies.validateHook = function () {
                this.resume = function () {
                    seq = this.validators.sequence;
                };
            };

            adcValidator.validate({
                xml : false
            }, 'adc/path/dir');

            expect(seq).not.toContains([
                'validateXMLAgainstXSD',
                'initConfigXMLDoc',
                'validateADCInfo',
                'validateADCInfoConstraints',
                'validateADCOutputs',
                'validateADCProperties'
            ]);
        });

        it("should display a report with the execution time", function () {
            spies.validateHook = function () {
                this.validators.sequence = [];
            };
            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeMessage).toHaveBeenCalledWith(msg.validationFinishedIn, 0);
        });

        it("should display a report using #writeError with the number of success, warnings and failures when at least one error", function () {
            spies.validateHook = function () {
                this.validators.sequence = [];
                this.validators.sequence.length = 8;
                this.report.runs      = 6;
                this.report.success   = 1;
                this.report.warnings  = 2;
                this.report.errors    = 3;
            };

            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(msg.validationReport,6, 8, 1, 2, 3, 2));
        });

        it("should display a report in #writeWarning with the number of success, warnings and failures when at least one warning", function () {
            spies.validateHook = function () {
                this.validators.sequence = [];
                this.validators.sequence.length = 6;
                this.report.runs      = 6;
                this.report.success   = 1;
                this.report.warnings  = 2;
                this.report.errors    = 0;
            };

            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(format(msg.validationReport, 6, 6, 1, 2, 0, 0));
        });

        it("should display a report in #writeSuccess with the number of success, warnings and failures when no warning and error", function () {
            spies.validateHook = function () {
                this.validators.sequence = [];
                this.validators.sequence.length = 6;
                this.report.runs      = 6;
                this.report.success   = 1;
                this.report.warnings  = 0;
                this.report.errors    = 0;
            };

            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeSuccess).toHaveBeenCalledWith(format(msg.validationReport,6, 6, 1, 0, 0, 0));
        });

        it("should set the #logger when it's defined in the options arg", function () {
            var instance;
            spies.validateHook = function () {
                this.validators.sequence = [];
                instance = this;
            };
            var logger = {
                key : "val"
            };
            adcValidator.validate({
                logger : logger
            }, '/adc/path/dir');
            expect(instance.logger).toBe(logger);
        });
    });

    describe('#validatePathArg', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validatePathArg method
            spies.sequence = ['validatePathArg'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it("should output an error when the path specified doesn't exist", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(new Error("No such file or directory"));
            });

            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.noSuchFileOrDirectory, "\\adc\\path\\dir"));
        });

        it("should not output an error when the path specified exist", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).not.toHaveBeenCalled();
        });

        it("should use the current directory when the path is not specified", function () {
            spyOn(process, 'cwd').andReturn('/cwd/');
            var dir;
            spies.validateHook = function () {
                dir = this.adcDirectoryPath;
            };
            adcValidator.validate(null);

            expect(dir).toBe('/cwd/');
        });
    });

    describe('#validateADCDirectoryStructure', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCDirectoryStructure method
            spies.sequence = ['validateADCDirectoryStructure'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it("should output an error when the config.xml file doesn't exist", function () {
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(false);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalledWith(errMsg.noConfigFile);
        });

        it("should not output an error when the config.xml file exist", function () {
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(true);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).not.toHaveBeenCalled();
        });

        it("should output a success message when the config.xml file exist", function () {
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(true);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeSuccess).toHaveBeenCalled();
        });

        it("should search the `resources` directory", function () {
            var searchResourcesDirectory = false;
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(true);
            });

            spies.fs.stat.andCallFake(function (path) {
                if (path === '\\adc\\path\\dir\\resources') {
                    searchResourcesDirectory = true;
                }
            });

            adcValidator.validate('null', '/adc/path/dir');

            expect(searchResourcesDirectory).toBe(true);
        });

        function loadResourcesDirectory(mode) {
            it("should search the `resources/" + mode + "/` directory", function () {
                var searchResources = false;
                spies.fs.exists.andCallFake(function (path, callback) {
                    callback(true);
                });

                spies.fs.stat.andCallFake(function (path, callback) {
                    if (path === '\\adc\\path\\dir\\resources') {
                        callback(null, true);
                    } else if (path === '\\adc\\path\\dir\\resources\\' + mode) {
                        searchResources = true;
                    } else {
                        callback(null, false);
                    }
                });

                adcValidator.validate('null', '/adc/path/dir');

                expect(searchResources).toBe(true);
            });

            it("should load files from the `resources/" + mode + "/` directory", function () {
                var files = ['123.txt', '456.html'],
                    key   = (mode === 'static') ? 'statics' : mode,
                    instance;
                spies.fs.exists.andCallFake(function (path, callback) {
                    callback(true);
                });
                spies.validateHook = function () {
                    instance = this;
                };

                spies.fs.stat.andCallFake(function (path, callback) {
                    if (path === '\\adc\\path\\dir\\resources') {
                        callback(null, true);
                    } else if (path === '\\adc\\path\\dir\\resources\\' + mode) {
                        callback(null, true);
                    } else {
                        callback(null, false);
                    }
                });

                spies.fs.readdirSync.andReturn(files);

                spyOn(common, 'isIgnoreFile').andReturn(false);

                adcValidator.validate(null, '/adc/path/dir');


                expect(instance.dirResources[key]).toEqual({
                    isExist : true,
                    '123.txt' : '123.txt',
                    '456.html' : '456.html'
                });

            });

            it("should ignore certain files from the `resources/" + mode + "/` directory", function () {
                var files = ['123.txt', '456.html', 'Thumbs.db'],
                    key   = (mode === 'static') ? 'statics' : mode,
                    instance;

                spies.fs.exists.andCallFake(function (path, callback) {
                    callback(true);
                });

                spies.validateHook = function () {
                    instance = this;
                };

                spies.fs.stat.andCallFake(function (path, callback) {
                    if (path === '\\adc\\path\\dir\\resources') {
                        callback(null, true);
                    } else if (path === '\\adc\\path\\dir\\resources\\' + mode) {
                        callback(null, true);
                    } else {
                        callback(null, false);
                    }
                });

                spies.fs.readdirSync.andReturn(files);

                spyOn(common, 'isIgnoreFile').andCallFake(function (f) {
                   return (f === 'Thumbs.db');
                });

                adcValidator.validate('null', '/adc/path/dir');


                expect(instance.dirResources[key]).toEqual({
                    isExist : true,
                    '123.txt' : '123.txt',
                    '456.html' : '456.html'
                });

            });
        }

        ['dynamic', 'static', 'share'].forEach(loadResourcesDirectory);
    });

    describe('#validateFileExtensions', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateFileExtensions method
            spies.sequence =  ['validateFileExtensions'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        var directories = ['dynamic', 'static', 'share'];

        function testForbiddenExtensionIn(directoryName) {
            it('should output an error when found in `' + directoryName + '` directory', function () {
                    (directoryName = directoryName === 'static' ? 'statics' : directoryName);

                    spies.validateHook = function () {
                        var dirResources = this.dirResources;
                        dirResources.isExist = true;
                        dirResources[directoryName].isExist = true;
                        dirResources[directoryName]['filewithforbiddenextension.exe'] = 'filewithforbiddenextension.exe';
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.fileExtensionForbidden, ".exe"));
                });
        }

        function testTrustExtensionIn(directoryName) {
            it('should not output an error when found in `' + directoryName + '` directory', function () {
                (directoryName = directoryName === 'static' ? 'statics' : directoryName);
                spies.validateHook = function () {
                    var dirResources = this.dirResources;
                    dirResources.isExist = true;
                    dirResources[directoryName].isExist = true;
                    dirResources[directoryName]['trustfileextension.html'] = 'trustfileextension.html';
                };

                adcValidator.validate(null, '/adc/path/dir');

                expect(Validator.prototype.writeError).not.toHaveBeenCalled();
            });
            it('should not output a warning when found in `' + directoryName + '` directory', function () {
                    (directoryName = directoryName === 'static' ? 'statics' : directoryName);
                    spies.validateHook = function () {
                        var dirResources = this.dirResources;
                        dirResources.isExist = true;
                        dirResources[directoryName].isExist = true;
                        dirResources[directoryName]['trustfileextension.html'] = 'trustfileextension.html';
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).not.toHaveBeenCalled();
                });
        }

        function testUnknownExtensionIn(directoryName) {
            it('should output a warning when found in `' + directoryName + '` directory', function () {
                (directoryName = directoryName === 'static' ? 'statics' : directoryName);
                spies.validateHook = function () {
                    var dirResources = this.dirResources;
                    dirResources.isExist = true;
                    dirResources[directoryName].isExist = true;
                    dirResources[directoryName]['unknownextension.unknown'] = 'unknownextension.unknown';
                };

                adcValidator.validate(null, '/adc/path/dir');

                expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.untrustExtension, 'unknownextension.unknown');
            });
        }

        describe('file with forbidden extension', function () {
            directories.forEach(testForbiddenExtensionIn);
        });
        describe('file with trust extension', function () {
            directories.forEach(testTrustExtensionIn);
        });
        describe('file with unknown extension', function () {
            directories.forEach(testUnknownExtensionIn);
        });

        describe('all files are valid', function () {
            beforeEach(function () {
                spies.validateHook = function () {
                    var dirResources = this.dirResources;
                    dirResources.isExist = true;
                    dirResources.dynamic.isExist = true;
                    dirResources.statics.isExist = true;
                    dirResources.share.isExist = true;

                    dirResources.dynamic['valid.html'] = 'valid.html';
                    dirResources.statics['valid.js'] = 'valid.js';
                    dirResources.share['valid.css'] = 'valid.css';
                };
            })
            it('should not output an error', function () {
                adcValidator.validate(null, '/adc/path/dir');
                expect(Validator.prototype.writeError).not.toHaveBeenCalled();
            });
            it('should output a success message', function () {
                adcValidator.validate(null, '/adc/path/dir');
                expect(Validator.prototype.writeSuccess).toHaveBeenCalledWith(successMsg.fileExtensionValidate);
            });
        });

        describe('at least one invalid files', function () {
            it('should output an error', function () {
                spies.validateHook = function () {
                    var dirResources = this.dirResources;
                    dirResources.isExist = true;
                    dirResources.dynamic.isExist = true;
                    dirResources.statics.isExist = true;
                    dirResources.share.isExist = true;

                    dirResources.dynamic['valid.html'] = 'valid.html';
                    dirResources.statics['valid.js'] = 'valid.js';
                    dirResources.statics['invalid.exe'] = 'invalid.exe';
                    dirResources.share['valid.css'] = 'valid.css';
                };

                adcValidator.validate(null, '/adc/path/dir');

                expect(Validator.prototype.writeError).toHaveBeenCalled();
            });
        });

    });

    describe('#validateXMLAgainstXSD', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateXMLAgainstXSD method
            spies.sequence = ['validateXMLAgainstXSD'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it('should run the xmllint process with the config.xsd and the config.xml file', function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command) {
                expect(command).toBe('"\\root\\lib\\libxml\\xmllint.exe" --noout --schema "\\root\\schema\\config.xsd" "\\adc\\path\\dir\\config.xml"');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(childProc.exec).toHaveBeenCalled();
        });

        it('should output an error when the xmllint process failed', function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command, callback) {
                callback(new Error('Fake validation error'));
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalled();
        });

        it("should not output an error when the xmllint process doesn't failed", function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).not.toHaveBeenCalled();
        });

        it("should output a success when the xmllint process doesn't failed", function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeSuccess).toHaveBeenCalledWith(successMsg.xsdValidate);
        });
    });

    describe('#initConfigXMLDoc', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the initConfigXMLDoc method
            spies.sequence = ['initConfigXMLDoc'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it("should output an error when the config file could not be read", function () {
            spies.fs.readFile.andCallFake(function (path, config, callback) {
                callback(new Error("Fake error"));
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalled();
        });

        it("should not output an error when the config file could be read", function () {
            spies.fs.readFile.andCallFake(function (path, config,callback) {
                callback(null, '');
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).not.toHaveBeenCalled();
        });

        it("should correctly initialize the config.xml document", function () {
            var xml2js = require('xml2js'),
                obj    = {
                    test : 'test'
                },
                instance;
            spies.validateHook = function () {
                instance = this;
            };
            spies.fs.readFile.andCallFake(function (path, config,callback) {
                callback(null, '');
            });
            spyOn(xml2js, 'parseString').andCallFake(function (data, callback) {
                callback(null, obj);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(instance.configXmlDoc).toBe(obj);
        });

    });

    describe("#validateADCInfo", function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCInfo method
            spies.sequence = ['validateADCInfo'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it("should output an error when the info doesn't exist", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control : {}
                };
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalledWith(errMsg.missingInfoNode);
        });

        it("should output an error when the info/name doesn't exist", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control : {
                        info  : [{}]
                    }
                }
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalledWith(errMsg.missingOrEmptyNameNode);
        });

        it("should output an error when the info/name is empty", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control : {
                        info  : [
                            {
                                name : []
                            }
                        ]
                    }
                };
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalledWith(errMsg.missingOrEmptyNameNode);
        });

        it("should not output an error when the info/name is valid", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control : {
                        info : [
                            {
                                name : [
                                    'test'
                                ]
                            }
                        ]
                    }
                };
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).not.toHaveBeenCalled();
        });

        it("should initialize the adcName property with the name of the ADC", function () {
            var instance;
            spies.validateHook = function () {
                instance = this;
                this.configXmlDoc = {
                    control : {
                        info : [
                            {
                                name : [
                                    'test'
                                ]
                            }
                        ]
                    }
                };
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(instance.adcName).toBe('test');
        });
    });

    describe('#validateADCInfoConstraints', function () {
        beforeEach(function () {
           // Modify the sequence of the validation to only call the validateADCInfoConstraints method
           spies.sequence = ['validateADCInfoConstraints'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        var elements = ['questions', 'responses', 'controls'],
            constraintAttrs = [
            {
                name : 'chapter',
                on   : 'questions'
            },
            {
                name : 'single',
                on   : 'questions'
            },
            {
                name : 'multiple',
                on   : 'questions'
            },
            {
                name : 'open',
                on   : 'questions'
            },
            {
                name : 'numeric',
                on   : 'questions'
            },
            {
                name : 'date',
                on   : 'questions'
            },
            {
                name : 'requireParentLoop',
                on   : 'questions'
            },
            {
                name : 'min',
                on   : 'responses'
            },
            {
                name : 'max',
                on   : 'responses'
            },
            {
                name : 'label',
                on   : 'controls'
            },
            {
                name : 'checkbox',
                on : 'controls'
            },
            {
                name : 'textbox',
                on   : 'controls'
            },
            {
                name : 'listbox',
                on   : 'controls'
            },
            {
                name : 'radiobutton',
                on   : 'controls'
            },
            {
                name : 'responseblock',
                on   : 'controls'
            }
            ],
            fakeAttr = {
                'questions' : 'single',
                'responses' : 'min',
                'controls'  : 'label'
            };

        function testDuplicateConstraints(element) {
            it("should output an error when 2 constraints defined on " + element, function () {
                spies.validateHook = function () {
                    this.configXmlDoc = {
                        control : {
                            info : [
                                {
                                    constraints : [
                                        {
                                            constraint : [
                                                {
                                                    $ : {
                                                        on      : element
                                                    }
                                                },
                                                {
                                                    $ : {
                                                        on      : element
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    this.configXmlDoc.control.info[0].constraints[0].constraint[0].$[fakeAttr[element]] = 1;
                    this.configXmlDoc.control.info[0].constraints[0].constraint[1].$[fakeAttr[element]] = 1;

                };

                adcValidator.validate(null, '/adc/path/dir');

                expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.duplicateConstraints, element));
            });
        }

        elements.forEach(testDuplicateConstraints);

        function testRequireConstraint(element) {
            it("should output an error when no constraint defined on `" + element + "`", function () {
                var oppositeElement =  (element === 'questions') ? 'controls' : 'questions';
                spies.validateHook = function () {
                    this.configXmlDoc = {
                        control: {
                            info: [
                                {
                                    constraints: [
                                        {
                                            constraint: [
                                                {
                                                    $: {
                                                        on: oppositeElement
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    this.configXmlDoc.control.info[0].constraints[0].constraint[0].$[fakeAttr[oppositeElement]] = 1;
                };
                adcValidator.validate(null, '/adc/path/dir');
                expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.requireConstraintOn, element));
            });
        }
        ['questions', 'controls'].forEach(testRequireConstraint);
        it("should not output an error when constraints are defined on `questions` and `controls`", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control: {
                        info: [
                            {
                                constraints: [
                                    {
                                        constraint: [
                                            {
                                                $: {
                                                    on: 'questions',
                                                    single: 'true'
                                                }
                                            },
                                            {
                                                $: {
                                                    on: 'controls',
                                                    label: 'true'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };
            };

            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeError).not.toHaveBeenCalled();
        });

        function testConstraintAttribute(element) {
            describe('constraint@on=' + element, function () {

                constraintAttrs.forEach(function (attribute) {
                    var notText = (attribute.on === element) ? 'not ' : '';
                    it("should " + notText +  "output an error when the attribute `" + attribute.name + "` is present", function () {
                        spies.validateHook = function () {
                            this.configXmlDoc = {
                                control: {
                                    info: [
                                        {
                                            constraints: [
                                                {
                                                    constraint: [
                                                        {
                                                            $: {
                                                                on: element
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            };

                            this.configXmlDoc.control.info[0].constraints[0].constraint[0].$[attribute.name] = true;
                        };
                        adcValidator.validate(null, '/adc/path/dir');
                        if (attribute.on === element) {
                            expect(Validator.prototype.writeError).not.toHaveBeenCalledWith(format(errMsg.invalidConstraintAttribute, element, attribute.name));
                        } else {
                            expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.invalidConstraintAttribute, element, attribute.name));
                        }
                    });
                });

                it("should output an error when no other attribute is specified", function () {
                    spies.validateHook = function () {
                        this.configXmlDoc = {
                            control: {
                                info: [
                                    {
                                        constraints: [
                                            {
                                                constraint: [
                                                    {
                                                        $: {
                                                            on: element
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.noRuleOnConstraint, element));
                });

                if (element !== 'responses') {
                    it("should output an error when no other attribute is specified with the truthly value", function () {
                        spies.validateHook = function () {
                            this.configXmlDoc = {
                                control: {
                                    info: [
                                        {
                                            constraints: [
                                                {
                                                    constraint: [
                                                        {
                                                            $: {
                                                                on: element
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            };

                            this.configXmlDoc.control.info[0].constraints[0].constraint[0].$[fakeAttr[element]] = false;
                        };

                        adcValidator.validate(null, '/adc/path/dir');
                        expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.noRuleOnConstraint, element));
                    });
                }

            });
        }

        elements.forEach(testConstraintAttribute);

    });

    describe('#validateADCOutputs', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCOutputs method
            spies.sequence = ['validateADCOutputs'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it('should output a warning when duplicate conditions', function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control: {
                        outputs: [
                            {
                                output: [
                                    {
                                        $: {
                                            id: 'first',
                                            defaultGeneration: true
                                        },
                                        condition: [
                                            "duplicate condition"
                                        ]
                                    },
                                    {
                                        $: {
                                            id: 'second',
                                            defaultGeneration: true
                                        },
                                        condition: [
                                            "duplicate condition"
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.duplicateOutputCondition, "first", "second");
        });

        it('should not output an error when one condition is empty', function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control: {
                        outputs: [
                            {
                                output: [
                                    {
                                        $: {
                                            id: 'empty',
                                            defaultGeneration: true
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                };
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).not.toHaveBeenCalled();
        });

        it('should output an error when at least two conditions are empty', function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control: {
                        outputs: [
                            {
                                output: [
                                    {
                                        $: {
                                            id: 'first',
                                            defaultGeneration: true
                                        }
                                    },
                                    {
                                        $: {
                                            id: 'second',
                                            defaultGeneration: true
                                        },
                                        condition: [
                                            ""
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.tooManyEmptyCondition, "first, second"));
        });

        it('should output a warning when only one `output` node is use with no defaultGeneration and when it uses dynamic javascript', function (){
            spies.validateHook = function () {
                this.dirResources.isExist = true;
                this.dirResources.dynamic.isExist = true;
                this.dirResources.dynamic['test.js'] = 'test.js';
                this.configXmlDoc = {
                    control: {
                        outputs: [
                            {
                                output: [
                                    {
                                        $: {
                                            id: 'empty'
                                        },
                                        condition: [
                                            "Browser.Support(\"Javascript\")"
                                        ],
                                        content: [
                                            {
                                                $: {
                                                    type: 'javascript',
                                                    fileName: 'test.js',
                                                    mode: 'dynamic',
                                                    position: 'foot'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.noHTMLFallBack);
        });

        it('should output a success when no error found', function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control: {
                        outputs: [
                            {
                                output: [
                                    {
                                        $: {
                                            id: 'empty',
                                            defaultGeneration: true
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                };
            };

            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeSuccess).toHaveBeenCalledWith(successMsg.xmlOutputsValidate);
        });

        describe("#validateADCContents", function () {

            it("should output an error when the resources directory doesn't exist", function () {
                spies.validateHook = function () {
                    this.dirResources.isExist = false;
                    this.configXmlDoc = {
                        control: {
                            outputs: [
                                {
                                    output: [
                                        {
                                            $: {
                                                id: 'empty'
                                            },
                                            content: [
                                                "a content"
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };
                };

                adcValidator.validate(null, '/adc/path/dir');
                expect(Validator.prototype.writeError).toHaveBeenCalledWith(errMsg.noResourcesDirectory);
            });

            describe('@defaultGeneration=false', function () {
                var jsContent, htmlContent;
                beforeEach(function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.dynamic.isExist = true;
                        this.dirResources.dynamic['test.js'] = 'test.js';
                        this.dirResources.dynamic['test.html'] = 'test.html';
                        this.dirResources.dynamic['test.css'] = 'test.css';
                        this.dirResources.statics.isExist = true;
                        this.dirResources.statics['test.js'] = 'test.js';
                        this.dirResources.statics['test.html'] = 'test.html';
                        this.dirResources.statics['test.css'] = 'test.css';
                        this.dirResources.share.isExist = true;
                        this.dirResources.share['test.js'] = 'test.js';
                        this.dirResources.share['test.html'] = 'test.html';
                        this.dirResources.share['test.css'] = 'test.css';

                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty'
                                                },
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'javascript',
                                                            fileName: 'test.js',
                                                            mode: 'static'
                                                        }
                                                    },
                                                    {
                                                        $: {
                                                            type: 'html',
                                                            fileName: 'test.html',
                                                            mode: 'static'
                                                        }
                                                    },
                                                    {
                                                        $: {
                                                            type: 'css',
                                                            fileName: 'test.css',
                                                            mode: 'dynamic'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                        var contents = this.configXmlDoc.control.outputs[0].output[0].content;
                        jsContent = contents[0];
                        htmlContent = contents[1];
                    };
                });

                it("should output an error when there is no contents", function () {
                    extraHook(function () {
                        delete this.configXmlDoc.control.outputs[0].output[0].content;
                    });
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should output an error when there is no dynamic html or javascript content", function () {
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should output an error when there is a dynamic html content but with position=none", function () {
                    extraHook(function () {
                        htmlContent.$.mode = 'dynamic';
                        htmlContent.$.position = 'none';
                    });
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should not output an error when there is a dynamic html content", function () {
                    extraHook(function () {
                        htmlContent.$.mode = 'dynamic';
                    });
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(Validator.prototype.writeError).not.toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should not output an error when there is a dynamic javascript content", function () {
                    extraHook(function () {
                        jsContent.$.mode = 'dynamic';
                    });
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(Validator.prototype.writeError).not.toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should  output an error when there is a dynamic javascript content but with position=none", function () {
                    extraHook(function () {
                        jsContent.$.mode = 'dynamic';
                        jsContent.$.position = 'none';
                    });
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
            });

            describe('test content type against condition', function () {
                it("should output a warning when using a javascript content with no check of the browser.support(javascript) in the condition", function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.dynamic.isExist = true;
                        this.dirResources.dynamic['test.js'] = 'test.js';
                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty'
                                                },
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'javascript',
                                                            fileName: 'test.js',
                                                            mode: 'dynamic',
                                                            position: 'foot'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.javascriptUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a javascript content with a check of the browser.support(javascript) in the condition", function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.dynamic.isExist = true;
                        this.dirResources.dynamic['test.js'] = 'test.js';
                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty'
                                                },
                                                condition: [
                                                    "Lorem ipsum dolor Browser.Support(\"javascript\") lorem ipsum"
                                                ],
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'javascript',
                                                            fileName: 'test.js',
                                                            mode: 'dynamic',
                                                            position: 'foot'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };
                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).not.toHaveBeenCalledWith(warnMsg.javascriptUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a javascript content with no check of the browser.support(javascript) but with defaultGeneration=true", function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.dynamic.isExist = true;
                        this.dirResources.dynamic['test.js'] = 'test.js';
                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty',
                                                    defaultGeneration: true
                                                },
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'javascript',
                                                            fileName: 'test.js',
                                                            mode: 'dynamic',
                                                            position: 'foot'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };
                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).not.toHaveBeenCalledWith(warnMsg.javascriptUseWithoutBrowserCheck, "empty");
                });

                it("should output a warning when using a flash content with no check of the browser.support(flash) in the condition", function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.statics.isExist = true;
                        this.dirResources.statics['test.swf'] = 'test.swf';
                        this.dirResources.dynamic.isExist = true;
                        this.dirResources.dynamic['test.html'] = 'test.html';
                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty'
                                                },
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'flash',
                                                            fileName: 'test.swf',
                                                            mode: 'static',
                                                            position: 'placeholder'
                                                        }
                                                    },
                                                    {
                                                        $: {
                                                            type: 'html',
                                                            fileName: 'test.html',
                                                            mode: 'dynamic',
                                                            position: 'placeholder'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.flashUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a flash content with a check of the browser.support(flash) in the condition", function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.statics.isExist = true;
                        this.dirResources.statics['test.swf'] = 'test.swf';
                        this.dirResources.dynamic.isExist = true;
                        this.dirResources.dynamic['test.html'] = 'test.html';
                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty'
                                                },
                                                condition: [
                                                    "Lorem ipsum dolor Browser.Support(\"flash\") lorem ipsum"
                                                ],
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'flash',
                                                            fileName: 'test.swf',
                                                            mode: 'static',
                                                            position: 'placeholder'
                                                        }
                                                    },
                                                    {
                                                        $: {
                                                            type: 'html',
                                                            fileName: 'test.html',
                                                            mode: 'dynamic',
                                                            position: 'placeholder'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).not.toHaveBeenCalledWith(warnMsg.flashUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a flash content with with no check of the browser.support(flash) but with defaultGeneration=true", function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.statics.isExist = true;
                        this.dirResources.statics['test.swf'] = 'test.swf';
                        this.dirResources.dynamic.isExist = true;
                        this.dirResources.dynamic['test.html'] = 'test.html';
                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty',
                                                    defaultGeneration: true
                                                },
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'flash',
                                                            fileName: 'test.swf',
                                                            mode: 'static',
                                                            position: 'placeholder'
                                                        }
                                                    },
                                                    {
                                                        $: {
                                                            type: 'html',
                                                            fileName: 'test.html',
                                                            mode: 'dynamic',
                                                            position: 'placeholder'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).not.toHaveBeenCalledWith(warnMsg.flashUseWithoutBrowserCheck, "empty");
                });

            });

            describe("#validateADCContent", function () {
                var directories = ['dynamic', 'static', 'share'];

                it("should output a warning when using the attribute and yield nodes in the same content", function () {
                    spies.validateHook = function () {
                        this.dirResources.isExist = true;
                        this.dirResources.statics.isExist = true;
                        this.dirResources.statics['test.js'] = 'test.js';
                        this.configXmlDoc = {
                            control: {
                                outputs: [
                                    {
                                        output: [
                                            {
                                                $: {
                                                    id: 'empty',
                                                    defaultGeneration: true
                                                },
                                                content: [
                                                    {
                                                        $: {
                                                            type: 'javascript',
                                                            fileName: 'test.js',
                                                            mode: 'static'
                                                        },
                                                        attribute: [
                                                            {
                                                                $: {
                                                                    name: 'test'
                                                                }
                                                            }
                                                        ],
                                                        'yield': [
                                                            "test"
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.attributeNodeAndYieldNode, "empty", 'test.js');
                });

                describe('binary content', function () {
                    var content;
                    beforeEach(function () {
                        spies.validateHook = function () {
                            this.dirResources.isExist = true;
                            this.dirResources.statics.isExist = true;
                            this.dirResources.statics['test.js'] = 'test.js';
                            this.configXmlDoc = {
                                control: {
                                    outputs: [
                                        {
                                            output: [
                                                {
                                                    $: {
                                                        id: 'empty',
                                                        defaultGeneration: true
                                                    },
                                                    content: [
                                                        {
                                                            $: {
                                                                type: 'binary',
                                                                fileName: 'test.js',
                                                                mode: 'static',
                                                                position: 'placeholder'
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            };

                            content = this.configXmlDoc.control.outputs[0].output[0].content[0];
                        };
                    });

                    it("should output an error when binary content doesn't have a yield or position=none", function () {
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.yieldRequireForBinary, "empty", 'test.js'));
                    });

                    it("should not output an error when binary content have a yield", function () {
                        extraHook(function () {
                            content.yield = ['test'];
                        });
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(Validator.prototype.writeError).not.toHaveBeenCalledWith(format(errMsg.yieldRequireForBinary, "empty", 'test.js'));
                    });

                    it("should not output an error when binary content have a position=none", function () {
                        extraHook(function () {
                            content.$.position = 'none';
                        });
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(Validator.prototype.writeError).not.toHaveBeenCalledWith(format(errMsg.yieldRequireForBinary, "empty", 'test.js'));
                    });
                });

                function testMode(mode) {
                    var key =  mode === 'static' ? 'statics' : mode;

                    describe('content with mode ' + mode, function () {
                        var instance;
                       beforeEach(function () {
                           spies.validateHook = function () {
                               instance  = this;
                               this.dirResources.isExist = true;
                               this.configXmlDoc = {
                                   control: {
                                       outputs: [
                                           {
                                               output: [
                                                   {
                                                       $: {
                                                           id: 'empty',
                                                           defaultGeneration: true
                                                       },
                                                       content: [
                                                           {
                                                               $: {
                                                                   type: 'html',
                                                                   fileName: 'test.html',
                                                                   mode: mode
                                                               }
                                                           }
                                                       ]
                                                   }
                                               ]
                                           }
                                       ]
                                   }
                               };
                           };
                       });

                        it("should output an error when the directory associated doesn't exist", function () {
                            extraHook(function () {
                                instance.dirResources[key].isExist = false;
                            });
                            adcValidator.validate(null, '/adc/path/dir');
                            expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.cannotFindDirectory, mode));
                        });

                        it("should output an error when the file associated doesn't exist", function () {
                            extraHook(function () {
                                instance.dirResources[key].isExist = true;
                            });
                            adcValidator.validate(null, '/adc/path/dir');
                            expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.cannotFindFileInDirectory, "empty", "test.html", mode));
                        });

                        function testDynamicBinary(type) {
                            it("should output an error when trying to use " + type + " file", function () {
                                extraHook(function () {
                                    instance.configXmlDoc.control.outputs[0].output[0].content[0].$.type = type;
                                    instance.dirResources[key].isExist = true;
                                    instance.dirResources[key]['test.html'] = 'test.html';
                                });
                                adcValidator.validate(null, '/adc/path/dir');
                                expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.typeCouldNotBeDynamic, "empty", type , "test.html"));
                            });
                        }

                        function testDynamicText(type) {
                            it("should not output an error when trying to use " + type + " file", function () {
                                extraHook(function () {
                                    instance.configXmlDoc.control.outputs[0].output[0].content[0].$.type = type;
                                    instance.dirResources[key].isExist = true;
                                    instance.dirResources[key]['test.html'] = 'test.html';
                                });
                                adcValidator.validate(null, '/adc/path/dir');
                                expect(Validator.prototype.writeError).not.toHaveBeenCalledWith(format(errMsg.typeCouldNotBeDynamic, "empty", type , "test.html"));
                            });
                        }

                        if (mode === 'dynamic') {
                            ['binary', 'image', 'video', 'audio', 'flash'].forEach(testDynamicBinary);
                            ['text', 'html', 'javascript', 'css'].forEach(testDynamicText);
                        }

                    });
                }

                directories.forEach(testMode);

                describe("#validateADCContentAttribute", function () {
                    var content;
                    beforeEach(function () {
                        spies.validateHook = function () {
                            this.dirResources.isExist = true;
                            this.dirResources.dynamic.isExist = true;
                            this.dirResources.dynamic['test.js'] = 'test.js';
                            this.dirResources.statics.isExist = true;
                            this.dirResources.statics['test.js'] = 'test.js';
                            this.dirResources.share.isExist = true;
                            this.dirResources.share['test.js'] = 'test.js';

                            this.configXmlDoc = {
                                control : {
                                    outputs : [
                                        {
                                            output : [
                                                {
                                                    $ : {
                                                        id : 'empty',
                                                        defaultGeneration : true

                                                    },
                                                    content : [
                                                        {
                                                            $ : {
                                                                type        : 'javascript',
                                                                fileName    : 'test.js',
                                                                mode        : 'static',
                                                                position    : 'none'
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            };
                            content = this.configXmlDoc.control.outputs[0].output[0].content[0];
                        };

                    });

                    it("should not output an error when there is no attributes node", function () {
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(Validator.prototype.writeError).not.toHaveBeenCalled();
                    });

                    it("should output an error when there is duplicate attribute node with the same name", function () {
                        extraHook(function () {
                            content.attribute = [
                                {
                                    $: {
                                        name: 'test'
                                    }
                                },
                                {
                                    $: {
                                        name: 'test'
                                    }
                                }
                            ];
                        });
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.duplicateAttributeNode, 'empty', 'test', 'test.js'));
                    });

                    function testIgnoredFile(type) {
                        it("should output a warning with " + type + " file", function () {
                            extraHook(function () {
                                content.$.type = type;
                                content.attribute = [
                                    {}
                                ];
                            });
                            adcValidator.validate(null, 'adc/path/dir');
                            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.attributeNodeWillBeIgnored, "empty", type, "test.js");
                        });
                    }

                    describe('ignored attributes node', function () {
                        ['text', 'binary', 'html', 'flash'].forEach(testIgnoredFile);

                        it("should output a warning with dynamic file", function () {
                            extraHook(function () {
                                content.$.mode = 'dynamic';
                                content.attribute = [
                                    {}
                                ];
                            });
                            adcValidator.validate(null, 'adc/path/dir');
                            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.attributeNodeAndDynamicContent, "empty", "test.js");
                        });
                    });

                    function testNotOverridableAttribute(obj) {
                        var type     = obj.type,
                            attrName = obj.attr;
                        it("should output an error on " + type + " content when attempt to override " + attrName, function () {

                            extraHook(function () {
                                content.$.type = type;
                                content.attribute = [
                                    {
                                        $: {
                                            name: attrName
                                        }
                                    }
                                ];
                            });

                           adcValidator.validate(null, 'adc/path/dir');
                           expect(Validator.prototype.writeError).toHaveBeenCalledWith(format(errMsg.attributeNotOverridable, "empty", attrName, "test.js"));
                        });
                    }

                    describe('not overridable attribute', function () {
                        var notOverridable = [
                            {
                                type : 'javascript',
                                attr : 'src'
                            },
                            {
                                type : 'css',
                                attr : 'href'
                            },
                            {
                                type : 'image',
                                attr : 'src'
                            },
                            {
                                type : 'video',
                                attr : 'src'
                            },
                            {
                                type : 'audio',
                                attr : 'src'
                            }
                        ];

                        notOverridable.forEach(testNotOverridableAttribute);
                    });

                });
            });

        });

    });

    describe('#validateADCProperties', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCProperties method
            spies.sequence = ['validateADCProperties'];
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it("should output a warning when no property", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control : {
                        properties : [
                            {}
                        ]
                    }
                };
            };


            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith(warnMsg.noProperties);
        });

        it("should not output a warning when there is at least one property", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control: {
                        properties: [
                            {
                                property: [{}]
                            }
                        ]
                    }
                };
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeWarning).not.toHaveBeenCalledWith(warnMsg.noProperties);
        });

        it("should not output a warning when there is at least one property inside category", function () {
            spies.validateHook = function () {
                this.configXmlDoc = {
                    control: {
                        properties: [
                            {
                                category: [
                                    {
                                        property: [{}]
                                    }
                                ]
                            }
                        ]
                    }
                };
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeWarning).not.toHaveBeenCalledWith(warnMsg.noProperties);
        });


    });

    describe('#runAutoTests', function () {
        var spyExec,
            childProc,
            InteractiveADXShell,
            spyInteractiveExec;

        beforeEach(function () {
            // Modify the sequence of the validation to only call the runAutoTests method
            spies.sequence = ['runAutoTests'];

            childProc = require('child_process');
            spyOn(process, 'cwd').andReturn('');
            spyExec = spyOn(childProc, 'execFile');

            InteractiveADXShell  =  require('../../app/common/InteractiveADXShell.js').InteractiveADXShell;
            spyInteractiveExec = spyOn(InteractiveADXShell.prototype, 'exec');
            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });


        it('should run the ADXShell process with the path of the ADC directory in arguments and the flag --auto', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args) {
                expect(file).toBe('.\\ADXShell.exe');
                expect(args).toEqual(['--auto', '\\adc\\path\\dir']);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(childProc.execFile).toHaveBeenCalled();
        });

        it('should output a warning when the ADXShell process failed', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(new Error('Fake validation error'), '', 'Fake validation error');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith('\r\nFake validation error');
        });

        it('should output the stdout of the ADXShell process', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null, 'Fake stdout');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeMessage).toHaveBeenCalledWith('Fake stdout');
        });

        it("should output a success when the ADXShell process doesn't failed", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeSuccess).toHaveBeenCalledWith(successMsg.adcUnitSucceed);
        });

        it("should run the ADXShell process using the InteractiveADXShell when it's defined in the options", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            var mockCommand;
            spyInteractiveExec.andCallFake(function (command) {
                mockCommand = command;
            });
            adcValidator.validate({
                test     : false,
                autoTest : true,
                xml      : false,
                adxShell : new InteractiveADXShell()
            }, 'adc/path/dir');
            expect(mockCommand).toBe('test "--auto" "adc\\path\\dir"');
        });
    });

    describe('#runADCUnitTests', function () {
        var spyExec,
            childProc;

        beforeEach(function () {
            // Modify the sequence of the validation to only call the runADCUnitTests method
            spies.sequence = ['runADCUnitTests'];

            childProc = require('child_process');
            spyOn(process, 'cwd').andReturn('');
            spyExec = spyOn(childProc, 'execFile');

            spyOn(Validator.prototype, 'writeError');
            spyOn(Validator.prototype, 'writeWarning');
            spyOn(Validator.prototype, 'writeSuccess');
            spyOn(Validator.prototype, 'writeMessage');
        });

        it('should verify that the `tests/units` directory exists', function () {
            var searchUnitsTests = false;

            spies.fs.stat.andCallFake(function (path) {
                if (path === '\\adc\\path\\dir\\tests\\units') {
                    searchUnitsTests = true;
                }
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(searchUnitsTests).toBe(true);
        });

        it("should not output a warning when the `tests/units` directory doesn't exists", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(new Error("No such file or directory"));
            });

            adcValidator.validate(null, '/adc/path/dir');
            expect(Validator.prototype.writeWarning).not.toHaveBeenCalled();
        });

        it('should run the ADXShell process with the path of the ADC directory in arguments', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args) {
                expect(file).toBe('.\\ADXShell.exe');
                expect(args).toEqual(['\\adc\\path\\dir']);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(childProc.execFile).toHaveBeenCalled();
        });

        it('should output a warning when the ADXShell process failed', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(new Error('Fake validation error'), '', 'Fake validation error');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeWarning).toHaveBeenCalledWith('\r\nFake validation error');
        });

        it('should output the stdout of the ADXShell process', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null, 'Fake stdout');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeMessage).toHaveBeenCalledWith('Fake stdout');
        });

        it("should output a success when the ADXShell process doesn't failed", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(Validator.prototype.writeSuccess).toHaveBeenCalledWith(successMsg.adcUnitSucceed);
        });
    });

    function testLogger(method) {
        describe('#'  + method, function () {
            beforeEach(function () {
                spies.validateHook = function () {
                    this.validators.sequence = [];
                };
            });
            it('should call the `common.' + method + '` when no #logger is defined', function () {
                var validatorInstance = new Validator('test');
                validatorInstance[method]('a message', 'arg 1', 'arg 2');
                expect(common[method]).toHaveBeenCalledWith('a message', 'arg 1', 'arg 2');
            });
            it('should call the `common.' + method + '` when the #logger is defined but without the ' + method + ' method.', function () {
                var validatorInstance = new Validator('test');
                validatorInstance.logger = {};
                validatorInstance[method]('a message', 'arg 1', 'arg 2');
                expect(common[method]).toHaveBeenCalledWith('a message', 'arg 1', 'arg 2');
            });
            it('should not call the `common.' + method + '` when the #logger is defined with the ' + method + ' method.', function () {
                var validatorInstance = new Validator('test');
                validatorInstance.logger = {};
                validatorInstance.logger[method] = function () {};
                validatorInstance[method]('a message', 'arg 1', 'arg 2');
                expect(common[method]).not.toHaveBeenCalled();
            });

            it('should call the `logger.' + method + '` when it\'s defined', function () {
                var validatorInstance = new Validator('test');
                validatorInstance.logger = {};
                validatorInstance.logger[method] = function () {};
                var spy = spyOn(validatorInstance.logger, method);
                validatorInstance[method]('a message', 'arg 1', 'arg 2');
                expect(spy).toHaveBeenCalledWith('a message', 'arg 1', 'arg 2');
            });

        });
    }

    ['writeMessage', 'writeSuccess', 'writeWarning', 'writeError'].forEach(testLogger);

    describe("API `callback`", function () {
        it("should be called when defined without `options` arg", function () {
            spies.validateHook = function () {
                this.validators.sequence = [];
            };

            var validatorInstance = new Validator('test');
            var wasCalled = false;
            validatorInstance.validate(function () {
                wasCalled = true;
            });

            expect(wasCalled).toBe(true);
        });

        it("should be called when defined with the`options` arg", function () {
            spies.validateHook = function () {
                this.validators.sequence = [];
            };
            var validatorInstance = new Validator('test');
            var wasCalled = false;
            validatorInstance.validate({}, function () {
                wasCalled = true;
            });

            expect(wasCalled).toBe(true);
        });

        it("should be call with an err argument as an Error", function () {
            spies.validateHook = function () {
                this.validators.sequence = ['raiseError'];
                this.raiseError = function () {
                    this.resume(new Error("An error occurred"));
                };
            };

            var validatorInstance = new Validator('test');
            var callbackErr;
            validatorInstance.validate(function (err) {
                callbackErr = err;
            });

            expect(callbackErr instanceof Error).toBe(true);
        });

        it("should be call with the `report`", function () {
            spies.validateHook = function () {
                this.validators.sequence = [];
            };

            var validatorInstance = new Validator('test');
            var callbackReport;
            validatorInstance.validate(function (err, report) {
                callbackReport = report;
            });

            expect(callbackReport.runs).toEqual(0);
        });
    });
});
