
var ShapeCollection = function(shapeArray) {
	if( shapeArray===undefined ) {
		this._shapes = [];
	} else {
		this._shapes = shapeArray;
	}
}

ShapeCollection.prototype.getArray = function() {
	return this._shapes;
}

ShapeCollection.prototype.push = function(shape) {
	this._shapes.push(shape);
}

ShapeCollection.prototype.concat = function(shapeCollection) {
	return new ShapeCollection(
		this._shapes.concat(shapeCollection.getArray())
	);
}

ShapeCollection.prototype.map = function(f) {
	return new ShapeCollection(
		this._shapes.map(f)
	);
}

ShapeCollection.prototype.ymirror = function() {
	return new ShapeCollection(
		this._shapes.map( (s) => s.ymirror() )
	);
}

exports.ShapeCollection = ShapeCollection;
