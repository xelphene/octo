
var Point = function(x,y) {
	this.x = x;
	this.y = y;
};

Point.prototype.toString = function() {
	return 'Point('+this.x+','+this.y+')';
};

Point.prototype.offset = function(a, d) {

	/* return a point that is distance d from this point at the given angle
	 * a. 90 = straight up. 0 = right */

	var h = d * sin(a);
	var w = d * cos(a);
	return P( this.x+w, this.y+h );
};


function P(x,y) {
	return new Point(x,y);
};

////////////////////////////////////////////////////////////////

var Line = function(start, end, comment) {
	if( ! (start instanceof Point) ) {
		throw new Error('start must be an instance of Point, not '+start);
	}
	if( ! (end instanceof Point) ) {
		throw new Error('end must be an instance of Point, not '+end);
	}
	this.start = start;
	this.end = end;
	this.comment = comment;
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
	return 'Line '+this.start.x+','+this.start.y+' -> '+this.end.x+','+this.end.y;
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
	return new Line(
		start = P( this.start.x+dx, this.start.y+dy ),
		end = P( this.end.x+dx, this.end.y+dy )
	);
};

Line.prototype.ymirror = function() {
	return new Line(
		P( -this.start.x, this.start.y),
		P( -this.end.x,   this.end.y)
	);
};

Line.prototype.yint = function() {
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

// TODO: probably deletable
Line.prototype.offsetPoint = function(p, d) {
	/* given a point p on this line (not verified), return a new point which
	is distance d along the perpendicular line at this point */
	var a = this.xangle();
	a -= 90; // perpendicular
	var h = d * sin(a);
	var w = d * cos(a);
	return P( p.x+w, p.y+h );
};

Line.prototype.startOffsetPoint = function(d) {
	return this.start.offset(this.xangle()-90, d);
};

Line.prototype.endOffsetPoint = function(d) {
	return this.end.offset(this.xangle()-90, d);
};

/*
Line.prototype.offsetLine = function(d) {
	return new Line(
		this.startOffsetPoint(d),
		this.endOffsetPoint(d)
	);
};
*/

Line.prototype.xlateAngular = function(a, d) {
	return new Line(
		this.start.offset(a, d),
		this.end.offset(a, d)
	);
};

Line.prototype.offsetLine = function(d) { 
	return this.xlateAngular(this.xangle()-90, d);
};

Line.prototype.getRightExtent = function() {
	if( this.start.x > this.end.x ) {
		return this.start.x;
	} else {
		return this.end.x;
	}
};

Line.prototype.getLeftExtent = function() {
	if( this.start.x < this.end.x ) {
		return this.start.x;
	} else {
		return this.end.x;
	}
};

Line.prototype.getTopExtent = function() {
	if( this.start.y > this.end.y ) {
		return this.start.y;
	} else {
		return this.end.y;
	}
};

Line.prototype.getBottomExtent = function() {
	if( this.start.y < this.end.y ) {
		return this.start.y;
	} else {
		return this.end.y;
	}
};

/////////////////////////////////////////////////////////////

function bezier(params) {
	return new Bezier(
		params.start, params.sctl,
		params.ectl, params.end
	);
};

var Bezier = function(start, sctl, ectl, end) {
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

/////////////////////////////////////////////////////////////

var Arc = function(start, end, radius, large, clockwise) {
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


/////////////////////////////////////////////////////////////


exports.Point = Point;
exports.Line = Line;
exports.Bezier = Bezier;
exports.Arc = Arc;
exports.P = P;
exports.bezier = bezier;
