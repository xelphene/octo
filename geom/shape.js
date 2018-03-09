
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
	var max=null;
	var theShape = this;
	this.getPointNames().map( function(point) {
		
		if( max==null || theShape[point][axis]*direction > max ) {
			max = theShape[point][axis]*direction;
		}
	});
	return max*direction;
};

// TODO: should return a new Shape with only shapeClass different
Shape.prototype.setShapeClass = function(shapeClass) {
	this._shapeClass = shapeClass;
}

Shape.prototype.getShapeClass = function() {
	return this._shapeClass;
}

exports.Shape = Shape;
