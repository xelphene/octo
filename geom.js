
const util = require('./util.js');
const roundTo = util.roundTo;
const degreesToRadians = util.degreesToRadians;
const radiansToDegrees = util.radiansToDegrees;
const sin  = util.sin;
const cos  = util.cos;
const tan  = util.atan;
const asin = util.asin;

/////////////////////////////////////////////////////

var Point = function(x,y) {
	if( typeof(x)!='number' || isNaN(x) ) {
		throw new Error('number required for x to Point constructor, not '+x);
	}
	if( typeof(y)!='number' || isNaN(y) ) {
		throw new Error('number required for x to Point constructor, not '+y);
	}
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
		
		if( start instanceof Point ) {
			this.start = start;
		} else if( typeof(start)=='object' && start.length==2 ) {
			if( typeof(start[0]) == 'number' && typeof(start[1])=='number' ) {
				this.start = new Point(start[0], start[1]);
			} else {
				throw new Error('if start is an array, it must be an array of two numbers, not '+start);
			}
		} else {
			throw new Error('start must be an instance of Point, not '+start);
		}

		if( end instanceof Point ) {
			this.end = end;
		} else if( typeof(end)=='object' && end.length==2 ) {
			if( typeof(end[0]) == 'number' && typeof(end[1])=='number' ) {
				this.end = new Point(end[0], end[1]);
			} else {
				throw new Error('if end is an array, it must be an array of two numbers, not '+end);
			}
		} else {
			throw new Error('end must be an instance of Point, not '+end);
		}


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
		if( ! a.hasOwnProperty(attName) ) {
			throw new Error('Line() called with an object as sole parameter and object does not have a "'+attName+'" attribute.');
		} else if( a[attName] === undefined ) {
			throw new Error('Line() called with an object as sole parameter and object "'+attName+'" attribute is undefined.');
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
		'Bezier '+roundTo(this.start.x,3)+','+roundTo(this.start.y,3)+
		' ['+roundTo(this.sctl.x,3)+','+roundTo(this.sctl.y,3)+'] -> '+
		roundTo(this.end.x,3)+','+roundTo(this.end.y,3)+
		' ['+roundTo(this.ectl.x,3)+','+roundTo(this.ectl.y,3)+']'
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

Bezier.prototype.interval = function(t) {
	var x = (
		this.start.x *                     Math.pow((1-t),3) + // start * (1-t)^3
		this.sctl.x  * 3 * t *             Math.pow((1-t),2) + // sctl * 3 * (1-t)^2
		this.ectl.x  * 3 * Math.pow(t,2) * (1-t)             + // ectl * 3 * t^2 * (1-t)
		this.end.x   *     Math.pow(t,3)                       // end * t^3
	);
	var y = (
		this.start.y *                     Math.pow((1-t),3) + // start * (1-t)^3
		this.sctl.y  * 3 * t *             Math.pow((1-t),2) + // sctl * 3 * (1-t)^2
		this.ectl.y  * 3 * Math.pow(t,2) * (1-t)             + // ectl * 3 * t^2 * (1-t)
		this.end.y   *     Math.pow(t,3)                       // end * t^3
	);
	return new Point(x,y);
}

Bezier.prototype.intervalDeriv = function(t) {
	var x = (
		3 * Math.pow((1-t),2) * (this.sctl.x-this.start.x) + // 3 * (1-t)^2 * (sctl-start)
		6 * (1-t) * t * (this.ectl.x-this.sctl.x) +          
		3 * Math.pow(t,2) * (this.end.x-this.ectl.x)
	);
	var y = (
		3 * Math.pow((1-t),2) * (this.sctl.y-this.start.y) + // 3 * (1-t)^2 * (sctl-start)
		6 * (1-t) * t * (this.ectl.y-this.sctl.y) +          
		3 * Math.pow(t,2) * (this.end.y-this.ectl.y)
	);
	return new Point(x,y);
	//return x/y;
}

Bezier.prototype.flatten = function(numLines) {
	if( numLines < 1 ) {
		throw new Error('numLines must be >=1');
	}
	var lines = [];
	var priorT=null;
	for( var i=0; i<=numLines; i++ ) {
		var t = i*(1/numLines);
		//console.log('i='+i+' t='+t+' priorT='+priorT);
		
		if( priorT != null ) {
			var l = new Line({
				start: this.interval(priorT),
				end: this.interval(t)
			});
			//console.log('   '+l);
			lines.push(l);
		}
		
		priorT=t;
	}
	return lines;
}

Bezier.prototype.len = function(precision) {

	/* approximate the length of this Bezier curve. precision must be a
	positive integer.  The greater the precision, the more accurate this
	length will be but the longer it will take.  */

	/* This works based on approximating the curve with straight line
	 * segments drawn from start to end.  precision is the number of
	 * segments.  */

	if( precision === null ) {
		precision=10;
	}
	var sum=0;
	this.flatten(precision).map( (line) => {
		sum+=line.len();
	});
	return sum;
}

/////////////////////////////////////////////////////////////

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

Arc.prototype.center = function() {
	// TODO: make this computed in the future
	return this.preComputedCenter;
};

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

Arc.prototype.len = function() {
	var c = this.radius*Math.PI*2;
	return c * (this.angle()/360);
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

function extractShapesFromObject(obj, onUnknown) {
	var rv = [];
	if( typeof(obj)=='object' ) {
		if( obj instanceof Shape ) {
			rv.push(obj);
		} else if( obj instanceof Array ) {
			obj.map( (x) => {
				extractShapesFromObject(x,onUnknown).map( (newobj) => {
					rv.push(newobj);
				});
			});
		} else {
			Object.keys(obj).map( (k) => {
				extractShapesFromObject(obj[k],onUnknown).map( (newobj) => {
					rv.push(newobj);
				});
			});
		}
	} else {
		if( onUnknown ) {
			onUnknown(obj);
		}
	}
	return rv;
}


/////////////////////////////////////////////////////////////


exports.Point = Point;
exports.Line = Line;
exports.Bezier = Bezier;
exports.Arc = Arc;
exports.P = P;
exports.bezier = bezier;
exports.circleFromPoints = circleFromPoints;
exports.Shape = Shape;
exports.extractShapesFromObject = extractShapesFromObject;
