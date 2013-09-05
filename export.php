<?php
$fails=urldecode($_POST['file_path']);

$fails=preg_replace("/^faili\/txt/","faili/xml",$fails);
$fails=preg_replace("/\.txt/",".xml",$fails);

if(!(file_exists($fails) && substr($fails,0,strlen($fails)-strlen(strstr($fails, '/')))=="faili"))
{
	echo '<script type="text/javascript">alert("Problēma ar faila eksportu! ");</script>';
	die();
}
/*
header("Content-Disposition: attachment; filename=\"export.txt\"");
header("Content-Type: application/octet-stream");

include("file_processor.php");
$txt="";
foreach($_POST['export_items'] as $item)
{
    $txt=$txt.'<SENTENCE category="'.$data['sentence_category'][$data['sentences'][$item]['category']]['name'].'">'.$data['sentences'][$item]['text']."</SENTENCE>\r\n";
}

foreach($data['category'] as $c)
{
    $txt=str_replace($c['id'],$c['name'],$txt);
}

$txt=preg_replace('/json="[^"]*"/iu','',$txt);

echo $txt;
*/

include("PHPWord.php");
include("file_processor.php");

// New Word Document
$PHPWord = new PHPWord();

$PHPWord->setDefaultFontName("Arial");
$PHPWord->setDefaultFontSize("12");

// New portrait section
$section = $PHPWord->createSection();
foreach($_POST['export_items'] as $item)
{
    $txt=$data['sentences'][$item]['text'];
    $txt=str_replace(array("<strong>","</strong>"),"|",$txt);
    preg_match_all('/(<span([^>]*)>)?([^<]+)(\<\/span>)?/ui',$txt,$matches, PREG_SET_ORDER);
    //var_dump($matches);
    

    $textrun = $section->createTextRun();

    foreach($matches as $match)
    {
        if(isset($match[4])) //span element
        {
            preg_match('/class="([^"]*)"/u',$match[2],$class);
            $textrun->addText('[');
            $textrun->addText(($class[1]=='verbs'? 'verbs' : $data['category'][$class[1]]['name']),array('subScript'=>TRUE)); 
        }
        
        $parts=explode('|',$match[3]);
        $bold=FALSE;
        foreach($parts as $part)
        {
            $textrun->addText($part,array('bold'=>$bold));
            $bold=!$bold;
        }

        if(isset($match[4])) //span element
        {
            preg_match('/attribute="([^"]*)"/u',$match[2],$attribute);
            $textrun->addText($attribute[1],array('subScript'=>true)); 
            $textrun->addText(']');
        }

        
    }
    


}

header('Content-Type: application/vnd.ms-word');
header('Content-Disposition: attachment;filename="export.docx"');
header('Cache-Control: max-age=0');
$objWriter = PHPWord_IOFactory::createWriter($PHPWord, 'Word2007');
//$objWriter->save('export.docx');
$objWriter->save('php://output');
exit; //you must have the exit!
?>