Ext.data.JsonP.ADX_InterviewsFactory({"tagname":"class","name":"ADX.InterviewsFactory","autodetected":{},"files":[{"filename":"ADXInterviews.js","href":"ADXInterviews.html#ADX-InterviewsFactory"}],"members":[{"name":"_cache","tagname":"property","owner":"ADX.InterviewsFactory","id":"property-_cache","meta":{"private":true}},{"name":"path","tagname":"property","owner":"ADX.InterviewsFactory","id":"property-path","meta":{}},{"name":"constructor","tagname":"method","owner":"ADX.InterviewsFactory","id":"method-constructor","meta":{}},{"name":"clear","tagname":"method","owner":"ADX.InterviewsFactory","id":"method-clear","meta":{}},{"name":"create","tagname":"method","owner":"ADX.InterviewsFactory","id":"method-create","meta":{}},{"name":"getById","tagname":"method","owner":"ADX.InterviewsFactory","id":"method-getById","meta":{}},{"name":"remove","tagname":"method","owner":"ADX.InterviewsFactory","id":"method-remove","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-ADX.InterviewsFactory","short_doc":"Factory of the interviews\n\n var ADX = require('adxutil').ADX;\n\n var myAdx = new ADX('path/to/adx/');\n myAdx.load(func...","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/ADXInterviews.html#ADX-InterviewsFactory' target='_blank'>ADXInterviews.js</a></div></pre><div class='doc-contents'><p>Factory of the interviews</p>\n\n<pre><code> var ADX = require('adxutil').ADX;\n\n var myAdx = new ADX('path/to/adx/');\n myAdx.load(function (err) {\n     if (err) {\n         throw err;\n     }\n\n     // Get the instance of the interviews\n     var inter = myAdx.interviews.create();\n\n     console.log(inter.id);\n\n });\n</code></pre>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-_cache' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.InterviewsFactory'>ADX.InterviewsFactory</span><br/><a href='source/ADXInterviews.html#ADX-InterviewsFactory-property-_cache' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.InterviewsFactory-property-_cache' class='name expandable'>_cache</a> : Object<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Interviews cache ...</div><div class='long'><p>Interviews cache</p>\n<p>Defaults to: <code>{}</code></p></div></div></div><div id='property-path' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.InterviewsFactory'>ADX.InterviewsFactory</span><br/><a href='source/ADXInterviews.html#ADX-InterviewsFactory-property-path' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.InterviewsFactory-property-path' class='name expandable'>path</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'><p>Path of the ADX directory</p>\n</div><div class='long'><p>Path of the ADX directory</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.InterviewsFactory'>ADX.InterviewsFactory</span><br/><a href='source/ADXInterviews.html#ADX-InterviewsFactory-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/ADX.InterviewsFactory-method-constructor' class='name expandable'>ADX.InterviewsFactory</a>( <span class='pre'>adxDirPath</span> ) : <a href=\"#!/api/ADX.InterviewsFactory\" rel=\"ADX.InterviewsFactory\" class=\"docClass\">ADX.InterviewsFactory</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Create a new instance of interviews factory ...</div><div class='long'><p>Create a new instance of interviews factory</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>adxDirPath</span> : String<div class='sub-desc'><p>Path of the ADX directory</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/ADX.InterviewsFactory\" rel=\"ADX.InterviewsFactory\" class=\"docClass\">ADX.InterviewsFactory</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-clear' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.InterviewsFactory'>ADX.InterviewsFactory</span><br/><a href='source/ADXInterviews.html#ADX-InterviewsFactory-method-clear' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.InterviewsFactory-method-clear' class='name expandable'>clear</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Remove all instance of interviews ...</div><div class='long'><p>Remove all instance of interviews</p>\n</div></div></div><div id='method-create' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.InterviewsFactory'>ADX.InterviewsFactory</span><br/><a href='source/ADXInterviews.html#ADX-InterviewsFactory-method-create' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.InterviewsFactory-method-create' class='name expandable'>create</a>( <span class='pre'></span> ) : <a href=\"#!/api/ADX.Interview\" rel=\"ADX.Interview\" class=\"docClass\">ADX.Interview</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Create a new instance of interview ...</div><div class='long'><p>Create a new instance of interview</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/ADX.Interview\" rel=\"ADX.Interview\" class=\"docClass\">ADX.Interview</a></span><div class='sub-desc'><p>Returns a new instance of interview</p>\n</div></li></ul></div></div></div><div id='method-getById' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.InterviewsFactory'>ADX.InterviewsFactory</span><br/><a href='source/ADXInterviews.html#ADX-InterviewsFactory-method-getById' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.InterviewsFactory-method-getById' class='name expandable'>getById</a>( <span class='pre'>id</span> ) : undefined|<a href=\"#!/api/ADX.Interview\" rel=\"ADX.Interview\" class=\"docClass\">ADX.Interview</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Get the instance of interview using his id ...</div><div class='long'><p>Get the instance of interview using his id</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>id</span> : String<div class='sub-desc'><p>Id of the interview to retrieve</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>undefined|<a href=\"#!/api/ADX.Interview\" rel=\"ADX.Interview\" class=\"docClass\">ADX.Interview</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-remove' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.InterviewsFactory'>ADX.InterviewsFactory</span><br/><a href='source/ADXInterviews.html#ADX-InterviewsFactory-method-remove' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.InterviewsFactory-method-remove' class='name expandable'>remove</a>( <span class='pre'>id</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Remove the instance of interview using his id ...</div><div class='long'><p>Remove the instance of interview using his id</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>id</span> : String<div class='sub-desc'><p>Id of the interview to remove</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});