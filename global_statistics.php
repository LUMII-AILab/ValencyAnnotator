<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<link rel="stylesheet" href="style.css" type="text/css" />
		<link href="filetree/default.css" rel="stylesheet" type="text/css" />
		<script type="text/javascript" src="jquery.js"></script>
		<script type="text/javascript">
			var colors=['00FF00', 'FFFF00', 'FF00FF', 'FF0000', '00FFFF', 'C00000', '00C000', 'C0C000', '0000FF'];
			$(document).ready(function() { 
				for(var i=0;i<colors.length;i++)
				{
					addCSSRule(".c"+colors[i]+", "+"#c"+colors[i]+", .s"+colors[i]+", "+"#s"+colors[i],"background-color","#"+colors[i])
				}
				$('body').on('click','#hide_detail_view', function() {
					$(".combinations").find('.detail_view').toggle();
				});
			});
			function addCSSRule(sel, prop, val) {
				for(var i = 0; i < document.styleSheets.length; i++){
					var ss    = document.styleSheets[i];
					var rules = (ss.cssRules || ss.rules);
					var lsel  = sel.toLowerCase();

					for(var i2 = 0, len = rules.length; i2 < len; i2++){
						if(rules[i2].selectorText && (rules[i2].selectorText.toLowerCase() == lsel)){
							if(val != null){
								rules[i2].style[prop] = val;
								return;
							}
							else{
								if(ss.deleteRule){
									ss.deleteRule(i2);
								}
								else if(ss.removeRule){
									ss.removeRule(i2);
								}
								else{
									rules[i2].style.cssText = '';
								}
							}
						}
					}
				}

				var ss = document.styleSheets[0] || {};
				if(ss.insertRule) {
					var rules = (ss.cssRules || ss.rules);
					ss.insertRule(sel + '{ ' + prop + ':' + val + '; }', rules.length);
				}
				else if(ss.addRule){
					ss.addRule(sel, prop + ':' + val + ';', 0);
				}
			};
		</script>
    </head>
    <body>
	<pre>
<?php

//atrod visus xml failus
$directory="faili/gatavie";
$files=array();
$extensions=array("xml");
$new_dirs=array($directory);
//izpilda ciklu kamēr ir atrastas jaunas direktorijas
while(!empty($new_dirs))
{	
	$dirs=$new_dirs;
	$new_dirs=array();
	//iet cauri visām atrastajām direktorijām
	foreach($dirs as $dir)
	{
		$file = scandir($dir);
		
		//iet cauri visiem failiem direktorijā
		foreach($file as $this_file) {
			
			if( is_dir("$dir/$this_file" ) ) //ja atrasta direktorija, peivieno to direktoriju sarakstam
			{
				if( $this_file != "." && $this_file != ".." ) //izvairāmies no ieciklošanās .. un . gadījumā
				{
					$new_dirs[] = "$dir/$this_file";
				}
			}
			else //ja atrada failu 
			{
				$ext = substr($this_file, strrpos($this_file, ".") + 1); 
				if(in_array($ext, $extensions) ) //ja faili ar šādu paplašinājumu ir jāapstrādā, pievieno to failu sarakstam
				{
					$files[] = "$dir/$this_file";
				}
			}
		}
	}
}
//$files=array('faili/gatavie/varet.xml');
//veidojam statistiku no visiem failiem
$cats=Array();
//izveidojam noklusēto verbu
$cats['verbs']=array();
$cats['verbs']['id']='verbs';
$cats['verbs']['name']='verbs';
$cats['verbs']['count']=0;
$cats['verbs']['words']=array();


$sentence_cats=Array();
//izveidojam noklusēto blank
$sentence_cats['blank']=array();
$sentence_cats['blank']['id']='blank';
$sentence_cats['blank']['name']='blank';
$sentence_cats['blank']['count']=0;
$sentence_cats['blank']['combinations']=array();
foreach($files as $file)
{
	if(!file_exists($file))
	{
		echo "Nevar atvērt ".$file."<br />";
		continue;
	}
	
	$saturs=file_get_contents($file);

	$DOMdoc = new DOMDocument();
	if(!@$DOMdoc->loadXML($saturs))
	{
		echo "Nevar atvērt ".$file."<br />";
	}
	$DOMPath = new DOMXPath( $DOMdoc );
	$categories=$DOMPath->query("//CATEGORY");
	$this_cats=Array();
	$this_cats['verbs']=&$cats['verbs'];
	foreach($categories AS $category)
	{
		if(!isset($cats[mb_strtolower($category->nodeValue)]))
		{
			$cats[mb_strtolower($category->nodeValue, 'UTF-8')]=array();
			$cats[mb_strtolower($category->nodeValue, 'UTF-8')]['id']=$category->getAttribute("id");
			$cats[mb_strtolower($category->nodeValue, 'UTF-8')]['name']=$category->nodeValue;
			$cats[mb_strtolower($category->nodeValue, 'UTF-8')]['count']=0;
			$cats[mb_strtolower($category->nodeValue, 'UTF-8')]['words']=array();
		}
		$this_cats[$category->getAttribute("id")]=&$cats[mb_strtolower($category->nodeValue, 'UTF-8')];
	}
	
	$sentence_categories=$DOMPath->query("//SENTENCE_CATEGORY");
	$this_sentence_cats=Array();
	$this_sentence_cats['blank']=&$sentence_cats['blank'];
	foreach($sentence_categories AS $sentence_category)
	{
		if(!isset($sentence_cats[mb_strtolower($sentence_category->nodeValue)]))
		{
			$sentence_cats[mb_strtolower($sentence_category->nodeValue, 'UTF-8')]=array();
			$sentence_cats[mb_strtolower($sentence_category->nodeValue, 'UTF-8')]['id']=$sentence_category->getAttribute("id");
			$sentence_cats[mb_strtolower($sentence_category->nodeValue, 'UTF-8')]['name']=$sentence_category->nodeValue;
			$sentence_cats[mb_strtolower($sentence_category->nodeValue, 'UTF-8')]['count']=0;
			$sentence_cats[mb_strtolower($sentence_category->nodeValue, 'UTF-8')]['combinations']=array();
		}
		$this_sentence_cats[$sentence_category->getAttribute("id")]=&$sentence_cats[mb_strtolower($sentence_category->nodeValue, 'UTF-8')];
	}
	
	$sentences=$DOMPath->query("//SENTENCE");
	foreach($sentences AS $sentence)
	{
		$text=$DOMPath->query("TEXT",$sentence)->item(0);
		$key_insensitive="";
		//uzģenerē teikuma virkni neņemot vērā secību
		foreach($this_cats AS $key=>&$cat)
		{
			if(substr($cat['name'],-1)=='?') continue; //izlaižam kategorijas ar jautājuma zīmi beigās
			$words=$DOMPath->query("WORD[@class='{$key}']",$text);
			foreach($words AS $word)
			{
				$key_insensitive.="<span class=\"{$cat['id']}\">{$cat['name']}</span>";
				if(!isset($cat['words'][$word->getAttribute("attribute")]))
				{
					$cat['words'][$word->getAttribute("attribute")]=0;
				}
				$cat['words'][$word->getAttribute("attribute")]++;
				$cat['count']++;
			}
		}
		
		//uzģenerē teikuma virkni  ņemot vērā secību
		$key="";
		$words=$DOMPath->query("WORD",$text);
		foreach($words AS $word)
		{
			$cat=&$this_cats[$word->getAttribute("class")];
			if(substr($cat['name'],-1)=='?') continue; //izlaižam kategorijas ar jautājuma zīmi beigās
			$key.="<span class=\"{$cat['id']}\">{$cat['name']}</span>";
		}
		
		//pievieno kombināciju masīvam teikumu
		if(!isset($this_sentence_cats[$sentence->getAttribute('CATEGORY')]['combinations'][$key_insensitive]))
		{
			$this_sentence_cats[$sentence->getAttribute('CATEGORY')]['combinations'][$key_insensitive]=Array("count"=>0,"keys"=>Array());
		}
		
		if(!isset($this_sentence_cats[$sentence->getAttribute('CATEGORY')]['combinations'][$key_insensitive]['keys'][$key]))
		{
			$this_sentence_cats[$sentence->getAttribute('CATEGORY')]['combinations'][$key_insensitive]['keys'][$key]=0;
		}
		
		$this_sentence_cats[$sentence->getAttribute('CATEGORY')]['combinations'][$key_insensitive]['count']++;
		$this_sentence_cats[$sentence->getAttribute('CATEGORY')]['combinations'][$key_insensitive]['keys'][$key]++;
		$this_sentence_cats[$sentence->getAttribute('CATEGORY')]['count']++;
	}
}

echo '</pre><div id="atskaite"><div class="combinations"><span id="hide_detail_view">Paslēpt detalizēto skatu</span>';
foreach($sentence_cats AS &$cat) //cikls katrai teikuma kategorijai
{
	echo '<h2 class="'.$cat['id'].'">'.$cat['name'].' '.$cat['count'].'</h2>';
	
	foreach($cat['combinations'] AS &$combination) //cikls katrai kombinācijai
	{
		$max=0;
		$max_c=null;
		foreach($combination['keys'] AS $key=>$value)//cikls lai atrastu populārāko kombināciju
		{
			if($value>$max)
			{
				$max=$value;
				$max_c=$key;
			}
		}
		echo '<h3>'.$max_c.' '.$combination['count'].'</h3>';;
		echo '<table cellspacing="0" cellpadding="0" border="0" class="detail_view"><tr><th>Kombinācija</th><th>Skaits</th></tr>';
		foreach($combination['keys'] AS $key=>$value)
		{
			echo "<tr><td>".$key."</td><td>".$value."</td></tr>";
		}
		echo '</table>';
	}
}
echo '</div>';

echo '<table class="countReport" cellspacing="0" cellpadding="0" border="0"><tr><th>Kategorija</th><th>Skaits</th><th>Grupas</th></tr>';

foreach($cats AS &$cat)
{
	echo '<tr><td><span class="'.$cat['id'].'">'.$cat['name'].'</span></td><td>'.$cat['count'].'</td><td><table cellspacing="0" cellpadding="0" border="0"><tr><th>Grupa</th><th>Skaits</th></tr>';
	foreach($cat['words'] AS $word=>$value)
	{
		echo '<tr><td>'.$word.'</td><td>'.$value.'</td></tr>';	
	}
	echo '</table></td></tr>';

}
echo "</table>";

?>
	</div>
	</body>
</html>