
const Shape = require('./shape').Shape;

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

Object.defineProperty(ShapeCollection.prototype, 'length', {
	get: function() {
		return this._shapes.length;
	}
});

ShapeCollection.prototype.push = function(shape) 
{
	if( shape instanceof Shape ) {
		this._shapes.push(shape);
	} else if( typeof(shape.getAllShapes) == 'function' ) {
		shape.getAllShapes().map( (o) => this.push(o) );
	} else {
		//throw new TypeError('Shape subclass or object with getAllShapes method required for ShapeColleciton.push, not '+JSON.stringify(shape));
		throw new TypeError('Shape subclass or object with getAllShapes method required for ShapeColleciton.push, not '+shape);
	}
}

ShapeCollection.prototype.addShapes = function(o) {
	
}

ShapeCollection.prototype.concat = function(shapeCollection) {
	if( !( shapeCollection instanceof ShapeCollection ) ) {
		throw new TypeError('ShapeCollection subclass required, not '+shapeCollection);
	}
	return new ShapeCollection(
		this._shapes.concat(shapeCollection.toArray())
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

ShapeCollection.prototype.toArray = function() {
	return this._shapes;
}

exports.ShapeCollection = ShapeCollection;
