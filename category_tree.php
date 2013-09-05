<?php

function getCategoryTree()
{
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

	$cats=Array();
	$sentence_cats=Array();
	foreach($files as $file)
	{
		if(!file_exists($file))
		{
			//echo "Nevar atvērt ".$file."<br />";
			continue;
		}
		
		$saturs=file_get_contents($file);

		$DOMdoc = new DOMDocument();
		if(!@$DOMdoc->loadXML($saturs))
		{
			//echo "Nevar atvērt ".$file."<br />";
			continue;
		}
		$DOMPath = new DOMXPath( $DOMdoc );
		$categories=$DOMPath->query("//CATEGORY");
		foreach($categories AS $category)
		{
			$key=mb_strtolower($category->nodeValue, 'UTF-8');
			if(!isset($cats[$key]))
			{
				$cats[$key]=array();
				$cats[$key]['id']=$category->getAttribute("id");
				$cats[$key]['name']=$category->nodeValue;
				$cats[$key]['files']=array();
			}
			$cats[$key]['files'][]=$file;
		}
		
		$sentence_categories=$DOMPath->query("//SENTENCE_CATEGORY");
		foreach($sentence_categories AS $sentence_category)
		{
			$key=mb_strtolower($sentence_category->nodeValue, 'UTF-8');
			if(!isset($sentence_cats[$key]))
			{
				$sentence_cats[$key]=array();
				$sentence_cats[$key]['id']=$sentence_category->getAttribute("id");
				$sentence_cats[$key]['name']=$sentence_category->nodeValue;
				$sentence_cats[$key]['files']=array();
			}
			$sentence_cats[$key]['files'][]=$file;
			
		}
	}
	
	
	/*
	echo "<pre>".print_r($cats,true)."</pre>";
	echo "<pre>".print_r($sentence_cats,true)."</pre>";
	*/
	ksort($cats);
	ksort($sentence_cats);
	$resp='<ul class="php-file-tree">';
	 
	$resp.='
	<li class="pft-directory">
		<a href="#">Vārdu kategorijas</a>
		<ul style="display:none">
	';
	foreach($cats AS $cat)
	{
		$resp.='
			<li class="pft-directory">
				<a href="#">'.$cat['name'].'</a>
				<ul style="display:none">
			';
		sort($cat['files']);
		foreach($cat['files'] AS $file)
		{
			$resp.='
					<li class="pft-file ext-xml">
						<a class="file" rel="'.urlencode($file).'" href="#">'.$file.'</a>
					</li>
			';
		}
			
		$resp.='
				</ul>
			</li>
		';
	}
	$resp.='</ul></li>';
	
	$resp.='
	<li class="pft-directory">
		<a href="#">Teikumu kategorijas</a>
		<ul style="display:none">
	';
	foreach($sentence_cats AS $cat)
	{
		$resp.='
			<li class="pft-directory">
				<a href="#">'.$cat['name'].'</a>
				<ul style="display:none">
			';
		sort($cat['files']);
		foreach($cat['files'] AS $file)
		{
			$resp.='
					<li class="pft-file ext-xml">
						<a class="file" rel="'.$file.'" href="#">'.$file.'</a>
					</li>
			';
		}
			
		$resp.='
				</ul>
			</li>
		';
	}
	$resp.='</ul></li>';
	
	$resp.='</ul>';
	
	return $resp;
	
}

?>