

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