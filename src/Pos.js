var Pos = PosSet( ['x','y','s','z','r'] );

// #ifdef NODE
modules.exports = Pos;
// #endif

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

// #ifndef NDE

//
// Don't include browser stuff in node code.
//	Only looks like a comment.
//
// #endif */

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
// #ifndef NDE

// #endif

