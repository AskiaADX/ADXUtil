var zenDesk         = require('node-zendesk');
var fs              = require('fs');
var common          = require('../common/common.js');
var path            = require('path');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var request         = require('request');
var md              = require('markdown').markdown;

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
    var neededOptions = ['username', 'password', 'remoteUri', 'section_title'];
    for (var i = 0, l = neededOptions.length; i < l; i++) {
        var neededOption = neededOptions[i];
        if (!this.options.hasOwnProperty(neededOption)) {
            throw new Error(errMsg.missingPublishArgs + '\n missing argument : ' + neededOption);
        }
    }

    this.options.remoteUri += "/api/v2/help_center";

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
        self.createJSONArticle(function(err, jsonArticle) {
            if (err) {
                if (typeof callback === "function") {
                    callback(err);
                }
                return;
            }
            self.deleteArticle(jsonArticle.article.title, id, function(err) {
                if (err) {
                    if (typeof callback === "function") {
                        callback(err);
                    }
                    return;
                }
                self.client.articles.create(id, jsonArticle, function(err, req, article) {
                    if (err) {
                        if (typeof callback === "function") {
                            callback(err);
                        }
                        return;
                    }
                    var filesToPush = [];
                    var name = self.configurator.get().info.name;
                    fs.stat(path.resolve(path.join(self.configurator.path, common.ADC_PATH, name + '.adc')), function(err, stats) {
                        if(stats && stats.isFile()) {
                            filesToPush.push(path.resolve(path.join(self.configurator.path, common.ADC_PATH, name + '.adc')));
                        } else {
                            callback(errMsg.badNumberOfADCFiles);
                            return;
                        }
                        fs.stat(path.resolve(path.join(self.configurator.path, common.QEX_PATH, name + '.qex')), function(err, stats) {
                            if(stats && stats.isFile()) {
                                filesToPush.push(path.resolve(path.join(self.configurator.path, common.QEX_PATH, name + '.qex')));
                            }
                            fs.stat(path.resolve(path.join(self.configurator.path, 'preview.png')), function(err, stats) {
                                if(stats && stats.isFile()) {
                                    filesToPush.push(path.resolve(path.join(self.configurator.path, 'preview.png')));
                                }
                                self.uploadAvailableFiles(filesToPush, article.id, function(err, attachmentsIDs){
                                    if (err) {
                                        callback(err);
                                        return;
                                    }
                                    var replacements = [
                                        {
                                            pattern : /\{\{ADXQexFileURL\}\}/gi,
                                            replacement : (attachmentsIDs.qexID) ?  ('<li>To download the qex file, <a href="/hc/en-us/article_attachments/' + attachmentsIDs.qexID + '/' + attachmentsIDs.qexName + '">click here</a></li>') : ""
                                        },
                                        {
                                            pattern : /\{\{ADXAdcFileURL\}\}/gi,
                                            replacement : '<a href="/hc/en-us/article_attachments/' + attachmentsIDs.adcID + '/' + attachmentsIDs.adcName + '">click here</a>'
                                        }
                                    ];

                                    // TODO : /!\ change the url ! We don't want a redirection to the pic, but a redirection to survey demo on demo.askia...
                                    // we should upload the file to the demo server from this app
                                    var urlToPointAt = (!self.options.surveyDemoUrl) ? '/hc/en-us/article_attachments/' + attachmentsIDs.pngID + '/' + attachmentsIDs.pngName :
                                    self.options.surveyDemoUrl ;
                                    replacements.push({
                                        pattern         : /\{\{ADXQexPicture\}\}/gi,
                                        replacement     : (!attachmentsIDs.pngID)  ? '' : '<p><a href="' + urlToPointAt + '" target="_blank"> <img style="max-width: 100%;" src="/hc/en-us/article_attachments/' + attachmentsIDs.pngID + '/' + attachmentsIDs.pngName + '" alt="" /> </a></p>'
                                    });
                                    replacements.push({
                                        pattern         : /\{\{ADXSentence:accesSurvey\}\}/gi,
                                        replacement     : (!self.options.surveyDemoUrl) ? '' : '<li>To access to the live survey, click on the picture above.</li>'
                                    });

                                    var articleUpdated = common.evalTemplate(article.body, {}, replacements);
                                    self.client.translations.updateForArticle(article.id, 'en-us', {body:articleUpdated}, callback);
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
 * List all the sections. This method has been implemented for the integration in ADXStudio
 * @param {Function} callback
 */
PublisherZenDesk.prototype.listSections = function(callback) {
    var self = this ;
    
    self.client.sections.list(function(err, req, res) {
        if(err) {
            callback(err);
            return;
        } 
        callback(res);
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
 * Delete the article (if already exist) in the specified section
 * pre-condition : there is the possibility to have two articles with the same name but not in the same section
 * @param {String} title The title of the article to check
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.deleteArticle = function(title, section_id, callback) {

    var self = this ;

    self.client.articles.listBySection(section_id, function(err, req, result) {
        if (err) {
            if (typeof callback === "function") {
                callback(err);
            }
            return;
        }
        
        //the part below is needed to check if some people added articles directly from the web
        var idToDelete = 0;
        for (var i = 0, l = result.length; i < l; i += 1) {
            if (result[i].name === title) {
                if (idToDelete) { // Already exist
                    callback(errMsg.tooManyArticlesExisting);
                    return;
                }
                idToDelete = result[i].id ;
            }
        }

        // No article to delete
        if (!idToDelete) {
            callback(null);
            return;
        }

        // Delete the article
        self.client.articles.delete(idToDelete, function(err) {
             callback(err);
        });
    });
};


/**
 * Create the JSON formatted article
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.createJSONArticle = function(callback) {

    var self = this ;


    fs.readFile(path.join(__dirname,"../../", common.ZENDESK_ARTICLE_TEMPLATE_PATH), 'utf-8', function(err, data) {
        if (err) {
            callback(err);
            return;
        }
        var conf = self.configurator.get();

        var replacements = [{
            pattern : /\{\{ADXNotes\}\}/gi,
            replacement : self.mdNotesToHtml(path.join(self.configurator.path, "Readme.md"))
        },
        {
            pattern : /\{\{ADXProperties:HTML\}\}/gi,
            replacement : self.propertiesToHTML(conf.properties)
        },
        {
            pattern : /\{\{ADXListKeyWords\}\}/gi,
            replacement : "adc; adc2; javascript; control; design; askiadesign; " + conf.info.name
        },
        {
            pattern : /\{\{ADXConstraints\}\}/gi,
            replacement : self.constraintsToSentence(conf.info.constraints)
        }];
        
        var body = common.evalTemplate(data, conf, replacements);

        var article = {
            "article": {
                "title": conf.info.name,
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


/**
 * Generate an HTML string which is a line of a 3 columns array with the name of the property category.
 * @param {Object} an object which represents a category of properties.
 */
generateHTMLcodeForCategory = function (category) {
    return '<tr>\n' +
        '<th data-sheets-value="[null,2,&quot;' + category.name + '&quot;]">' + category.name + '</th>\n' +
        '<td> </td>\n' +
        '<td> </td>\n' +
        '</tr>\n' ;
};


/**
 * Generate a string which is the concatenation of all the options separated by ' '.
 * @param {Object} an object containing the options of a property.
 */
generateHTMLcodeForOptions = function(opt){
    
    var values = [];
    for(var i = 0 , j = opt.length ; i < j ; ++i) {
        values.push(opt[i].text);
    }
    return values.join(", ");
    
};


/**
 * Generate an HTML string which is a line of a 3 columns array with the standard description of a property.
 * @param {Object} an object which represents a property.
 */
generateHTMLcodeForProperty = function (property) {
    return  '<tr>\n' +
            '<td data-sheets-value="[null,2,&quot;' + property.name + '&quot;]">' + property.name + '</td>\n' +
            '<td data-sheets-value="[null,2,&quot;' + property.type + '&quot;]">' + property.type + '</td>\n' +
            '<td data-sheets-value="[null,2,&quot;' + property.description + ' ' + property.value + '&quot;,null,null,null,1]">' + (property.description ? ('Description : ' + property.description) : "") + (property.value ? ('<br/>Value : ' + property.value) : "") + (property.options ? ('<br/>Options : ' + generateHTMLcodeForOptions(property.options)) : "") + (property.colorFormat ? ('<br/>ColorFormat : ' + property.colorFormat) : "") +'</td>\n' +
            '</tr>\n' ;
};

/**
 * Create a String which contains an html dynamic array with the properties
 * @param {Object} properties The properties. Should give configurator.get().properties
 */
PublisherZenDesk.prototype.propertiesToHTML = function (prop) {
    if (!prop) {
        throw new Error(errMsg.missingPropertiesArg);
    }


    var result = '<table class="askiatable" dir="ltr" cellspacing="0" cellpadding="0"><colgroup><col width="281" /><col width="192" /><col width="867" /></colgroup><tbody><tr><td style="text-transform: uppercase; font-weight: bold;" data-sheets-value="[null,2,&quot;Parameters&quot;]">Parameters</td><td style="text-transform: uppercase; font-weight: bold;" data-sheets-value="[null,2,&quot;Type&quot;]">Type</td><td style="text-transform: uppercase; font-weight: bold;" data-sheets-value="[null,2,&quot;Comments and/or possible value&quot;]">Comments and/or possible value</td></tr><tr><td> </td><td> </td><td> </td></tr>';

    for (var category in prop.categories) {
        result += generateHTMLcodeForCategory(prop.categories[category]);
        for (var property in prop.categories[category].properties) {
            result += generateHTMLcodeForProperty(prop.categories[category].properties[property]);
        }
    }
    return result + '</tbody></table>' ;
};


/**
 * Transform the constraints of an adc(from the config) to a sentence
 * @param {Object} constraints The constraints.
 */
PublisherZenDesk.prototype.constraintsToSentence = function(constraints) {
    
    var questions = [], controls = [], key

    if (constraints.questions) {
        for (key in constraints.questions) {
            if (constraints.questions.hasOwnProperty(key) && constraints.questions[key]) {
                questions.push(key);
            }
        }
    }
    if (constraints.controls) {
        for (key in constraints.controls) {
            if (constraints.controls.hasOwnProperty(key) && constraints.controls[key]) {
                controls.push(key);
            }
        }
    }

    var responseMin = null;
    if (constraints.responses && constraints.responses.min === "*") {
        responseMin = constraints.responses.min;
    }

    var responseMax = null;
    if (constraints.responses && constraints.responses.max === "*") {
        responseMax = constraints.responses.max;
    }
    var numberOfResponses = '';
    if (responseMin !== null && responseMax !== null) {
        numberOfResponses = ". Number of responses(min-max) : ";
        numberOfResponses +=  responseMin || 0;
        numberOfResponses += " - " + (responseMax || 0);
    }

    return "This control is compatible with " +
        questions.join(", ") +
        " questions" + numberOfResponses +
        ". You can use the following controls : " +
        controls.join(", ") + ".";
};

/**
 * Parse the readme.md file to read notes and convert them to an html list
 * @param {String | Buffer} p The path to the readme.md file
 */
PublisherZenDesk.prototype.mdNotesToHtml = function(p){

    var file = fs.readFileSync(path.resolve(p), 'utf-8');
    var tree = md.parse(file);
    var res = "";
    for(var i = 0 ; i < tree.length ; i++){
        if (tree[i][0] === 'header' && tree[i][1].level == 2 && tree[i][2] === 'Notes') {
            if(typeof tree[i+1][1] === "string"){
                res += tree[i+1][1];
            }
        }
    }
    if(res.length > 0){
        res = res.replace(/\n\-\ /g, "<li></li>");
        res = res.substring(2);
        res = '<p><span class="wysiwyg-underline">Notes:</span></p><ul><li>' + res + '</li></ul>';
    }

    return res;
};



//Make it public
exports.PublisherZenDesk = PublisherZenDesk ;