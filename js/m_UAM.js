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
				uam_xmllist.options.length = 1;
				uam_xmllist.options[0].text = "Game not selected";
				uam_xmllist.options[0].value="";
			}
			else{
				// Hide options that do not match the selected game's gameid.
				let thecount=0;
				uam_xmllist.querySelectorAll("option").forEach(function(d,i,a){
					// First, remove the hidden class.
					d.classList.remove("hidden");

					// Now, decide if it will be shown or hidden.
					if(d.getAttribute("gameid") != gameid || d.value == ""){ d.classList.add("hidden"); }
					else                                                   { thecount +=1; }
				});

				// Update the first value (the blank one with the file count.)
				// console.log("uam_gameList_select: ", thecount, uam_xmllist.options, uam_xmllist.options.length);
				uam_xmllist.options[0].text = thecount + " XML files";
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
					let gameList_UAM = res.gameList_UAM;
					let gameList_UAM_hidden = [];
					let XMLlist_UAM  = res.XMLlist_UAM;
					let defaultGameId  = res.defaultGameId;
					let canLoadDefaultGameId  = false;
					
					// Disable entries in gameList_UAM that do not have any XML files. 
					gameList_UAM = gameList_UAM.filter(function(game){
						// Find match and return true. .
						if(XMLlist_UAM.find(xml=>xml.gameid == game.gameId)){ 
							// Is this gameid the default gameid? If so then set the canLoadDefaultGameId to true.
							if(game.gameId == defaultGameId){
								canLoadDefaultGameId = true; 
							}

							// Return true to include this game in the list.
							return true; 
						}

						// No match. Add to hidden and return false. 
						gameList_UAM_hidden.push(game);
						return false;
					});

					// console.log("gameList_UAM_hidden:", gameList_UAM_hidden);

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

					// console.log("XMLlist_UAM:", XMLlist_UAM);
					uam_xmllist.options[0].text = XMLlist_UAM.length + " XML files";
					uam_xmllist.options[0].value = "";

					// Show the available games. 
					gameList_UAM.map(function(d,i,a){
						option = document.createElement("option");
						option.setAttribute("gameid"        , d.gameId        );
						option.setAttribute("gamename"      , d.gameName      );
						option.setAttribute("author_user_id", d.author_user_id);
						option.value = d.gameId;
						option.text = d.gameName;
						frag.appendChild(option);
					});
					// show the unavailable games as disabled. 
					gameList_UAM_hidden.map(function(d,i,a){
						option = document.createElement("option");
						option.setAttribute("gameid"        , d.gameId        );
						option.setAttribute("gamename"      , d.gameName      );
						option.setAttribute("author_user_id", d.author_user_id);
						option.disabled = true; 
						option.value = d.gameId;
						option.text = `${d.gameName} (No XML)`;
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

					// Set the default game as the selected GAME option. 
					if(canLoadDefaultGameId){
						// console.log("Loading default game.");
						uam_gamelist.value = defaultGameId;
						uam_gamelist.dispatchEvent(new Event("change") );
					}
					// else{
						// console.log("Unable to load default game.");
					// }
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

		// * Saves the JSON data to the server.
		uam_saveJson   : function(){
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
				console.log("ERROR: No value specified for the JSON output file.");
				alert      ("ERROR: No value specified for the JSON output file.");
				return;
			}

			let jsonTextarea      = gc.vars.dom.output.jsonTextarea   ;
			if(! jsonTextarea.value.length){
				console.log("ERROR: JSON output is empty.");
				alert      ("ERROR: JSON output is empty.");
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
				"o"        : "uam_saveJSON" ,
				"userFile" : jsonTextarea.value ,
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
				"gameid"   : gameid   ,
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
		
		// UAM: saveJson_btn
		gc.vars.dom.output.saveJson_btn       .addEventListener('click', gc.funcs.UAM.output.uam_saveJson, false);

		// UAM: updateAssets_btn
		gc.vars.dom.output.updateAssets_btn   .addEventListener('click', gc.funcs.UAM.output.uam_updateAssets, false);


		// UAM: runC2BIN_btn
		gc.vars.dom.output.runC2BIN_btn       .addEventListener('click', gc.funcs.UAM.output.uam_runC2BIN, false);
	}

};