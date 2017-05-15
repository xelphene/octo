
const Point = require('./point').Point;
const Shape = require('./shape').Shape;
const Line  = require('./line').Line;
const asin  = require('../util').asin;

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
		new Point(-this.start.x, this.start.y),
		new Point(-this.end.x, this.end.y),
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

exports.Arc = Arc;
