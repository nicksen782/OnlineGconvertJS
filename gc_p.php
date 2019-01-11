<?php
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

// Look for UAM. It should be one directory back.
$filename = "../UAMVER.TXT";
$UAMFOUND = false;
if (file_exists($filename)) { $UAMFOUND = true; }

$dev=0;

if($UAMFOUND){
	require_once("../basics_p.php");
}
else{
	if ( strpos($_SERVER['SERVER_NAME'], "-nicksen782.c9users.io") !== false ) { $dev=1; }
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
		];
	}
	else{
		$perms         = [];
		$thisUserPerms = [];
		$loggedIn      = 0;
		$admin         = 0;
		$public        = 1;
		$thisUser      = [];
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
	$o_values["getGamesAndXmlFilepathsViaUserId"] = [ "p"=>( ( $public) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["gc_updateXmlFile"]                 = [ "p"=>( ( $public) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["gc_updateImgFile"]                 = [ "p"=>( ( $public) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["uam_saveProgmem"]                  = [ "p"=>( ( $public) ? 1 : 0 ), "args"=>[] ] ;
	$o_values["uam_saveC2bin"]                    = [ "p"=>( ( $public) ? 1 : 0 ), "args"=>[] ] ;


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


function getGamesAndXmlFilepathsViaUserId(){
	echo json_encode(array(
		'data'       => []        ,
		'success'    => true      ,
		'$results1'    => []      ,
		'$results2'    => []      ,


		// DEBUG
		'$_POST'     => $_POST      ,
	) );
}

function gc_updateXmlFile(){
	echo json_encode(array(
		'data'       => []        ,
		'success'    => true      ,

		// DEBUG
		'$_POST'     => $_POST      ,
	) );
}

function gc_updateImgFile(){
	echo json_encode(array(
		'data'       => []        ,
		'success'    => true      ,

		// DEBUG
		'$_POST'     => $_POST      ,
	) );
}

function uam_saveProgmem(){
	echo json_encode(array(
		'data'       => []        ,
		'success'    => true      ,

		// DEBUG
		'$_POST'     => $_POST      ,
	) );
}

function uam_saveC2bin(){
	echo json_encode(array(
		'data'       => []        ,
		'success'    => true      ,

		// DEBUG
		'$_POST'     => $_POST      ,
	) );
}


?>