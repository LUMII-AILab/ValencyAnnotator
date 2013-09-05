<?php
function getPage($url,$post=false) {
	$ch = curl_init(); 
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1); 
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

	curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookie.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookie.txt'); 
	
	if((isset($post)) && ($post != false)) {
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
    }     
	
	$data = curl_exec($ch);
	curl_close($ch);
	return $data;
}
$vards=str_replace(array("<",">","&lt;","&gt;"),"",urldecode($_POST['word']));
echo getPage("http://85.254.250.64:8182/".(intval($_POST['verbs']) ? 'verbs' : 'neverbs')."/".urlencode($vards));
?>
