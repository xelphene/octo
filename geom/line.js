
const Shape = require('./shape').Shape;
const Point = require('./point').Point;
const UnitVector = require('./unitvector').UnitVector;
const radiansToDegrees = require('../util').radiansToDegrees;
const makeDualCardinalPicker = require('./point').makeDualCardinalPicker;

var Line = function() {
	Shape.apply(this, arguments);

	if( arguments.length==2 )
	{
		var start = arguments[0];
		var end = arguments[1];
		
		if( start instanceof Point ) {
			this.start = start;
		} else if( Array.isArray(start) && start.length==2 ) {
			if( typeof(start[0]) == 'number' && typeof(start[1])=='number' ) {
				this.start = new Point(start[0], start[1]);
			} else {
				throw new Error('if start is an array, it must be an array of two numbers, not '+start);
			}
		} else {
			throw new Error('start must be an instance of Point or an array of two numbers, not '+start);
		}

		if( end instanceof Point ) {
			this.end = end;
		} else if( Array.isArray(end) && end.length==2 ) {
			if( typeof(end[0]) == 'number' && typeof(end[1])=='number' ) {
				this.end = new Point(end[0], end[1]);
			} else {
				throw new Error('if end is an array, it must be an array of two numbers, not '+end);
			}
		} else {
			throw new Error('end must be an instance of Point or an array of two numbers, not '+end);
		}


	} else if( arguments.length==1 ) {
		/* constructor call with a single object containing parameters */
		
		var a = validateLineArg(arguments[0]);
		
		this.start = a.start;
		this.end = a.end;
		
	} else {
		throw new Error('Line() called with incorrect number of arguments');
	}
};

function validateLineArg(a) {
	if( typeof(a) != 'object' ) {
		throw new Error('Line() called with argument but that argument is not an object.');
	}
	
	['start','end'].map( (attName) => {
		if( ! (attName in a) ) {
			throw new Error('Line() called with an object as sole parameter and object does not have a "'+attName+'" attribute.');
		}

		if ( a[attName] instanceof Point ) {
			// already the right kind of object. nothing to do.		
		} else if( Array.isArray(a[attName]) ) {
			// given an array 
			if( a[attName].length==2 && typeof(a[attName][0]) == 'number' && typeof(a[attName][1])=='number' ) {
				a[attName] = new Point(
					a[attName][0],
					a[attName][1]
				);
			} else {
				throw new Error('Line() called with an object as sole parameter; attribute "'+attName+'" is an array but it does not contain two numbers; it is '+a[attName]);
			}
		} else {
			throw new Error('Line() called with an object as sole parameter; attribute "'+attName+'" is neither a Point nor an array; it is '+a[attName]);
		}
	});

	return a;
}


Line.prototype = Object.create(Shape.prototype);

Line.prototype.argumentsToJSON = function() { 
	return {
		start: [this.start.x, this.start.y],
		end:   [this.end.x, this.end.y],
		comment: this.comment
	}
}

Line.prototype.midPoint = function() {
	var x = (this.start.x + this.end.x)/2;
	var y = (this.start.y + this.end.y)/2;
	return new Point(x,y);
}

Line.prototype.getPointNames = function() {
	return ['start','end'];
};

Line.prototype.len = function() {
	a = Math.abs(this.start.x - this.end.x);
	b = Math.abs(this.start.y - this.end.y);
	return Math.sqrt( Math.pow(a,2) + Math.pow(b,2) );
};

Object.defineProperty(Line.prototype, 'length', {
	get: function() { return this.len() }
});

Line.prototype.slope = function() {
	// y = mx+b
	return (this.end.y - this.start.y) / (this.end.x - this.start.x);
};

Line.prototype.intersection = function(other) 
{
	// based on
	// https://www.geeksforgeeks.org/program-for-point-of-intersection-of-two-lines/
	var a1 = this.end.y - this.start.y;
	var b1 = this.start.x - this.end.x;
	var c1 = a1*this.start.x + b1*this.start.y;
	
	var a2 = other.end.y - other.start.y;
	var b2 = other.start.x - other.end.x;
	var c2 = a2*other.start.x + b2*other.start.y;
	
	var d = a1*b2 - a2*b1;
	if( d==0 ) {
		throw new Error("intersection() called on parallel lines");
	}
	
	var x = (b2*c1 - b1*c2)/d;
	var y = (a1*c2 - a2*c1)/d;

	return new Point(x,y);
}

Line.prototype.toString = function() {
	//return 'Line '+this.start.x+','+this.start.y+' -> '+this.end.x+','+this.end.y;
	return 'Line '+this.start.toStringShort()+' -> '+this.end.toStringShort();
};

Line.prototype.isVertical = function() {
	return this.start.x==this.end.x;
};

Line.prototype.isHorizontal = function() {
	return this.start.y==this.end.y;
}

Line.prototype.scaleBy = function(s) {
	return new Line({
		start: new Point( this.start.x*s, this.start.y*s),
		end: new Point( this.end.x*s, this.end.y*s),
		shapeClass: this.getShapeClass()
	});
};

Line.prototype.xlate = function(dx, dy) {
	// return a new line identical this one by shifted by dx along the X
	// axis and dy along the Y axis.
	return new Line({
		start: new Point( this.start.x+dx, this.start.y+dy ),
		end: new Point( this.end.x+dx, this.end.y+dy ),
		shapeClass: this.getShapeClass()
	});
};

Line.prototype.xlateUnitVector = function(v, d) {
	return new Line({
		start: this.start.xlateUnitVector(v,d),
		end:   this.end.xlateUnitVector(v,d),
		shapeClass: this.getShapeClass()
	});
}

Line.prototype.xlatef = function(xlatePoint, xlateLength) {
	/* f is a function which takes a Point and returns a Point.
	 * f will typically move all Points comprising this Shape in
	 * the same manner.
	 */
	return new Line({
		start: xlatePoint(this.start),
		end: xlatePoint(this.end),
		shapeClass: this.getShapeClass()
	});
}

Line.prototype.ymirror = function() {
	// return a new line identical to this one but mirrored about the Y axis
	return new Line({
		start: new Point( -this.start.x, this.start.y),
		end: new Point( -this.end.x,   this.end.y),
		shapeClass: this.getShapeClass()
	});
};

Line.prototype.yint = function() {
	// return the y-intercept of this line
	return this.slope() * (0-this.start.x) + this.start.y;
};

Line.prototype.xangle = function() {
	// return angle in degrees of this line with respect to x axis
	h = Math.abs(this.start.y - this.end.y);
	w = Math.abs(this.start.x - this.end.x);
	a = Math.atan(h/w);
	if( this.slope() < 0 ) {
		return -radiansToDegrees(a);
	} else{
		return radiansToDegrees(a);
	}
};

Line.prototype.xlateAngular = function(a, d) {
	/* return a line similar to this one but is shifted by distance d in
	 * direction a.  a is an angle in degrees measured with respect to the X
	 * axis.  a=90 is straight up.  a=0 is to the right.  a and d may be
	 * negative.
	 */
	
	return new Line({
		start: this.start.xlateAngular(a, d),
		end: this.end.xlateAngular(a, d),
		shapeClass: this.getShapeClass()
	});
};

Line.prototype.getParallel = function(d) { 
	/*
	 * return a new Line parallel AND distance d from this one.
	 *
	 * for ascending lines (those where start.y > end.y), a positive value
	 * for d will return a line to the right (X+) of this line.
	 *
	 * for descending lines (those where start.y < end.y), a positive value
	 * for d will return a line to the left (X-) of this line.
	 * 
	 * for horizontal lines (start.y==end.y), a positive value for d will
	 * return a line below (Y-) of this line.
	 */
	
	return this.xlateAngular(this.xangle()+90, d);
};

Line.prototype.walk = function(distance, backwards) {
	var numPoints = Math.floor(this.len()/distance);
	var points = [];
	
	if( ! backwards ) {
		points.push(this.start);
		var xOffset = ( this.end.x-this.start.x ) / ( this.len()/distance );
		var yOffset = ( this.end.y-this.start.y ) / ( this.len()/distance );
	} else {
		points.push(this.end);
		var xOffset = ( this.start.x-this.end.x ) / ( this.len()/distance );
		var yOffset = ( this.start.y-this.end.y ) / ( this.len()/distance );
	}

	for( var i=1; i<=numPoints; i++ ) {
		let last = points[points.length-1];
		points.push( new Point(
			last.x + xOffset,
			last.y + yOffset
		));
	}
	return points;
}

Line.prototype.walkf = function(distance, func) {
	var numPoints = Math.floor(this.len()/distance)+1;
	var curPoint = this.start;
	var xOffset = ( this.end.x-this.start.x ) / ( this.len()/distance );
	var yOffset = ( this.end.y-this.start.y ) / ( this.len()/distance );
	var thisLine = this;

	for( var i=1; i<=numPoints; i++ ) 
	{
		let getPerpTanPoint = function(distance) {
			let uv = thisLine.toUnitVector();
			return curPoint.xlateUnitVector(
				thisLine.toUnitVector().rotate90cw(),
				distance
			);
		}
	
		func({
			count: i,
			point: curPoint,
			isFirst: i==1,
			isLast: i==numPoints,
			getPerpTanPoint: getPerpTanPoint
		});
		
		curPoint = new Point(
			curPoint.x + xOffset,
			curPoint.y + yOffset
		);
	}
}

Line.prototype.walkMap = function(distance, func) {
	var numPoints = Math.floor(this.len()/distance)+1;
	var curPoint = this.start;
	var xOffset = ( this.end.x-this.start.x ) / ( this.len()/distance );
	var yOffset = ( this.end.y-this.start.y ) / ( this.len()/distance );
	var thisLine = this;

	for( var i=1; i<=numPoints; i++ ) 
	{
		func( new LineStepPoint({
			x: curPoint.x, y: curPoint.y,
			line: thisLine,
			stepIndex: i-1, stepMax: numPoints-1
		}));
		
		curPoint = new Point(
			curPoint.x + xOffset,
			curPoint.y + yOffset
		);
	}
}

Line.prototype.toUnitVector = function() {
	var x = this.end.x-this.start.x;
	var y = this.end.y-this.start.y;
	if( x==0 && y==0 ) {
		throw new Error('Cannot create a unit vector from a line of length 0');
	}
	return new UnitVector( x/this.len(), y/this.len() );
}

Line.prototype.reverse = function() {
	return new Line(this.end, this.start);
}

Object.defineProperty(Line.prototype, 'highestEndPoint', {
	get: function() {
		if( this.isHorizontal() ) {
			throw new Error('Line.highestEndPoint is not valid on a horizontal line.');
		}
		if( this.start.y > this.end.y ) {
			return new LinePoint(this.start.x, this.start.y, this);
		} else {
			return new LinePoint(this.end.x, this.end.y, this);
		}
	}
});

Object.defineProperty(Line.prototype, 'lowestEndPoint', {
	get: function() {
		if( this.isHorizontal() ) {
			throw new Error('Line.highestEndPoint is not valid on a horizontal line.');
		}
		if( this.start.y < this.end.y ) {
			return new LinePoint(this.start.x, this.start.y, this);
		} else {
			return new LinePoint(this.end.x, this.end.y, this);
		}
	}
});

Object.defineProperty(Line.prototype, 'leftmostEndPoint', {
	get: function() {
		if( this.isVertical() ) {
			throw new Error('Line.lowestEndPoint is not valid on a vertical line.');
		}
		if( this.start.x < this.end.x ) {
			return new LinePoint(this.start.x, this.start.y, this);
		} else {
			return new LinePoint(this.end.x, this.end.y, this);
		}
	}
});

Object.defineProperty(Line.prototype, 'rightmostEndPoint', {
	get: function() {
		if( this.isVertical() ) {
			throw new Error('Line.lowestEndPoint is not valid on a vertical line.');
		}
		if( this.start.x > this.end.x ) {
			return new LinePoint(this.start.x, this.start.y, this);
		} else {
			return new LinePoint(this.end.x, this.end.y, this);
		}
	}
});

/* less clear than above 
Object.defineProperty(Line.prototype, 'leftmostEndPoint', {
	get: function() { return this.getHorizontalEndPoint(false) }
});
Object.defineProperty(Line.prototype, 'rightmostEndPoint', {
	get: function() { return this.getHorizontalEndPoint(true) }
});

function xor(a,b) {
	return (a||b) && ! ( a && b );
}

Line.prototype.getHorizontalEndPoint = function(sense) {
	if( this.isVertical() ) {
		throw new Error('operation is not valid on a vertical line.');
	}
	if( xor(this.start.x > this.end.x, sense) ) {
		return new LinePoint(this.start.x, this.start.y, this);
	} else {
		return new LinePoint(this.end.x, this.end.y, this);
	}
}
*/

// **********************************************************

var LinePoint = function(x,y,line) {
	Point.apply(this,[x,y]);
	this.line = line;
}

LinePoint.prototype = Object.create(Point.prototype);

LinePoint.prototype.xlateLinear = function(distance, dirPref1, dirPref2) {
	if( !( dirPref1 in ALL_DIR_PREFS ) ) {
		throw new Error('dirPref1 must be a direction preference constant, not '+dirPref1);
	}
	if( !( dirPref2 in ALL_DIR_PREFS ) ) {
		throw new Error('dirPref2 must be a direction preference constant, not '+dirPref2);
	}
	
	var pp = this.xlateUnitVector(this.line.toUnitVector(), distance);
	var np = this.xlateUnitVector(this.line.reverse().toUnitVector(), distance);
	
	if( dirPref1 == UP ) {
		if( pp.y > np.y ) {
			return pp;
		} else if( pp.y < np.y ) {
			return np;
		} else {
			if( dirPref2 == RIGHT ) {
				if( pp.x > np.x ) {
					return pp;
				} else {
					return np;
				}
			}
		}
	} else {
		throw new Error('dirPref1 must be a direction preference constant, not '+dirPref1);
	}
		
}

LinePoint.prototype.xlatePerpCardinal = function(distance, dirPref1, dirPref2) {
	var pick = makeDualCardinalPicker(dirPref1, dirPref2);
	var p1 = this.xlateUnitVector(this.line.toUnitVector().rotate90cw(), distance);
	var p2 = this.xlateUnitVector(this.line.reverse().toUnitVector().rotate90cw(), distance);
	var [p, _] = pick(p1,p2);
	return p;
}

// **********************************************************

var LineStepPoint = function({x,y,line,stepIndex,stepMax}) {
	LinePoint.apply(this,[x,y,line]);
	this.stepIndex = stepIndex;
	this.stepMax = stepMax;
	this.vector = line.toUnitVector();
}

LineStepPoint.prototype = Object.create(LinePoint.prototype);

LineStepPoint.prototype.isFirst = function() {
	return this.stepIndex==0;
}

LineStepPoint.prototype.isLast = function() {
	return this.stepIndex==this.stepMax;
}

LineStepPoint.prototype.xlateForward = function(dist) { 
	return this.xlateUnitVector(this.vector, dist);
}
LineStepPoint.prototype.xlateBackward = function(dist) {
	return this.xlateUnitVector(this.vector, -dist);
}
LineStepPoint.prototype.xlateLeft = function(dist) {
	return this.xlateUnitVector(this.vector.rotate90ccw(), dist);
}
LineStepPoint.prototype.xlateRight = function(dist) { 
	return this.xlateUnitVector(this.vector.rotate90cw(), dist);
}


// **********************************************************

exports.Line = Line;
