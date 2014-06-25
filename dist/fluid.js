;var Fluid = ( function ( window ) {
var Pos = PosSet( ['x','y','s','z','r'] );


function PosSet ( AXES ) {

	if ( !Array.isArray ( AXES ) ) {
		throw new Error ( 'AXES must be array.')
	}

	AXES.forEach( function ( axis ) {
		if ( 'string' != typeof axis )
			throw new Error ( 'AXES must be array of strings.')
	});


	function Pos ( parse ) {
		if ( parse && parse.constructor == Pos && arguments.length == 1 ) 
			return parse;

		if ( this.constructor != Pos )
			return new Pos ( arguments );

		var pos = this;
		injestArraylike( arguments );

		function injestArraylike ( ar ) {
			var axisI = 0
			for ( var i = 0; i < ar.length; i ++ ) {
				var a = ar[i];
				var t = typeof a;

				if ( t == 'object' ) {
					if ( a.hasOwnProperty( 'length' ) && a[0] !== undefined ) {
						injestArraylike( a );
					} else {
						pos.set( a );
					}
				} else if ( t == 'string' || t == 'number' ) {
					if ( axisI < AXES.length ) {
						a = parseFloat( a ) || 0;
						pos[AXES[axisI]] = a;
						axisI ++;
					}
				}
			}
		}
	}


	Pos.PosSet = PosSet;

	Pos.constant = function ( a ) {
		a = parseFloat( a ) || 0;
		var ret = new Pos();
		Pos.eachAxis( function ( axis ) {
			ret[axis] = a;
		});
		return ret;
	}

	Pos.scaleToLinear = function ( s ) {
		return Math.pow( 2, s || 0 );
	}

	Pos.linearToScale = function ( s ) {
		return Math.log( s ) / Math.log( 2 );
	}


	Pos.assertPos = function ( b ) {
		if ( !b || b.constructor != Pos )
			throw new Error( "Argument must be Pos");
	}



	Pos.eachAxis = function ( cb ) {
		for ( var i = 0; i < AXES.length; i ++ )
			cb( AXES[i], i );	
	}

	Pos.prototype.clone = function () {
		var a = this,
			c = new Pos();
		Pos.eachAxis( function ( axis ) {
			c[axis] = a[axis];
		});	
		return c;
	}

	Pos.prototype.set = function ( b ) {
		var self = this;
		Pos.eachAxis( function ( axis ) {
			var v = parseFloat( b[axis] );
			if ( !isNaN( v ) )
				self[axis] = v;
		});
	}

	Pos.prototype.isIdentity = function () {
		for ( var i = 0; i < AXES.length; i ++ )
			if ( this[AXES[i]] )
				return false;

		return true;
	}

	Pos.prototype.isNegligible = function () {
		for ( var i = 0; i < AXES.length; i ++ )
			var v = this[AXES[i]];
			if ( v > 0.0000001 || v < -0.0000001 )
				return false;

		return true;
	}

	Pos.prototype.mult = function ( b ) {
		var a = this,
			c = a.clone();

		if ( 'number' == typeof b ) {
			Pos.eachAxis( function ( axis ) {
				c[axis] *= b;
			});
		} else if ( 'object' == typeof b ) {
			Pos.eachAxis( function ( axis ) {
				var v = parseFloat(b[axis]);

				if ( !isNaN( v ) ) 
					c[axis] *= v;
			});
		}

		return c;
	}

	Pos.prototype.multIP = function ( b ) {
		var a = this;

		if ( 'number' == typeof b ) {
			Pos.eachAxis( function ( axis ) {
				a[axis] *= b;
			});
		} else if ( 'object' == typeof b ) {
			Pos.eachAxis( function ( axis ) {
				var v = parseFloat(b[axis]);

				if ( !isNaN( v ) ) 
					a[axis] *= v;
			});
		}

		return a;
	}

	Pos.prototype.diff = function ( b ) {
		var a = this,
			c = new Pos();

		Pos.eachAxis( function ( axis ) {
			var v = parseFloat( b[axis] );
			if ( !isNaN( v ) )
				if ( axis === 'r' ) {
					var rDiff = a[axis] - v;
					rDiff = rDiff % 360;
					if ( rDiff > 180 )
						rDiff -= 360;
					else if ( rDiff < -180 )
						rDiff += 360;

					c[axis] = rDiff;
				} else {
					c[axis] = a[axis] - v;
				}
				
		});

		return c;
	}

	Pos.prototype.add = function ( b ) {
		var a = this,
			c = a.clone();

		Pos.eachAxis( function ( axis ) {
			var v = parseFloat( b[axis] );
			if ( !isNaN( v ) )
				c[axis] += v;
		});

		return c;
	}

	Pos.prototype.addIP = function ( b ) {
		var a = this;
		Pos.eachAxis( function ( axis ) {
			var v = parseFloat( b[axis] );
			if ( !isNaN( v ) )
				a[axis] += v;
		});

		return a;
	} 

	Pos.prototype.subtract = function ( b ) {
		var a = this,
			c = a.clone();

		Pos.eachAxis( function ( axis ) {
			var v = parseFloat( b[axis] );
			if ( !isNaN( v ) )
				c[axis] -= v;
		});

		return c;
	}

	Pos.prototype.apply = function ( elem ) {
		var pos = this,
			str = '';

		var scale = pos.scale();

		/*
		str += "translate3d( "+pos.x+"px, "+pos.y+"px, "+pos.z+"px ) ";
		str += "rotateZ("+pos.r+"deg) ";
		str += "scale3d( "+scale+", "+scale+", "+scale+" ) ";
		*/
		//str += "scale2d( "+scale+", "+scale+" ) ";
			

		str += "translate( "+pos.x+"px, "+pos.y+"px ) ";
		str += "rotate("+pos.r+"deg) ";
		str += "scale( "+scale+", "+scale+" ) ";

		elem.style[PosSet.vendorPrefix.js+'TransformOrigin'] = '0 0';
		elem.style[PosSet.vendorPrefix.js+'Transform'] = str;
		//elem.style['zIndex'] = parseInt( (( pos.z || 0 ) + 1000 ) * 50000 );
	}


	Pos.prototype.applyViewport = function ( elem ) {
		var a = this,
			centreX = a.cx || ( a.w / 2 ) || 0,
			centreY = a.cy || ( a.h / 2 ) || 0,
			str = '',
			scale = 1/a.scale();

			/*
		str += "translate3d( "+centreX+"px, "+centreY+"px, "+a.z+"px ) ";
		str += "rotateZ("+(-a.r)+"deg) ";
		str += "scale3d( "+scale+", "+scale+", "+scale+" ) ";
		str += "translate3d( "+(-a.x)+"px, "+(-a.y)+"px, "+a.z+"px ) ";
	*/

		str += "translate( "+centreX+"px, "+centreY+"px ) ";
		str += "rotate("+(-a.r)+"deg) ";
		str += "scale( "+scale+", "+scale+" ) ";
		str += "translate( "+(-a.x)+"px, "+(-a.y)+"px ) ";


		//console.log( a, str );
		elem.style[PosSet.vendorPrefix.js+'TransformOrigin'] = '0 0';
		elem.style[PosSet.vendorPrefix.js+'Transform'] = str;
	}

	Pos.prototype.translateViewportPos = function ( b ) {
		var a = this;
		var cos = b.cos();
		var sin = b.sin();
		var c = a.clone();
		var s = b.scale();
		c.x = -a.x * cos * s + a.y * sin * s;
		c.y = -a.x * sin * s + -a.y * cos * s;


		return c;
	}

	Pos.prototype.transformViewportPosAround = function ( b, around ) {
		var a = this;
		var s = a.scale();

		var x = b.x - around.x;
		var y = b.y - around.y;

		var cos = a.cos() * s;
		var sin = a.sin() * s;
		var c = a.clone();

		c.x = x * cos + y * -sin - x;
		c.y = x * sin + y * cos - y;

		return c;
	}



	Pos.prototype.reverseViewport = function ( b ) 
	{
		var a = this,
			c = b.clone(),
			scale = 1 / b.scale(),
			sin = b.sin() / scale,
			cos = b.cos() / scale,
			cx = b.cx || ( b.w / 2 ) || 0,
			cy = b.cy || ( b.h / 2 ) || 0,
			x = a.x - cx || 0,
			y = a.y - cy || 0;

		Pos.assertPos( b );

		c.x = b.x + x * cos + y * -sin;
		c.y = b.y + x * sin + y * cos;


		return c;
	}

	Pos.prototype.sin = function () {
		return Math.sin( this.r / 180 * Math.PI );
	}

	Pos.prototype.cos = function () {
		return Math.cos( this.r / 180 * Math.PI );
	}

	Pos.prototype.scale = function () {
		return Pos.scaleToLinear( this.s );
	}

	Pos.prototype.toString = function () {
		var a = this,
			ret = [],
			last = 0;
		
		Pos.eachAxis( function ( axis, i ) {
			var v = a[axis];
			ret[i] = v;
			if ( v )
				last = i + 1;
		});
		ret = ret.slice( 0, last + 1 );
		for ( var i = 0; i < last; i ++ )
			ret[i] = ret[i].toFixed( 2 );

		return "Pos( "+ret.join(', ')+" )";
	}

	Pos.prototype.translate = function ( b ) {
		var a = this,
			ret = a.add( b ),
			s = a.scale(),
			sin = a.sin() * s,
			cos = a.cos() * s;

		ret.x = a.x + b.x * cos - b.y * sin;
		ret.y = a.y + b.x * sin + b.y * cos;

		return ret;
	}

	return Pos;
}


//
// Don't include browser stuff in node code.
//	Only looks like a comment.
//

// Shamelessly ganked from http://davidwalsh.name/vendor-prefix
PosSet.vendorPrefix = (function () {
  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('') 
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
  return {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();


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

function Movable ( elem, opt ) {
	if ( elem.jquery )
		elem = elem[0];

	if ( !elem || !elem.nodeType )
		throw new Error( "Not html element");


	var $e = $(elem);

	var pos = Pos();

	var self = {};

	elem.Movable = self;	

	self.element = elem;
	self.$ = $(elem);
	self.getPos = getPos;
	self.setPos = setPos;
	self.getBoundsLocal = getBoundsLocal;
	self.getBoundsViewport = getBoundsViewport;
	self.localToGlobal = localToGlobal;


	$e.addClass( 'movable' );


	
	
	return self;



	function setPos( p, opt ) {
		pos.set( p );
		pos.apply( elem );
	}

	function getPos() {
		return pos.clone();
	}

	function getBoundsLocal() {
		var top = elem.offsetTop;
		var left = elem.offsetLeft;
		var width = elem.clientWidth;
		var height = elem.clientHeight;

		return {
			top: top,
			left: left,
			width: width,
			height: height,
			right: left + width,
			bottom: top + height
		};


		//return elem.getClientRects();
	}

	function getBoundsViewport() {
		return elem.getBoundingClientRect();
	}

	function globalToLocal() {

	}

	function localToGlobal( b ) {
		return pos.translate( b );
	}

}function Selection () {
	var self = this;
	var items = [];
	var selClass = 'selected'
	

	self.add = function ( m ) {
		var $m = m.$;
		if ( $m )
			$m.addClass( selClass );

		var ind = items.indexOf( m );
		if ( ind == -1 )
			items.push( m );
	}

	self.remove = function ( m ) {
		var $m = m.$;
		if ( $m )
			$m.removeClass( selClass );

		var ind = items.indexOf( m );
		if ( ind != -1 )
			items.splice( ind, 1 );
	}

	self.delta = function ( delta, centre, opt ) {
		items.forEach( function ( m ) {
			console.log( "item delta", m, delta );
			var p = m.getPos();
			p.addIP( delta );
			m.setPos( p, opt );
		});
	}

	self.clear = function ( m ) {
		items.forEach( function ( m ) {
			var $m = m.$;
			if ( $m )
				$m.removeClass( selClass );		
		});
		items = [];
	}
}


function Viewport ( elem ) {
	var viewport = elem,
		pos = Pos(),
		content = findContentElem();

	addListeners();
	applyPos();

	console.log( "new ViewPort", elem, content );

	var mouseLast;
	var mouseDown;
	var mouseDelta;
	var selMain = new Selection();

	function onMouse( e ) {
		var t = new Date().getTime();

		var local = eventToPos( e );
		local.t = t; 
		//console.log( "local", local );

		var mouse = Pos( e.screenX, e.screenY );
		//mouse = local;

		
		if ( mouseLast ) {
			mouseDelta = mouse.subtract( mouseLast );
		} else {
			mouseDelta = Pos();
		}

		mouseLast = mouse;

		if ( !e.buttons && !e.which )
			return;			

		var clickTime = mouseDown ? t - mouseDown.t : NaN;
		
		var target = MovableFromEvent( e );




		e.preventDefault();

		var delta;

			

		switch ( e.type ) {

			case 'mousedown':
				if ( target ) {
					console.log( "target bounds", target.getBoundsViewport() );
				}

				mouseDown = local;
				if ( !e.shiftKey ) 
					selMain.clear();

				selMain.add( target );

			break;

			case 'mousemove':
				if ( e.ctrlKey || e.altKey ) {
					delta = Pos();
					delta.r = mouseDelta.y / -6;
					delta = delta.transformViewportPosAround( pos, mouseDown );
				} else {

					delta = mouseDelta.translateViewportPos( pos );
					//console.log( "delta", delta.toString() );
				}
				
				//delta = mouseDelta;
			break;

			case 'mousewheel':
				selMain.delta( Pos( 1 ) );
				delta = Pos();
				clearTarget();
				if ( e.ctrlKey || e.altKey )
					delta.r = e.wheelDelta / 100;
				else
					delta.s = e.wheelDelta / -3000;
					delta = delta.transformViewportPosAround( pos, local );
			break;

			case 'mouseup':
				//selMain.clear( target );
			break;

			case 'click':
				console.log ( "click target", clickTime, target ); 
				if ( clickTime && clickTime < 400 && target )
					zoomToMovable( target );
			break;
		}

		if( delta )
			applyDelta( delta );



	}

	function zoomToMovable( m, opt ) {

		var p = m.getPos();

		var mBounds = m.getBoundsLocal();
		var vBounds = getBoundsViewport();

		var scaleX = vBounds.width / mBounds.width;
		var scaleY = vBounds.height / mBounds.height;

		var scale = Pos.linearToScale( Math.min( scaleX, scaleY ) );


		var mCentreLocal = Pos( mBounds.left + mBounds.width / 2, mBounds.top + mBounds.height / 2 );
		var mCentre = m.localToGlobal( mCentreLocal );

		
		p = mCentre;
		p.s -= scale;

		//p.s += 0.2;

		console.log( p );

		ph.target = p;

		updateNext();
		//p = p.subtract( pos );
		//applyDelta( p );

	}


	function MovableFromEvent( event ) {
		var e = event.target;
		do {
			//console.log( "MFO", e );
			if ( e.Movable )
				return e.Movable;

			e = e.parentElement;
		} while ( e && e != elem );

		return false;
	}



	function onResize( e ) {
		console.log( 'onResize', e );
	}

	function applyDelta ( delta ) {
		//console.log('delta', delta );
		//console.log("delta -", pos.x, pos.w );


		if ( ph.target ) {
			ph.target.addIP( delta );
		}

		pos.addIP( delta );
		
		

		//console.log("delta +", pos.x, pos.w );

		applyPos();
		updateNext();
	}

	function getBoundsViewport () {
		return elem.getBoundingClientRect();
	}

	function applyPos ( ) {
		var rect = getBoundsViewport();
		pos.w = pos.w || rect.width;
		pos.h = pos.h || rect.height;
		pos.applyViewport( content );


		var event = new CustomEvent( "move" );
		event.pos = pos;

		elem.dispatchEvent( event );
	}

	function clearTarget () {
		ph.target = null;
	}


	//
	//	Dragging	
	//

	var dragging = 0;

	function dragStart() 
	{
		dragging = 1;
	}


	function dragEnd() {
		dragging = 0;
	}


	//
	//
	//


	function onTouch( e ) {
		console.log( "got touch", e );
		e.preventDefault();
	}


	function addListeners () 
	{
		if ( 'ontouchstart' in document.documentElement ) {
			elem.addEventListener( 'touchstart', onTouch, true );
			elem.addEventListener( 'touchmove', onTouch, true );
			elem.addEventListener( 'touchend', onTouch, true );
		} else {
			elem.addEventListener( 'mousedown', onMouse, true );
			elem.addEventListener( 'mouseup', 	onMouse, true );
			elem.addEventListener( 'mousemove', onMouse, true );
			elem.addEventListener( 'mousewheel',onMouse, true );
			
		}

		elem.addEventListener( 'click', 	onMouse, true );

		document.addEventListener( 'keydown', onGlobalKey, true );
		document.addEventListener( 'keyup', onGlobalKey, true );
			
	}

	function onGlobalKey ( e ) {
		modKeysFromEvent( e );
	}

	function modKeysFromEvent( e ) {
		console.log( _.pick( e, 'altKey', 'ctrlKey', 'metaKey', 'shiftKey' ) );
	}


	function findContentElem() 
	{
		var children = elem.children,
			i = 0;

		for ( i = 0; i < children.length; i ++ ) {
			var child = elem.children[i];
			if ( child.classList.contains('content') ) 
				return child;
		}
	}

	function eventToPos( e )
	{
		var x = e.pageX - elem.offsetLeft;
		var y = e.pageY - elem.offsetTop;
		return Pos( x, y ).reverseViewport( pos );
	}

	var _nextFrame = false;

	function updateNext() {
		if ( _nextFrame )
			return;

		if ( window.webkitRequestAnimationFrame ) {
			_nextFrame = true;
			window.webkitRequestAnimationFrame( update );
		} else {
			throw new Error( "timer not found" );
		}

	}

	var ph = {
		gravity:	Pos()
	};
	function update( time ) {
		_nextFrame = false;

		var delta;
		
		if ( ph ) {


			ph.delta = Pos( ph.delta );
			//ph.target = Pos( ph.target );
			ph.drag = ph.drag || Pos.constant( 0.6 );


			if ( ph.target ) {
				var attract = ph.target.diff( pos );
				attract.multIP ( 0.1 );
				ph.delta.addIP( attract );
			}

			

			if ( true || !ph.delta.isNegligible() || ( attract && !attract.isNegligible()) )
				delta = ph.delta;

			ph.delta.multIP( ph.drag );
		}
			

		if ( delta ) {
			pos.addIP( delta );
			applyPos();
			updateNext();
		}
	}


	elem.eventToPos = eventToPos;

}
return {
	Pos: Pos,
	Image: Rez,
	Movable: Movable,
	Viewport: Viewport
};
})( window );