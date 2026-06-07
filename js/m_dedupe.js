gc.deduplicate = {
	prev: {
		deduplicateCanvasTiles: function(canvas, tileWidth, tileHeight, usedOrgIds=[]) {
			// Get the canvas and context
			let ctx = canvas.getContext("2d");
			// let ctx = canvas.getContext("2d", { willReadFrequently: true });
	
			// Create the tiles array using the orgTile coords and values. 
			let tiles = [];
			for (let y = 0; y < canvas.height; y += tileHeight) {
				for (let x = 0; x < canvas.width; x += tileWidth) {
					tiles.push({
						// DEBUG.
						// orgId : tiles.length,
						// x_tile: x/tileWidth,
						// y_tile: y/tileHeight,
						
						// Tile data.
						x: x,
						y: y,
						
						// These will be updated later.
						timesUsed : 0,
						tileData  : null,
						tileHash  : null,
						isUnique  : null,
						srcUnique : null,
						srcUnique2: null,
						ignore    : true,
					});
				}
			}
	
			// Now, populate the data based on the order of usedOrgIds.
			let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
			let uniqueTiles = [];
			let seenHashes = {};
			for(let i=0; i<usedOrgIds.length; i+=1){
				// Get the tileIndex that we will work on.
				let tileIndex = usedOrgIds[i];
	
				// Get the x and y coords for the tile. 
				let x = tiles[ tileIndex ]['x'];
				let y = tiles[ tileIndex ]['y'];
	
				// Get the data (Uint8ClampedArray) for this tile from the whole imageData data.
				tiles[ tileIndex ].tileData = this.getTileData(imageData, canvas, x, y, tileWidth, tileHeight);
	
				// Hash the data so that we can match this tile against duplicates of this tile. 
				tiles[ tileIndex ].tileHash = this.xxHash32_min(tiles[tileIndex].tileData);
	
				// Unset the ignore flag since this will be a used tile. 
				tiles[ tileIndex ].ignore   = false;
	
				// Have we seen this tile before?
	
				// Yes?
				if (seenHashes[ tiles[tileIndex].tileHash] ) {
					// Unset the isUnique flag. 
					tiles[tileIndex].isUnique = false;
					
					// Index of matching tileHash within the entire tiles. 
					tiles[tileIndex].srcUnique  = tiles      .findIndex((d)=>d.tileHash === tiles[tileIndex].tileHash);
					
					// Index of matching tileHash within the unique tiles. 
					tiles[tileIndex].srcUnique2 = uniqueTiles.findIndex((d)=>d.tileHash === tiles[tileIndex].tileHash);
				} 
				
				// No.
				else {
					// Update seenHashes so that we know that we have seen this tile before. 
					seenHashes[tiles[tileIndex].tileHash] = true;
					
					// Set the isUnique flag. 
					tiles[tileIndex].isUnique = true;
					
					// Index of matching tileHash within the entire tiles. 
					tiles[tileIndex].srcUnique = tileIndex;
					
					// Index of matching tileHash within the unique tiles. 
					tiles[tileIndex].srcUnique2 = uniqueTiles.length;
	
					// Add this tile to the unique tiles. 
					uniqueTiles.push(tiles[tileIndex]);
				}
			}
			
			// Return the completed data.
			return {
				tiles      : tiles,
				uniqueTiles: uniqueTiles,
				imageData  : imageData,
			};
		},
	
		getTileData: function(imageData, canvas, x, y, tileWidth, tileHeight) {
			let tileData = new Uint8ClampedArray(tileWidth * tileHeight * 4);
			for (let row = 0; row < tileHeight; row++) {
				let sourcePos = ((y + row) * canvas.width + x) * 4;
				let destPos = row * tileWidth * 4;
				for (let col = 0; col < tileWidth; col++) {
					tileData[destPos++] = imageData[sourcePos++];
					tileData[destPos++] = imageData[sourcePos++];
					tileData[destPos++] = imageData[sourcePos++];
					tileData[destPos++] = imageData[sourcePos++];
				}
			}
			return tileData;
		},
	
		// FUTURE USE.
		// updateTileData: function(imageData, canvas, x, y, tileWidth, tileHeight, tileData) {
		// 	for (let row = 0; row < tileHeight; row++) {
		// 		let sourcePos = row * tileWidth * 4;
		// 		let destPos = ((y + row) * canvas.width + x) * 4;
		// 		for (let col = 0; col < tileWidth; col++) {
		// 			imageData[destPos++] = tileData[sourcePos++];
		// 			imageData[destPos++] = tileData[sourcePos++];
		// 			imageData[destPos++] = tileData[sourcePos++];
		// 			imageData[destPos++] = tileData[sourcePos++];
		// 		}
		// 	}
		// },
	
		// FUTURE USE.
		// setPixel: function(x, y, color) {
		// 	let index = (y * width + x) * 4;
		// 	imageData.data[index] = color.r;
		// 	imageData.data[index + 1] = color.g;
		// 	imageData.data[index + 2] = color.b;
		// 	imageData.data[index + 3] = color.a;
		// },
	
		// src: imageData
		convertImageDataRgbIntensity: function(imageData, color = { r: 255, g: 0, b: 0 }, minIntensity = 64) {
			for (let i = 0; i < imageData.data.length; i += 4) {
				let r = imageData.data[i];
				let g = imageData.data[i + 1];
				let b = imageData.data[i + 2];
				
				// Calculate the grayscale value using the average method
				let grayscale = (r + g + b) / 3;
	
				// Set the color channels based on the input color, grayscale value, and minIntensity
				imageData.data[i]     = Math.max(Math.min(grayscale * color.r / 255, 255), minIntensity * color.r / 255);
				imageData.data[i + 1] = Math.max(Math.min(grayscale * color.g / 255, 255), minIntensity * color.g / 255);
				imageData.data[i + 2] = Math.max(Math.min(grayscale * color.b / 255, 255), minIntensity * color.b / 255);
			}
		},
	
		xxHash32_min: function(a){
			for(var t=function(a,t){return a<<t|a>>>32-t},u=a.length,h=u,i=0,r=2654435769,e=0;h>=4;)e=a[i]|a[i+1]<<8|a[i+2]<<16|a[i+3]<<24,e=t(e=Math.imul(e,2246822507),13),r=t(r^=e=Math.imul(e,3266489909),17),r=Math.imul(r,461845907),i+=4,h-=4;switch(e=0,h){case 3:e^=a[i+2]<<16;break;case 2:e^=a[i+1]<<8;break;case 1:e^=a[i],e=t(e=Math.imul(e,2246822507),13),r^=e=Math.imul(e,3266489909)}return r^=u,r^=r>>>16,r=Math.imul(r,2246822507),r^=r>>>13,r=Math.imul(r,3266489909),(r^=r>>>16)>>>0
		},
	
		// Get orgIds used by tilemaps.
		getOrgIdsUsedByTilemaps: function(canvas, tileWidth, tileHeight, map){
			let startX = map['@left'] ;
			let startY = map['@top']  ;
	
			var imgWidth  = canvas.width;
			var imgHeight = canvas.height;
			var cols      = imgWidth/tileWidth;
			var rows      = imgHeight/tileHeight;
	
			let newMap = [];
			for(var y=0; y<map["@height"]; y++){
				for(var x=0; x<map["@width"]; x++){
					// Determine the tile id.
					var tile_id = ((startY+y)*cols)+(startX+x);
	
					// Add the tile id to the src_tilesUsed.
					newMap.push(tile_id);
				}
			}
	
			return newMap;
		},
		
		// let results4 = gc.deduplicate.recreateTileMap(mapsSrc[i], [...usedTileIds.FLASHTILES]);
		recreateTileMap: function(map, tiles, uniqueTiles){
			// Start the new map with the dimensions.
			map['newTileMap'] = [map['width'], map['height']];
	
			// Map the original tile ids to their new tile ids.
			for(let i=0; i<map['oldTileMap'].length; i+=1){
				let newTileId = tiles[ map['oldTileMap'][i] ].srcUnique2;
				// tiles[ map['oldTileMap'][i] ].timesUsed += 1;
				uniqueTiles[newTileId].timesUsed += 1;
				map['newTileMap'].push(newTileId);
			}
	
			// Add the dimensions to the old map (needed?)
			map['oldTileMap'].unshift(map['height']);
			map['oldTileMap'].unshift(map['width']);
	
			// Done!
			// console.log("  COMPLETED:", map, ", OLD:", map['oldTileMap'], ", NEW:", map['newTileMap']);
		},

		run: function(){
			// let canvas     = document.getElementById("gc3_input_canvas");
			let canvas     = document.getElementById("gc3_mapedit_image");
			let tileWidth  = +gc.vars.settings.output.jsonObj["gfx-xform"].input["@tile-width"];
			let tileHeight = +gc.vars.settings.output.jsonObj["gfx-xform"].input["@tile-height"];
			let mapsSrc    = gc.vars.settings.output.jsonObj["gfx-xform"].output.maps.map;
	
			let usedTileIds = {
				"FLASHTILES": new Set(),
			};
			let oldMaps = [];
			for(let i=0; i<mapsSrc.length; i+=1){
				if(mapsSrc[i]["@mapOutputTo"]=="SKIPMAP"){ continue; }
				
				let ids = this.getOrgIdsUsedByTilemaps(canvas, tileWidth, tileHeight, mapsSrc[i]);
				oldMaps.push(
					{
						'var-name'    : mapsSrc[i]['@var-name'],
						'left'        : mapsSrc[i]['@left'],
						'top'         : mapsSrc[i]['@top'],
						'width'       : mapsSrc[i]['@width'],
						'height'      : mapsSrc[i]['@height'],
						'mapOutputTo' : mapsSrc[i]['@mapOutputTo'],
						// oldTileMap: [mapsSrc[i]['@width'], mapsSrc[i]['@height'], ...ids],
						oldTileMap: [...ids],
						newTileMap: [],
					}
				);
				for (const id of ids) { usedTileIds.FLASHTILES.add(id); }
			}
	
			let ts = performance.now();
			let results3 = gc.deduplicate.deduplicateCanvasTiles(canvas, tileWidth, tileHeight, [...usedTileIds.FLASHTILES]);
			let tsE = performance.now() - ts;
			console.log(`Time: '${tsE.toFixed(2)}' ms. Tiles used by maps: '${usedTileIds.FLASHTILES.size}'. Unique tiles found: '${results3.uniqueTiles.length}'. Total tiles in image: '${results3.tiles.length}'.`);
			
			let ts2 = performance.now();
			for(let i=0; i<oldMaps.length; i+=1){
				// Remap the tilemap.
				gc.deduplicate.recreateTileMap(oldMaps[i], results3.tiles, results3.uniqueTiles);
				console.log("  COMPLETED:", oldMaps[i]);
			}
			let ts2E = performance.now() - ts2;
			console.log(`Time: '${ts2E.toFixed(2)}' ms. '${oldMaps.length}' TileMaps have been regenerated.`);
	
			// Create the RGB332 version of each tile.
			let ts3 = performance.now();
			for(let i=0; i<results3.uniqueTiles.length; i+=1){
				results3.uniqueTiles[i].rgb332 = [];
				for(let k=0; k<results3.uniqueTiles[i].tileData.length; k+=4){
					let r = results3.uniqueTiles[i].tileData[k + 0];
					let g = results3.uniqueTiles[i].tileData[k + 1];
					let b = results3.uniqueTiles[i].tileData[k + 2];
					let index = (b & 0xc0) + ((g >> 2) & 0x38) + (r >> 5);
					// results3.uniqueTiles[i].rgb332.push(index.toString(16));
					results3.uniqueTiles[i].rgb332.push(index);
				}
			}
			let ts3E = performance.now() - ts3;
			console.log(`Time: '${ts3E.toFixed(2)}' ms. '${results3.uniqueTiles.length}' tiles converted to RGB332.`);
	
			console.log("deduplicateCanvasTiles: results3:", results3);
	
			// DEBUG: See the output.
			let arrs = [results3];
			let outputDiv = document.createElement("div");
			outputDiv.id = "debug_outputDiv1";
	
			if(document.getElementById("debug_outputDiv1")){
				document.getElementById("debug_outputDiv1").remove();
			}
	
			for(let r=0; r<arrs.length; r+=1){
				let div = document.createElement("div");
				// div.style.width = ((tileWidth*10)*4) + "px";
				div.style.width = ((tileWidth*10)*1) + "px";
				div.style['margin-bottom'] = "15px";
				div.style['font-size'] = "0px";
				for(let i=0; i<arrs[r].uniqueTiles.length; i+=1){
					let tile = arrs[r].uniqueTiles[i];
					
					const copiedArray = new Uint8ClampedArray(tile.tileData.length);
					copiedArray.set(tile.tileData);
		
					const imageData = new ImageData(copiedArray, tileWidth, tileHeight); 
		
					let canvas = document.createElement("canvas");
					canvas.title = `tile id: ${i}, tileHash: ${tile.tileHash}`;
					canvas.width  = tileWidth;
					canvas.height = tileHeight;
					canvas.getContext("2d").putImageData(imageData, 0, 0);
					
					div.append(canvas);
				}
				outputDiv.append(div);
			}
	
			let canvas2 = document.createElement("canvas");
			canvas2.width = document.getElementById("gcOutput_tilesetCanvas").width;
			canvas2.height = document.getElementById("gcOutput_tilesetCanvas").height;
			canvas2.style['margin-top'] = "15px";
			canvas2.style.display="block";
			outputDiv.append(canvas2);
			setTimeout(function(){
				canvas2.getContext("2d").drawImage( document.getElementById("gcOutput_tilesetCanvas"), 0, 0 );
			}, 250);
			
			// Draw the tileset images but with all non-unique tiles in gray-scale.
			{
				let canvas3 = document.createElement("canvas");
				canvas3.width  = canvas.width;
				canvas3.height = canvas.height;
				canvas3.style.width  = canvas.width * 2 + "px";
				canvas3.style.height = canvas.height * 2 + "px";
				// canvas3.style['margin-top'] = "15px";
				canvas3.style['border'] = "2px solid black";
				canvas3.style.display="block";
				let ctx = canvas3.getContext("2d");
				ctx.drawImage(canvas, 0, 0);
	
				for(let i=0; i<results3.tiles.length; i+=1){
					let tile = results3.tiles[i];
					
					// Redraw the tile in red-weighted-gray-scale.
					if(tile.ignore){
						// ctx.clearRect(tile.x, tile.y, tileWidth, tileHeight);
	
						let imageData = ctx.getImageData(tile.x, tile.y, tileWidth, tileHeight);
						this.convertImageDataRgbIntensity(imageData, {r:96,g:0,b:0});
						ctx.putImageData(imageData, tile.x, tile.y);
					}
					// Redraw the tile in cyan-weighted-gray-scale.
					else if(!tile.isUnique){
						// ctx.clearRect(tile.x, tile.y, tileWidth, tileHeight);
	
						const copiedArray = new Uint8ClampedArray(tile.tileData.length);
						copiedArray.set(tile.tileData);
						const imageData = new ImageData(copiedArray, tileWidth, tileHeight); 
						this.convertImageDataRgbIntensity(imageData, {r:0,g:96,b:96});
						ctx.putImageData(imageData, tile.x, tile.y);
					}
					// Do nothing.
					else if(tile.isUnique){
					}
				}
				outputDiv.append(canvas3);
				document.body.append(outputDiv);
			}
		},
	},
	
	data: {
		// Will change.
		usedOrgTileIds: new Set(), // All
		orgTiles: [],
		maps: [], // Used in the output text.
		uniqueTiles: [], // Used in the output text.

		// Constants.
		canvas    : null,
		ctx       : null,
		tileWidth : 8,
		tileHeight: 8,
		mapsSrc   : [],
		settings: {
			version:"",
			input:{
				"file":"",
				"tileHeight":"",
				"tileWidth":"",
				"type":"",
			},
			output:{
				"file1":"",
				"file2":"",
				tiles:{
					"varName"       : "",
					"tilesetOutputTo": "",
					"removeDupeTiles": "",
					"outputAsJson"   : "",
				},
			},
		},
	},

	generateUsedOrgTileIdsAndOrgMapData: function(){
		var cols      = this.data.canvas.width  / this.data.tileWidth;
		var rows      = this.data.canvas.height / this.data.tileHeight;
		for(let i=0; i<this.data.mapsSrc.length; i+=1){
			// Skip maps that are set to SKIPMAP.
			if(this.data.mapsSrc[i]["@mapOutputTo"]=="SKIPMAP"){ continue; }

			// Start the new map.
			let newMap = {
				// Base data.
				varName    : this.data.mapsSrc[i]['@var-name'],
				width      : this.data.mapsSrc[i]['@width'], 
				height     : this.data.mapsSrc[i]['@height'],
				left       : this.data.mapsSrc[i]['@left'],
				top        : this.data.mapsSrc[i]['@top'],
				mapOutputTo: this.data.mapsSrc[i]["@mapOutputTo"],
				// Modified here. 
				orgTilesMap: [ this.data.mapsSrc[i]['@width'], this.data.mapsSrc[i]['@height'] ],
				// Modified later.
				newTilesMap: [],
			};
			
			// Determine the orgTiles used by this map. Add to usedTileIds and orgTilesMap.
			let startX = this.data.mapsSrc[i]['@left'];
			let startY = this.data.mapsSrc[i]['@top'];
			for(var y=0; y<this.data.mapsSrc[i]['@height']; y++){
				for(var x=0; x<this.data.mapsSrc[i]['@width']; x++){
					// Determine the tile id.
					var tile_id = ( (startY + y) * cols ) + (startX + x);
	
					// Add the tile id to the src_tilesUsed.
					this.data.usedOrgTileIds.add(tile_id);
					
					// Add the tile to the orgTilesMap.
					newMap.orgTilesMap.push(tile_id);
				}
			}
			
			// Add the map to maps_pre.
			this.data.maps.push(newMap);
		}
	},
	generateOrgTilesAndDetermineDuplicateTiles:function(){
		// Hash.
		const xxHash32_min =  function(a){
			for(var t=function(a,t){return a<<t|a>>>32-t},u=a.length,h=u,i=0,r=2654435769,e=0;h>=4;)e=a[i]|a[i+1]<<8|a[i+2]<<16|a[i+3]<<24,e=t(e=Math.imul(e,2246822507),13),r=t(r^=e=Math.imul(e,3266489909),17),r=Math.imul(r,461845907),i+=4,h-=4;switch(e=0,h){case 3:e^=a[i+2]<<16;break;case 2:e^=a[i+1]<<8;break;case 1:e^=a[i],e=t(e=Math.imul(e,2246822507),13),r^=e=Math.imul(e,3266489909)}return r^=u,r^=r>>>16,r=Math.imul(r,2246822507),r^=r>>>13,r=Math.imul(r,3266489909),(r^=r>>>16)>>>0
		};
		// Get tile data from rgba array.
		const getTileData = function(imageData, canvas, x, y, tileWidth, tileHeight) {
			let tileData = new Uint8ClampedArray(tileWidth * tileHeight * 4);
			for (let row = 0; row < tileHeight; row++) {
				let sourcePos = ((y + row) * canvas.width + x) * 4;
				let destPos = row * tileWidth * 4;
				for (let col = 0; col < tileWidth; col++) {
					tileData[destPos++] = imageData[sourcePos++];
					tileData[destPos++] = imageData[sourcePos++];
					tileData[destPos++] = imageData[sourcePos++];
					tileData[destPos++] = imageData[sourcePos++];
				}
			}
			return tileData;
		};

		// Create the placeholders for all original tiles. 
		for (let y = 0; y < this.data.canvas.height; y += this.data.tileHeight) {
			for (let x = 0; x < this.data.canvas.width; x += this.data.tileWidth) {
				this.data.orgTiles.push({
					// DEBUG.
					// orgId : tiles.length,
					// x_tile: x/this.data.tileWidth,
					// y_tile: y/this.data.tileHeight,
					
					// Tile data.
					x: x,
					y: y,
					
					// These will be updated later.
					timesUsed : 0,
					tileData  : null,
					tileHash  : null,
					isUnique  : null,
					srcUnique : null,
					srcUnique2: null,
					ignore    : true,
				});
			}
		}

		// this.data.orgTiles

		// Now, populate the data based on the order of usedOrgIds.
		const imageData = this.data.ctx.getImageData(0, 0, this.data.canvas.width, this.data.canvas.height).data;
		// let seenHashes = {};
		// const seenHashes = new Map();
		const seenHashes = new Set();
		const usedOrgTileIds = [...this.data.usedOrgTileIds];
		for(let i=0; i<usedOrgTileIds.length; i+=1){
			// Get the tileIndex that we will work on.
			const tileIndex = usedOrgTileIds[i];

			// Get the x and y coords for the tile. 
			const x = this.data.orgTiles[ tileIndex ]['x'];
			const y = this.data.orgTiles[ tileIndex ]['y'];

			// Get the data (Uint8ClampedArray) for this tile from the whole imageData data.
			this.data.orgTiles[ tileIndex ].tileData = getTileData(imageData, this.data.canvas, x, y, this.data.tileWidth, this.data.tileHeight);

			// Hash the data so that we can match this tile against duplicates of this tile. 
			this.data.orgTiles[ tileIndex ].tileHash = xxHash32_min(this.data.orgTiles[tileIndex].tileData);

			// Unset the ignore flag since this will be a used tile. 
			this.data.orgTiles[ tileIndex ].ignore   = false;

			// Get the tileHash.
			const tileHash = this.data.orgTiles[tileIndex].tileHash;

			// Have we seen this tile before?

			// Yes?
			// if (seenHashes[ this.data.orgTiles[tileIndex].tileHash] ) {
			if (seenHashes.has(tileHash)) {
				// Unset the isUnique flag. 
				this.data.orgTiles[tileIndex].isUnique = false;
				
				// Index of matching tileHash within the entire tiles. 
				this.data.orgTiles[tileIndex].srcUnique  = this.data.orgTiles      .findIndex((d)=>d.tileHash === this.data.orgTiles[tileIndex].tileHash);
				
				// Index of matching tileHash within the unique tiles. 
				this.data.orgTiles[tileIndex].srcUnique2 = this.data.uniqueTiles.findIndex((d)=>d.tileHash === this.data.orgTiles[tileIndex].tileHash);
			} 
			
			// No.
			else {
				// Update seenHashes so that we know that we have seen this tile before. 
				// seenHashes[this.data.orgTiles[tileIndex].tileHash] = true;
				seenHashes.add(tileHash);
				
				// Set the isUnique flag. 
				this.data.orgTiles[tileIndex].isUnique = true;
				
				// Index of matching tileHash within the entire tiles. 
				this.data.orgTiles[tileIndex].srcUnique = tileIndex;
				
				// Index of matching tileHash within the unique tiles. 
				this.data.orgTiles[tileIndex].srcUnique2 = this.data.uniqueTiles.length;

				// Add this tile to the unique tiles. 
				this.data.uniqueTiles.push(this.data.orgTiles[tileIndex]);
			}
		}
	},
	generateRgb332ForUniques: function(){
		for(let i=0; i<this.data.uniqueTiles.length; i+=1){
			this.data.uniqueTiles[i].rgb332 = [];
			for(let k=0; k<this.data.uniqueTiles[i].tileData.length; k+=4){
				let r = this.data.uniqueTiles[i].tileData[k + 0];
				let g = this.data.uniqueTiles[i].tileData[k + 1];
				let b = this.data.uniqueTiles[i].tileData[k + 2];
				let index = (b & 0xc0) + ((g >> 2) & 0x38) + (r >> 5);
				// this.data.uniqueTiles[i].rgb332.push(index.toString(16));
				this.data.uniqueTiles[i].rgb332.push(index);
			}
		}
	},
	recreateTileMaps: function(map, tiles, uniqueTiles){
		for(let m=0; m<this.data.maps.length; m+=1){
			// Start the new map with the dimensions.
			this.data.maps[m]['newTilesMap'] = [
				this.data.maps[m]['width'], 
				this.data.maps[m]['height']
			];
	
			// Map the original tile ids to their new tile ids. (Skip the first two dimension values.)
			for(let i=2; i<this.data.maps[m]['orgTilesMap'].length; i+=1){
				let newTileId = this.data.orgTiles[ this.data.maps[m]['orgTilesMap'][i] ].srcUnique2;
				// this.data.orgTiles[ this.data.maps[m]['orgTilesMap'][i] ].timesUsed += 1;
				this.data.uniqueTiles[newTileId].timesUsed += 1;
				this.data.maps[m]['newTilesMap'].push(newTileId);
			}
		}
	},

	// DEBUG
	debugOutput: function(){
		let convertImageDataRgbIntensity = function(imageData, color = { r: 255, g: 0, b: 0 }, minIntensity = 64) {
			for (let i = 0; i < imageData.data.length; i += 4) {
				let r = imageData.data[i];
				let g = imageData.data[i + 1];
				let b = imageData.data[i + 2];
				
				// Calculate the grayscale value using the average method
				let grayscale = (r + g + b) / 3;
	
				// Set the color channels based on the input color, grayscale value, and minIntensity
				imageData.data[i]     = Math.max(Math.min(grayscale * color.r / 255, 255), minIntensity * color.r / 255);
				imageData.data[i + 1] = Math.max(Math.min(grayscale * color.g / 255, 255), minIntensity * color.g / 255);
				imageData.data[i + 2] = Math.max(Math.min(grayscale * color.b / 255, 255), minIntensity * color.b / 255);
			}
		};
		let convertRgbaDataRgbIntensity = function(data, color = { r: 255, g: 0, b: 0 }, minIntensity = 64) {
			for (let i = 0; i < data.length; i += 4) {
				let r = data[i];
				let g = data[i + 1];
				let b = data[i + 2];
				
				// Calculate the grayscale value using the average method
				let grayscale = (r + g + b) / 3;
	
				// Set the color channels based on the input color, grayscale value, and minIntensity
				data[i]     = Math.max(Math.min(grayscale * color.r / 255, 255), minIntensity * color.r / 255);
				data[i + 1] = Math.max(Math.min(grayscale * color.g / 255, 255), minIntensity * color.g / 255);
				data[i + 2] = Math.max(Math.min(grayscale * color.b / 255, 255), minIntensity * color.b / 255);
			}
		};

		// Everything will go into this container. 
		let outputDiv = document.getElementById("debug_outputDiv1");

		// If the output div is not found then create it. 
		if(!outputDiv){
			outputDiv = document.createElement("div");
			outputDiv.id = "debug_outputDiv1";
		}
		// If it was found then clear it.
		else{
			outputDiv.innerHTML = "";
		}
		
		// Create the unique tileset canvas by canvas.
		let div1 = document.createElement("div");
		div1.style['margin-bottom'] = "15px";
		div1.style['font-size'] = "0px";
		let gcOutput_tilesetCanvas = document.getElementById("gcOutput_tilesetCanvas");
		// div1.style.width = "190px";
		// div1.style.height = gcOutput_tilesetCanvas.height;
		for(let i=0; i<this.data.uniqueTiles.length; i+=1){
			let tile = this.data.uniqueTiles[i];
			const copiedArray = new Uint8ClampedArray(tile.tileData.length);
			copiedArray.set(tile.tileData);
			const imageData = new ImageData(copiedArray, this.data.tileWidth, this.data.tileHeight); 
			let canvas = document.createElement("canvas");
			canvas.title = `tile id: ${i}, tileHash: ${tile.tileHash}`;
			canvas.width  = this.data.tileWidth;
			canvas.height = this.data.tileHeight;
			// canvas.style.width  = (this.data.tileWidth*3) + "px";
			// canvas.style.height = (this.data.tileHeight*3) + "px";
			canvas.getContext("2d").putImageData(imageData, 0, 0);
			div1.append(canvas);
		}
		outputDiv.append(div1);

		// Copy the old version unique tileset image as one canvas.
		let canvas2 = document.createElement("canvas");
		canvas2.width = document.getElementById("gcOutput_tilesetCanvas").width;
		canvas2.height = document.getElementById("gcOutput_tilesetCanvas").height;
		canvas2.style['margin-top'] = "15px";
		canvas2.style.display="block";
		// canvas2.style.width  = (canvas2.width *3) + "px";
		// canvas2.style.height = (canvas2.height*3) + "px";
		outputDiv.append(canvas2);
		setTimeout(function(){
			canvas2.getContext("2d").drawImage( document.getElementById("gcOutput_tilesetCanvas"), 0, 0 );
		}, 250);

		// Draw the source image but with darkening for unused and duplicated tiles. 

		{
			let canvas3 = document.createElement("canvas");
			canvas3.width  = this.data.canvas.width;
			canvas3.height = this.data.canvas.height;
			canvas3.style.width  = this.data.canvas.width * 2 + "px";
			canvas3.style.height = this.data.canvas.height * 2 + "px";
			canvas3.style['border'] = "2px solid black";
			canvas3.style.display="block";
			let ctx = canvas3.getContext("2d");
			ctx.drawImage(this.data.canvas, 0, 0);

			for(let i=0; i<this.data.orgTiles.length; i+=1){
				let tile = this.data.orgTiles[i];
				
				// Redraw the tile in red-weighted-gray-scale.
				if(tile.ignore){
					// ctx.clearRect(tile.x, tile.y, tileWidth, tileHeight);

					let imageData = this.data.ctx.getImageData(tile.x, tile.y, this.data.tileWidth, this.data.tileHeight);
					convertImageDataRgbIntensity(imageData, {r:96,g:0,b:0});
					ctx.putImageData(imageData, tile.x, tile.y);
				}
				// Redraw the tile in cyan-weighted-gray-scale.
				else if(!tile.isUnique){
					// ctx.clearRect(tile.x, tile.y, tileWidth, tileHeight);

					const copiedArray = new Uint8ClampedArray(tile.tileData.length);
					copiedArray.set(tile.tileData);
					convertRgbaDataRgbIntensity(copiedArray, {r:0,g:96,b:96});
					const imageData = new ImageData(copiedArray, this.data.tileWidth, this.data.tileHeight); 
					// convertImageDataRgbIntensity(imageData, {r:0,g:96,b:96});
					ctx.putImageData(imageData, tile.x, tile.y);
				}
				// Do nothing.
				else if(tile.isUnique){
				}
			}
			outputDiv.append(canvas3);
			document.body.append(outputDiv);
		}

		// Append to the document body.
		document.body.append(outputDiv);
	},

	run: function(){
		// Populate data constants.
		this.data.canvas     = document.getElementById("gc3_mapedit_image"); 
		this.data.ctx        = this.data.canvas.getContext("2d")
		this.data.tileWidth  = +gc.vars.settings.output.jsonObj["gfx-xform"].input["@tile-width"]; 
		this.data.tileHeight = +gc.vars.settings.output.jsonObj["gfx-xform"].input["@tile-height"]; 
		this.data.mapsSrc    = gc.vars.settings.output.jsonObj["gfx-xform"].output.maps.map; 

		try{
		this.data.settings['version']                       = gc.vars.settings.output.jsonObj["gfx-xform"]['@version'];
		this.data.settings.input['file']                    = gc.vars.settings.output.jsonObj["gfx-xform"].input['@file'];
		this.data.settings.input['tileHeight']              = gc.vars.settings.output.jsonObj["gfx-xform"].input['@tile-height'];
		this.data.settings.input['tileWidth']               = gc.vars.settings.output.jsonObj["gfx-xform"].input['@tile-width'];
		this.data.settings.input['type']                    = gc.vars.settings.output.jsonObj["gfx-xform"].input['@type'];
		this.data.settings.output['file']                   = gc.vars.settings.output.jsonObj["gfx-xform"].output['@file'];
		this.data.settings.output['file2']                  = gc.vars.settings.output.jsonObj["gfx-xform"].output['@file2'];
		this.data.settings.output.tiles['varName']          = gc.vars.settings.output.jsonObj["gfx-xform"].output.tiles['@var-name'];
		this.data.settings.output.tiles['tilesetOutputTo']  = gc.vars.settings.output.jsonObj["gfx-xform"].output.tiles['@tilesetOutputTo'];
		this.data.settings.output.tiles['removeDupeTiles']  = gc.vars.settings.output.jsonObj["gfx-xform"].output.tiles['@removeDupeTiles'];
		this.data.settings.output.tiles['outputAsJson']     = gc.vars.settings.output.jsonObj["gfx-xform"].output.tiles['@outputAsJson'];
		}
		catch(e){
			console.log(e, gc.vars.settings.output.jsonObj["gfx-xform"]);
		}

		// Clear some data.
		this.data.usedOrgTileIds = new Set();

		// Generate the list of original tile ids used by tilemaps.
		let ts1 = performance.now();
		this.generateUsedOrgTileIdsAndOrgMapData();
		let ts1E = performance.now() - ts1;
		
		// Using the used tiles get data for all orgTiles.
		let ts2 = performance.now();
		this.generateOrgTilesAndDetermineDuplicateTiles();
		let ts2E = performance.now() - ts2;
		
		// Create the RGB332 version for each unique tile. 
		let ts3 = performance.now();
		this.generateRgb332ForUniques();
		let ts3E = performance.now() - ts3;
		
		// Create the remapped tilemaps based on the unique tile ids. 
		let ts4 = performance.now();
		this.recreateTileMaps();
		let ts4E = performance.now() - ts4;

		// Debug output.
		let ts5 = performance.now();
		this.debugOutput();
		let ts5E = performance.now() - ts5;

		console.log(`generateUsedOrgTileIdsAndOrgMapData        : TIME : ${ts1E.toFixed(2)} ms (TOTAL: ${(ts1E).toFixed(2)}) ms`);
		console.log(`generateOrgTilesAndDetermineDuplicateTiles : TIME : ${ts2E.toFixed(2)} ms (TOTAL: ${(ts1E+ts2E).toFixed(2)}) ms`);
		console.log(`generateRgb332ForUniques                   : TIME : ${ts3E.toFixed(2)} ms (TOTAL: ${(ts1E+ts2E+ts3E).toFixed(2)}) ms`);
		console.log(`recreateTileMaps                           : TIME : ${ts4E.toFixed(2)} ms (TOTAL: ${(ts1E+ts2E+ts3E+ts4E).toFixed(2)}) ms`);
		console.log(`debugOutput                                : TIME : ${ts5E.toFixed(2)} ms (TOTAL: ${(ts1E+ts2E+ts3E+ts4E+ts5E).toFixed(2)}) ms`);
		console.log(`TOTAL TIME: ${(ts1E+ts2E+ts3E+ts4E+ts5E).toFixed(2)}`, this.data);
	},

};
