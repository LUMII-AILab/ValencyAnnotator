<?php
include("filetree/php_file_tree.php");
include("category_tree.php");
?>

<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<link rel="stylesheet" href="style.css" type="text/css" />
		<link href="filetree/default.css" rel="stylesheet" type="text/css" />
		<script type="text/javascript" src="jquery.js"></script>
		<script type="text/javascript" src="jquery.json.js"></script>
		<script type="text/javascript" src="markieris.js"></script>
    </head>
    <body>
		<div id="colors"> </div>
		<div style="overflow:auto">
			<div id="file-button" class="tree-button button-large">Failu koks</div>
			<div id="category-button" class="tree-button button-large">Kategoriju koks</div>
		</div>
		<div id="izvele">
			<div id="file-list" class="tree-list">
				<?php echo php_file_tree("faili/"); ?>
			</div>
			<div id="category-list" class="tree-list" style="display:none">
				<?php echo getCategoryTree(); ?>
			</div>
		</div>
        <form method="POST" target="export_frame" action="export.php">
            <input type="hidden" name="file_path" id="file_path" />

            
		
		<div id="teksts">
		
		</div>
            <button name="submit" type="submit" >Eksportēt</button>
        </form>
        <iframe name="export_frame" style="display: none"></iframe>
	</body>
</html>