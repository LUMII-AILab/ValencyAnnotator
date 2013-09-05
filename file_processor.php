<?php
    

$data=Array("category"=>Array(),"sentences"=>Array(),"sentence_category"=>Array());
if(strrchr($fails, '.')==".xml")
{
	$saturs=file_get_contents($fails);
	$DOMdoc = new DOMDocument();
	$DOMdoc->loadXML($saturs);
	$DOMPath = new DOMXPath( $DOMdoc );
	$categories=$DOMPath->query("//CATEGORY");
	foreach($categories AS $category)
	{
		$c=&$data['category'][$category->getAttribute("id")];
		$c['id']=$category->getAttribute("id");
		$c['name']=$category->nodeValue;
	}
	
	$sentence_categories=$DOMPath->query("//SENTENCE_CATEGORY");
	foreach($sentence_categories AS $sentence_category)
	{
		$c=&$data['sentence_category'][$sentence_category->getAttribute("id")];
		$c['id']=$sentence_category->getAttribute("id");
		$c['name']=$sentence_category->nodeValue;
	}
	
	$sentences=$DOMPath->query("//SENTENCE");
	foreach($sentences AS $sentence)
	{
		$s=&$data['sentences'][];
		$s['text']=str_replace(Array("<TEXT>","</TEXT>"),"",str_replace("WORD","span",$DOMdoc->saveXML($DOMPath->query("TEXT",$sentence)->item(0))));
		$s['comment']=$DOMPath->query("COMMENT",$sentence)->item(0)->nodeValue;
		$s['category']=($sentence->getAttribute("CATEGORY") ? $sentence->getAttribute("CATEGORY") : "blank");
	}
}
else
{
	$lines=file($fails);
	foreach($lines AS $line)
	{
		$s=&$data['sentences'][];
		$s['comment']="";
		$s['category']="blank";
		$s['text']=htmlspecialchars(trim($line));
	}
	$c=&$data['category'][];
	$c['id']="cFFFF00";
	$c['name']="Agenss";
}

?>