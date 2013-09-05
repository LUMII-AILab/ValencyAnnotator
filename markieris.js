var kategorija,sentence,first,second,fails,tekstaElements,parent, autosave;
var showIgnored=false;
var colors=['00FF00', 'FFFF00', 'FF00FF', 'FF0000', '00FFFF', 'C00000', '00C000', 'C0C000', '0000FF','099C79','8C1476', '808080', 'FA8072', 'FF4500', '556B2F', '4169E1', '8B4513', 'BC8F8F'];
var colorIndex=0;
var $searchElems, searchIndex;

String.prototype.formatContextMenuValue=function()
{
	var contextMenuValues=['Nom', 'Gen', 'Dat', 'Acc', 'Loc', 'V1', 'V2', 'V3', 'Inf', 'Adv'];
	var exactContextMenuValues=['S','TR'];
	var returnValue=this.toLowerCase();
	for(var i in contextMenuValues)
	{
		returnValue=returnValue.replace(contextMenuValues[i].toLowerCase(),contextMenuValues[i]);
	}
	
	for(var i in exactContextMenuValues)
	{
		if(returnValue==exactContextMenuValues[i].toLowerCase())
			return exactContextMenuValues[i];
	}
	
	return returnValue.charAt(0).toUpperCase() + returnValue.slice(1);
	
}


//papildināta jQuery funkcionalitāte lai iegūtu pilnu html kodu, iekļaujot gan tagus, gan innerHTML
$.fn.htmlInclusive = function() { return $('<div />').append($(this).clone()).html(); }

//metode, lai iegūtu nākamo elementu, ja nākamais elements ir null, izvēlas firstChild no parent.nextSibling
$.fn.nextInLevel = function() {
	var tmp=this.get(0);
	if(tmp.nextSibling!=null)
	{
		tmp=tmp.nextSibling;
	}
	else
	{
		tmp=tmp.parentNode.nextSibling;
		while(tmp.nodeType!=1 && tmp!=null)
			tmp=tmp.nextSibling;
		if(tmp!=NULL)
			tmp=tmp.firstChild;
	}
	return tmp;
};

$.fn.prevInLevel = function() {
	var tmp=this.get(0);
	if(tmp.previousSibling!=null)
	{
		tmp=tmp.previousSibling;
	}
	else
	{
		tmp=tmp.parentNode.previousSibling;
		while(tmp.nodeType!=1 && tmp!=null)
			tmp=tmp.previousSibling;
		if(tmp!=NULL)
			tmp=tmp.firstChild;
	}
	return tmp;
};


$.fn.disableTextSelection = function() {
	this.each(function(){
		var el=this;
		if (typeof el.onselectstart!="undefined") //IE route
			el.onselectstart=function(){return false}
		else if (typeof el.style.MozUserSelect!="undefined") //Firefox route
			el.style.MozUserSelect="none"
		else //All other route (ie: Opera)
			el.onmousedown=function(){return false}
	});
	return this;
};

$.fn.traverseTree = function() {
	this.each(function(){
		var root=this;
		var nodeLength=root.childNodes.length;
		var tmp=root.firstChild;
		var next;
		for(var i=0;i<nodeLength;i++)
		{
			next=tmp.nextSibling;
			if(tmp.nodeType!=1)
			{
				var verbs=tmp.nodeValue.match(/\<([a-z\u00c0-\uffff]+)\>/i);
				if(verbs)
				{
					var fragments=document.createDocumentFragment();
					var tmpEl=document.createElement('span');
					tmpEl.innerHTML=tmp.nodeValue.replace(verbs[0],'<span class="verbs">&lt;'+verbs[1]+'&gt;</span>');
					while(tmpEl.childNodes.length)
					{
						fragments.appendChild(tmpEl.childNodes[0]);
					}
					tmp.parentNode.replaceChild(fragments,tmp);
					$(this).find(".verbs").loadList();
					$(this).traverseTree();
					return true;
				}
				tmp.parentNode.replaceChild(resetText(tmp.nodeValue),tmp);
			}
			else if(tmp.tagName!="SPAN")
			{
				//ja vajag rekursīvi, atkomentēt rindiņu
				//$(tmp).traverseTree();
			}
			tmp=next;
		}
	});
	return this;
};

$.fn.replaceWithText = function() {
	this.each(function(){
		$(this).replaceWith(document.createTextNode(this.innerHTML));
	});
	return this;
};

$.fn.loadList = function() {
	this.each(function(){
		var elem=this;
		$.post("analyzer.php",{'word':$(this).html(),'verbs':($(this).hasClass('verbs') ? 1 : 0)},function(resp) {
			var validResponse=true;
			if(resp.trim()=="")
			{
				validResponse=false;
			}
			try
			{
				var array=$.parseJSON(resp);
			}
			catch(err)
			{
				validResponse=false;
			}
			if(!validResponse)
			{
				alert("Jāiet parunāt ar Pēteri :) Es prasīju analīzi vārdam '"+$(elem).html()+"', serveris atbildēja '"+resp+"'");
				return;
			}
			$(elem).data("json",resp);
			if(!$(elem).data("selectedAtt"))
			{
				$(elem).data("selectedAtt",array[0]);
			}
			$(elem).showContextMenu();
		});
	});
	return this;
};

$.fn.showContextMenu = function() {
	var content="";
	var elem=this.get(0);
	var opts=$.parseJSON($(elem).data("json"));
	for(var i in opts)
	{
		opts[i]=opts[i].formatContextMenuValue();
	}
	$(elem).data("json",$.toJSON(opts));
	$(elem).data("selectedAtt",$(elem).data("selectedAtt").formatContextMenuValue());
	var l=opts.length;
	var found=false;
	for(var i=0;i<l;i++)
	{
		content+='<li';
		if(opts[i]==$(elem).data("selectedAtt"))
		{
			content+=' class="selectedContext"';
			found=true;
		}
		content+=">"+opts[i]+"</li>";
	}
	
	if(!found)
	{
		content='<li class="selectedContext">'+$(elem).data("selectedAtt")+'</li>'+content;
	}

	var offset = this.offset();
	offset.top+=this.height();
	var menu=$('<ul></ul>').addClass("contextMenu").html(content+'<li class="addNew">...</li>').css("top",offset.top).css("left",offset.left).appendTo('body');
	//abpusējā saites
	menu.get(0).s=elem;
	elem.menu=menu.get(0);
	menu.on("mouseup","li",function(event){
		if($(this.parentNode).hasClass("expandedContext"))
		{
			if($(this).hasClass("addNew"))
			{
				$(this.parentNode).find(".selectedContext").removeClass("selectedContext");
				el=$('<li></li>').insertBefore(this).addClass("selectedContext");
				manualMenuClick(el.get(0));
			}
			else
			{
				$(this.parentNode.s).data("selectedAtt",$(this).html());
				$(this.parentNode).find(".selectedContext").removeClass("selectedContext");
				$(this).addClass("selectedContext");
			}
		}
		else
		{
			$(".expandedContext").removeClass("expandedContext");
			$(this.parentNode).addClass("expandedContext");
			event.stopPropagation();
		}
	});
	menu.find("li").bind("contextmenu",function(e){
		return false;
	});
	return this;
};

$.fn.manualContextMenu = function() {
	var content="";
	var elem=this.get(0);
	var offset = this.offset();
	offset.top+=this.height();
	var menu;
	//lai pārbaudītu, vai tiek veidots jauns vārds, vai atjaunots saglabātais
	if(this.data("selectedAtt"))
	{
		menu=$('<ul></ul>').addClass("contextMenu").html('<li class="selectedContext">'+$(this).data("selectedAtt")+'</li>').css("top",offset.top).css("left",offset.left).appendTo('body');
		menu.find("li").bind('mouseup', function(event){manualMenuClick(this)});
	}
	else
	{
		menu=$('<ul></ul>').addClass("contextMenu").html('<li class="selectedContext"><input type="text" /></li>').css("top",offset.top).css("left",offset.left).appendTo('body');
		menu.find("input").focus().focusout(function(){
			$(this.parentNode.parentNode.s).data("selectedAtt",$(this).val());
			$(this).parent().bind('mouseup', function(event){manualMenuClick(this)});
			$(this).parent().html($(this).val());
		});
	}
	//abpusējā saites
	menu.get(0).s=elem;
	elem.menu=menu.get(0);
	$(elem).data("json",false);
	menu.find("li").bind("contextmenu",function(e){
		return false;
	});
	
	return this;
};




//metode, lai repozicionētu izvēlnes
function reposition() {
	$(".contextMenu").each(function(){
		var offset = $(this.s).offset();
		offset.top+=$(this.s).height();
		$(this).css("top",offset.top).css("left",offset.left);
	});
};


function manualMenuClick(el){
	var field=$('<input type="text" />');
	$(el).append(field);
	field.focus();
	field.bind('mouseup',function(e){
		e.stopPropagation();
	});
	field.focusout(function(){
		var elem=this.parentNode.parentNode.s;
		$(elem).data("selectedAtt",$(this).val().formatContextMenuValue());
		var data=eval($(elem).data("json"));
		data.push($(this).val().formatContextMenuValue());
		$(elem).data("json",$.toJSON(data));
		$(this).parent().html($(this).val().formatContextMenuValue());
	});
}

function resetText(teksts)
{
	var fragments=document.createDocumentFragment();
	var tmpEl=document.createElement('span');
	tmpEl.innerHTML=teksts.replace(/([a-z\u00c0-\uffff]+|\S)/ig,'<span class="blank">$1</span>');
	while(tmpEl.childNodes.length)
	{
		fragments.appendChild(tmpEl.childNodes[0]);
	}
	return fragments;
}

function compareElements(a,b)
{
		if($(tekstaElements).find("span").index(a)==$(tekstaElements).find("span").index(b))
		{
			return 0;
		}
		else if($(tekstaElements).find("span").index(a)<$(tekstaElements).find("span").index(b))
		{
			return -1;
		}
		else
		{
			return 1;
		}
}

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

function finderShow()
{
	var $elem=$searchElems.eq(searchIndex);
	$(".finder_highlighted").removeClass("finder_highlighted");
	var $container=$elem.closest("td");
	$container.addClass("finder_highlighted");
	$('html, body').animate({
				scrollTop: $container.offset().top-75
			}, "mediium");
	$("#finder_statistics").text((searchIndex+1)+"/"+$searchElems.size());
}

function finderInitialize()
{
	searchIndex=0;
	
	if($('#finder_dialog').size()==0)
	{
		$("<div></div>").attr("id","finder_dialog").html('<span class="button" id="finder_prev">Iepr.</span> <span id="finder_statistics"></span> <span class="button" id="finder_next">Nāk.</span> <img src="img/remove.png" id="finder_close" />').appendTo("#teksts");
		
		$("#finder_close").click(function() {
			$("#finder_dialog").remove();
			$(".finder_highlighted").removeClass("finder_highlighted");
		});
		
		$("#finder_prev").click(function(){
			searchIndex--;
			if(searchIndex<0)
			{
				searchIndex=$searchElems.size()-1;
			}
			finderShow();
		});
		
		$("#finder_next").click(function(){
			searchIndex=(searchIndex+1)%$searchElems.size();
			finderShow();
		});
	}
	
	finderShow();
}

function newFile(resp)
{	
	//novācam veco conextMenu
	$(".contextMenu").remove();
	//pārbaudam vai jaunā faila ielādē servera pusē nav radusies kļūda
	try
	{
		var data=$.parseJSON(resp);
	}
	catch(err)
	{
		//iztukšojam faila nosaukumu, lai nevarētu pārglabāt
		fails=false;
		alert(resp);
		return;
	}
	$("#file_path").val(fails);
	//atjauno kategorijas
	$("#colors").html('<div id="addNew"><img src="img/add.png" /></div><div id="dzest">Dzēst</div><div id="saglabat">Saglabāt!<br /><span id="autosave"></span></div><div id="statistika">Statistika <input type="checkbox" id="ignoreAgenss" /> </div><div id="addNewSentence"><img src="img/add.png" /> Jauna teikuma kategorija</div><div id="sortBySentence"><img src="img/sort.png" /> Kārtot teikumus</div>');
	$("#ignoreAgenss").click(function(e){
		e.stopPropagation();
	});
	for(var cat in data.category)
	{
		var elem=$('<div></div>').attr({"id":data.category[cat]['id'],"class":"color"}).html(data.category[cat]['name']+' <span class="close"><img src="img/remove.png" /></span>').insertBefore("#addNew");
		elem.bind('mouseup', function(event){colorClick(event,this)});
		elem.bind("contextmenu",function(e){
			return false;
		});
	}
	
	for(var cat in data.sentence_category)
	{
		var elem=$('<div></div>').attr({"id":data.sentence_category[cat]['id'],"class":"sentence"}).html(data.sentence_category[cat]['name']+' <span class="close"><img src="img/remove.png" /></span>').insertBefore("#addNewSentence");
		elem.bind('mouseup', function(event){sentenceClick(event,this)});
		elem.bind("contextmenu",function(e){
			return false;
		});
	}
	
	var text="";
	text+='<table class="lines" cellspacing="0" cellpadding="0" border="0">';
	for(var sentence in data.sentences)
	{
		text+='<tr class="line"><td><div class="icons"><img src="img/remove.png" class="remove" /><img src="img/icon_edit.gif" class="edit" /><input type="checkbox" name="export_items[]" value="'+sentence+'" /><div class='+data.sentences[sentence]['category']+'>&nbsp;</div></div><div class="text">'+data.sentences[sentence]['text']+'</div><td><textarea class="comment">'+data.sentences[sentence]['comment']+'</textarea></td></tr>';
	}
	text+='</table>';
	$("#teksts").html(text+'<div id="atskaite"></div>');
	$(".lines").find(".verbs").each(function(){
		$(this).html("&lt;"+$(this).html()+"&gt;");
	});
	//apstrādā iepriekš sazīmēto tekstu
	$(".lines").find("span").each(function(){
		$(this).data("selectedAtt",$(this).attr("attribute"));
		$(this).removeAttr("attribute").bind("contextmenu",function(e){return false;});;
		//pārbauda vai izvēlne ir jau ģenerēta, ja nav, uzģenerē to
		if($(this).attr("json"))
		{
			$(this).data("json",$(this).attr("json").replace(/'/g,'"'));
			$(this).removeAttr("json");
			$(this).showContextMenu();
		}
		else
		{
			$(this).loadList();
		}
		
	});
	$(".text").disableTextSelection();
	$(".lines").on('click','.edit',function(){
		var el=$(this).parent().parent().find(".text");
		var resp = prompt("Teksta labošana",el.text());
		if(resp && resp!=el.text())
		{
			el.find('span').each(function(){
				$(this.menu).remove();
			});
			el.text(resp);
			el.traverseTree();
			reposition();
		}
	});
	$(".lines").on('click','.remove',function(){
		var resp = confirm("Vai patiešām dzēst rindu?");
		if(resp)
		{
			$(this).parent().parent().parent().remove();
			reposition();
		}
	});
	$(".lines").on('mouseup','textarea',function(){
		reposition();
	});
	markieris();
	
	$("#atskaite").on('click','.finder_category',function(){
		var filterClass=$(this).find("span").attr("class");
		$searchElems=$(".lines").find("."+filterClass);
		finderInitialize();
	});
	
	$("#atskaite").on('click','.finder_group',function(){
		var filterGroup=$(this).text();
		var filterClass=$(this).closest(".finder_row").find(".finder_category").find("span").attr("class");
		$searchElems=$(".lines").find("."+filterClass).filter(function(){
			if($(this).data("selectedAtt")==filterGroup) return true;
			else return false;
		});
		finderInitialize();
	});
	
	$("#statistika").on('click',function() {
		if(!fails) return false;
		$(".text").data("code","");
		
		$(".text").find(".verbs").each(function(){
			$(this).parent().data("code",$(this).parent().data("code")+'<span class="verbs">verbs</span>');
		});
		
		var ignoreAgenss=$("#ignoreAgenss").get(0).checked;
		
		$(".color").each(function(){
			var id=$(this).attr("id");
			//ignorējam agenss
			if(id=="cFFFF00" && ignoreAgenss)
				return;
			var value=$(this).text();
			//ja beidzas ar jautājuma zīmi, ignorēt šo kategoriju
			if(value.indexOf("?")==-1)
			{
				$(".text").find("."+id).each(function(){
					$(this).parent().data("code",$(this).parent().data("code")+'<span class="'+id+'">'+value.trim()+'</span>');
				});
			}
		});
		
		var results={};
		$(".text").each(function(){
			var seq="";
			$(this).find("span").each(function(){
				if(!$(this).hasClass("blank"))
				{
					//ja beidzas ar jautājuma zīmi, ignorēt šo kategoriju
					var value=$(this).attr("class");
					if($("#"+$(this).attr("class")).text().indexOf("?")==-1)
					{
						seq+='<span class="'+$(this).attr("class")+'">'+($(this).attr("class")=="verbs" ? "verbs" : $("#"+$(this).attr("class")).text().trim())+'</span>';
					}
				}
			});
			var sc;
			sc=$(this).parent().find('.icons').find('div').attr("class");
			
			if(results[sc])
			{
				results[sc]['skaits']++;
			}
			else
			{
				results[sc]={};
				results[sc]['skaits']=1;
				results[sc]['codes']={};
			}
			var c=$(this).data("code");
			if(results[sc]['codes'][c])
			{
				results[sc]['codes'][c]['skaits']++;
			}
			else
			{
				results[sc]['codes'][c]={};
				results[sc]['codes'][c]['skaits']=1;
				results[sc]['codes'][c]['seq']={};
			}
			
			if(results[sc]['codes'][c]['seq'][seq])
			{
				results[sc]['codes'][c]['seq'][seq]++;
			}
			else
			{
				results[sc]['codes'][c]['seq'][seq]=1;
			}
		});
		var combinations='<div class="combinations"><span id="hide_detail_view">Paslēpt detalizēto skatu</span>';
		for(sc in results)
		{
			
			combinations+='<h2 class="'+sc+'">'+(sc=="blank" ? "blank" : $('#'+sc).text().trim())+' '+results[sc]['skaits']+'</h2>';
			for(r in results[sc]['codes'])
			{
				//atrod populārāko kombināciju
				var hadAgenss=false;
				var popular,max=0;
				for(s in results[sc]['codes'][r]['seq'])
				{
					if(results[sc]['codes'][r]['seq'][s]>max)
					{
						max=results[sc]['codes'][r]['seq'][s];
						popular=s;
					}
					
					if(s.indexOf("cFFFF00") !=-1)
					{
						hadAgenss=true;
					}
				}
				
				if(ignoreAgenss && popular.indexOf("cFFFF00") ==-1 && hadAgenss)
				{
					popular+='<span class="cFFFF00">'+$("#cFFFF00").text()+'</span>';
				}
				else
				{
					popular=popular.replace('<span class="cFFFF00">'+$("#cFFFF00").text().trim()+'</span>','<span class="cFFFF00">'+$("#cFFFF00").text().trim()+'</span>');
				}
				
				combinations+='<h3>'+popular+' '+results[sc]['codes'][r]['skaits']+'</h3>';
				combinations+='<table cellspacing="0" cellpadding="0" border="0" class="detail_view"><tr><th>Kombinācija</th><th>Skaits</th></tr>';
				for(s in results[sc]['codes'][r]['seq'])
				{
					combinations+="<tr><td>"+s+"</td><td>"+results[sc]['codes'][r]['seq'][s]+"</td></tr>";
				}
				combinations+='</table>';
			}
		}
		combinations+="</div>";
		
		var countReport='<table class="countReport" cellspacing="0" cellpadding="0" border="0"><tr><th>Kategorija</th><th>Skaits</th><th>Grupas</th></tr>';		
		$(".color").each(function(){
			var id=$(this).attr("id");
			var res={};
			var i=0;
			$(".lines").find("."+id).each(function(){
				if(res[$(this).data("selectedAtt")])
				{
					res[$(this).data("selectedAtt")]++;
				}
				else
				{
					res[$(this).data("selectedAtt")]=1;
				}
				i++;
			});
			countReport+='<tr class="finder_row"><td class="finder_category"><span class="'+id+'">'+$(this).text().trim()+'</span></td><td>'+i+'</td><td><table cellspacing="0" cellpadding="0" border="0"><tr><th>Grupa</th><th>Skaits</th></tr>';
			for(var c in res)
			{
				countReport+='<tr><td class="finder_group">'+c+'</td><td>'+res[c]+'</td></tr>';	
			}
			countReport+='</table></td></tr>';	
		});
		var res={};
		var i=0;
		$(".lines").find(".verbs").each(function(){
			if(res[$(this).data("selectedAtt")])
			{
				res[$(this).data("selectedAtt")]++;
			}
			else
			{
				res[$(this).data("selectedAtt")]=1;
			}
			i++;
		});
		countReport+='<tr class="finder_row"><td class="finder_category"><span class="verbs">Verbs</span></td><td>'+i+'</td><td><table cellspacing="0" cellpadding="0" border="0"><tr><th>Grupa</th><th>Skaits</th></tr>';
		for(var c in res)
		{
			countReport+='<tr><td class="finder_group">'+c+'</td><td>'+res[c]+'</td></tr>';	
		}
		countReport+='</table></td></tr>';	
		
		countReport+="</table>";
		$("#atskaite").html(combinations+countReport);
		window.location.href="#atskaite";
	});
	
	$("#saglabat").on('click',function() {
		autoSave();
	});
	clearTimeout(autosave);
	autoSave();
	$(window).unbind("unload");
	$(window).unload(function() {
	  	var answer = confirm("Failā veiktās izmaiņas var nebūt saglabātas! Vai saglabāt pirms aiziešanas?");
		if (answer){
			if(!fails) return false;
			var data={};
			data['category']=[];
			$(".color").each(function(){
				var tmpArr={};
				tmpArr["id"]=this.id;
				tmpArr["name"]=$(this).text();
				data['category'].push(tmpArr);
			});
			data['sentences']=[];
			$(".line").each(function(){
				var tmpArr={};
				var text=$(this).find(".text").clone(true,true);
				text.find("img").remove();
				text.find(".blank").replaceWithText();
				text.find("span").each(function(){
					$(this).attr("attribute",$(this).data("selectedAtt"));
					if($(this).data("json")!==false)
					{
						$(this).attr("json",$(this).data("json").replace(/"/g,"'"));
					}
				});
				tmpArr['text']=text.html().replace(/&lt;/g, '').replace(/&gt;/g, '');
				tmpArr['comment']=$(this).find(".comment").val();
				$(this).find(".icons").each(function(){
					tmpArr['category']=$(this).find("div").attr("class");
				});
				data['sentences'].push(tmpArr);
			});
			data['fails']=fails;
			$.ajax({url:"savefile.php",data:$.toJSON(data),type:"POST",async:false});
		}
	});
	alert("Fails ielādēts!");
};

function autoSave()
{
		if(!fails) return false;
		var data={};
		data['category']=[];
		$(".color").each(function(){
			var tmpArr={};
			tmpArr["id"]=this.id;
			tmpArr["name"]=$(this).text();
			data['category'].push(tmpArr);
		});
		data['sentence_category']=[];
		$(".sentence").each(function(){
			var tmpArr={};
			tmpArr["id"]=this.id;
			tmpArr["name"]=$(this).text();
			data['sentence_category'].push(tmpArr);
		});
		data['sentences']=[];
		$(".line").each(function(){
			var tmpArr={};
			var text=$(this).find(".text").clone(true,true);
			text.find("img").remove();
			text.find(".blank").replaceWithText();
			text.find("span").each(function(){
				$(this).attr("attribute",$(this).data("selectedAtt"));
				if($(this).data("json")!==false && $(this).data("json"))
				{
					$(this).attr("json",$(this).data("json").replace(/"/g,"'"));
				}
			});
			tmpArr['text']=text.html().replace(/&lt;/g, '').replace(/&gt;/g, '');
			tmpArr['comment']=$(this).find(".comment").val();
			$(this).find(".icons").each(function(){
				tmpArr['category']=$(this).find("div").attr("class");
			});
			data['sentences'].push(tmpArr);
		});
		data['fails']=fails;
		$.post("savefile.php",{data:$.toJSON(data)}, function(resp) {
			try
			{
				var data=$.parseJSON(resp);
			}
			catch(err)
			{
				alert(resp);
				return;
			}
			var currentTime = new Date();
			var hours = currentTime.getHours();
			if (hours < 10){
				hours = "0" + hours;
			}
			var minutes = currentTime.getMinutes();
			if (minutes < 10){
				minutes = "0" + minutes;
			}
			var seconds = currentTime.getSeconds();
			if (seconds < 10){
				seconds = "0" + seconds;
			}
			clearTimeout(autosave);
			$("#autosave").html("Saglabāts "+hours+":"+minutes);
			autosave = setTimeout(function(){autoSave()},30000);
		});
}

$(document).ready(function() { 
	$("#colors").height($(window).height()-20);
	$(window).resize(function() {
		$("#colors").height($(window).height()-20);
		reposition();
	});
	
	//pievienojam visām klasēm nodefinētās krāsas
	for(var i=0;i<colors.length;i++)
	{
		addCSSRule(".c"+colors[i]+", "+"#c"+colors[i]+", .s"+colors[i]+", "+"#s"+colors[i],"background-color","#"+colors[i])
	}
	
	$("body").on("mouseup", function(){
		$(".expandedContext").removeClass("expandedContext");
	});
	
	$(".tree-button").click(function(){
		$(".tree-list").hide();
		$("#"+$(this).attr("id").replace("button","list")).show();
	});
	
	//FileTree
	// Hide all subfolders at startup
	$(".php-file-tree").find("UL").hide();

	// Expand/collapse on click
	$(".php-file-tree").on('click','.pft-directory', function() {
		$(this).find("UL:first").slideToggle("medium");
		return false;
	});

	$(".php-file-tree").on('click','.file', function() {
		fails=$(this).attr('rel');
		if(fails.substring(fails.length-3) == "txt" && $("a[rel='"+fails.replace(/^faili\/txt/,"faili/xml").replace(/\.txt/,".xml")+"']").length)
		{
			var c=confirm("Atverot txt failu, iepriekš saglabātā versija tiks izdzēsta. Vai patiešām turpināt?");
			if(!c)
			{
				return;
			}
		}
		//atceļam autosave
		clearTimeout(autosave);
		$.post("loadfile.php",{'file':$(this).attr('rel')},function(resp) {newFile(resp)});
		return false;
		
	});
	//EndFileTree
	tekstaElements = $("#teksts");
	
	//kategorijas noņemšanas pogas click
	$("#colors").on('click','.close', function() {
		var c=confirm("Vai dzēst?");
		if(!c) return;
		var el=$(this).parent();
		
		//izdzēšam visu sastrādāto
		if(el.hasClass("sentence"))
		{
			$("."+el.attr("id")).attr("class","blank");
		}
		else
		{
			$("."+el.attr("id")).each(function(){
				$(this.menu).remove();
				this.parentNode.replaceChild(resetText(this.innerHTML.replace(/\<strong\>/i,"").replace(/\<\/strong\>/i,"")),this);
			});
		}
		el.remove();
	});
	
	$('body').on('click','#hide_detail_view', function() {
		$(".combinations").find('.detail_view').toggle();
	});
});



function colorClick(event, el)
{
	//ja labais klikškis
	if(event.which==3)
	{
		var field=$('<input type="text" />').val($(el).text());
		$(el).html("").append(field);
		field.focus();
		$(el).unbind('mouseup');
		field.focusout(function(){
			$($(this).parent()).bind('mouseup', function(event){colorClick(event,this)});
			$(this).parent().html($(this).val()+' <span class="close"><img src="img/remove.png" /></span>');
		});
	}

	//pārbaudam vai ir uzstādīta kategorija lai izvairītos no kļūdas sākumā
	if(kategorija!==false)
		kategorija.css("border","1px solid #000000").css("padding","5px");
	if(sentence!==false)
	{
		sentence.css("border","1px solid #000000").css("padding","5px");
		sentence=false;
	}
	kategorija=$(el);
	kategorija.css("border","3px solid #000000").css("padding","3px");
	return false;
};



function sentenceClick(event, el)
{
	//ja labais klikškis
	if(event.which==3)
	{
		var field=$('<input type="text" />').val($(el).text());
		$(el).html("").append(field);
		field.focus();
		$(el).unbind('mouseup');
		field.focusout(function(){
			$($(this).parent()).bind('mouseup', function(event){sentenceClick(event,this)});
			$(this).parent().html($(this).val()+' <span class="close"><img src="img/remove.png" /></span>');
		});
	}

	//pārbaudam vai ir uzstādīta kategorija lai izvairītos no kļūdas sākumā
	if(sentence!==false)
		sentence.css("border","1px solid #000000").css("padding","5px");
	if(kategorija!==false)
	{
		kategorija.css("border","1px solid #000000").css("padding","5px");
		kategorija=false;
	}
	sentence=$(el);
	sentence.css("border","3px solid #000000").css("padding","3px");
	return false;
};



//inicializācia
function markieris()
{
	kategorija=false;	
	sentence=false;	
	$(".text").traverseTree();
	$(".text").on('mousedown','span',function(event) {
			//pārbaudam vai ir izvēlēta kategorija, tā var nebūt izvēlēta darba sākumā
			if(kategorija===false)
			{
				if(sentence===false)
					alert("Vispirms izvēlies kategoriju!");
				return false;
			}
			//dzēšana
			if(kategorija.attr("id")=="dzest")
			{
				if(!$(this).hasClass("verbs"))
				{
					$(this.menu).remove();
					this.parentNode.replaceChild(resetText(this.innerHTML.replace(/\<strong\>/i,"").replace(/\<\/strong\>/i,"")),this);
				}
				return false;
			}
			//iezīmēt var tikai ar kreiso taustiņu, ar labo taustiņu parādīsim galvenā vārda izvēli
			if(event.which==3)
			{
				//neļaujam izvēlēties gavleno failu no neiekrāsota elementa
				if($(this).hasClass("blank"))
					return false;
				$(this).bind("mouseup", function(){
					$(this).unbind("mouseup");
					$(this).find("STRONG").each(function(){
						$(this).replaceWith($("<span></span>").addClass("galvenais").html($(this).html()));
					});
					$(this).traverseTree();
					$(this).find("span").click(function(e){
						p=$(this).parent();
						$(this).replaceWith($("<strong></strong>").html($(this).html()));
						p.find("span").each(function(){
							$(this).replaceWith($(this).html());
						});
						$("#overlay").remove();
						$(p).removeClass("edited").unbind("mousedown");
						e.stopPropagation();
					});
					$(this).unbind("mouseup");
					$(this).addClass("edited");
					$("<div></div>").attr("id","overlay").appendTo("body").click(function(){
						$(".edited").find(".galvenais").each(function(){$(this).replaceWith($("<strong></strong>").html($(this).html()))});
						$(".edited").find("span").each(function(){
							$(this).replaceWith($(this).html());
						});
						$(".edited").removeClass("edited").unbind("mousedown");
						$(this).remove();
					});
				}).on("mousedown", function(e){e.stopPropagation();});
				return false;
			}
			first=this;second=this;parent=this.parentNode;
			$(this).addClass('tmp');
			$(parent).on('mouseenter','span',function(){
				//nonemam ieprieksejas klases
				$('.tmp').removeClass('tmp');
				second=this;
				var tmp=first;
				var end=second;
				//atrodam pareizo secibu, ciklojamies cauri elementiem
				if(compareElements(first,second)<1)
				{
					while(tmp!=end && !$(tmp).hasClass("verbs"))
					{
						if(tmp.nodeType==1)
						{
							$(tmp).addClass('tmp');
						}
						tmp=$(tmp).nextInLevel();
					}
				}
				else
				{
					while(tmp!=end && !$(tmp).hasClass("verbs"))
					{
						if(tmp.nodeType==1)
						{
							$(tmp).addClass('tmp');
						}
						tmp=$(tmp).prevInLevel();
					}
				}
				//neļaujam iezīmēt pāri verbam
				if($(tmp).hasClass("verbs"))
				{
					second=tmp;
					if(compareElements(first,second)<1)
					{
						do{
							second=$(second).prevInLevel();
						}while(second.nodeType!=1 && second!=null)
					}
					else
					{
						do{
							second=$(second).nextInLevel();
						}while(second.nodeType!=1)
					}
				}
				else
				{
					$(tmp).addClass('tmp');
				}
			});
			
			$(document).on('mouseup mouseleave',function() {
				$(document).unbind('mouseup mouseleave');
				$(parent).unbind('mouseenter');
				//izvairāmies no izvēlnes pārlādēšanas, ja uzklikšķina uz viena vārda
				if(compareElements(first,second)==0 && !$(first).hasClass("blank"))
				{
					$('.tmp').removeClass('tmp');
					return false;
				}
				if(compareElements(first,second)<1)
				{
					tmp=first;
					end=second;

				}
				else
				{
					tmp=second;
					end=first;
				}
				var text="";
				var prev;
				while(tmp!=end)
				{
					if(tmp.nodeType==1)
					{
						//ja tas ir hidden elements, kopējam visu tagu, ne tikai html
						if($(tmp).hasClass("ignore"))
							text+=$(tmp).htmlInclusive();
						else if(tmp.tagName=="SPAN")
							text+=tmp.innerHTML.replace(/\<strong\>/i,"").replace(/\<\/strong\>/i,"");	
							//text+=$(tmp).text();	
						//noņemam eksistējošo contextMenu,ja tāds ir
						$(tmp.menu).remove();
					}
					else
					{
						text+=tmp.nodeValue;
					}
					prev=tmp;
					if(tmp.nextSibling!=null)
					{
						tmp=tmp.nextSibling;
					}
					else
					{
						
						tmp=tmp.parentNode.nextSibling;
						while(tmp.nodeType!=1)
							tmp=tmp.nextSibling;
						tmp=tmp.firstChild;
					}
					prev.parentNode.removeChild(prev);
				}
				text+=tmp.innerHTML;
				//noņemam eksistējošo contextMenu,ja tāds ir
				$(tmp.menu).remove();
				var newSpan = document.createElement('span');
				newSpan.className=kategorija.attr("id");
				newSpan.innerHTML=text;
				tmp.parentNode.replaceChild(newSpan, tmp);
				
				
				//ja automātiski
				$(newSpan).loadList();

					
				
				$(newSpan).bind("contextmenu",function(e){
					return false;
				});
				$('.tmp').removeClass('tmp');
			});
	});
	
	
			
	$(".line").on('click', '.text, .icons',function(){
		if(sentence===false)
			return;
			
		$(this).parent().find(".icons").each(function(){
			$(this).find("div").attr("class",sentence.attr("id"));
		});
	});
	
	$("#addNew").click(function(){
		//atrod pirmo brīvo krāsu
		colorIndex=0;
		while($("#c"+colors[colorIndex]).length && colors[colorIndex]) colorIndex++;
		if(!colors[colorIndex])
		{
			alert("Maksimālais kategoriju skaits sasniegts, nevar pievienot jaunu kategoriju!");
			return;
		}
		var field=$('<input type="text" />');
		var elem=$('<div></div>').append(field).attr({"id":"c"+colors[colorIndex],"class":"color"}).insertBefore(this);
		if(kategorija!==false)
			kategorija.css("border","1px solid #000000").css("padding","5px");
		if(sentence!==false)
		{
			sentence.css("border","1px solid #000000").css("padding","5px");
			sentence=false;
		}
		kategorija=elem;
		kategorija.css("border","3px solid #000000").css("padding","3px");
		field.focus();
		field.focusout(function(){
			$($(this).parent()).bind('mouseup', function(event){colorClick(event,this)});
			$(this).parent().html($(this).val()+' <span class="close"><img src="img/remove.png" /></span>');
		});
		elem.bind("contextmenu",function(e){
			return false;
		});
	});
	
	$("#sortBySentence").click(function(){
		var sentence_categories={};
		sentence_categories['blank']=-1;
		$("#colors").find(".sentence").each(function(index){
			sentence_categories[$(this).attr("id")]=index;
		});
	
		var $linesContainer=$(".lines");
	
		var list = $linesContainer.find(".line").get();
		list.sort(function(a,b){
			var $a=$(a);
			var $b=$(b);
			var valA=sentence_categories[$a.find(".icons").children("div").attr("class")];
			var valB=sentence_categories[$b.find(".icons").children("div").attr("class")];
			if(valA<valB)
			{
				return -1;
			}
			else if(valA==valB)
			{
				return 0;
			}
			else if(valA>valB)
			{
				return 1;
			}
		});
		for (var i = 0; i < list.length; i++) {
			$linesContainer.append(list[i]);
		}
	
		alert("Sakārtots!");
	});
	
	$("#addNewSentence").click(function(){
		//atrod pirmo brīvo krāsu
		colorIndex=0;
		while($("#s"+colors[colorIndex]).length && colors[colorIndex]) colorIndex++;
		if(!colors[colorIndex])
		{
			alert("Maksimālais kategoriju skaits sasniegts, nevar pievienot jaunu kategoriju!");
			return;
		}
		var field=$('<input type="text" />');
		var elem=$('<div></div>').append(field).attr({"id":"s"+colors[colorIndex],"class":"sentence"}).insertBefore(this);
		if(sentence!==false)
			sentence.css("border","1px solid #000000").css("padding","5px");
		if(kategorija!==false)
		{
			kategorija.css("border","1px solid #000000").css("padding","5px");
			kategorija=false;
		}
		sentence=elem;
		sentence.css("border","3px solid #000000").css("padding","3px");
		field.focus();
		field.focusout(function(){
			$($(this).parent()).bind('mouseup', function(event){sentenceClick(event,this)});
			$(this).parent().html($(this).val()+' <span class="close"><img src="img/remove.png" /></span>');
		});
		elem.bind("contextmenu",function(e){
			return false;
		});
	});
	
	$("#dzest").click(function(){
		//pārbaudam vai ir uzstādīta kategorija lai izvairītos no kļūdas sākumā
		if(kategorija!==false)
			kategorija.css("border","1px solid #000000").css("padding","5px");
		kategorija=$(this);
		kategorija.css("border","3px solid #000000").css("padding","3px");
	});
}