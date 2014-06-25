function Rez ( elem ) {
	

	//getTile( 1, 2, 3, 4, 'jpg' );

	console.warn( "elem", elem );

	console.warn( "src", elem.getAttribute("src") );
	setSrc( elem.getAttribute("src") );

	var spec;
	function setSrc ( src ) {
		$.getJSON( src, function ( data, status, jqXHR ) {
			console.log( "spec", data, jqXHR );
			spec = data;
			draw();
		});
	}

	var pageDivs = [];

	function draw() {

		elem.style.position = 'relative';

		var wantWidth = elem.getAttribute("width") || spec.width;
		var wantHeight = elem.getAttribute("height") || spec.height;

		var scaleX = wantWidth / spec.width;
		var scaleY = wantHeight / spec.height;
		var scaleBias = 1;
		var scaleMode;

		switch ( scaleMode ) {
			case 'min':
			default:
				scaleX = scaleY = scaleX < scaleY ? scaleX : scaleY;
		}

		var l = spec.levels + Math.log( Math.max( scaleX, scaleY ) * scaleBias ) / Math.log(2) - 1;

		console.log( "drawLevel", scaleX, l );

		l = Math.round( l );


		if ( l >= spec.levels )
			l = spec.levels - 1;

		if ( l < 0 )
			l = 0;


		var p = 150;

		function realPage( p, pageMode ) {
			var pages = 8;
			var lastPage = pages - 1;

			switch ( pageMode ) {
				case 'pingpong':
					p = p % ( lastPage * 2 );
					p = p < 0 ? p + ( lastPage * 2 ) : p;
					if ( p > lastPage ) 
						p = lastPage * 2 - p; 
				break;

				case 'blank':
					p = p >= 0 && p < pages ? p : -1;
				break;

				case 'hold':
					p = p < 0 ? 0 : p > lastPage ? lastPage : p;
				break;

				case 'loop':
				default:
					p = p % pages;
					p = p < 0 ? p + pages : p;
				break;
			}
			return p;
		}


		var p0 = Math.floor( realPage( p )) 





		drawPage( 3 );
		var secondPage = drawPage( 6 );
		secondPage.style.opacity = 0.5;

		l = 1;

		drawPage( 3 );
		drawPage( 3 );


		function drawPage( p ) {
			var pageDiv = pageDivs[p];
			if ( !pageDiv ) {
				pageDiv = pageDivs[p] = document.createElement('div');
				pageDiv.style.zIndex = p;
				pageDiv.style.position = 'absolute';
				pageDiv.classList.add("rez-page");
				pageDiv._levels = [];
				elem.appendChild( pageDiv );
			}

			drawLevel( l );

			function drawLevel( l ) {
				
				var levelDiv = pageDiv._levels[l]; 

				if ( !levelDiv ) {
					levelDiv = pageDiv._levels[l] = document.createElement('div');
					levelDiv.style.zIndex = l;
					levelDiv.style.position = 'absolute';
					levelDiv.classList.add("rez-level");
					pageDiv.appendChild( levelDiv );					
				}

				var level = getLevel( p, l );
				
				for ( var y = 0; y < level.rows; y ++ ) 
				for ( var x = 0; x < level.cols; x ++ ) {
					var tile = getTile( p, l, y, x, 'jpg' );
					if ( readyTile( tile ) ) {
						var scaleLevel = tile.level.scale;
						tile.width = Math.ceil( tile.naturalWidth * scaleLevel * scaleX );
						tile.height = Math.ceil( tile.naturalHeight * scaleLevel * scaleY );
						tile.style.position = 'absolute';
						tile.style.left = tile.col * spec.tileSize * scaleLevel * scaleX;
						tile.style.top = tile.row * spec.tileSize * scaleLevel * scaleY;

						levelDiv.appendChild( tile );
					}
				}
			}

			return pageDiv;
		}



	}

	function readyTile( tile ) {
		if ( tile.error ) {
			return false;
		}

		if ( !tile.complete || !tile.naturalWidth ) {
			tile.onload = onTileLoad;
			tile.onerror = onTileError;

			return false;
		}

		return true;
	}

	function onTileLoad() {
		console.log("onTileLoad", this );
		draw();
	}


	function onTileError() {
		console.log("onTileError", this );
	}


	var pages = [];
	var tiles = [];


	function getLevel( p, l ) {
		var page = tiles[p];
		if ( !page ) {
			page = tiles[p] = [];
		}

		var level = page[l];
		if ( !level ) {
			level = page[l] = [];

			var scale = Math.pow( 2, spec.levels - l - 1 );

			level.cols = Math.ceil( spec.width / scale / spec.tileSize );
			level.rows = Math.ceil( spec.height / scale / spec.tileSize );
			
			level.page = page;
			level.scale = scale;
		}	

		return level;
	}


	function getTile ( p, l, y, x, format ) {
		var level = getLevel( p, l );
		var page = level.page;
		
		var row = level[y];
		if ( !row )	 {
			row = level[y] = [];
		}

		var tile = row[x];
		if ( !tile ) {
			var url = "/surfing/tile.p%p.l%l.y%y.x%x.%f";

			url = url.replace( /([^\\])\%(\d*)(\w)/g, function ( match ) {
				var escape = arguments[1];
				var length = parseInt( arguments[2] );
				var key = arguments[3];
				var val = NaN;
				switch ( key ) {
					case 'p': val = p; break;
					case 'l': val = l; break;
					case 'x': val = x; break;
					case 'y': val = y; break;
					case 'f': val = format; break;
				}

				if ( !val && val !== 0 )
					return escape;

				val = val.toString();

				while ( length && val.length < length ) {
					val = '0'+val;
				}

				return escape + val;
			} );

			url = url.replace( "\\%", "%" );

			tile = new Image();
			tile.src = url;
			tile.level = level;
			tile.page = page;
			tile.row = y;
			tile.col = x;

			row[x] = tile;
		}

		return tile;
	}


}

