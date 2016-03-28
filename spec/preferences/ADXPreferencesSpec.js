describe('ADCPreferences', function () {
    var fs = require('fs');
    var path = require('path');
    var adcPreferences,
        msg,
        errMsg,
        spies = {},
        common;

    function runSync(fn) {
        var wasCalled = false;
        runs(function () {
            fn(function () {
                wasCalled = true;
            });
        });
        waitsFor(function () {
            return wasCalled;
        });
    }

    beforeEach(function () {
        adcPreferencesKey = require.resolve('../../app/preferences/ADCPreferences.js');

        delete require.cache[adcPreferencesKey];
        adcPreferences = require('../../app/preferences/ADCPreferences.js');

        common = require('../../app/common/common.js');
        msg = common.messages.message;
        errMsg = common.messages.error;

        // Court-circuit the access of the filesystem
        spies.fs = {
            readFile: spyOn(fs, 'readFile'),
            writeFile: spyOn(fs, 'writeFile'),
            mkdir: spyOn(fs, 'mkdir')
        };

        spies.writeError = spyOn(common, 'writeError');
        spies.writeSuccess = spyOn(common, 'writeSuccess');
        spies.writeMessage = spyOn(common, 'writeMessage');
        spies.dirExists = spyOn(common, 'dirExists');

        process.env.APPDATA = '\\username.domain\\AppData\\Roaming';
    });

    describe('#read', function () {
        it("should try to read the `preferences.json` file", function () {
            var fileRead;
            spies.fs.readFile.andCallFake(function (filePath) {
                fileRead = filePath;
            });
            adcPreferences.read();
            expect(fileRead).toEqual(path.join(process.env.APPDATA, common.APP_NAME, common.PREFERENCES_FILE_NAME));
        });
        it("should output the `No preferences defined` when the `preferences.json` file is not found", function () {
            spies.fs.readFile.andCallFake(function (filePath, cb) {
                cb(new Error('AN ERROR'));
            });
            adcPreferences.read();
            expect(spies.writeMessage).toHaveBeenCalledWith(msg.noPreferences);
        });
        it("should output the user preferences from preferences.json", function () {
            var obj = {
                author  : {
                    name : "the name",
                    email : "the@email.com",
                    company : "the company",
                    website : "the website"
                }
            };
            spies.fs.readFile.andCallFake(function (f, cb) {
                cb(null, JSON.stringify(obj));
            });
            adcPreferences.read();
            expect(spies.writeMessage).toHaveBeenCalledWith(JSON.stringify(obj, null, 2));
        });
        it("should return the preferences in the callback when it's defined", function () {
            var obj = {
                author  : {
                    name : "the name",
                    email : "the@email.com",
                    company : "the company",
                    website : "the website"
                }
            };
            spies.fs.readFile.andCallFake(function (f, cb) {
                cb(null, JSON.stringify(obj));
            });
            runSync(function (done) {
                adcPreferences.read(function (preferences) {
                    expect(preferences).toEqual(obj);
                    done();
                });
            });
        });
        it("should not output at all when the `options.silent` is true and the file is not found", function () {
            spies.fs.readFile.andCallFake(function (filePath, cb) {
                cb(new Error('AN ERROR'));
            });
            adcPreferences.read({silent : true});
            expect(spies.writeMessage).not.toHaveBeenCalled();
        });
        it("should not output at all when the `options.silent` is true and the file is found", function () {
            var obj = {
                author  : {
                    name : "the name",
                    email : "the@email.com",
                    company : "the company",
                    website : "the website"
                }
            };
            spies.fs.readFile.andCallFake(function (f, cb) {
                cb(null, JSON.stringify(obj));
            });
            adcPreferences.read({silent : true});
            expect(spies.writeMessage).not.toHaveBeenCalled();
        });
    });

    describe('#write', function () {
        it("should not try to write in the `preferences.json` file if no options is define", function () {
            runSync(function (done) {
                spies.fs.readFile.andCallFake(function (filePath, cb) {
                    cb(new Error('AN ERROR'));
                });
                adcPreferences.write(null, function () {
                    expect(spies.fs.writeFile).not.toHaveBeenCalled();
                    done();
                });
            });
        });

        it("should try to write the specified information in the `preferences.json` file", function () {
            var obj = {
                author  : {
                    name : "the name",
                    email : "the@email.com",
                    company : "the company",
                    website : "the website"
                }
            };
            spies.fs.mkdir.andCallFake(function (p, cb) {
              cb();
            });
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(new Error("An error"), null);
            });
            runSync(function (done) {
                spies.fs.writeFile.andCallFake(function (filePath, content) {
                    expect(filePath).toEqual(path.join(process.env.APPDATA, common.APP_NAME, common.PREFERENCES_FILE_NAME));
                    expect(content).toEqual(JSON.stringify(obj));
                    done();
                });
                adcPreferences.write(obj);
            });
        });

        it("should update the existing preferences", function () {
            var objRead = {
                author  : {
                    name : "the name",
                    email : "the@email.com"
                }
            };
            var obj = {
                author  : {
                    email : "anew@email.com",
                    company : "add a company",
                    website : "add a website"
                }
            };
            var expectedObj = {
                author  : {
                    name : "the name",
                    email : "anew@email.com",
                    company : "add a company",
                    website : "add a website"
                }
            };
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(null, JSON.stringify(objRead));
            });
            spies.fs.mkdir.andCallFake(function (p, cb) {
                cb();
            });
            runSync(function (done) {
                spies.fs.writeFile.andCallFake(function (p, content) {
                    expect(content).toEqual(JSON.stringify(expectedObj));
                    done();
                });
                adcPreferences.write(obj);
            });
        });

        it("should return the preferences in the callback when it's defined", function () {
            var objRead = {
                author  : {
                    name : "the name",
                    email : "the@email.com"
                }
            };
            var obj = {
                author  : {
                    email : "anew@email.com",
                    company : "add a company",
                    website : "add a website"
                }
            };
            var expectedObj = {
                author  : {
                    name : "the name",
                    email : "anew@email.com",
                    company : "add a company",
                    website : "add a website"
                }
            };
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(null, JSON.stringify(objRead));
            });
            spies.fs.mkdir.andCallFake(function (p, cb) {
                cb();
            });
            spies.fs.writeFile.andCallFake(function (p, content, options, cbbWrite) {
                spies.fs.readFile.andCallFake(function (p, cbRead) {
                    cbRead(null, content);
                });
                cbbWrite();
            });
            runSync(function (done) {
                adcPreferences.write(obj, function (result) {
                    expect(result).toEqual(expectedObj);
                    done();
                });
            });
        });
    });

});