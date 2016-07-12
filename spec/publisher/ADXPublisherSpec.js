
describe('ADXPublisher', function(){
    
    //TODO : watch if all of these requires are really needed
    var fs					=	require('fs'),
        Publisher 			=	require("../../app/publisher/ADXPublisher.js").Publisher,
        spies				=	{},
        common				=	require('../../app/common/common.js'),
        errMsg				=	common.messages.error,
        Configurator 		=   require('../../app/configurator/ADXConfigurator.js').Configurator,
        PublisherZenDesk	=	require('../../app/publisher/ADXPublisherZenDesk.js').PublisherZenDesk;
    
    
    
    
    
    beforeEach(function(){
       spies.ZenDesk = { publish: spyOn(PublisherZenDesk.prototype, "publish")};
       
    });
    
    
    describe("#constructor", function(){
        
        it("should instantiate the publisher with a good `configurator` argument", function(){
            var conf = new Configurator('.');
            var publisher = new Publisher(conf);
            expect(publisher.configurator).toBe(conf);
        });
        
        it("should throw an error when the `configurator` argument is not correct", function(){
            expect(function(){
                var publisher = new Publisher({});
            }).toThrow(errMsg.invalidConfiguratorArg);
        });
        
        
    });
    
    
    describe("#publish", function(){
        
        it("should throw an exception when the platform argument is unknown", function(){
            expect(function(){
                var publisher = new Publisher(new Configurator('.'));
                publisher.publish("unknown publisher");
            }).toThrow(errMsg.invalidPlatformArg);
        });
        
        it("should throw an error when the `platform` argument is not specified", function(){
             expect(function(){
                var publisher = new Publisher(new Configurator('.'));
                publisher.publish();
            }).toThrow(errMsg.missingPlatformArg);
        });
        
        
        it("should call #publish method on the right `platform` argument", function(){
            var expected = [];
            var actual = [];
            var platform;
            function createPublisher(name) {
                expected.push(name);
                function FakePublisher(){}
                FakePublisher.prototype.publish = function () {
                  	actual.push(name);  
                };
                return FakePublisher ;
            }
            for (platform in common.PUBLISH_PLATFORMS) {
                if (common.PUBLISH_PLATFORMS.hasOwnProperty(platform)) {
                 	common.PUBLISH_PLATFORMS[platform]['Publisher' + platform] = createPublisher(platform);   
                }
            }
            
            var publisher = new Publisher(new Configurator('.'));
            
            for (platform in common.PUBLISH_PLATFORMS) {
                if (common.PUBLISH_PLATFORMS.hasOwnProperty(platform)) {     	
            		publisher.publish(platform, {});
                }
            }
            expect(expected).toEqual(actual);
        });

    });
    // var publisher = new Publisher(configurator);
    // publisher.publish('ZenDesk', {}, function () {});
    
    // var z = new ZenDeskPublisher();
    // z.publish(configurator, options, callback);
    
});