<?php

if(sizeof($_GET)){
	$getstring="";
	$first=true;
	foreach ($_GET as $key => $value){
		if ($first){ $getstring .= '?'; }
		else{ $getstring .= '&'; }
		$getstring .= $key . '=' . $value ;
	}
	header('Location: gc.html' . $getstring);
}
else{
	header('Location: gc.html');
}

?>

