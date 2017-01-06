
function roundTo( value, precision ) {
	var m = Math.pow(10,precision);
	return Math.round(value*m)/m;
}

/////////////////////////////////////////////////////

var Point = function(x,y) {
	this.x = x;
	this.y = y;
};

Point.prototype.toString = function() {
	return 'Point(' + roundTo(this.x,3) + ',' + roundTo(this.y,3) + ')';
};

Point.prototype.toStringShort = function() {
	return roundTo(this.x,3) + ',' + roundTo(this.y,3);
};

Point.prototype.xlateAngular = function(a, d) {

	/* return a point that is distance d from this point at the given angle
	 * a. 90 = straight up. 0 = right */

	var h = d * sin(a);
	var w = d * cos(a);
	return P( this.x+w, this.y+h );
};

Point.prototype.ymirror = function() {
	return P( -this.x, this.y );
};

function P(x,y) {
	return new Point(x,y);
};

////////////////////////////////////////////////////////////////

var Shape = function() {
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

////////////////////////////////////////////////////////////////

var Line = function() {

	if( arguments.length==2 )
	{
		var start = arguments[0];
		var end = arguments[1];
		
		if( ! (start instanceof Point) ) {
			throw new Error('start must be an instance of Point, not '+start);
		}
		if( ! (end instanceof Point) ) {
			throw new Error('end must be an instance of Point, not '+end);
		}
		this.start = start;
		this.end = end;
	} else if( arguments.length==1 ) {
		/* constructor call with a single object containing parameters */
		
		var a = validateLineArg(arguments[0]);
		
		this.start = a.start;
		this.end = a.end;
	} else {
		throw new Error('Line() called with incorrect number of arguments');
	}

	this.comment = null;
};

function validateLineArg(a) {
	if( typeof(a) != 'object' ) {
		throw new Error('Line() called with argument but that argument is not an object.');
	}
	
	['start','end'].map( function(attName) {
		if( a[attName] === undefined ) {
			throw new Error('Line() called with an object as sole parameter; object does not have a "'+attName+'" attribute.');
		} else if ( a[attName] instanceof Point ) {
			// given a Point
		} else if( typeof(a[attName])=='object' && a[attName].length==2 ) {
			// given an array of two things
			if( typeof(a[attName][0]) == 'number' && typeof(a[attName][1])=='number' ) {
				a[attName] = new Point(
					a[attName][0],
					a[attName][1]
				);
			} else {
				throw new Error('Line() called with an object as sole parameter; attribute "'+attName+'" is not an array containing two numbers.');
			}
		} else {
			throw new Error('Line() called with an object as sole parameter; attribute "'+attName+'" is neither a Point nor an object.');
		}

	});
	
	return a
};

Line.prototype = Object.create(Shape.prototype);

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
	return new Line(
		start = new Point( this.start.x*s, this.start.y*s),
		end = new Point( this.end.x*s, this.end.y*s)
	);
};

Line.prototype.xlate = function(dx, dy) {
	// return a new line identical this one by shifted by dx along the X
	// axis and dy along the Y axis.
	return new Line(
		start = P( this.start.x+dx, this.start.y+dy ),
		end = P( this.end.x+dx, this.end.y+dy )
	);
};

Line.prototype.ymirror = function() {
	// return a new line identical to this one but mirrored about the Y axis
	return new Line(
		P( -this.start.x, this.start.y),
		P( -this.end.x,   this.end.y)
	);
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
	
	return new Line(
		this.start.xlateAngular(a, d),
		this.end.xlateAngular(a, d)
	);
};

Line.prototype.parallelLine = function(d) { 
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

/////////////////////////////////////////////////////////////

function bezier(params) {
	return new Bezier(
		params.start, params.sctl,
		params.ectl, params.end
	);
};

var Bezier = function(start, sctl, ectl, end) {

	if( arguments.length == 4 ) {
	
		/* constructor call in the traditional manner */
	
		var start = arguments[0];
		var sctl  = arguments[1];
		var ectl  = arguments[2];
		var end   = arguments[3];

		if( ! (start instanceof Point) ) {
			throw new Error('start must be an instance of Point, not '+start);
		}
		if( ! (end instanceof Point) ) {
			throw new Error('end must be an instance of Point, not '+end);
		}
		if( ! (sctl instanceof Point) ) {
			throw new Error('sctl must be an instance of Point, not '+start);
		}
		if( ! (ectl instanceof Point) ) {
			throw new Error('ectl must be an instance of Point, not '+end);
		}
	
		this.start = start;
		this.sctl = sctl;
		this.ectl = ectl;
		this.end = end;
		
	} else if( arguments.length==1 ) {
	
		/* constructor call with a single object containing parameters */

		var a = validateBezierArg(arguments[0]);

		this.start = a.start;
		this.sctl = a.sctl;
		this.end = a.end;
		this.ectl = a.ectl;
		
	} else {
		throw new Error('Bezier() called with incorrect number of arguments');
	}
};

function validateBezierArg(a) {
	if( typeof(a)  != 'object' ) {
		throw new Error('Bezier() called with one argument but that argument is not an object.');
	}
			
	// make sure the object has all required parameters
	['start','sctl','end','ectl'].map( function(attName) {
		if( a[attName] === undefined ) {
			throw new Error('Bezier() called with an object as sole parameter; object does not have a "'+attName+'" attribute.');
		} else if ( a[attName] instanceof Point ) {
			// given a Point
		} else if( typeof(a[attName])=='object' && a[attName].length==2 ) {
			// given an array of two things
			if( typeof(a[attName][0]) == 'number' && typeof(a[attName][1])=='number' ) {
				a[attName] = new Point(
					a[attName][0],
					a[attName][1]
				);
			} else {
				throw new Error('Bezier() called with an object as sole parameter; attribute "'+attName+'" is not an array containing two numbers.');
			}
		} else {
			throw new Error('Bezier() called with an object as sole parameter; attribute "'+attName+'" is neither a Point nor an object.');
		}
	});

	return a;
};

Bezier.prototype = Object.create(Shape.prototype);

Bezier.prototype.getPointNames = function () {
	return ['start','sctl','ectl','end'];
};

Bezier.prototype.ymirror = function() {
	return bezier({
		start: P( -this.start.x, this.start.y),		sctl: P( -this.sctl.x, this.sctl.y ),
		end:   P( -this.end.x,   this.end.y), 		ectl: P( -this.ectl.x, this.ectl.y )
	})
};

Bezier.prototype.toString = function() {
	return (
		'Bezier '+this.start.x+','+this.start.y+
		' ['+this.sctl.x+','+this.sctl.y+'] -> '+
		this.end.x+','+this.end.y+
		' ['+this.ectl.x+','+this.ectl.y+']'
	);
}

Bezier.prototype.scaleBy = function(s) {
	return new Bezier(
		start = new Point( this.start.x*s, this.start.y*s ),
		sctl = new Point( this.sctl.x*s, this.sctl.y*s ),
		ectl = new Point( this.ectl.x*s, this.ectl.y*s ),
		end = new Point( this.end.x*s, this.end.y*s )
	);
};

Bezier.prototype.xlate = function(dx, dy) {
	return new Bezier(
		start = P( this.start.x+dx, this.start.y+dy ),
		sctl = P( this.sctl.x+dx, this.sctl.y+dy ),
		ectl = P( this.ectl.x+dx, this.ectl.y+dy ),
		end =  P( this.end.x+dx, this.end.y+dy )
	);
};

Bezier.prototype.xlateAngular = function(a, d) {
	/* return a Bezier similar to this one but is shifted by distance d in
	 * direction a.  a is an angle in degrees measured with respect to the X
	 * axis.  a=90 is straight up.  a=0 is to the right.  a and d may be
	 * negative.
	 */
	
	return new Bezier(
		this.start.xlateAngular(a, d),
		this.sctl.xlateAngular(a, d),
		this.ectl.xlateAngular(a, d),
		this.end.xlateAngular(a, d)
	);
};

/////////////////////////////////////////////////////////////

var Arc_OLD = function(start, end, radius, large, clockwise) {
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
};

var Arc = function() {
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
};

function validateArcArg(a) {
	if( typeof(a)  != 'object' ) {
		throw new Error('Bezier() called with one argument but that argument is not an object.');
	}

	// make sure the object has valid start,end Point attributes
	// transform an array of two numbers into a Point if needed.
	['start','end'].map( function(attName) {
		if( a[attName] === undefined ) {
			throw new Error('Arc() called with an object as sole parameter; object does not have a "'+attName+'" attribute.');
		} else if ( a[attName] instanceof Point ) {
			// given a Point
		} else if( typeof(a[attName])=='object' && a[attName].length==2 ) {
			// given an array of two things
			if( typeof(a[attName][0]) == 'number' && typeof(a[attName][1])=='number' ) {
				a[attName] = new Point(
					a[attName][0],
					a[attName][1]
				);
			} else {
				throw new Error('Arc() called with an object as sole parameter; attribute "'+attName+'" is not an array containing two numbers.');
			}
		} else {
			throw new Error('Arc() called with an object as sole parameter; attribute "'+attName+'" is neither a Point nor an object.');
		}
	});
	
	// start and end are valid.
	
	if( a.radius === undefined ) {
		throw new Error('Arc() called with an object as sole parameter; object does not have a radius attribute');
	}
	if( typeof(a.radius) != 'number' ) {
		throw new Error('Arc() called with an object as sole parameter; radius attribute is not a number');
	}
	
	// start, end, radius are valid. now validate the boolean params.
	
	['large','clockwise'].map( function(attName) {
		if( a[attName] === undefined ) {
			throw new Error('Arc() called with an object as sole parameter; object does not have a "'+attName+'" attribute.');
		}
		if( typeof(a[attName]) != 'boolean' ) {
			throw new Error('Arc() called with an object as sole parameter; "'+attName+'" attribute is not a boolean.');
		}
	});

	return a;
};

Arc.prototype = Object.create(Shape.prototype);

Arc.prototype.getPointNames = function() {
	return ['start','end'];
};

// TODO: inherited getExtent is NOT correct. must take radius into account
// usually

Arc.prototype.ymirror = function() {
	return new Arc(
		P(-this.start.x, this.start.y),
		P(-this.end.x, this.end.y),
		this.radius,
		this.large,
		! this.clockwise
	);
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
	return new Arc(
		start = new Point( this.start.x+dx, this.start.y+dy),
		end = new Point( this.end.x+dx, this.end.y+dy),
		radius = this.radius,
		large = this.large,
		clockwise = this.clockwise
	);
}

Arc.prototype.scaleBy = function(s) {
	return new Arc(
		start = new Point( this.start.x*s, this.start.y*s ),
		end = new Point( this.end.x*s, this.end.y*s ),
		radius = this.radius * s,
		large = this.large,
		clockwise = this.clockwise
	);
}

Arc.prototype.xlateAngular = function(a, d) {
	return new Arc(
		start  = this.start.xlateAngular(a,d),
		end    = this.end.xlateAngular(a,d),
		radius = this.radius,
		large  = this.large,
		clockwise = this.clockwise
	);
}

//////////////////////////////////////////////////////////////

function degreesToRadians(d) {
	return (d*Math.PI) / 180;
}

function radiansToDegrees(r) {
	return r * (180/Math.PI);
}

function sin(d) {
	return Math.sin(
		degreesToRadians(d)
	)
}

function cos(d) {
	return Math.cos(
		degreesToRadians(d)
	)
}

function tan(d) {
	return Math.tan(
		degreesToRadians(d)
	)
}

//////////////////////////////////////////////////////////////

function circleFromPoints( a, b, c ) {
	var r = new Line(a,b);
	var t = new Line(b,c);
	
	// compute the X coordinate of the center
	var n = ( r.slope() * t.slope() * (c.y-a.y)  +  r.slope() * (b.x+c.x)  -  t.slope() * (a.x+b.x) );
	var d = 2 * ( r.slope() - t.slope() );
	var x = n/d;
	
	// compute the Y coordinate of the center
	var y = (-1.0/r.slope()) * (x - (a.x+b.x)/2.0) + (a.y+b.y)/2.0;
	
	// compute the radius
	var radius = Math.sqrt( 
		Math.pow(b.x-x, 2) + Math.pow(b.y-y, 2)
	);
	
	return {
		centerX: x,
		centerY: y,
		radius: radius
	};
};


/////////////////////////////////////////////////////////////


exports.Point = Point;
exports.Line = Line;
exports.Bezier = Bezier;
exports.Arc = Arc;
exports.P = P;
exports.bezier = bezier;
exports.circleFromPoints = circleFromPoints;
