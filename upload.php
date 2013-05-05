<?php

$error = 0;

$fileName = "";
if( isset($_SERVER["HTTP_FILE_NAME"]) ) {
	$fileName = $_SERVER["HTTP_FILE_NAME"];
}
if( isset( $_POST["name"] ) ) {
	$fileName = $_POST["name"];
}

//$fileName = $_FILES['Filedata']["tmp_name"] ?: ( $_POST["name"]?: $_SERVER["HTTP_FILE_NAME"]) ;
//$fileContentType = $_POST['contentType']?: $_SERVER["HTTP_FILE_CONTENT_TYPE"];
//$fileSize = $_FILES['Filedata']["size"] ?: ($_POST['size']?: $_SERVER["HTTP_FILE_SIZE"]);

$imagePath = dirname(__FILE__) . "/uploaded/" . $fileName;
$imageUrl = "uploaded/" . $fileName;

$str="";
if(!$_FILES['Filedata']) {
	$str = file_get_contents("php://input");	
} else {	
	$str = file_get_contents( $_FILES['Filedata']["tmp_name"] );	
}

if($str) {
	
	if( $_SERVER["HTTP_FILE_IS_ENCODED"] !== "false" ) {
		$str = base64_decode($str);
	}	
		
	$fh = fopen($imagePath, 'w');
	if( $fh ) {
		fwrite($fh, $str);
		fclose($fh);
	} else {
		$error = 2;
	}
	
} else {
	$error = 1;
}

if(! $error ) {	
	$result = array(
		"success" => true,
		"id"	=>	md5($fileName),
		"imageUrl" => $imageUrl,
		"imagePath" => $imagePath,
		"fileName" => $fileName
		
	);	
} else {
	$result = array( "success" => false, "error" => $error );
}

echo json_encode( $result );
