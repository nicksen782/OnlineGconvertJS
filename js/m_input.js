gc.funcs.input={
	// * Reset inputs.
	reset_inputs : function(){
		if( gc.vars.originUAM == true && gc.vars.UAM_active ){
			gc.vars.dom.input.uam_gameList_select.value="";

			gc.vars.dom.input.uam_xmlList_select.value="";

			gc.vars.dom.input.uam_imgName.value="";
			gc.vars.dom.input.uam_imgName.setAttribute("gameid"  , "");
		  	gc.vars.dom.input.uam_imgName.setAttribute("gamename", "");

		  	gc.vars.dom.input.uam_xmlList_select.options[0].text=gc.vars.dom.input.uam_xmlList_select.options.length-1 + " XML files";
			gc.vars.dom.input.uam_xmlList_select.options[0].value="";

			// Unhide the hidden options.
		  	gc.vars.dom.input.uam_xmlList_select.querySelectorAll("option").forEach(function(d,i,a){
		  		d.classList.remove("hidden");
		  	});
		}

		gc.vars.dom.input.canvas.getContext("2d").clearRect(0,0,gc.vars.dom.input.canvas.width, gc.vars.dom.input.canvas.height);
		gc.vars.dom.input.xml.value="";

	  	gc.vars.dom.input.imgWidth     .innerHTML = "";
		gc.vars.dom.input.imgHeight    .innerHTML = "";
		gc.vars.dom.input.tileWidth    .innerHTML = "";
		gc.vars.dom.input.tileHeight   .innerHTML = "";
		gc.vars.dom.input.pointersSize .innerHTML = "";
		gc.vars.dom.input.mapCount     .innerHTML = "";
		gc.vars.dom.input.xformVersion .innerHTML = "";
		gc.vars.dom.input.validateXML  .innerHTML = "";
		gc.vars.dom.input.validateMaps .innerHTML = "";
		gc.vars.dom.input.validateIMG  .innerHTML = "";

	}
	// * Used with multi-xml files to process all of it.
	,multi_process  : function(){
		// Get the filenames for the images and download only the unique images.
		var imgFiles=[];
		var imgs=[];
		var readyProm = new Promise(function(resolve, reject){}) ;

		gc.vars.settings.input.full_jsonObj["gfx-xform"]["TILESET"].map(
			function(d,i,a){
				if(imgFiles.indexOf( d["gfx-xform"]["input"]["@file"] ) == -1){
					imgFiles.push(
						 d["gfx-xform"]["input"]["@file"]
					);

					imgs.push( {
						 "filename":d["gfx-xform"]["input"]["@file"]
						,"img":null
						,"promise":
							new Promise(function(resolve,reject){
								var img=new Image();
								img.onload=function(){
									img.onload=null;
									resolve({
										 img          : img
										,img_filename : d["gfx-xform"]["input"]["@file"]
									});
								};
								// img.src = gc.vars.dom.input.canvas.toDataURL("image/png");
								img.src = d["gfx-xform"]["input"]["@file"];
							})
					} ) ;
				}
			}
		);

		// Get the individual XMLs for each tileset.
		var xmls = gc.vars.settings.input.full_jsonObj["gfx-xform"]["TILESET"].map(
			function(d,i,a){
				var x2js = new X2JS( { attributePrefix : "@",stripWhitespaces:true,useDoubleQuotes:true } );

				var xmlObj = x2js.json2xml_str( d );
				var newXml = gc.funcs.shared.format_xmlText('<?xml version="1.0" ?>\n' + xmlObj );

				return {
					 "xml"          : newXml
					,"json"         : d
					,"img_filename" : d["gfx-xform"]["input"]["@file"]
					,"img_index"    : imgFiles.indexOf( d["gfx-xform"]["input"]["@file"] )
				};
			}
		);

		// Get only the image promises.
		var proms1 = imgs.map(function(d,i,a){ return d.promise; });

		var ind=0;
		var iterative1 = function(xmls, results, callback){
				if(ind>=xmls.length){
					// DONE!
					console.log("LAST ITERATION!");
					callback(xmls, results);
				}
				else{
					var xmlObj  = xmls[ind].xml;
					var jsonObj = xmls[ind].json;
					var img     = results [ xmls[ind].img_index ].img;

					gc.funcs.input.inputDataValidation(jsonObj, img).then(
						function(res){
							ind+=1;
							iterative1(xmls, results, callback);
						}
						,function(err){
							console.log("ERROR", err, ind);
							ind+=1;
							iterative1(xmls, results, callback);
						}
					);
				}
		};
		var readyToProcess = function (xmls, results){
			var xmlObj;
			var jsonObj;
			var img;
			gc.vars.settings.output.tsTextOutputs=[];


			var ind=0;
			var iterative2 = function(){
				if(ind>=xmls.length){
					// DONE!
					// gc.vars.dom.output.combinedTextareaWindow.classList.add('show');
					// console.log("gc.vars.settings.output.tsTextOutputs", gc.vars.settings.output.tsTextOutputs);
					// return;
					var text_tileset_PROGMEM = "";
					var text_mapset_PROGMEM  = "";
					var text_tileset_C2BIN   = "";
					var text_mapset_SKIPMAP  = "";
					var text_mapset_NOWHERE  = "";
					var text_mapset_C2BIN    = "";

					gc.vars.dom.output.progmemTextarea.value="";
					gc.vars.dom.output.c2binTextarea.value="";

					gc.vars.settings.output.tsTextOutputs.forEach(
						function(d,i,a){
							var textObject = {
								 text_tileset_PROGMEM : d.textObject.text_tileset_PROGMEM
								,text_tileset_C2BIN   : d.textObject.text_tileset_C2BIN
								,text_mapset_PROGMEM  : d.textObject.text_mapset_PROGMEM
								,text_mapset_SKIPMAP  : d.textObject.text_mapset_SKIPMAP
								,text_mapset_NOWHERE  : d.textObject.text_mapset_NOWHERE
								,text_mapset_C2BIN    : d.textObject.text_mapset_C2BIN
								,generatedTime        : d.textObject.generatedTime
							};

							gc.funcs.output.final_outputText(
								textObject,
								true,
								d.dstFile,
								d.dstFile2
							);
						}
					);

					return;
				}

				xmlObj  = xmls[ind].xml;
				jsonObj = xmls[ind].json;
				img     = results [ xmls[ind].img_index ].img;

				// Send to Map Editor, then immediately send to the Processor.
				// Put the xml text in the textarea and draw the img.
				gc.vars.dom.input.xml.value = xmls[ind].xml;
				gc.vars.dom.input.canvas.width=img.width;
				gc.vars.dom.input.canvas.height=img.height;

				gc.vars.dom.maps.canvas_main.width=img.width;
				gc.vars.dom.maps.canvas_main.height=img.height;

				gc.vars.dom.input.canvas.getContext("2d").drawImage(img, 0, 0);
				gc.vars.dom.maps.canvas_main.getContext("2d").drawImage(img, 0, 0);

				gc.funcs.maps.parseInput(jsonObj, img).then(
					 function(success){
					 	// console.log("SUCCESS:", success);
					 	// document.getElementById( 'section_mapedit' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
					 	// console.clear();
					 	gc.funcs.maps.beginProcessToC().then(
					 		 function(data){
				 				// console.log("5555 SUCCESS", data);
				 				ind+=1;
				 				setTimeout(function(){
				 					// Save the text output data to RAM.
				 					gc.vars.settings.output.tsTextOutputs.push(
				 						{
				 							 "textObject": data.textObject
				 							,"dstFile"   : data.dstFile
				 							,"dstFile2"  : data.dstFile2
				 						}
				 					);

									iterative2();
				 				}, 125);
				 			}
				 			,function(error){
				 				console.log("ERROR", error);
				 				ind+=1;
								iterative2();
				 			}
				 		);
					}
					,function(error){
					 	console.log("ERROR:", error);
					}
				);

			};

			document.getElementById( 'section_gcOutput' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );

			setTimeout(function(){
				iterative2();
			}, 1000);
		};

		// When all the image download promises have resolved...
		Promise.all( proms1 ).then(
			// All promises were resolved.
			function(results){
				iterative1(xmls, results, readyToProcess );
			}
			// One of the promises had a rejection (unlikely.)
			,function(error){
				// reject('ERROR: multi_process: One of the promises had a rejection.\n' + error);
				console('ERROR: multi_process: One of the promises had a rejection.\n' + error);
			}
		);

	}
	,showHideInputElements:function(src, version){
		// Reset - Add the unavailableView class.
		if(src=='uam'){
			gc.vars.dom.input.uam_updateXML               .classList.add("unavailableView") // "XML Update"
			gc.vars.dom.input.uam_updateIMG               .classList.add("unavailableView") // "IMG Update"
			gc.vars.dom.input.uam_multiTs2_batchRunAndSave.classList.add("unavailableView") // "Run as batch with save"
		}
		gc.vars.dom.input.download_inputImg.classList.add("unavailableView") // "Download IMG"
		gc.vars.dom.input.goToMapEditor    .classList.add("unavailableView") // "Load into the Map Editor"
		gc.vars.dom.input.validate1        .classList.add("unavailableView") // "Re-validate"
		gc.vars.dom.input.validate2        .classList.add("unavailableView") // "Re-validate"
		gc.vars.dom.input.download_inputXml.classList.add("unavailableView") // "Download XML"
		gc.vars.dom.input.download_inputImg.classList.add("unavailableView") // "Download IMG"
		
		// Clear the canvas too.
		gc.vars.dom.input.canvas.width  = 8;
		gc.vars.dom.input.canvas.height = 8;
		gc.vars.dom.input.canvas.getContext("2d").clearRect(0, 0, gc.vars.dom.input.canvas.width, gc.vars.dom.input.canvas.height);

		// Stop here if this is just a clear.
		if(version == "_CLEAR_ALL_"){ return; }

		// Add/Remove the unavailableView class based on type.
		switch(version){
			case undefined: 
			case "": 
			case "1": 
			case "SINGLE_TS": { 
				if(src=='uam'){
					gc.vars.dom.input.uam_updateXML               .classList.remove("unavailableView") // "XML Update"
					gc.vars.dom.input.uam_updateIMG               .classList.remove("unavailableView") // "IMG Update"
					gc.vars.dom.input.uam_multiTs2_batchRunAndSave.classList.add("unavailableView") // "Run as batch with save"
				}
				gc.vars.dom.input.download_inputImg.classList.remove("unavailableView") // "Download IMG"
				gc.vars.dom.input.goToMapEditor    .classList.remove("unavailableView") // "Load into the Map Editor"
				gc.vars.dom.input.validate1        .classList.remove("unavailableView") // "Re-validate"
				gc.vars.dom.input.validate2        .classList.remove("unavailableView") // "Re-validate"
				gc.vars.dom.input.download_inputXml.classList.remove("unavailableView") // "Download XML"
				gc.vars.dom.input.download_inputImg.classList.remove("unavailableView") // "Download IMG"
				
				break; 
			}
			case "MULTI_TS2": { 
				if(src=='uam'){
					gc.vars.dom.input.uam_updateXML               .classList.remove("unavailableView") // "XML Update"
					gc.vars.dom.input.uam_updateIMG               .classList.add("unavailableView") // "IMG Update"
					gc.vars.dom.input.uam_multiTs2_batchRunAndSave.classList.remove("unavailableView") // "Run as batch with save"
				}
				gc.vars.dom.input.download_inputImg.classList.add("unavailableView") // "Download IMG"
				gc.vars.dom.input.goToMapEditor    .classList.add("unavailableView") // "Load into the Map Editor"
				gc.vars.dom.input.validate1        .classList.add("unavailableView") // "Re-validate"
				gc.vars.dom.input.validate2        .classList.add("unavailableView") // "Re-validate"
				gc.vars.dom.input.download_inputXml.classList.add("unavailableView") // "Download XML"
				gc.vars.dom.input.download_inputImg.classList.add("unavailableView") // "Download IMG"
				break; 
			}
			default : {
				console.log("showHides: version: <unknown>", version);
				break;
			}
		}
	}

	// * Event listener.
	,selectTestData_load      : function(src){
	  	var elem;
		var selectedOption;
		var url;

	  	if(src == 'testdata'){
		  	elem           = gc.vars.dom.input.selectTestData;
		  	selectedOption = elem.options[elem.selectedIndex];
		  	url            = selectedOption.getAttribute('url') + "?r=" + (new Date()).getTime();url;

		  	gc.funcs.input.reset_inputs();

			if( gc.vars.originUAM == true && gc.vars.UAM_active ){
			  	gc.vars.dom.input.uam_imgName.setAttribute("gameid", "");
			  	gc.vars.dom.input.uam_imgName.setAttribute("gamename", "");
			}
	  	}
	  	else if(src=='uam'){
		  	elem           = gc.vars.dom.input.uam_xmlList_select;
		  	selectedOption = elem.options[elem.selectedIndex];
		  	url            = selectedOption.getAttribute('webpath') + "?r=" + (new Date()).getTime();

		  	gc.vars.dom.input.uam_imgName.setAttribute("gameid", selectedOption.getAttribute("gameid"));
	  	}

	  	if(elem.value==""){
	  		console.log("None selected.");
	  		return;
	  	}

		var prom = new Promise(
			function(resolveOuter, rejectOuter){
				// Get the selected test data value and load those files.
				gc.funcs.shared.getFile_fromUrl( url ).then(async function(xmlString){
					// var parser = new DOMParser();
					// xmlString = parser.parseFromString(xmlString,"text/xml");

					// XML retrieved. Now get the image.
					var x2js = new X2JS( {
						attributePrefix : "@"
						, stripWhitespaces:true
						, useDoubleQuotes:true
						}
					);

					var full_jsonObj = JSON.parse( JSON.stringify( x2js.xml_str2json( xmlString ), null, 0 ) );
					var jsonObj
					var srcImage ;
					
					// Make sure that the XML is valid and was successfully parsed.
					if(!full_jsonObj){
						let msg1 = "The XML could not be parsed.";
						console.log(msg1);
						alert      (msg1);
						rejectOuter(msg1);
						return;
					}

					// console.log(full_jsonObj, xmlString);
					// console.log(x2js.xml_str2json( xmlString ), xmlString);

					// Get the version.
					var version = full_jsonObj["gfx-xform"]['@version'];

					// Show/hide input elements.
					gc.funcs.input.showHideInputElements(src, version);
					
					// Check the version!
					// TODO
					if(version=="MULTI_TS2"){
						// MULTI_TS2 requires "<xml_files>" containing at least one "<xml_file>".
						if(full_jsonObj["gfx-xform"]["xml_files"] && full_jsonObj["gfx-xform"]["xml_files"]['xml_file'].length){
							// Clear input.full_jsonObj.
							gc.vars.settings.input.full_jsonObj = {};
							
							// Put the xmlString in the input xml.
							gc.vars.dom.input.xml.value = xmlString;
						}

						// Resolve and return.
						resolveOuter("MULTI_TS2");
						return;
					}
					else{
						gc.vars.settings.input.full_jsonObj = {};
						jsonObj = full_jsonObj;
						srcImage = jsonObj["gfx-xform"]["input"]['@file'];
						// gc.funcs.input.adjustMultiXml_select( [] );

						if(src=='uam'){
							let parts = srcImage.split("/");
							gc.vars.dom.input.uam_imgName.value=parts[ parts.length-1 ];
							gc.vars.dom.input.uam_imgName.setAttribute("gamename", selectedOption.getAttribute("gamename"));
						}
					}

					// NO IMAGE? ABORT.
					if(!srcImage){
						console.log("An image is required before XML validation can take place. Add an image to your XML.");
						alert      ("An image is required before XML validation can take place. Add an image to your XML.");
						rejectOuter("Missing image!");
						return;
					}

					// Get the image from the url.
					var img;
					try{ img = await gc.funcs.shared.getImageElem_fromUrl(srcImage); } 
					catch(e){
						alert(`ERROR: ${e.text}\n\nSRC: ${e.src}`);
						console.log("ERROR:", e);
						throw "ABORT";
					}

					// Draw the image to the canvas.
					var ctx1 = gc.vars.dom.input.canvas.getContext("2d");
					ctx1.canvas.width = img.width;
					ctx1.canvas.height = img.height;
					ctx1.drawImage(img, 0, 0);

					// Validate the XML and IMG.
					gc.funcs.input.inputDataValidation(jsonObj, img).then(
						function(success){
							// console.log("SUCCESS!", success);
							resolveOuter(success);
						}
						, function(error){
							console.log("ERROR!", error);
							rejectOuter(error);
						}
					);

				});
			}
		);

		prom.then(
			  function(success){
				// console.log("SUCCESS:",success);
			}
			, function(error)  {
				console.log("ERROR:",error);
			}
		);

		return prom;

	  }
	//
	// ,adjustMultiXml_select    : function( tilesetNames ){
	// 	console.log("I am about to go bye-bye: adjustMultiXml_select");
	// 	// console.log("adjustMultiXml_select:", tilesetNames);

	// 	var i;
	// 	var option;

	// 	// If the array is populated, populate the select menu and then show it.
	// 	if(tilesetNames.length){
	// 		gc.vars.dom.input.xml_multi_div.classList.remove("unavailableView");
	// 		gc.vars.dom.input.xml_multi_select.length=0;
	// 		option = document.createElement("option");
	// 		option.value="";
	// 		option.text="... " + tilesetNames.length + " tilesets available";
	// 		gc.vars.dom.input.xml_multi_select.appendChild(option);

	// 		for(i=0; i<tilesetNames.length; i+=1){
	// 			option = document.createElement("option");
	// 			option.value=i;
	// 			option.text=tilesetNames[i]['name'] + " (" + tilesetNames[i]['text'] + ")";
	// 			gc.vars.dom.input.xml_multi_select.appendChild(option);
	// 		}
	// 	}

	// 	// If the array is empty, empty and then hide the select menu.
	// 	else{
	// 		gc.vars.dom.input.xml_multi_div.classList.add("unavailableView");
	// 		gc.vars.dom.input.xml_multi_select.length=0;
	// 		option = document.createElement("option");
	// 		option.value="";
	// 		option.text="";
	// 		gc.vars.dom.input.xml_multi_select.appendChild(option);
	// 	}
	// }
	// * Validate XML and IMG. Both are required.
	,inputDataValidation : function(jsonObj, img){
		return new Promise(function(resolve, reject){
			var x2js = new X2JS({ attributePrefix : "@" , stripWhitespaces:true , useDoubleQuotes:true } );

			var tileHeight;
			var tileWidth;
			var version;
			var pointersSize;
			var dstFile;
			var dstFile2;
			var tilesetName;
			var mapCount;
			var srcImage;
			var imgWidth;
			var imgHeight;
			var cols;
			var rows;
			var maps;
			var map;

			// If the XML is invalid (missing something attempted to be read here) then the promise needs to be rejected.
			try{
				tileHeight   = parseInt(jsonObj["gfx-xform"]["input"]['@tile-height'], 10);
				tileWidth    = parseInt(jsonObj["gfx-xform"]["input"]['@tile-width'], 10);
				version      = jsonObj["gfx-xform"]["@version"];
				pointersSize = parseInt(jsonObj["gfx-xform"]["output"]["maps"]['@pointers-size'], 10);
				dstFile      = jsonObj["gfx-xform"]["output"]['@file'];
				dstFile2     = jsonObj["gfx-xform"]["output"]['@file2'];
				tilesetName  = jsonObj["gfx-xform"]["output"]["tiles"]["@var-name"];
				mapCount     = jsonObj["gfx-xform"]["output"]["maps"]["map"].length;
				srcImage     = jsonObj["gfx-xform"]["input"]['@file'];
				imgWidth     = img.width;
				imgHeight    = img.height;

				// Determine number of rows and number of columns.
				cols = imgWidth/tileWidth;
				rows = imgHeight/tileHeight;

				// Get an array of maps. ParseInt where needed.
				// console.log(jsonObj);
				maps = [];
				map = [];
				var m;
				for(m=0; m<jsonObj["gfx-xform"]["output"]["maps"]["map"].length; m+=1){
						// Parse int on the number attributes.
					map = jsonObj["gfx-xform"]["output"]["maps"]["map"][m];
					maps.push(
						{
							 "@left"   : parseInt( map["@left"]     , 10)
							,"@top"    : parseInt( map["@top"]      , 10)
							,"@width"  : parseInt( map["@width"]    , 10)
							,"@height" : parseInt( map["@height"]   , 10)
						}
					);
				}

				// maps = jsonObj["gfx-xform"]["output"]["maps"]["map"].map(function(d,i,a){
				// 	// Parse int on the number attributes.
				// 	d["@left"]     = parseInt( d["@left"]     , 10);
				// 	d["@top"]      = parseInt( d["@top"]      , 10);
				// 	d["@width"]    = parseInt( d["@width"]    , 10);
				// 	d["@height"]   = parseInt( d["@height"]   , 10);
				// 	return d;
				// });
			}
			catch(e){
				reject(e);
				return;
			}

			// Display the data into the DOM.
			gc.vars.dom.input.xformVersion .innerHTML = version;
			gc.vars.dom.input.pointersSize .innerHTML = pointersSize;
			gc.vars.dom.input.tileWidth    .innerHTML = tileWidth;
			gc.vars.dom.input.tileHeight   .innerHTML = tileHeight;
			gc.vars.dom.input.mapCount     .innerHTML = mapCount;
			gc.vars.dom.input.imgWidth     .innerHTML = imgWidth;
			gc.vars.dom.input.imgHeight    .innerHTML = imgHeight;
			gc.vars.dom.input.validateIMG  .innerHTML = '<span title="Good!"style="color:green">GOOD</span>'; // version;

			// Look for maps that are out of bounds or are missing attributes.
			var allMapsAreValid=true;
			var oobMaps=[];
			var missingKeyMaps=[];
			for(var i=0; i<maps.length; i++){
				var map = maps[i];

				// Confirm that the required keys exist.
				if     ( map["@var-name"] === "" ){ missingKeyMaps.push( map["@var-name"] + ' is missing the attribute: var-name.\n'); allMapsAreValid=false; }
				else if( map["@left"]     === "" ){ missingKeyMaps.push( map["@var-name"] + ' is missing the attribute: left.\n'    ); allMapsAreValid=false; }
				else if( map["@top"]      === "" ){ missingKeyMaps.push( map["@var-name"] + ' is missing the attribute: top.\n'     ); allMapsAreValid=false; }
				else if( map["@width"]    === "" ){ missingKeyMaps.push( map["@var-name"] + ' is missing the attribute: width.\n'   ); allMapsAreValid=false; }
				else if( map["@height"]   === "" ){ missingKeyMaps.push( map["@var-name"] + ' is missing the attribute: height.\n'  ); allMapsAreValid=false; }

				// Perform the checks.
				var check1 =  map["@left"] > cols               ; // * #1: (map starts OOB         (right side)
				var check2 = (map["@left"] + map["@width"])  > cols ; // * #2: (map dimensions are OOB (right side)
				var check3 =  map["@top"]  > rows               ; // * #3: (map starts OOB         (bottom side)
				var check4 = (map["@top"]  + map["@height"]) > rows ; // * #4: (map dimensions are OOB (bottom side)

				var check1Fail_text = '* #1: (map starts OOB         (right side) ' ;
				var check2Fail_text = '* #2: (map dimensions are OOB (right side) ' ;
				var check3Fail_text = '* #3: (map starts OOB         (bottom side)' ;
				var check4Fail_text = '* #4: (map dimensions are OOB (bottom side)' ;

				// Did a check fail?
				if ( check1 || check2 || check3 || check4 ) {
					console.log(
						"ERROR: Map is Out Of Bounds:  " + map['@var-name'] +
						"\n\nFAILED CHECKS:" +
						 ( check1 ? '\n  ' + check1Fail_text + '' : '' ) +
						 ( check2 ? '\n  ' + check2Fail_text + '' : '' ) +
						 ( check3 ? '\n  ' + check3Fail_text + '' : '' ) +
						 ( check4 ? '\n  ' + check4Fail_text + '' : '' ) +
						"\n\nABORTING."
					);

					oobMaps.push(
						map["@var-name"] +
						 ( check1 ? '\n  ' + check1Fail_text + '' : '' ) +
						 ( check2 ? '\n  ' + check2Fail_text + '' : '' ) +
						 ( check3 ? '\n  ' + check3Fail_text + '' : '' ) +
						 ( check4 ? '\n  ' + check4Fail_text + '' : '' ) +
						 "\n"
					);

					allMapsAreValid=false;
				}

			}
			// Adjust the display for map validation.
			if(!allMapsAreValid){
				gc.vars.dom.input.validateMaps .innerHTML = '<span title="MISSING:\n'+( oobMaps.join("\n") + "\n\n" + missingKeyMaps.join("\n") )+'" style="color:red">ERROR</span>'; // version;
				// reject('One or more tilemaps are invalid.');
			}
			else{
				gc.vars.dom.input.validateMaps .innerHTML = '<span title="Good!"style="color:green">GOOD</span>'; // version;
			}

			// Look for any missing required data.
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
				gc.vars.dom.input.validateXML  .innerHTML = '<span title="MISSING:\n'+ missingValues.join("\n") +'" style="color:red">ERROR</span>'; // version;
				// reject('Missing some values.');
			}
			else{
				gc.vars.dom.input.validateXML  .innerHTML = '<span title="Good!"style="color:green">GOOD</span>'; // version;
			}

			// Display the results in the HTML.
			var xmlObj = x2js.json2xml_str( jsonObj );

			var newXml = gc.funcs.shared.format_xmlText('<?xml version="1.0" ?>\n' + xmlObj );

			gc.vars.dom.input.xml.value = newXml ;

			var invalidImageWidth  = (imgWidth  % tileWidth  !=0) ? 1 : 0 ;
			var invalidImageHeight = (imgHeight % tileHeight !=0) ? 1 : 0 ;

			// DEBUG:
			if     (missingKeyMaps.length) { console.log("missingKeyMaps", missingKeyMaps); reject('One or more tilemaps are missing required attributes.'); }
			else if(missingValues.length)  { console.log("missingValues" , missingValues);  reject('One or more required keys are missing.'); }
			else if(oobMaps.length)        { console.log("oobMaps"       , oobMaps);        reject('One or more tilemaps are out of bounds.'); }
			else if(invalidImageWidth) {
				console.log("invalidImageWidth:", invalidImageWidth);
				reject('Dimensions of the image are incorrect. (Invalid image width.)');
			}
			else if(invalidImageHeight) {
				console.log("invalidImageHeight:", invalidImageHeight);
				reject('Dimensions of the image are incorrect. (Invalid image height.)');
			}
			else{
				resolve('Validation has passed!');
			}

		});
	}
	// * Invokes inputDataValidation.
	,inputDataValidation_manual : function(){
		return new Promise(function(resolve, reject){
			var datas = [
				  { 'filename' : "json", 'promise' : new Promise(function(resolve,reject){
						// Convert the XML to JSON for easier parsing.
						var x2js = new X2JS( { attributePrefix : "@",stripWhitespaces:true,useDoubleQuotes:true });

						// To JSON.
						var jsonObj =  JSON.stringify( x2js.xml_str2json( gc.vars.dom.input.xml.value ), null, 1 ) ;
						resolve(jsonObj);
					}                           ) }
				, { 'filename' : "img" , 'promise' : new Promise(function(resolve,reject){
						var img=new Image();
						img.onload=function(){
							img.onload=null;
							resolve(img);
						};
						img.src = gc.vars.dom.input.canvas.toDataURL("image/png");
					}                           ) }
			];

			var proms = datas.map(function(d,i,a){ return d.promise; });

			// Run the 'then' part after all the promises resolve.
			Promise.all( proms ).then(
				// All promises were resolved.
				function(results){
					var jsonObj = JSON.parse(results[0]);
					var img     = results[1];

					gc.funcs.input.inputDataValidation(jsonObj, img).then(
						function(success){
							resolve( {
								"jsonObj":jsonObj
								,"img"   :img
							});
						}
						,function(error) {
							// console.log("1 error: inputDataValidation_manual:", error);
							reject(error);
							return false;
						}
					) ;
				}
				// One of the promises had a rejection (unlikely.)
				,function(error){
					reject('ERROR: inputDataValidation_manual: One of the promises had a rejection.\n' + error);
				}
			);

		});

	}
	// * Event listener: Validate the XML and IMG.
	,validate            : function(){
		gc.funcs.input.inputDataValidation_manual().then(
			 function(data) {
			 	// console.log("DATA :", data );
			 }
			,function(error){
				console.log("ERROR:", error);
				alert("An error occurred while parsing the XML data.\n\n"+error.toString() );

			}
		);
	}
	// * Event listener: Clicks the (hidden) XML file upload button.
	,loadXml_clickUpload : function(){
		// This just clicks the upload button. That's it.
		gc.vars.dom.input.loadXml_file.click();
	}
	// * Event listener: Clicks the (hidden) IMG file upload button.
	,loadImg_clickUpload : function(){
		// This just clicks the upload button. That's it.
		gc.vars.dom.input.loadImg_file.click();
	}
	// * Event listener: Reads in the XML file, checks that it can be parsed, formats it, displays it.
	,loadXml             : function(e){
		// This ONLY loads the XML. It is assumed that both the XML and the IMG will be provided to the program by the user.
		var file = e.target.files[0];
		var reader = new FileReader();

		reader.onload = function(){
			reader.onload=null;
			e.target.value=null;

			var newXml = reader.result;

			// Check that this is an XML file.
			var validXml = gc.funcs.shared.checkXML(newXml);
			if(!validXml){
				console.log("The XML file could not be parsed. The data is likely malformed. Please check then try again.");
				alert      ("The XML file could not be parsed. The data is likely malformed. Please check then try again.");
				gc.vars.dom.input.xml.value = "" ;
				return;
			}

			var x2js = new X2JS( {
				  attributePrefix : "@"
				, stripWhitespaces:true
				, useDoubleQuotes:true
				}
			);
			var full_jsonObj = JSON.parse( JSON.stringify( x2js.xml_str2json( newXml ), null, 0 ) );
			// var version = full_jsonObj["gfx-xform"]['@version'];
			gc.vars.settings.input.full_jsonObj = {};
			// gc.funcs.input.adjustMultiXml_select( [] );

			newXml = gc.funcs.shared.format_xmlText(newXml);
			gc.vars.dom.input.xml.value = newXml ;
		};

		if (file) { reader.readAsText(file); }


	}
	// loadXML_multi
	// ,loadXML_multi : function(e){
	// 	// loadXML_multi
	// 	var ts_index = gc.vars.dom.input.xml_multi_select.value;
	// 	var src_image;
	// 	var jsonObj;

	// 	if(ts_index==""){
	// 		console.log("A blank value was selected.");
	// 		// alert      ("A blank value was selected.");

	// 		// Erase the canvas and the textarea.
	// 		gc.vars.dom.input.xml.value="";
	// 		gc.vars.dom.input.canvas.width=100;
	// 		gc.vars.dom.input.canvas.height=100;
	// 		gc.vars.dom.input.canvas.getContext("2d").clearRect(0,0,gc.vars.dom.input.canvas.width, gc.vars.dom.input.canvas.height);

	// 		return;
	// 	}
	// 	jsonObj   = gc.vars.settings.input.full_jsonObj["gfx-xform"]["TILESET"][ts_index];
	// 	// console.log(jsonObj, gc.vars.settings.input.full_jsonObj);
	// 	// console.log(jsonObj);
	// 	src_image = jsonObj["gfx-xform"]["input"]["@file"];

	// 	// Get the image.
	// 	var img = new Image();
	// 	img.onload = function(){
	// 		img.onload=null;
	// 		var ctx1 = gc.vars.dom.input.canvas.getContext("2d");
	// 		ctx1.canvas.width = img.width;
	// 		ctx1.canvas.height = img.height;
	// 		ctx1.drawImage(img, 0, 0);

	// 		// Pass the JSON and the IMG to the validator.
	// 		gc.funcs.input.inputDataValidation(jsonObj, img);
	// 	};
	// 	img.src=src_image;

	// }
	// * Event listener: Reads in the IMG file and draws it to the canvas.
	,loadImg             : function(e){
		// This ONLY loads the IMG.
		var file = e.target.files[0];
		var reader = new FileReader();
		reader.onload = function(){
			reader.onload=null;
			e.target.value=null;
			var img=new Image();
			img.onload=function(){
				img.onload=null;
				var ctx1 = gc.vars.dom.input.canvas.getContext("2d");
				ctx1.canvas.width = img.width;
				ctx1.canvas.height = img.height;
				ctx1.drawImage(img, 0, 0);
			};
			img.src = reader.result;
		};
		if (file) { reader.readAsDataURL(file); }
	}
	// Event listener: Draws the data that was copy/pasted to the canvas.
	,drawPastedImage     : function(e){
		// Make sure the pasted data is is an image.
		var srcElem    = gc.vars.dom.input.canvas_inputText ;// document.querySelector('#'+srcElem);
		var targetElem = gc.vars.dom.input.canvas;           // document.querySelector('#'+targetElem);
		var items = (e.clipboardData || e.originalEvent.clipboardData).items;

		// Draw this image to the canvas.
		var fileFound=false;
		var item;
		var reader = new FileReader();
		reader.onload = function(event) {
			// reader.onload=null;
			var ctx1 = targetElem.getContext("2d");
			var image = new Image();
			image.onload = function() {
				// Load the image into the main src canvas.
				ctx1.canvas.width  = image.width;
				ctx1.canvas.height = image.height;
				ctx1.drawImage(image, 0, 0);

				setTimeout(function(){
					srcElem.value="";
				}, 1);

			};
			image.src = event.target.result;

		};

		for (var index in items) {
			if (items[index].kind === 'file') {
				item = items[index];
				fileFound=true;

				var blob = item.getAsFile();

				reader.readAsDataURL(blob);
			}
		}
		if(!fileFound){
			console.log("ERROR: You pasted something other than an image file.");
			alert      ("ERROR: You pasted something other than an image file.");

			setTimeout(function(){
				srcElem.value="";
			}, 1);

			return;
		}


	}
	// * Event listener: Provides the JSON and IMG to the map editor which will break-out and display the data.
	,goToMapEditor       : function(){
		// Validate the XML and the IMG. Only continue if they validate.
		var jsonObj;
		var img;

		return new Promise(function(resolve, reject){
			gc.funcs.input.inputDataValidation_manual().then(
				 function(data){
				 	// console.log("Validation was successful");
				 	jsonObj = data.jsonObj;
				 	img = data.img;

				 	// Check if the tilesetOutputTo and removeDupeTiles keys exist and are populated.
					var tilesetOutputTo  = jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"];
					var removeDupeTiles  = jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"];
					var outputAsJson     = jsonObj["gfx-xform"]["output"]["tiles"]["@outputAsJson"];

				 	// Provide default values.
					if(tilesetOutputTo == undefined || tilesetOutputTo == ""){
						tilesetOutputTo = "PROGMEM";
						jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"] = tilesetOutputTo;
					}
				 	// Provide default values.
					if(removeDupeTiles==undefined || removeDupeTiles == ""){
						removeDupeTiles = 1;
						jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"] = removeDupeTiles;
					}
					// Set the DOM controls for tilesetOutputTo and removeDupeTiles.
					gc.vars.dom.maps.tilesetOutputTo.value   = tilesetOutputTo;
					gc.vars.dom.maps.removeDupeTiles.checked = removeDupeTiles == "1" ? true : false;
					gc.vars.dom.maps.outputAsJson.checked    = outputAsJson    == "1" ? true : false;

				 //	console.log("tilesetOutputTo:", tilesetOutputTo);
					// console.log("removeDupeTiles:", removeDupeTiles);

					gc.funcs.maps.parseInput(jsonObj, img).then(function(){
						document.getElementById( 'section_mapedit' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
						resolve();
					});

				 }
				,function(error){
					console.log("Validation was NOT successful. Please fix before you try again.", error);
					alert      ("Validation was NOT successful. Please fix before you try again.");
					reject();
				}
			);
		});

	}

	,addEventListeners  : function(){
		// LOAD: Test Data (select)
		gc.vars.dom.input.selectTestData     .addEventListener('change', function(){gc.funcs.input.selectTestData_load('testdata'); }, false);

		// LOAD: Test Data (load)
		gc.vars.dom.input.selectTestData_load.addEventListener('click', function(){gc.funcs.input.selectTestData_load('testdata'); }, false);

		// LOAD: XML (Load XML button)
		gc.vars.dom.input.loadXml             .addEventListener('click', gc.funcs.input.loadXml_clickUpload, false);
		gc.vars.dom.input.loadXml_file        .addEventListener('change', gc.funcs.input.loadXml, false);

		// LOAD: IMG (Load IMG button)
		gc.vars.dom.input.loadImg             .addEventListener('click', gc.funcs.input.loadImg_clickUpload, false);
		gc.vars.dom.input.loadImg_file        .addEventListener('change', gc.funcs.input.loadImg, false);

		// ACTION: Load into the Map Editor (button)
		gc.vars.dom.input.goToMapEditor       .addEventListener('click',
			function(){
				gc.funcs.input.goToMapEditor()
				.then(
					function(res)  { },
					function(error){
						console.log("error:", error);
					}
				);
			}
		, false);

		// ACTION: Re-validate (button)
		gc.vars.dom.input.validate1           .addEventListener('click', gc.funcs.input.validate, false);
		gc.vars.dom.input.validate2           .addEventListener('click', gc.funcs.input.validate, false);

		// LOAD via MULTI:
		// gc.vars.dom.input.xml_multi_select    .addEventListener('change', gc.funcs.input.loadXML_multi, false);
		// gc.vars.dom.input.xml_multi_batch_btn .addEventListener('click', gc.funcs.input.multi_process, false);

		// Double-click and paste image upload
		gc.vars.dom.input.canvas              .addEventListener('dblclick', function(){
				// console.log("Double-clicked!");
				gc.vars.dom.input.canvas_inputText.value = "";
				gc.vars.dom.input.canvas_inputText.focus();
			}, false);
		gc.vars.dom.input.canvas_inputText    .addEventListener('paste', gc.funcs.input.drawPastedImage, false);

		// Download input xml
		gc.vars.dom.input.download_inputXml   .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("srcXml", true); }, false);
		// Download input img
		gc.vars.dom.input.download_inputImg   .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("srcImg", true); }, false);

	}
};