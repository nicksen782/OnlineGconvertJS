gc.funcs.maps={
	// * Parses the INPUT and brings it into the map editor.
	 parseInput             : function(jsonObj, img){
	 	// console.log(jsonObj);
		return new Promise(function(resolve, reject){
			var i;
			// Make the JSON numeric values (excluding maps) to be actually numeric.
			jsonObj["gfx-xform"]["input"]['@tile-height']               = parseInt(jsonObj["gfx-xform"]["input"]['@tile-height'], 10);
			jsonObj["gfx-xform"]["input"]['@tile-width']                = parseInt(jsonObj["gfx-xform"]["input"]['@tile-width'], 10);
			jsonObj["gfx-xform"]["output"]["maps"]['@pointers-size']    = parseInt(jsonObj["gfx-xform"]["output"]["maps"]['@pointers-size'], 10);
			jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"] =
				jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"] == "1" ? 1 : 0;

			var maps = jsonObj["gfx-xform"]["output"]["maps"]["map"];

			// Odd bug! If there is only one map then map won't come back as an array (no length property!)
			// Make an array of 1.
			if(typeof maps.length == "undefined"){
				// console.log('typeof maps.length == "undefined"');
				maps = [ maps ];
			}

			// Make the JSON numeric values (in maps) to be actually numeric.
			for(i=0; i<maps.length; i++){
				var map = maps[i];
				// console.log("map:", map);
				map["@left"]   = parseInt(map["@left"]  , 10);
				map["@top"]    = parseInt(map["@top"]   , 10);
				map["@width"]  = parseInt(map["@width"] , 10);
				map["@height"] = parseInt(map["@height"], 10);
			}

			// Get the particulars of the tileset.
			var tileHeight  = jsonObj["gfx-xform"]["input"]['@tile-height'];
			var tileWidth   = jsonObj["gfx-xform"]["input"]['@tile-width'];
			// var tilesetName = jsonObj["gfx-xform"]["output"]["tiles"]["@var-name"];
			var imgWidth    = img.width;
			var imgHeight   = img.height;
			var cols        = imgWidth/tileWidth;
			var rows        = imgHeight/tileHeight;

			// Reset the values in the preview.
			gc.vars.dom.maps.preview_l           .value="0";
			gc.vars.dom.maps.preview_t           .value="0";
			gc.vars.dom.maps.preview_w           .value="2";
			gc.vars.dom.maps.preview_h           .value="2";
			gc.vars.dom.maps.preview_firstTile   .innerHTML="0";
			gc.vars.dom.maps.preview_tileCountMap.innerHTML=cols*rows;

			// Set the min and max values.
			gc.vars.dom.maps.preview_l .setAttribute('min', '0');
			gc.vars.dom.maps.preview_l .setAttribute('max', cols);
			gc.vars.dom.maps.preview_t .setAttribute('min', '0');
			gc.vars.dom.maps.preview_t .setAttribute('max', rows);
			gc.vars.dom.maps.preview_w .setAttribute('min', '0');
			gc.vars.dom.maps.preview_w .setAttribute('max', cols);
			gc.vars.dom.maps.preview_h .setAttribute('min', '0');
			gc.vars.dom.maps.preview_h .setAttribute('max', rows);

			var buff = gc.vars.dom.input.canvas.getContext('2d').getImageData(
				0,0, gc.vars.dom.input.canvas.width, gc.vars.dom.input.canvas.height
			);

			// Convert the canvas_main to the Uzebox RGB332 color space.
			for(i=0; i<buff.data.length; i+=4){
				var red   = buff.data[i+0];
				var green = buff.data[i+1];
				var blue  = buff.data[i+2];
				var alpha = buff.data[i+3];
				var rgb332 = gc.funcs.shared.rgb_encode332(red,green,blue);
				var rgb32  = gc.funcs.shared.rgb_decode332(rgb332);
				buff.data[i+0] = rgb32.red;
				buff.data[i+1] = rgb32.green;
				buff.data[i+2] = rgb32.blue;
				buff.data[i+3] = alpha;
			}

			// Copy the converted data to the map editor source canvas.
			gc.vars.dom.maps.canvas_main.width  = gc.vars.dom.input.canvas.width;
			gc.vars.dom.maps.canvas_main.height = gc.vars.dom.input.canvas.height;
			gc.vars.dom.maps.canvas_main.getContext('2d').putImageData(buff, 0, 0);
			buff=null;

			// Make sure that layer 2 is cleared.
			gc.vars.dom.maps.canvas_main_layer2.width  = gc.vars.dom.maps.canvas_main.width;
			gc.vars.dom.maps.canvas_main_layer2.height = gc.vars.dom.maps.canvas_main.height;
			gc.vars.dom.maps.canvas_main_layer2.getContext('2d').clearRect(
				0, 0 , gc.vars.dom.maps.canvas_main_layer2.width , gc.vars.dom.maps.canvas_main_layer2.height
			);

			// Copy the converted data to the tiny canvas.
			gc.vars.dom.maps.mapedit_image_tiny.width  = gc.vars.dom.maps.canvas_main.width;
			gc.vars.dom.maps.mapedit_image_tiny.height = gc.vars.dom.maps.canvas_main.height;
			gc.vars.dom.maps.mapedit_image_tiny.getContext("2d").drawImage(gc.vars.dom.maps.canvas_main,0,0);

			// Clear the map records div.
			var map_records = gc.vars.dom.maps.maps_records_div;
			map_records.innerHTML="";

			// Add the map rows to the map editor.
			for(i=0; i<maps.length; i++){
				gc.funcs.maps.mapsList_addRow( maps[i], rows, cols );
			}

			// Finally, cache some of the tileset settings.
			gc.vars.settings.maps.tileWidth    = tileWidth   ;
			gc.vars.settings.maps.tileHeight   = tileHeight  ;
			gc.vars.settings.maps.cols         = cols        ;
			gc.vars.settings.maps.rows         = rows        ;
			gc.vars.settings.maps.pointersSize = jsonObj["gfx-xform"]["output"]["maps"]['@pointers-size'];
			gc.vars.settings.maps.version      = jsonObj["gfx-xform"]["@version"];

			var version = gc.vars.settings.maps.version ;
			gc.funcs.maps.grayOut_unavailableView( version );

			// Clear the preview canvas.
			gc.vars.dom.maps.canvas_preview.getContext("2d").clearRect(0,0,
			gc.vars.dom.maps.canvas_preview.width, gc.vars.dom.maps.canvas_preview.height);

			// Scroll the map records to the top.
			// var map_records = gc.vars.dom.maps.maps_records_div;
			map_records.scrollTop = 0;//map_records.scrollHeight;

			resolve();
		});
	}
	,grayOut_unavailableView : function(version){
		// var version = gc.vars.settings.maps.version ;
		// gc.funcs.maps.grayOut_unavailableView( version );

		var records;

		var grayOut;
		switch(version){
			case "1"        : { grayOut=true ; break; }
			case "SINGLE_TS": { grayOut=false; break; }
			case "MULTI_TS" : { grayOut=false; break; }
			default         : { grayOut=true ; break; }
		}
		// +(grayOut ? 'unavailableView' : '')+'
		// #gc3_maps_records_div > div:nth-child(2) > div.td.gc3_outputTo > select

		if(grayOut){
			// Hide the TH and the Additional setting for tilesetOutputTo.
			gc.vars.dom.maps.maps_records_div_colHeaders.querySelector(".gc3_colHeader.gc3_outputTo").classList.add   ('unavailableView');
			gc.vars.dom.maps.tilesetOutputTo.classList.add   ('unavailableView');

			// Hide all the mapOutputTo select menus in the map records.
			records = gc.vars.dom.maps.maps_records_div.querySelectorAll(".maps_record .gc3_outputTo").forEach(function(d,i,a){ d.classList.add('unavailableView'); } );

		}
		// Show the TH and the Additional setting for tilesetOutputTo.
		else{
			gc.vars.dom.maps.maps_records_div_colHeaders.querySelector(".gc3_colHeader.gc3_outputTo").classList.remove('unavailableView');
			gc.vars.dom.maps.tilesetOutputTo.classList.remove   ('unavailableView');

			// Show all the mapOutputTo select menus in the map records.
			records = gc.vars.dom.maps.maps_records_div.querySelectorAll(".maps_record .gc3_outputTo").forEach(function(d,i,a){ d.classList.remove('unavailableView'); } );

		}

	}
	// * Adds a row to the map list.
	,mapsList_addRow        : function(map, rows, cols){
		var map_records = gc.vars.dom.maps.maps_records_div;
		// Set outputTo to PROGMEM if it is undefined or not in the list of acceptable values.
		var outputTo=map["@mapOutputTo"];
		if(outputTo==undefined || ["SKIPMAP", "PROGMEM", "NOWHERE", "C2BIN"].indexOf(outputTo) == -1){
			outputTo = "PROGMEM";
		}

		var newRec = document.createElement('div');
		newRec.setAttribute('class'       , 'maps_record');
		newRec.setAttribute('onclick'     , "gc.funcs.maps.selectMapRecord( this.closest('.maps_record') );");
		newRec.setAttribute('onmouseenter', "gc.funcs.maps.drawMapPreview( this.closest('.maps_record') );");

		// Create the HTML for this map's record.
		var newHTML = '' +
		'\n'+
		' 	<div class="td gc3_select"  > <input type="radio"  name="maps_selected" > </div>\n'+
		' 	<div class="td gc3_varname" > <input onclick="this.select();" type="text"   name="map_varname"   value="'+map["@var-name"]+'"> </div>\n'+
		' 	<div class="td gc3_l"       > <input onclick="this.select();" type="number" name="map_l"         value="'+map["@left"]    +'" min="0" max="'+cols+'" > </div>\n'+
		' 	<div class="td gc3_t"       > <input onclick="this.select();" type="number" name="map_t"         value="'+map["@top"]     +'" min="0" max="'+rows+'" > </div>\n'+
		' 	<div class="td gc3_w"       > <input onclick="this.select();" type="number" name="map_w"         value="'+map["@width"]   +'" min="1" max="'+cols+'" > </div>\n'+
		' 	<div class="td gc3_h"       > <input onclick="this.select();" type="number" name="map_h"         value="'+map["@height"]  +'" min="1" max="'+rows+'" > </div>\n'+
		' 	<div class="td gc3_outputTo">\n'+
		' 		<select value='+outputTo+'" name="mapOutputTo">\n'+
		' 			<option '+(outputTo=="SKIPMAP" ? " selected " : "")+'>SKIPMAP</option>\n'+
		' 			<option '+(outputTo=="PROGMEM" ? " selected " : "")+'>PROGMEM</option>\n'+
		' 			<option '+(outputTo=="NOWHERE" ? " selected " : "")+'>NOWHERE</option>\n'+
		' 			<option '+(outputTo=="C2BIN"   ? " selected " : "")+'>C2BIN  </option>\n'+
		' 		</select>\n'+
		' 	</div>\n'+
		' 	<div class="td gc3_delete"  > <input type="button" value="Delete" name="mapDeleteButton" onclick="gc.funcs.maps.deleteMapRecord( this.closest(\'.maps_record\') );"> </div>\n'+
		'';

		newRec.innerHTML = newHTML;

		// Create the HTML for the map records.
		map_records.appendChild(newRec);
	}
	// * Selects the map record row when clicked.
	,selectMapRecord        : function(e){
		var mapRecordRowElem = e.closest('.maps_record') ;

		// Select this row's radio button.
		mapRecordRowElem.querySelector("input[type='radio'][name='maps_selected']").checked=true;

		// Go through all the radio buttons and remove the animated background.
		var elems = document.querySelectorAll(".maps_record");
		for(var i=0; i<elems.length; i++){
			elems[i].classList.remove('selectedMap_animationBG');
		}

		// Add the animated background to the label of this row's radio button.
		mapRecordRowElem.querySelector("input[type='radio'][name='maps_selected']")
			.closest('.maps_record')
			.classList.add('selectedMap_animationBG');

		// Draw the image into the preview.
		gc.funcs.maps.drawMapPreview(mapRecordRowElem);
	}
	// * Draw preview of the map record that is being hovered over.
	,drawMapPreview         : function(elem){
		// Get the record's fields.
		var left      = parseInt(elem.querySelector('.gc3_l input').value, 10) ;
		var top       = parseInt(elem.querySelector('.gc3_t input').value, 10) ;
		var mapWidth  = parseInt(elem.querySelector('.gc3_w input').value, 10) ;
		var mapHeight = parseInt(elem.querySelector('.gc3_h input').value, 10) ;

		// Get the tile width and tile height.
		var tileWidth  = gc.vars.settings.maps.tileWidth ;
		var tileHeight = gc.vars.settings.maps.tileHeight;

		// Get a handle on the canvases.
		var src_canvas    =  gc.vars.dom.maps.canvas_main        ;
		var src_canvasL2  =  gc.vars.dom.maps.canvas_main_layer2 ;
		var dest_canvas   =  gc.vars.dom.maps.canvas_preview     ;

		// Get the canvas position values.
		// var rect = src_canvas.getBoundingClientRect();

		var srcX = left      * tileWidth  ;
		var srcY = top       * tileHeight ;
		var w    = mapWidth  * tileWidth  ;
		var h    = mapHeight * tileHeight ;

		// Clear the out of bounds indicator.
		gc.vars.dom.maps.preview_firstTile.innerHTML = "";
		gc.vars.dom.maps.preview_firstTile.title     = "";
		gc.vars.dom.maps.preview_firstTile.innerHTML = "#" + (( top * gc.vars.settings.maps.cols )+left);

		// Set layer 2 of the source canvas to fully transparent (clear it.)
		src_canvasL2.getContext('2d').clearRect(
			0, 0
			, src_canvasL2.width
			, src_canvasL2.height
		);

		// Draw a hover indicator on the second layer of the source canvas.
		src_canvasL2.getContext('2d').fillStyle="rgba(244, 67, 54, 0.7)";
		src_canvasL2.getContext('2d').strokeStyle="white";
		src_canvasL2.getContext('2d').lineWidth=0.5;
		src_canvasL2.getContext('2d').fillRect( srcX, srcY, w, h );
		src_canvasL2.getContext('2d').strokeRect( srcX, srcY, w, h );

		// Display the value for left, top, width, height.
		gc.vars.dom.maps.preview_l.value = left      ;
		gc.vars.dom.maps.preview_t.value = top       ;
		gc.vars.dom.maps.preview_w.value = mapWidth  ;
		gc.vars.dom.maps.preview_h.value = mapHeight ;

		// Set the dimensions for the destination canvas.
		dest_canvas.width  = mapWidth  * tileWidth;
		dest_canvas.height = mapHeight * tileHeight;

		// Get the data for the hovered portion of the source canvas.
		var imgData = src_canvas.getContext('2d').getImageData( srcX, srcY, w, h );

		// Draw the data to the preview canvas.
		dest_canvas.getContext('2d').putImageData(imgData, 0, 0);
	}
	// * Draw preview of the potential new map record based on hover of the main canvas.
	,updateHoverMapRecord   : function(e){
		// Abort if the canvas is blank.
		var isBlank = gc.funcs.shared.isCanvasBlank( gc.vars.dom.maps.canvas_main .id );
		if(isBlank){
			// console.log("Canvas is blank. Nothing to do here.");
			return;
		}

		// Bring in some required vars.
		var tileWidth     = gc.vars.settings.maps.tileWidth    ;
		var tileHeight    = gc.vars.settings.maps.tileHeight   ;
		var cols          = gc.vars.settings.maps.cols         ;
		var rows          = gc.vars.settings.maps.rows         ;
		// var pointersSize  = gc.vars.settings.maps.pointersSize ;

		// Get a handle on the canvases.
		var src_canvas    =  gc.vars.dom.maps.canvas_main        ;
		var src_canvasL2  =  gc.vars.dom.maps.canvas_main_layer2 ;
		var dest_canvas   =  gc.vars.dom.maps.canvas_preview     ;

		// Determine the left and top values based on the mouse position.
		var rect = src_canvas.getBoundingClientRect();
		var evt = e;
		var coords = {
			x: (evt.clientX - rect.left) / (rect.right  - rect.left) * src_canvas.width,
			y: (evt.clientY - rect.top)  / (rect.bottom - rect.top)  * src_canvas.height
		};
		var left = Math.floor(coords.x / tileWidth );
		var top  = Math.floor(coords.y / tileHeight);

		// Compare: look to see if either left or top has changed.
		var oldLeft = parseInt(gc.vars.dom.maps.preview_l.value, 10);
		var oldTop  = parseInt(gc.vars.dom.maps.preview_t.value, 10);

		// If either has changed, redraw the preview.
		if(oldLeft != left || oldTop !=top){
			// Get the preview dimensions.
			var mapWidth  = parseInt(gc.vars.dom.maps.preview_w.value, 10);
			var mapHeight = parseInt(gc.vars.dom.maps.preview_h.value, 10);

			// Update the coordinates under the preview canvas.
			gc.vars.dom.maps.preview_l.value = left;
			gc.vars.dom.maps.preview_t.value = top;

			// Determine the coordinates.
			var srcX = left      * tileWidth  ;
			var srcY = top       * tileHeight ;
			var w    = mapWidth  * tileWidth  ;
			var h    = mapHeight * tileHeight ;

			// Perform out-of-bounds checks.
			var check1 =  left > cols              ; // * #1: (map starts OOB         (right side)
			var check2 = (left + mapWidth)  > cols ; // * #2: (map dimensions are OOB (right side)
			var check3 =  top  > rows              ; // * #3: (map starts OOB         (bottom side)
			var check4 = (top  + mapHeight) > rows ; // * #4: (map dimensions are OOB (bottom side)

			// Did any of the checks find an OOB?
			if ( check1 || check2 || check3 || check4 ) {
				var errorString =
					"ERROR: Map is Out Of Bounds:  " +
					"\n\nFAILED CHECKS:" +
					 ( check1 ? '\n  * #1: (map starts OOB         (right side) ' : '' ) +
					 ( check2 ? '\n  * #2: (map dimensions are OOB (right side) ' : '' ) +
					 ( check3 ? '\n  * #3: (map starts OOB         (bottom side)' : '' ) +
					 ( check4 ? '\n  * #4: (map dimensions are OOB (bottom side)' : '' ) +
					"";

				gc.vars.dom.maps.preview_firstTile.innerHTML = "O-O-B!"    ;
				gc.vars.dom.maps.preview_firstTile.title     = errorString ;

				return;
			}
			// No? Draw the preview!
			else{
				// Reset/set the out of bounds indicator.
				gc.vars.dom.maps.preview_firstTile.innerHTML = "#"+((top*cols)+left) ;
				gc.vars.dom.maps.preview_firstTile.title     = "" ;

				// Set layer 2 of the source canvas to fully transparent (clear it.)
				src_canvasL2.getContext('2d').clearRect(
					0, 0, src_canvasL2.width, src_canvasL2.height
				);

				// Draw a hover indicator on the second layer of the source canvas.
				src_canvasL2.getContext('2d').fillStyle="rgba(244, 67, 54, 0.7)";
				src_canvasL2.getContext('2d').strokeStyle="white";
				src_canvasL2.getContext('2d').lineWidth=0.5;
				src_canvasL2.getContext('2d').fillRect( srcX, srcY, w, h );
				src_canvasL2.getContext('2d').strokeRect( srcX, srcY, w, h );

				// Display the values for left and top.
				gc.vars.dom.maps.preview_l.value = left ;
				gc.vars.dom.maps.preview_t.value = top  ;

				// Set the dimensions for the destination canvas.
				dest_canvas.width  = mapWidth  * tileWidth;
				dest_canvas.height = mapHeight * tileHeight;

				// Get the data for the hovered portion of the source canvas.
				var imgData = src_canvas.getContext('2d').getImageData( srcX, srcY, w, h );

				// Draw the data to the preview canvas.
				dest_canvas.getContext('2d').putImageData(imgData, 0, 0);
			}

		}
		else{
			// console.log("No need to redraw!");
		}
	}
	// * Adds a new BLANK row to the map list.
	,mapsList_addRow_blank  : function(){
		// Get some previously cached values.
		// var tileWidth    = gc.vars.settings.maps.tileWidth    ;
		// var tileHeight   = gc.vars.settings.maps.tileHeight   ;
		var cols         = gc.vars.settings.maps.cols         ;
		var rows         = gc.vars.settings.maps.rows         ;
		// var pointersSize = gc.vars.settings.maps.pointersSize ;

		// Add the row.
		gc.funcs.maps.mapsList_addRow(
			{
			  '@var-name'    : 'NEW_MAP_' + ( Math.random().toString().substr(2, 15) )
			, '@left'        : 0
			, '@top'         : 0
			, '@width'       : 2
			, '@height'      : 2
			, '@mapOutputTo' : 'PROGMEM'
			}
			, rows, cols
		);

		// Find the last record and select it.
		var elem = document.querySelectorAll('.maps_record');
		elem = elem[ elem.length-1 ];

		// Focus and highlight the varname for the new record.
		elem.querySelector('.gc3_varname input').focus();
		elem.querySelector('.gc3_varname input').select();

		// Scroll down to the new record.
		var map_records = gc.vars.dom.maps.maps_records_div;
		map_records.scrollTop = map_records.scrollHeight;
	}
	// * Removes the specified map record (Must provide the .maps_record).
	,deleteMapRecord        : function(elem){
		elem.remove();
	}
	// * Read map records and cached values to recreate a JSON file. Write the XML to the XML input area. Return both the JSON and the XML.
	,recreateJSONandXML     : function( updateXml_flag ){
		// Read all the data from the map records and also use the cached values to recreate a JSON file.

		// Get the map records.
		var maps_records_div = gc.vars.dom.maps.maps_records_div   ;
		var maps_records     = maps_records_div.querySelectorAll(".maps_record");

		// Get the existing XML, convert it to JSON.
		var x2js    = new X2JS( { attributePrefix : "@",stripWhitespaces:true ,useDoubleQuotes:true } );
		var jsonObj = JSON.parse( JSON.stringify( x2js.xml_str2json( gc.vars.dom.input.xml.value ), null, 1 ) ) ;

		// Remove the maps.
		jsonObj["gfx-xform"]["output"]["maps"]["map"] = [];


		var version = jsonObj["gfx-xform"]["@version"];
		var do_mapOutputTo = false;
		switch(version){
			case "1"                : {
				do_mapOutputTo=false;
				break;
			}
			case "SINGLE_TS" : {
				// Override the JSON values for tilesetOutputTo and removeDupeTiles to be what the DOM control values are.
				jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"] = gc.vars.dom.maps.tilesetOutputTo.value   != ""   ? gc.vars.dom.maps.tilesetOutputTo.value : "PROGMEM";
				jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"] = gc.vars.dom.maps.removeDupeTiles.checked == true ? "1"                                     : "0";
				jsonObj["gfx-xform"]["output"]["tiles"]["@outputAsJson"]    = gc.vars.dom.maps.outputAsJson.checked    == true ? "1"                                     : "0";
				do_mapOutputTo=true;
				break;
			}
			case "MULTI_TS"  : {
				// Override the JSON values for tilesetOutputTo and removeDupeTiles to be what the DOM control values are.
				jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"] = gc.vars.dom.maps.tilesetOutputTo.value   != ""   ? gc.vars.dom.maps.tilesetOutputTo.value : "PROGMEM";
				jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"] = gc.vars.dom.maps.removeDupeTiles.checked == true ? "1"                                     : "0";
				jsonObj["gfx-xform"]["output"]["tiles"]["@outputAsJson"]    = gc.vars.dom.maps.outputAsJson.checked    == true ? "1"                                     : "0";
				do_mapOutputTo=true;
				break;
			}
			default                 : {
				break;
			}
		}


		// Replace the maps in the JSON with newly parsed maps from the map records.
		var newMapObj = {};
		for(var i=0; i<maps_records.length; i++){
			var map = maps_records[i];
			var varname  = map.querySelector(".gc3_varname  input" ).value ;
			var l        = parseInt(map.querySelector(".gc3_l        input" ).value, 10) ;
			var t        = parseInt(map.querySelector(".gc3_t        input" ).value, 10) ;
			var w        = parseInt(map.querySelector(".gc3_w        input" ).value, 10) ;
			var h        = parseInt(map.querySelector(".gc3_h        input" ).value, 10) ;
			var outputTo = map.querySelector(".gc3_outputTo select").value ;

			newMapObj = {
				 "@var-name"   : varname
				,"@left"       : l
				,"@top"        : t
				,"@width"      : w
				,"@height"     : h
			};
			if(do_mapOutputTo){
				newMapObj["@mapOutputTo"] = outputTo ;
			}

			jsonObj["gfx-xform"]["output"]["maps"]["map"].push( newMapObj );
		}

		if(version=="MULTI_TS"){
			// Update the full JSON in memory.
			var full_jsonObj = gc.vars.settings.input.full_jsonObj;
			var ts_index     = gc.vars.dom.input.xml_multi_select.value;
			full_jsonObj["gfx-xform"]["TILESET"][ts_index] = jsonObj;
		}

		// Convert the JSON back to XML, and reformat it.
		var xmlObj = x2js.json2xml_str( jsonObj );

		var newXml = gc.funcs.shared.format_xmlText('<?xml version="1.0" ?>\n' + xmlObj );

		xmlObj = newXml ;

		// Only update the XML input text if indicated to do so.
		if(updateXml_flag){
			gc.vars.dom.input.xml.value = xmlObj ;
		}

		// Return both the XML and the JSON.
		return {
			 "xmlObj" : xmlObj
			,"jsonObj": jsonObj
		};

	}
	// * Double-click the main map editor canvas to update the selected map.
	,doubleClickToUpdateMap : function(){
		// Get the currently selected map record.
		var maps_records_div = gc.vars.dom.maps.maps_records_div   ;
		var maps_record      = maps_records_div.querySelectorAll(".maps_record.selectedMap_animationBG");

		// Make sure that a map record is currently selected.
		if( ! maps_record.length ){
			console.log("You have not selected a map record.");
			alert      ("You have not selected a map record.");
			return;
		}
		else{
			maps_record = maps_record[0];
		}

		// Set the new values.
		maps_record.querySelector(".gc3_l        input" ).value = parseInt(gc.vars.dom.maps.preview_l.value, 10) ;
		maps_record.querySelector(".gc3_t        input" ).value = parseInt(gc.vars.dom.maps.preview_t.value, 10) ;
		maps_record.querySelector(".gc3_w        input" ).value = parseInt(gc.vars.dom.maps.preview_w.value, 10) ;
		maps_record.querySelector(".gc3_h        input" ).value = parseInt(gc.vars.dom.maps.preview_h.value, 10) ;
	}
	//
	,beginProcessToC        : function(){
		// gc.vars.dom.output.combinedTextareaWindow.classList.remove('show');

		// Get the updated XML and the updated JSON (sourced from the map editor.)
		var obj = gc.funcs.maps.recreateJSONandXML(false);
		// console.log(obj);
		// gc.vars.dom.maps.canvas_main

		// Set the settings for the output section.
		gc.vars.settings.output.jsonObj = obj.jsonObj;
		gc.vars.settings.output.xmlObj  = obj.xmlObj;

		return new Promise(function(resolve, reject){
			// Call the function outputToC.
			gc.funcs.output.processToC( gc.vars.settings.output.jsonObj, gc.vars.settings.output.xmlObj ).then(
				 function(data) {
				 	// console.log("processToC has finished! data :", data );
				 	document.getElementById( 'section_gcOutput' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
				 	resolve(data);

				 }
				,function(error){
					console.log("ERROR in processToC:", error);
					reject(error);
				}
			);

		});
	}
	//
	,addEventListeners      : function(){
		// * Mouseover on the canvas_main_layer2
		gc.vars.dom.maps.canvas_main_layer2  .addEventListener('mousemove', gc.funcs.maps.updateHoverMapRecord, false);

		// * Add new map.
		gc.vars.dom.maps.maps_addNew_btn     .addEventListener('click', gc.funcs.maps.mapsList_addRow_blank, false);

		// * Start over by re-processing the data in the INPUT section.
		gc.vars.dom.maps.maps_startOver_btn  .addEventListener('click', function(){
			if( confirm("Are you sure that you want reset the data in the map editor?") ) {
				gc.funcs.input.goToMapEditor();
			} }, false);

		// * Update the XML data in the INPUT section.
		gc.vars.dom.maps.maps_updateInput_btn.addEventListener('click', function(){ if( confirm("Are you sure that you want to update the input XML?")          ) { gc.funcs.maps.recreateJSONandXML(true); } }, false);

		// * Double-click the main map editor canvas to update the selected map.
		gc.vars.dom.maps.canvas_main_layer2  .addEventListener('dblclick', gc.funcs.maps.doubleClickToUpdateMap , false);

		// Process the maps to C.
		gc.vars.dom.maps.processToC_btn      .addEventListener('click', gc.funcs.maps.beginProcessToC , false);
	}
};