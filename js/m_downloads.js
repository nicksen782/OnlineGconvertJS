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