var zenDesk         = require('node-zendesk');
var fs              = require('fs');
var common          = require('../common/common.js');
var path            = require('path');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var request         = require('request');

/**
 * Instantiate a PublisherZendesk
 * @param {Configurator} configurator the configuration of the article
 * @param {Object} preferences User preferences
 * @param {Object} options Options of the platform, if the options are not specified the user preferences will be loaded.
 */
function PublisherZenDesk(configurator, preferences, options) {

    if (!configurator) {
        throw new Error(errMsg.missingConfiguratorArg);
    }

    if (!(configurator instanceof Configurator)) {
        throw new Error(errMsg.invalidConfiguratorArg);
    }

    this.options = options || {};
    this.configurator = configurator;

    if (preferences) {
        for (var option in preferences.zendesk) {
            if (preferences.zendesk.hasOwnProperty(option)) {
                if (!(option in this.options)) {
                    this.options[option] = preferences.zendesk[option];
                }
            }
        }
    }

    // All of these options must be present either in the command line either in the preference file of the user
    var neededOptions = ['username', 'password', 'remoteUri', 'promoted', 'comments_disabled', 'section_title'];
    for (var i = 0, l = neededOptions.length; i < l; i++) {
        var neededOption = neededOptions[i];
        if (!this.options.hasOwnProperty(neededOption)) {
            throw new Error(errMsg.missingPublishArgs + '\n missing argument : ' + neededOption);
        }
    }
    
    this.client = zenDesk.createClient({
        username    : this.options.username,
        password    : this.options.password,
        remoteUri	: this.options.remoteUri,
        helpcenter 	: true  // IMPORTANT: Should be always set to true, otherwise the article methods are not available
    });
    
}


/**
 * Publish the article on the ZenDesk platform
 * @param {Function} callback
 * @param {Error} [callback.err=null]
*/
PublisherZenDesk.prototype.publish = function(callback) {

    var  self = this ;

    self.findSectionIdByTitle(self.options.section_title, function(err, id) {
        if (err) {
            if (typeof callback === "function") {
                callback(err);
            }
            return;
        }
        self.createJSONArticle(function(err, article) {
            if (err) {
                if (typeof callback === "function") {
                    callback(err);
                }
                return;
            }
            self.checkIfArticleExists(article.article.title, id, function(err, result) {
                if (err) {
                    if (typeof callback === "function") {
                        callback(err);
                    }
                    return;
                }
                self.client.articles.create(id, article, function(err, req, article) {
                    if (err) {
                        if (typeof callback === "function") {
                            callback(err);
                        }
                        return;
                    }
                    fs.readdir(path.resolve(path.join(self.configurator.path, common.ADC_PATH)), function(errADC, adcItems) {
                        if (errADC) {
                            callback(errADC);
                            return;
                        }
                        fs.readdir(path.resolve(path.join(self.configurator.path, common.QEX_PATH)), function(errQEX, qexItems) {
                            if (errQEX) {
                                callback(errQEX);
                                return;
                            }
                            var theADCs = [], theQEXs = [], thePics = [], filesToPush = [];
                            for (var i = 0; i < adcItems.length  ; i++) {
                                if (adcItems[i].match(/^.+\.adc$/i)) {
                                    theADCs.push(adcItems[i]);
                                }
                            }
                            for (var j = 0 ; j < qexItems.length ;  j++) {
                                if (qexItems[j].match(/^.+\.qex$/i)){
                                    theQEXs.push(qexItems[j]);
                                } else if (qexItems[j].match(/^adc.+\.png$/i)) { // This regex allows to put other pic files in the example folder but they must not begin by 'adc'
                                    thePics.push(qexItems[j]);
                                }
                            }
                            if (theADCs.length != 1 ) {
                                callback(errMsg.badNumberOfADCFiles);
                                return;
                            }
                            if (theQEXs.length > 1) {
                                callback(errMsg.badNumberOfQEXFiles);
                                return;
                            }
                            if (thePics.length > 1) {
                                callback(errMsg.badNumberOfPicFiles);
                                return;
                            }
                            filesToPush.push(path.resolve(path.join(self.configurator.path, common.ADC_PATH, theADCs[0])));
                            if (theQEXs.length === 1) {
                                filesToPush.push(path.resolve(path.join(self.configurator.path, common.QEX_PATH, theQEXs[0])));
                            }
                            if (thePics.length === 1) {
                                filesToPush.push(path.resolve(path.join(self.configurator.path, common.QEX_PATH, thePics[0])));
                            }
                            self.uploadAvailableFiles(filesToPush, article.id, function(err, attachmentsIDs){
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                var articleUpdated = common.updateArticleAfterUploads(article, attachmentsIDs);
                                self.client.translations.updateForArticle(article.id, 'en-us', articleUpdated, function(err, req, res) {
                                    if (err) {
                                        callback(err);
                                        return;
                                    }
                                    callback(null);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

/**
 * Upload all the files that are available (.adc, .qex, .png)
 * @param {Array} files An array containing Strings which are the absolute paths of the files
 * @param {Number} articleId The Id of the article
 * @param {Function} callback
 */
PublisherZenDesk.prototype.uploadAvailableFiles = function(files, articleId, callback) {
    
    var self = this ;
    var attachmentsIDs = {};
        
    function uploadAvailableFilesRecursive(index) {
        
        var formData = {
            'file' : fs.createReadStream(files[index])
        };
        
        request.post({
            url: self.options.remoteUri + "/articles/" + articleId + "/attachments.json",
            formData: formData,
            headers : {
                'Authorization' : "Basic " + new Buffer(self.options.username + ":" + self.options.password).toString('base64')
            }
        }, function(err, resp, body) {
            if (err) {
                callback(err);
                return;
            }
            body = JSON.parse(body);
            attachmentsIDs[files[index].match(/\.([a-z]{2,4})$/i)[1] + 'ID']   = body.article_attachment.id;
            attachmentsIDs[files[index].match(/\.([a-z]{2,4})$/i)[1] + 'Name'] = body.article_attachment.file_name;
            index++;
            if (index >= files.length) {
                callback(null, attachmentsIDs)
            } else {
                uploadAvailableFilesRecursive(index);
            }
        });
    };
    
    uploadAvailableFilesRecursive(0);
};

/**
 * Check if an article already exists in section and delete it
 * pre-condition : there is the possibility to have two articles with the same name but not in the same section
 * @param {String} title The title of the article to check
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.checkIfArticleExists = function(title, section_id, callback) {

    var self = this ;

    self.client.articles.listBySection(section_id, function(err, req, result) {
        if (err) {
            if (typeof callback === "function") {
                callback(err);
            }
            return;
        }
        
        //the part below is needed to check if some people added articles directly from the web
        var numberOfArticlesInstances = 0 ;
        var idToDelete = 0;
        for (var article in result) {
            if (result[article].name === title) {
                idToDelete = result[article].id ;
                numberOfArticlesInstances ++ ;
            }
        }
        
        if (numberOfArticlesInstances > 1) {
            callback(errMsg.tooManyArticlesExisting);
            return;
        }

        if (idToDelete!==0) {
            self.client.articles.delete(idToDelete, function(err, req, result) {
                if (err) {
                    if (typeof callback === "function") {
                        callback(err);
                    }
                    return ;
                }
            });
        }
        callback(null);
    });
};


/**
 * Create the JSON formatted article
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.createJSONArticle = function(callback) {

    var self = this ;


    fs.readFile(path.join(__dirname,"../../",common.ZENDESK_ARTICLE_TEMPLATE_PATH), 'utf-8', function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        var body = common.evalTemplate(data, self.configurator.get(), self.configurator.path);

        var article = {
            "article": {
                "title": self.configurator.get().info.name,
                "body": body,
                "promoted": self.options.promoted,
                "comments_disabled": self.options.comments_disabled
            }
        };
        callback(null, article);

    });

};


/**
 * Find the section id of a section with the Title
 * @param {String} title Section title
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.findSectionIdByTitle = function (title, callback) {
    
    var self = this ;
    if (!title) {
        callback(errMsg.missingSectionTitleArg);
        return;
    }

    if (typeof title !== 'string') {
        callback(errMsg.invalidSectionTitleArg);
        return;
    }
    
    self.client.sections.list(function (err, req, result) {
        if (err) {
            if (typeof callback === "function") {
                callback(err);
            }
            return;
        }
        for (var section in result) {
            if (result[section].name === title) {
                if (typeof callback === "function") {
                	callback(null, result[section].id);
                    return;
                }
            }
        }
        callback(errMsg.unexistingSection);
    });
};

//Make it public
exports.PublisherZenDesk = PublisherZenDesk ;