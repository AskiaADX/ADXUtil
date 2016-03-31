Ext.data.JsonP.Sequence({"tagname":"class","name":"Sequence","autodetected":{},"files":[{"filename":"common.js","href":"common.html#Sequence"}],"private":true,"members":[{"name":"constructor","tagname":"method","owner":"Sequence","id":"method-constructor","meta":{}},{"name":"hasNext","tagname":"method","owner":"Sequence","id":"method-hasNext","meta":{}},{"name":"nextIndex","tagname":"method","owner":"Sequence","id":"method-nextIndex","meta":{}},{"name":"resume","tagname":"method","owner":"Sequence","id":"method-resume","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-Sequence","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/common.html#Sequence' target='_blank'>common.js</a></div></pre><div class='doc-contents'><div class='rounded-box private-box'><p><strong>NOTE:</strong> This is a private utility class for internal use by the framework. Don't rely on its existence.</p></div><p>Create a new sequence of function to call</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Sequence'>Sequence</span><br/><a href='source/common.html#Sequence-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/Sequence-method-constructor' class='name expandable'>Sequence</a>( <span class='pre'>sequence, callback, [scope]</span> ) : <a href=\"#!/api/Sequence\" rel=\"Sequence\" class=\"docClass\">Sequence</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Creates a new instance of sequence ...</div><div class='long'><p>Creates a new instance of sequence</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>sequence</span> : Array<div class='sub-desc'><p>Array of function to call one by one</p>\n</div></li><li><span class='pre'>callback</span> : Function<div class='sub-desc'><p>Callback function to execute at the end of the sequence</p>\n</div></li><li><span class='pre'>scope</span> : Object (optional)<div class='sub-desc'><p>Scope of function to execute (this)</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Sequence\" rel=\"Sequence\" class=\"docClass\">Sequence</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-hasNext' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Sequence'>Sequence</span><br/><a href='source/common.html#Sequence-method-hasNext' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Sequence-method-hasNext' class='name expandable'>hasNext</a>( <span class='pre'></span> ) : boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Indicates if there is another function to call in the sequence stack ...</div><div class='long'><p>Indicates if there is another function to call in the sequence stack</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>boolean</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-nextIndex' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Sequence'>Sequence</span><br/><a href='source/common.html#Sequence-method-nextIndex' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Sequence-method-nextIndex' class='name expandable'>nextIndex</a>( <span class='pre'></span> ) : Number<span class=\"signature\"></span></div><div class='description'><div class='short'>Return the index of the next function to execute ...</div><div class='long'><p>Return the index of the next function to execute</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Number</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-resume' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Sequence'>Sequence</span><br/><a href='source/common.html#Sequence-method-resume' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Sequence-method-resume' class='name expandable'>resume</a>( <span class='pre'>err</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Execute the next function ...</div><div class='long'><p>Execute the next function</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>err</span> : Error<div class='sub-desc'><p>Error</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{"private":true}});