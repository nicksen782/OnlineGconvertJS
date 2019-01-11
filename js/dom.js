/* global gc */
gc.funcs.domHandleCache_populate = function(){
	gc.vars.dom.input       = {
		// Test data load.
		 "selectTestData"      : document.querySelector("#gc3_input_selectTestData")
		,"selectTestData_load" : document.querySelector("#gc3_input_selectTestData_load")

		// Input data load.
		,"loadXml"      : document.querySelector("#gc3_input_loadXml")
		,"loadXml_file" : document.querySelector("#gc3_input_loadXml_file")
		,"loadImg"      : document.querySelector("#gc3_input_loadImg")
		,"loadImg_file" : document.querySelector("#gc3_input_loadImg_file")

		// Validate.
		,"validate1"              : document.querySelector("#gc3_input_validate1")
		,"validate2"              : document.querySelector("#gc3_input_validate2")

		// Go to the map editor
		,"goToMapEditor"         : document.querySelector("#gc3_input_goToMapEditor")

		// Input canvas.
		,"canvas"                : document.querySelector("#gc3_input_canvas")

		,"canvas_inputText"      : document.querySelector("#gc3_input_canvas_inputText")

		// Input xml.
		,"xml"                   : document.querySelector("#gc3_input_xml")

		// Input xml select menu (MULTI_TS).
		,"xml_multi_div"        : document.querySelector("#input_window5")
		,"xml_multi_select"     : document.querySelector("#gc3_input_xml_MULTI_TS_select")
		,"xml_multi_batch_btn"  : document.querySelector("#gc3_input_xml_MULTI_TS_BATCH_btn")

		// MISC INFO
		,"imgWidth"     : document.querySelector("#gc3_input_imgWidth")
		,"imgHeight"    : document.querySelector("#gc3_input_imgHeight")
		,"tileWidth"    : document.querySelector("#gc3_input_tileWidth")
		,"tileHeight"   : document.querySelector("#gc3_input_tileHeight")
		,"pointersSize" : document.querySelector("#gc3_input_pointersSize")
		,"mapCount"     : document.querySelector("#gc3_input_mapCount")

		// INPUT VALIDATIONS
		,"xformVersion" : document.querySelector("#gc3_input_xformVersion")
		,"validateXML"  : document.querySelector("#gc3_input_validateXML")
		,"validateIMG"  : document.querySelector("#gc3_input_validateIMG")
		,"validateMaps" : document.querySelector("#gc3_input_validateMaps")

		// Downloads
		,"download_inputXml" : document.querySelector("#gc3_input_download_inputXml_btn")
		,"download_inputImg" : document.querySelector("#gc3_input_download_inputImg_btn")


	};

	gc.vars.dom.maps        = {
		// Canvases.
		 "canvas_main"        : document.querySelector("#gc3_mapedit_image")
		,"canvas_main_layer2" : document.querySelector("#gc3_mapedit_image_layer2")
		,"canvas_preview"     : document.querySelector("#gc3_mapedit_preview")

		// DOM for the preview section.
		,"preview_l"            : document.querySelector("#gc3_mapedit_preview_settings [name='L']")
		,"preview_t"            : document.querySelector("#gc3_mapedit_preview_settings [name='T']")
		,"preview_w"            : document.querySelector("#gc3_mapedit_preview_settings [name='W']")
		,"preview_h"            : document.querySelector("#gc3_mapedit_preview_settings [name='H']")
		,"preview_firstTile"    : document.querySelector("#gc3_mapedit_preview_stats [name='firstTile']")
		,"preview_tileCountMap" : document.querySelector("#gc3_mapedit_preview_stats [name='tileCountMap']")

		// DOM for map records and map record controls.
		,"maps_records_div"            : document.querySelector("#gc3_maps_records_div")
		,"maps_records_div_colHeaders" : document.querySelector("#gc3_maps_records_div_colHeaders")
		,"maps_addNew_btn"             : document.querySelector("#gc3_maps_records_addNew_btn")
		,"maps_updateInput_btn"        : document.querySelector("#gc3_maps_actions_updateInput_btn")
		,"maps_startOver_btn"          : document.querySelector("#gc3_maps_actions_startOver_btn")

		// Input tileset outputTo.
		,"tilesetOutputTo"       : document.querySelector("#gc3_mapedit_tilesetOutputTo")

		// Input remove duplicate tiles.
		,"removeDupeTiles"       : document.querySelector("#gc3_mapedit_removeDupeTiles")


		// The process button.
		,"processToC_btn"       : document.querySelector("#gc3_maps_processToC_btn")
	};

	gc.vars.dom.output      = {
		 // Canvases.
		 "tilesetCanvas"           : document.querySelector("#gcOutput_tilesetCanvas")
		,"tilesetCanvas_small"     : document.querySelector("#gcOutput_tilesetCanvas2_small")
		,"tilesetCanvas_layer2"    : document.querySelector("#gcOutput_tilesetCanvas_layer2")
		,"markedDupesCanvas"       : document.querySelector("#gcOutput_markedDupesCanvas")
		,"markedDupesCanvas_small" : document.querySelector("#gcOutput_markedDupesCanvas_small")

		// Textarea outputs.
		,"progmemTextarea"        : document.querySelector("#gcOutput_progmemTextarea")
		,"c2binTextarea"          : document.querySelector("#gcOutput_c2binTextarea")
		,"combinedTextareaWindow" : document.querySelector("#gcOutput_window6")

		// Action buttons.
		,"goToPerformance"      : document.querySelector("#gc3_goToPerformance")

		// Tileset hover preview.
		,"tileInfo_div"      : document.querySelector("#gc3_output_tileHoverPreview_div")
		,"tileInfo_canvas"   : document.querySelector("#gc3_output_tileHoverPreview_canvas1")
		,"tileInfo_text"     : document.querySelector("#gc3_output_tileHoverPreview_tileNumber")

		// Downloads: Input
		,"download_srcXml_btn"     : document.querySelector("#gc3_output_download_srcXml_btn")
		,"download_srcImg_btn"     : document.querySelector("#gc3_output_download_srcImg_btn")

		// Downloads: Output
		,"download_mapImg_btn"         : document.querySelector("#gc3_output_download_mapImg_btn")
		,"download_tilesetImg_btn"     : document.querySelector("#gc3_output_download_tilesetImg_btn")
		,"download_markedDupesImg_btn" : document.querySelector("#gc3_output_download_markedDupesImg_btn")
		,"download_progmemInc_btn"     : document.querySelector("#gc3_output_download_progmemInc_btn")
		,"download_c2binInc_btn"       : document.querySelector("#gc3_output_download_c2binInc_btn")

		// Downloads: Lists
		,"download_all_input_btn"      : document.querySelector("#gc3_output_download_all_input_btn")
		,"download_all_output_btn"     : document.querySelector("#gc3_output_download_all_output_btn")
		,"download_all_all_btn"        : document.querySelector("#gc3_output_download_all_all_btn")


	};

	gc.vars.dom.performance = {
		// Pre (OUTPUT)
		 "getTilesetPlaceholderArray" : document.querySelector("#gc3_perf_output [name='getTilesetPlaceholderArray']")
		,"preProcessMaps"             : document.querySelector("#gc3_perf_output [name='preProcessMaps']")
		,"createRGB332_imageBuffer"   : document.querySelector("#gc3_perf_output [name='createRGB332_imageBuffer']")
		,"populateTileSetData"        : document.querySelector("#gc3_perf_output [name='populateTileSetData']")
		,"reduceDuplicateTiles"       : document.querySelector("#gc3_perf_output [name='reduceDuplicateTiles']")
		,"remapTileMaps"              : document.querySelector("#gc3_perf_output [name='remapTileMaps']")

		// OUTPUT
		,"timestamp"                     : document.querySelector("#gc3_perf_output2 [name='timestamp']")
		,"newTileset"                    : document.querySelector("#gc3_perf_output2 [name='newTileset']")
		,"newTileIds"                    : document.querySelector("#gc3_perf_output2 [name='newTileIds']")
		,"newMaps"                       : document.querySelector("#gc3_perf_output2 [name='newMaps']")
		,"tilesetText"                   : document.querySelector("#gc3_perf_output2 [name='tilesetText']")
		,"tilemapsText"                  : document.querySelector("#gc3_perf_output2 [name='tilemapsText']")
		,"final_outputText"              : document.querySelector("#gc3_perf_output2 [name='final_outputText']")
		,"final_outputImage_tileset"     : document.querySelector("#gc3_perf_output2 [name='final_outputImage_tileset']")
		,"final_outputImage_markedDupes" : document.querySelector("#gc3_perf_output2 [name='final_outputImage_markedDupes']")

		// OUTPUT - all
		,"ts_all"                        : document.querySelector("#gc3_perf_output3 [name='ts_all']")
	};

};

gc.funcs.domHandleCache_populate_UAM = function(){
	if( gc.vars.UAM_active == true ){
		// UAM DOM: INPUT
		gc.vars.dom.input.uam_refreshGameList = document.querySelector("#gc3_input_uam_refreshGameList")  ;
		gc.vars.dom.input.uam_updateXML       = document.querySelector("#gc3_input_uam_updateXML")        ;
		gc.vars.dom.input.uam_updateIMG       = document.querySelector("#gc3_input_uam_updateIMG")        ;
		gc.vars.dom.input.uam_gameList_select = document.querySelector("#gc3_input_uam_gameList_select")  ;
		gc.vars.dom.input.uam_xmlList_select  = document.querySelector("#gc3_input_uam_xmlList_select")   ;
		gc.vars.dom.input.uam_imgName         = document.querySelector("#gc3_input_uam_imgName")          ;

		// UAM DOM: OUTPUT
		gc.vars.dom.output.saveProgmem_btn    = document.querySelector("#gc3_output_UAM_saveProgmem_btn") ;
		gc.vars.dom.output.saveC2bin_btn      = document.querySelector("#gc3_output_UAM_saveC2bin_btn")   ;
	}
	if(gc.vars.originUAM==true){
		gc.vars.dom.uamLogin     = {};
		gc.vars.dom.uamLogin["uamModal"]   = document.querySelector("#uamModal");   //
		gc.vars.dom.uamLogin["uam_login"]  = document.querySelector("#uam_login");  //
		gc.vars.dom.uamLogin["uam_logout"] = document.querySelector("#uam_logout"); //
		gc.vars.dom.uamLogin["openUAM"]    = document.querySelectorAll(".openUAM"); //
		gc.vars.dom.uamLogin["uamIframe"]  = document.querySelector("#uamIframe");  //
	}

}

