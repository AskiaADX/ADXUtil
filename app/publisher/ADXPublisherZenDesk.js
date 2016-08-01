var zenDesk         = require('node-zendesk');
var fs              = require('fs');
var common          = require('../common/common.js');
var path            = require('path');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var restler         = require('restler');


/**
 * This is an object which represents the default values.
 * The values will be loaded if they are missing in the command(powershell)
 */
var default_options = {
    username	:	'zendesk@askia.com',
    remoteUri	:	'https://askia1467714213.zendesk.com/api/v2/help_center',
    password    :   'Zendesk!98',
    promoted : false,
    comments_disabled : false,
    section_title : 'autre section'
};


/**
 * Instantiate a PublisherZendesk
 * @param {Configurator} configurator the configuration of the article
 * @param {Object} options Options of the platform, if the options are not specified the default_options will be loaded.
 */
function PublisherZenDesk(configurator, options){

    if(!configurator){
        throw new Error(errMsg.invalidConfiguratorArg);
    }

    options = options || {} ;
    for(var option in default_options){
        if(!options[option]){
            options[option]=default_options[option];
        }
    }

    this.configurator = configurator ;
    this.options = options ;
    this.client = zenDesk.createClient({
        username	:	this.options.username,
        password    :   this.options.password,
        token		:	this.options.token, //REMOCE ! (and test)
        remoteUri	:	this.options.remoteUri,
        helpcenter 	:	true
    });

}


/**
 * Publish the article on the ZenDesk platform
 * @param {Function} callback
 * @param {Error} [callback.err=null]
*/
PublisherZenDesk.prototype.publish = function(callback){
    
    var  self = this ;
    
    this.findSectionIdByTitle(this.options.section_title, function(err, id){
        if(err){
            if(typeof callback === "function"){
                callback(err);
            }
            return;
        }
        self.createArticle(function(err, article){
            if(err){
                if(typeof callback === "function"){
                    callback(err);
                }
                return;
            }
            self.checkIfArticleExists(article.article.title, id, function(err, result){
                if(err){
                    if(typeof callback === "function"){
                        console.log(err);
                        callback(err);
                    }
                    return;
                }
                self.client.articles.create(id, article, function(err, req, result) {
                    if(err){
                        if(typeof callback === "function"){
                            callback(err);
                            console.log(err);
                        }
                        return;
                    }
                    //TODO ; optimize with async eachSeries available files
                    fs.readdir(path.resolve(path.join(self.configurator.path, common.ADC_PATH)), function(errADC, adcItems){
                        fs.readdir(path.resolve(path.join(self.configurator.path, common.QEX_PATH)), function(errQEX, qexItems){
                            if(errQEX){
                                callback(errQEX);
                                return;
                            }
                            if(errADC){
                                callback(errADC);
                                return;
                            }
                            var theADCs = [], theQEXs = [], thePics = [];
                            for(var i = 0; i < adcItems.length  ; i++){
                                if(adcItems[i].match(/.+\.adc/i)){
                                    theADCs.push(adcItems[i]);
                                }
                            }
                            for(var j = 0 ; j < qexItems.length ;  j++){
                                if(qexItems[j].match(/.+\.qex/i)){
                                    theQEXs.push(qexItems[j]);
                                }
                                if(qexItems[j].match(/adc.+\.png/i)){ // This regex allows to put other pic files in the example folder but they must not begin by'adc'
                                    thePics.push(qexItems[j]);
                                }
                            }
                            if(theADCs.length !== 1 ){
                                throw new Error(errMsg.badNumberOfADCFiles);
                            }
                            if(theQEXs.length > 1){
                                throw new Error(errMsg.badNumberOfQEXFiles);
                            }
                            if(thePics.length > 1){
                                throw new Error(errMsg.badNumberOfPicFiles);
                            }
                            fileADC = path.resolve(path.join(self.configurator.path, common.ADC_PATH, theADCs[0]));
                            fs.stat(fileADC, function(err, adcStats){
                               if(err){
                                   callback(err);
                                   return;
                               }
                               if(theQEXs.length === 1){ //A .qex is available for the upload
                                    fileQEX = path.resolve(path.join(self.configurator.path, common.QEX_PATH, theQEXs[0]));
                                    fs.stat(fileQEX, function(err, qexStats){
                                        restler.post(self.options.remoteUri + "/articles/" + result.id + "/attachments.json", {
                                            username: self.options.username,
                                            password: self.options.password,
                                            multipart: true,
                                            data:{
                                                "file": restler.file(fileADC, null, adcStats.size, null, "application/octet-stream")
                                            }
                                        }).on('complete', function(adcRes){
                                            restler.post(self.options.remoteUri + "/articles/" + result.id + "/attachments.json", {
                                                username: self.options.username,
                                                password: self.options.password,
                                                multipart: true,
                                                data:{
                                                    "file": restler.file(fileQEX, null, qexStats.size, null, "application/octet-stream")
                                                }
                                            }).on('complete', function(qexRes){
                                                if(thePics.length === 1){ // All the files are available ! (.png ; .adc ;  .qex)
                                                    filePNG = path.resolve(path.join(self.configurator.path, common.QEX_PATH, thePics[0]));
                                                    fs.stat(filePNG, function(err, pngStats){
                                                        restler.post(self.options.remoteUri + "/articles/" + result.id + "/attachments.json", {
                                                            username: self.options.username,
                                                            password: self.options.password,
                                                            multipart: true,
                                                            data:{
                                                                "file": restler.file(filePNG, null, pngStats.size, null, "image/png")
                                                            }
                                                        }).on('complete', function(pngRes){
                                                            var article = common.updateArticleAfterUploads(result, {
                                                                qexID: qexRes.article_attachment.id,
                                                                qexName: qexRes.article_attachment.file_name,
                                                                adcName: adcRes.article_attachment.file_name,
                                                                adcID: adcRes.article_attachment.id,
                                                                pngID: pngRes.article_attachment.id,
                                                                pngName: pngRes.article_attachment.file_name
                                                            });
                                                            self.client.translations.updateForArticle(result.id, 'en-us', article, function(err, req, res){
                                                                if(err){
                                                                    callback(err);
                                                                }
                                                            });
                                                        });
                                                    });
                                                }
                                                else{ // There is an .adc and a .qex to upload
                                                    var article = common.updateArticleAfterUploads(result, {
                                                        qexID: qexRes.article_attachment.id,
                                                        qexName: qexRes.article_attachment.file_name,
                                                        adcName: adcRes.article_attachment.file_name,
                                                        adcID: adcRes.article_attachment.id
                                                    });
                                                    self.client.translations.updateForArticle(result.id, 'en-us', article, function(err, req, res){
                                                        if(err){
                                                            callback(err);
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    });  
                                }
                                else{ // There is only an .adc to upload
                                    restler.post(self.options.remoteUri + "/articles/" + result.id + "/attachments.json", {
                                        username: self.options.username,
                                        password: self.options.password,
                                        multipart: true,
                                        data:{
                                            "file": restler.file(fileADC, null, adcStats.size, null, "application/octet-stream")
                                        }
                                    }).on('complete', function(adcRes){
                                        var article = common.updateArticleAfterUploads(result, {
                                            adcID: adcRes.article_attachment.id,
                                            adcName: adcRes.article_attachment.file_name,
                                        });
                                        self.client.translations.updateForArticle(result.id, 'en-us', article, function(err, req, res){
                                            if(err){
                                                callback(err);
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    });    
                });
            });
        });
    });
};



/**
 * Check if an article already exists in section and delete it
 * pre-condition : there is the possiblity to have two articles with the same name but not in the same section
 * @param {String} title The title of the article to check
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.checkIfArticleExists = function(title, section_id, callback){
    
    var self = this ;
    
    self.client.articles.listBySection(section_id, function(err, req, result){
        if(err){
            if(typeof callback === "function"){
                callback(err);
                console.log(err);
            }
            return;
        } 
        var idToDelete = 0;
        for(var article in result){
            if(result[article].name === title){
                idToDelete = result[article].id ;
            }
        }
        
        if(idToDelete!==0){
            self.client.articles.delete(idToDelete, function(err, req, result){
                if(err){
                    if(typeof callback === "function"){
                        callback(err);
                        console.log(err);
                    }
                    return ;
                }
            });
        }
        callback(null);
        
    });
};


/**
 * Create the JSON formated article
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.createArticle = function(callback){

    var self = this ;
    
    fs.readFile(path.join(__dirname,"../../",common.ZENDESK_ARTICLE_TEMPLATE_PATH),'utf-8', function(err, data){
        if(err){
            if(typeof callback === "function"){
                callback(err);
            }
            return;
        }
      
        
        var body = common.evalTemplate(data, self.configurator);
        
        var article = {
            "article": {
                "title": self.configurator.info.name(),
                "body": body,
                "promoted": self.options.promoted,
                "comments_disabled": self.options.comments_disabled
            }  
        };
        if(typeof callback === "function"){
            callback(null,article);
        }

    });

};


/**
 * Find the section id of a section with the Title
 * @param {String} section title
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherZenDesk.prototype.findSectionIdByTitle = function(title, callback){
 
    var self = this ;
    
    if(!(title instanceof String) && (typeof title !=='string')){
        throw new Error(errMsg.invalidSectionTitleArg);
    }

	
    self.client.sections.list(function (err, req, result) {

        if(err){
            if(typeof callback === "function"){
                callback(err);
                console.log(err);
            }
            return;
        }
     
        for(var section in result){
            if(result[section].name === title){
                if(typeof callback === "function"){
                	callback(null, result[section].id);  
                    return;
                }
            }
        }
        
        console.log(errMsg.unexistingSection);
        callback(new Error(errMsg.unexistingSection));
    });


};

//Make it public
exports.PublisherZenDesk = PublisherZenDesk ;