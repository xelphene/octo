
const Shape = require('./shape').Shape;
const Point = require('./point').Point;
const radiansToDegrees = require('../util').radiansToDegrees;

var Line = function() {
	Shape.call(this);

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
		
		// TODO: shapeClass is broken in general. class setting gets lost somewhere.
		if( 'shapeClass' in a ) {
			this.setShapeClass(a.shapeClass);
		}
		
	} else {
		throw new Error('Line() called with incorrect number of arguments');
	}

	this.comment = undefined;
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

Line.prototype.slope = function() {
	// y = mx+b
	return (this.end.y - this.start.y) / (this.end.x - this.start.x);
};

Line.prototype.toString = function() {
	//return 'Line '+this.start.x+','+this.start.y+' -> '+this.end.x+','+this.end.y;
	return 'Line '+this.start.toStringShort()+' -> '+this.end.toStringShort();
};

Line.prototype.isVertical = function() {
	return this.start.x==this.end.x;
};

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

exports.Line = Line;
