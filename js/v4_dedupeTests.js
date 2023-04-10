var app = {
    dedupe: {
        // The data object that will be used throughout the dedupe process.
        data: {
            // Will change.
            usedOrgTileIds: null, // All
            orgTiles      : []  ,
            maps          : []  , // Used in the output text.
            uniqueTiles   : []  , // Used in the output text.
            finalJson     : ""  ,
    
            // Constants.
            canvas    : null,
            ctx       : null,
            entireImageData: null,
            entireImageData_uint8Clamped: null,
            tileWidth : 8,
            tileHeight: 8,
            mapsSrc   : [],
            settings: {
                version:"",
                input:{
                    "xmlFile":"",
                    "file":"",
                    "tileHeight":"",
                    "tileWidth":"",
                    "type":"",
                },
                output:{
                    "file":"",
                    "file2":"",
                    tiles:{
                        "varName"       : "",
                        "tilesetOutputTo": "",
                        "removeDupeTiles": "",
                        "outputAsJson"   : "",
                    },
                    maps:{
                        "pointersSize":""
                    }
                },
            },
        },
    
        // Get tile data from rgba array (Uint8ClampedArray).
        getTileData : function(data, canvas, x, y, tileWidth, tileHeight) {
            // Create the empty array with the correct size.
            let tileData = new Uint8ClampedArray(tileWidth * tileHeight * 4);

            // Populate the array.
            for (let row = 0; row < tileHeight; row++) {
                // Get source and destination start points. 
                let sourcePos = ((y + row) * canvas.width + x) * 4;
                let destPos = row * tileWidth * 4;

                // Copy the data from the source to the destination.
                for (let col = 0; col < tileWidth; col++) {
                    tileData[destPos++] = data[sourcePos++];
                    tileData[destPos++] = data[sourcePos++];
                    tileData[destPos++] = data[sourcePos++];
                    tileData[destPos++] = data[sourcePos++];
                }
            }

            // Return the array.
            return tileData;
        },

        // Determines which tiles of the source image are actually in use by tile maps. 
        generateUsedOrgTileIdsAndOrgMapData: function(){
            var cols      = this.data.canvas.width  / this.data.tileWidth;
            var rows      = this.data.canvas.height / this.data.tileHeight;
            for(let i=0; i<this.data.mapsSrc.length; i+=1){
                // Start the new map.
                let newMap = {
                    // Base data.
                    varName    : this.data.mapsSrc[i]['_var-name'],
                    width      : +this.data.mapsSrc[i]['_width'], 
                    height     : +this.data.mapsSrc[i]['_height'],
                    left       : +this.data.mapsSrc[i]['_left'],
                    top        : +this.data.mapsSrc[i]['_top'],
                    mapOutputTo: this.data.mapsSrc[i]["_mapOutputTo"],
                    // Modified here. 
                    orgTilesMap: [ +this.data.mapsSrc[i]['_width'], +this.data.mapsSrc[i]['_height'] ],
                    // Modified later.
                    newTilesMap: [],
                };

                // Set outputTo to PROGMEM if it is undefined or not in the list of acceptable values.
                if(newMap["_mapOutputTo"]==undefined || ["SKIPMAP", "PROGMEM", "NOWHERE", "C2BIN"].indexOf(newMap["_mapOutputTo"]) == -1){
                    newMap["_mapOutputTo"] = "PROGMEM";
                }

                // Skip maps that are set to SKIPMAP.
                if(this.data.mapsSrc[i]["_mapOutputTo"]=="SKIPMAP"){ continue; }
                
                // Determine the orgTiles used by this map. Add to usedTileIds and orgTilesMap.
                let startX = newMap.left;
                let startY = newMap.top;
                for(var y=0; y<newMap.height; y++){
                    for(var x=0; x<newMap.width; x++){
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

        // Using the actually used tiles this will generate the entire tileset and determine which tiles are duplicates and repoint each to the original tile. 
        generateOrgTilesAndDetermineDuplicateTiles:function(){
            // xxHash (Minified): Based on: https://github.com/Cyan4973/xxHash
            const xxHash32_min =  function(a){
                for(var t=function(a,t){return a<<t|a>>>32-t},u=a.length,h=u,i=0,r=2654435769,e=0;h>=4;)e=a[i]|a[i+1]<<8|a[i+2]<<16|a[i+3]<<24,e=t(e=Math.imul(e,2246822507),13),r=t(r^=e=Math.imul(e,3266489909),17),r=Math.imul(r,461845907),i+=4,h-=4;switch(e=0,h){case 3:e^=a[i+2]<<16;break;case 2:e^=a[i+1]<<8;break;case 1:e^=a[i],e=t(e=Math.imul(e,2246822507),13),r^=e=Math.imul(e,3266489909)}return r^=u,r^=r>>>16,r=Math.imul(r,2246822507),r^=r>>>13,r=Math.imul(r,3266489909),(r^=r>>>16)>>>0
            };
    
            // Create the placeholders for all original source tiles. 
            let ts1 = performance.now();
            
            // Pre-allocate the space for the orgTiles array.
            const tileCount = (this.data.canvas.height / this.data.tileHeight) * (this.data.canvas.width / this.data.tileWidth);
            this.data.orgTiles = new Array(tileCount);

            // Populate the values for the orgTiles array.
            let tileId = 0;
            for (let y = 0; y < this.data.canvas.height; y += this.data.tileHeight) {
                for (let x = 0; x < this.data.canvas.width; x += this.data.tileWidth) {
                    this.data.orgTiles[tileId] = {
                        // DEBUG.
                        tileId_org: tileId,
                        // x_tile: x / this.data.tileWidth,
                        // y_tile: y / this.data.tileHeight,
            
                        // Tile data. (required)
                        x: x,
                        y: y,
            
                        // These may be updated later.
                        timesUsed : 0,
                        rgb332    : null,
                        tileData  : null,
                        isUnique  : null,
                        tileId_new: null,
                        ignore    : true,
                    };
                    tileId++;
                }
            }
            let ts1E = performance.now() - ts1;
            
            // Get all the imageData at once.
            let imageDataTyped = this.data.entireImageData_uint8Clamped;

            // Now, populate the data based on the order of usedOrgIds.
            let ts2 = performance.now();
            const seenHashes     = new Set();
            const tileIdMap      = new Map();
            const usedOrgTileIds = [...this.data.usedOrgTileIds];
            const uniqueTiles    = this.data.uniqueTiles;
            for (let i = 0; i < usedOrgTileIds.length; i += 1) {
                // Get the tileIndex that we will work on.
                const tileIndex = usedOrgTileIds[i];

                // Cache the orgTile object for faster access
                const orgTile = this.data.orgTiles[tileIndex];

                // Get the x and y coords for the tile.
                const x = orgTile['x'];
                const y = orgTile['y'];

                // Get the data (Uint8ClampedArray) for this tile from the whole imageDataTyped data.
                orgTile.tileData = this.getTileData(imageDataTyped, this.data.canvas, x, y, this.data.tileWidth, this.data.tileHeight);

                // Hash the data so that we can match this tile against duplicates of this tile.
                const tileHash = xxHash32_min(orgTile.tileData);

                // Unset the ignore flag since this will be a used tile.
                orgTile.ignore = false;

                // Have we seen this tile before?

                // Yes? This is a duplicate tile.
                if (seenHashes.has(tileHash)) {
                    // Unset the isUnique flag.
                    orgTile.isUnique = false;

                    // Index of matching tileHash within the unique tiles.
                    orgTile.tileId_new = tileIdMap.get(tileHash);

                    // Remove the tileData.
                    orgTile.tileData = null;
                }

                // No. This is the first time this tile has been seen.
                else {
                    // Update seenHashes so that we know that we have seen this tile before.
                    seenHashes.add(tileHash);

                    // Set the isUnique flag.
                    orgTile.isUnique = true;

                    // Index of matching tileHash within the unique tiles.
                    orgTile.tileId_new = uniqueTiles.length;

                    // Add this tile to the unique tiles.
                    uniqueTiles.push(orgTile);

                    // Update the tileIdMap with the new unique tile's hash and index
                    tileIdMap.set(tileHash, orgTile.tileId_new);
                }
            }
            let ts2E = performance.now() - ts2;

            return {
                ts1E:ts1E,
                ts2E:ts2E,
            };
        },

        // Generates RGB332 data from the tileData of each unique tile. 
        generateRgb332ForUniques: function(){
            for(let i=0; i<this.data.uniqueTiles.length; i+=1){
                this.data.uniqueTiles[i].rgb332 = [];
                for(let k=0; k<this.data.uniqueTiles[i].tileData.length; k+=4){
                    let r = this.data.uniqueTiles[i].tileData[k + 0];
                    let g = this.data.uniqueTiles[i].tileData[k + 1];
                    let b = this.data.uniqueTiles[i].tileData[k + 2];
                    let rgb332 = (b & 0xc0) + ((g >> 2) & 0x38) + (r >> 5);
                    // this.data.uniqueTiles[i].rgb332.push(rgb332.toString(16));
                    this.data.uniqueTiles[i].rgb332.push(rgb332);
                }
            }
        },

        // Creates the tilemaps using the deduplicated tileset tile ids.
        recreateTileMaps: function(){
            // For each tilemap...
            let orgTiles = this.data.orgTiles;
            let uniqueTiles = this.data.uniqueTiles;
            for(let m=0; m<this.data.maps.length; m+=1){
                let map = this.data.maps[m];

                // Start the new map with the dimensions.
                map['newTilesMap'] = [
                    map['width'], 
                    map['height']
                ];
        
                // Map the original tile ids to their new tile ids. (Skip the first two dimension values.)
                for(let i=2; i<map['orgTilesMap'].length; i+=1){
                    let prevIndex = map['orgTilesMap'][i]; 
                    let newTileId = orgTiles[ prevIndex ].tileId_new;
                    uniqueTiles[newTileId].timesUsed += 1;
                    map['newTilesMap'].push(newTileId);
                }
            }
        },
    
        // Draw to the output canvases to show unused/duped tiles and the unique tileset.
        drawOutputCanvases: function(){
            // Draw the source image and mark unused and duped tiles. 
            let ts1 = performance.now();
            {
                let convertRgbIntensity = function (data, color = { r: 255, g: 0, b: 0 }, minIntensity = 64) {
                    for (let i = 0; i < data.length; i += 4) {
                        let r = data[i];
                        let g = data[i + 1];
                        let b = data[i + 2];
                
                        // Calculate the grayscale value using the average method
                        let grayscale = (r + g + b) / 3;
                
                        // Set the color channels based on the input color, grayscale value, and minIntensity
                        data[i + 0] = Math.max(Math.min(grayscale * color.r / 255, 255), minIntensity * color.r / 255);
                        data[i + 1] = Math.max(Math.min(grayscale * color.g / 255, 255), minIntensity * color.g / 255);
                        data[i + 2] = Math.max(Math.min(grayscale * color.b / 255, 255), minIntensity * color.b / 255);
                    }
                }

                // Constants.
                const ignoreColor = { r: 96, g: 0, b: 0 };
                const duplicateColor = { r: 0, g: 96, b: 96 };
                const imageDataTyped = this.data.entireImageData_uint8Clamped;

                // Get the drawing context and set the dimensions for the used/duped canvas.
                let canvas1 = app.DOM['imageOutput1'];
                let ctx1 = canvas1.getContext('2d', { alpha: false, willReadFrequently: true });
                canvas1.width = app.DOM['imageInput2'].width;
                canvas1.height = app.DOM['imageInput2'].height;
                
                // Create a temp canvas copied from above (not connected to the DOM.)
                let tmp_canvas1 = document.createElement("canvas");
                let tmp_ctx1 = tmp_canvas1.getContext('2d', { alpha: false, willReadFrequently: true });
                tmp_canvas1.width  = canvas1.width;
                tmp_canvas1.height = canvas1.height;
                tmp_ctx1.drawImage(canvas1, 0, 0);

                // Go through each tile...
                for(let i=0; i<this.data.orgTiles.length; i+=1){
                    // Get this tile. 
                    let tile = this.data.orgTiles[i];
                    let color;

                    // If ignored or not unique then it must be redrawn with different coloration.
                    if(tile.ignore || !tile.isUnique){
                        // tmp_ctx1.clearRect(tile.x, tile.y, this.data.tileWidth, this.data.tileHeight);
                        // Get a copy of this tile's data. 
                        const copiedArray = this.getTileData(imageDataTyped, this.data.canvas, tile.x, tile.y, this.data.tileWidth, this.data.tileHeight);
                        
                        // Set the coloring value.
                        if     (tile.ignore)   { color = ignoreColor; }
                        else if(!tile.isUnique){ color = duplicateColor; }
                        
                        // Adjust the color for the tile.
                        convertRgbIntensity(copiedArray, color, 64);

                        // Create imageData for the color-adjusted tile. 
                        const imageData = new ImageData(copiedArray, this.data.tileWidth, this.data.tileHeight); 

                        // Draw the tile to the canvas.
                        tmp_ctx1.putImageData(imageData, tile.x, tile.y);
                    }
                    // else{
                    //     const copiedArray = this.getTileData(imageDataTyped, this.data.canvas, tile.x, tile.y, this.data.tileWidth, this.data.tileHeight);
                    //     const imageData = new ImageData(copiedArray, this.data.tileWidth, this.data.tileHeight); 
                    //     tmp_ctx1.putImageData(imageData, tile.x, tile.y);
                    // }
                }

                // Draw from the temp canvas to the destination canvas. 
                window.requestAnimationFrame(()=>{ ctx1.drawImage(tmp_canvas1, 0, 0); });
            }
            let ts1E = performance.now() - ts1;
            
            // Draw the unique tiles to a canvas.
            let ts2 = performance.now();
            {
                // Get the drawing context and set the dimensions for the tileset canvas.
                let canvas2 = app.DOM['imageOutput2'];
                let ctx2 = canvas2.getContext('2d', { alpha: false, willReadFrequently: true });
                
                // Determine how big the canvas should be based on the number of unique tiles. 
                let numUniques = this.data.uniqueTiles.length; 
                const numCols = Math.ceil(Math.sqrt(numUniques));
                const numRows = Math.ceil(numUniques / numCols);
                canvas2.width = this.data.tileWidth * numCols;
                canvas2.height = this.data.tileHeight * numRows;
                
                // Create a temp canvas copied from above (not connected to the DOM.)
                let tmp_canvas2 = document.createElement("canvas");
                let tmp_ctx2 = tmp_canvas2.getContext('2d', { alpha: false, willReadFrequently: true });
                tmp_canvas2.width = canvas2.width;
                tmp_canvas2.height = canvas2.height;

                // Go through each unique tile...
                let tileIndex = 0;
                for(let y=0; y<numRows; y+=1){
                    for(let x=0; x<numCols; x+=1){
                        // Stop if the tileIndex becomes larger than our number of unique tiles.
                        if(tileIndex >= numUniques){ break; }

                        // Get this tile. 
                        let tile = this.data.uniqueTiles[tileIndex];
                        
                        // Get a copy of this tile's data. 
                        const copiedArray = new Uint8ClampedArray(tile.tileData.length);
                        copiedArray.set(tile.tileData);

                        // Create imageData for the color-adjusted tile. 
                        const imageData = new ImageData(copiedArray, this.data.tileWidth, this.data.tileHeight); 

                        // Draw the tile to the canvas.
                        tmp_ctx2.putImageData(imageData, x*this.data.tileWidth, y*this.data.tileHeight);

                        // Increment the tileIndex.
                        tileIndex +=1 ;
                    }

                    // Stop if the tileIndex becomes larger than our number of unique tiles.
                    if(tileIndex >= numUniques){ break; }
                }

                // Draw from the temp canvas to the destination canvas. 
                window.requestAnimationFrame(()=>{ ctx2.drawImage(tmp_canvas2, 0, 0); });
            }
            let ts2E = performance.now() - ts2;

            return {
                ts1E:ts1E,
                ts2E:ts2E,
            };
        },

        // Generate and display the text output (PROGMEM/C2BIN C arrays.)
        generateTextOutput: function(){
            let createHeaderText  = ()=>{
                let generatedDate = new Date().toLocaleString('en-us', {
                    weekday:'long',
                    year: 'numeric', month:  'short'  , day:    'numeric',
                    hour: 'numeric', minute: 'numeric', second: 'numeric',
                    hour12: true,
                    timeZoneName: 'long'
                });

                let lines = [];
                lines.push(`// ********************************************************************************`);
                lines.push(`// [Generated by UAM V6: GCONVERT V4]`);
                lines.push(`// DATE: ${generatedDate}`);
                lines.push(`// INPUT XML FILE  : ${this.data.settings.input.xmlFile}`);
                lines.push(`// INPUT IMAGE FILE: ${this.data.settings.input.file}`);
                lines.push(`// OUTPUT FILE     : ${this.data.settings.output.file}`);
                lines.push(`// OUTPUT FILE2    : ${this.data.settings.output.file2}`);
                lines.push(`// ********************************************************************************`);
                return [...lines].join("\n");
            };
            let createTilesetText = (outputType)=>{ 
                let lines = [];

                lines.push(``);
                lines.push(``);

                let linesTILESET = [];
                let tilesetName     = this.data.settings.output.tiles['varName'];
                let pointersSize    = this.data.settings.output.maps['pointersSize'];
                let tilesetOutputTo = this.data.settings.output.tiles['tilesetOutputTo'];

                // Skip tilesets that do not match the specified mapOutputTo.
                if(tilesetOutputTo != outputType){ return ``; }                
                
                // Header.
                let headerString1 = `------- TEXT TILESET: STORED AS: ${tilesetOutputTo} -------`;
                linesTILESET.push(`// ${"-".repeat(headerString1.length)}`);
                linesTILESET.push(`// ${headerString1}`);
                linesTILESET.push(`// ${"-".repeat(headerString1.length)}`);
                linesTILESET.push(``);
                
                // The #define line. 
                linesTILESET.push(`#define ${tilesetName.toUpperCase()}_SIZE ${this.data.uniqueTiles.length}`);
                
                // The start of the array.
                let varType;
                if( pointersSize == 16 || tilesetOutputTo=='C2BIN'){ varType = "const int"; }
                else                    { varType = "const char"; }
                linesTILESET.push(`${varType} ${tilesetName}[] ${(tilesetOutputTo=='PROGMEM' ? 'PROGMEM ' : '')+"= {"+ ""}`);
                
                // The contents of the tileset array.
                for(let t=0; t<this.data.uniqueTiles.length; t+=1){
                    let tile = this.data.uniqueTiles[t];
                    let tileText = ``;

                    // This tile line: tile id and usage count.
                    let tileIdText = `[TILE #${t.toString().padEnd(4, " ")}, `;
                    let usageText = " USECOUNT: " + (tile.timesUsed).toString().padEnd(5, " ") + "]";
                    tileText += `/* ${tileIdText}${usageText} */ `;

                    // The pixel values for this tile line.
                    for(let i=0; i<tile.rgb332.length; i+=1){
                        let pixelValue = tile.rgb332[i].toString(16).toUpperCase().padStart(2, "0");
                        tileText += `0x${pixelValue}`;
                        if(t<this.data.uniqueTiles.length-1 || i<tile.rgb332.length-1){ tileText += ", "; }
                    }

                    // Add the completed line. (Width a left-indent.)
                    linesTILESET.push(`  ${tileText}`);
                }

                linesTILESET.push(`};`);
                lines.push(...linesTILESET);

                return [...lines].join("\n");
            };
            let createMapsetText  = (outputType)=>{
                let lines = [];
                
                lines.push(``);
                lines.push(``);

                // Header.
                let headerString1 = `------- TEXT MAPSET: STORED AS: ${outputType} -------`;
                lines.push(`// ${"-".repeat(headerString1.length)}`);
                lines.push(`// ${headerString1}`);
                lines.push(`// ${"-".repeat(headerString1.length)}`);
                lines.push(``);

                let pointersSize = this.data.settings.output.maps['pointersSize'];
                let varType;
                if( pointersSize == 16 ){ varType = "const int "; }
                else                    { varType = "const char "; }

                let countOneTimeTileUsages = (map)=>{
                    let numTilesOnlyEverUsedOnce = 0;
                    for(let index=2; index<map.newTilesMap.length; index+=1){
                        const tileId = map.newTilesMap[index];
                        if(this.data.uniqueTiles[tileId].timesUsed == 1){
                            numTilesOnlyEverUsedOnce += 1;
                        }
                    }
                    return numTilesOnlyEverUsedOnce;
                };

                let createTilemapText = (map, progmem, pointersSize)=>{
                    let mapText = ``;
                    let varName = map.varName;
                    mapText += `${varType} ${varName}[] ${progmem ? "PROGMEM " : ""}= {\n`;
                    mapText += `#define ${varName.toUpperCase()}_SIZE ${map.newTilesMap.length}\n` ;

                    let oneTimeTileUsages = countOneTimeTileUsages(map);
                    mapText += `  // One-time-used tiles: `;
                    if(oneTimeTileUsages){ mapText += `${oneTimeTileUsages}\n`; }
                    else{ mapText += `NONE.\n`; }
                    mapText += `  // ${map.newTilesMap.length-2} tiles, ${map.newTilesMap.length} indexes total.\n`;
                    mapText += `  ${map.width.toString().padEnd(4, " ")}, ${map.height.toString().padEnd(4, " ")},\n`;

                    mapText += `  `;
                    for(let index=2; index<map.newTilesMap.length; index+=1){
                        let newValue = `${map.newTilesMap[index]}`;
                        newValue = newValue.toString().padEnd(4, " ");
                        if(index<map.newTilesMap.length-1){ newValue += ", "; }
                        if(index % map.width-1 == 0 && index != 2 && index != map.newTilesMap.length-1) { newValue += `\n  `; }
                        mapText += newValue;
                    }

                    mapText += `\n};\n\n`;

                    return mapText;
                };

                let outputTypeMatchedMaps = 0;
                for(let m=0; m<this.data.maps.length; m+=1){
                    let map = this.data.maps[m];

                    // A gfx-xform version 1 map will NOT have mapOutputTo. Set it to PROGMEM.
                    if(map.mapOutputTo == undefined){ map.mapOutputTo="PROGMEM"; }

                    // Skip maps that do not match the specified mapOutputTo.
                    if(map.mapOutputTo != outputType){ continue; }

                    // Generate the map text.
                    if     ( map.mapOutputTo == "PROGMEM" ){ outputTypeMatchedMaps+=1; progmem=true ; lines.push( createTilemapText(map, true , pointersSize ) ); }
                    else if( map.mapOutputTo == "C2BIN"   ){ outputTypeMatchedMaps+=1; progmem=false; lines.push( createTilemapText(map, false, pointersSize ) ); }
                    else if( map.mapOutputTo == "SKIPMAP" ){ outputTypeMatchedMaps+=1; progmem=true ; lines.push( createTilemapText(map, true , pointersSize ) ); }
                    else if( map.mapOutputTo == "NOWHERE" ){ outputTypeMatchedMaps+=1; progmem=true ; lines.push( createTilemapText(map, true , pointersSize ) ); }
                }

                if(outputTypeMatchedMaps){
                    return [...lines].join("\n");
                }
                else{
                    return ``;
                }
            };
            let getMapNames       = (outputType)=>{
                let mapNames = [];
                
                // this.data.maps does not include "SKIPMAP" or "NOWHERE". Get them from mapsSrc.
                if(outputType == "SKIPMAP" || outputType == "NOWHERE"){
                    for(let m=0; m<this.data.mapsSrc.length; m+=1){
                        let map = this.data.mapsSrc[m];
                        
                        // A gfx-xform version 1 map will NOT have mapOutputTo. Set it to PROGMEM.
                        if(map._mapOutputTo == undefined){ map._mapOutputTo="PROGMEM"; }
                        
                        if(map._mapOutputTo == outputType){
                            mapNames.push(map['_var-name']);
                        }
                    }

                    return mapNames; 
                }

                for(let m=0; m<this.data.maps.length; m+=1){
                    let map = this.data.maps[m];

                    // A gfx-xform version 1 map will NOT have mapOutputTo. Set it to PROGMEM.
                    if(map.mapOutputTo == undefined){ map.mapOutputTo="PROGMEM"; }
                    
                    if(map.mapOutputTo == outputType){
                        mapNames.push(map.varName);
                    }
                }
                return mapNames; 
            };
            let appendMapNames    = (mapType, mapNames)=> {
                if (mapNames.length) {
                    return `\n/*\nMap names: ${mapType}:\n${mapNames.map(d => "  " + d).join("\n")} \n*/\n`;
                }

                return "";
            };

            const headerText          = createHeaderText();
            const tilesetText_PROGMEM = createTilesetText("PROGMEM");
            const tilesetText_C2BIN   = createTilesetText("C2BIN");
            const mapsetText_PROGMEM  = createMapsetText ("PROGMEM");
            const mapsetText_C2BIN    = createMapsetText ("C2BIN");
            // const mapsetText_SKIPMAP  = createMapsetText ("SKIPMAP"); // TODO: These maps would not have been created (They are not needed though.)
            // const mapsetText_NOWHERE  = createMapsetText ("NOWHERE"); // TODO: These maps would not have been created (They are not needed though.)
        
            const maps_SKIPMAP = getMapNames("SKIPMAP");
            const maps_NOWHERE = getMapNames("NOWHERE");
            const maps_PROGMEM = getMapNames("PROGMEM");
            const maps_C2BIN   = getMapNames("C2BIN");
        
            console.log("maps_SKIPMAP:", maps_SKIPMAP);
            console.log("maps_NOWHERE:", maps_NOWHERE);
            console.log("maps_PROGMEM:", maps_PROGMEM);
            console.log("maps_C2BIN:", maps_C2BIN);

            const tilesetOutputTo = this.data.settings.output.tiles['tilesetOutputTo'];
            
            let finalOutput_PROGMEM = "";
            let finalOutput_C2BIN = "";

            // Add header/tileset to the PROGMEM text.
            if (tilesetOutputTo === "PROGMEM" || tilesetOutputTo === undefined || mapsetText_PROGMEM.length) {
                // Add the header. 
                finalOutput_PROGMEM += headerText;

                // Add the tileset if it exists.
                if (tilesetText_PROGMEM.length) { finalOutput_PROGMEM += tilesetText_PROGMEM; }
            }
        
            // Add header/tileset to the C2BIN text.
            if (tilesetOutputTo === "C2BIN" || mapsetText_C2BIN.length) {
                // Add the header. 
                finalOutput_C2BIN += headerText;

                // Add the tileset if it exists.
                if (finalOutput_C2BIN.length) { finalOutput_C2BIN += tilesetText_C2BIN; }
            }
        
            // Add maps and map names to the PROGMEM text.
            if (mapsetText_PROGMEM.length) {
                finalOutput_PROGMEM += mapsetText_PROGMEM;
                finalOutput_PROGMEM += appendMapNames("SKIPMAP", maps_SKIPMAP);
                finalOutput_PROGMEM += appendMapNames("NOWHERE", maps_NOWHERE);
                finalOutput_PROGMEM += appendMapNames("PROGMEM", maps_PROGMEM);
            }
        
            // Add maps and map names to the C2BIN text.
            if (mapsetText_C2BIN.length) {
                finalOutput_C2BIN += mapsetText_C2BIN;
                finalOutput_C2BIN += appendMapNames("C2BIN", maps_C2BIN);
            }

            // Display the output text.
            app.DOM['textOutput1'].value = finalOutput_PROGMEM;
            app.DOM['textOutput2'].value = finalOutput_C2BIN;
        },

        // Generate and display the text output (JSON)
        generateJsonOutput: function(src_json){
            // Generate the date string.
            let generatedDate = new Date().toLocaleString('en-us', {
                weekday:'long',
                year: 'numeric', month:  'short'  , day:    'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric',
                hour12: true,
                timeZoneName: 'long'
            });

            // Declare these and populate with the next two for loops. 
            let tilemaps       = {};
            let C2BIN_tilemaps = {};
            let tileset        = [];
            
            // Populate tileset.
            for(let i=0; i<this.data.uniqueTiles.length; i+=1){
                tileset.push( this.data.uniqueTiles[i].rgb332 );
            }

            // Populate tilemaps and C2BIN_tilemaps.
            for(let i=0; i<this.data.maps.length; i+=1){
                // Get the record. 
                let rec = this.data.maps[i];

                // If the outputTo is "C2BIN", add to C2BIN_tilemaps (not tilemaps.)
                if(rec["mapOutputTo"] == "C2BIN"){ 
                    C2BIN_tilemaps[ rec["varName"] ] = [ rec["width"], rec["height"], ...rec["newTilesMap"]];
                    continue; 
                }

                // If the outputTo is "PROGMEM", add to tilemaps.
                if(rec["mapOutputTo"] == "PROGMEM"){ 
                    tilemaps[ rec["varName"] ] = [ rec["width"], rec["height"], ...rec["newTilesMap"]];
                    continue; 
                }
            }

            // Get DOM handles to the output textareas and clear them.
            // var textOutput1 = app.DOM['textOutput1'] ; // PROGMEM (C arrays)
            // var textOutput2 = app.DOM['textOutput2'] ; // C2BIN (C arrays)
            // var textOutput3 = app.DOM['textOutput2'] ; // JSON.
            // textOutput1.value = "";
            // textOutput2.value = "";
            // textOutput3.value = "";

            // Structure for the final json output. 
            let finalJson = {
                'generatedTime': "Generated by UAM V6: GCONVERT V4: " + generatedDate, 
                'tilesetName'  : src_json["gfx-xform"].output.tiles["_var-name"], 
                'config': {
                    'pointersSize'     : +src_json["gfx-xform"].output.maps["_pointers-size"], 
                    'tileHeight'       : +src_json["gfx-xform"].input["_tile-height"], 
                    'tileWidth'        : +src_json["gfx-xform"].input["_tile-width"], 
                    'translucent_color': +src_json["gfx-xform"]["output"]["tiles"]["_translucent_color"] ?? 254, 
                },
                'counts':{
                    'tileset'       : tileset.length,
                    'tilemaps'      : Object.keys(tilemaps).length,
                    'C2BIN_tilemaps': Object.keys(C2BIN_tilemaps).length,
                },
                'tilemaps'      : {},
                'C2BIN_tilemaps': {},
                'tileset'       : [],   
            };
            
            // JSON.stringify each tile of the tileset as a separate array entry.
            for (let tile of tileset) {
                finalJson.tileset.push(JSON.stringify(tile));
            }
            // JSON.stringify each tilemap as a separate array entry.
            for(let tileMapName in tilemaps){
                finalJson.tilemaps[tileMapName] = JSON.stringify( tilemaps[tileMapName] );
            }
            // JSON.stringify each C2BIN_tilemap as a separate array entry.
            for(let tileMapName in C2BIN_tilemaps){
                finalJson.C2BIN_tilemaps[tileMapName] = JSON.stringify( C2BIN_tilemaps[tileMapName] );
            }

            // Save the json output. 
            this.data.finalJson = finalJson;
            
            // Display the json output. 
            app.DOM['textOutput3'].value = JSON.stringify(finalJson,null,2);
        },
    
        // This runs the entire deduplication process.
        run: function(){
            let src_json = app.shared.src_json;
            let srcCanvas = app.DOM['imageInput'];
            let srcCanvasCtx = srcCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
            let destCanvas = app.DOM['imageInput2'];
            let src_xmlFilename = app.shared.src_xmlFilename;

            // Clear old data.
            this.data.usedOrgTileIds = new Set();
            this.data.orgTiles       = [];
            this.data.maps           = [];
            this.data.uniqueTiles    = []; 
            this.data.finalJson      = "";
            
            // Create the RGB332 color reduced canvas image that we will work from.
            // Convert the source image to RGB332 and back again then redraw.
            // NOTE: Required for UzeRPG: Some of the font chars were copy/pasted but not exactly as RGB332.
            let destCanvasCtx = destCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
            destCanvas.width = srcCanvas.width;
            destCanvas.height = srcCanvas.height;

            // Populate data constants. // TODO: tileWidth and tileHeight are stored twice.
            this.data.canvas     = destCanvas;
            this.data.ctx        = destCanvasCtx, // this.data.canvas.getContext('2d', { alpha: false, willReadFrequently: true });
            this.data.entireImageData = null;
            this.data.entireImageData_uint8Clamped = null;
            this.data.tileWidth  = +src_json['gfx-xform'].input["_tile-width"]; 
            this.data.tileHeight = +src_json['gfx-xform'].input["_tile-height"]; 
            this.data.mapsSrc    =  src_json['gfx-xform'].output.maps.map; 

            //
            try{
                this.data.settings.input['xmlFile']                 =  src_xmlFilename                                     ?? "UNKNOWN";
                this.data.settings['version']                       =  src_json["gfx-xform"]['_version']                   ?? "1";
                this.data.settings.input['file']                    =  src_json["gfx-xform"].input['_file']                ?? "";
                this.data.settings.input['tileHeight']              = +src_json["gfx-xform"].input['_tile-height']         ?? 8;
                this.data.settings.input['tileWidth']               = +src_json["gfx-xform"].input['_tile-width']          ?? 8;
                this.data.settings.input['type']                    =  src_json["gfx-xform"].input['_type']                ?? "";
                this.data.settings.output['file']                   =  src_json["gfx-xform"].output['_file']               ?? "";
                this.data.settings.output.tiles['varName']          =  src_json["gfx-xform"].output.tiles['_var-name']     ?? "";
                this.data.settings.output.maps['pointersSize' ]     = +src_json["gfx-xform"].output.maps['_pointers-size'] ?? 8;
                
                // CUSTOM - Initially set to defaults.
                this.data.settings.output.tiles['tilesetOutputTo']   = "PROGMEM";
                this.data.settings.output.tiles['removeDupeTiles']   = 1;
                this.data.settings.output.tiles['outputAsJson']      = 0;
                this.data.settings.output.tiles['translucent_color'] = 254;
                this.data.settings.output['file2']                   = ""; 
                
                // CUSTOM - Override if the setting is present.
                if(src_json["gfx-xform"].output.tiles['_tilesetOutputTo']  ){ this.data.settings.output.tiles['tilesetOutputTo']   =  src_json["gfx-xform"].output.tiles['_tilesetOutputTo']; }
                if(src_json["gfx-xform"].output.tiles['_removeDupeTiles']  ){ this.data.settings.output.tiles['removeDupeTiles']   = +src_json["gfx-xform"].output.tiles['_removeDupeTiles']; }
                if(src_json["gfx-xform"].output.tiles['_outputAsJson']     ){ this.data.settings.output.tiles['outputAsJson']      = +src_json["gfx-xform"].output.tiles['_outputAsJson']; }
                if(src_json["gfx-xform"].output.tiles['_translucent_color']){ this.data.settings.output.tiles['translucent_color'] = +src_json["gfx-xform"].output.tiles['_translucent_color']; }
                if(src_json["gfx-xform"].output['_file2']                  ){ this.data.settings.output['file2']                   =  src_json["gfx-xform"].output['_file2']; }
            }
            catch(e){
                console.log("ERROR: SOME VALUES THAT ARE REQUIRED WERE MISSING.", e, src_json['gfx-xform']);
                console.log("ERROR:", e)
                console.log("ERROR: src_json: ",src_json['gfx-xform']);
                throw e;
            }

            // Clear some data.
            this.data.usedOrgTileIds = new Set();
            
            let ts = performance.now();
    
            // Create the entire imageData object.
            let ts0a = performance.now();
            let ts0a1 = performance.now();
            this.data.entireImageData              = srcCanvasCtx.getImageData(0,0,srcCanvas.width, srcCanvas.height);
            let ts0a1E = performance.now() - ts0a1;
            let ts0a2 = performance.now();
            this.data.entireImageData_uint8Clamped = new Uint8ClampedArray(this.data.entireImageData.data);
            let ts0a2E = performance.now() - ts0a2;
            let ts0aE = performance.now() - ts0a;

            // Reduce the colorspace and draw to the second imageInput canvas.
            let ts0b = performance.now();
            let ts0b1 = performance.now();
            let numChanges1 = app.shared.reduceRgba32ToRgb332(this.data.entireImageData, "imageData");
            let ts0b1E = performance.now() - ts0b1;
            let ts0b2 = performance.now();
            let numChanges2 = app.shared.reduceRgba32ToRgb332(this.data.entireImageData_uint8Clamped, "typed");
            let ts0b2E = performance.now() - ts0b2;
            destCanvasCtx.putImageData(this.data.entireImageData, 0, 0); // NO LONGER NEEDED.
            this.data.entireImageData = null;
            let ts0bE = performance.now() - ts0b;

            // Generate the list of original tile ids used by tilemaps.
            let ts1 = performance.now();
            this.generateUsedOrgTileIdsAndOrgMapData();
            let ts1E = performance.now() - ts1;
            
            // Using the used tiles get data for all orgTiles.
            let ts2 = performance.now();
            let ts2_parts = this.generateOrgTilesAndDetermineDuplicateTiles();
            this.data.usedOrgTileIds = new Set(); // NO LONGER NEEDED.
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
            let ts5_parts = this.drawOutputCanvases();
            this.data.entireImageData_uint8Clamped = null; // Clear to recover some RAM.
            let ts5E = performance.now() - ts5;
            
            // Get DOM handles to the output textareas and clear them.
            var textOutput1 = app.DOM['textOutput1'] ; // PROGMEM (C arrays)
            var textOutput2 = app.DOM['textOutput2'] ; // C2BIN (C arrays)
            var textOutput3 = app.DOM['textOutput2'] ; // JSON.
            textOutput1.value = "";
            textOutput2.value = "";
            textOutput3.value = "";

            // Text output.
            let ts6 = performance.now();
            if(!this.data.settings.output.tiles['outputAsJson']){
                this.generateTextOutput();
            }
            let ts6E = performance.now() - ts6;
            
            // Json output.
            let ts7 = performance.now();
            if(this.data.settings.output.tiles['outputAsJson']){
                this.generateJsonOutput(src_json);
            }
            let ts7E = performance.now() - ts7;
            
            let tsE = performance.now() - ts;

            console.log(`== PERFORMANCE ==`);
            console.log(`  generate entire image data and typed data  : TIME : ${ts0aE.toFixed(2)} ms`);
            console.log(`    IMAGEDATA                  : TIME: ${ts0a1E.toFixed(2)} ms`);
            console.log(`    UINT8CLAMPED               : TIME: ${ts0a2E.toFixed(2)} ms`);
            console.log(`  reduce to RGB332 colorspace                : TIME : ${ts0bE.toFixed(2)} ms`);
            console.log(`    IMAGEDATA                  : TIME: ${ts0b1E.toFixed(2)} ms (Changes: ${numChanges1.changes}, non-changes: ${numChanges1.noChanges})`);
            console.log(`    UINT8CLAMPED               : TIME: ${ts0b2E.toFixed(2)} ms (Changes: ${numChanges2.changes}, non-changes: ${numChanges2.noChanges})`);
            console.log(`  generateUsedOrgTileIdsAndOrgMapData        : TIME : ${ts1E.toFixed(2)} ms`);
            console.log(`  generateOrgTilesAndDetermineDuplicateTiles : TIME : ${ts2E.toFixed(2)} ms`);
            console.log(`    Generate original tiles    : TIME : ${ts2_parts.ts1E.toFixed(2)} ms`);
            console.log(`    Determine duplicate tiles  : TIME : ${ts2_parts.ts2E.toFixed(2)} ms`);
            console.log(`  generateRgb332ForUniques                   : TIME : ${ts3E.toFixed(2)} ms`);
            console.log(`  recreateTileMaps                           : TIME : ${ts4E.toFixed(2)} ms`);
            console.log(`  drawOutputCanvases                         : TIME : ${ts5E.toFixed(2)} ms`);
            console.log(`    Draw indicated unused/dupes: TIME : ${ts5_parts.ts1E.toFixed(2)} ms`);
            console.log(`    Draw tileset               : TIME : ${ts5_parts.ts2E.toFixed(2)} ms`);
            console.log(`  generateTextOutput                         : TIME : ${ts6E.toFixed(2)} ms`);
            console.log(`  generateJsonOutput                         : TIME : ${ts7E.toFixed(2)} ms`);
            console.log(`TOTAL TIME: ${(tsE).toFixed(2)}`, this.data);
            console.log("TOTAL TILES :", this.data.orgTiles.length);
            console.log("UNIQUE TILES:", this.data.orgTiles.filter(d=>d.isUnique).length);
            console.log("DUPED TILES :", this.data.orgTiles.filter(d=>!d.isUnique && !d.ignore).length);
            console.log("UNUSED TILES:", this.data.orgTiles.filter(d=>d.ignore).length);

            // Remove the tileData and rgb332 parts of each tile. NO LONGER NEEDED.
            this.data.orgTiles.forEach(d=>{ d.tileData = null; d.rgb332 = null; });

            // Remove the finalJson. // NO LONGER NEEDED.
            this.data.finalJson = "";
        },
    },
    shared: {
        xmlToJson: function(xmlText, prefix="_"){
            var x2js = new X2JS({ attributePrefix: prefix });
            var jsonObj = x2js.xml2js(xmlText);
            return jsonObj;
        },
        JsonToXml: function(jsonObj, prefix="_"){
            var x2js = new X2JS({ attributePrefix: prefix });
            var xmlText = x2js.js2xml(jsonObj);
            return xmlText;
        },

        // Holds the converted JSON and XML.
        src_json:{},
        src_xml:"",
        src_xmlFilename:"",

        // * Neatly formats the XML string.
        format_xmlText: function(xmlString) {
            // Add XML declaration if not present
            if (!xmlString.startsWith('<?xml')) {
                xmlString = '<?xml version="1.0" ?>' + xmlString;
            }
        
            // Function to recursively format XML nodes with proper indentation
            let formatNode = function(node, indent) {
                let result = indent;
        
                // Handle text nodes
                if (node.nodeType === Node.TEXT_NODE) {
                    result += node.textContent.trim();
                } 

                // Handle element nodes
                else if (node.nodeType === Node.ELEMENT_NODE) {
                    result += '<' + node.nodeName;
        
                    // Add attributes to the element
                    for (let i = 0; i < node.attributes.length; i++) {
                        const attr = node.attributes[i];
                        result += ` ${attr.name}="${attr.value}"`;
                    }
        
                    // Handle self-closing elements (without child nodes)
                    if (node.childNodes.length === 0) {
                        result += ' />';
                    } 

                    // Handle elements with child nodes
                    else {
                        result += '>';
                        let childIndent = indent + '  ';
                        
                        // Process each child node with the formatNode function
                        for (let child of node.childNodes) {
                            result += '\n' + formatNode(child, childIndent);
                        }

                        // Close the current element with the proper indentation
                        result += '\n' + indent + '</' + node.nodeName + '>';
                    }
                }
        
                return result;
            };
        
            // Parse the XML string into an XML document
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        
            // Format the XML document and return the formatted XML string
            const formattedXml = formatNode(xmlDoc.documentElement, '');
            return '<?xml version="1.0" ?>\n' + formattedXml;
        },

        toRgb332 : function(r,g,b,a){ return (b & 0xc0) + ((g >> 2) & 0x38) + (r >> 5); },
        toRgb32 : function(rgb332){
            let nR = ( ((rgb332 >> 0) & 0b00000111) * (255 / 7) ) << 0; // red
            let nG = ( ((rgb332 >> 3) & 0b00000111) * (255 / 7) ) << 0; // green
            let nB = ( ((rgb332 >> 6) & 0b00000011) * (255 / 3) ) << 0; // blue
            return { r: nR, g: nG, b: nB };
        },

        reduceRgba32ToRgb332: function(data, type="imageData"){
            let changes = 0;
            let noChanges = 0;
            if(type=="imageData"){ data = data.data; }
            else if(type=="typed"){ data = data; }

            for (let i = 0; i < data.length; i += 4) {
                let r,g,b;
                r = data[i + 0];
                g = data[i + 1];
                b = data[i + 2];
        
                // Calculate RGB332.
                let rgb332 = (b & 0xc0) + ((g >> 2) & 0x38) + (r >> 5);
        
                // Calculate RGB32.
                let nR = ((rgb332 >> 0) & 0b00000111) * (255 / 7) | 0; // red
                let nG = ((rgb332 >> 3) & 0b00000111) * (255 / 7) | 0; // green
                let nB = ((rgb332 >> 6) & 0b00000011) * (255 / 3) | 0; // blue
                
                // Assign to imageData
                data[i + 0] = nR;
                data[i + 1] = nG;
                data[i + 2] = nB;
        
                if(nR != r || nG != g || nB != b){ changes ++ ;}
                else { noChanges ++ ; }
            }

            return {
                changes   : changes,
                noChanges : noChanges,
            };
        },
    },

    DOM: {
        "action"      : 'action',
        "inputSelect" : 'inputSelect',
        "xmlInput"    : 'xmlInput',
        "imageInput"  : 'imageInput',
        "imageInput2" : 'imageInput2',
        "imageOutput1": 'imageOutput1',
        "imageOutput2": 'imageOutput2',
        "textOutput1" : 'textOutput1',
        "textOutput2" : 'textOutput2',
        "textOutput3" : 'textOutput3',
    },
    readAndConvertXmlInput: async function(){
        let inputText = this.DOM['xmlInput'].value;
        app.shared.src_json = app.shared.xmlToJson(inputText, "_");
        app.shared.src_xml = app.shared.format_xmlText(app.shared.JsonToXml(app.shared.src_json, "_"));
        this.DOM['xmlInput'].value = app.shared.src_xml;

        let img = new Image();
        await new Promise(async (res,rej)=>{
            img.onload = async ()=>{
                let canvas = this.DOM['imageInput'];
                let ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                res();
            };
            img.src =  app.shared.src_json["gfx-xform"].input._file;
        });


        window.requestAnimationFrame(()=>{ 
            app.dedupe.run();
        });
    },

    init: async function(){
        // Create the DOM cache.
        for(let key in this.DOM){
            // Cache the DOM.
            this.DOM[key] = document.getElementById(this.DOM[key]);
        }

        this.DOM['action'].addEventListener("click", ()=>{
            console.clear();
            this.readAndConvertXmlInput();
        }, false);
        
        this.DOM['inputSelect'].addEventListener("change", async ()=>{
            if(this.DOM['inputSelect'].value == ""){ return; }

            let select = this.DOM['inputSelect'];
            let value = select.value;
            let option = select.options[select.selectedIndex];

            let xmlFileText = await (await fetch(value)).text();
            this.DOM['xmlInput'].value = xmlFileText;
            console.clear();
            this.readAndConvertXmlInput();
        }, false);

        // Set the initial XML data.
        let demoFiles = [
            { "index": 0,  "label": "MegaTris",               "file": "input_templates/xml_template1_Uzebox_MegaTris.xml" }, 
            { "index": 1,  "label": "Mario Bros (sprites",    "file": "input_templates/Uzebox_MarioBros.xml"              },                
            { "index": 2,  "label": "Mario Bros (bg tiles",   "file": "input_templates/xml_template2b.xml"                },                 
            { "index": 3,  "label": "Uze RPG",                "file": "input_templates/xml_template3.xml"                 },                 
            { "index": 4,  "label": "Ram-Tile Tests",         "file": "input_templates/xml_template4.xml"                 },                 
            { "index": 5,  "label": "Bubble Bobble",          "file": "input_templates/xml_template5.xml"                 },              
            { "index": 6,  "label": "JSG: Tetris: tilesBG1",  "file": "input_templates/JSG/Tetris/UAM/XML/tilesBG1.xml"   },
            { "index": 7,  "label": "JSG: Tetris: tilesG1",   "file": "input_templates/JSG/Tetris/UAM/XML/tilesG1.xml"    },
            { "index": 8,  "label": "JSG: Tetris: tilesLOAD", "file": "input_templates/JSG/Tetris/UAM/XML/tilesLOAD.xml"  },
            { "index": 9,  "label": "JSG: Tetris: tilesMISC", "file": "input_templates/JSG/Tetris/UAM/XML/tilesMISC.xml"  },
            { "index": 10, "label": "JSG: Tetris: tilesSP1",  "file": "input_templates/JSG/Tetris/UAM/XML/tilesSP1.xml"   },
            { "index": 11, "label": "JSG: Tetris: tilesTX1",  "file": "input_templates/JSG/Tetris/UAM/XML/tilesTX1.xml"   },
            { "index": 12, "label": "JSG: Tetris: tilesTX2",  "file": "input_templates/JSG/Tetris/UAM/XML/tilesTX2.xml"   },
        ];

        // let selectedIndex = "";
        let selectedIndex = 0;
        // let selectedIndex = 6;
        let select1 = this.DOM['inputSelect'];
        for(let i=0; i<demoFiles.length; i+=1){
            let option = document.createElement("option");
            option.value = demoFiles[i].file;
            option.innerText = demoFiles[i].label;
            if(demoFiles[i].index === selectedIndex){ 
                option.selected = true; 
            }
            select1.append(option);
        }
        if(selectedIndex !== ""){
            select1.dispatchEvent(new Event("change"));
        }
    },
};

(
    function(){
        let handler = async () => {
            // Remove this listener.
            window.removeEventListener('load', handler);

            await app.init();
        };
        window.addEventListener('load', handler);
    }
)();