<?php
$data=json_decode($_POST['data'],true);
$fails=urldecode($data['fails']);
if(!(file_exists($fails) && substr($fails,0,strlen($fails)-strlen(strstr($fails, '/')))=="faili"))
{
	echo "Piekļuves kļūda!";
	die();
}
$fails=str_replace("faili/txt","faili/xml",$fails);

$celi=explode("/",$fails);
$total=count($celi)-1;
$cels="faili";
for($i=1;$i<$total;$i++)
{
	$cels.="/".$celi[$i];
	if(!file_exists($cels))
	{
		mkdir($cels,0777);
	}
}
$fails=str_replace(strrchr($fails, '.'),".xml",$fails);
$f=fopen($fails,"w");
fwrite($f,'<?xml version="1.0" encoding="UTF-8"?>'."\n".'<CONTENT>'."\n".'');
fwrite($f,''."\t".'<CATEGORIES>'."\n".'');
foreach($data['category'] AS $category)
{
	fwrite($f,''."\t".''."\t".'<CATEGORY id="'.$category['id'].'">'.trim($category['name']).'</CATEGORY>'."\n".'');
}
fwrite($f,''."\t".'</CATEGORIES>'."\n".'');

fwrite($f,''."\t".'<SENTENCE_CATEGORIES>'."\n".'');
foreach($data['sentence_category'] AS $category)
{
	fwrite($f,''."\t".''."\t".'<SENTENCE_CATEGORY id="'.$category['id'].'">'.trim($category['name']).'</SENTENCE_CATEGORY>'."\n".'');
}
fwrite($f,''."\t".'</SENTENCE_CATEGORIES>'."\n".'');

fwrite($f,''."\t".'<SENTENCES>'."\n".'');
foreach($data['sentences'] AS $sentence)
{
	fwrite($f,''."\t".''."\t".'<SENTENCE CATEGORY="'.$sentence['category'].'">'."\n".'');
	fwrite($f,''."\t".''."\t".''."\t".'<TEXT>');
	fwrite($f,trim(stripslashes(str_replace("span","WORD",$sentence['text']))));
	fwrite($f,'</TEXT>'."\n".'');

	fwrite($f,''."\t".''."\t".''."\t".'<COMMENT>');
	fwrite($f,trim(stripslashes($sentence['comment'])));
	fwrite($f,'</COMMENT>'."\n".'');
	fwrite($f,''."\t".''."\t".'</SENTENCE>'."\n".'');
	
}


fwrite($f,''."\t".'</SENTENCES>'."\n".'');
fwrite($f,'</CONTENT>');
fclose($f);
echo json_encode(Array("success"=>1));