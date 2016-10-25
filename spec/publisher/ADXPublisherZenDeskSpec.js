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
        attachmentsLists = {
            article_attachments : [
                {
                    "id":           1428,
                    "article_id":   23,
                    "file_name":    "preview.png",
                    "content_url":  "https://aski.zendesk.com/hc/article_attachments/200109629/preview.png",
                    "content_type": "application/png",
                    "size":         1428,
                    "inline":       true
                },
                {
                    "id":           2857,
                    "article_id":   23,
                    "file_name":    "test-adx.qex",
                    "content_url":  "https://company.zendesk.com/hc/article_attachments/200109629/test-adx.qex",
                    "content_type": "application/qex",
                    "size":         58298,
                    "inline":       false
                },
                {
                    "id":           3485,
                    "article_id":   23,
                    "file_name":    "test-adx.adc",
                    "content_url":  "https://company.zendesk.com/hc/article_attachments/200109629/test-adx.adc",
                    "content_type": "application/adc",
                    "size":         58298,
                    "inline":       false
                }
            ]
        },
        article = {
            article : {
                "id":                1635,
                "author_id":         3465,
                "draft":             true,
                "comments_disabled": false
            }
        },
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
                },
                show : function (id, cb) {
                    cb(article);
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
            },
            articleattachments : {
                list : function (articleId, cb) {
                    cb(null, 200, attachmentsLists);
                },
                delete : function (id, cb) {
                    cb(null);
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
                name 		: 'test-adx',
                constraints : {
                    questions : {
                        single : true,
                        multiple : true,
                        open : false
                    },
                    controls : {
                        label : true,
                        responseblock : true
                    },
                    responses : {
                        min : 2,
                        max : '*'
                    }
                }
            },
            properties : {
                categories : [
                    {
                        name: "General",
                        properties: [
                            {
                                id: "renderingType",
                                name: "Rendering type",
                                type: "string",
                                description: "Type of rendering",
                                value: "classic",
                                options: [
                                    {
                                        value: "classic",
                                        text: "Classic"
                                    },
                                    {
                                        value: "image",
                                        text: "Image"
                                    }
                                ]
                            },
                            {
                                id: "other",
                                name: "Open-ended question for semi-open",
                                type: "question",
                                numeric : true,
                                open : true,
                                description: "Additional open-ended question that could be use to emulate semi-open"
                            }
                        ]
                    },
                    {
                        name : "Rendering type images",
                        properties : [
                            {
                                id : "singleImage",
                                name : "Image for single question",
                                type : "file",
                                fileExtension : ".png, .gif, .jpg",
                                description : "Image of single question when the rendering type is image",
                                value : "Single.png"
                            },
                            {
                                id : "multipleImage",
                                name : "Image for multiple question",
                                type : "file",
                                fileExtension : ".png, .gif, .jpg",
                                description : "Image of multiple question when the rendering type is image",
                                value : "Multiple.png"
                            }
                        ]
                    }
                ]
            }
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

            expect(spies.zendesk.createClient).toHaveBeenCalledWith({
                username          	: 'zendesk@askia.com',
                password          	: 'secret',
                remoteUri	      	: 'https://uri/api/v2/help_center',
                helpcenter			: true
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

            it("should eval the body with the right patterns", function () {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                var name = config.get().info.name;
                spies.fs.readFile.andCallFake(function (p, o, cb) {
                    cb(null, '{{ADXProperties:HTML}}, {{ADXListKeyWords}}, {{ADXConstraints}}');
                });

                runSync(function (done) {
                    spyOn(fakeClient.articles, "create").andCallFake(function (id, JSON, cb) {
                        var str = '<table class="askiatable" dir="ltr" cellspacing="0" cellpadding="0"><colgroup><col width="281" /><col width="192" /><col width="867" /></colgroup><tbody><tr><td style="text-transform: uppercase; font-weight: bold;" data-sheets-value="[null,2,&quot;Parameters&quot;]">Parameters</td><td style="text-transform: uppercase; font-weight: bold;" data-sheets-value="[null,2,&quot;Type&quot;]">Type</td><td style="text-transform: uppercase; font-weight: bold;" data-sheets-value="[null,2,&quot;Comments and/or possible value&quot;]">Comments and/or possible value</td></tr><tr><td> </td><td> </td><td> </td></tr>' +
                            '<tr>\n' +
                            '<th data-sheets-value="[null,2,&quot;General&quot;]">General</th>\n' +
                            '<td> </td>\n' +
                            '<td> </td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<td data-sheets-value="[null,2,&quot;Rendering type&quot;]">Rendering type</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;string&quot;]">string</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;Type of rendering classic&quot;,null,null,null,1]">Description : Type of rendering<br/>Value : classic<br/>Options : Classic, Image</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<td data-sheets-value="[null,2,&quot;Open-ended question for semi-open&quot;]">Open-ended question for semi-open</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;question&quot;]">question</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;Additional open-ended question that could be use to emulate semi-open &quot;,null,null,null,1]">Description : Additional open-ended question that could be use to emulate semi-open</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<th data-sheets-value="[null,2,&quot;Rendering type images&quot;]">Rendering type images</th>\n' +
                            '<td> </td>\n' +
                            '<td> </td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<td data-sheets-value="[null,2,&quot;Image for single question&quot;]">Image for single question</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;file&quot;]">file</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;Image of single question when the rendering type is image Single.png&quot;,null,null,null,1]">Description : Image of single question when the rendering type is image<br/>Value : Single.png</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<td data-sheets-value="[null,2,&quot;Image for multiple question&quot;]">Image for multiple question</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;file&quot;]">file</td>\n' +
                            '<td data-sheets-value="[null,2,&quot;Image of multiple question when the rendering type is image Multiple.png&quot;,null,null,null,1]">Description : Image of multiple question when the rendering type is image<br/>Value : Multiple.png</td>\n' +
                            '</tr>\n' +
                            '</tbody></table>, ' +
                            'adc; adc2; javascript; control; design; askiadesign; test-adx, ' +
                            'This control is compatible with ' + 
                            'single, multiple' +
                            ' questions.\n Number minimum of responses : 2' +
                            '.\n Number maximum of responses : *' +
                            '.\n You can use the following controls : ' +
                            'label, responseblock.';

                        expect(JSON.article.body).toEqual(str);
                        done();
                    });
                    publisherZenDesk.publish(function() {});

                });
            });
        });

        describe("deleteAttachments", function(){
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

            it("should output an error when it could not retrieve the list of attachments within the article", function () {
                var config = new Configurator('.');
                var error = new Error('An error');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                    cb(null, null, [
                        {id : 1, name : "test-adx"}
                    ]);
                });
                spyOn(fakeClient.articleattachments, "list").andCallFake(function (id, cb) {
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

            it("should delete the article's attachments when it found one article with the same name and if it have attachments", function () {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                    cb(null, null, [
                        {id : 1, name : "test-adx"}
                    ]);
                });

                runSync(function (done) {
                    var deleteMock = spyOn(fakeClient.articleattachments, "delete");
                    publisherZenDesk.publish(function() {});
                    expect(deleteMock).toHaveBeenCalled();
                    done();
                });
            });

            it("should not delete article's attachments when it not found the article", function () {
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);

                runSync(function (done) {
                    var deleteMock = spyOn(fakeClient.articleattachments, "list");
                    publisherZenDesk.publish(function() {});
                    expect(deleteMock).not.toHaveBeenCalled();
                    done();
                });
            });
            
            it("should return the id of the article whitch already exist", function () {
                var config = new Configurator('.');
                var error = new Error('An error');
                var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                    cb(null, null, [
                        {id : 1, name : "test-adx"}
                    ]);
                });

                runSync(function (done) {
                    spyOn(fakeClient.articles, "show").andCallFake(function (id, cb) {
                        expect(id).toEqual(1);
                        done();
                    });
                    publisherZenDesk.publish(function() {});
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

            function testPost(o, index) {
                it("should call request.post with the correct arguments for " + o.name, function() {
                    var config = new Configurator('.');
                    var publisherZenDesk = new PublisherZenDesk(config, {}, options);
                    var name = config.get().info.name;
                    o.path = path.resolve(path.join(config.path, o.suffix));
                    var n = 0;


                    runSync(function (done) {
                        spies.request.post.andCallFake(function (obj, cb) {
                            if (index === n) {
                                expect(obj).toEqual({
                                    url		: "https://uri/api/v2/help_center/articles/12/attachments.json",
                                    formData: {
                                        file : o.path
                                    },
                                    headers : {
                                        'Authorization' : "Basic " + new Buffer("zendesk@askia.com:mdp").toString('base64')
                                    }
                                })
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
            }

            [
                {
                    name 	: "adc",
                    suffix 	: path.join(common.ADC_PATH, 'test-adx.adc')
                },
                {
                    name 	: "qex",
                    suffix 	: path.join(common.QEX_PATH, 'test-adx.qex')
                }, 
                {
                    name 	: "png",
                    suffix 	: 'preview.png'
                }
            ].forEach(testPost);
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
    });
});
