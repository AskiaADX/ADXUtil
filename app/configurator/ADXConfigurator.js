var fs = require('fs');
var path = require('path');
var et = require('elementtree');
var subElement = et.SubElement;
var common = require('../common/common.js');
var errMsg = common.messages.error;

/**
 * Object used to read and manipulate the config.xml file of an ADC
 *
 *      var ADC = require('adcutil').ADC;
 *
 *      var myAdc = new ADC('path/to/adc/');
 *      myAdc.load(function (err) {
 *          if (err) {
 *              throw err;
 *          }
 *
 *          // Get the instance of the Configurator
 *          var conf = myAdc.configurator;
 *
 *          console.log(conf.info.name());
 *
 *      });
 *
 *
 * @class ADC.Configurator
 */
function Configurator(dir) {
    if (!dir) {
        throw new Error(errMsg.invalidPathArg);
    }
    /**
     * Path of the ADC directory
     * @type {String}
     */
    this.path   = dir;


    this.xmldoc = null;

    /**
     * Info of the ADC
     * @type {ADC.Configurator.Info}
     */
    this.info = null;

    /**
     * Outputs of the ADC
     * @type {ADC.Configurator.Outputs}
     */
    this.outputs = null;

    /**
     * Properties of the ADC
     * @type {ADC.Configurator.Properties}
     */
    this.properties = null;
}

/**
 * Create a new instance of the ADC configurator object
 *
 * @constructor
 * @param {String} dir Path of the ADC directory
 */
Configurator.prototype.constructor = Configurator;

/**
 * Read the config.xml file and initialize all properties of the current instance object
 *
 *       // Load the config file
 *       adcInfo.load(function (err) {
 *          if (err) {
 *              throw err;
 *          }
 *          console.log(adcInfo.name());
 *       });
 *
 * @param {Function} [callback] Callback function
 * @param {Error} [callback.err] Error
 */
Configurator.prototype.load = function load(callback) {
    callback = callback || function () {};
    var self = this;

    common.dirExists(this.path, function (err, isExist) {
        if (err) {
            callback(err);
            return;
        }
        if (!isExist) {
            callback(errMsg.noSuchFileOrDirectory);
            return;
        }

        var filePath = path.join(self.path, common.CONFIG_FILE_NAME);

        fs.readFile(filePath, function (err, data) {
            if (err) {
                callback(err);
                return;
            }

            self.fromXml(data.toString());
            callback(null);

        });

    });
};

/**
 * Get the entire configuration as object
 *
 *       // Get the info object
 *       configurator.get();
 *       // {
 *       //   info : { // .... },
 *       //   outputs : { // ... },
 *       //   properties : { // ...}
 *       // }
 *
 * @return {Object}
 */
Configurator.prototype.get = function get() {
    return {
        info : this.info.get(),
        outputs : this.outputs.get(),
        properties : this.properties.get()
    };
};

/**
 * Set th configuration using an object
 *
 *       // Get the info object
 *       configurator.set(
 *          info {
 *              name : "My ADC"
 *              version : "2.2.0.beta1",
 *              date  : "2015-06-25",
 *              guid  : "the-guid",
 *              description : "Description of the ADC"
 *              author  : "The author name",
 *              company : "The company name",
 *              site    : "http://website.url.com",
 *              helpURL : "http://help.url.com",
 *              style   : { width : 400, height : 200},
 *              categories : ["General", "Slider", "Single"],
 *              constraints : {
 *                  questions : {
 *                     single : true,
 *                     multiple : true
 *                  },
 *                  controls : {
 *                      responseBlock : true
 *                  },
 *                  responses : {
 *                      max : 10
 *                  }
 *              }
 *          },
 *          outputs : {
 *              defaultOutput : "main",
 *              outputs : [
 *                 {
 *                     id : "main",
 *                     description : "Main output",
 *                      contents : [
 *                           {
 *                              fileName : 'main.css',
 *                              type : 'css',
 *                              mode : 'static',
 *                              position : 'head'
 *                          },
 *                          {
 *                              fileName : 'main.html',
 *                              type : 'html',
 *                              mode : 'dynamic',
 *                              position : 'placeholder'
 *                          },
 *                          {
 *                              fileName : 'main.js',
 *                              type : 'javascript',
 *                              mode : 'static',
 *                              position: 'foot'
 *                          }
 *                      ]
 *                  },
 *                  {
 *                      id : "second",
 *                      description : "Second output",
 *                      condition : "Browser.Support(\"javascript\")",
 *                      contents : [
 *                          {
 *                              fileName : 'second.css',
 *                              type : 'css',
 *                              mode : 'static',
 *                              position : 'head'
 *                          },
 *                          {
 *                              fileName : 'second.html',
 *                              type : 'html',
 *                              mode : 'dynamic',
 *                              position : 'placeholder'
 *                          },
 *                          {
 *                              fileName : 'second.js',
 *                              type : 'javascript',
 *                              mode : 'static',
 *                              position : 'foot'
 *                          }
 *                      ]
 *                  },
 *                  {
 *                      id : "third",
 *                      description : "Third output",
 *                      maxIterations : 12,
 *                      defaultGeneration : false,
 *                      contents : [
 *                          {
 *                              fileName : "third.css",
 *                              type  : "css",
 *                              mode : "static",
 *                              position : "head",
 *                              attributes : [
 *                                  {
 *                                      name : "rel",
 *                                      value : "alternate"
 *                                  },
 *                                  {
 *                                      name : "media",
 *                                      value : "print"
 *                                  }
 *                              ]
 *                          },
 *                          {
 *                              fileName : 'HTML5Shim.js',
 *                              type : 'javascript',
 *                              mode : 'static',
 *                              position : 'head',
 *                              yieldValue : '<!--[if lte IE 9]><script type="text/javascript"  src="{%= CurrentADC.URLTo("static/HTML5Shim.js") %}" ></script><![endif]-->'
 *                          }
 *                      ]
 *                 }
 *              },
 *              properties : {
 *                  categories : [
 *                     {
 *                         id : "general",
 *                         description : "General",
 *                         properties  : [
 *                               {
 *                                  id : "background",
 *                                  name : "Background color",
 *                                  type : "color",
 *                                  description : "Color of the ADC background",
 *                                  colorFormat : "rgb",
 *                                  value  : "255,255,255"
 *                              }
 *                        ]
 *                     }
 *                  ]
 *              }
 *        });
 *
 * @param {Object} data Data to set
 * @param {Object} [data.info] Info data
 * @param {Object} [data.outputs] Outputs data
 * @param {Object} [data.properties] Properties data
 */
Configurator.prototype.set = function set(data) {
    if (data.info) {
        this.info.set(data.info);
    }
    if (data.outputs) {
        this.outputs.set(data.outputs);
    }
    if (data.properties) {
        this.properties.set(data.properties);
    }
};

/**
 * Return the configuration as xml
 *
 *       // Serialize the config to XML
 *       adcInfo.toXml();
 *       // -> <?xml version="1.0" encoding="utf-8"?>
 *             <control  xmlns="http://www.askia.com/ADCSchema"
 *             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 *             xsi:schemaLocation="http://www.askia.com/ADCSchema http://www.askia.com/Downloads/dev/schemas/adc2.0/Config.xsd"
 *             version="2.0.0"
 *             askiaCompat="5.3.3">
 *                 <info>
 *                     <name>My Name</name>
 *                     <guid>the-guid</guid>
 *                     ....
 *                 </info>
 *                 <outputs defaultOutput="default">
 *                     ....
 *                 </outputs>
 *                 <properties>
 *                     ....
 *                 </properties>
 *               </control>
 *
 * @return {String}
 */
Configurator.prototype.toXml = function toXml() {
    var xml = [],
        infoXml = this.info.toXml(),
        outputsXml = this.outputs.toXml(),
        propertiesXml = this.properties.toXml();

    xml.push('<?xml version="1.0" encoding="utf-8"?>');
    xml.push('<control  xmlns="http://www.askia.com/ADCSchema"' +
            '\n          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            '\n          xsi:schemaLocation="http://www.askia.com/ADCSchema http://www.askia.com/Downloads/dev/schemas/adc2.0/Config.xsd"' +
            '\n          version="2.0.0"' +
            '\n          askiaCompat="5.3.3">');

    if (infoXml) {
        xml.push(infoXml);
    }
    if (outputsXml) {
        xml.push(outputsXml);
    }
    if (propertiesXml) {
        xml.push(propertiesXml);
    }
    xml.push('</control>');

    return xml.join('\n');
};

/**
 * Re-init the configurator using the xml string
 *
 *       // Load the configuration using an xml string
 *       // xmlString contains information from config.xml
 *       adcInfo.fromXml(xmlString);
 *
 */
Configurator.prototype.fromXml = function fromXml(xml) {
    this.xmldoc = et.parse(xml);
    this.info = new ADCInfo(this);
    this.outputs = new ADCOutputs(this);
    this.properties = new ADCProperties(this);
};

/**
 * Save the current configuration
 *
 * @param {Function} [callback]
 * @param {Error} callback.err
 */
Configurator.prototype.save = function save(callback) {
    var filePath = path.join(this.path, common.CONFIG_FILE_NAME);
    var self = this;
    fs.writeFile(filePath, this.toXml(), {encoding : 'utf8'}, function (err) {
        if (!err) {
            self.load(callback);
        } else {
            if (typeof callback === 'function') {
                callback(err);
            }
        }
    });
};

/**
 * Provide an object to manipulate the meta-information of the ADC (config.xml > info)
 *
 *      var ADC = require('adcutil').ADC;
 *
 *      var myAdc = new ADC('path/to/adc/');
 *      myAdc.load(function (err) {
 *          if (err) {
 *              throw err;
 *          }
 *
 *          // Get the instance of the Info
 *          var info = myAdc.configurator.info;
 *
 *          console.log(info.get());
 *
 *      });
 *
 * @class ADC.Configurator.Info
 */
function ADCInfo(configurator) {
    this.configurator = configurator;
}

/**
 * Creates a new instance of ADC Info
 *
 * @constructor
 * @param {ADC.Configurator} configurator Instance of the configurator
 */
ADCInfo.prototype.constructor = ADCInfo;

/**
 * Get the entire information as object
 *
 *       // Get the info object
 *       adcInfo.get();
 *       // {
 *       //   name : "My ADC"
 *       //   version : "2.2.0.beta1",
 *       //   date  : "2015-06-25",
 *       //   guid  : "the-guid",
 *       //   description : "Description of the ADC"
 *       //   author  : "The author name",
 *       //   company : "The company name",
 *       //   site    : "http://website.url.com",
 *       //   helpURL : "http://help.url.com",
 *       //   style   : { width : 400, height : 200},
 *       //   categories : ["General", "Slider", "Single"],
 *       //   constraints : {
 *       //       questions : {
 *       //          single : true,
 *       //          multiple : true
 *       //       },
 *       //       controls : {
 *       //           responseBlock : true
 *       //       },
 *       //       responses : {
 *       //           max : 10
 *       //       }
 *       //   }
 *       // }
 *
 * @return {Object}
 */
ADCInfo.prototype.get = function get() {
    var self = this,
        result = {};

    ["name", "guid", "version", "date", "description", "company", "author", "site",
        "helpURL", "categories", "style", "constraints"].forEach(function (methodName) {
            result[methodName] = self[methodName]();
    });
    return result;
};

/**
 * Set the information using a plain object
 *
 *       // Get the info object
 *       adcInfo.set({
 *          name : "My ADC"
 *          version : "2.2.0.beta1",
 *          date  : "2015-06-25",
 *          guid  : "the-guid",
 *          description : "Description of the ADC"
 *          author  : "The author name",
 *          company : "The company name",
 *          site    : "http://website.url.com",
 *          helpURL : "http://help.url.com",
 *          style   : { width : 400, height : 200},
 *          categories : ["General", "Slider", "Single"],
 *          constraints : {
 *              questions : {
 *                 single : true,
 *                 multiple : true
 *              },
 *              controls : {
 *                  responseBlock : true
 *              },
 *              responses : {
 *                  max : 10
 *              }
 *          }
 *        });
 *
 *
 * @param {Object} data Data to set
 * @param {String} [data.name] Name of the ADC
 * @param {String} [data.version] Version of the ADC
 * @param {String} [data.date] Date of the ADC (YYYY-MM-dd)
 * @param {String} [data.guid] GUID of the ADC
 * @param {String} [data.description] Description of the ADC
 * @param {String} [data.author] Author(s) of the ADC (name1 <name1@email.com, name2 <name2@email.com>)
 * @param {String} [data.company] Company name of the creator
 * @param {String} [data.site] Web site URL of the creator
 * @param {String} [data.helpURL] URL to the ADC help
 * @param {Object} [data.style] Style of the ADC
 * @param {Number} [data.style.width] Width of the ADC (in pixel)
 * @param {Number} [data.style.height] Height of the ADC (in pixel)
 * @param {String[]} [data.categories] Categories of the ADC
 * @param {Object} [data.constraints] Constraints of the ADC
 * @param {Object} [data.constraints.questions] Questions constraints of the ADC
 * @param {Boolean} [data.constraints.questions.chapter] Allow or not on chapter
 * @param {Boolean} [data.constraints.questions.single] Allow  or not on single questions
 * @param {Boolean} [data.constraints.questions.multiple] Allow or not on multi-coded questions
 * @param {Boolean} [data.constraints.questions.numeric] Allow or not on numeric questions
 * @param {Boolean} [data.constraints.questions.open] Allow or not on open-ended questions
 * @param {Boolean} [data.constraints.questions.date] Allow or not on date questions
 * @param {Boolean} [data.constraints.questions.requireParentLoop] Require or not on a parent loop question
 * @param {Object} [data.constraints.controls] Controls constraints of the ADC
 * @param {Boolean} [data.constraints.controls.responseBlock] Allow or not on response-block
 * @param {Boolean} [data.constraints.controls.label] Allow or not on label
 * @param {Boolean} [data.constraints.controls.textbox] Allow or not on text-box
 * @param {Boolean} [data.constraints.controls.listbox] Allow or not on list-box
 * @param {Boolean} [data.constraints.controls.checkbox] Allow or not on checkbox
 * @param {Boolean} [data.constraints.controls.radiobutton] Allow or not on radio button
 * @param {Object} [data.constraints.responses] Responses constraints of the ADC
 * @param {Number} [data.constraints.responses.min] Minimum allowed responses
 * @param {Number} [data.constraints.responses.max] Maximum allowed responses
 */
ADCInfo.prototype.set = function set(data) {
    var self = this;

    if (!data) {
        return;
    }


    ["name", "guid", "version", "date", "description", "company", "author", "site",
        "helpURL", "categories", "style", "constraints"].forEach(function (methodName) {
            if (data.hasOwnProperty(methodName)) {
                self[methodName](data[methodName]);
            }
        });
};



(["name", "guid", "version", "date", "description", "company", "author", "site", "helpURL"].forEach(function (propName) {
    /**
     * Get or set the name of the ADC
     *
     *       // Get the name of the ADC
     *       adcInfo.name();
     *
     *       // Set the name of the ADC
     *       adcInfo.name("New name");
     *
     * @method name
     * @param {String} [data] Name of the ADC to set
     * @returns {String} Name of the ADC
     */
    /**
     * Get or set the GUID of the ADC
     *
     *       // Get the guid of the ADC
     *       adcInfo.guid();
     *
     *       // Set the guid of the ADC
     *       var uuid = require('node-uuid'');
     *       adcInfo.guid(uuid.v4());
     *
     * @method guid
     * @param {String} [data] GUID of the ADC to set
     * @returns {String} GUID of the ADC
     */
    /**
     * Get or set the version of the ADC
     *
     *       // Get the version of the ADC
     *       adcInfo.version();
     *
     *       // Set the version of the ADC
     *       adcInfo.version("2.0.0.beta1");
     *
     * @method version
     * @param {String} [data] Version of the ADC to set
     * @returns {String} Version of the ADC
     */
    /**
     * Get or set the description of the ADC
     *
     *       // Get the description of the ADC
     *       adcInfo.description();
     *
     *       // Set the description of the ADC
     *       adcInfo.description("This is the description of the ADC");
     *
     * @method description
     * @param {String} [data] Description of the ADC to set
     * @returns {String} Description of the ADC
     */
    /**
     * Get or set the company name of the ADC creator
     *
     *       // Get the company of the ADC
     *       adcInfo.company();
     *
     *       // Set the company of the ADC
     *       adcInfo.company("Askia SAS");
     *
     * @method company
     * @param {String} [data] Company name to set
     * @returns {String} Company of the ADC creator
     */
    /**
     * Get or set the author(s) of the ADC
     *
     *       // Get the author(s) of the ADC
     *       adcInfo.author();
     *
     *       // Set the author(s) of the ADC
     *       adcInfo.author("John Doe <john.doe@unknow.com>, Foo Bar <foo@bar.com>");
     *
     * @method author
     * @param {String} [data] Author(s) to set
     * @returns {String} Author(s)
     */
    /**
     * Get or set the date creation of the ADC
     *
     *       // Get the date
     *       adcInfo.date();
     *
     *       // Set the date
     *       adcInfo.date("2015-06-25");
     *
     * @method date
     * @param {String} [data] Date to set
     * @returns {String} Date
     */
    /**
     * Get or set the website URL of the ADC creator
     *
     *       // Get the site
     *       adcInfo.site();
     *
     *       // Set the site URL
     *       adcInfo.site("http://my.website.com");
     *
     * @method site
     * @param {String} [data] URL to set
     * @returns {String} Site URL
     */
    /**
     * Get or set the help URL of the ADC
     *
     *       // Get the help URL
     *       adcInfo.helpURL();
     *
     *       // Set the help URL
     *       adcInfo.helpURL("http://my.help.file.com");
     *
     * @method helpURL
     * @param {String} [data] URL to set
     * @returns {String} Help URL
     */
    ADCInfo.prototype[propName] = function (data) {
        var xmldoc = this.configurator.xmldoc;
        var elInfo = xmldoc.find('info');
        var isSetter = data !== undefined;

        // No root info
        if (!elInfo && isSetter) {
            elInfo = subElement(xmldoc.getroot(), 'info');
        } else if (!elInfo && !isSetter) {
            return '';
        }

        var el = elInfo.find(propName);

        // No element
        if (!el && isSetter) {
            el = subElement(elInfo, propName);
        } else if (!el && !isSetter) {
            return '';
        }

        if (isSetter) {
            el.text = data;
        }
        return el.text;
    };
}));

/**
 * Get or set the style
 *
 *       // Get the style of the ADC
 *       adcInfo.style();
 *
 *       // Set the style of the ADC
 *       adcInfo.style({
 *          width  : 400,
 *          height : 200
 *       });
 *
 *
 * @param {Object} [data] Style to set
 * #param {Number} [data.width] Style width
 * @param {Number} [data.height] Style height
 * @returns {Object}
 */
ADCInfo.prototype.style = function style(data) {
    var xmldoc = this.configurator.xmldoc;
    var elInfo = xmldoc.find("info");
    var isSetter = (data !== undefined);

    if (!elInfo && isSetter) {
        elInfo = subElement(xmldoc.getroot(), "info");
    } else if (!elInfo && !isSetter) {
        return { width : 0,height : 0 };
    }


    var el = elInfo.find("style");
    if (!el && isSetter) {
        el = subElement(elInfo, "style");
    } else if (!el && !isSetter) {
        return {width : 0, height : 0};
    }

    var result = {}, w, h;
    if (isSetter) {
        if (data.width !== undefined) {
            el.set("width", data.width);
        }
        if (data.height !== undefined) {
            el.set("height", data.height);
        }
    }
    w = el.get("width") || "0";
    h = el.get("height") || "0";

    result.width = parseInt(w, 10);
    result.height = parseInt(h, 10);

    return result;
};

/**
 * Get or set the categories
 *
 *       // Get the categories of the ADC
 *       adcInfo.categories();
 *
 *       // Set the categories of the ADC
 *       adcInfo.categories(["General", "Slider", "Single"]);
 *
 *
 * @param {String[]} [data] Array of string which represent the categories to set
 * @returns {String[]} Name of categories
 */
ADCInfo.prototype.categories = function categories(data) {
    var xmldoc = this.configurator.xmldoc;
    var elInfo = xmldoc.find('info');
    var isSetter = Array.isArray(data);

    // No root info
    if (!elInfo && isSetter) {
        elInfo = subElement(xmldoc.getroot(), 'info');
    } else if (!elInfo && !isSetter) {
        return [];
    }

    var el = elInfo.find("categories");

    // No categories
    if (!el && isSetter) {
        el = subElement(elInfo, 'categories');
    } else if (!el && !isSetter) {
        return [];
    }

    var result = [];
    if (isSetter) {
        el.delSlice(0, el.len());
        data.forEach(function (text) {
            var cat = subElement(el, 'category');
            cat.text = text;
        });
    }

    el.iter('category', function (cat) {
        result.push(cat.text);
    });

    return result;
};

/**
 * Get or set the constraints
 *
 *       // Get the constraints of the ADC
 *       adcInfo.constraints();
 *
 *       // Set the constraints of the ADC
 *       adcInfo.constraints({
 *          questions : {
 *              single : true,
 *              multiple : true
 *          },
 *          controls : {
 *              responseBlock : true,
 *              label : false
 *          },
 *          responses : {
 *              max : 25
 *          }
 *       });
 *
 *
 * @param {Object} [data] Constraint data to set
 * @return {Object} Constraints
 */
ADCInfo.prototype.constraints = function constraints(data) {
    var xmldoc = this.configurator.xmldoc;
    var elInfo = xmldoc.find("info");

    // No root info
    if (!elInfo && data) {
        elInfo = subElement(xmldoc.getroot(), 'info')
    } else if (!elInfo && !data) {
        return {};
    }

    var el = elInfo.find("constraints");

    // No constraints
    if (!el && data) {
        el = subElement(elInfo, 'constraints');
    } else if (!el && !data) {
        return {};
    }

    var result = {};

    if (data) {
        Object.keys(data).forEach(function (on) {
            if (on !== 'questions' &&  on !== 'responses' &&  on !== 'controls') {
               return;
            }
            var node = el.find("constraint[@on='" + on + "']");
            if (!node) {
                node = subElement(el, "constraint");
                node.set("on", on);
            }

            Object.keys(data[on]).forEach(function (attName) {
                var value = data[on][attName].toString();
                node.set(attName,  value);
            });

        });
    }

    el.iter('constraint', function (constraint) {
        var on = constraint.get("on");
        var value = {};

        constraint.keys().forEach(function (attName) {
            if (attName === 'on') {
                return;
            }
            var v = constraint.get(attName);
            if (attName === 'min' || attName === 'max') {
                if (v !== '*') {
                    v = parseInt(v, 10);
                }
            } else {
                v = v !== undefined && (v !== 'false' && v !== '0' );
            }

            value[attName] = v;
        });

        result[on] = value;
    });

    return result;
};

/**
 * Get or set the constraint
 *
 *       // Get the constraint 'single' on questions
 *       adcInfo.constraint('questions', 'single');
 *
 *       // Set the constraint 'single' on questions
 *       adcInfo.constraint('questions', 'single', true);
 *
 * @param {String} where Which constraint to target
 * @param {String} attName Name of the constraint attribute to get or set
 * @param {Boolean|Number} [attValue] Value of the attribute to set
 * @return {Boolean|Number} Value of the attribute
 */
ADCInfo.prototype.constraint = function constraint(where, attName, attValue) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("info/constraints/constraint[@on='" + where + "']");
    var result;
    if (attValue !== undefined) {
        if (!el) {
            var parent = xmldoc.find('info/constraints');
            if (!parent) {
                throw new Error("Unable to find the  `constraints` node ");
            }
            el = subElement(parent, 'constraint');
            el.set("on", where);
        }
        el.set(attName, attValue.toString());
    }

    if (!el) {
        return (attName === 'min' || attName === 'max') ? Infinity  : false;
    }

    result = el.get(attName);

    // Some properties are treat as number instead of boolean
    if (attName === 'min' || attName === 'max') {
        if (result === '*') {
            return Infinity;
        }
        return parseInt(result, 10);
    }

    if (result === undefined) {
        return false;
    }

    return (result !== "false" && result !== "0");
};

/**
 * Return the info as xml string
 *
 *       // Serialize the info to XML
 *       adcInfo.toXml();
 *       // -> <info><name>MyADC</name><guid>the-guid</guid>....</info>
 *
 * @return {String}
 */
ADCInfo.prototype.toXml = function toXml() {
    var xml = [],
        self = this,
        style,
        constraints,
        constraintsKeys = ['questions', 'controls', 'responses'];

    xml.push('  <info>');



    ["name", "guid", "version", "date", "description", "company", "author", "site",
        "helpURL"].forEach(function (methodName) {
            var data = self[methodName]();
            if (methodName === 'description' || methodName === 'author') {
                data = '<![CDATA[' + data + ']]>';
            }
            xml.push('    <' + methodName + '>' + data + '</' + methodName + '>');
    });

    xml.push('    <categories>');
    self.categories().forEach(function (cat) {
        xml.push('      <category>' + cat + '</category>');
    });
    xml.push('    </categories>');

    style = self.style();
    xml.push('    <style width="' + style.width + '" height="' + style.height + '" />' );

    constraints = self.constraints();
    xml.push('    <constraints>');

    constraintsKeys.forEach(function (on) {
        if (!constraints[on]) {
            return;
        }
        var str = '      <constraint on="' + on + '"',
            constraint = constraints[on];
        for(var key in constraint) {
            if (constraint.hasOwnProperty(key)) {
                str += ' ' + key + '="' + constraint[key].toString() + '"';
            }
        }
        str += ' />';
        xml.push(str);
    });
    xml.push('    </constraints>');

    xml.push('  </info>');
    return xml.join('\n');
};


/**
 * Provide an object to manipulate the outputs  of the ADC (config.xml > outputs)
 *
 *      var ADC = require('adcutil').ADC;
 *
 *      var myAdc = new ADC('path/to/adc/');
 *      myAdc.load(function (err) {
 *          if (err) {
 *              throw err;
 *          }
 *
 *          // Get the instance of the Outputs
 *          var outputs = myAdc.configurator.outputs;
 *
 *          console.log(outputs.get());
 *
 *      });
 *
 * @class ADC.Configurator.Outputs
 */
function ADCOutputs(configurator) {
    this.configurator = configurator;
}

/**
 * Creates a new instance of ADC Outputs
 *
 * @constructor
 * @param {ADC.Configurator} configurator Instance of the configurator
 */
ADCOutputs.prototype.constructor = ADCOutputs;

/**
 * Get or set the default ADC output
 *
 *       // Get the id default output
 *       adcOutputs.defaultOutput();
 *
 *       // Set the default output id
 *       adcInfo.defaultOutput("without_javascript");
 *
 * @param {String} [data] Id of the default output to set
 * @returns {String} Id of the default output
 */
ADCOutputs.prototype.defaultOutput = function defaultOutput(data) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("outputs");
    if (!el) {
        el = subElement(xmldoc.getroot(), 'outputs');
    }
    if (data && typeof data === 'string') {
        el.set('defaultOutput', data);
    }
    return el.get('defaultOutput');
};

/**
 * Get outputs as an object
 *
 *       // Get the outputs object
 *       adcOutputs.get();
 *       // {
 *       //   defaultOutput  : "main",
 *       //   outputs : [{
 *       //      id : 'main',
 *       //      description : "Description of the output"
 *       //      condition : "Condition of the output",
 *       //      contents  : [{
 *       //         fileName : "default.html",
 *       //         type     : "html",
 *       //         mode     : "dynamic",
 *       //         position : "placeholder"
 *       //      }]
 *       //   }]
 *
 * @returns {Object}
 */
ADCOutputs.prototype.get = function get() {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("outputs");
    var outputs = [];

    if (!el) {
        return null;
    }

    el.iter('output', function (output) {
        // Output element
        var item = {
            id : output.get("id")
        };
        var descEl = output.find("description");
        if (descEl) {
            item.description = descEl.text;
        }
        var conditionEl = output.find("condition");
        if (conditionEl) {
            item.condition = conditionEl.text;
        }
        var defaultGeneration = output.get("defaultGeneration");
        if (defaultGeneration) {
            item.defaultGeneration = (defaultGeneration === "1" || defaultGeneration === "true");
        }
        var maxIter = output.get("maxIterations");
        if (maxIter) {
            item.maxIterations = (maxIter === "*") ? "*" : parseInt(maxIter, 10);
        }

        // Contents
        var contents = [];
        output.iter('content', function (content) {
            var itemContent = {};
            var fileName = content.get('fileName');
            if (fileName) {
                itemContent.fileName = fileName;
            }
            var type = content.get('type');
            if (type) {
                itemContent.type = type;
            }
            var mode = content.get('mode');
            if (mode) {
                itemContent.mode = mode;
            }
            var position = content.get('position');
            if (position) {
                itemContent.position = position;
            }


            // Attributes
            var attributes = [];
            content.iter('attribute', function (attribute) {
                var itemAttr = {};
                itemAttr.name = attribute.get("name");
                var value = attribute.find("value");
                if (value) {
                    itemAttr.value = value.text;
                }
                attributes.push(itemAttr);
            });

            if (attributes.length) {
                itemContent.attributes = attributes;
            }

            // Yield
            var yieldNode = content.find('yield');
            if (yieldNode) {
                itemContent.yieldValue = yieldNode.text;
            }

            contents.push(itemContent);

        });

        if (contents.length) {
            item.contents = contents;
        }

        outputs.push(item);
    });

    return {
        defaultOutput : this.defaultOutput(),
        outputs       : outputs
    };
};

/**
 * Set the outputs using a plain object
 *
 *       // Get the outputs object
 *       adcOutputs.set({
 *          defaultOutput : "main",
 *          outputs : [
 *             {
 *                 id : "main",
 *                 description : "Main output",
 *                  contents : [
 *                       {
 *                          fileName : 'main.css',
 *                          type : 'css',
 *                          mode : 'static',
 *                          position : 'head'
 *                      },
 *                      {
 *                          fileName : 'main.html',
 *                          type : 'html',
 *                          mode : 'dynamic',
 *                          position : 'placeholder'
 *                      },
 *                      {
 *                          fileName : 'main.js',
 *                          type : 'javascript',
 *                          mode : 'static',
 *                          position: 'foot'
 *                      }
 *                  ]
 *              },
 *              {
 *                  id : "second",
 *                  description : "Second output",
 *                  condition : "Browser.Support(\"javascript\")",
 *                  contents : [
 *                      {
 *                          fileName : 'second.css',
 *                          type : 'css',
 *                          mode : 'static',
 *                          position : 'head'
 *                      },
 *                      {
 *                          fileName : 'second.html',
 *                          type : 'html',
 *                          mode : 'dynamic',
 *                          position : 'placeholder'
 *                      },
 *                      {
 *                          fileName : 'second.js',
 *                          type : 'javascript',
 *                          mode : 'static',
 *                          position : 'foot'
 *                      }
 *                  ]
 *              },
 *              {
 *                  id : "third",
 *                  description : "Third output",
 *                  maxIterations : 12,
 *                  defaultGeneration : false,
 *                  contents : [
 *                      {
 *                          fileName : "third.css",
 *                          type  : "css",
 *                          mode : "static",
 *                          position : "head",
 *                          attributes : [
 *                              {
 *                                  name : "rel",
 *                                  value : "alternate"
 *                              },
 *                              {
 *                                  name : "media",
 *                                  value : "print"
 *                              }
 *                          ]
 *                      },
 *                      {
 *                          fileName : 'HTML5Shim.js',
 *                          type : 'javascript',
 *                          mode : 'static',
 *                          position : 'head',
 *                          yieldValue : '<!--[if lte IE 9]><script type="text/javascript"  src="{%= CurrentADC.URLTo("static/HTML5Shim.js") %}" ></script><![endif]-->'
 *                      }
 *                  ]
 *             }
 *
 *       });
 *
 * @param {Object} data Data to set
 * @param {String} [data.defaultOutput] Id of the default output
 * @param {Object[]} [data.outputs] Outputs
 * @param {String} [data.outputs.id] Id of the output
 * @param {String} [data.outputs.description] Description of the output
 * @param {String} [data.outputs.condition] AskiaScript condition to use the output
 * @param {Object[]} [data.outputs.contents] List of contents (files) used by the output
 * @param {String} [data.outputs.contents.fileName] Name of the file
 * @param {String|"text"|"html"|"css"|"javascript"|"binary"|"image"|"audio"|"video"|"flash"} [data.outputs.contents.type] Name of the file
 * @param {String|"dynamic"|"static"|"share"} [data.outputs.contents.mode] Extract mode
 * @param {String|"none"|"head"|"placeholder"|"foot"} [data.outputs.contents.position] Position in the final page document
 * @param {Object[]} [data.outputs.contents.attributes] List of HTML attributes
 * @param {String} [data.outputs.contents.attributes.name] Name of the HTML attribute
 * @param {String} [data.outputs.contents.attributes.value] Value of the HTML attribute
 * @param {String} [data.outputs.contents.yieldValue] Yield value, used to override the auto-generation
 */
ADCOutputs.prototype.set = function set(data) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("outputs");

    if (!data) {
        return;
    }

    if (!el) {
        el = subElement(xmldoc.getroot(), 'outputs');
    }

    if (data.defaultOutput) {
        el.set("defaultOutput", data.defaultOutput);
    }
    if (!data.outputs || !Array.isArray(data.outputs)) {
        return;
    }
    el.delSlice(0, el.len());
    data.outputs.forEach(function (output) {
        var item = subElement(el, 'output');

        // All output xml attributes
        item.set("id", output.id || "");
        if (typeof output.defaultGeneration === 'boolean') {
            item.set("defaultGeneration", output.defaultGeneration.toString());
        }
        if (output.maxIterations) {
            item.set("maxIterations", output.maxIterations);
        }

        // All output sub-nodes
        if (output.description) {
            var desc = subElement(item, 'description');
            desc.text = output.description;
        }
        if (output.condition) {
            var cond = subElement(item, 'condition');
            cond.text = output.condition;
        }

        if (!output.contents || !Array.isArray(output.contents)) {
            return;
        }

        output.contents.forEach(function (content) {
            var itemContent = subElement(item, 'content');
            itemContent.set("fileName", content.fileName || "");
            itemContent.set("type", content.type || "");
            itemContent.set("mode", content.mode || "");
            itemContent.set("position", content.position || "");

            if (content.attributes && Array.isArray(content.attributes)) {
                content.attributes.forEach(function (attribute) {
                    var itemAttr = subElement(itemContent, 'attribute');
                    itemAttr.set('name', attribute.name || "");
                    if (typeof attribute.value === 'string') {
                        var itemAttrVal = subElement(itemAttr, 'value');
                        itemAttrVal.text = attribute.value;
                    }
                });
            }
            if (content.yieldValue) {
                var itemYield = subElement(itemContent, 'yield');
                itemYield.text = content.yieldValue;
            }

        });
    });

};

/**
 * Return the outputs as xml string
 *
 *       // Serialize the outputs to XML
 *       adcOupts.toXml();
 *       // -> <outputs defaultOutput="main"><output id="main"> ...</outputs>
 *
 * @return {String}
 */
ADCOutputs.prototype.toXml = function toXml() {
    var xml = [],
        data = this.get();

    if (!data) {
        return '';
    }
    xml.push('  <outputs defaultOutput="' + data .defaultOutput + '">');
    if (Array.isArray(data.outputs)) {
        data.outputs.forEach(function (output) {
            var outputAttr = '';
            if (typeof output.defaultGeneration === 'boolean') {
                outputAttr += ' defaultGeneration="' + output.defaultGeneration.toString() + '"';
            }
            if (output.maxIterations) {
                outputAttr += ' maxIterations="' + output.maxIterations + '"';
            }

            xml.push('    <output id="' + output.id + '"' + outputAttr + '>');
            if (output.description) {
                xml.push('      <description><![CDATA[' + output.description + ']]></description>');
            }
            if (output.condition) {
                xml.push('      <condition><![CDATA[' + output.condition + ']]></condition>');
            }

            if (Array.isArray(output.contents)) {
                output.contents.forEach(function (content) {
                    var xmlContent = [];
                    xmlContent.push('      <content');
                    xmlContent.push(' fileName="', content.fileName || "", '"');
                    xmlContent.push(' type="', content.type || "", '"');
                    xmlContent.push(' mode="', content.mode || "", '"');
                    xmlContent.push(' position="', content.position || "", '"');
                    if (!content.attributes && !content.yieldValue) {
                        xmlContent.push(' />');
                    } else {
                        xmlContent.push('>');
                        if (Array.isArray(content.attributes)) {
                            content.attributes.forEach(function (attr) {
                                xmlContent.push('\n        <attribute name="' + attr.name + '">');
                                if (attr.value) {
                                    xmlContent.push('\n          <value><![CDATA[' + (attr.value || "") + ']]></value>');
                                }
                                xmlContent.push('\n        </attribute>');
                            });
                        }

                        if (content.yieldValue) {
                            xmlContent.push('\n        <yield><![CDATA[' + content.yieldValue + ']]></yield>');
                        }
                        xmlContent.push('\n      </content>');
                    }
                    xml.push(xmlContent.join(''));
                });
            }
            xml.push('    </output>');
        });
    }
    xml.push('  </outputs>');
    return xml.join('\n');
};


/**
 * Provide an object to manipulate the propertues of the ADC (config.xml > properties)
 *
 *      var ADC = require('adcutil').ADC;
 *
 *      var myAdc = new ADC('path/to/adc/');
 *      myAdc.load(function (err) {
 *          if (err) {
 *              throw err;
 *          }
 *
 *          // Get the instance of the Properties
 *          var properties = myAdc.configurator.properties;
 *
 *          console.log(properties.get());
 *
 *      });
 *
 * @class ADC.Configurator.Properties
 */
function ADCProperties(configurator) {
    this.configurator = configurator;
}

/**
 * Creates a new instance of ADC Properties
 *
 * @constructor
 * @param {ADC.Configurator} configurator Instance of the configurator
 */
ADCProperties.prototype.constructor = ADCProperties;


/**
 * Get properties as an object
 *
 *       // Get the properties object
 *       adcProperties.get();
 *       // {
 *       //   categories : [{
 *       //      id : "general",
 *       //      name : "General"
 *       //      properties  : [{
 *       //         id : "renderingType",
 *       //         name : "Rendering Type",
 *       //         type : "string",
 *       //         description : "Type of the ADC rendering",
 *       //         value : "classic",
 *       //         options : [{
 *       //           value : "classic",
 *       //           text  : "Classical"
 *       //         }, {
 *       //           value : "image",
 *       //           text  : "Image"
 *       //         }]
 *       //      }]
 *       //   }, {
 *       //      id : "styles",
 *       //      name : "Styles",
 *       //      properties : [{
 *       //         id : "bg",
 *       //         name : "Background color",
 *       //         type : "color",
 *       //         description : "Background color of the ADC",
 *       //         colorFormat : "rgb",
 *       //         value : "255,255,255"
 *       //      }]
 *       //   }
 *       // }
 *
 * @returns {Object}
 */
ADCProperties.prototype.get = function get() {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("properties");
    var categories = [];

    if (!el) {
        return null;
    }

    el.iter('category', function (category) {
        // Category element
        var itemCategory = {
            id : category.get("id") || "",
            name : category.get("name") || "",
            properties : []
        };

        category.iter('property', function (property) {
            var itemProperty = {};
            var xsiType = property.get('xsi:type');
            if (xsiType && xsiType !== 'standardProperty') {
                itemProperty.xsiType = xsiType;
            }
            itemProperty.id = property.get('id') || "";
            var val = property.get('name');
            if (val) {
                itemProperty.name = val;
            }
            val = property.get('type');
            if (val) {
                itemProperty.type = val;
            }
            val = property.get('mode');
            if (val) {
                itemProperty.mode = val;
            }
            val = property.get('visible');
            if (val) {
                itemProperty.visible = (val !== "false" && val !== "0");
            }
            val = property.get('require');
            if (val) {
                itemProperty.require = (val !== "false" && val !== "0");
            }

            // Number
            val = property.get('min');
            if (val) {
                itemProperty.min = parseFloat(val) || val;
            }
            val = property.get('max');
            if (val) {
                itemProperty.max = parseFloat(val) || val;
            }
            val = property.get('decimal');
            if (val) {
                itemProperty.decimal = parseInt(val, 10) || val;
            }

            // String
            val = property.get('pattern');
            if (val) {
                itemProperty.pattern = val;
            }

            // File
            val = property.get('fileExtension');
            if (val) {
                itemProperty.fileExtension = val;
            }

            // Color
            val = property.get('colorFormat');
            if (val) {
                itemProperty.colorFormat = val;
            }

            // Questions
            val = property.get('chapter');
            if (val) {
                itemProperty.chapter = (val !== "false" && val !== "0");
            }
            val = property.get('single');
            if (val) {
                itemProperty.single = (val !== "false" && val !== "0");
            }
            val = property.get('multiple');
            if (val) {
                itemProperty.multiple = (val !== "false" && val !== "0");
            }
            val = property.get('numeric');
            if (val) {
                itemProperty.numeric = (val !== "false" && val !== "0");
            }
            val = property.get('open');
            if (val) {
                itemProperty.open = (val !== "false" && val !== "0");
            }
            val = property.get('date');
            if (val) {
                itemProperty.date = (val !== "false" && val !== "0");
            }

            var desc = property.find('description');
            if (desc) {
                itemProperty.description = desc.text;
            }

            property.iter('value', function (value) {
                var theme = value.get("theme");
                if (!theme && !("value" in itemProperty)) {
                    itemProperty.value = value.text || "";
                } else {
                    itemProperty.valueTheme = itemProperty.valueTheme || {};
                    itemProperty.valueTheme[theme] = value.text || "";
                }
            });

            var options = property.find('options');
            if (options) {
                var itemOptions = [];
                options.iter('option', function (option) {
                    itemOptions.push({
                        value : option.get("value") || "",
                        text : option.get("text") || ""
                    });
                });
                if (itemOptions.length) {
                    itemProperty.options = itemOptions;
                }
            }

            itemCategory.properties.push(itemProperty);
        });

        categories.push(itemCategory);
    });

    return {
        categories       : categories
    };
};


/**
 * Set the properties using a plain object
 *
 *       // Get the properties object
 *       adcProperties.set({
 *          categories : [
 *             {
 *                 id : "general",
 *                 description : "General",
 *                 properties  : [
 *                       {
 *                          id : "background",
 *                          name : "Background color",
 *                          type : "color",
 *                          description : "Color of the ADC background",
 *                          colorFormat : "rgb",
 *                          value  : "255,255,255"
 *                      }
 *                ]
 *             }
 *          ]
 *       });
 *
 * @param {Object} data Data to set
 * @param {Object[]} [data.categories] Categories
 * @param {String} [data.categories.id] Id of the category
 * @param {String} [data.categories.name] User friendly name of the category
 * @param {Object[]} [data.categories.properties] Properties of the category
 * @param {String} [data.categories.properties.id] Id of the property
 * @param {String} [data.categories.properties.name] Name of the property
 * @param {String|"number"|"boolean"|"string"|"color"|"file"|"question"} [data.categories.properties.type] Type of the property
 * @param {String} [data.categories.properties.description] Description of the property
 * @param {String|"static"|"dynamic"} [data.categories.properties.mode] Reading mode of the property value
 * @param {Boolean} [data.categories.properties.visible] Visibility of the property value
 * @param {Boolean} [data.categories.properties.require] Requirement of the property value
 * @param {String} [data.categories.properties.pattern] Pattern of the string property
 * @param {Number} [data.categories.properties.min] Min value of the number property
 * @param {Number} [data.categories.properties.max] Max value of the number property
 * @param {Number} [data.categories.properties.decimal] Allowed decimal of the number property
 * @param {Boolean} [data.categories.properties.chapter] Allowed chapter for question property
 * @param {Boolean} [data.categories.properties.single] Allowed single-closed question for question property
 * @param {Boolean} [data.categories.properties.multiple] Allowed multi-coded question for question property
 * @param {Boolean} [data.categories.properties.numeric] Allowed numeric question for question property
 * @param {Boolean} [data.categories.properties.open] Allowed open-ended question for question property
 * @param {Boolean} [data.categories.properties.date] Allowed date/time question for question property
 * @param {String} [data.categories.properties.value] Default property value
 * @param {Object[]} [data.categories.properties.options] List of options
 * @param {String} [data.categories.properties.options.value] Value of the option
 * @param {String} [data.categories.properties.options.text] Text of the option to display
 */
ADCProperties.prototype.set = function set(data) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("properties");

    if (!data || !data.categories || !Array.isArray(data.categories)) {
        return;
    }

    if (!el) {
        el = subElement(xmldoc.getroot(), 'properties');
    }
    el.delSlice(0, el.len());
    data.categories.forEach(function (category) {
        var itemCategory = subElement(el, 'category');

        itemCategory.set("id", category.id || "");
        itemCategory.set("name", category.name || "");

        if (category.properties && Array.isArray(category.properties)) {
            category.properties.forEach(function (property) {
                var itemProperty = subElement(itemCategory, 'property');
                itemProperty.set('xsi:type', property.xsiType || "standardProperty");
                itemProperty.set('id', property.id || "");
                var props = ["name", "type", "mode", "require", "visible", "min", "max", "decimal", "pattern",
                    "fileExtension", "colorFormat", "chapter", "single", "multiple", "numeric", "open", "date"];
                props.forEach(function (prop){
                    if (prop in property) {
                        itemProperty.set(prop, property[prop].toString());
                    }
                });

                if ("description" in property) {
                    var itemDesc = subElement(itemProperty, "description");
                    itemDesc.text = property.description || "";
                }
                if ("value" in property) {
                    var itemValue = subElement(itemProperty, "value");
                    itemValue.text = property.value || "";
                }

                if (property.valueTheme) {
                    var itemTheme;
                    for (var theme in property.valueTheme) {
                        if (property.valueTheme.hasOwnProperty(theme)) {
                            itemTheme = subElement(itemProperty, "value");
                            itemTheme.set("theme", theme);
                            itemTheme.text = property.valueTheme[theme].toString();
                        }
                    }
                }

                if (property.options && Array.isArray(property.options)) {
                    var itemOptions = subElement(itemProperty, "options");
                    property.options.forEach(function (option) {
                        var itemOption = subElement(itemOptions, "option");
                        itemOption.set("value", option.value.toString());
                        itemOption.set("text", option.text.toString());
                    });
                }
            });
        }
    });

};


/**
 * Return the properties as xml string
 *
 *       // Serialize the properties to XML
 *       adcProps.toXml();
 *       // -> <properties><category id="genereal" name="Genereal"> ...</properties>
 *
 * @return {String}
 */
ADCProperties.prototype.toXml = function toXml() {
    var xml = [],
        data = this.get();

    if (!data) {
        return '';
    }
    xml.push('  <properties>');
    if (Array.isArray(data.categories)) {
        data.categories.forEach(function (category) {
            xml.push('    <category id="' + (category.id || "") + '" name="' + (category.name || "")  + '">');
            if (Array.isArray(category.properties)) {
                category.properties.forEach(function (property) {
                    var xmlProp = [], value;
                    xmlProp.push('      <property');
                    xmlProp.push(' xsi:type="', (property.xsiType || "standardProperty"), '"');
                    xmlProp.push(' id="', property.id || "", '"');
                    var props = ["name", "type", "mode", "require", "visible", "min", "max", "decimal", "pattern",
                        "fileExtension", "colorFormat", "chapter", "single", "multiple", "numeric", "open", "date"];
                    props.forEach(function (prop){
                        if (prop in property) {
                            xmlProp.push(' ' + prop + '="', property[prop].toString() , '"');
                        }
                    });
                    xmlProp.push('>');

                    if ("description" in property) {
                        xmlProp.push('\n        <description><![CDATA[' + property.description + ']]></description>');
                    }
                    if ("value" in property) {
                        value = property.value;
                        if (value !== "") {
                            value = '<![CDATA[' + value + ']]>';
                        }
                        xmlProp.push('\n        <value>' + value + '</value>');
                    }
                    if (property.valueTheme) {
                        for (var theme in property.valueTheme) {
                            value = property.valueTheme[theme];
                            if (value !== "") {
                                value = '<![CDATA[' + value + ']]>';
                            }
                            xmlProp.push('\n        <value theme="' + theme + '">' + value + '</value>');
                        }
                    }

                    if (property.options && Array.isArray(property.options)) {
                        xmlProp.push('\n        <options>');
                        property.options.forEach(function (opt) {
                            xmlProp.push('\n          <option value="' + opt.value +'" text="' + opt.text + '" />');
                        });
                        xmlProp.push('\n        </options>');
                    }


                    xmlProp.push('\n      </property>');

                    xml.push(xmlProp.join(''));
                });
            }
            xml.push('    </category>');
        });
    }
    xml.push('  </properties>');
    return xml.join('\n');
};

// Make it public
exports.Configurator = Configurator;