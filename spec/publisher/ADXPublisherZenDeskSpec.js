describe("ADXPublisherZenDesk", function() {
    var fs					= require('fs'),
        path            	= require('path'),
        spies				= {},
        sectionLists = [
            {
                name: "a_section",
                id: 40
            },
            {
                name: "section_found",
                id: 60
            }
        ],
        options				= {
            username	:	'zendesk@askia.com',
            remoteUri	:	'https://uri',
            password    :   'mdp',
            promoted    :    false,
            comments_disabled : false,
            section_title : 'a_section',
            surveyDemoUrl : 'http://demo'
        },
        common              = require('../../app/common/common.js'),
        errMsg              = common.messages.error,
        Configurator        = require('../../app/configurator/ADXConfigurator.js').Configurator,
        PublisherZenDesk	= require('../../app/publisher/ADXPublisherZenDesk.js').PublisherZenDesk,
        zenDesk             = require('node-zendesk'),
        request             = require('request'),
        fakeClient          = {
            articles : {
                create : function (id, jsonArticle, cb) {
                    cb(null, null, {
                        id : 12,
                        body : 'something'
                    });
                },
                listBySection : function (id, cb) {
                    cb(null, null, []);
                },
                delete : function (id, cb) {
                    cb(null);
                }
            },
            translations : {
                updateForArticle : function (a, b, c, cb) {
                    cb(null);
                }
            },
            sections : {
                list : function (cb){
                    cb(null, null, sectionLists);
                }
            }
        };

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

    beforeEach(function() {
        spies.configurator = {
            get  : spyOn(Configurator.prototype, 'get')
        };
        spies.configurator.get.andReturn({
            info : {
                name : 'test-adx',
                constraints : {}
            },
            properties : [{
                id : 'something',
                name : 'something'
            }]
        });
        spies.fs = {
            readFile 			: spyOn(fs, 'readFile'),
            stat     			: spyOn(fs, 'stat'),
            createReadStream	: spyOn(fs, 'createReadStream')
        };
        spies.fs.stat.andCallFake(function (p, cb) {
            cb(null, {
                isFile : function () {
                    return true;
                }
            });
        });
        spies.fs.readFile.andCallFake(function (p, o, cb) {
            cb(null, 'a text');
        });
        spies.fs.createReadStream.andCallFake(function (p, o) {
            return p;
        });
        spies.zendesk = {
            createClient : spyOn(zenDesk, 'createClient')
        };
        spies.zendesk.createClient.andReturn(fakeClient);
        spies.request = {
            post : spyOn(request, 'post')
        };
        spies.request.post.andCallFake(function (obj, cb) {
            cb(null, null, JSON.stringify({
                article_attachment : {
                    id : 'an id',
                    file_name : 'a file_name'
                }
            }));
        });
    });

    describe("#Constructor", function() {

        it("should throw an error when the `configurator` argument is missing", function() {
            expect(function() {
                var publisherZenDesk = new PublisherZenDesk();
            }).toThrow(errMsg.missingConfiguratorArg);
        });

        it("should throw an error when the `configurator` argument is invalid", function() {
            expect(function() {
                var publisherZenDesk = new PublisherZenDesk({});
            }).toThrow(errMsg.invalidConfiguratorArg);
        });

        it("should throw an error when options are missing", function() {
            expect(function() {
                var notCompletedOptions = {
                    username	:	'zendesk@askia.com',
                    remoteUri	:	'https://uri',
                    promoted    :    false,
                    comments_disabled : false
                };
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, notCompletedOptions);
            }).toThrow(errMsg.missingPublishArgs + '\n missing argument : password'); //first missing arg here is password
        });

        it('should instantiate the zendesk#configurator when everyting is ok', function () {
            var config = new Configurator('.');

            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.configurator).toBe(config);
        });

        it("should instantiate the zendesk with the right options", function() {

            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.options).toEqual({
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri/api/v2/help_center',
                section_title     : 'a section title'
            });
        });

        it("should instantiate the zendesk#client when everything is ok", function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.client).toBe(fakeClient);
        });

    });

    describe("#publish", function() {

        describe("findSectionIdByTitle", function() {
            it("should output an error when the section is not found", function() {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, {
                    username	:	'zendesk@askia.com',
                    remoteUri	:	'https://uri',
                    password    :   'mdp',
                    promoted    :    false,
                    comments_disabled : false,
                    section_title : 'an unexisting section'
                });

                runSync(function (done) {
                    publisherZenDesk.publish(function(err) {
                        expect(err).not.toBe(null);
                        done();
                    });
                });
            });

            it("should output an error when the section's title is not a string'", function() {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, {
                    username	:	'zendesk@askia.com',
                    remoteUri	:	'https://uri',
                    password    :   'mdp',
                    promoted    :    false,
                    comments_disabled : false,
                    section_title : {name :'an unexisting section'}
                });

                runSync(function (done) {
                    publisherZenDesk.publish(function(err) {
                        expect(err).toBe(errMsg.invalidSectionTitleArg);
                        done();
                    });
                });
            });

            it("should output an error when it could not retrieve the list of sections", function() {
                var config = new Configurator('.');
                var error = new Error('an error');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);

                spyOn(fakeClient.sections, "list").andCallFake(function (cb) {
                    cb(error);
                });

                runSync(function (done) {
                    publisherZenDesk.publish(function(err) {
                        expect(err).toBe(error);
                        done();
                    });
                });
            });

            it("should create an article whith the right section ID", function() {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);

                runSync(function (done) {
                    spyOn(fakeClient.articles, "create").andCallFake(function (id, JSON, cb) {
                        expect(id).toBe(40);
                        done();
                    });

                    publisherZenDesk.publish(function() {});
                });
            });

            it("should find the section with the same name case insensitive", function() {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, {
                    username	:	'zendesk@askia.com',
                    remoteUri	:	'https://uri',
                    password    :   'mdp',
                    promoted    :    false,
                    comments_disabled : false,
                    section_title : 'A_SECTION'
                });

                runSync(function (done) {
                    spyOn(fakeClient.articles, "create").andCallFake(function (id, JSON, cb) {
                        expect(id).toBe(40);
                        done();
                    });

                    publisherZenDesk.publish(function(err) {});
                });
            });
        });

        describe("createJSONArticle", function() {
            it("should output an error when it could not read the article template", function () {
                var config = new Configurator('.');
                var error = new Error('An error');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spies.fs.readFile.andCallFake(function (p, o, cb) {
                    cb(error);
                });

                runSync(function (done) {
                    publisherZenDesk.publish(function(err) {
                        expect(err).toBe(error);
                        done();
                    });
                });
            });

            it("should output an error when the JSON article is not correct", function() {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spies.fs.readFile.andCallFake(function (p, o, cb) {
                    cb(null, "body article");
                });

                runSync(function (done) {
                    spyOn(fakeClient.articles, "create").andCallFake(function (id, JSON, cb) {
                        expect(JSON).toEqual({
                            "article" : {
                                "title": "test-adx",
                                "body": "body article",
                                "promoted": false,
                                "comments_disabled": false
                            }
                        });
                        done();
                    });
                    publisherZenDesk.publish(function() {});
                });
            });
        });
        
        describe("deleteArticle", function(){
            it("should output an error when it could not retrieve the list of article within the section", function () {
                var config = new Configurator('.');
                var error = new Error('An error');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                    cb(error);
                });

                runSync(function (done) {
                    publisherZenDesk.publish(function(err) {
                        expect(err).toBe(error);
                        done();
                    });
                });
            });

            it("should output an error when it found duplicate article title", function () {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                    cb(null, null, [
                        {id : 1, name : "test-adx"},
                        {id : 2, name : "test-adx"}
                    ]);
                });

                runSync(function (done) {
                    publisherZenDesk.publish(function(err) {
                        expect(err).toBe(errMsg.tooManyArticlesExisting);
                        done();
                    });
                });
            });

            it("should delete the article when it found one with the same name", function () {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                    cb(null, null, [
                        {id : 1, name : "test-adx"}
                    ]);
                });

                runSync(function (done) {
                    var deleteMock = spyOn(fakeClient.articles, "delete");
                    var id;
                    deleteMock.andCallFake(function (i) {
                        id = i;
                    });
                    publisherZenDesk.publish(function() {});
                    expect(deleteMock).toHaveBeenCalled();
                    expect(id).toBe(1);
                    done();
                });
            });

            it("should not delete the article when it not found", function () {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);

                runSync(function (done) {
                    var deleteMock = spyOn(fakeClient.articles, "delete");
                    publisherZenDesk.publish(function() {});
                    expect(deleteMock).not.toHaveBeenCalled();
                    done();
                });
            });
        });
        
        describe("uploadAvailableFiles", function() {
            it("should output an error when it could not send the request", function () {
                var config = new Configurator('.');
                var error = new Error('An error');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spies.request.post.andCallFake(function (obj, cb) {
                    cb(error);
                });

                runSync(function (done) {
                    publisherZenDesk.publish(function(err) {
                        expect(err).toBe(error);
                        done();
                    });
                });
            });
        });
        
        describe("update article with attachments", function() {
            it("should call updateForArticle with the attachments", function () {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                var name = config.get().info.name;
                spyOn(fakeClient.articles, "create").andCallFake(function (id, jsonArticle, cb) {
                    cb(null, null, {
                        id : 12,
                        body : '{{ADXQexFileURL}}, {{ADXAdcFileURL}}, {{ADXQexPicture}}, {{ADXSentence:accesSurvey}}'
                    });
                });
                
                runSync(function (done) {
                    spyOn(fakeClient.translations, "updateForArticle").andCallFake(function(id, lang, obj, cb) {
                        var str = '<li>To download the qex file, <a href="/hc/en-us/article_attachments/an id/a file_name">click here</a></li>' + 
                                    ', <a href="/hc/en-us/article_attachments/an id/a file_name">click here</a>' +
                                    ', <p><a href="http://demo" target="_blank"> <img style="max-width: 100%;" src="/hc/en-us/article_attachments/an id/a file_name" alt="" /> </a></p>' +
                                    ', <li><a href="http://demo" target="_blank">To access to the live survey, click on the picture above.</a></li>';
                        
                        expect(obj.body).toEqual(str);
                        done();
                    });
                    publisherZenDesk.publish(function() {});
                    
                });
            });
        });
                
        it("should request to post the adc file when he is present in " + common.ADC_PATH, function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            var name = config.get().info.name;
            var p = path.resolve(path.join(config.path, common.ADC_PATH, name + '.adc'));
            
            runSync(function (done) {
                spies.request.post.andCallFake(function (obj, cb) {
                    expect(obj.formData).toEqual({
                        file : p
                    });
                    done();
                });
                publisherZenDesk.publish(function() {});
            });
        });

        it("should request to post the qex file when he is present in " + common.QEX_PATH, function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            var name = config.get().info.name;
            var p = path.resolve(path.join(config.path, common.QEX_PATH, name + '.qex'));
            var n = 0;
            
            runSync(function (done) {
                spies.request.post.andCallFake(function (obj, cb) {
                    if (n === 1) {
                        expect(obj.formData).toEqual({
                            file : p
                        });
                        done();
                    }
                    n++;
                    cb(null, null, JSON.stringify({
                        article_attachment : {
                            id : 'an id',
                            file_name : 'a file_name'
                        }
                    }));
                });
                publisherZenDesk.publish(function() {});
            });
        });
           
        it("should request to post the png file when he is present in root", function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            var name = config.get().info.name;
            var p = path.resolve(path.join(config.path, 'preview.png'));
            var n = 0;
            
            runSync(function (done) {
                spies.request.post.andCallFake(function (obj, cb) {
                    if (n === 2) {
                        expect(obj.formData).toEqual({
                            file : p
                        });
                        done();
                    }
                    n++;
                    cb(null, null, JSON.stringify({
                        article_attachment : {
                            id : 'an id',
                            file_name : 'a file_name'
                        }
                    }));
                });
                publisherZenDesk.publish(function() {});
            });
        });
        
        it("should output an error when the .adc file is missing in " + common.ADC_PATH, function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            spies.fs.stat.andCallFake(function (p, cb) {
                if (/test-adx\.adc$/.test(p)) {
                    cb(new Error('something wrong'));
                    return;
                }
                cb(null, {
                    isFile : function () {
                        return true;
                    }
                });
            });

            runSync(function (done) {
                publisherZenDesk.publish(function(err) {
                    expect(err).toBe(errMsg.badNumberOfADCFiles);
                    done();
                });
            });
        });
    });
});
