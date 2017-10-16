
const Shape = require('./shape').Shape;
const Point = require('./point').Point;

var Circle = function() {
	Shape.apply(this, arguments);

	if( arguments.length!=1 ) {
		throw new Error('Circle() called with incorrect number of arguments');
	}
	
	if( arguments[0].center instanceof Point ) {
		this.center = arguments[0].center;
	} else if( Array.isArray(arguments[0].center) && arguments[0].center.length==2 ) {
		if( typeof(arguments[0].center[0]) == 'number' && typeof(arguments[0].center[1])=='number' ) {
			this.center = new Point(arguments[0].center[0], arguments[0].center[1]);
		} else {
			throw new Error('if center is an array, it must be an array of two numbers, not '+arguments[0].center);
		}
	} else {
		throw new Error('center must be an instance of Point or an array of two numbers, not '+arguments[0].center);
	}

	if( typeof(arguments[0].radius) == 'number' ) {
		this.radius = arguments[0].radius
	} else {
		throw new Error('radius must be a number, not '+arguments[0].radius);
	}
}

Circle.prototype = Object.create(Shape.prototype);

Circle.prototype.toString = function() {
	return 'Circle @ '+this.center.x+','+this.center.y+' r='+this.radius;
}

Circle.prototype.getPointNames = function() {
	return ['center'];
}

Circle.prototype.scaleBy = function(s) {
	return new Circle({
		center: [this.center.x*s, this.center.y*s],
		radius: this.radius*s,
		shapeClass: this.getShapeClass()
	});
}

Circle.prototype.xlate = function(dx, dy) {
	return new Circle({
		center: [this.center.x+dx, this.center.y+dy],
		radius: this.radius,
		shapeClass: this.getShapeClass()
	});
}

Circle.prototype.xlatef = function(xlatePoint, xlateLength) {
	return new Circle({
		center: xlatePoint(this.center),
		radius: xlateLength(this.radius),
		shapeClass: this.getShapeClass()
	});
}

Circle.prototype.ymirror = function() {
	return new Circle({
		center: [-this.center.x, this.center.y],
		radius: this.radius,
		shapeClass: this.getShapeClass()
	});
}

Circle.prototype.xlateAngular = function(a, d) {
	return new Circle({
		center: this.center.xlateAngular(a,d),
		radius: this.radius,
		shapeClass: this.getShapeClass()
	});
}

/* TODO: not right */
Circle.prototype.getExtent = function(axis, direction) {
	return this.radius*direction;
}

exports.Circle = Circle;
