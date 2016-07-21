var zenDesk         = require('node-zendesk');
var fs              = require('fs');
var common          = require('../common/common.js');
var path            = require('path');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;



/**
 * This is an object which represents the default values.
 * The values will be loaded if they are missing in the command(powershell)
 */
var default_options = {
    username	:	'zendesk@askia.com',
    token		:	'Mx9DJLsHVdBXu8SiUuAzfNkGW01ocYSOgXC7ELXW',
    remoteUri	:	'https://askia1467714213.zendesk.com/api/v2/help_center',
    helpcenter : true, //should be always true
    promoted : false,
    comments_disabled : false,
    section_title : 'test_section'
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
        token		:	this.options.token,
        remoteUri	:	this.options.remoteUri,
        helpcenter 	:	this.options.helpcenter
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
            self.checkIfArticleExists(article.article.title, id, function(err, req, result){
                if(err){
                    if(typeof callback === "function"){
                        console.log(err);
                        callback(err);
                    }
                    return;
                }
            });
            self.client.articles.create(id, article, function(err, req, result) {
                if(err){
                    if(typeof callback === "function"){
                        callback(err);
                        console.log(err);
                    }
                    return;
                }
                if(typeof callback === "function"){
                     callback(null, result);
                }
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
        for(var article in result){
            if(result[article].name === title){
                self.client.articles.delete(result[article].id,function(err, req, result){
                    if(err){
                        if(typeof callback === "function"){
                            callback(err);
                            console.log(err);
                        }
                        return ;
                    }
                });
            }
        }
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
      
        
        var body = common.evalTemplate(data, self.configurator.get());
        
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