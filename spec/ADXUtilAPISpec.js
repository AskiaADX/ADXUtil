describe('ADCUtilAPI', function () {
    var fs = require('fs');
    var pathHelper = require('path');
    var InteractiveADXShell = require('../app/common/InteractiveADXShell.js').InteractiveADXShell;
    var wrench = require('wrench');
    var ADC,
        adcUtilApi,
        errMsg,
        adcValidator,
        Validator,
        adcBuilder,
        Builder,
        adcShow,
        Show,
        adcGenerator,
        Generator,
        adcConfigurator,
        Configurator,
        adcPreferences,
        preferences,
        spies = {},
        common;

    function runSync(fn) {
        var wasCalled = false;
        runs( function () {
            fn(function () {
                wasCalled = true;
            });
        });
        waitsFor(function () {
            return wasCalled;
        });
    }

    beforeEach(function () {
        adcUtilApi = require.resolve('../app/ADCUtilAPI.js');
        if (adcUtilApi) {
            delete require.cache[adcUtilApi];
        }

        adcUtilApi = require('../app/ADCUtilAPI.js');
        ADC = adcUtilApi.ADC;

        common = require('../app/common/common.js');
        errMsg     = common.messages.error;
        spies.getTemplateList = spyOn(common, 'getTemplateList');

        // Court-circuit the access of the filesystem
        spies.fs = {
            stat        : spyOn(fs, 'stat'),
            exists      : spyOn(fs, 'exists'),
            readdirSync : spyOn(fs, 'readdirSync'),
            readdir     : spyOn(fs, 'readdir'),
            readFile    : spyOn(fs, 'readFile'),
            mkdir       : spyOn(fs, 'mkdir')
        };

        adcValidator = require('../app/validator/ADCValidator.js');
        Validator = adcValidator.Validator;
        spies.validate = spyOn(Validator.prototype, 'validate');

        adcBuilder = require('../app/builder/ADCBuilder.js');
        Builder = adcBuilder.Builder;
        spies.build = spyOn(Builder.prototype, 'build');

        adcShow = require('../app/show/ADCShow.js');
        Show = adcShow.Show;
        spies.show = spyOn(Show.prototype, 'show');

        adcGenerator = require('../app/generator/ADCGenerator.js');
        Generator = adcGenerator.Generator;
        spies.generate = spyOn(Generator.prototype, 'generate');

        adcConfigurator = require('../app/configurator/ADCConfigurator.js');
        Configurator = adcConfigurator.Configurator;
        spies.load = spyOn(Configurator.prototype, 'load');

        adcPreferences = require('../app/preferences/ADCPreferences.js');
        preferences = adcPreferences.preferences;

        // Court-circuit wrench
        spies.wrench = {
            copyDirRecursive : spyOn(wrench, 'copyDirRecursive'),
            readdirRecursive : spyOn(wrench, 'readdirRecursive')
        };

        spies.getTemplatePath = spyOn(common, 'getTemplatePath');
        spies.getTemplatePath.andCallFake(function (name, cb) {
            cb(null, pathHelper.join(common.TEMPLATES_PATH, name));
        });
    });

    describe(".ADC", function () {
        beforeEach(function () {
            spies.fs.statSync = spyOn(fs, 'statSync');
        });

        describe("#constructor", function () {
            it("should be a function", function () {
                expect(typeof ADC).toBe('function');
            });

            it("should initialize the #path property with the value in `arg`", function () {
                var adc = new ADC('some/path');
                expect(adc.path).toBe('some\\path');
            });

            it("should throw an exception when the `adcDir` argument is not defined", function () {
                expect(function () {
                    var adc = new ADC();
                }).toThrow(errMsg.invalidPathArg);
            });

            it("should throw an exception when the `adcdir` is invalid path", function () {
                spies.fs.statSync.andThrow("No such file or directory");
                expect(function () {
                    var adc = new ADC('/invalid/path');
                }).toThrow("No such file or directory");
            });

            it("should initialize a new instance of the InteractiveADXShell in #_adxShell", function () {
                var adc = new ADC('some/path');
                expect(adc._adxShell instanceof InteractiveADXShell).toBe(true);
            });
        });

        describe("#load", function () {
            it("should instantiate a new Configurator object with the path of the ADC", function () {
                var firstInstance, firstInstancePath, secondInstance, secondInstancePath;
                spies.load.andCallFake(function () {
                    firstInstance = this;
                    firstInstancePath = this.path;
                });
                var first = new ADC('first/path');
                first.load();

                spies.load.andCallFake(function () {
                    secondInstance= this;
                    secondInstancePath = this.path;
                });

                var second = new ADC('second/path');
                second.load();


                expect(firstInstance).not.toBe(secondInstance);
                expect(firstInstancePath).toEqual('first\\path');
                expect(secondInstancePath).toEqual('second\\path');
            });
            it("should call the Configurator#load", function () {
                var adc = new ADC('some/path');
                adc.load();
                expect(spies.load).toHaveBeenCalled();
            });
            it("should call the `callback` with Error when the configurator#load failed", function () {
                var err = new Error("fake");
                spies.load.andCallFake(function (cb) {
                    cb(err);
                });
                var adc = new ADC('some/path');
                var callbackErr;
                adc.load(function (e) {
                    callbackErr = e;
                });
                expect(callbackErr).toBe(err);
            });

            it("should call the `callback` after initializing the #configurator", function () {
                var conf, hasBeenCalled = false;
                spies.load.andCallFake(function (cb) {
                    conf = this;
                    cb(null);
                });
                var adc = new ADC('some/path');
                adc.load(function (e) {
                    expect(adc.configurator).toBe(conf);
                    hasBeenCalled = true;
                });
                expect(hasBeenCalled).toBe(true);
            });
        });

        describe("#validate", function () {
            it("should instantiate a new Validator object with the path of the ADC", function () {
                var firstInstance, firstInstancePath, secondInstance, secondInstancePath;
                spies.validate.andCallFake(function () {
                    firstInstance = this;
                    firstInstancePath = this.adcDirectoryPath;
                });
                var first = new ADC('first/path');
                first.validate();

                spies.validate.andCallFake(function () {
                    secondInstance= this;
                    secondInstancePath = this.adcDirectoryPath;
                });

                var second = new ADC('second/path');
                second.validate();


                expect(firstInstance).not.toBe(secondInstance);
                expect(firstInstancePath).toEqual('first\\path');
                expect(secondInstancePath).toEqual('second\\path');
            });
            it("should call the Validator#validate with the arguments", function () {
                var adc = new ADC('some/path');
                var cb = function () {};
                adc.validate({}, cb);
                expect(spies.validate).toHaveBeenCalledWith({
                    adxShell : adc._adxShell
                }, cb);
            });
        });

        describe("#build", function () {
            it("should instantiate a new Builder object with the path of the ADC", function () {
                var firstInstance, firstInstancePath, secondInstance, secondInstancePath;
                spies.build.andCallFake(function () {
                    firstInstance = this;
                    firstInstancePath = this.adcDirectoryPath;
                });
                var first = new ADC('first/path');
                first.build();

                spies.build.andCallFake(function () {
                    secondInstance= this;
                    secondInstancePath = this.adcDirectoryPath;
                });

                var second = new ADC('second/path');
                second.build();


                expect(firstInstance).not.toBe(secondInstance);
                expect(firstInstancePath).toEqual('first\\path');
                expect(secondInstancePath).toEqual('second\\path');
            });
            it("should call the Builder#build with the arguments", function () {
                var adc = new ADC('some/path');
                var cb = function () {};
                adc.build({}, cb);
                expect(spies.build).toHaveBeenCalledWith({
                    adxShell : adc._adxShell
                }, cb);
            });
        });

        describe("#show", function () {
            it("should instantiate a new Show object with the path of the ADC", function () {
                var firstInstance, firstInstancePath, secondInstance, secondInstancePath;
                spies.show.andCallFake(function () {
                    firstInstance = this;
                    firstInstancePath = this.adcDirectoryPath;
                });
                var first = new ADC('first/path');
                first.show();

                spies.show.andCallFake(function () {
                    secondInstance= this;
                    secondInstancePath = this.adcDirectoryPath;
                });

                var second = new ADC('second/path');
                second.show();


                expect(firstInstance).not.toBe(secondInstance);
                expect(firstInstancePath).toEqual('first\\path');
                expect(secondInstancePath).toEqual('second\\path');
            });
            it("should call the Show#show with the arguments", function () {
                var adc = new ADC('some/path');
                var cb = function () {};
                adc.show({}, cb);
                expect(spies.show).toHaveBeenCalledWith({
                    adxShell : adc._adxShell
                }, cb);
            });
        });

        describe('#getFixtureList', function () {
            it('should return the names of xml file under the `tests/fixtures` path', function () {
                spies.fs.readdir.andCallFake(function (path, cb) {
                    if (path === pathHelper.join('some/path', common.FIXTIRES_DIR_PATH)) {
                        cb(null, ['no-fixture.doc', 'fixture1.xml', 'fixture2.xml', 'fixture3.xml', 'no-fixture', 'no-fixture.txt', 'fixture4.xml']);
                    } else {
                        cb(new Error('No such file or directory'));
                    }
                });
                var adc = new ADC('some/path');
                var wasCalled = false;
                adc.getFixtureList(function (err, list) {
                    wasCalled = true;
                    expect(list).toEqual(['fixture1.xml', 'fixture2.xml', 'fixture3.xml','fixture4.xml'])
                });
                expect(wasCalled).toBe(true);
            });
        });

        describe('#checkFixtures', function () {
            it("should copy `tests/fixtures` directory of the `blank` template if it  doesn't exist", function () {
                spyOn(common, 'dirExists').andCallFake(function (p, cb) {
                    cb(null, false);
                });
                spies.fs.mkdir.andCallFake(function (p, cb) {
                    cb();
                });

                runSync(function (done) {
                    spies.wrench.copyDirRecursive.andCallFake(function (source, dest) {
                        expect(source).toEqual(pathHelper.join(pathHelper.resolve(__dirname, "../"), common.TEMPLATES_PATH, common.DEFAULT_TEMPLATE_NAME, common.FIXTIRES_DIR_PATH));
                        expect(dest).toEqual(pathHelper.join('adc/path', common.FIXTIRES_DIR_PATH));
                        done();
                    });

                    var adc= new ADC('adc/path');
                    adc.checkFixtures();
                });
            });

            it("should call the callback arg when the copy is finish", function () {
                spyOn(common, 'dirExists').andCallFake(function (p, cb) {
                    cb(null, false);
                });
                spies.fs.mkdir.andCallFake(function (p, cb) {
                    cb();
                });
                spies.wrench.copyDirRecursive.andCallFake(function (source, dest, options, cb) {
                    cb();
                });


                runSync(function (done) {
                    var adc= new ADC('adc/path');
                    adc.checkFixtures(function () {
                        expect(true).toBe(true);
                        done();
                    });
                });
            });
        });

        describe(".generate", function () {

            it("should be a static function", function () {
               expect(typeof ADC.generate).toBe('function');
            });

            it("should call the Generator#generate with the `name` and `options` arguments", function () {
                var opt = {}, n = 'test', options, name;
                spies.generate.andCallFake(function (a, b) {
                    name = a;
                    options = b;
                });
                ADC.generate(n, opt);
                expect(name).toBe(n);
                expect(options).toBe(opt);
            });

            it("should not call the Generator#generate with the `callback` with the `options` is not defined", function () {
                var cb = function () {}, n = 'test', callback, name;
                spies.generate.andCallFake(function (a, b) {
                    name = a;
                    callback = b;
                });
                ADC.generate(n, cb);
                expect(name).toBe(n);
                expect(callback).not.toBe(cb);
            });

            it("should call the Generator#generate with different `callback` arguments", function () {
                var cb = function (){}, callback;
                spies.generate.andCallFake(function (a, b, c) {
                    callback = c;
                });
                ADC.generate('', {}, cb);
                expect(typeof callback).toBe('function');
                expect(callback).not.toBe(cb);
            });

            it("should call the callback with a Error from the generator", function () {
                var err = new Error("fake");
                spies.generate.andCallFake(function (a, b, c) {
                    c(err);
                });
                var callbackErr;
                ADC.generate('', {}, function (e) {
                    callbackErr = e;
                });
                expect(err).toBe(callbackErr);
            });

            it("should call the callback with a new instance of the ADC initialize with the outputPath", function () {
                spies.generate.andCallFake(function (a, b, c) {
                    c(null, '/output/path');
                });
                var adc;
                ADC.generate('', {}, function (err, inst) {
                    adc = inst;
                });
                expect(adc instanceof ADC).toBe(true);
                expect(adc.path).toBe('\\output\\path');
            });
        });

        describe(".getTemplateList", function () {
           it("should return the list of template", function () {
               spies.getTemplateList.andCallFake(function (cb) {
                  cb(null, [{
                      name : 'template1',
                      path : 'path/of/template1'
                  },{
                      name : 'template2',
                      path : 'path/of/template2'
                  }]);
               });
               ADC.getTemplateList(function (err, dirs) {
                  expect(dirs).toEqual([{
                      name : 'template1',
                      path : 'path/of/template1'
                  },{
                      name : 'template2',
                      path : 'path/of/template2'
                  }]);
               });
           });
        });

        describe('.preferences', function () {
            it("should be an instance of the Preferences object", function () {
                expect(ADC.preferences).toBe(preferences);
            });
        });

    });
});