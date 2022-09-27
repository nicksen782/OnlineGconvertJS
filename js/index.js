/*jshint sub:true*/
/*jshint laxcomma:true*/
/*jslint bitwise: true */
/*jslint for: true */
/*jslint long: true */
/*jslint single: true */
/*jslint white: true */
/*jslint multivar: false */

/*jshint -W069 */

// /* global featureDetection */
// /* global gc */
// /* global saveAs */
// /* global JSZip */
// /* global X2JS */
// /* global performance */

// anthonybrown/JSLint Options Descriptions
// https://gist.github.com/anthonybrown/9526822

"use strict";

// XML validation requires an XML file and a loaded IMG.

// if( gc.vars.originUAM == true ){}

// * Holds the whole gc.
var gc = {};

//  * Contains shared variables.
gc.vars = {
	originUAM:false,
	newTimestamps : {
	}
	,timestamps : {
		// Pre-processing:
		 "getTilesetPlaceholderArray"    : { "order":0 , "s":0, "e":0, "time":0 }
		,"preProcessMaps"                : { "order":1 , "s":0, "e":0, "time":0 }
		,"createRGB332_imageBuffer"      : { "order":2 , "s":0, "e":0, "time":0 }
		,"populateTileSetData"           : { "order":3 , "s":0, "e":0, "time":0 }
		,"reduceDuplicateTiles"          : { "order":4 , "s":0, "e":0, "time":0 }
		,"remapTileMaps"                 : { "order":5 , "s":0, "e":0, "time":0 }

		// Processing:
		,"timestamp"                     : { "order":6 , "s":0, "e":0, "time":0 }
		,"newTileset"                    : { "order":7 , "s":0, "e":0, "time":0 }
		,"newTileIds"                    : { "order":8 , "s":0, "e":0, "time":0 }
		,"newMaps"                       : { "order":9 , "s":0, "e":0, "time":0 }
		,"tilesetText"                   : { "order":10, "s":0, "e":0, "time":0 }
		,"tilemapsText"                  : { "order":11, "s":0, "e":0, "time":0 }
		,"final_outputText"              : { "order":12, "s":0, "e":0, "time":0 }
		,"final_outputImage_tileset"     : { "order":13, "s":0, "e":0, "time":0 }
		,"final_outputImage_markedDupes" : { "order":14, "s":0, "e":0, "time":0 }

		// Total:
		,"ts_all" : { "order":15, "s":0, "e":0, "time":0 }
	}
	,settings : {
		 input : {
		 	full_jsonObj : {}
		 	,imgs : {}
		}
		,maps : {
			 tileWidth    : 0
			,tileHeight   : 0
			,cols         : 0
			,rows         : 0
			,pointersSize : 0
			,version      : ""
		}
		,output : {
			 jsonObj     : 0
			,xmlObj      : 0
			,imgObj      : 0
			,tsTextOutputs : []
		}
	}
	,dom : {
	}
};

//  * Contains all the functions.
gc.funcs = {
	// * Function that starts all the event listeners.
	addAllListeners : function(){
		// quickNav
		gc.funcs.quickNav.addEventListeners();
	
		// Input
		gc.funcs.input.addEventListeners();
	
		// Maps
		gc.funcs.maps.addEventListeners();
	
		// Output
		gc.funcs.output.addEventListeners();
	
		// UAM login, logout, open buttons.
		if(gc.vars.originUAM==true){
			gc.vars.dom.uamLogin["uam_login"] .addEventListener("click", function(){ gc.funcs.UAM.openModal("uamlogin" ); }, false);
			gc.vars.dom.uamLogin["uam_logout"].addEventListener("click", function(){ gc.funcs.UAM.openModal("uamlogout"); }, false);
			gc.vars.dom.uamLogin["openUAM"].forEach(function(d, i, a) {
				d.addEventListener("click", gc.funcs.UAM.openUamInNewWindow, false);
			});
		}
	},
};

window.onload = function(){
	window.onload=null;

	console.log("***************************");
	console.log("*** -- gConvertJS v3 -- ***");
	console.log("***************************");

	var continueApp = function(){
		var formData = {
			"o": "gc_init",
			"_config": { "processor": "gc_p.php" }
		};
		gc.funcs.shared.serverRequest(formData)
		.then(
			function(res){
				// Set the UAM status.
				gc.vars.originUAM  = res.UAMFOUND;
				gc.vars.UAM_active = (res.UAMFOUND && res.UAMDATA.hasActiveLogin);

				// Populate the local DOM element handle cache.
				gc.funcs.domHandleCache_populate();

				// gc.funcs.UAM.enableUAM();
				// gc.funcs.UAM.disableUAM();
				// gc.funcs.UAM.setupUAM();
				// gc.funcs.domHandleCache_populate_UAM();

				// ** HANDLE UAM INTEGRATION **
				// If no UAM was found then show nothing for UAM (Dialog A).
				if(!res.UAMFOUND){
					document.querySelector("#UAM_status_A").classList.add("show");
					gc.funcs.UAM.disableUAM();
					gc.funcs.input.showHideInputElements("testdata", "_CLEAR_ALL_");
				}
				// If UAM and there is an active login then show dialog B.
				else if(res.UAMDATA.hasActiveLogin==1){
					// Populate the UAM DOM handle caches.
					gc.funcs.domHandleCache_populate_UAM();

					// Put the user's name in the status.
					document.querySelector("#UAM_status_username").innerHTML = res.UAMDATA.username;

					// Add the returned data into the local cache.
					gc.vars.UAMDATA   = res.UAMDATA;

					gc.funcs.UAM.enableUAM();
					gc.funcs.UAM.setupUAM();

					// Show the dialog.
					document.querySelector("#UAM_status_B").classList.add("show");

					gc.funcs.input.showHideInputElements("uam", "_CLEAR_ALL_");

				}
				// If UAM and there is not an active login then show dialog C.
				else if(res.UAMDATA.hasActiveLogin==0){
					// Populate the UAM DOM handle caches.
					gc.funcs.domHandleCache_populate_UAM();

					document.querySelector("#UAM_status_C").classList.add("show");

					gc.funcs.input.showHideInputElements("testdata", "_CLEAR_ALL_");
				}

			// Add all the event listeners.
			gc.funcs.addAllListeners();

			// Init the output nav.
			gc.funcs.output.nav.init();

			},
			// ERROR HANDLER.
			gc.funcs.shared.rejectedPromise
		);

/*
		// Is this loaded via iframe in UAM?
		try{
			// Loaded via iframe?
			if( window.self !== window.top ){
				// IN UAM?
				// Can the originUAM key be detected?
				if( window.top.shared.originUAM == true ){
					console.log('GCONVERT - ORIGIN: UAM',  );

					// Set up UAM.
					gc.funcs.UAM.setupUAM();
				}
				else {
					gc.funcs.UAM.disableUAM();
				}
		 	}
		 	else{
				// console.log("HIDE2");
				gc.funcs.UAM.disableUAM();
		 	}
		}
		catch(e){
			// console.log("CATCH!");
			gc.funcs.UAM.disableUAM();
		}
*/

		// Make the canvas images look more blocky (remove dithering.)
		document.querySelectorAll('canvas').forEach(function(d, i) {
			gc.funcs.shared.setpixelated(d);
		});

		// Scroll up to the top after a brief period.
		setTimeout(function(){
			// Scroll to section.
			document.getElementById( 'bodyHeader' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );

			// Wait a bit and then ...
			var debug=false;
			// var debug=true;

			if(debug==true){
				setTimeout(function(){
					gc3_input_selectTestData.value="2b";
					gc3_input_selectTestData.dispatchEvent( new CustomEvent("change") );
				}, 500);
				setTimeout(function(){ gc3_input_goToMapEditor.click(); }, 1000);
				setTimeout(function(){ gc3_maps_processToC_btn.click(); }, 2000);
			}
		}, 500);
		/*
		*/

	};

	// Feature Loader config:
	featureDetection.config.usePhp         = true;
	featureDetection.config.useAsync       = true;
	featureDetection.config.includeText    = false; // Using false makes the database download smaller.
	featureDetection.config.includeWebsite = false; // Using false makes the database download smaller.

	// Load these libraries also:
	featureDetection.config.userReqs = [
		"X2JS"    ,
		// "JSZip"    ,
		// "FileSaver",
	];

	// featureDetection.funcs.applyFeatures_fromList([ "JSZip", ]);
	// featureDetection.funcs.applyFeatures_fromList([ "FileSaver", ]);

	// Feature detect/replace.
	featureDetection.funcs.init( continueApp );
};