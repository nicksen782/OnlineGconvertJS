<?php
/**
* Function list:
* - API_REQUEST()
* - gc_init()
* - getGamesAndXmlFilepathsViaUserId()
* - gc_updateXmlFile()
* - gc_updateImgFile()
* - uam_saveProgmem()
* - uam_saveC2bin()
* - uam_updateAssets()
* - uam_runC2BIN()
*/

// All requests to the server should go through this file.

// This is the only place this flag is set. It is checked everywhere else insuring that all processes start here.
$securityLoadedFrom_indexp = true;

// Configure error reporting
error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT);
ini_set('error_log', getcwd() . '/UAM5-GC-error.txt');
ini_set("log_errors", 1);
ini_set("display_errors", 1);

// Configure timezone.
define('TIMEZONE', 'America/Detroit');
date_default_timezone_set(TIMEZONE);

$_appdir      = getcwd().'/'                  ;
$_db_file     = $_appdir . "../_sys/UAM5b.db" ;
$_emu_db_file = $_appdir . "_sys/eud.db"      ;
$_db          = $_db_file                     ;

$emu_dir = __DIR__ . '/';
$emu_games_dir = $emu_dir . '/games/';

// Look for UAM. It should be one directory back.
$filename = "../UAMVER.TXT";
$UAMFOUND = false;
if (file_exists($filename)) { $UAMFOUND = true; }

$dev=0;

if($UAMFOUND){
	require_once("../basics_p.php");
}
else{
	if ( strpos($_SERVER['SERVER_NAME'], "dev2.nicksen782.net") !== false ) { $dev=1; }
	else { $dev=0; }
}

// Was a request received? Process it.
if     ( $_POST['o'] ){ API_REQUEST( $_POST['o'], 'post' ); }
else if( $_GET ['o'] ){ API_REQUEST( $_GET ['o'], 'get'  ); }
else{
	$stats['error']=true;
	$stats['error_text']="***No 'o' value was provided.";
	// audit_API_newRecord( $_SESSION['user_id'], 'MISSING', 'MISSING', 0, $stats['error_text'] );
	echo json_encode( $stats );
	exit();
}

function API_REQUEST( $api, $type ){
	// Is this a UAM request or an EMULATOR ONLY request?
	global $UAMFOUND;

	$stats = array(
		'error'      => false ,
		'error_text' => ""    ,
		'thisUser'   => []    ,
	);

	if($UAMFOUND){
		startSession();
		$perms         = users_sessionAndPermissions_internal();
		$thisUserPerms = $_SESSION['permKeys'];
		$loggedIn      = $_SESSION['hasActiveLogin']                        ? 1 : 0;
		$admin         = in_array("isFullAdmin" , $thisUserPerms) !== false ? 1:0;
		$public        = 1 ;
		$thisUser = [
			"settings"      => $perms         ,
			"thisUserPerms" => $thisUserPerms ,
			"hasActiveLogin" => $_SESSION['hasActiveLogin'] == 1 ,
		];
	}
	else{
		$perms         = [];
		$thisUserPerms = [];
		$loggedIn      = 0;
		$admin         = 0;
		$public        = 1;
		$thisUser      = [
			"hasActiveLogin" => $_SESSION['hasActiveLogin'] == 1 ,
		];
	}

	// Rights.
	$public = 1        ; // No rights required.
	$UAM    = $UAMFOUND; // Requires UAM.

	// Create flags that will be used for permission checks in this function.
	$isFullAdmin       = in_array("isFullAdmin"       , $thisUserPerms) !== false ? 1:0;
	$emu_canCompile    = in_array("emu_canCompile"    , $thisUserPerms) !== false ? 1:0;
	$emu_isUamGameUser = in_array("emu_isUamGameUser" , $thisUserPerms) !== false ? 1:0;
	$emu_isDbAdmin     = in_array("emu_isDbAdmin"     , $thisUserPerms) !== false ? 1:0;
	$emu_isDbUser      = in_array("emu_isDbUser"      , $thisUserPerms) !== false ? 1:0;

	$stats["thisUser"] = $thisUser;
	$stats["__isFullAdmin"]       = $isFullAdmin      ;
	$stats["__emu_canCompile"]    = $emu_canCompile   ;
	$stats["__emu_isUamGameUser"] = $emu_isUamGameUser;
	$stats["__emu_isDbAdmin"]     = $emu_isDbAdmin    ;
	$stats["__emu_isDbUser"]      = $emu_isDbUser     ;
	$stats["___thisUserPerms"]    = $thisUserPerms     ;

	$o_values=array();

	// GCONVERT FUNCTIONS - (NON-UAM)
	$o_values["gc_init"]                = [ "p"=>( ( $public) ? 1 : 0 ), "args"=>[] ] ;

	// GCONVERT FUNCTIONS - (UAM)
	$o_values["getGamesAndXmlFilepathsViaUserId"] = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["gc_updateXmlFile"]                 = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["gc_updateImgFile"]                 = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["uam_saveProgmem"]                  = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["uam_saveC2bin"]                    = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["uam_saveJSON"]                     = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["uam_updateAssets"]                 = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;

	$o_values["uam_runC2BIN"]                     = [ "p"=>( ( $isFullAdmin ) ? 1 : 0 ), "args"=>[] ] ;

	// In basics_p.php
	$o_values["keepAlive_ping"]                   = [ "p"=>( ( $public) ? 1 : 0 ), "args"=>[] ] ;

	// DETERMINE IF THE API IS AVAILABLE TO THE USER.

	// Is this a known API?
	if( ! isset( $o_values[ $api] ) ){
		$stats['error']=true;
		$stats['error_text']="Unhandled API";
		// audit_API_newRecord( $_SESSION['user_id'], $_SESSION['o_api'], $_SESSION['via_type'], 0, $stats['error_text'] );
	}

	// Is the API allowed to be called this way?
	// else if( ! $o_values[ $api ][ $type ] ){
	// 	$stats['error']=true;
	// 	$stats['error_text']="Invalid access type";
	// 	// audit_API_newRecord( $_SESSION['user_id'], $_SESSION['o_api'], $_SESSION['via_type'], 0, $stats['error_text'] );
	// }

	// Does the user have sufficient permissions?
	else if( ! $o_values[ $api ]['p'] ){
		$stats['error']=true;
		$stats['error_text']="API auth error";
		// audit_API_newRecord( $_SESSION['user_id'], $_SESSION['o_api'], $_SESSION['via_type'], 0, $stats['error_text'] );
	}

	// Can the function be run?
	if(! $stats['error']){
		// GOOD! Allow the API call.
		call_user_func_array( $api, array( $o_values[ $api ]["args"]) );
	}

	// Was there an error?
	else{
		echo json_encode( $stats );
		exit();
	}

}

// Returns the existance of UAM, returns permissions if applicable, Runs at start.
function gc_init(){
	// Was UAM found?
	global $UAMFOUND;

	// If yes then return the base session information including permissions list.
	if($UAMFOUND){
		// gc_init
		if( $_SESSION['hasActiveLogin'] == 1 ) {
			$_SESSION['refreshes'] = 0;
		}
		$UAMDATA = $_SESSION;
	}
	// If no, then that's it. No UAM.
	else{
		$UAMDATA = [];
	}

	echo json_encode(array(
		'data'       => []        ,
		'success'    => true      ,
		'UAMFOUND'   => $UAMFOUND ,
		'UAMDATA'    => $UAMDATA  ,

		// DEBUG
		// '$_POST'     => $_POST      ,
	) );
}


// * Get XML file names from indicated games' UAM dir.
function getGamesAndXmlFilepathsViaUserId(){
	$author_user_id = $_POST["user_id"];

	global $_appdir;
	global $_db_file;
	global $dev;

	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			gameId
			, gameName
			, UAMdir

			--, author_user_id
			--, author
			--, gamedir
			--, created
			--, last_update
		FROM games_manifest
		WHERE author_user_id = :author_user_id
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':author_user_id' , $author_user_id ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;
	$errors = [];
	$results_test = $results1;

	// Get the default game value.
	$defaultGameId = $_SESSION["default_game"];

	// Remove dirs that don't exist.
	for($i=0; $i<sizeof($results1); $i+=1){
		$directory = $results1[$i]["UAMdir"] . "/XML";
		$gameId    = $results1[$i]["gameId"];
		$gameName  = $results1[$i]["gameName"];
		if( ! file_exists($_SERVER["DOCUMENT_ROOT"] . "/" . $directory) ){
			array_push(
				$errors, 
				[
					"$gameName" => [
						"results1[$i]"=> $results1[$i],
						"realdir"     => $_SERVER["DOCUMENT_ROOT"] . "/" . $directory,
						"error"       => "!file_exists",
						"webdir"      => $directory, 
						"gameId"      => $gameId, 
						"gameName"    => $gameName
					] 
				]
			);
			unset($results1[$i]);
		}
	}
	$results1=array_values($results1);

	// You have the gameIds, gameNames, and UAMdirs. You need the XML filenames in the XML dir of the game's UAM dir.
	$results2 = [];

	for($i=0; $i<sizeof($results1); $i+=1){
		$directory = $results1[$i]["UAMdir"] . "/XML";
		$gameId    = $results1[$i]["gameId"];
		$gameName  = $results1[$i]["gameName"];

		// Scan the dir. Get the file names that have the XML extension.
		if( file_exists($_SERVER["DOCUMENT_ROOT"] . "/" . $directory) ){
			$scanned_directory = array_values(
				array_diff(
					scandir($_SERVER["DOCUMENT_ROOT"] . "/" . $directory
				)
				, array('..', '.', '.git')
				)
			);

			for($ii=0; $ii<sizeof($scanned_directory); $ii++){
				// Don't include dirs.
				if( ! is_dir($_SERVER["DOCUMENT_ROOT"] . "/" . $directory.'/'.$scanned_directory[$ii]) ){
					array_push($results2,
						[
							// "fullpath" => $_SERVER["DOCUMENT_ROOT"] . "/" . $directory.'/'.$scanned_directory[$ii] ,
							"webpath"  => "/".$directory.'/'.$scanned_directory[$ii] ,
							"filename" => $scanned_directory[$ii]                ,
							"gameid"   => $gameId                                  ,
							"gamename" => $gameName                              ,
							// "label"    => $gameName . " - "  .$scanned_directory[$ii]       ,
						]
					);
				}
			}
		}

	}

	//
	echo json_encode(array(
		'data'      => [] ,
		'success'   => true      ,

		'gameList_UAM'  => $results1 ,
		'XMLlist_UAM'   => $results2 ,
		'defaultGameId' => $defaultGameId ,
		
		// DEBUG
		// '$_POST'       => $_POST    ,
		// '$_SESSION'    => $_SESSION ,
		// '$results_test'=> $results_test ,
		// '$errors'      => $errors ,
		// '$errors'      => $dev ? $errors : [] ,
	) );

}

// * Update XML file.
function gc_updateXmlFile(){
	$filename = $_POST["filename"] ;
	$gameid   = $_POST["gameid"]  ;
	$userFile = $_POST["userFile"];

	// Get the game's UAMdir.
	global $_appdir;
	global $_db_file;
	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			UAMdir
		FROM games_manifest
		WHERE gameid = :gameid
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':gameid' , $gameid ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;

	if(!sizeof($results1)){
		echo json_encode([
			'data'    => "Game not found in the UAM database.",
			'success' => false
		]);
		exit();
	}

	$directory = $_SERVER["DOCUMENT_ROOT"] . "/" . $results1[0]["UAMdir"] . "/XML";
	file_put_contents( $directory . "/" . $filename, $userFile );

	echo json_encode(array(
		'data'       => []         ,
		'success'    => true       ,
	) );

}

// * Get IMG file names from indicated games' UAM dir.
function gc_updateImgFile(){
	$filename = $_POST["filename"] ;
	$gameid   = $_POST["gameid"]  ;
	$userFile = $_POST["userFile"];

	// Get the game's UAMdir.
	global $_appdir;
	global $_db_file;
	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			UAMdir
		FROM games_manifest
		WHERE gameid = :gameid
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':gameid' , $gameid ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;

	if(!sizeof($results1)){
		echo json_encode([
			'data'    => "Game not found in the UAM database.",
			'success' => false
		]);
		exit();
	}

	$directory = $_SERVER["DOCUMENT_ROOT"] . "/" . $results1[0]["UAMdir"] . "/IMG";

	$userFile = str_replace('data:image/png;base64,', '', $userFile);
	$userFile = str_replace(' ', '+', $userFile);
	$userFile = base64_decode($userFile);

	file_put_contents( $directory . "/" . $filename, $userFile );

	echo json_encode(array(
		'data'       => []         ,
		'success'    => true       ,
	) );

}

//
function uam_saveProgmem(){
	$filename = $_POST["filename"] ;
	$gameid   = $_POST["gameid"]  ;
	$userFile = $_POST["userFile"];

	// Get the game's UAMdir.
	global $_appdir;
	global $_db_file;
	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			UAMdir
		FROM games_manifest
		WHERE gameid = :gameid
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':gameid' , $gameid ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;

	if(!sizeof($results1)){
		echo json_encode([
			'data'    => "Game not found in the UAM database.",
			'success' => false
		]);
		exit();
	}

	$directory = $_SERVER["DOCUMENT_ROOT"] . "/" . $results1[0]["UAMdir"] . "/PROGMEM";

	$res = file_put_contents( $directory . "/" . $filename, $userFile );

	echo json_encode(array(
		'data'       => []         ,
		'success'    => true       ,

		// // '$_POST'     => $_POST     ,
		// '$results1'  => $results1  ,
		// '$directory' => $directory ,
		// '$gameid'    => $gameid    ,
		// '$res'    => $res    ,

	) );
}

//
function uam_saveC2bin()  {
	$filename = $_POST["filename"] ;
	$gameid   = $_POST["gameid"]  ;
	$userFile = $_POST["userFile"];

	// Get the game's UAMdir.
	global $_appdir;
	global $_db_file;
	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			UAMdir
		FROM games_manifest
		WHERE gameid = :gameid
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':gameid' , $gameid ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;

	if(!sizeof($results1)){
		echo json_encode([
			'data'    => "Game not found in the UAM database.",
			'success' => false
		]);
		exit();
	}

	$directory = $_SERVER["DOCUMENT_ROOT"] . "/" . $results1[0]["UAMdir"] . "/C2BIN";

	file_put_contents( $directory . "/" . $filename, $userFile );

	echo json_encode(array(
		'data'       => []         ,
		'success'    => true       ,

		// '$results1'  => $results1  ,
		// '$directory' => $directory ,
		// '$_POST'     => $_POST     ,
		// '$gameid'    => $gameid    ,

	) );

}

//
function uam_saveJSON()  {
	$filename = $_POST["filename"] ;
	$gameid   = $_POST["gameid"]  ;
	$userFile = $_POST["userFile"];

	// Get the game's UAMdir.
	global $_appdir;
	global $_db_file;
	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			UAMdir
		FROM games_manifest
		WHERE gameid = :gameid
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':gameid' , $gameid ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;

	if(!sizeof($results1)){
		echo json_encode([
			'data'    => "Game not found in the UAM database.",
			'success' => false
		]);
		exit();
	}

	$directory = $_SERVER["DOCUMENT_ROOT"] . "/" . $results1[0]["UAMdir"] . "/JSON";

	$filePath = $directory . "/" . $filename;
	$fpc_result = file_put_contents( $filePath, $userFile );

	echo json_encode(array(
		// Expected response.
		'data'       => []         ,
		'success'    => true       ,

		// Generated.
		// '$results1'   => $results1 ,
		// '$directory'  => $directory ,
		// '$filePath'   => $filePath ,
		// '$fpc_result' => $fpc_result ,
		
		// Provided.
		// '$_POST'    => $_POST,
		// '$gameid'   => $gameid ,
		// '$filename' => $filename,
		// '$userFile' => $userFile,
	) );

}

function uam_updateAssets()  {
	// $filename = $_POST["filename"] ;
	$gameid   = $_POST["gameid"]  ;
	// $userFile = $_POST["userFile"];

	// Get the game's UAMdir.
	global $_appdir;
	global $_db_file;
	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			UAMdir
		FROM games_manifest
		WHERE gameid = :gameid
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':gameid' , $gameid ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;

	if(!sizeof($results1)){
		echo json_encode([
			'data'    => "Game not found in the UAM database.",
			'success' => false
		]);
		exit();
	}

	$directory = $_SERVER["DOCUMENT_ROOT"] . "/" . $results1[0]["UAMdir"] . "";
	$assetsDir = $directory . "/../src/assets/";

	// file_put_contents( $directory . "/" . $filename, $userFile );
	// Copy the files in PROGMEM, C2BIN, and MUSIC.
	$script1 = "cp -rf " . $directory . "/" . "PROGMEM/* "        . $assetsDir . " 2>&1 ";
	$script2 = "cp -rf " . $directory . "/" . "C2BIN/OUTPUT/* "   . $assetsDir . " 2>&1 ";
	$script3 = "cp -rf " . $directory . "/" . "MUSIC/* "          . $assetsDir . " 2>&1 ";
	$script4 = "cp -rf " . $directory . "/" . "JSON/* "           . $assetsDir . " 2>&1 ";
	$script5 = "echo DONE 2>&1 ";

	$output1 = shell_exec($script1);
	$output2 = shell_exec($script2);
	$output3 = shell_exec($script3);
	$output4 = shell_exec($script4);

	echo json_encode(array(
		'data'       => []         ,
		'success'    => true       ,
		// '$script1'    => $script1       ,
		// '$script2'    => $script2       ,
		// '$script3'    => $script3       ,
		// '$script4'    => $script4       ,
		// '$script5'    => $script5       ,

		// '$results1'  => $results1  ,
		// '$directory' => $directory ,
		// '$_POST'     => $_POST     ,
		// '$gameid'    => $gameid    ,
		'$output1'   => $output1   ,
		'$output2'   => $output2   ,
		'$output3'   => $output3   ,
		'$output4'   => $output4   ,

	) );

}

function uam_runC2BIN()  {
	// $filename = $_POST["filename"] ;
	$gameid   = $_POST["gameid"]  ;
	// $userFile = $_POST["userFile"];

	// Get the game's UAMdir.
	global $_appdir;
	global $_db_file;
	$dbhandle = new sqlite3_DB_PDO__UAM5($_db_file) or exit("cannot open the database");
	$s_SQL1  ="
		SELECT
			UAMdir
		FROM games_manifest
		WHERE gameid = :gameid
		ORDER BY last_update DESC
	;";
	$prp1    = $dbhandle->prepare($s_SQL1);
	$dbhandle->bind(':gameid' , $gameid ) ;
	$retval1 = $dbhandle->execute();
	$results1= $dbhandle->statement->fetchAll(PDO::FETCH_ASSOC) ;

	if(!sizeof($results1)){
		echo json_encode([
			'data'    => "Game not found in the UAM database.",
			'success' => false
		]);
		exit();
	}

	$directory = $_SERVER["DOCUMENT_ROOT"] . "/" . $results1[0]["UAMdir"] . "";
	$assetsDir = $directory . "/../src/assets/";

	// file_put_contents( $directory . "/" . $filename, $userFile );
	// Run the C2BIN script.
	$script1 = "$directory" . "/C2BIN/c2bin_runit.sh" . " 2>&1 ";
	// $script2 = "echo DONE 2>&1 ";

	$output1 = shell_exec($script1);
	// $output2 = shell_exec($script2);

	echo json_encode(array(
		'data'       => []         ,
		'success'    => true       ,

		'script1'   => $script1       ,
		// '$script2'   => $script2       ,
		'output1'   => $output1   ,
		// '$output2'   => $output2   ,

		// '$results1'  => $results1  ,
		// '$directory' => $directory ,
		// '$_POST'     => $_POST     ,
		// '$gameid'    => $gameid    ,

	) );

}

?>