// Search the bookmarks when entering the search keyword.
$(function() {
    build_booksmarks_tree();
});

var bookmarks = {folders:[], marks:[], empties:[], duplicates:[]},
	node_cache = [];

var NODE = function(props){
	this.id = props.id;
	this.title = props.title;
	this.type = props.type;
	
	if(this.type == 'link'){
		this.url = props.url;
	}
}

function check_in_cache(node){
	
	for(var x=0; x<node_cache.length; x++ ){
		var test_node = node_cache[x];
		
		if( test_node.id == node.id ){
			return true;
		}
		
		if( test_node.url && node.url && (test_node.url == node.url) ){
			return test_node;
		}
		//if( test_node.type == 'folder' ){}
		if( test_node.title == node.title ){
			return test_node;
		}
	}
	
	//node_cache.forEach(function(test_node, i){});
	
	return false;
}
function check_and_cache(node, callback){
	var simple_node = new NODE(node);
	var cached_node = check_in_cache(simple_node);
	
	//console.log("is dup:",is_in_cache,node.id);
	
	if(cached_node === true){
		//same node...so skip?
		
	}else if(cached_node !== false){
		console.log("is dup:",cached_node.id,node.id);
		if( node.children && node.children.length > 0 ){
			merge_folders(cached_node, node);
		}
		bookmarks.duplicates.push(node.id);
	}else{
		node_cache.push( simple_node );
		
		if( callback && typeof callback == 'function' ){ callback(node); }
	}

}


function build_booksmarks_tree(){

	chrome.bookmarks.getTree(function(nodes){
		for( var i in nodes ){
			var node = nodes[i];
			//console.log(node);
			parse_children(node, cleanup_bookmarks);
		}
	});
}

function parse_children(node, callback){
	//console.log("PARSE");
	if(node.children && node.children.length > 0){
		var children = node.children;
		for( var x=0; x<children.length; x++ ){
			var child = children[x];
			node.type = 'folder';
			
			//console.log(node);
			check_and_cache(node, function(node){
				bookmarks.folders.push(node);
			});
			
			parse_children(child);
		}
		
	}else if(node.children && node.children.length == 0){
	//	console.log('Empty folder:', node.title);
		//delete empty folder
		node.type = 'folder';
		bookmarks.empties.push(node);
	}else{
		node.type = 'link';
		
		check_and_cache(node, function(node){
			bookmarks.marks.push(node);
		});
	}
	
	if( callback && typeof callback == 'function' ){ callback(); }
}

function merge_folders(a,b){
	console.log("Copying elements from "+a.title+" to "+b.title);
	if( !a.children ){
		a.children = [];
	}
	for( var x=0; x<b.children.length; x++ ){
		var child = b.children[x];
		chrome.bookmarks.move(child.id, {parentId:a.id});
	}
}

function cleanup_bookmarks(){
	console.log('CLEANUP');
	//find_duplicates( bookmarks.folders );
	
	for( var x=0; x<bookmarks.duplicates.length; x++ ){
		var nodeid = bookmarks.duplicates[x];
		console.log("Removing duplicate node:", nodeid);
		chrome.bookmarks.removeTree(nodeid);
	}
	
	for( var x=0; x<bookmarks.empties.length; x++ ){
		var node = bookmarks.empties[x];
		//console.log("Removing empty node:", node.id);
		chrome.bookmarks.removeTree(node.id);
	}
}