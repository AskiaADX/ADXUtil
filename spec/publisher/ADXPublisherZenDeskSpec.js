describe("ADXPublisherZenDesk", function(){
   
    //TODO : watch if all of these requires are really needed
    var fs					=	require('fs'),
        Publisher 			=	require("../../app/publisher/ADXPublisher.js").Publisher,
        spies				=	{},
        options				=	{},
        common				=	require('../../app/common/common.js'),
        errMsg				=	common.messages.error,
        Configurator 		=   require('../../app/configurator/ADXConfigurator.js').Configurator,
        PublisherZenDesk	=	require('../../app/publisher/ADXPublisherZenDesk.js').PublisherZenDesk;
    
    
    beforeEach(function(){
        spies.fs = {
            readFile : spyOn(fs, 'readFile'),
         };
        options = {
            username	:	'zendesk@askia.com',
            token		:	'Mx9DJLsHVdBXu8SiUuAzfNkGW01ocYSOgXC7ELXW',
            remoteUri	:	'https://askia1467714213.zendesk.com/api/v2/help_center',
            helpcenter : true,
            promoted : false,
            comments_disabled : false,
            section_title : 'the_section_title'
        };
        
    });
    
    describe("#Constructor", function(){
       
        it("should throw an error when the `configurator` argument is invalid or missing", function(){
            expect(function(){
            	var publisherZenDesk = new PublisherZenDesk({});    
            }).toThrow(errMsg.invalidConfiguratorArg);
        });
        
    });
   
    describe("#findSectionIdByTitle", function(){
        
        it("should throw an error when the `title` argument is missing or invalid", function(){
            expect(function(){
                var config = new Configurator('.');
                publisherZenDesk = new PublisherZenDesk(config, options);
                publisherZenDesk.findSectionIdByTitle({});
            }).toThrow(errMsg.invalidSectionTitleArg)
        });

        it("should return an id formated number when the section exists", function(){
            var config = new Configurator('.');
            publisherZenDesk = new PublisherZenDesk(config, options);
            spies.fakeSectionId = spyOn(PublisherZenDesk.prototype, 'findSectionIdByTitle').andReturn(Math.floor(Math.random() * 999999999));
            var id = publisherZenDesk.findSectionIdByTitle('f');
            expect(id).toMatch(/[0-9]+/);
        });

        it("should throw an error when the section doesn't exist", function(){
            expect(function(){
                var config = new Configurator('.');
                publisherZenDesk = new PublisherZenDesk(config, options);
                publisherZenDesk.findSectionIdByTitle("|||\\]]]\!@#$^%^^^PQQ");
            }).toThrow(errMsg.unexistingSection);
        });
        
    });
    
    describe("#createArticle",function(){
       
        it("should return a JSON object with an article pattern", function(){

            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, options);

            config.info = {
                name:  'test-adx'
            };
                
            spies.fs.readFile.andReturn('the_body');
			
            spies.fakeSectionId = spyOn(PublisherZenDesk.prototype, 'findSectionIdByTitle').andReturn(12);
        	
            var id = publisherZenDesk.findSectionIdByTitle('f');
          
            var actual = publisherZenDesk.createArticle();


            expect(actual).toEqual({
                article : {
                    title:'test-adx',
                    body:'the_body',
                    promoted:false,
                    comments_disabled : false,
                    section_id: 12
                }
            });

        });
    });
    
});