function Selection () {
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
