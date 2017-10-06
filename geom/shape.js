
var Shape = function() {
	this._shapeClass = 'default';
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
