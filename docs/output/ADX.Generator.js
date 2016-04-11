Ext.data.JsonP.ADX_Generator({"tagname":"class","name":"ADX.Generator","autodetected":{},"files":[{"filename":"ADXGenerator.js","href":"ADXGenerator.html#ADX-Generator"}],"private":true,"members":[{"name":"adxAuthor","tagname":"property","owner":"ADX.Generator","id":"property-adxAuthor","meta":{}},{"name":"adxDescription","tagname":"property","owner":"ADX.Generator","id":"property-adxDescription","meta":{}},{"name":"adxName","tagname":"property","owner":"ADX.Generator","id":"property-adxName","meta":{}},{"name":"adxType","tagname":"property","owner":"ADX.Generator","id":"property-adxType","meta":{}},{"name":"outputDirectory","tagname":"property","owner":"ADX.Generator","id":"property-outputDirectory","meta":{}},{"name":"rootdir","tagname":"property","owner":"ADX.Generator","id":"property-rootdir","meta":{}},{"name":"sequence","tagname":"property","owner":"ADX.Generator","id":"property-sequence","meta":{}},{"name":"template","tagname":"property","owner":"ADX.Generator","id":"property-template","meta":{}},{"name":"templateSrc","tagname":"property","owner":"ADX.Generator","id":"property-templateSrc","meta":{}},{"name":"constructor","tagname":"method","owner":"ADX.Generator","id":"method-constructor","meta":{}},{"name":"copyFromTemplate","tagname":"method","owner":"ADX.Generator","id":"method-copyFromTemplate","meta":{}},{"name":"done","tagname":"method","owner":"ADX.Generator","id":"method-done","meta":{}},{"name":"generate","tagname":"method","owner":"ADX.Generator","id":"method-generate","meta":{}},{"name":"updateFiles","tagname":"method","owner":"ADX.Generator","id":"method-updateFiles","meta":{}},{"name":"verifyADXDirNotAlreadyExist","tagname":"method","owner":"ADX.Generator","id":"method-verifyADXDirNotAlreadyExist","meta":{}},{"name":"verifyOutputDirExist","tagname":"method","owner":"ADX.Generator","id":"method-verifyOutputDirExist","meta":{}},{"name":"writeError","tagname":"method","owner":"ADX.Generator","id":"method-writeError","meta":{}},{"name":"writeMessage","tagname":"method","owner":"ADX.Generator","id":"method-writeMessage","meta":{}},{"name":"writeSuccess","tagname":"method","owner":"ADX.Generator","id":"method-writeSuccess","meta":{}},{"name":"writeWarning","tagname":"method","owner":"ADX.Generator","id":"method-writeWarning","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-ADX.Generator","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/ADXGenerator.html#ADX-Generator' target='_blank'>ADXGenerator.js</a></div></pre><div class='doc-contents'><div class='rounded-box private-box'><p><strong>NOTE:</strong> This is a private utility class for internal use by the framework. Don't rely on its existence.</p></div><p>Generate the file structure of an ADX using a template</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-adxAuthor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-adxAuthor' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-adxAuthor' class='name expandable'>adxAuthor</a> : Object<span class=\"signature\"></span></div><div class='description'><div class='short'>Author ...</div><div class='long'><p>Author</p>\n<p>Defaults to: <code>{name: &#39;&#39;, email: &#39;&#39;, company: &#39;&#39;, website: &#39;&#39;}</code></p></div></div></div><div id='property-adxDescription' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-adxDescription' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-adxDescription' class='name expandable'>adxDescription</a> : string<span class=\"signature\"></span></div><div class='description'><div class='short'>Description of the ADX ...</div><div class='long'><p>Description of the ADX</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></div></div><div id='property-adxName' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-adxName' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-adxName' class='name expandable'>adxName</a> : string<span class=\"signature\"></span></div><div class='description'><div class='short'>Name of the ADX ...</div><div class='long'><p>Name of the ADX</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></div></div><div id='property-adxType' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-adxType' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-adxType' class='name expandable'>adxType</a> : \"adc\"|\"adp\"<span class=\"signature\"></span></div><div class='description'><div class='short'>Type of the ADX ...</div><div class='long'><p>Type of the ADX</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></div></div><div id='property-outputDirectory' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-outputDirectory' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-outputDirectory' class='name expandable'>outputDirectory</a> : string<span class=\"signature\"></span></div><div class='description'><div class='short'>Output directory ...</div><div class='long'><p>Output directory</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></div></div><div id='property-rootdir' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-rootdir' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-rootdir' class='name expandable'>rootdir</a> : Object<span class=\"signature\"></span></div><div class='description'><div class='short'><p>Root dir of the current ADXUtil</p>\n</div><div class='long'><p>Root dir of the current ADXUtil</p>\n</div></div></div><div id='property-sequence' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-sequence' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-sequence' class='name expandable'>sequence</a> : *|<a href=\"#!/api/Sequence\" rel=\"Sequence\" class=\"docClass\">Sequence</a><span class=\"signature\"></span></div><div class='description'><div class='short'><p>Sequence of calls</p>\n</div><div class='long'><p>Sequence of calls</p>\n</div></div></div><div id='property-template' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-template' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-template' class='name expandable'>template</a> : string<span class=\"signature\"></span></div><div class='description'><div class='short'><p>Name of the template to use</p>\n</div><div class='long'><p>Name of the template to use</p>\n</div></div></div><div id='property-templateSrc' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-property-templateSrc' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-property-templateSrc' class='name expandable'>templateSrc</a> : string<span class=\"signature\"></span></div><div class='description'><div class='short'>Path of the template directory ...</div><div class='long'><p>Path of the template directory</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/ADX.Generator-method-constructor' class='name expandable'>ADX.Generator</a>( <span class='pre'></span> ) : <a href=\"#!/api/ADX.Generator\" rel=\"ADX.Generator\" class=\"docClass\">ADX.Generator</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Create a new instance of ADX Generator ...</div><div class='long'><p>Create a new instance of ADX Generator</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/ADX.Generator\" rel=\"ADX.Generator\" class=\"docClass\">ADX.Generator</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-copyFromTemplate' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-copyFromTemplate' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-copyFromTemplate' class='name expandable'>copyFromTemplate</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Copy an ADC structure from the template ...</div><div class='long'><p>Copy an ADC structure from the template</p>\n</div></div></div><div id='method-done' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-done' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-done' class='name expandable'>done</a>( <span class='pre'>err</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>End of the sequence chain ...</div><div class='long'><p>End of the sequence chain</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>err</span> : Error<div class='sub-desc'><p>Error</p>\n</div></li></ul></div></div></div><div id='method-generate' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-generate' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-generate' class='name expandable'>generate</a>( <span class='pre'>type, name, [options], [callback]</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Generate a new ADX structure ...</div><div class='long'><p>Generate a new ADX structure</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>type</span> : \"adc\"|\"adp\"<div class='sub-desc'><p>Type of the ADX project</p>\n</div></li><li><span class='pre'>name</span> : String<div class='sub-desc'><p>Name of the ADX project to generate</p>\n</div></li><li><span class='pre'>options</span> : Object (optional)<div class='sub-desc'><p>Options</p>\n<ul><li><span class='pre'>output</span> : String (optional)<div class='sub-desc'><p>Path of the output director</p>\n<p>Defaults to: <code>process.cwd()</code></p></div></li><li><span class='pre'>description</span> : String (optional)<div class='sub-desc'><p>Description of the ADX</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></li><li><span class='pre'>author</span> : Object (optional)<div class='sub-desc'><p>Author of the ADX</p>\n<ul><li><span class='pre'>name</span> : String (optional)<div class='sub-desc'><p>Author name</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></li><li><span class='pre'>email</span> : String (optional)<div class='sub-desc'><p>Author email</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></li><li><span class='pre'>company</span> : String (optional)<div class='sub-desc'><p>Author Company</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></li><li><span class='pre'>website</span> : String (optional)<div class='sub-desc'><p>Author web site</p>\n<p>Defaults to: <code>&#39;&#39;</code></p></div></li></ul></div></li><li><span class='pre'>template</span> : String (optional)<div class='sub-desc'><p>Name of the template to use</p>\n<p>Defaults to: <code>&quot;blank&quot;</code></p></div></li></ul></div></li><li><span class='pre'>callback</span> : Function (optional)<div class='sub-desc'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>err</span> : Error (optional)<div class='sub-desc'><p>Error</p>\n</div></li><li><span class='pre'>outputDirectory</span> : String (optional)<div class='sub-desc'><p>Path of the output directory</p>\n</div></li></ul></div></li></ul></div></div></div><div id='method-updateFiles' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-updateFiles' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-updateFiles' class='name expandable'>updateFiles</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Update the config.xml and the readme files with the name of the ADC, the GUID and the creation date ...</div><div class='long'><p>Update the config.xml and the readme files with the name of the ADC, the GUID and the creation date</p>\n</div></div></div><div id='method-verifyADXDirNotAlreadyExist' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-verifyADXDirNotAlreadyExist' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-verifyADXDirNotAlreadyExist' class='name expandable'>verifyADXDirNotAlreadyExist</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Verify that the ADX directory doesn't exist ...</div><div class='long'><p>Verify that the ADX directory doesn't exist</p>\n</div></div></div><div id='method-verifyOutputDirExist' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-verifyOutputDirExist' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-verifyOutputDirExist' class='name expandable'>verifyOutputDirExist</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Verify that the output directory ...</div><div class='long'><p>Verify that the output directory</p>\n</div></div></div><div id='method-writeError' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-writeError' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-writeError' class='name expandable'>writeError</a>( <span class='pre'>text</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Write an error output in the console ...</div><div class='long'><p>Write an error output in the console</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>text</span> : String<div class='sub-desc'><p>Text to write in the console</p>\n</div></li></ul></div></div></div><div id='method-writeMessage' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-writeMessage' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-writeMessage' class='name expandable'>writeMessage</a>( <span class='pre'>text</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Write an arbitrary message in the console without specific prefix ...</div><div class='long'><p>Write an arbitrary message in the console without specific prefix</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>text</span> : String<div class='sub-desc'><p>Text to write in the console</p>\n</div></li></ul></div></div></div><div id='method-writeSuccess' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-writeSuccess' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-writeSuccess' class='name expandable'>writeSuccess</a>( <span class='pre'>text</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Write a success output in the console ...</div><div class='long'><p>Write a success output in the console</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>text</span> : String<div class='sub-desc'><p>Text to write in the console</p>\n</div></li></ul></div></div></div><div id='method-writeWarning' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='ADX.Generator'>ADX.Generator</span><br/><a href='source/ADXGenerator.html#ADX-Generator-method-writeWarning' target='_blank' class='view-source'>view source</a></div><a href='#!/api/ADX.Generator-method-writeWarning' class='name expandable'>writeWarning</a>( <span class='pre'>text</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Write a warning output in the console ...</div><div class='long'><p>Write a warning output in the console</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>text</span> : String<div class='sub-desc'><p>Text to write in the console</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{"private":true}});