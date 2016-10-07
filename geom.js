
var Point = function(x,y) {
	this.x = x;
	this.y = y;
};

function P(x,y) {
	return new Point(x,y);
};

////////////////////////////////////////////////////////////////

var Line = function(start, end) {
	if( ! (start instanceof Point) ) {
		throw new Error('start must be an instance of Point, not '+start);
	}
	if( ! (end instanceof Point) ) {
		throw new Error('end must be an instance of Point, not '+end);
	}
	this.start = start;
	this.end = end;
};

Line.prototype.toString = function() {
	return 'Line '+this.start.x+','+this.start.y+' -> '+this.end.x+','+this.end.y;
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

/////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////


exports.Point = Point;
exports.Line = Line;
exports.Bezier = Bezier;
exports.Arc = Arc;
exports.P = P;
