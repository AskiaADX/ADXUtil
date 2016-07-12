var zenDesk = require('node-zendesk');
var fs		= require('fs');
var common	= require('../common/common.js');
var path = require('path');
var errMsg	= common.messages.error;
var Configurator		=	require('../configurator/ADXConfigurator.js').Configurator;

//TODO : see where to put this, this is an example of a full object options
var default_options = {
    username	:	'zendesk@askia.com',
    token		:	'Mx9DJLsHVdBXu8SiUuAzfNkGW01ocYSOgXC7ELXW',
    remoteUri	:	'https://askia1467714213.zendesk.com/api/v2/help_center',
    helpcenter : true,
    promoted : false,
    comments_disabled : false,
    section_title : 'test_section'
}

/**
 * Publish to ZenDesk
 * @param {Configurator} configurator the configuration of the article
 * @param {Object} options Options of the platform
 */
function PublisherZenDesk(configurator, options){

    /*  if(!(configurator instanceof Configurator)){
        throw new Error(errMsg.invalidConfiguratorArg);
    }*/

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

PublisherZenDesk.prototype.publish = function(callback){
    
   var  self = this ;
    
    this.findSectionIdByTitle(this.options.section_title, function(err, id){
        if(err){
            if(typeof callback === "function"){
                callback(err);
            }
            return;
        }
        self.createArticle(id, function(err, article){
            if(err){
                if(typeof callback === "function"){
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
                if(typeof callback === "function"){
                    callback(null, result);
                }
            });
        });
    });
};



PublisherZenDesk.prototype.createArticle = function(id, callback){

    var self = this ;
    
    fs.readFile(path.join(__dirname,"../../",common.ZENDESK_ARTICLE_TEMPLATE_PATH),'utf-8', function(err, data){
        if(err){
            if(typeof callback === "function"){
                callback(err);
            }
            return;
        }
        var body = common.evalTemplate(data.toString(), self.configurator.get());

        var article = {
            "article": {
                "title": self.configurator.info.name(),
                "body": body,
                "promoted": self.options.promoted,
                "comments_disabled": self.options.comments_disabled
                //"section_id": id
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
        callback(new Error(errMsg.unexistingSection));
    });


};


exports.PublisherZenDesk = PublisherZenDesk ;



/*client.users.auth(function (err, res, result) {
  if (err) {
    //console.log(err);
    return;
  }
  console.log(JSON.stringify(result.verified, null, 2, true) + "ddd");
});*/

/*
var newCategory = { 
	"category":{
    	"url": 'https://askia1467714213.zendesk.com/api/v2/help_center/en-us/categories/',
   		"html_url": 'https://askia1467714213.zendesk.com/hc/en-us/categories/',
    	"position": 0,
    	"name": 'newCategoryWithoutCompleteURL',
    	"description": 'fait depuis node.js, test in order to know if specify a full url is necessary',
    	"locale": 'en-us',
    	"source_locale": 'en-us',
    	"outdated": false
    }
} ;*/
