
var Shape = function() {
	this._shapeClass = 'default';
	this.comment = '';

	if( arguments.length==1 ) {
		if( 'shapeClass' in arguments[0] ) {
			this._shapeClass = arguments[0].shapeClass;
		}
		if( 'comment' in arguments[0] ) {
			this.comment = arguments[0].comment;
		}
	}
};

Shape.prototype.getExtent = function(axis, direction) {
	//console.log('BEGIN getExtent');
	var max=null;
	var theShape = this;
	this.getPointNames().map( function(point) {
		/*	
		console.log('point = '+point);
		console.log(theShape[point]);
		console.log(theShape[point][axis]);
		console.log(theShape[point][axis]*direction);
		*/
		
		if( max==null || theShape[point][axis]*direction > max ) {
			//console.log('its the max. max='+max+'  theShape[point][axis]='+theShape[point][axis]);
			max = theShape[point][axis]*direction;
		}
	});
	//console.log('END Shape.getExtent');
	return max*direction;
};

Shape.prototype.setShapeClass = function(shapeClass) {
	this._shapeClass = shapeClass;
}

Shape.prototype.getShapeClass = function() {
	return this._shapeClass;
}

exports.Shape = Shape;
