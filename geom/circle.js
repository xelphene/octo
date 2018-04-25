
const cos = require('../util').cos;
const Shape = require('./shape').Shape;
const Point = require('./point').Point;
const Line = require('./line').Line;

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

Circle.prototype.getExtent = function(axis, direction) {
	if( axis=='x' ) {
		return this.center.x + direction*this.radius;
	} else {
		return this.center.y + direction*this.radius;
	}
}

Circle.prototype.getTopPoint = function() {
	return new CirclePoint(
		this.center.x,
		this.center.y+this.radius,
		this
	);
}

Circle.prototype.getBottomPoint = function() {
	return new CirclePoint(
		this.center.x,
		this.center.y-this.radius,
		this
	);
}

Circle.prototype.getBotPoint = Circle.prototype.getBottomPoint;

Circle.prototype.getLeftPoint = function() {
	return new CirclePoint(
		this.center.x-this.radius,
		this.center.y,
		this
	);
}

Circle.prototype.getRightPoint = function() {
	return new CirclePoint(
		this.center.x+this.radius,
		this.center.y,
		this
	);
}

Circle.prototype.originCenteredCircle = function() {
	return new Circle({
		center: [0,0],
		radius: this.radius,
		shapeClass: this.getShapeClass()
	});
}

Circle.prototype.isOriginCentered = function() {
	if( Math.abs(this.center.x) > 0.0001 ) {
		return false;
	}
	if( Math.abs(this.center.y) > 0.0001 ) {
		return false;
	}
	return true;
}

Circle.prototype.isUnitCircle = function()
{
	return (
		this.radius==1 &&
		this.center.x < 0.00001 &&
		this.center.y < 0.00001
	);
}

Circle.prototype.unitCircle = function()
{
	return new Circle({
		center: [0,0],
		radius: 1,
		shapeClass: this.getShapeClass()
	});
}

// xlate any point on this circle to where
// it would be if this were an origin-centered arc
Circle.prototype.xlatePointToUnitCircle = function(p) 
{
	// move it to origin-centered
	var p = new Point(
		p.x - this.center.x,
		p.y - this.center.y
	);
	
	var scaleFactor = 1/this.radius;
	
	// scale it about the origin
	p = new Point(
		p.x * scaleFactor,
		p.y * scaleFactor
	);

	return p;
}

// invert the activity of xlateToUnitCircle
Circle.prototype.xlatePointFromUnitCircle = function(p)
{
	return new Point(
		p.x*this.radius + this.center.x,
		p.y*this.radius + this.center.y
	);	
}

Circle.prototype.isPointOn = function(p) {
	var diff = Math.abs(
		new Line(this.center, p).length -
		this.radius
	);
	return diff < 0.00001;
}

// ***********************************************************

CirclePoint = function(x,y,circle) {
	Point.apply(this,[x,y]);
	this.circle = circle;
}

CirclePoint.prototype = Object.create(Point.prototype);

CirclePoint.prototype.xlateOutward = function(distance) {
	var radiusLine = new Line(
		this.circle.center,
		this
	);

	var cp = this.xlateUnitVector(
		radiusLine.toUnitVector(),
		distance
	);

	/* return a plain Point, not a CirclePoint since the returned point is
	 * not *on* the circle, and that's what CirclePoints are for */

	return new Point(cp.x, cp.y);
}

CirclePoint.prototype.xlateInward = function(distance) {
	var radiusLine = new Line(
		this.circle.center,
		this
	);

	var cp = this.xlateUnitVector(
		radiusLine.toUnitVector(),
		-distance
	);

	/* return a plain Point, not a CirclePoint since the returned point is
	 * not *on* the circle, and that's what CirclePoints are for */
	
	return new Point(cp.x, cp.y);
}

// re: walkSingle
CirclePoint.prototype.xlateAlong = function(distance, clockwise)
{
	if( ! this.circle.isUnitCircle() ) {
		//throw new Error('not sure');
		
		var newCircle = this.circle.unitCircle();
		var newPoint = this.circle.xlatePointToUnitCircle(this);
		var newCirclePoint = new CirclePoint(newPoint.x, newPoint.y, newCircle);
		var newDistance = distance*(1/this.circle.radius);
		
		//var p = this.unitArc().walkSingle( distance*(1/this.radius), forwards );

		var p = newCirclePoint.xlateAlong(newDistance, clockwise);

		// takes a point, returns a new point
		return new CirclePoint(
			this.circle.xlatePointFromUnitCircle(p).x,
			this.circle.xlatePointFromUnitCircle(p).y,
			this.circle
		);
	}
	
	/* at this point, we're working with a unit arc (radius 1, center 0,0)
	 * and going in the forward direction only (start @start, go distance
	 * toward end) */
	
	// get the angle of a line from center to start point in radians
	var startAngle;	
	if( this.x >= 0 && this.y >= 0 ) {
		// quad 1. up right + +
		startAngle = Math.acos(this.x);
	} else if( this.x < 0 && this.y >=0 ) {
		// quad 2. up left - +
		startAngle = Math.acos(this.x);
	} else if( this.x >= 0 && this.y<0 ) {
		// quad 4. down right + -
		startAngle = Math.acos( - Math.abs(this.x) ) + Math.PI;
	} else {
		// quad 3. down left - -
		startAngle = Math.acos(Math.abs(this.x)) + Math.PI;
	} 
	
	/* finding the point a certain distance from the start point is simply a
	 * matter of adding the distance to the angle as measured in radians */
	if( clockwise ) {
		var x = Math.cos( startAngle - distance );
		var y = Math.sin( startAngle - distance );
	} else {
		var x = Math.cos(startAngle + distance );
		var y = Math.sin(startAngle + distance);
	}
	
	return new CirclePoint(x,y,this.circle);
}

CirclePoint.prototype.xlateAlongClockwise = function (distance) {
	return this.xlateAlong(distance, true)
}

CirclePoint.prototype.xlateAlongCounterCW = function (distance) {
	return this.xlateAlong(distance, false)
}

// ***********************************************************

/* given two points (a, b) that lie on a circle, and a unit vector u which
 * points to the center of that circle, return the circle
*/
function circleFromPointsUV(a,b,u) {
	var chord = new Line(a,b);
	var chordAngle = chord.toUnitVector().angleFrom(u);
	var radius = Math.abs( (chord.length/2)/cos(chordAngle) );
	var center = a.xlateUnitVector(u, radius);

	//console.log('center: '+center);
	//console.log('radius: '+radius);

	var ac = new Line(a,center);
	var bc = new Line(b,center);
	//if( ac.length != bc.length ) {
	//	throw new Error("Requested circle is impossible. Try turning rotating the unit vector 180 degrees.");
	//}

	return new Circle({
		center: center,
		radius: radius
	});
}

// ***********************************************************


exports.Circle = Circle;
exports.circleFromPointsUV = circleFromPointsUV;
