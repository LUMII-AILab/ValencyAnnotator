<?php
$fails=urldecode($_POST['file']);
if(!(file_exists($fails) && substr($fails,0,strlen($fails)-strlen(strstr($fails, '/')))=="faili"))
{
	echo "Problēma ar faila ielādi! ";
	die();
}

if(filemtime($fails)+60>time())
{
	echo "Failu jau kāds ir atvēris! Fails būs piejams pēc 1 minūtes kopš faila aizvēršanas";
	die();
}
$xmlFails=preg_replace("/^faili\/txt/","faili/xml",$fails);
$xmlFails=preg_replace("/\.txt/",".xml",$xmlFails);

if(file_exists($xmlFails))
{
	if(filemtime($xmlFails)+60>time())
	{
		echo "Failu jau kāds ir atvēris! Fails būs piejams pēc 1 minūtes kopš faila aizvēršanas";
		die();
	}
}

include("file_processor.php");

echo json_encode($data);
/*


<table class="lines" cellspacing="0" cellpadding="0" border="0">
<?php foreach($lines as $line): ?>
	<tr class="line"><td class="text"><?php echo htmlspecialchars($line) ?><td><textarea class="comment"></textarea></td></tr>
<?php endforeach; ?>
</table>

*/
?>