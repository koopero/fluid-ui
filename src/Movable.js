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

}