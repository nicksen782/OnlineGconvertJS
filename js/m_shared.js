gc.funcs.shared={
	// * Make an AJAX request.
	serverRequest        : function(formData){
		// Make sure that a ._config key exists and that it has values.
		if( typeof formData._config              == "undefined" ){ formData._config = {}; }
		if( typeof formData._config.responseType == "undefined" ){ formData._config.responseType = "json" ; }
		if( typeof formData._config.hasFiles     == "undefined" ){ formData._config.hasFiles     = false  ; }
		if( typeof formData._config.filesHandle  == "undefined" ){ formData._config.filesHandle  = null   ; }
		if( typeof formData._config.method       == "undefined" ){ formData._config.method       = "POST" ; }
		if( typeof formData._config.processor    == "undefined" ){ formData._config.processor    = "index_p.php" ; }
		if( typeof formData._config.noProgress    == "undefined" ){ formData._config.noProgress  = false ; }

		return new Promise(function(resolve, reject) {
			var progress_showPercent = function(){
			};

			var progress_hidePercent = function(){
			};

			// Event handlers.
			var updateProgress   = function(oEvent) {
				return;
				var text="Progress:";
				if (oEvent.lengthComputable) {
					var percentComplete = oEvent.loaded / oEvent.total * 100;
					console.log(text, "percentComplete:", percentComplete, oEvent);
				}
				else {
					// Unable to compute progress information since the total size is unknown
					// console.log(text, "cannot determine", oEvent);
				}
			} ;
			var transferComplete = function(evt)    {
				// The default responseType is text if it is not specified.
				// However, this function (serverRequest) defaults it to 'json' if it is not specified.
				var data={};

				switch( this.responseType ){
					case    'text'        : { data = this.responseText ; break; }
					case    'arraybuffer' : { data = this.responseText ; break; }
					case    'blob'        : { data = this.responseText ; break; }
					case    'json'        : { data = this.response     ; break; }
					default               : { data = this.responseText ; break; }
				}

				// Required for IE.
				if (formData._config.responseType == "json" && typeof data == "string") {
					data = JSON.parse(data);
				}

				resolve(data);
			} ;
			var transferFailed   = function(evt)    {
				console.log("An error occurred during the transfer.");
				reject({
					'type' : evt.type ,
					'xhr'  : xhr      ,
					'evt'  : evt      ,
				});
			} ;
			var transferCanceled = function(evt)    {
				console.log("The transfer has been canceled by the user.", evt);
			} ;
			var loadEnd          = function(e)      {
				// console.log("The transfer finished (although we don't know if it succeeded or not).", e);
				if(!formData._config.noProgress){
					try{ gc.funcs.shared.activateProgressBar(false); } catch(e){ }
				}
			} ;

			// Create the form.
			var fd = new FormData();
			var o = formData.o ;
			// fd.append("o" , formData.o );

			// Add the keys and values.
			for (var prop in formData) {
				// Skip the "_config" key.
				if( prop == "_config" ) { continue; }
				if( prop == "_config" ) { continue; }
				// Append the key and value.
				fd.append(prop , formData[prop] );
			}

			// Are there files included?
			if(formData._config.hasFiles){
				console.log("Uploading this many files:", formData._config.filesHandle.files.length);
				for(var i=0; i<formData._config.filesHandle.files.length; i++){
					console.log("On file "+(i+1)+" of "+formData._config.filesHandle.files.length, "("+formData._config.filesHandle.files[i].name+")");
					fd.append(formData._config.filesHandle.files[i].name, formData._config.filesHandle.files[i]);
				}
			}

			var xhr = new XMLHttpRequest();

			xhr.addEventListener( "progress" , updateProgress   );
			xhr.addEventListener( "load"     , transferComplete );
			xhr.addEventListener( "error"    , transferFailed   );
			xhr.addEventListener( "abort"    , transferCanceled );
			xhr.addEventListener( "loadend"  , loadEnd          );

			xhr.open(
				formData._config.method,
				formData._config.processor + "/o=" +o+ "?r=" + (new Date()).getTime(),
				true
			);

			// If a responseType was specified then use it.
			if(formData._config && formData._config.responseType){
				// switch( this.responseType ){
				switch( formData._config.responseType.responseType ){
					case    'text'        : { xhr.responseType = "text"       ; break; }
					case    'arraybuffer' : { xhr.responseType = "arraybuffer"; break; }
					case    'blob'        : { xhr.responseType = "blob"       ; break; }
					case    'json'        : { xhr.responseType = "json"       ; break; }
					default               : { xhr.responseType = "json"       ; break; }
				}
			}
			// Otherwise, it is almost always 'json' so specify that.
			else{
				xhr.responseType = "json";
			}

			if(!formData._config.noProgress){
				try{ gc.funcs.shared.activateProgressBar(true); } catch(e){ }
			}

			// setTimeout(function() { xhr.send(fd); }, 1);
			xhr.send(fd);
		});

		// USAGE EXAMPLE:
		// You can skip the _config part in most cases unless you want to specify a value there that isn't the default.
		//	var formData = {
		//		"o"       : "test",
		//		"somekey"  : "some value"           ,
		//		"_config" : {
		//			"responseType" : "json",
		//			"hasFiles"     : false ,
		//			"filesHandle"  : null  , // document.querySelector('#emu_gameDb_builtInGames_choose');
		//			"method"       : "POST", // POST or GET
		//			"processor"    : "index_p.php"
		//		}
		//	};
		//	var prom1 = gc.funcs.serverRequest(formData);

	},
	// * Used for rejected promises. Generic. Just displays the error to the console.
	rejectedPromise: function(error) {
		console.log("ERROR", error);
	},
	// * Show/hide the progress bar. Used by serverRequest.
	activateProgressBar  : function(turnItOn) {
		let onClickListener = function(){ gc.funcs.shared.activateProgressBar(false); };

		let progressbarDiv = document.querySelector("#progressbarDiv");
		let entireBodyDiv  = document.querySelector("#entireBodyDiv");

		// Activate the progress bar and screen darkener.
		if (turnItOn === true) {
			entireBodyDiv.classList.add("active");
			progressbarDiv.classList.add("active");
			entireBodyDiv.addEventListener("click", onClickListener, false);
		}
		// De-activate the progress bar and screen darkener.
		else if (turnItOn === false) {
			entireBodyDiv.classList.remove("active");
			progressbarDiv.classList.remove("active");
			entireBodyDiv.removeEventListener("click", onClickListener, false);
		}
	},
	// * Show/hide the progress bar. Used by serverRequest.
	showC2BIN_modal  : function(turnItOn) {
		let onClickListener = function(){ gc.funcs.shared.showC2BIN_modal(false); };

		let c2bin_modal = document.querySelector("#c2bin_modal");
		let entireBodyDiv  = document.querySelector("#entireBodyDiv");

		// Activate the progress bar and screen darkener.
		if (turnItOn === true) {
			entireBodyDiv.classList.add("active");
			c2bin_modal.classList.add("active");
			entireBodyDiv.addEventListener("click", onClickListener, false);
		}
		// De-activate the progress bar and screen darkener.
		else if (turnItOn === false) {
			entireBodyDiv.classList.remove("active");
			c2bin_modal.classList.remove("active");
			entireBodyDiv.removeEventListener("click", onClickListener, false);
		}
	},
	// * Get a file as-is via a url.
	getFile_fromUrl : function(url){
		return new Promise(function(resolve, reject) {
			var finished = function(data) {
				// console.log("success:", this);
				// this.responseType="text/xml";
				// this.responseType="text/plain";
				resolve( this.response );
			};
			var error = function(data) {
				console.log("error:", this, data);
				reject({
					type: data.type,
					xhr: xhr
				});
			};

			var xhr = new XMLHttpRequest();
			// xhr.overrideMimeType('text/xml');
			// xhr.overrideMimeType('text/plain');
			// xhr.setContentType("text/xml");
			// xhr.setContentType("text/plain");
			// xhr.setResponseType("text/xml");
			// xhr.setResponseType("text/plain");

			xhr.addEventListener("load", finished);
			xhr.addEventListener("error", error);
			xhr.open(
				// "POST", // Type of method (GET/POST)
				"GET",     // Type of method (GET/POST)
				url        // Destination
			, true);
			xhr.send();

		});
	},
	// * Retrieve a raw file from the server via URL.
	getImageElem_fromUrl : function(url){
		var img_prom = new Promise(function(resolve, reject){
			var img = new Image();
			let imgUrl = url;
			let randomNum = "?r=" + (new Date()).getTime();
			img.onload = function(){
				img.onload=null;
				resolve(img);
			};
			img.onerror = function(err){
				img.error=null;
				reject({
					"text": "Could not load image",
					"src": img.src
				});
			};
			img.src = imgUrl + randomNum;
		});

		// img_prom.then(function(img){
		// 	console.log("IMG:", img, img.width, img.height);
		// });

		return img_prom;

	},
	// * Set the pixelated settings for a canvas.
	setpixelated         : function(canvas){
			// https://stackoverflow.com/a/13294650
			canvas.getContext("2d").mozImageSmoothingEnabled    = false; // Firefox
			canvas.getContext("2d").imageSmoothingEnabled       = false; // Firefox
			canvas.getContext("2d").oImageSmoothingEnabled      = false; //
			canvas.getContext("2d").webkitImageSmoothingEnabled = false; //
			canvas.getContext("2d").msImageSmoothingEnabled     = false; //
		},
	// * Validate the XML and the IMAGE. Check for missing values and for out of bounds tile maps.
	validateXML          : function(xmlString){
		// Convert the XML to JSON for easier parsing.
		var x2js = new X2JS(
			{
			attributePrefix : "@"
			,stripWhitespaces:true
			,useDoubleQuotes:true
			}
		);
		// To JSON.
		var jsonObj = JSON.parse( JSON.stringify( x2js.xml_str2json( xmlString ), null, 0 ) );

		// Get the required values. Get the gfx-form version first!
		// console.log("jsonObj:", jsonObj);

		var version      = parseInt(jsonObj["gfx-xform"]["@version"], 10);
		var srcImage     = jsonObj["gfx-xform"]["input"]["@file"];
		var tileHeight   = parseInt(jsonObj["gfx-xform"]["input"]["@tile-height"], 10);
		var tileWidth    = parseInt(jsonObj["gfx-xform"]["input"]["@tile-width"], 10);
		var dstFile      = jsonObj["gfx-xform"]["output"]["@file"];
		var dstFile2     = jsonObj["gfx-xform"]["output"]["@file2"];
		var pointersSize = parseInt(jsonObj["gfx-xform"]["output"]["maps"]["@pointers-size"], 10);
		var mapCount     = jsonObj["gfx-xform"]["output"]["maps"]["map"].length;
		var imgWidth     = "";
		var imgHeight    = "";
		var maps         = jsonObj["gfx-xform"]["output"]["maps"]["map"];
		var tilesetName  = jsonObj["gfx-xform"]["output"]["tiles"]["@var-name"];

		// Get the image and load it.
		var prom1 = new Promise(function(resolve, reject) {
			var img = new Image();
			img.onload = function(){
				img.onload=null;
				var ctx1 = gc.vars.dom.input.canvas.getContext("2d");
				ctx1.canvas.width = img.width;
				ctx1.canvas.height = img.height;
				ctx1.drawImage(img, 0, 0);

				gc.vars.dom.input.validateIMG  .innerHTML = "<span title='Good!' style='color:green'>GOOD</span>"; // version;

				imgWidth  = this.width;
				imgHeight = this.height;

				resolve();
			};
			img.src = srcImage;

		}).then(function(){
			gc.vars.dom.input.imgWidth     .innerHTML = imgWidth; // version;
			gc.vars.dom.input.imgHeight    .innerHTML = imgHeight; // version;
			gc.vars.dom.input.tileWidth    .innerHTML = tileWidth;
			gc.vars.dom.input.tileHeight   .innerHTML = tileHeight;
			gc.vars.dom.input.pointersSize .innerHTML = pointersSize;
			gc.vars.dom.input.mapCount     .innerHTML = mapCount;

			gc.vars.dom.input.xformVersion .innerHTML = version;
			gc.vars.dom.input.validateXML  .innerHTML = ""; // version;
			gc.vars.dom.input.validateMaps .innerHTML = ""; // version;

			// Now we can validate the maps.

			// Determine rows and columns.
			var cols = imgWidth/tileWidth;
			var rows = imgHeight/tileHeight;

			// Confirm if all maps are in-bounds and that the required keys exist.
			var allMapsAreValid=true;
			var oobMaps=[];
			var missingKeyMaps=[];
			for(var i=0; i<maps.length; i++){
				var map = maps[i];

				// Parse int on the number attributes.
				map["@var-name"] = map["@var-name"] ;
				map["@left"]     = parseInt( map["@left"]     , 10);
				map["@top"]      = parseInt( map["@top"]      , 10);
				map["@width"]    = parseInt( map["@width"]    , 10);
				map["@height"]   = parseInt( map["@height"]   , 10);

				// Confirm that the required keys exist.
				if     ( map["@var-name"] === "" ){ missingKeyMaps.push( map["@var-name"] + " is missing the attribute: var-name.\n"); allMapsAreValid=false; }
				else if( map["@left"]     === "" ){ missingKeyMaps.push( map["@var-name"] + " is missing the attribute: left.\n"    ); allMapsAreValid=false; }
				else if( map["@top"]      === "" ){ missingKeyMaps.push( map["@var-name"] + " is missing the attribute: top.\n"     ); allMapsAreValid=false; }
				else if( map["@width"]    === "" ){ missingKeyMaps.push( map["@var-name"] + " is missing the attribute: width.\n"   ); allMapsAreValid=false; }
				else if( map["@height"]   === "" ){ missingKeyMaps.push( map["@var-name"] + " is missing the attribute: height.\n"  ); allMapsAreValid=false; }

				// Perform the checks.
				var check1 =  map["@left"] > cols               ; // * #1: (map starts OOB         (right side)
				var check2 = (map["@left"] + map["@width"])  > cols ; // * #2: (map dimensions are OOB (right side)
				var check3 =  map["@top"]  > rows               ; // * #3: (map starts OOB         (bottom side)
				var check4 = (map["@top"]  + map["@height"]) > rows ; // * #4: (map dimensions are OOB (bottom side)

				var check1Fail_text = "* #1: (map starts OOB         (right side) " ;
				var check2Fail_text = "* #2: (map dimensions are OOB (right side) " ;
				var check3Fail_text = "* #3: (map starts OOB         (bottom side)" ;
				var check4Fail_text = "* #4: (map dimensions are OOB (bottom side)" ;

				// Did a check fail?
				if ( check1 || check2 || check3 || check4 ) {
					console.log(
						"ERROR: Map is Out Of Bounds:  " + map["@var-name"] +
						"\n\nFAILED CHECKS:" +
						 ( check1 ? "\n  " + check1Fail_text + "" : "" ) +
						 ( check2 ? "\n  " + check2Fail_text + "" : "" ) +
						 ( check3 ? "\n  " + check3Fail_text + "" : "" ) +
						 ( check4 ? "\n  " + check4Fail_text + "" : "" ) +
						"\n\nABORTING."
					);

					oobMaps.push(
						map["@var-name"] +
						 ( check1 ? "\n  " + check1Fail_text + "" : "" ) +
						 ( check2 ? "\n  " + check2Fail_text + "" : "" ) +
						 ( check3 ? "\n  " + check3Fail_text + "" : "" ) +
						 ( check4 ? "\n  " + check4Fail_text + "" : "" ) +
						 "\n"
					);

					allMapsAreValid=false;
				}

			}
			// Adjust the display for map validation.
			if(!allMapsAreValid){
				gc.vars.dom.input.validateMaps .innerHTML = "<span title=\"MISSING:\n"+( oobMaps.join("\n") + "\n\n" + missingKeyMaps.join("\n") )+"\" style=\"color:red\">ERROR</span>"; // version;
			}
			else{
				gc.vars.dom.input.validateMaps .innerHTML = "<span title=\"Good!\" style=\"color:green\">GOOD</span>"; // version;
			}

			// Make sure the other values exist too!
			var importantValuesAreMissing=false;
			var missingValues = [];
			if( ! version)               { missingValues.push("* version"     ); importantValuesAreMissing=true; }
			if( ! imgWidth)              { missingValues.push("* imgWidth"    ); importantValuesAreMissing=true; }
			if( ! imgHeight)             { missingValues.push("* imgHeight"   ); importantValuesAreMissing=true; }
			if( ! tileWidth)             { missingValues.push("* tileWidth"   ); importantValuesAreMissing=true; }
			if( ! tileHeight)            { missingValues.push("* tileHeight"  ); importantValuesAreMissing=true; }
			if( ! pointersSize)          { missingValues.push("* pointersSize"); importantValuesAreMissing=true; }
			if( ! srcImage)              { missingValues.push("* srcImage"    ); importantValuesAreMissing=true; }
			if( ! dstFile && ! dstFile2) { missingValues.push("* dstFile"     ); importantValuesAreMissing=true; }
			if( ! dstFile2 && ! dstFile) { missingValues.push("* dstFile2"    ); importantValuesAreMissing=true; }
			if( ! tilesetName)           { missingValues.push("* tilesetName" ); importantValuesAreMissing=true; }
			if(importantValuesAreMissing){
				gc.vars.dom.input.validateXML  .innerHTML = "<span title='MISSING:\n'"+ missingValues.join("\n") +"' style='color:red'>ERROR</span>"; // version;
			}
			else{
				gc.vars.dom.input.validateXML  .innerHTML = "<span title='Good!' style='color:green'>GOOD</span>"; // version;
			}

			// Convert to XML for display purposes.
			var xmlObj = x2js.json2xml_str( jsonObj );

			var newXml = gc.funcs.shared.format_xmlText("<?xml version=\"1.0\" ?>\n" + xmlObj );

			gc.vars.dom.input.xml.value = newXml;
		});

	},
	// * Checks if the XML can be parsed.
	checkXML             : function(srcString){
		var valid = false;
		var parsed;

		// Create an XML parser for the retreived XML.
		var parser = new DOMParser();
		// var doc;

		parsed = parser.parseFromString(srcString, "text/xml"); //important to use "text/xml"

		var error = parsed.getElementsByTagName("parsererror").length ;

		if(error){
			valid = false;
		}
		else{
			valid = true;
		}

		return valid;
	},
	// * Get 1-byte rgb332 version of 24-bit rgb.
	rgb_encode332        : function(R, G, B) {
		// Convert the RGB value to RGB332 as hex string. (Jubation)
		// #define SQ_COLOR8(r, g, b) (((r >> 5) & 0x07U) | ((g >> 2) & 0x38U) | ((b) & 0xC0U))
		// var index = ((R >> 5) & 0x07) | ((G >> 2) & 0x38) | ((B) & 0xC0);

		// Convert the RGB value to RGB332 as hex string. (original)
		var index = (B & 0xc0) + ((G >> 2) & 0x38) + (R >> 5);

		// parseInt("0xc0", 16).toString(2) == "11000000"; // 192
		// parseInt("0x38", 16).toString(2) == "00111000"; // 56
		// parseInt("0x00", 16).toString(2) == "00000111"; // 0

		// parseInt(parseInt("0xc0", 16).toString(2), 2); // 192 // 11000000
		// parseInt(parseInt("0x38", 16).toString(2), 2); // 56  // 00111000
		// parseInt(parseInt("0x00", 16).toString(2), 2); // 0   // 00000000

		return index;
	},


	// * Get 24-bit rgb version of 1-byte rgb332.
	rgb_decode332        : function(RGB332) {
		// 0b00000111 >> 0 RED
		// 0b00111000 >> 3 GREEN
		// 0b11000000 >> 6 BLUE

		// Accepts RGB332 byte and converts back to 24-bit RGB.
		let nR = ( ((RGB332 >> 0) & 0b00000111) * (255 / 7) ) << 0; // red
		let nG = ( ((RGB332 >> 3) & 0b00000111) * (255 / 7) ) << 0; // green
		let nB = ( ((RGB332 >> 6) & 0b00000011) * (255 / 3) ) << 0; // blue

		// var nR = ((((RGB332 >> 0) & 7) * (255 / 7))); // red
		// var nG = ((((RGB332 >> 3) & 7) * (255 / 7))); // green

		// OLD
		// var nB = ((((RGB332 >> 5) & 6) * (255 / 7))); // blue

		// NEW
		// var nB = ((RGB332 >> 6)&7) * (255/7);

		// Output all values as an object.
		return { red: nR, green: nG, blue: nB };
	},
	// * Checks the specified canvas against a blank canvas.
	isCanvasBlank        : function(canvasId) {
		// http://stackoverflow.com/a/17386803/2731377
		// http://jsfiddle.net/BBmQY/46/

		var srcElem  = document.querySelector("#"+canvasId);

		var blank = document.createElement("canvas");
		blank.width  = srcElem.width;
		blank.height = srcElem.height;

		// console.log(canvasId, blank.width, blank.height, srcElem.width, srcElem.height);

		return srcElem.toDataURL() == blank.toDataURL();
	},
	// * Neatly formats the XML string.
	format_xmlText       : function(xmlString){
		return xmlString
			 .replace(/\\r\\n/g,        "\n"              ) // Normalize to Unix line endings.
			 .replace(/\\n\\n/g,        "\n"              ) // Remove double line-breaks;
			 .replace(/<input/g,        "\n <input"       ) // Line-break and Indenting
			 .replace(/<output/g,       "\n <output"      ) // Line-break and Indenting
			 .replace(/<tiles/g,        "\n  <tiles"      ) // Line-break and Indenting
			 .replace(/<maps /g,        "\n  <maps "      ) // Line-break and Indenting
			 .replace(/<map /g,         "\n   <map "      ) // Line-break and Indenting
			 .replace(/><\/map>/g,      " /> "            ) // Make each individual map a self-closing tag.
			 .replace(/<\/maps>/g,      "\n  <\/maps> "   ) // Line-break and Outdenting
			 .replace(/<\/output>/g,    "\n <\/output> "  ) // Line-break and Outdenting
			 .replace(/<\/gfx-xform>/g, "\n<\/gfx-xform> ") // Line-break and Outdenting
			 .replace(/  /g           , " "               ) // Replace all double-spaces with one space.
			 .replace(/"\/>/g         , "\" \/>"          ) // Make sure that self-closing tags has a space before the slash.
			 .replace(/\\n/g,           "\r\n"            ) // Normalize to Windows line endings.
			 ;
	}
};