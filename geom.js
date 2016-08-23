
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

Line.prototype.scaleBy = function(sx, sy) {
	return new Line(
		start = new Point( this.start.x*sx, this.start.y*sy),
		end = new Point( this.end.x*sx, this.end.y*sy)
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

Bezier.prototype.scaleBy = function(sx, sy) {
	return new Bezier(
		start = new Point( this.start.x*sx, this.start.y*sy ),
		sctl = new Point( this.sctl.x*sx, this.sctl.y*sy ),
		ectl = new Point( this.ectl.x*sx, this.ectl.y*sy ),
		end = new Point( this.end.x*sx, this.end.y*sy )
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

exports.Point = Point;
exports.Line = Line;
exports.Bezier = Bezier;
exports.P = P;
