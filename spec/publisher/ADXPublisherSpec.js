describe('ADXPublisher', function(){
    var fs					= require('fs'),
        spies               = {},
        ADXPublisher 		= require("../../app/publisher/ADXPublisher.js"),
        Publisher           = ADXPublisher.Publisher,
        platforms           = ADXPublisher.platforms,
        common				= require('../../app/common/common.js'),
        errMsg				= common.messages.error,
        Configurator 		= require('../../app/configurator/ADXConfigurator.js').Configurator,
        preferences         = require('../../app/preferences/ADXPreferences.js');


    function PublisherFake(configurator, preferences, options) {
        this.configurator = configurator;
        this.preferences = preferences;
        this.options = options;
        this.afterConstructor.apply(this, arguments);
    }
    
    PublisherFake.prototype.afterConstructor = function () {};
    PublisherFake.prototype.publish = function (callback) {};

    beforeEach(function() {
        platforms['Fake'] = {
            PublisherFake : PublisherFake
        };
        spies.subPublisher = {
            constructor : spyOn(PublisherFake.prototype, 'afterConstructor'),
            publish : spyOn(PublisherFake.prototype, 'publish')
        };

        spies.subPublisher.publish.andCallFake(function (cb) {cb();});

        spies.readPreferences = spyOn(preferences, 'read');

        spies.readPreferences.andCallFake(function(a, cb) {
            cb({});
        });
    });

    function runSync(fn) {
        var wasCalled = false;
        runs( function () {
            fn(function () {
                wasCalled = true;
            });
        });
        waitsFor( function () {
            return wasCalled;
        });
    }
    
    describe("#constructor", function() {
        
        it("should instantiate the publisher with a good `configurator` argument", function() {
            var conf = new Configurator('.');
            var publisher = new Publisher(conf);
            expect(publisher.configurator).toBe(conf);
        });
        
        it("should throw an error when the `configurator` argument is not correct", function() {
            expect(function() {
                var publisher = new Publisher({});
            }).toThrow(errMsg.invalidConfiguratorArg);
        });

    });

    describe("#publish", function() {
        
        it("should return an error when the platform argument is unknown", function() {
            runSync(function (done) {
                var publisher = new Publisher(new Configurator('.'));
                publisher.publish("unknown publisher", null, function (err) {
                    expect(err.message).toEqual(errMsg.invalidPlatformArg);
                    done();
                });
            });
        });

        it("should return an error when the `platform` argument is not specified", function() {
            runSync(function (done) {
                var publisher = new Publisher(new Configurator('.'));
                publisher.publish(undefined, null, function (err) {
                    expect(err.message).toEqual(errMsg.missingPlatformArg);
                    done();
                });
            });
        });

        it("should instantiate the right `platform`", function() {
            runSync(function (done) {
                var publisher = new Publisher(new Configurator('.'));
                publisher.publish('Fake', {}, function (err) {
                    expect(spies.subPublisher.constructor).toHaveBeenCalled();
                    done();
                });
            });
        });

        it("should instantiate the right `platform` with configurator, preferences and options", function() {
            var prefs = {'key' : 'value'}
            spies.readPreferences.andCallFake(function(a, cb) {
                cb(prefs);
            });
            runSync(function (done) {
                var configurator = new Configurator('.');
                var opts = {opt1 : 'value1'};
                var publisher = new Publisher(configurator);
                publisher.publish('Fake', opts , function (err) {
                    expect(spies.subPublisher.constructor).toHaveBeenCalledWith(configurator, prefs, opts);
                    done();
                });
            });
        });

        it("should call #publish method on the right `platform` argument", function() {
            runSync(function (done) {
                var publisher = new Publisher(new Configurator('.'));
                publisher.publish('Fake', {}, function (err) {
                    expect(PublisherFake.prototype.publish).toHaveBeenCalled();
                    done();
                });
            });
        });

        it("should return an error when the `platform` return an error", function () {
            var subPublisherError = new Error("SOMETHING WRONG");
            spies.subPublisher.publish.andCallFake(function (cb) {
                cb(subPublisherError);
            });

            runSync(function (done) {
                var publisher = new Publisher(new Configurator('.'));
                publisher.publish('Fake', {}, function (err) {
                    expect(err).toBe(subPublisherError);
                    done();
                });
            });
        });
    });
});