
const Point = require('./point').Point;
const Shape = require('./shape').Shape;
const Line  = require('./line').Line;
const asin  = require('../util').asin;
const sin  = require('../util').sin;
const cos  = require('../util').cos;
const isNegative = require('../util').isNegative;

var Arc = function() {
	Shape.apply(this, arguments);

	if( arguments.length == 5 ) {
		/* constructor call in the traditional manner */
		
		var start = arguments[0];
		var end = arguments[1];
		var radius = arguments[2];
		var large = arguments[3];
		var clockwise = arguments[4];
		
		if( ! (start instanceof Point) ) {
			throw new Error('start must be an instance of Point, not '+start);
		}
		if( ! (end instanceof Point) ) {
			throw new Error('end must be an instance of Point, not '+end);

		}
		if( typeof(radius) != 'number' ) {
			throw new Error('radius must be a number, not '+radius);
		}
		if( typeof(large) != 'boolean' ) {
			throw new Error('large must be a boolean, not '+large);
		}
		if( typeof(clockwise) != 'boolean' ) {
			throw new Error('clockwise must be a boolean, not '+clockwise);
		}

		this.start = start;
		this.end = end;
		this.radius = radius;
		this.large = large;
		this.clockwise = clockwise;
			
	} else if( arguments.length==1 ) {
		/* constructor call with a single object containing parameters */
		var a = validateArcArg(arguments[0]);
		
		this.start = a.start;
		this.end = a.end;
		this.radius = a.radius;
		this.large = a.large;
		this.clockwise = a.clockwise;
	} else {
		throw new Error('Arc() called with incorrect number of arguments');
	}

	if( this.radius < this.chord().len()/2 ) {
		process.emitWarning('An Arc cannot have a specified radius ('+this.radius+') of less than half the chord line length ('+(this.chord().len()/2)+'). Radius will be set to half the chord line length instead.');
		this.radius = this.chord().len()/2;
	}
	
	this.comment = undefined;
};

function validateArcArg(a) {
	if( typeof(a)  != 'object' ) {
		throw new Error('Bezier() called with one argument but that argument is not an object.');
	}

	// make sure the object has valid start,end Point attributes
	// transform an array of two numbers into a Point if needed.
	['start','end'].map( function(attName) {
		if( ! (attName in a) ) {
			throw new Error('Arc() called with an object as sole parameter; object does not have a "'+attName+'" attribute.');
		} 
		
		if ( a[attName] instanceof Point ) {
			// given a Point
		} else if ( Array.isArray(a[attName]) ) {
			if( a[attName].length==2 && typeof(a[attName][0]) == 'number' && typeof(a[attName][1])=='number' ) {
				a[attName] = new Point(
					a[attName][0],
					a[attName][1]
				);
			} else {
				throw new Error('Arc() called with an object as sole parameter; attribute "'+attName+'" is an array but it does not contain two numbers; it is '+a[attName]);
			}
		} else {
			throw new Error('Arc() called with an object as sole parameter; attribute "'+attName+'" is neither a Point nor an object; it is '+a[attName]);
		}
	});
	
	// start and end are valid.
	
	if( ! ('radius' in a) ) {
		throw new Error('Arc() called with an object as sole parameter; object does not have a radius attribute');
	}
	if( typeof(a.radius) != 'number' ) {
		throw new Error('Arc() called with an object as sole parameter; radius attribute is not a number');
	}
	
	// start, end, radius are valid. now validate the boolean params.
	
	['large','clockwise'].map( function(attName) {
		if( ! (attName in a) ) {
			throw new Error('Arc() called with an object as sole parameter; object does not have a "'+attName+'" attribute.');
		}
		if( typeof(a[attName]) != 'boolean' ) {
			throw new Error('Arc() called with an object as sole parameter; "'+attName+'" attribute is not a boolean.');
		}
	});

	return a;
};

Arc.prototype = Object.create(Shape.prototype);

/*
Arc.prototype.center = function() {
	// TODO: make this computed in the future
	return this.preComputedCenter;
};
*/

Arc.prototype.getPointNames = function() {
	return ['start','end'];
};

// TODO: inherited getExtent is NOT correct. must take radius into account
// usually

Arc.prototype.ymirror = function() {
	return new Arc({
		start: new Point(-this.start.x, this.start.y),
		end: new Point(-this.end.x, this.end.y),
		radius: this.radius,
		large: this.large,
		clockwise: ! this.clockwise,
		shapeClass: this.getShapeClass()
	});
};

Arc.prototype.toString = function() {
	return (
		'Arc '+this.start.x+','+this.start.y+
		' -> '+this.end.x+','+this.end.y+
		' r='+this.radius+
		' lrg='+(this.large ? 'T' : 'f')+
		' cw='+(this.clockwise ? 'T' : 'f')
	);
};

Arc.prototype.xlate = function(dx, dy) {
	return new Arc({
		start: new Point( this.start.x+dx, this.start.y+dy),
		end: new Point( this.end.x+dx, this.end.y+dy),
		radius: this.radius,
		large: this.large,
		clockwise: this.clockwise,
		shapeClass: this.getShapeClass()
	});
}

Arc.prototype.xlatef = function(xlatePoint, xlateLength) {
	return new Arc({
		start: xlatePoint(this.start),
		end: xlatePoint(this.end),
		radius: xlateLength(this.radius),
		large: this.large,
		clockwise: this.clockwise,
		shapeClass: this.getShapeClass()
	});
}

Arc.prototype.scaleBy = function(s) {
	return new Arc({
		start: new Point( this.start.x*s, this.start.y*s ),
		end: new Point( this.end.x*s, this.end.y*s ),
		radius: this.radius * s,
		large: this.large,
		clockwise: this.clockwise,
		shapeClass: this.getShapeClass()
	});
}

Arc.prototype.xlateAngular = function(a, d) {
	return new Arc({
		start: this.start.xlateAngular(a,d),
		end: this.end.xlateAngular(a,d),
		radius: this.radius,
		large: this.large,
		clockwise: this.clockwise,
		shapeClass: this.getShapeClass()
	});
}

Arc.prototype.getParallel = function(d) {
	// this may give unintuitive results for arc angles>90
	var line = new Line({
		start: this.start,
		end: this.end
	});
	var xangle = line.xangle();
	return this.xlateAngular(xangle+90, d);
}

Arc.prototype.chord = function() {
	return new Line(this.start, this.end);
}

Arc.prototype.angle = function() {
	if( this.large==false ) {
		return 2*asin( 
			(this.chord().len()/this.radius)  /
			2 
		);
	} else {
		return 360 - 2*asin( 
			(this.chord().len()/this.radius)  /
			2 
		);
	}
}

Arc.prototype.center = function() {
	if( ! this.large ) {
		if( this.clockwise ) {
			var e = -1;
		} else {
			var e = 1;
		}
	} else {
		if( this.clockwise ) {
			var e = 1;
		} else {
			var e = -1;
		}
	}
	
	// length of the chord line
	var d = this.chord().len();
	/*
	var d = Math.sqrt(
		Math.pow(this.end.x-this.start.x, 2) + 
		Math.pow(this.end.y-this.start.y, 2)
	);
	*/

	var u = (this.end.x-this.start.x)/d;
	var v = (this.end.y-this.start.y)/d;

	var h = Math.sqrt(
		Math.pow(this.radius,2) - Math.pow(d,2)/4
	);

	var cx = (this.start.x + this.end.x)/2 - (e*h*v);
	var cy = (this.start.y + this.end.y)/2 + (e*h*u);
	
	return new Point(cx, cy);
}

Arc.prototype.len = function() {
	var c = this.radius*Math.PI*2;
	return c * (this.angle()/360);
}

Arc.prototype.originCenteredArc = function() {
	var start = new Point(
		this.start.x - this.center().x,
		this.start.y - this.center().y
	);
	var end = new Point(
		this.end.x - this.center().x,
		this.end.y - this.center().y
	);
	return new Arc({
		start: start,
		end: end,
		radius: this.radius,
		large: this.large,
		clockwise: this.clockwise,
		shapeClass: this.getShapeClass()
	});
}

Arc.prototype.isOriginCentered = function() {
	if( Math.abs(this.center().x) > 0.0001 ) {
		return false;
	}
	if( Math.abs(this.center().y) > 0.0001 ) {
		return false;
	}
	return true;
}

Arc.prototype.isUnitArc = function()
{
	return (
		this.radius==1 &&
		this.center().x < 0.00001 &&
		this.center().y < 0.00001
	);
	
	return this.radius==1 && this.center().x==0 && this.center().y==0;
}

Arc.prototype.unitArc = function()
{
	return this.originCenteredArc().scaleBy(1/this.radius);
}

Arc.prototype.xlateFromUnitArc = function(p)
{
	return new Point(
		p.x*this.radius + this.center().x,
		p.y*this.radius + this.center().y
	);	
}

Arc.prototype.midPoint = function() {

	if( ! this.isOriginCentered() ) { 
		var ca = this.originCenteredArc();
		camp = ca.midPoint();
		return new Point(
			this.center().x + camp.x,
			this.center().y + camp.y
		);
	}

	var rl = new Line(
		this.center(),
		this.chord().midPoint()
	);

	var xa = rl.xangle();
	xa = Math.abs(xa);	

	// sin(xa) = dy / radius
	var dy = this.radius * sin(xa);
	
	// cos(xa) = dx / radius
	var dx = this.radius * cos(xa);

	var ax = (this.start.x + this.end.x)/2;
	var ay = (this.start.y + this.end.y)/2;

	if( ax <  0 ) { var dxf = -1 }
	if( ax >  0 ) { var dxf = 1  }
	if( ax == 0 ) { var dxf = 0  }
	if( ay < 0  ) { var dyf = -1 }
	if( ay > 0  ) { var dyf = 1  }
	if( ay == 0 ) { var dyf = 0  }

	if( this.large ) {
		dxf *= -1;
		dyf *= -1;
	}

	dx*=dxf;
	dy*=dyf;
	
	return new Point(
		this.center().x+dx,
		this.center().y+dy
	);
}


Arc.prototype.reverse = function() {
	return new Arc({
		start: this.end,
		end: this.start,
		radius: this.radius,
		large: this.large,
		clockwise: ! this.clockwise
	});
}

Arc.prototype.walkSingle = function(distance, forwards)
{
	if( forwards===undefined ) { forwards=true; }
	
	if( ! this.isUnitArc() ) {
		var p = this.unitArc().walkSingle( distance*(1/this.radius), forwards );
		return this.xlateFromUnitArc(p);
	}
	
	if( ! forwards ) {
		return this.reverse().walkSingle(distance, true);
	}

	/* at this point, we're working with a unit arc (radius 1, center 0,0)
	 * and going in the forward direction only (start @start, go distance
	 * toward end) */
	
	var startPoint = this.start;

	// get the angle of a line from center to start point in radians
	var startAngle;	
	if( startPoint.x >= 0 && startPoint.y >= 0 ) {
		// quad 1. up right + +
		startAngle = Math.acos(startPoint.x);
	} else if( startPoint.x < 0 && startPoint.y >=0 ) {
		// quad 2. up left - +
		startAngle = Math.acos(startPoint.x);
	} else if( startPoint.x >= 0 && startPoint.y<0 ) {
		// quad 4. down right + -
		startAngle = Math.acos( - Math.abs(startPoint.x) ) + Math.PI;
	} else {
		// quad 3. down left - -
		startAngle = Math.acos(Math.abs(startPoint.x)) + Math.PI;
	} 
	
	/* finding the point a certain distance from the start point is simply a
	 * matter of adding the distance to the angle as measured in radians */
	if( this.clockwise ) {
		var x = Math.cos( startAngle - distance );
		var y = Math.sin( startAngle - distance );
	} else {
		var x = Math.cos(startAngle + distance );
		var y = Math.sin(startAngle + distance);
	}
	
	return new Point(x,y);
}

Arc.prototype.walk = function(distance, backwards) 
{
	var points = [];
	var numPoints = Math.floor(this.len() / distance)+1;
	
	while( points.length < numPoints ) {
		points.push( this.walkSingle(distance*points.length) );
	}

	return points;
}

Arc.prototype.walkMap = function(stepDistance, func)
{
	var pointCount=0;
	var numPoints = Math.floor(this.len() / stepDistance)+1;
	
	while( pointCount < numPoints ) 
	{
		pointCount+=1;
		
		let curPoint = this.walkSingle(stepDistance*(pointCount-1))
		
		func( new ArcStepPoint({
			x: curPoint.x, y: curPoint.y,
			arc: this,
			stepIndex: pointCount-1, stepMax: numPoints-1
		}));
			//	index: pointCount-1,
			//	maxIndex: numPoints-1,
				
	}	
	
}

Arc.prototype.walkf = function(distance, func)
{
	// TODO: This is deprecated. use walkPoints instead.
	var pointCount=0;
	var numPoints = Math.floor(this.len() / distance)+1;
	
	while( pointCount < numPoints ) 
	{
		pointCount+=1;
		
		let curPoint = this.walkSingle(distance*(pointCount-1))
		
		let radiusLine = new Line(
			this.center(),
			curPoint
		);
		
		let getPerpTanPoint = function(distance) {
			return curPoint.xlateUnitVector(
				radiusLine.toUnitVector(),
				distance
			);
		}
		
		func({
			point: curPoint,
			count: pointCount,
			getPerpTanPoint: getPerpTanPoint,
			isFirst: pointCount == 1,
			isLast: pointCount >= numPoints
		});
	}
}

Arc.prototype.walkPoints = function(distance, func) 
{
	var pointCount=0;
	var numPoints = Math.floor(this.len() / distance)+1;
	
	while( pointCount < numPoints ) 
	{
		pointCount+=1;
		
		let curPoint = this.walkSingle(distance*(pointCount-1))
		
		func(
			new WalkPoint({
				point: curPoint,
				index: pointCount-1,
				maxIndex: numPoints-1,
				center: this.center()
			})
		);
				
	}	
}

Arc.prototype.getStartArcPoint = function()
{
	return new ArcPoint(this.start.x, this.start.y, this);
}

Arc.prototype.getEndArcPoint = function()
{
	return new ArcPoint(this.end.x, this.end.y, this);
}

Arc.prototype.getStartWalkPoint = function() 
{
	return new WalkPoint({
		point: this.start,
		index: 0,
		maxIndex: 0,
		center: this.center()
	});
}

Arc.prototype.getEndWalkPoint = function() 
{
	return new WalkPoint({
		point: this.end,
		index: 0,
		maxIndex: 0,
		center: this.center()
	});
}

// **********************************************************

var ArcPoint = function(x,y,arc) {
	Point.apply(this,[x,y]);
	this.arc = arc;
}

ArcPoint.prototype = Object.create(Point.prototype);

ArcPoint.prototype.xlateOutward = function(distance) {
	var radiusLine = new Line(
		this.arc.center(),
		this
	);

	return this.xlateUnitVector(
		radiusLine.toUnitVector(),
		distance
	);
}

ArcPoint.prototype.xlateInward = function(distance) {
	var radiusLine = new Line(
		this.arc.center(),
		this
	);

	return this.xlateUnitVector(
		radiusLine.toUnitVector(),
		-distance
	);
}

// **********************************************************

var ArcStepPoint = function({x,y,arc,stepIndex,stepMax}) {
	ArcPoint.apply(this,[x,y,arc]);
	this.stepIndex = stepIndex;
	this.stepMax = stepMax;
}

ArcStepPoint.prototype = Object.create(ArcPoint.prototype);

ArcStepPoint.prototype.isFirst = function() {
	return this.stepIndex==0;
}

ArcStepPoint.prototype.isLast = function() {
	return this.stepIndex==this.stepMax;
}



// **********************************************************

var WalkPoint = function({point, index, maxIndex, center}) {
	this.point = point;
	this.index = index;
	this.maxIndex = maxIndex;
	this.center = center;
}

WalkPoint.prototype.isFirst = function() {
	return this.index==0;
}

WalkPoint.prototype.isLast = function() {
	return this.index==this.maxIndex;
}

WalkPoint.prototype.xlateTan = function(distance) {
	// TODO: returns a point in an inconsistent direction. need to know 
	// the direction around the arc we're walking
	return this.point.xlateSlope(this.tanSlope, distance);
}

WalkPoint.prototype.xlateOutward = function(distance) {
	var radiusLine = new Line(
		this.center,
		this.point
	);

	return this.point.xlateUnitVector(
		radiusLine.toUnitVector(),
		distance
	);
}

WalkPoint.prototype.xlateInward = function(distance) {
	var radiusLine = new Line(
		this.center,
		this.point
	);

	return this.point.xlateUnitVector(
		radiusLine.toUnitVector(),
		-distance
	);
}

WalkPoint.prototype.toString = function() {
	return this.point.toString();
}

exports.Arc = Arc;
