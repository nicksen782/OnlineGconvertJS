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
gc.funcs = {};

gc.funcs.UAM = {
	// UAM FUNCTIONS BY SECTION.
	input  : {
		// * Reset the UAM input section.
		uam_resetInputSection : function(){
			// Reset input canvas.
			gc.vars.dom.input.canvas.getContext("2d").clearRect(0,0,gc.vars.dom.input.canvas.width,gc.vars.dom.input.canvas.height);

			// Reset input XML.
			gc.vars.dom.input.xml.value="";

			// Reset input XML select.
			gc.vars.dom.input.uam_xmlList_select.value="";

			// Reset input IMG select.
			gc.vars.dom.input.uam_imgName.value="";

			// Reset input validation section too.
			gc.vars.dom.input.xformVersion.innerHTML="";
			gc.vars.dom.input.validateXML .innerHTML="";
			gc.vars.dom.input.validateIMG .innerHTML="";
			gc.vars.dom.input.validateMaps.innerHTML="";
			gc.vars.dom.input.imgWidth    .innerHTML="";
			gc.vars.dom.input.imgHeight   .innerHTML="";
			gc.vars.dom.input.tileWidth   .innerHTML="";
			gc.vars.dom.input.tileHeight  .innerHTML="";
			gc.vars.dom.input.pointersSize.innerHTML="";
			gc.vars.dom.input.mapCount    .innerHTML="";
		},
		// * Event listener.
		uam_gameList_select  : function(e){
			let uam_gamelist = gc.vars.dom.input.uam_gameList_select;
			let uam_xmllist  = gc.vars.dom.input.uam_xmlList_select;
			// let uam_imgName = gc.vars.dom.input.uam_imgName ;
			let gameid=uam_gamelist.value;

			// Reset the inputs.
			gc.funcs.UAM.input.uam_resetInputSection();

			if(uam_gamelist.value==""){
			}
			else{
				// Hide options that do not match the selected game's gameid.
				let thecount=0;
				uam_xmllist.querySelectorAll("option").forEach(function(d,i,a){
					// First, remove the hidden class.
					d.classList.remove("hidden");

					// Now, decide if it will be shown or hidden.
					if(d.getAttribute("gameid")!=gameid && d.value !=""){ d.classList.add("hidden"); }
					else                                                { thecount+=1; }
				});

				// Update the first value (the blank one with the file count.)
				uam_xmllist.options[0].text=thecount + " XML files";
				uam_xmllist.options[0].value="";

				// Select the first value.
				gc.vars.dom.input.uam_xmlList_select.value="";
			}

		},

		// * Event listener.
		uam_refreshGameList : function(e){
			// This will take the values out of UAM and display them in Gconvert.

			gc.funcs.input.reset_inputs();

			// UAM handle to the game list.
			let user_id = gc.vars.user_id;

			if(!user_id){ return; }

			// Get the info on the XML files via server request to UAM.
			var formData = {
				"o"       : "getGamesAndXmlFilepathsViaUserId",
				"user_id" : user_id,
				"_config" : { "processor":"gc_p.php" }
			};
			gc.funcs.shared.serverRequest(formData).then(
				function(res){
					// console.log("SUCCESS:", res);
					let gameList_UAM = res.$results1;
					let XMLlist_UAM  = res.$results2;

					// Populate the games list.

					// DOM handles to the select menus.
					let uam_gamelist = gc.vars.dom.input.uam_gameList_select;
					let uam_xmllist  = gc.vars.dom.input.uam_xmlList_select;

					// Clear the options.
					uam_gamelist.options.length=1;
					uam_xmllist .options.length=1;

					let option=undefined;
					let frag=document.createDocumentFragment();

					uam_gamelist.options[0].text=gameList_UAM.length + " games";
					uam_gamelist.options[0].value="";

					uam_xmllist.options[0].text=XMLlist_UAM.length + " XML files";
					uam_xmllist.options[0].value="";

					gameList_UAM.map(function(d,i,a){
						option = document.createElement("option");
						option.setAttribute("gameid"        , d.gameId        );
						option.setAttribute("gamename"      , d.gameName      );
						option.setAttribute("author_user_id", d.author_user_id);
						option.value = d.gameId;
						option.text = d.gameName;
						frag.appendChild(option);
					});
					uam_gamelist.appendChild(frag);

					// Populate the XML files list.
					frag=document.createDocumentFragment();
					XMLlist_UAM.map(function(d,i,a){
						option = document.createElement("option");

						option.setAttribute("webpath"   , d.webpath);
						option.setAttribute("filename"  , d.filename);
						option.setAttribute("gameid"    , d.gameid  );
						option.setAttribute("gamename"  , d.gamename);

						option.value = d.gameid;
						option.text = d.gamename + " - " + d.filename;

						frag.appendChild(option);
					});
					uam_xmllist.appendChild(frag);

				},
				function(res){
					console.log("FAILURE:", res);
				}
			);
		},

		// * Event listener.
		uam_xmlList_select  : function(e){
			gc.funcs.input.selectTestData_load('uam');
		},

		// * Event listener.
		uam_updateXML       : function(e){
			// Which XML file is selected?
			let uam_xmlList_select  = gc.vars.dom.input.uam_xmlList_select ;
			let selectedOption = uam_xmlList_select.options[uam_xmlList_select.selectedIndex];
			if(!selectedOption.value){
				console.log("ERROR: A file has not been selected.");
				alert      ("ERROR: A file has not been selected.");
				return;
			}

			let conf = confirm(
				"About to update file.\n" +
				"    FILE: " + selectedOption.getAttribute("filename") + "\n" +
				"    GAME: " + selectedOption.getAttribute("gamename") + "\n" +
				"Continue?"
			);

			if(!conf){ return; }

			var formData = {
				"o"       : "gc_updateXmlFile",
				"filename" : selectedOption.getAttribute("filename") ,
				"gameid"   : selectedOption.getAttribute("gameid")   ,
				"userFile" : gc.vars.dom.input.xml.value ,
				"_config" : { "processor":"gc_p.php" }
			};
			gc.funcs.shared.serverRequest(formData).then(
				function(res){
					// console.log("SUCCESS:", res);

					if(res.success == false){
						console.log("An error has occurred.\n\n"+res.data);
						alert      ("An error has occurred.\n\n"+res.data);
					}

				},
				function(res){
					console.log("FAILURE:", res);
				}
			);

		},

		// * Event listener.
		uam_updateIMG       : function(e){
			// Which IMG file is selected?
			let uam_imgName = gc.vars.dom.input.uam_imgName ;

			if(!uam_imgName.value){
				console.log("ERROR: A file has not been selected.");
				alert      ("ERROR: A file has not been selected.");
				return;
			}

			let conf = confirm(
				"About to update file.\n" +
				"    FILE: " + uam_imgName.value + "\n" +
				"    GAME: " + uam_imgName.getAttribute("gamename") + "\n" +
				"Continue?"
			);

			if(!conf){ return; }

			var formData = {
				"o"        : "gc_updateImgFile",
				"filename" : uam_imgName.value ,
				"gameid"   : uam_imgName.getAttribute("gameid"),
				"userFile" : gc.vars.dom.input.canvas.toDataURL('image/png'),
				"_config"  : { "processor":"gc_p.php" }
			};
			gc.funcs.shared.serverRequest(formData).then(
				function(res){
					// console.log("SUCCESS:", res);

					if(res.success == false){
						console.log("An error has occurred.\n\n"+res.data);
						alert      ("An error has occurred.\n\n"+res.data);
					}
				},
				function(res){
					console.log("FAILURE:", res);
				}
			);

		}
	},
	output : {
		// * Saves the PROGMEM data to the server.
		uam_saveProgmem : function(){
			let filename = "";
			try{ filename = gc.vars.settings.output.jsonObj["gfx-xform"]["output"]["@file"]; }
			catch(e){
				// console.log("ERROR: No XML file is loaded.");
				alert      ("ERROR: No XML file is loaded.");
				return;
			}

			if(filename!=undefined){
				filename = filename.split("/");
				filename = filename[ filename.length-1 ];
			}
			else{
				console.log("ERROR: No value specified for the PROGMEM output file.");
				alert      ("ERROR: No value specified for the PROGMEM output file.");
				return;
			}

			let progmemTextarea      = gc.vars.dom.output.progmemTextarea   ;
			if(! progmemTextarea.value.length){
				console.log("ERROR: PROGMEM output is empty.");
				alert      ("ERROR: PROGMEM output is empty.");
				return;
			}

			//
			let uam_xmlList_select = gc.vars.dom.input.uam_xmlList_select;

			let gameid   = uam_xmlList_select.options[uam_xmlList_select.selectedIndex].getAttribute("gameid");
			let gamename = uam_xmlList_select.options[uam_xmlList_select.selectedIndex].getAttribute("gamename");

			if(!gamename){
				// console.log("ERROR: No game was selected.");
				alert      ("ERROR: No game was selected.");
				return;
			}

			let conf = confirm(
				"About to update file.\n" +
				"    FILE: " + filename + "\n" +
				"    GAME: " + gamename + "\n" +
				"Continue?"
			);

			if(!conf){ return; }

			//
			var formData = {
				"o"       : "uam_saveProgmem",
				"userFile" : progmemTextarea.value ,
				"gameid"   : gameid   ,
				"filename" : filename ,
				"_config" : { "processor":"gc_p.php" }
			};
			gc.funcs.shared.serverRequest(formData).then(
				function(res){
					// console.log("SUCCESS:", res);
					if(res.success == false){
						console.log("An error has occurred.\n\n"+res.data);
						alert      ("An error has occurred.\n\n"+res.data);
					}
				},
				function(res){
					console.log("FAILURE:", res);
				}
			);

		},
		// * Saves the C2BIN data to the server.
		uam_saveC2bin   : function(){
			let filename = "";
			try{ filename = gc.vars.settings.output.jsonObj["gfx-xform"]["output"]["@file2"]; }
			catch(e){
				// console.log("ERROR: No XML file is loaded.");
				alert      ("ERROR: No XML file is loaded.");
				return;
			}

			if(filename!=undefined){
				filename = filename.split("/");
				filename = filename[ filename.length-1 ];
			}
			else{
				console.log("ERROR: No value specified for the C2BIN output file.");
				alert      ("ERROR: No value specified for the C2BIN output file.");
				return;
			}

			let c2binTextarea      = gc.vars.dom.output.c2binTextarea   ;
			if(! c2binTextarea.value.length){
				console.log("ERROR: C2BIN output is empty.");
				alert      ("ERROR: C2BIN output is empty.");
				return;
			}

			let uam_xmlList_select = gc.vars.dom.input.uam_xmlList_select;

			let gameid = uam_xmlList_select.options[uam_xmlList_select.selectedIndex].getAttribute("gameid");
			let gamename = uam_xmlList_select.options[uam_xmlList_select.selectedIndex].getAttribute("gamename");

			if(!gamename){
				// console.log("ERROR: No game was selected.");
				alert      ("ERROR: No game was selected.");
				return;
			}

			let conf = confirm(
				"About to update file.\n" +
				"    FILE: " + filename + "\n" +
				"    GAME: " + gamename + "\n" +
				"Continue?"
			);

			if(!conf){ return; }

			//
			var formData = {
				"o"        : "uam_saveC2bin" ,
				"userFile" : c2binTextarea.value ,
				"gameid"   : gameid   ,
				"filename" : filename ,
				"_config"  : { "processor":"gc_p.php" }
			};
			gc.funcs.shared.serverRequest(formData).then(
				function(res){
					// console.log("SUCCESS:", res);
					if(res.success == false){
						console.log("An error has occurred.\n\n"+res.data);
						alert      ("An error has occurred.\n\n"+res.data);
					}
				},
				function(res){
					console.log("FAILURE:", res);
				}
			);

		},

		//
		uam_updateAssets: function(){
			let uam_gameList_select = gc.vars.dom.input.uam_gameList_select;
			let gameid = uam_gameList_select.options[uam_gameList_select.selectedIndex].getAttribute("gameid");
			let gamename = uam_gameList_select.options[uam_gameList_select.selectedIndex].getAttribute("gamename");

			if(!gamename){
				// console.log("ERROR: No game was selected.");
				alert      ("ERROR: No game was selected.");
				return;
			}

			let conf = confirm(
				"About to update the assets in:.\n" +
				"    GAME: " + gamename + "\n" +
				"Continue?"
			);

			if(!conf){ return; }

			//
			var formData = {
				"o"        : "uam_updateAssets" ,
				// "userFile" : c2binTextarea.value ,
				"gameid"   : gameid   ,
				// "filename" : filename ,
				"_config"  : { "processor":"gc_p.php" }
			};

			gc.funcs.shared.serverRequest(formData).then(
				function(res){
					// console.log("SUCCESS:", res);
					if(res.success == false){
						console.log("An error has occurred.\n\n"+res.data);
						alert      ("An error has occurred.\n\n"+res.data);
					}
				},
				function(res){
					console.log("FAILURE:", res);
				}
			);

		},

		uam_runC2BIN: function(){
			let uam_gameList_select = gc.vars.dom.input.uam_gameList_select;
			let gameid = uam_gameList_select.options[uam_gameList_select.selectedIndex].getAttribute("gameid");
			let gamename = uam_gameList_select.options[uam_gameList_select.selectedIndex].getAttribute("gamename");

			if(!gamename){
				// console.log("ERROR: No game was selected.");
				alert      ("ERROR: No game was selected.");
				return;
			}

			let conf = confirm(
				"About to run C2BIN for:.\n" +
				"    GAME: " + gamename + "\n" +
				"Continue?"
			);

			if(!conf){ return; }

			//
			var formData = {
				"o"        : "uam_runC2BIN" ,
				"gameid"   : gameid   ,
				"_config"  : { "processor":"gc_p.php" }
			};

			var dest = document.querySelector("#c2bin_modal");
			var newhtml="";

			gc.funcs.shared.serverRequest(formData).then(
				function(res){
					// console.log("SUCCESS:", res);

					newhtml+="<div>";
					newhtml+="Results from: " + res.script1;
					newhtml+="</div>";

					newhtml+="<textarea>";
					newhtml+=res.output1;
					newhtml+="</textarea>";

					dest.innerHTML=newhtml;
					setTimeout(function(){ gc.funcs.shared.showC2BIN_modal(true); }, 250);

					if(res.success == false){
						console.log("An error has occurred.\n\n"+res.data);
						alert      ("An error has occurred.\n\n"+res.data);
					}
				},
				function(res){
					console.log("FAILURE:", res);

					newhtml+="<div>";
					newhtml+="Results from: " + res.script1;
					newhtml+="</div>";

					newhtml+="<textarea>";
					newhtml+=res.output1;
					newhtml+="</textarea>";

					dest.innerHTML=newhtml;
					setTimeout(function(){ gc.funcs.shared.showC2BIN_modal(true); }, 250);
				}
			);

		},

	},

	// Keeps the session open.
	keepAlive_ping : function(){

		var formData = {
			"o"       : "keepAlive_ping",
			"_config" : { "noProgress" : true, "processor":"gc_p.php" }
		};
		gc.funcs.shared.serverRequest(formData).then(
			function(res){
				// console.log("keepAlive_ping:", new Date().toLocaleString(), res.data, "hasActiveLogin:", res.hasActiveLogin);
				console.log("keepAlive_ping:", new Date().toLocaleString(), res.data, "hasActiveLogin:", res.hasActiveLogin, "REFRESHES:", res.refreshes );
			},
			function(res){
				console.log("FAILURE:", res);
			}
		);

	},

	// * Hide UAM.
	enableUAM         : function(){
		gc.vars.originUAM      = true;
		gc.vars.UAM_active     = true;
		gc.vars.user_id        = gc.vars.UAMDATA.user_id;

		// Unhide UAM.
		document.querySelectorAll(".uamOnly").forEach(function(d,i,a){
			d.classList.remove("unavailableView");
			d.classList.add("enabled");
		});

	},
	// * Show UAM.
	disableUAM        : function(){
		gc.vars.originUAM      = false;

		document.querySelectorAll(".uamOnly").forEach(function(d,i,a){
			d.classList.add("unavailableView");
			d.classList.remove("enabled");
		});

	},
	// * UAM setup.
	setupUAM          : function(){
		// Show UAM, set some variables.
		// gc.funcs.UAM.enableUAM();

		// Set up the UAM DOM.
		// gc.funcs.domHandleCache_populate_UAM();

		// Start the gc.funcs.UAM.keepAlive_ping
		// PHP default session time is 24 minutes. (1440 seconds.)
		let mins = 20;
		setInterval(gc.funcs.UAM.keepAlive_ping, (mins*60*1000) );

		// Add the UAM event listeners.
		gc.funcs.UAM.addEventListeners();

		// Refresh the UAM games list data.
		gc.funcs.UAM.input.uam_refreshGameList();


		setTimeout(function(){
		},1000);

	},


	openUamInNewWindow : function(){
		window.open("../index.php");
	},
	openModal : function(whichModal){
		let onClickListener = function(){ closeAllModals(); };
		let entireBodyDiv = document.querySelector("#entireBodyDiv");
		let uamModal = gc.vars.dom.uamLogin["uamModal"];
		let oldiframe = document.querySelector("#uamIframe");
		if(oldiframe){ oldiframe.remove(); }
		let iframe = document.createElement("iframe");
		iframe.id="uamIframe";
		iframe.setAttribute("frameBorder","0");


		let url="";

		// Closes all modals.
		function closeAllModals(){
			// Hide the entireBodyDiv.
			let entireBodyDiv = document.querySelector("#entireBodyDiv");
			entireBodyDiv.removeEventListener("click", onClickListener, false);
			entireBodyDiv.classList.remove("active");

			// Hide all the modals.
			var allModals = document.querySelectorAll(".modals");
			allModals.forEach(function(d,i,a){ d.classList.remove("active"); });
		};

		// Close all modals.
		closeAllModals();

		// Open which modal?
		switch(whichModal){
			case "closeAllModals" : { return; break; }
			case "uamlogin"       : { url="../uamlogin.html?view=loginDIV" ; break; }
			case "uamlogout"      : { url="../uamlogin.html?view=logoutDIV"; break; }
			default               : { return; break; }
		};

		// Add screen darkener and event listener.
		entireBodyDiv.classList.add("active");
		entireBodyDiv.addEventListener("click", onClickListener, false);

		// Show the specified modal.
		uamModal.appendChild(iframe);
		iframe.onload=function(){
			iframe.onload=null;
			gc.vars.dom.uamLogin["uamModal"].classList.add("active");
		};
		iframe.src=url;

	},

	// * Add all the UAM event listeners.
	addEventListeners : function(){
		// if( gc.vars.originUAM == true ){ }

		// UAM: INPUT
		// UAM: game select
		gc.vars.dom.input.uam_gameList_select .addEventListener('change', gc.funcs.UAM.input.uam_gameList_select, false);

		// UAM: game select refresh
		gc.vars.dom.input.uam_refreshGameList .addEventListener('click', gc.funcs.UAM.input.uam_refreshGameList, false);

		// UAM: xml select
		gc.vars.dom.input.uam_xmlList_select  .addEventListener('change', gc.funcs.UAM.input.uam_xmlList_select, false);

		// UAM: xml select update
		gc.vars.dom.input.uam_updateXML       .addEventListener('click', gc.funcs.UAM.input.uam_updateXML, false);

		// UAM: img select update
		gc.vars.dom.input.uam_updateIMG       .addEventListener('click', gc.funcs.UAM.input.uam_updateIMG, false);

		// UAM: OUTPUT
		// UAM: saveProgmem_btn
		gc.vars.dom.output.saveProgmem_btn    .addEventListener('click', gc.funcs.UAM.output.uam_saveProgmem, false);

		// UAM: saveC2bin_btn
		gc.vars.dom.output.saveC2bin_btn      .addEventListener('click', gc.funcs.UAM.output.uam_saveC2bin, false);

		// UAM: updateAssets_btn
		gc.vars.dom.output.updateAssets_btn   .addEventListener('click', gc.funcs.UAM.output.uam_updateAssets, false);


		// UAM: runC2BIN_btn
		gc.vars.dom.output.runC2BIN_btn       .addEventListener('click', gc.funcs.UAM.output.uam_runC2BIN, false);
	}

};

// * Functions dedicated to downloads.
gc.funcs.downloads={
	// featureDetection.funcs.applyFeatures_fromList([ "JSZip", "FileSaver" ]).then(
	// 	function(res){
	// 	}
	// 	,function(error){ console.log("ERROR"); }
	// );

  	// * Downloads: In-RAM assets by name.
  	 downloadOneRamFile     : function(which, immediateDownload){
  	 	var filename="";

  	 	return new Promise(function(outer_resolve, outer_reject){
	  	 	var prom1 = new Promise(function(resolve, reject){
		  	 	switch(which){
			  	 	// text.
			  	 	case "srcXml"        : {
			  	 		filename="srcXml.xml";
			  	 		resolve( { "filename":filename, "data":gc.vars.dom.input.xml.value } );
			  	 		break;
			  	 	}
					case "progmemInc"    : {
						filename="progmem.inc";
			  	 		resolve( { "filename":filename, "data":gc.vars.dom.output.progmemTextarea.value } );
						break;
					}
					case "c2binInc"      : {
						filename="c2bin.inc";
			  	 		resolve( { "filename":filename, "data":gc.vars.dom.output.c2binTextarea.value } );
						break;
					}

			  	 	// image.
					case "srcImg"        : {
						filename="srcImg.png";
						gc.vars.dom.input.canvas.toBlob( function(blob){ resolve({ "filename":filename, "data": blob}); } );
						break;
					}
					case "mapImg"        : {
						filename="mapImg.png";
						gc.vars.dom.maps.canvas_main.toBlob( function(blob){ resolve({ "filename":filename, "data": blob}); } );
						break;
					}
					case "tilesetImg"    : {
						filename="tilesetImg.png";
						gc.vars.dom.output.tilesetCanvas.toBlob( function(blob){ resolve({ "filename":filename, "data": blob}); } );
						break;
					}
					case "markedDupesImg": {
						filename="markedDupesImg.png";
						gc.vars.dom.output.markedDupesCanvas.toBlob( function(blob){ resolve({ "filename":filename, "data": blob}); } );
						break;
					}

			  	 	// opps?
					default              : {
						resolve("");
						break;
					}
				}
	  	 	});

	  	 	prom1.then(
	  	 		function(data)  {
	  	 			// Will the download occur right now?
	  	 			if(immediateDownload){
	  	 				// Generate the filename
	  	 				featureDetection.funcs.applyFeatures_fromList([ "FileSaver" ]).then(
	  	 					function(res){
	  	 						gc.funcs.downloads.downloadFileFromRAM(data, filename, false).then(
	  	 							function(res)    {
	  	 								outer_resolve(prom1);
	  	 							},
	  	 							function(error){ console.log("ERROR:", error); outer_reject(prom1); }
  	 							);

	  	 					},
	  	 					function(error){ console.log("ERROR:", error); outer_reject(prom1); }
  	 					);
	  	 			}

	  	 			// No? Just return the data.
	  	 			else{
	  	 				outer_resolve(prom1);
	  	 			}

	  	 		},
	  	 		function(error){ console.log("ERROR:", error); outer_reject(prom1); }
  	 		);
  	 	});

  	}
  	// * Downloads: In-RAM assets from a list.
  	,downloadManyRamFiles   : function(list){
  		if(!list.length){
  			return;
  		}

		var proms = [];

		for(var i=0; i<list.length; i+=1){
			proms.push( gc.funcs.downloads.downloadOneRamFile( list[i] , false) );
		}

		Promise.all( proms ).then(
			function(res){
				// for(var i=0; i<res.length; i+=1){
				// 	console.log("RES:", res[i]);
				// }

				featureDetection.funcs.applyFeatures_fromList([ "JSZip", "FileSaver" ]).then(
					 function(success){
						// Zip it all up!
						gc.funcs.downloads.downloadZipFileFromRAM(res, res).then(
							 function(success){
							 }
							,function(error){
							 	console.log("ERROR:", error);
							}
						);
					 }
					,function(error){
					 	console.log("ERROR:", error);
					}
				)


			},
			function(error){ console.log("ERROR:", error); }
		);

  	}
  	// * Downloads: List of output files.
  	,downloadAllOutputFiles : function(){
  		gc.funcs.downloads.downloadManyRamFiles([
  			// TEXT
  			"progmemInc",
  			"c2binInc",

  			// IMG
  			"tilesetImg",
  			"markedDupesImg",
  		]);
  	}
  	// * Downloads: Full assets.
  	,downloadAllAssetFiles  : function(){
  		gc.funcs.downloads.downloadManyRamFiles([
  			// TEXT
  			"srcXml",
  			"progmemInc",
  			"c2binInc",

  			// IMG
  			"srcImg",
  			"mapImg",
  			"tilesetImg",
  			"markedDupesImg",
  		]);
  	}
  	// * Downloads: List of input files.
  	,downloadAllInputFiles  : function(){
  		gc.funcs.downloads.downloadManyRamFiles([
  			// TEXT
  			"srcXml",

  			// IMG
  			"srcImg",
  			"mapImg",
  		]);
  	}
	// * Download a single file. It could be from RAM, or from a textarea, etc.
	,downloadFileFromRAM    : function(data, filename, isBinary){
		return new Promise(function(resolve, reject){
			// This function requires 'saveAs'. Make sure it is loaded.
			featureDetection.funcs.applyFeatures_fromList( ["FileSaver"] ).then(function(){
				// console.log("DONE:", ['saveAs'] );

				//
				var blob;
				// blob = data;

				if(isBinary){ blob = data; }
				else{
					// blob = new Blob( [data] , {type: ""});
					blob = new Blob( [data] , {type: "text/plain;charset=utf-8"});
				}

				// Now get the data and present the download.
				saveAs(blob, filename);

				resolve();

			});
		});

	}
	// * Download a single zip file that consists of multiple files from RAM, or from a textarea, etc.
	,downloadZipFileFromRAM : function(results, datas){
		// data should be an array ([]).
		return new Promise(function(resolve, reject){
			var i;
			// This function requires 'JSZip' and 'saveAs'. Make sure they are loaded.
			featureDetection.funcs.applyFeatures_fromList( ["JSZip", "FileSaver"] ).then(function(){
				// console.log("DONE:", ['JSZip', 'saveAs'] );

				// Now get the data and present the download.
				var zip = new JSZip();
				// var view8;
				var zip_filename = "assets.zip";

				for(i=0; i<datas.length; i+=1){
					// view8 = new Uint8Array( datas[i].data );
					// view8 = datas[i].data ;
					// zip.file(datas[i].filename, view8);
					zip.file( datas[i].filename, datas[i].data );
				}

				zip.generateAsync({
					type: "blob",
					compression: "DEFLATE",
					compressionOptions: {
						level: 9
					}
				})
				.then(function(content) {
					saveAs(content, zip_filename);
					resolve();
				});
			});
		});

	}
};

// * Functions that may be used by more than one section.
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
			img.onload = function(){
				img.onload=null;
				resolve(img);
			};
			img.src = url  + "?r=" + (new Date()).getTime(); ;
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

// * Functions used by Quick Nav.
gc.funcs.quickNav={
  	  // vars:
  	 scrollIntoView_options : {
  	  	  behavior: "smooth"     // "auto", "instant", or "smooth".         Defaults to "auto".
  	  	// , block   : "center"  // "start", "center", "end", or "nearest". Defaults to "center".
  	  	// , inline  : "nearest" // "start", "center", "end", or "nearest". Defaults to "nearest".
  	  },

  	// * Get list of section divs and current position within them.
  	 findSectionPositions : function(sectionId){
		// Get list of sectionDivs ids;
		var sectionDivs = document.querySelectorAll(".sectionDivs");
		sectionDivs = Array.prototype.map.call(sectionDivs,
		function(d,i,a){ return d.id; });

		// Find the index of the current section.
		var currentIndex = sectionDivs.indexOf(sectionId) ;

		// Did we find our section id?
		if(currentIndex == -1){
			alert("ERROR! Current section div not found!");
			return;
		}

		// Determine the next/prev section.
		var prevIndex = currentIndex - 1 >=                 0 ? currentIndex-1 : currentIndex;
		var nextIndex = currentIndex + 1 < sectionDivs.length ? currentIndex+1 : currentIndex;

		return {
			currentId : sectionDivs[currentIndex] ,
			prevId    : sectionDivs[prevIndex]    ,
			nextId    : sectionDivs[nextIndex]    ,
		};
  	  }
	// * Event listener: Scroll to the top of the application.
	,toTop                : function(){
		document.getElementById( 'bodyHeader' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
	  }
	// * Event listener: Scroll up to the previous section.
	,stepUp               : function(){
		var sectionId = this.closest('.sectionDivs').id;
		var positions = gc.funcs.quickNav.findSectionPositions(sectionId);
		document.getElementById( positions['prevId'] ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
	}
	// * Event listener: Scroll down to the previous section.
	,stepDown             : function(){
		var sectionId = this.closest('.sectionDivs').id;
		var positions = gc.funcs.quickNav.findSectionPositions(sectionId);
		document.getElementById( positions['nextId'] ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
	}
	// * Add event listeners for this section.
	,addEventListeners    : function(){
		// Quick Nav options:
		var toTop    = document.querySelectorAll(".sectionTitle_toTop"   );
		var stepUp   = document.querySelectorAll(".sectionTitle_stepUp"  );
		var stepDown = document.querySelectorAll(".sectionTitle_stepDown");
		var i;

		// Go through all the sectionTitle_toTop. Add event listener.
		for(i=0; i<toTop.length; i++){
			toTop[i]    .addEventListener('click', gc.funcs.quickNav.toTop, false);
		}

		// Go through all the sectionTitle_stepUp. Add event listener.
		for(i=0; i<stepUp.length; i++){
			stepUp[i]   .addEventListener('click', gc.funcs.quickNav.stepUp, false);
		}
		// Go through all the sectionTitle_stepDown. Add event listener.
		for(i=0; i<stepDown.length; i++){
			stepDown[i] .addEventListener('click', gc.funcs.quickNav.stepDown, false);
		}
	}

};

// * Functions used by the Input section.
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
	  		// console.log("None selected.");
	  		return;
	  	}

		var prom = new Promise(
			function(resolveOuter, rejectOuter){
			// Get the selected test data value and load those files.
			gc.funcs.shared.getFile_fromUrl( url ).then(function(xmlString){
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

				// console.log(full_jsonObj, xmlString);

				// Check the version!
				var version = full_jsonObj["gfx-xform"]['@version'];
				if(version=="MULTI_TS"){
					// Load the FIRST tileset and tileset IMAGE. Present that to the validator.
					// full_jsonObj = jsonObj;
					gc.vars.settings.input.full_jsonObj = full_jsonObj;
					var tilesetNames = full_jsonObj["gfx-xform"]["TILESET"].map(function(d,i,a){
						return {
							 "name" : d["gfx-xform"]["output"]["tiles"]["@var-name"]
							,"text" : d["gfx-xform"]["output"]["tiles"]["@text"]
						};
					});

					gc.funcs.input.adjustMultiXml_select( tilesetNames );

					gc.vars.dom.input.xml.value="";
					gc.vars.dom.input.canvas.width=100;
					gc.vars.dom.input.canvas.height=100;
					gc.vars.dom.input.canvas.getContext("2d").clearRect(0,0,gc.vars.dom.input.canvas.width, gc.vars.dom.input.canvas.height);

					resolveOuter();
					return;
				}
				else{
					gc.vars.settings.input.full_jsonObj = {};
					jsonObj = full_jsonObj;
					srcImage = jsonObj["gfx-xform"]["input"]['@file'];
					gc.funcs.input.adjustMultiXml_select( [] );

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
				var img_prom = gc.funcs.shared.getImageElem_fromUrl(srcImage);

				// Continue validation after the image data has been retrieved.
				img_prom.then(function(img){
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

			});

		});

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
	,adjustMultiXml_select    : function( tilesetNames ){
		// console.log("adjustMultiXml_select:", tilesetNames);

		var i;
		var option;

		// If the array is populated, populate the select menu and then show it.
		if(tilesetNames.length){
			gc.vars.dom.input.xml_multi_div.classList.remove("unavailableView");
			gc.vars.dom.input.xml_multi_select.length=0;
			option = document.createElement("option");
			option.value="";
			option.text="... " + tilesetNames.length + " tilesets available";
			gc.vars.dom.input.xml_multi_select.appendChild(option);

			for(i=0; i<tilesetNames.length; i+=1){
				option = document.createElement("option");
				option.value=i;
				option.text=tilesetNames[i]['name'] + " (" + tilesetNames[i]['text'] + ")";
				gc.vars.dom.input.xml_multi_select.appendChild(option);
			}
		}

		// If the array is empty, empty and then hide the select menu.
		else{
			gc.vars.dom.input.xml_multi_div.classList.add("unavailableView");
			gc.vars.dom.input.xml_multi_select.length=0;
			option = document.createElement("option");
			option.value="";
			option.text="";
			gc.vars.dom.input.xml_multi_select.appendChild(option);
		}

	}
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
			var version = full_jsonObj["gfx-xform"]['@version'];
			if(version=="MULTI_TS"){
					gc.vars.settings.input.full_jsonObj = full_jsonObj;
					var tilesetNames = full_jsonObj["gfx-xform"]["TILESET"].map(function(d,i,a){
						return {
							 "name" : d["gfx-xform"]["output"]["tiles"]["@var-name"]
							,"text" : d["gfx-xform"]["output"]["tiles"]["@text"]
						};
					});

					gc.funcs.input.adjustMultiXml_select( tilesetNames );

					gc.vars.dom.input.xml.value="";
					gc.vars.dom.input.canvas.width=100;
					gc.vars.dom.input.canvas.height=100;
					gc.vars.dom.input.canvas.getContext("2d").clearRect(0,0,gc.vars.dom.input.canvas.width, gc.vars.dom.input.canvas.height);

			}
			else{
				gc.vars.settings.input.full_jsonObj = {};
				gc.funcs.input.adjustMultiXml_select( [] );

				newXml = gc.funcs.shared.format_xmlText(newXml);
				gc.vars.dom.input.xml.value = newXml ;
			}


		};

		if (file) { reader.readAsText(file); }


	}
	// loadXML_multi
	,loadXML_multi : function(e){
		// loadXML_multi
		var ts_index = gc.vars.dom.input.xml_multi_select.value;
		var src_image;
		var jsonObj;

		if(ts_index==""){
			console.log("A blank value was selected.");
			// alert      ("A blank value was selected.");

			// Erase the canvas and the textarea.
			gc.vars.dom.input.xml.value="";
			gc.vars.dom.input.canvas.width=100;
			gc.vars.dom.input.canvas.height=100;
			gc.vars.dom.input.canvas.getContext("2d").clearRect(0,0,gc.vars.dom.input.canvas.width, gc.vars.dom.input.canvas.height);

			return;
		}
		jsonObj   = gc.vars.settings.input.full_jsonObj["gfx-xform"]["TILESET"][ts_index];
		// console.log(jsonObj, gc.vars.settings.input.full_jsonObj);
		// console.log(jsonObj);
		src_image = jsonObj["gfx-xform"]["input"]["@file"];

		// Get the image.
		var img = new Image();
		img.onload = function(){
			img.onload=null;
			var ctx1 = gc.vars.dom.input.canvas.getContext("2d");
			ctx1.canvas.width = img.width;
			ctx1.canvas.height = img.height;
			ctx1.drawImage(img, 0, 0);

			// Pass the JSON and the IMG to the validator.
			gc.funcs.input.inputDataValidation(jsonObj, img);
		};
		img.src=src_image;

	}
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
				 	jsonObj=data.jsonObj;
				 	img=data.img;

				 	// Check if the tilesetOutputTo and removeDupeTiles keys exist and are populated.
					var tilesetOutputTo  = jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"];
					var removeDupeTiles  = jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"];
					var outputAsJson     = jsonObj["gfx-xform"]["output"]["tiles"]["@outputAsJson"];

				 	// Provide default values.
					if(tilesetOutputTo==undefined || tilesetOutputTo == ""){
						tilesetOutputTo="PROGMEM";
						jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"]=tilesetOutputTo;
					}
				 	// Provide default values.
					if(removeDupeTiles==undefined || removeDupeTiles == ""){
						removeDupeTiles=1;
						jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"]=removeDupeTiles;
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
		gc.vars.dom.input.xml_multi_select    .addEventListener('change', gc.funcs.input.loadXML_multi, false);
		gc.vars.dom.input.xml_multi_batch_btn .addEventListener('click', gc.funcs.input.multi_process, false);

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

// * Functions used by the Maps section.
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

// * Functions used by the Output section.
gc.funcs.output={
	// Pre-processing
	 getTilesetPlaceholderArray    : function(rows, cols){
		// Get the entire tileset: tile_cords, src_tile_id. Set other fields blank.
		var tileCount=0;

		var tileset = [];

		for(var src_y=0; src_y<rows; src_y++){
			for(var src_x=0; src_x<cols; src_x++){
				tileset.push(
					{
						  'src_tile_id'   : tileCount // Source tile_id of this tile.
						, 'src_y'         : src_y     // Source y position of this tile.
						, 'src_x'         : src_x     // Source x position of this tile.
						, 'timesUsed'     : 0         // How many times this tile data been used.
						, 'usedBy'        : []        // src_tile_ids that use this same tile data.
						, 'new_tile_id'   : null      //
						, 'dupeOf'        : null      // If this value exists then it is a dupe of the specified value.
						, 'dupedBy'       : []        // This would be a unique tile and the entries here would be which tiles are a dupe of this one.
						, 'data'          : null      //
						, 'tileUsedByMap' : []
						, 'isUnique'      : null
					}
				);

				tileCount++;
			}
		}

		return tileset;

	}
	,preProcessMaps                : function(tileset, maps, cols){
		for(var i=0; i<maps.length; i++){
			var map = maps[i];

			map["@src_tilesUsed"] = [];
			map["@new_tilesUsed"] = [];

			// Get the src_tilesUsed for this newMap.
			var startX = map['@left'] ;
			var startY = map['@top']  ;

			for(var y=0; y<map["@height"]; y++){
				for(var x=0; x<map["@width"]; x++){
					// Skip adding the tile if this map is SKIPMAP.
					if(map["@mapOutputTo"]=="SKIPMAP"){ continue; }

					// Determine the tile id.
					var tile_id = ((startY+y)*cols)+(startX+x);

					// Add the tile id to the src_tilesUsed.
					map["@src_tilesUsed"].push(tile_id);

					// Record that this source tile is used by this map.
					tileset[tile_id].tileUsedByMap.push( map['@var-name'] );
				}
			}

		}

	}
	,createRGB332_imageBuffer      : function(src_canvas){
		var img = [];

		// Get source image as imageData.
		// console.log("createRGB332_imageBuffer", src_canvas);
		var bufferORG = src_canvas.getContext('2d').getImageData(
			0, 0, src_canvas.width,src_canvas.height
		);
		// Convert imageData to RGB332 and save to new array.
		for (var i=0, k=0; i < bufferORG.data.length; i += 4) {
			// Get the colors for the current pixel.
			var r = bufferORG.data[i + 0];
			var g = bufferORG.data[i + 1];
			var b = bufferORG.data[i + 2];
			// var a = bufferORG.data[i + 3];

			// Encode the color to rgb332.
			// var eightBitColor1 = gc3.funcs.rgb_encode332(r, g, b);
			var eightBitColor1 = gc.funcs.shared.rgb_encode332(r, g, b);
			img[k++] = eightBitColor1;
		}

		return img;
	}
	,createRGB32_imageBuffer      : function(src_canvas){
		return this.createRGB332_imageBuffer(src_canvas);
	}
	,populateTileSetData           : function(src_tileset, image_buffer, imgWidth, tileWidth, tileHeight){
		var i;
		var getTileBytes = function(src_tile_id, src_tileset, imgWidth, tileWidth, tileHeight, image_buffer){
			// Find the tile with the specified src_tile_id.
			var thisTile = src_tileset[src_tile_id] ;
			var y = thisTile.src_y ;
			var x = thisTile.src_x ;
			var tile=[];
			var tileIndex       = 0;
			var h_tiles         = imgWidth / tileWidth;
			for (var th = 0; th < tileHeight; th++) {
				for (var tw = 0; tw < tileWidth; tw++) {
					var index = (y * h_tiles * tileWidth * tileHeight) +
						(x * tileWidth) + (th * h_tiles * tileWidth) + tw;

					tile[tileIndex++] = image_buffer[index];
				}
			}

			return tile;
		};

		var c=[];
		for(i=0; i<src_tileset.length; i++){
			if(src_tileset[i].tileUsedByMap.length){
				c.push(src_tileset[i].src_tile_id );
			}
		}

		// Get the tile data for each used src_tile_id.
		for(i=0; i<c.length; i++){
			// Address this tile in the src_tile_set.
			var tile1 = src_tileset[ c[i] ] ;

			src_tileset[ c[i] ].data = getTileBytes(
				  tile1.src_tile_id
				, src_tileset
				, imgWidth
				, tileWidth
				, tileHeight
				, image_buffer
			);

			// Easier compares.
			src_tileset[ c[i] ].dataText = src_tileset[ c[i] ].data.join(',');

		}
	}
	,reduceDuplicateTiles          : function(src_tileset, removeDupeTiles){
		// Return all tiles that have data.
		var tiles = src_tileset.filter(function(a){
			if(a.data != null){ return true ;}
		});

		tiles = tiles.map(function(a){
			a.alreadySeen=false;
			return a;
		});

		var startTime=performance.now();

		var matchingTiles_function = function(a){
			// Skip if this is literally the same tile.
			// if(a.src_tile_id == thisTile.src_tile_id) { return false; }

			// Skip if this tile has already been seen.
			if(a.alreadySeen==true){
				// console.log('already seen', a.src_tile_id);
				return false;
			}

			// Check if the data matches.
			if(a.dataText == thisTile.dataText){ return true; }
		};

		for(var ii=0; ii<tiles.length; ii++){
			var thisTile = tiles[ii];

			// Skip any tiles we have already seen.
			if(thisTile.alreadySeen==true){ continue; }

			var matchingTiles = tiles.filter( matchingTiles_function );

			// There should always be at least 1 match.
			if(matchingTiles.length){

				if(performance.now() - startTime > 10000){
					throw "TIMEOUT::" + performance.now() - startTime ;
					// break;
					// return;
				}

				// Only the first match is unique. The others are dupes.
				matchingTiles[0].isUnique    = true ;
				matchingTiles[0].alreadySeen = true ;
				matchingTiles[0].usedBy      .push( matchingTiles[0].src_tile_id );
				matchingTiles[0].timesUsed   ++;
				matchingTiles[0].new_tile_id = matchingTiles[0].src_tile_id ;

				// Don't adjust the other matches if the tiles are not to be de-duplicated.
				if(removeDupeTiles==0){
					// console.log("Not working with duplicate tiles. No deduplication will occur.");
					continue;
				}

				for(var i=1; i<matchingTiles.length; i++){
					// Only the first match is unique. The others are dupes.
					matchingTiles[0].timesUsed   ++;
					matchingTiles[0].usedBy      .push( matchingTiles[i].src_tile_id );
					matchingTiles[0].dupedBy     .push( matchingTiles[i].src_tile_id );

					// Work on the dupes.
					matchingTiles[i].timesUsed   ++;
					matchingTiles[i].usedBy      .push( matchingTiles[i].src_tile_id );
					matchingTiles[i].dupedBy     .push( matchingTiles[i].src_tile_id );
					matchingTiles[i].isUnique    = false;
					matchingTiles[i].alreadySeen = true ;
					// matchingTiles[i].data     = null ;
					// matchingTiles[i].dataText = null ;

					// Set the new_tile_id.
					matchingTiles[i].new_tile_id = matchingTiles[0].src_tile_id ;

				}
			}
			else{
				// console.log("No matches??", matchingTiles);
			}
		}

		return;

	}
	,remapTileMaps                 : function(src_tileset, maps){
		// Go through each map.
		for(var i=0; i<maps.length; i++){
			var map = maps[i];

			// Go through the used tiles in each map.
			for(var i2=0; i2<map["@src_tilesUsed"].length; i2++){
				// Set the new_tilesUsed to be a remap of the src_tilesUsed taking into account the new_tile_id for a tile.
				map["@new_tilesUsed"][i2] = src_tileset[ map["@src_tilesUsed"][i2] ].new_tile_id ;
			}

		}

	}
	// Processing
	,timestamp                     : function(){
		 var currentDateTime     = new Date();
		 var generatedTime =
			"// Generated by UAM V5 (gConvertJS)\n// " +
			currentDateTime.toLocaleString('en-us', {
				weekday:'long',
				year: 'numeric', month:  'short'  , day:    'numeric',
				hour: 'numeric', minute: 'numeric', second: 'numeric',
				hour12: true,
				timeZoneName: 'short'
			}
		) + "\n";

		return generatedTime;
	}
	,newTileset                    : function(tileset){
		// Create a new tileset: filter from the complete tileset.
		var reducedTileset = tileset.filter(function(a, i){
			// Provide new reduced tileset id.
			a.reduced_tile_id = i;

			// Return only the tiles that are designated as unique.
			return a.isUnique;
		}) ;

		return reducedTileset;
	}
	,newTileIds                    : function(tilemaps, tileset, tilesUsedByMaps_inOrder){
		for(var i=0; i<tilemaps.length; i++){
			var map = tilemaps[i];
			// src_tilesUsed     - Original tile id relative to the image.
			// new_tilesUsed     - First de-duplication.
			// reduced_tilesUsed - Last de-duplication.

			map["@new_tilesUsed"].map(function(d2,i2,a2){
				if(tilesUsedByMaps_inOrder.indexOf(d2) == -1){
					tilesUsedByMaps_inOrder.push(d2);
				}
			});

		}

		// Re-create the tileset but in the order relative to the tile ids seen in order by maps.
		var reducedTileset = [];
		for(var i=0; i<tilesUsedByMaps_inOrder.length; i++){
			// Find the tile id (by src_tile_id) in the tileset.
			let thisTile = tileset.filter(function(d2,i2,a2){
				if(d2.src_tile_id==tilesUsedByMaps_inOrder[i]){
					return true;
				}
			});

			if(thisTile.length){
				// Provide that tile its new tile id (reduced_tile_id).
				thisTile[0].reduced_tile_id=i;
				reducedTileset.push(thisTile[0]);
			}
			else{
				alert      ("function newTileIds: Tile not found? This is a bug.");
				console.log("function newTileIds: Tile not found? This is a bug.");
				throw       "function newTileIds: Tile not found? This is a bug." ;
			}

		}

		return reducedTileset;
	}
	,newMaps                       : function(tilemaps, tileset){
		// Create the new list of maps and create the reduced_tilesUsed array.
		var maps = [];

		tilemaps.map(function(m){
			// Get our map.
			var map = m;

			// Make a copy of the map to work with.
			var newMap = JSON.parse(JSON.stringify(map, null, 1) ) ;
			newMap['reduced_tilesUsed'] = [];

			// Populate the reduced_tilesUsed array.
			newMap['@new_tilesUsed'].map(function(t){
				// Get the matching tile data for this tile.
				var tileid1 = tileset.filter(function(a){ return a["new_tile_id"] == t  ; }) ;

				// New tile id will be the reduced_tile_id.
				tileid1 = tileid1.length ? tileid1[0]["reduced_tile_id"] : false;

				// The tile wasn't found? This is bad. Abort the whole thing.
				if(tileid1===false){
					console.log(
						  "1:", t
						, "2:", tileset
					);

					alert("A matching tile was NOT found in the tileset for one or more of this maps's tiles. Please see the dev console for more details.");
					throw "A matching tile was NOT found in the tileset for one or more of this maps's tiles. Please see the dev console for more details.";
				}

				// Add the tile to the reduced_tilesUsed.
				newMap['reduced_tilesUsed'].push( tileid1 );
			});

			// Add the new map to the maps list.
			maps.push( newMap );
		});

		return maps;

	}
	,tilesetText                   : function(tileset, tilesetName, tilesetOutputTo, pointersSize){
		// console.log(
		// 	"tileset        :", tileset        , "\n",
		// 	// "tilesetName    :", tilesetName    , "\n",
		// 	// "tilesetOutputTo:", tilesetOutputTo, "\n",
		// 	""
		// );
		var text_tileset = "";
		var tileWidth                = parseInt(gc.vars.settings.output.jsonObj["gfx-xform"]["input"]['@tile-width'], 10);
		var tileHeight               = parseInt(gc.vars.settings.output.jsonObj["gfx-xform"]["input"]['@tile-height'], 10);

		// Convert the tileset data to a C array.
		text_tileset += "#define "+tilesetName.toUpperCase()+"_SIZE " + tileset.length + "\n";

		// If tilesetOutputTo is NOT set to PROGMEM then don't include the PROGMEM keyword.

		// pointersSize is 8?
		if(pointersSize==8){
			text_tileset += "const char "+tilesetName+"[] "+(tilesetOutputTo=='PROGMEM' ? 'PROGMEM ' : '')+"= {"+ "\n";
		}
		// pointersSize is 16?
		else if(pointersSize==16){
			text_tileset += "const int "+tilesetName+"[] "+(tilesetOutputTo=='PROGMEM' ? 'PROGMEM ' : '')+"= {"+ "\n";
		}
		// pointerSize not set? Default to 8.
		else{
			text_tileset += "const char "+tilesetName+"[] "+(tilesetOutputTo=='PROGMEM' ? 'PROGMEM ' : '')+"= {"+ "\n";
		}

		tileset.map(function(a, tileIndex, tileArray){
			// Indent.
			text_tileset += " ";

			// Generate the comment text for the usage count of the tile id.
			let usage = "[ USED: " + (tileset[tileIndex].timesUsed).toString().padEnd(5, " ") + " ]";

			// Comment for start of tile.
			text_tileset += " /*[ TILE #" + tileIndex.toString().padStart(4, " ") + " ] "+usage+"*/ ";

			// Output the data bytes for this tile.
			a.data.map(function(data, dataIndex, dataArray){
				// As HEX
				var newByte = data.toString(16).padStart(2, "0").toUpperCase();
				text_tileset += "0x"+newByte;

				// As DEC
				// var newByte = data.toString(10).padStart(3, " ").toUpperCase();
				// text_tileset += ""+newByte;

				// As BIN
				// var newByte = data.toString(2).padStart(8, "0").toUpperCase();
				// text_tileset += "0b"+newByte;

				// If this NOT the last byte for this tile.
				if(dataIndex+1 != dataArray.length){
					text_tileset += ",";

					// If this pixel is multiple of the tileWidth (and not the first pixel...)
					if((1+dataIndex)%tileWidth==0 && dataIndex!=0){ text_tileset += " "; }
				}


			});

			// If this isn't the last tile, add the comma.
			if(tileIndex+1 != tileArray.length){
				text_tileset += ",";
			}
			// Otherwise add 2 spaces.
			else{
				text_tileset += " ";
			}

			// End of tile.
			text_tileset += "\n";

		});
		text_tileset += "};"+ "\n";

		return text_tileset;
	}
	,tilemapsText                  : function(maps, pointersSize){
		var text_mapset_PROGMEM = "";
		var text_mapset_SKIPMAP = "";
		var text_mapset_NOWHERE = "";
		var text_mapset_C2BIN   = "";
		var progmem=false;

		function countUniqueTileIdsInMap(map) {
			// console.log(map);
			return new Set( map.reduced_tilesUsed ).size;
		}

		function makeATileMap(map, progmem, pointersSize){
			// Start the text string for the map.
			var text ="";

			// Put the define for the map.
			text += "#define "+map["@var-name"].toUpperCase()+"_SIZE "+(2+(map["@width"]*map["@height"]));
			text += " // " + countUniqueTileIdsInMap(map) + " of " + map.reduced_tilesUsed.length + " are unique in this map.";
			text +="\n";

			var dataType;
			if     (pointersSize==8) { dataType="char"; }
			else if(pointersSize==16){ dataType="int"; }
			else                     { dataType="  char  "; }

			// Start the tilemap.
			var tilesInMap=(map["@width"]*map["@height"]);
			var bytesInMap=tilesInMap+2;
			text += "const "+dataType+" "+map["@var-name"]+"[] "+( progmem ? 'PROGMEM' : '')+" = {\n";
			text += " " + map["@width"] .toString().padStart(3, " ") + ",";
			text += "  " + map["@height"].toString().padStart(3, " ") + ",";
			text += " ".repeat(3);
			text += ("// width, height ("+tilesInMap+" tiles, " + bytesInMap +" bytes total)");

			// Go through each tile in the tilemap.
			map.reduced_tilesUsed.map(function(t, index, array){
				// Move to the next line if the same number of tiles as the width have been output for this row.
				if(index % map["@width"] == 0 && index !=-1){ text += "\n" ; }

				// Get the tile with some padding.
				var tileId = t.toString(10).padStart(3, " ");

				// Add a space after.
				text += " " + tileId ;

				// If this is the last tile in the map then put a newline. Otherwise, put a comma.
				if(index+1 == array.length){ text += "\n" ; }
				else                       { text += ", " ;}
			});

			// End with this string.
			text += "};\n\n";

			return text;
		}

		// Go through each map and add the tilemap data to the matching string.
		maps.map(function(a){
			var progmem=false;
			// console.log( a["@outputTo"], a );

			// A gfx-xform version 1 map will NOT have mapOutputTo. Set it to PROGMEM.
			if(a["@mapOutputTo"]==undefined){ a["@mapOutputTo"]="PROGMEM"; }

			if     ( a["@mapOutputTo"]=="PROGMEM" ){ progmem=true ; text_mapset_PROGMEM += makeATileMap(a, progmem, pointersSize); }
			else if( a["@mapOutputTo"]=="SKIPMAP" ){ progmem=true ; text_mapset_SKIPMAP += makeATileMap(a, progmem, pointersSize); }
			else if( a["@mapOutputTo"]=="NOWHERE" ){ progmem=true ; text_mapset_NOWHERE += makeATileMap(a, progmem, pointersSize); }
			else if( a["@mapOutputTo"]=="C2BIN"   ){ progmem=false; text_mapset_C2BIN   += makeATileMap(a, progmem, 16); }
			else                          {
				// progmem=true ; text_mapset_PROGMEM += makeATileMap(a, progmem, pointersSize);
				console.log("The 'mapOutputTo' attribute did not have a match. This is a bug. Please report it to the application author. ", a);
				alert      ("The 'mapOutputTo' attribute did not have a match. This is a bug. Please report it to the application author. "+JSON.stringify(a, null, 1));
				throw "The 'mapOutputTo' attribute did not have a match. This is a bug. Please report it to the application author. "+a;
			}
		});

		return {
			  text_mapset_PROGMEM : text_mapset_PROGMEM
			, text_mapset_SKIPMAP : text_mapset_SKIPMAP
			, text_mapset_NOWHERE : text_mapset_NOWHERE
			, text_mapset_C2BIN   : text_mapset_C2BIN
		};
	}
	,final_outputText_jsonOnly     : function(srcJson){
		// console.log("final_outputText_jsonOnly:", srcJson, Object.keys(srcJson));
		var textOutput1          = gc.vars.dom.output.progmemTextarea ;
		var textOutput2          = gc.vars.dom.output.c2binTextarea ;
		textOutput1.value = "";
		textOutput2.value = "";
		let json = {
			'generatedTime': srcJson["generatedTime"], 
			'tilesetName'  : srcJson["tilesetName"], 
			'config': {
				'pointersSize' : srcJson["pointersSize"], 
				'tileHeight'   : srcJson["tileHeight"], 
				'tileWidth'    : srcJson["tileWidth"], 
				'translucent_color' : srcJson["translucent_color"], 
			},
			'counts':{
				'tileset' : srcJson["tileset"].length,
				'tilemaps': Object.keys(srcJson["tilemaps"]).length,
			},
			'tilemaps'     : {},
			'tileset'      : [], 
		};
		
		for(let index in srcJson["tileset"]){
			json.tileset.push( JSON.stringify(srcJson["tileset"][index]) );
			// json.tileset.push( srcJson["tileset"][index] );
		}
		for(let key in srcJson["tilemaps"]){
			let rec = srcJson["tilemaps"][key];
			json.tilemaps[key] = JSON.stringify(rec);
			// json.tilemaps[key] = rec;
		}
		// console.log("final_outputText_jsonOnly: DONE: ", json);
		textOutput1.value = JSON.stringify(json);
		textOutput2.value = JSON.stringify(json,null,1);
		// [
		// 	'generatedTime', 
		// 	'tilesetName', 
		// 	'pointersSize', 
		// 	'tileHeight', 
		// 	'tileWidth', 
		// 	'tileset', 
		// 	'tilemaps'
		// ]
	}
	,final_outputText              : function(obj, dontClearTextareas, dstFile, dstFile2){
		var text_tileset_PROGMEM = obj.text_tileset_PROGMEM                  ;
		var text_mapset_PROGMEM  = obj.text_mapset_PROGMEM                   ;

		var mapNames             = obj.mapNames                              ;

		if(mapNames.NOWHERE.length){ mapNames.NOWHERE = "Map names: NOWHERE\n" + "  " + mapNames.NOWHERE.join("\n  ") + "\n\n"; }
		if(mapNames.SKIPMAP.length){ mapNames.SKIPMAP = "Map names: SKIPMAP\n" + "  " + mapNames.SKIPMAP.join("\n  ") + "\n\n"; }
		if(mapNames.PROGMEM.length){ mapNames.PROGMEM = "Map names: PROGMEM\n" + "  " + mapNames.PROGMEM.join("\n  ") + "\n\n"; }
		if(mapNames.C2BIN.length)  { mapNames.C2BIN   = "Map names: C2BIN\n"   + "  " + mapNames.C2BIN  .join("\n  ") + "\n\n"; }

		var text_mapset_NOWHERE  = obj.text_mapset_NOWHERE                   ;
		var text_mapset_SKIPMAP  = obj.text_mapset_SKIPMAP                   ;
		var text_tileset_C2BIN   = obj.text_tileset_C2BIN                    ;
		var text_mapset_C2BIN    = obj.text_mapset_C2BIN                     ;
		var generatedTime        = obj.generatedTime                         ;
		var textOutput1          = gc.vars.dom.output.progmemTextarea ;
		var textOutput2          = gc.vars.dom.output.c2binTextarea ;
		var textarea1_text="";
		var textarea2_text="";

		// Clear the output text areas.
		if(!dontClearTextareas){
			// console.log(
			// 	// "\n obj               :", obj                ,
			// 	// "\n dontClearTextareas:", dontClearTextareas ,
			// 	"\n dstFile           :", dstFile            ,
			// 	"\n dstFile2          :", dstFile2           ,
			// 	"\n"
			// );
			textOutput1.value = "";
			textOutput2.value = "";
		}

		// PROGMEM output (Also includes SKIPMAP, NOWHERE which are commented-out.)
		if(text_tileset_PROGMEM.length){
			textarea1_text += "// ------- -------------------- -------\n";
			textarea1_text += "// ------- TEXT_TILESET_PROGMEM -------\n";
			textarea1_text += "" + generatedTime+"";
			textarea1_text += "// ------- TEXT_TILESET_PROGMEM -------\n";
			textarea1_text += "// ------- -------------------- -------\n\n";
			textarea1_text += "" + text_tileset_PROGMEM+"\n";
		}
		if(text_mapset_PROGMEM.length){
			textarea1_text += "// ------- -------------------- -------\n";
			textarea1_text += "// ------- TEXT_MAPSET_PROGMEM  -------\n";
			textarea1_text += "" + generatedTime+"";
			textarea1_text += "// ------- TEXT_MAPSET_PROGMEM  -------\n";
			textarea1_text += "// ------- -------------------- -------\n\n";
			textarea1_text += "" + text_mapset_PROGMEM+"\n";
		}
		if(text_mapset_NOWHERE.length){
			textarea1_text += "// ------- -------------------- -------\n";
			textarea1_text += "// ------- TEXT_MAPSET_NOWHERE  -------\n";
			textarea1_text += "" + generatedTime+"";
			textarea1_text += "// ------- TEXT_MAPSET_NOWHERE  -------\n";
			textarea1_text += "// ------- -------------------- -------\n\n";
			textarea1_text += "/*\n" + text_mapset_NOWHERE+"*/\n\n";
		}
		if(text_mapset_SKIPMAP.length){
			textarea1_text += "// ------- -------------------- -------\n";
			textarea1_text += "// ------- TEXT_MAPSET_SKIPMAP  -------\n";
			textarea1_text += "" + generatedTime+"";
			textarea1_text += "// ------- TEXT_MAPSET_SKIPMAP  -------\n";
			textarea1_text += "// ------- -------------------- -------\n\n";
			textarea1_text += "/*\n" + text_mapset_SKIPMAP+"*/\n\n";
		}
		// C2BIN output.
		if(text_tileset_C2BIN.length){
			textarea2_text += "// ------- -------------------- -------\n";
			textarea2_text += "// ------- TEXT_TILESET_C2BIN   -------\n";
			textarea2_text += "" + generatedTime+"";
			textarea2_text += "// ------- TEXT_TILESET_C2BIN   -------\n";
			textarea2_text += "// ------- -------------------- -------\n\n";
			textarea2_text += "" + text_tileset_C2BIN+"\n";
		}
		if(text_mapset_C2BIN.length){
			textarea2_text += "// ------- -------------------- -------\n";
			textarea2_text += "// ------- TEXT_MAPSET_C2BIN    -------\n";
			textarea2_text += "" + generatedTime+"";
			textarea2_text += "// ------- TEXT_MAPSET_C2BIN    -------\n";
			textarea2_text += "// ------- -------------------- -------\n\n";
			textarea2_text += "" + text_mapset_C2BIN+"\n";

			// textarea2_text += "" + text_mapset_C2BIN+"\n";
		}

		if(textarea1_text.length){
			textarea1_text = "" +
				"// " + ("*".repeat(80)) + "\n" +
				"// BEGIN OUTPUT FILE: " + dstFile +" (PROGMEM)\n" +
				"// " + ("*".repeat(80)) + "\n" +
				textarea1_text +

				// Map names
				"/*\n\n"+
				mapNames.NOWHERE +
				mapNames.SKIPMAP +
				mapNames.PROGMEM +
				"*/"+
				"\n\n" +

				"// " + ("*".repeat(80)) + "\n" +
				"// END OUTPUT FILE: " + dstFile +" (PROGMEM)\n" +
				"// " + ("*".repeat(80)) + "\n" +
				"\n\n" +
				""
			;
			textarea1_text = textarea1_text.replace(/\\n/g, /\\r\\n/);
		}

		if(textarea2_text.length){
			textarea2_text = "" +
				"// " + ("*".repeat(80)) + "\n" +
				"// BEGIN OUTPUT FILE: " + dstFile2 +" (C2BIN)\n" +
				"// " + ("*".repeat(80)) + "\n" +
				textarea2_text +

				// Map names
				"/*\n\n"+
				mapNames.C2BIN +
				"*/"+
				"\n\n" +

				"// " + ("*".repeat(80)) + "\n" +
				"// END OUTPUT FILE: " + dstFile2 +" (C2BIN)\n" +
				"// " + ("*".repeat(80)) + "\n" +
				"\n\n" +
				""
			;

			textarea2_text = textarea2_text.replace(/\\n/g, /\\r\\n/);
		}

		textOutput1.value += textarea1_text;
		textOutput2.value += textarea2_text;

	}
	,final_outputImage_tileset     : function(reducedTileset, maps, tileWidth, tileHeight, rows, cols, jsonObj){
		// Tile data is in the reduced tileset object.
		var numberOfTiles=reducedTileset.length;
		if(numberOfTiles==0){
			alert ("ERROR! There would be 0 tiles in the tileset.");
			throw  "ERROR! There would be 0 tiles in the tileset.";
		}
		var tilesPerRow;
		var tilesPerCol;

		// Determine number of tiles per row and number of tiles per column.
		// Based on how many tiles will be in the final drawing.
		function determineTilesetImageDimensions(){
			tilesPerCol = 0;
			tilesPerRow = 0;
			var rowAndColConfigFound=false;

			for(var num=0; num<64; num+=1){
				if(numberOfTiles<=num*num){
					tilesPerCol = num;
					tilesPerRow = num;
					rowAndColConfigFound=true;
					break;
				}
			}

			if( ! rowAndColConfigFound ){
				// You cannot even fit this many tiles in the Uzebox!
				alert ("ERROR! Too many tiles. "+(64*64)+" is the limit.");
				throw  "ERROR! Too many tiles. "+(64*64)+" is the limit.";
			}

		}
		determineTilesetImageDimensions();

		var newCanvasWidth  = (tilesPerRow*tileWidth)  ;
		var newCanvasHeight = (tilesPerCol*tileHeight) ;

		gc.vars.dom.output.tilesetCanvas.width         = newCanvasWidth  ;
		gc.vars.dom.output.tilesetCanvas.height        = newCanvasHeight ;

		gc.vars.dom.output.tilesetCanvas_layer2.width  = newCanvasWidth  ;
		gc.vars.dom.output.tilesetCanvas_layer2.height = newCanvasHeight ;

		// Create an appropriately sized canvas element.
		var tempCanvas     = document.createElement("canvas");
		gc.funcs.shared.setpixelated(tempCanvas);
		tempCanvas.width   = newCanvasWidth  ;
		tempCanvas.height  = newCanvasHeight ;
		var tempCanvas_ctx = tempCanvas.getContext("2d");

		// Create a temporary tile, edit it's image data, then draw it to the temp canvas.
		var tempCanvas_tile     = document.createElement("canvas");
		gc.funcs.shared.setpixelated(tempCanvas_tile);
		tempCanvas_tile.width   = tileWidth  ;
		tempCanvas_tile.height  = tileHeight ;
		var tempCanvas_tile_ctx = tempCanvas_tile.getContext("2d");
		var imgData_tile        ;

		var translucent_color = Number( jsonObj["gfx-xform"]["output"]["tiles"]["@translucent_color"] );
		// console.log("translucent_color:", translucent_color);

		function setPixel(x, y, imgData_tile, r, g, b, a){
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 0 ] = r;
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 1 ] = g;
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 2 ] = b;
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 3 ] = a;
		}
		var RGB32_data_function = function(eightBitColor1){
			// var eightBitColor1 = eightBitColor1;
			var rgb32          = gc.funcs.shared.rgb_decode332(eightBitColor1);

			// 0xFE, 254: Transparent color.
			if(!isNaN(translucent_color) && eightBitColor1 == translucent_color){
				rgb32.red   = 0 ;
				rgb32.green = 0 ;
				rgb32.blue  = 0 ;
				rgb32.alpha = 0 ;
			}
			else{
				rgb32.alpha = 255;
				rgb32.red   = parseInt(rgb32.red  .toFixed(0), 10) ;
				rgb32.green = parseInt(rgb32.green.toFixed(0), 10) ;
				rgb32.blue  = parseInt(rgb32.blue .toFixed(0), 10) ;
				rgb32.alpha = parseInt(rgb32.alpha.toFixed(0), 10) ;
			}

			return rgb32;
		};
		for(var tile_index=0; tile_index<reducedTileset.length; tile_index++){
			imgData_tile = tempCanvas_tile_ctx.createImageData( tileWidth, tileHeight);

			// Get the RGBA32 data for this tile.
			var RGB32_data = reducedTileset[tile_index].data.map( RGB32_data_function );

			// Go through all the returned bytes. Set as RGBA332.
			var curIndex_src=0;
			for(var tilePosY=0; tilePosY<tileHeight; tilePosY++){
				for(var tilePosX=0; tilePosX<tileWidth; tilePosX++){
					setPixel(
						 tilePosX ,tilePosY ,imgData_tile
						,RGB32_data[curIndex_src].red
						,RGB32_data[curIndex_src].green
						,RGB32_data[curIndex_src].blue
						,RGB32_data[curIndex_src].alpha
						// ,255
					);
					curIndex_src++;

				}
			}

			// Determine the destination col and row.
			var thisRow = Math.floor (tile_index / tilesPerRow  );
			var thisCol = tile_index-(thisRow * tilesPerRow);

			// Now write the tile canvas to the dest canvas. Keep in mind the current width/height.
			tempCanvas.getContext('2d').putImageData(imgData_tile, thisCol*tileWidth, thisRow*tileHeight);
		}

		gc.vars.dom.output.tilesetCanvas.getContext('2d').drawImage(tempCanvas, 0, 0);
		gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').clearRect(0,0, gc.vars.dom.output.tilesetCanvas_layer2.width, gc.vars.dom.output.tilesetCanvas_layer2.height);

		// Draw the tiny canvas.
		gc.vars.dom.output.tilesetCanvas_small.width= newCanvasWidth;
		gc.vars.dom.output.tilesetCanvas_small.height=newCanvasHeight;
		gc.vars.dom.output.tilesetCanvas_small.getContext('2d').drawImage(tempCanvas, 0, 0);

	}
	,final_outputImage_markedDupes : function(reducedTileset, maps, tileWidth, tileHeight, rows, cols){
		var tilesPerRow   = cols; //rows/tileWidth;
		var tilesPerCol   = rows; //cols/tileHeight;
		var numberOfTiles = rows * cols;
		var newCanvasWidth  = (tilesPerRow*tileWidth)  ;
		var newCanvasHeight = (tilesPerCol*tileHeight) ;
		gc.vars.dom.output.markedDupesCanvas.width  = newCanvasWidth  ;
		gc.vars.dom.output.markedDupesCanvas.height = newCanvasHeight ;

		// Create an appropriately sized canvas element.
		var tempCanvas     = document.createElement("canvas");
		tempCanvas.width   = newCanvasWidth  ;
		tempCanvas.height  = newCanvasHeight ;
		var tempCanvas_ctx = tempCanvas.getContext("2d");
		gc.funcs.shared.setpixelated(tempCanvas);

		// Get a copy of the mapEditor canvas, change the alpha, then draw it to the temp canvas.
		var buff = gc.vars.dom.maps.canvas_main.getContext('2d').getImageData(
			0,0,
			gc.vars.dom.maps.canvas_main.width, gc.vars.dom.maps.canvas_main.height
		);

		for(var i=0; i<buff.data.length; i+=4){
			var red   = buff.data[i+0];
			var green = buff.data[i+1];
			var blue  = buff.data[i+2];
			// var alpha = buff.data[i+3];

			var alpha = 128;
			// GRAYSCALE
			var avg = ( (red)+(green)+(blue) )/3;
			buff.data[i+0] = avg;
			buff.data[i+1] = avg;
			buff.data[i+2] = avg;
			buff.data[i+3] = alpha;
		}
		tempCanvas_ctx.putImageData(buff, 0, 0);

		buff=null;

		// Create a temporary tile, edit it's image data, then draw it to the temp canvas.
		var tempCanvas_tile     = document.createElement("canvas");
		gc.funcs.shared.setpixelated(tempCanvas_tile);
		tempCanvas_tile.width   = tileWidth  ;
		tempCanvas_tile.height  = tileHeight ;
		var tempCanvas_tile_ctx = tempCanvas_tile.getContext("2d");
		var imgData_tile        ;

		function setPixel(x, y, imgData_tile, r, g, b, a){
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 0 ] = r;
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 1 ] = g;
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 2 ] = b;
			imgData_tile.data[ ((y * (imgData_tile.width * 4)) + (x * 4)) + 3 ] = a;
		}

		var tile_index;
		var curIndex_src;
		var tilePosY;
		var tilePosX;

		var RGB32_data_function = function(a){
			var eightBitColor1 = a;
			var rgb32          = gc.funcs.shared.rgb_decode332(eightBitColor1);

			rgb32.alpha = 255;

			rgb32.red   = parseInt(rgb32.red  .toFixed(0), 10) ;
			rgb32.green = parseInt(rgb32.green.toFixed(0), 10) ;
			rgb32.blue  = parseInt(rgb32.blue .toFixed(0), 10) ;
			rgb32.alpha = parseInt(rgb32.alpha.toFixed(0), 10) ;

			return rgb32;
		};

		for(tile_index=0; tile_index<reducedTileset.length; tile_index++){
			var tile = reducedTileset[tile_index];

			// let minUsed = 10; let filterBasedOnminUsed=true;
			// let maxUsed = 1; let filterBasedOnmaxUsed=true;

			// if( (filterBasedOnminUsed==true && tile.timesUsed>=minUsed) || filterBasedOnminUsed==false){
			// if( (filterBasedOnmaxUsed==true && tile.timesUsed<=maxUsed) || filterBasedOnmaxUsed==false){
				imgData_tile = tempCanvas_tile_ctx.createImageData( tileWidth, tileHeight);

				// Get the RGBA32 data for this tile.
				var RGB32_data = reducedTileset[tile_index].data.map( RGB32_data_function );

				// Go through all the returned bytes. Set as RGBA332.
				curIndex_src=0;

				for(tilePosY=0; tilePosY<tileHeight; tilePosY++){
					for(tilePosX=0; tilePosX<tileWidth; tilePosX++){
						setPixel(
							 tilePosX ,tilePosY ,imgData_tile
							,RGB32_data[curIndex_src].red
							,RGB32_data[curIndex_src].green
							,RGB32_data[curIndex_src].blue
							,255
						);
						curIndex_src++;

					}
				}

				// Determine the destination col and row.
				// Now write the tile canvas to the dest canvas. Keep in mind the current width/height.
				tempCanvas.getContext('2d').putImageData(imgData_tile, tile.src_x*tileWidth, tile.src_y*tileHeight);
			// }
		}

		gc.vars.dom.output.markedDupesCanvas.getContext('2d').drawImage(tempCanvas, 0, 0);

		// Draw the tiny canvas.
		gc.vars.dom.output.markedDupesCanvas_small.width= newCanvasWidth;
		gc.vars.dom.output.markedDupesCanvas_small.height=newCanvasHeight;
		gc.vars.dom.output.markedDupesCanvas_small.getContext('2d').drawImage(tempCanvas, 0, 0);

	}

	,processToC                    : function(jsonObj, xmlObj){
		gc.vars.timestamps.ts_all.s = performance.now();

		var srcCanvas                = gc.vars.dom.maps.canvas_main;
		var tilesetOutputTo          = jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"];
		var removeDupeTiles          = jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"];
		var outputAsJson             = jsonObj["gfx-xform"]["output"]["tiles"]["@outputAsJson"];
		var version                  = jsonObj["gfx-xform"]["@version"];
		var pointersSize             = parseInt(jsonObj["gfx-xform"]["output"]["maps"]['@pointers-size'], 10);
		var dstFile                  = jsonObj["gfx-xform"]["output"]['@file'];
		var dstFile2                 = jsonObj["gfx-xform"]["output"]['@file2'];
		var tilesetName              = jsonObj["gfx-xform"]["output"]["tiles"]["@var-name"];
		var tileHeight               = parseInt(jsonObj["gfx-xform"]["input"]['@tile-height'], 10);
		var tileWidth                = parseInt(jsonObj["gfx-xform"]["input"]['@tile-width'], 10);

		var imgWidth                 = gc.vars.dom.maps.canvas_main.width;
		var imgHeight                = gc.vars.dom.maps.canvas_main.height;

		var cols                     = imgWidth/tileWidth;
		var rows                     = imgHeight/tileHeight;

		var textOutput;
		var reducedTileset;
		var generatedTime;
		var text_tileset_PROGMEM     = "";
		var text_tileset_C2BIN       = "";
		var text_mapset_PROGMEM      = "";
		var text_mapset_C2BIN        = "";
		var text_mapset_NOWHERE      = "";
		var text_mapset_SKIPMAP      = "";

		function preProcess      (){
			return new Promise(async function(resolve, reject){
				// Get an array of maps. ParseInt where needed.
				var maps = jsonObj["gfx-xform"]["output"]["maps"]["map"].map(function(d,i,a){
					// Parse int on the number attributes.
					d["@left"]     = parseInt( d["@left"]     , 10);
					d["@top"]      = parseInt( d["@top"]      , 10);
					d["@width"]    = parseInt( d["@width"]    , 10);
					d["@height"]   = parseInt( d["@height"]   , 10);
					return d;
				});

				if(tilesetOutputTo == undefined) {
					// tilesetOutputTo = gc.vars.dom.maps.tilesetOutputTo.value;
					tilesetOutputTo = "PROGMEM";
					jsonObj["gfx-xform"]["output"]["tiles"]["@tilesetOutputTo"] = tilesetOutputTo;
				}
				if(removeDupeTiles == undefined) {
					removeDupeTiles = gc.vars.dom.maps.removeDupeTiles.checked ? 1 : 0;
					jsonObj["gfx-xform"]["output"]["tiles"]["@removeDupeTiles"] = removeDupeTiles;
				}
				if(outputAsJson == undefined) {
					outputAsJson = gc.vars.dom.maps.outputAsJson.checked ? 1 : 0;
					jsonObj["gfx-xform"]["output"]["tiles"]["@outputAsJson"] = outputAsJson;
				}

				// 01_getTilesetPlaceholderArray
				gc.vars.timestamps.getTilesetPlaceholderArray.s  = performance.now();
				var tileset = gc.funcs.output.getTilesetPlaceholderArray(rows, cols);
				gc.vars.timestamps.getTilesetPlaceholderArray.e  = performance.now();

				// 02_preProcessMaps
				gc.vars.timestamps.preProcessMaps.s              = performance.now();
				gc.funcs.output.preProcessMaps(tileset, maps, cols);
				gc.vars.timestamps.preProcessMaps.e              = performance.now();

				// 03_createRGB332_imageBuffer
				gc.vars.timestamps.createRGB332_imageBuffer.s    = performance.now();
				var image_buffer;
				if(outputAsJson == 0){ image_buffer = gc.funcs.output.createRGB332_imageBuffer(srcCanvas); }
				else{
					image_buffer = gc.funcs.output.createRGB32_imageBuffer(srcCanvas);
				}
				
				gc.vars.timestamps.createRGB332_imageBuffer.e    = performance.now();

				// 04_populateTileSetData
				gc.vars.timestamps.populateTileSetData.s         = performance.now();
				gc.funcs.output.populateTileSetData( tileset, image_buffer, imgWidth, tileWidth, tileHeight );
				gc.vars.timestamps.populateTileSetData.e         = performance.now();

				// 05_reduceDuplicateTiles
				gc.vars.timestamps.reduceDuplicateTiles.s        = performance.now();
				gc.funcs.output.reduceDuplicateTiles( tileset, removeDupeTiles );
				gc.vars.timestamps.reduceDuplicateTiles.e        = performance.now();

				// 06_remapTileMaps
				gc.vars.timestamps.remapTileMaps.s               = performance.now();
				gc.funcs.output.remapTileMaps( tileset, maps );
				gc.vars.timestamps.remapTileMaps.e               = performance.now();

				var res_obj = {
					 'tileset'         : tileset
					,'maps'            : maps
					,'imgWidth'        : imgWidth
					,'imgHeight'       : imgHeight
					,'tileWidth'       : tileWidth
					,'tileHeight'      : tileHeight
					,'rows'            : rows
					,'cols'            : cols
					,'image_buffer'   : image_buffer
					,'version'         : version
					,'pointersSize'    : pointersSize
					,'dstFile'         : dstFile
					,'dstFile2'        : dstFile2
					,'tilesetName'     : tilesetName
					,'tilesetOutputTo' : tilesetOutputTo
					,'removeDupeTiles' : removeDupeTiles
				};

				// throw "DONE";

				// console.log( "PRE-PROCESS: res_obj: \n", res_obj );

				resolve( res_obj );

			});
		}
		function process         (data){
			return new Promise(function(resolve, reject){
				var tilesUsedByMaps_inOrder = [];

				//_01_ // Create the datestamp that will be used (EXAMPLE: // Generated by UAM V5 (gConvertJS) Sunday, Nov 4, 2018, 10:29:44 AM EST)
				gc.vars.timestamps.timestamp.s                     = performance.now();
				generatedTime = gc.funcs.output.timestamp( );
				gc.vars.timestamps.timestamp.e                     = performance.now();

				//_02_ // Create a new tileset: filter from the complete tileset.
				gc.vars.timestamps.newTileset.s                    = performance.now();
				reducedTileset = gc.funcs.output.newTileset( data.tileset );
				gc.vars.timestamps.newTileset.e                    = performance.now();

				//_03_ // Provide the new reduced tileset tile id for each of the tiles.
				gc.vars.timestamps.newTileIds.s                    = performance.now();
				reducedTileset = gc.funcs.output.newTileIds( data.maps, reducedTileset, tilesUsedByMaps_inOrder );
				gc.vars.timestamps.newTileIds.e                    = performance.now();

				//_04_ // Create the new list of maps and create the reduced_tilesUsed array.
				gc.vars.timestamps.newMaps.s                       = performance.now();
				data.maps = gc.funcs.output.newMaps( data.maps, reducedTileset );
				gc.vars.timestamps.newMaps.e                       = performance.now();

				//_05_ // Convert the tileset data to a C array.
				gc.vars.timestamps.tilesetText.s                   = performance.now();
				if     (tilesetOutputTo=='PROGMEM'){
					text_tileset_PROGMEM = gc.funcs.output.tilesetText( reducedTileset, tilesetName, tilesetOutputTo, pointersSize );
				}
				else if(tilesetOutputTo=='C2BIN'){
					text_tileset_C2BIN   = gc.funcs.output.tilesetText( reducedTileset, tilesetName, tilesetOutputTo, pointersSize );
				}
				gc.vars.timestamps.tilesetText.e                   = performance.now();

				//_06_ // Generate the text for all the types of tile maps.
				gc.vars.timestamps.tilemapsText.s                  = performance.now();
				textOutput = gc.funcs.output.tilemapsText( data.maps, pointersSize );
				gc.vars.timestamps.tilemapsText.e                  = performance.now();

				var mapNames = {
					"SKIPMAP" : data.maps.filter(function(d,i,a){if(d["@mapOutputTo"]=="SKIPMAP"){return true;}}).map(function(d,i,a){ return d["@var-name"];}) ,
					"PROGMEM" : data.maps.filter(function(d,i,a){if(d["@mapOutputTo"]=="PROGMEM"){return true;}}).map(function(d,i,a){ return d["@var-name"];}) ,
					"NOWHERE" : data.maps.filter(function(d,i,a){if(d["@mapOutputTo"]=="NOWHERE"){return true;}}).map(function(d,i,a){ return d["@var-name"];}) ,
					"C2BIN"   : data.maps.filter(function(d,i,a){if(d["@mapOutputTo"]=="C2BIN"  ){return true;}}).map(function(d,i,a){ return d["@var-name"];}) ,
				};
				// console.log("data.maps:", data.maps);
				// console.log("mapNames  :", mapNames  );

				var textObject = {
					 text_tileset_PROGMEM : text_tileset_PROGMEM
					,text_tileset_C2BIN   : text_tileset_C2BIN

					,text_mapset_PROGMEM  : textOutput.text_mapset_PROGMEM
					,text_mapset_SKIPMAP  : textOutput.text_mapset_SKIPMAP
					,text_mapset_NOWHERE  : textOutput.text_mapset_NOWHERE
					,text_mapset_C2BIN    : textOutput.text_mapset_C2BIN

					,generatedTime        : generatedTime

					,mapNames             : mapNames
				};

				//_07_ //
				gc.vars.timestamps.final_outputText.s              = performance.now();
				let json;
				if(outputAsJson == "1"){
					// Create a JSON-compatible output. 
					let json = {
						generatedTime: generatedTime,
						tilesetName  : tilesetName,
						pointersSize : pointersSize,
						tileHeight   : tileHeight,
						tileWidth    : tileWidth,
						translucent_color : Number( jsonObj["gfx-xform"]["output"]["tiles"]["@translucent_color"] ),
						tileset  : [],
						tilemaps : {},
					};
					// console.log("SOURCE:", data);
					for(let i=0; i<data.maps.length; i+=1){
						let rec = data.maps[i];
						// json.tilemaps[ rec["@var-name"] ] = {
						// 	mapOutputTo: rec["@mapOutputTo"],
						// 	arr        : [ rec["@width"], rec["@height"], ...rec["reduced_tilesUsed"]]
						// };
						json.tilemaps[ rec["@var-name"] ] = [ rec["@width"], rec["@height"], ...rec["reduced_tilesUsed"]];
					}
					for(let i=0; i<reducedTileset.length; i+=1){
						json.tileset.push( reducedTileset[i].data );
					}
					// console.log("outputAsJson:", json);

					gc.funcs.output.final_outputText_jsonOnly(json);
				}
				else{
					gc.funcs.output.final_outputText( textObject, false, dstFile, dstFile2);
				}
				gc.vars.timestamps.final_outputText.e              = performance.now();

				//_08_ //
				gc.vars.timestamps.final_outputImage_tileset.s     = performance.now();
				gc.funcs.output.final_outputImage_tileset( reducedTileset, data.maps, tileWidth, tileHeight, rows, cols, jsonObj );
				gc.vars.timestamps.final_outputImage_tileset.e     = performance.now();

				//_09_ //
				gc.vars.timestamps.final_outputImage_markedDupes.s = performance.now();
				gc.funcs.output.final_outputImage_markedDupes( reducedTileset, data.maps, tileWidth, tileHeight, rows, cols  );
				gc.vars.timestamps.final_outputImage_markedDupes.e = performance.now();
				
				// Return the normal output AND the JSON output. 
				var returnObject = {
					 "reducedTileset" : reducedTileset
					,"data.maps"      : data.maps
					,"generatedTime"  : generatedTime
					,"data.tileset"   : data.tileset
					,"tilesetName"    : tilesetName
					,"textObject"     : textObject
					,"dstFile"        : dstFile
					,"dstFile2"       : dstFile2
					,"JSON": json
				};

				// console.log("process:", returnObject);
				// console.log(json);

				// console.log(
				// 	"\nFINAL PROCESS:",
				// 	"\nreturnObject           :", returnObject,
				// 	"\ntileset                :", returnObject.reducedTileset,
				// 	"\nmaps                   :", returnObject["data.maps"],
				// 	"\ntilesUsedByMaps_inOrder:", tilesUsedByMaps_inOrder,
				// 	"\n"
				// );
				// throw "DONE";

				resolve( returnObject );
			});
		}
		function timestampsOutput(){
			// TIMESTAMP STUFF
			gc.vars.newTimestamps = [];
			var keys = Object.keys(gc.vars.timestamps);
			var key;

			for(var k=0; k<keys.length; k++){
				key=keys[k];

				// Update the passed timestamp.
				gc.vars.timestamps[key].time = gc.vars.timestamps[key].e - gc.vars.timestamps[key].s;
				gc.vars.timestamps[key].time = gc.vars.timestamps[key].time.toFixed(1);

				gc.vars.newTimestamps[key] =
					{
						 'order':gc.vars.timestamps[key].order
						,'time' :gc.vars.timestamps[key].time
					};
			}

			gc.vars.newTimestamps.sort(function(a, b) {
				return a.order - b.order;
			});

			// Pre-processing:
			gc.vars.dom.performance.getTilesetPlaceholderArray     .innerHTML = gc.vars.newTimestamps['getTilesetPlaceholderArray'].time + " ms";
			gc.vars.dom.performance.preProcessMaps                 .innerHTML = gc.vars.newTimestamps['preProcessMaps']            .time + " ms";
			gc.vars.dom.performance.createRGB332_imageBuffer       .innerHTML = gc.vars.newTimestamps['createRGB332_imageBuffer']  .time + " ms";
			gc.vars.dom.performance.populateTileSetData            .innerHTML = gc.vars.newTimestamps['populateTileSetData']       .time + " ms";
			gc.vars.dom.performance.reduceDuplicateTiles           .innerHTML = gc.vars.newTimestamps['reduceDuplicateTiles']      .time + " ms";
			gc.vars.dom.performance.remapTileMaps                  .innerHTML = gc.vars.newTimestamps['remapTileMaps']             .time + " ms";
			// Processing:
			gc.vars.dom.performance.timestamp                     .innerHTML = gc.vars.newTimestamps['timestamp']                    .time + " ms";
			gc.vars.dom.performance.newTileset                    .innerHTML = gc.vars.newTimestamps['newTileset']                   .time + " ms";
			gc.vars.dom.performance.newTileIds                    .innerHTML = gc.vars.newTimestamps['newTileIds']                   .time + " ms";
			gc.vars.dom.performance.newMaps                       .innerHTML = gc.vars.newTimestamps['newMaps']                      .time + " ms";
			gc.vars.dom.performance.tilesetText                   .innerHTML = gc.vars.newTimestamps['tilesetText']                  .time + " ms";
			gc.vars.dom.performance.tilemapsText                  .innerHTML = gc.vars.newTimestamps['tilemapsText']                 .time + " ms";
			gc.vars.dom.performance.final_outputText              .innerHTML = gc.vars.newTimestamps['final_outputText']             .time + " ms";
			gc.vars.dom.performance.final_outputImage_tileset     .innerHTML = gc.vars.newTimestamps['final_outputImage_tileset']    .time + " ms";
			gc.vars.dom.performance.final_outputImage_markedDupes .innerHTML = gc.vars.newTimestamps['final_outputImage_markedDupes'].time + " ms";
			// All:
			gc.vars.dom.performance.ts_all                        .innerHTML = gc.vars.newTimestamps['ts_all'].time + " ms";

		}

		var outerPromise = new Promise(function(resolveOuter, rejectOuter){
			//
			preProcess()
				//
				.then( async function(data){
					let results = await process(data)
					// console.log("RESULTS:", results);
					return results;
				}, function(error){ console.log("ERROR in preProcess:", error); rejectOuter(); return outerPromise; } )
				//
				.then(
					function(data)    {
						// console.log("DONE:", data);
						gc.vars.timestamps.ts_all.e = performance.now();
						timestampsOutput();
						resolveOuter(data);
						return outerPromise;
					},
					function(error){
						console.log("ERROR in process:"   , error); rejectOuter();
						return outerPromise;
					}
				)
			;
		});

		return outerPromise;

	}

	,tilesetHover_mousemove : function(e){
		var isBlank = gc.funcs.shared.isCanvasBlank( gc.vars.dom.output.tilesetCanvas.id );
		if(!isBlank ){
				// Set src_canvas.
				var src_canvas = gc.vars.dom.output.tilesetCanvas;

				// Get the tile width and tile height.
				var tileWidth  = parseInt(gc.vars.settings.output.jsonObj["gfx-xform"]["input"]['@tile-width'], 10);
				var tileHeight = parseInt(gc.vars.settings.output.jsonObj["gfx-xform"]["input"]['@tile-height'], 10);

				// Determine the cols and rows.
				var rows       = src_canvas.height / tileHeight ;
				var cols       = src_canvas.width  / tileWidth  ;

				var rect = src_canvas.getBoundingClientRect();
				var evt = e;
				var coords = {
					x: (evt.clientX - rect.left) / (rect.right  - rect.left) * src_canvas.width,
					y: (evt.clientY - rect.top)  / (rect.bottom - rect.top)  * src_canvas.height
				};
				var left = Math.floor(coords.x / tileWidth );
				var top  = Math.floor(coords.y / tileHeight);

				// var dest_canvas1= gc3.domElems.output.canvas.tileInfo1;
				var dest_canvas1= gc.vars.dom.output.tileInfo_canvas;

				dest_canvas1.width=tileWidth;
				dest_canvas1.height=tileHeight;

				dest_canvas1.style.width=tileWidth*4+"px"; dest_canvas1.style.height=tileHeight*4+"px";

				var mapWidth  = 1;
				var mapHeight = 1;

				// Get the canvas relative coords.
				var srcX = left      * tileWidth  ;
				var srcY = top       * tileHeight ;
				var w    = mapWidth  * tileWidth  ;
				var h    = mapHeight * tileHeight ;

				// Get the data for the hovered portion of the source canvas.
				var imgData = src_canvas.getContext('2d').getImageData( srcX, srcY, w, h );

				// Draw the data to the preview canvas.
				dest_canvas1.getContext('2d').putImageData(imgData, 0, 0);

				// Draw a hover indicator on the second layer of the source canvas.
				// Set layer 2 of the source canvas to fully transparent (clear it.)
				gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').clearRect(
					0, 0
					, gc.vars.dom.output.tilesetCanvas_layer2.width
					, gc.vars.dom.output.tilesetCanvas_layer2.height
				);
				gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').fillStyle="rgba(244, 67, 54, 0.7)";
				gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').strokeStyle="white";
				gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').lineWidth=0.5;
				gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').fillRect( srcX, srcY, w, h );
				gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').strokeRect( srcX, srcY, w, h );

				var tile_id = ( parseInt(srcX/tileWidth, 10) + parseInt(srcY/tileHeight, 10)*cols ) ;

				// document.querySelector("#gc3_output_tileHoverPreview_tileNumber").innerHTML = "#:"+tile_id ;
				gc.vars.dom.output.tileInfo_text.innerHTML = "#:"+tile_id ;

				// Position the hover preview canvas near the mouse cursor.
				var hover_left = Math.floor( rect.x+( (rect.width /cols) * (left+1) ) );
				var hover_top  = Math.floor( rect.y+( (rect.height/rows) * (top +1) ) );

				gc.vars.dom.output.tileInfo_div.style.visibility="visible";
				gc.vars.dom.output.tileInfo_div.style.left=hover_left+"px";
				gc.vars.dom.output.tileInfo_div.style.top =hover_top+"px";
		}
		else{
			// console.log("tileset canvas is blank.");
			return;
		}
	}
	,tilesetHover_mouseleave : function(e){
		// console.log("tilesetHover_mouseleave:", e);
		gc.vars.dom.output.tileInfo_div.style.visibility="hidden";

		// Clear the layer_2 canvas.
		gc.vars.dom.output.tilesetCanvas_layer2.getContext('2d').clearRect(
			0, 0
			, gc.vars.dom.output.tilesetCanvas_layer2.width
			, gc.vars.dom.output.tilesetCanvas_layer2.height
		);
	}

	,addEventListeners : function(){
		// * Mouseover on the tilesetCanvas_layer2
		gc.vars.dom.output.tilesetCanvas_layer2.addEventListener('mousemove', gc.funcs.output.tilesetHover_mousemove, false);

		// * Mouseleave on the tilesetCanvas_layer2
		gc.vars.dom.output.tilesetCanvas_layer2.addEventListener('mouseleave', gc.funcs.output.tilesetHover_mouseleave, false);

		// * Click on the see performance stats button.
		gc.vars.dom.output.goToPerformance.addEventListener('click', function(){
			document.getElementById( 'section_gcPerformance' ).scrollIntoView( gc.funcs.quickNav.scrollIntoView_options );
		}, false);

		// * Downloads.
		gc.vars.dom.output.download_srcXml_btn        .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("srcXml", true); }, false);
		gc.vars.dom.output.download_srcImg_btn        .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("srcImg", true); }, false);
		gc.vars.dom.output.download_mapImg_btn        .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("mapImg", true); }, false);
		gc.vars.dom.output.download_tilesetImg_btn    .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("tilesetImg", true); }, false);
		gc.vars.dom.output.download_markedDupesImg_btn.addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("markedDupesImg", true); }, false);
		gc.vars.dom.output.download_progmemInc_btn    .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("progmemInc", true); }, false);
		gc.vars.dom.output.download_c2binInc_btn      .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("c2binInc", true); }, false);

		gc.vars.dom.output.download_all_input_btn     .addEventListener('click', gc.funcs.downloads.downloadAllInputFiles, false);
		gc.vars.dom.output.download_all_output_btn    .addEventListener('click', gc.funcs.downloads.downloadAllOutputFiles, false);
		gc.vars.dom.output.download_all_all_btn       .addEventListener('click', gc.funcs.downloads.downloadAllAssetFiles, false);
	}
};

// * Function that starts all the event listeners.
gc.funcs.addAllListeners = function(){
	// quickNav
	gc.funcs.quickNav.addEventListeners();

	// Input
	gc.funcs.input.addEventListeners();

	// Maps
	gc.funcs.maps.addEventListeners();

	// Output
	gc.funcs.output.addEventListeners();

	// Performance
	// gc.funcs.input.addEventListeners();

	// UAM login, logout, open buttons.
	if(gc.vars.originUAM==true){
		gc.vars.dom.uamLogin["uam_login"] .addEventListener("click", function(){ gc.funcs.UAM.openModal("uamlogin" ); }, false);
		gc.vars.dom.uamLogin["uam_logout"].addEventListener("click", function(){ gc.funcs.UAM.openModal("uamlogout"); }, false);
		gc.vars.dom.uamLogin["openUAM"].forEach(function(d, i, a) {
			d.addEventListener("click", gc.funcs.UAM.openUamInNewWindow, false);
		});
	}

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
		gc.funcs.shared.serverRequest(formData).then(function(res){
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

			}
			// If UAM and there is not an active login then show dialog C.
			else if(res.UAMDATA.hasActiveLogin==0){
				// Populate the UAM DOM handle caches.
				gc.funcs.domHandleCache_populate_UAM();

				document.querySelector("#UAM_status_C").classList.add("show");
			}

			// Add all the event listeners.
		gc.funcs.addAllListeners();

		}, gc.funcs.shared.rejectedPromise);

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