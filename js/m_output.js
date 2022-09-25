gc.funcs.output = {
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
        var textOutput3          = gc.vars.dom.output.jsonTextarea ;
        textOutput1.value = "";
        textOutput2.value = "";
        textOutput3.value = "";
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
        textOutput3.value = JSON.stringify(json,null,2);

        // gc.funcs.output.nav.showOneView("progmem");
        // gc.funcs.output.nav.showOneView("c2bin");
        gc.funcs.output.nav.showOneView("json");
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
        var textOutput3          = gc.vars.dom.output.jsonTextarea ;
        var textarea1_text = "";
        var textarea2_text = "";
        var textarea3_text = "";

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
            textOutput3.value = "";
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

        gc.funcs.output.nav.showOneView("progmem");
        // gc.funcs.output.nav.showOneView("c2bin");
        // gc.funcs.output.nav.showOneView("json");

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
        gc.vars.dom.output.download_json_btn          .addEventListener('click', function(){ gc.funcs.downloads.downloadOneRamFile("json", true); }, false);

        gc.vars.dom.output.download_all_input_btn     .addEventListener('click', gc.funcs.downloads.downloadAllInputFiles, false);
        gc.vars.dom.output.download_all_output_btn    .addEventListener('click', gc.funcs.downloads.downloadAllOutputFiles, false);
        gc.vars.dom.output.download_all_all_btn       .addEventListener('click', gc.funcs.downloads.downloadAllAssetFiles, false);
    }

    ,nav:{
        parent:null,
        defaultTabKey: null,
        tabs: {},
        views: {},
        hideAllViews: function(){
            // Deactivate all tabs and views. 
            for(let key in this.tabs) { this.tabs[key] .classList.remove("active"); }
            for(let key in this.views){ this.views[key].classList.remove("active"); }
        },
        showOneView: function(tabKey){
            // Deactivate all tabs and views. 
            this.hideAllViews();
    
            // Get the tab and the view.
            let tabElem  = this.tabs [ tabKey ];
            let viewElem = this.views[ tabKey ];
    
            // Set the active class for this tab and view. 
            tabElem .classList.add("active");
            viewElem.classList.add("active");
        },
        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Set defaultTabKey
                this.defaultTabKey = "progmem";

                // Save DOM strings and generate DOM references.
                this.tabs ["progmem"]   = document.getElementById("output_tab_progmem");
                this.tabs ["c2bin"]     = document.getElementById("output_tab_c2bin");
                this.tabs ["json"]      = document.getElementById("output_tab_json");
                this.views["progmem"] = document.getElementById("output_view_progmem");
                this.views["c2bin"]   = document.getElementById("output_view_c2bin");
                this.views["json"]    = document.getElementById("output_view_json");
        
                // Deactivate all tabs and views. 
                this.hideAllViews();
            
                // Add event listeners to the tabs.
                for(let key in this.tabs){
                    this.tabs[key].addEventListener("click", () => this.showOneView(key), false); 
                }

                // Show the default view.
                this.showOneView(this.defaultTabKey);

                resolve();
            });
        }
    },

};