
const sin  = require('../util').sin;    
const cos  = require('../util').cos;
const tan  = require('../util').atan;
const asin = require('../util').asin;
const roundTo = require('../util').roundTo;

//const Line = require('./line').Line;

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
	return new Point( this.x+w, this.y+h );
};

Point.prototype.xlateUnitVector = function(v, d) {

	/* return a new point in the direction pointed to by the UnitVector v
	 * and distance d far away.
	 */
	 
	return new Point( this.x + d*v.x, this.y + d*v.y );
}

Point.prototype.xlateSlope = function(m, d) {
	var k = d/Math.sqrt(1+Math.pow(m,2));
	var x = this.x + k;
	var y = this.y + k*m;
	return new Point(x,y);
}

Point.prototype.ymirror = function() {
	return new Point( -this.x, this.y );
};

Point.prototype.distanceFrom = function(otherPoint) {
	a = Math.abs(this.x - otherPoint.x);
	b = Math.abs(this.y - otherPoint.y);
	return Math.sqrt( Math.pow(a,2) + Math.pow(b,2) );
}

Point.prototype.equals = function(otherPoint, tolerance) {
	if( tolerance===undefined ) {
		tolerance=0;
	}
	
	var xok = Math.abs(this.x-otherPoint.x) <= tolerance;
	var yok = Math.abs(this.y-otherPoint.y) <= tolerance;
	
	return xok && yok;
}

function makeSingleCardinalPicker(dir) {
	
	return (p1, p2) => {
		if( dir=='up' ) {
			if( p1.y > p2.y ) {
				return [p1, true];
			} else if( p2.y > p1.y ) {
				return [p2, true];
			} else {
				return [p1, false];
			}
		} else if( dir=='down' ) {
			if( p1.y < p2.y ) {
				return [p1, true];
			} else if( p2.y < p1.y ) {
				return [p2, true];
			} else {
				return [p1, false];
			}
		} else if( dir=='left' ) {
			if( p1.x < p2.x ) {
				return [p1, true];
			} else if( p2.x < p1.x ) {
				return [p2, true];
			} else {
				return [p1, false];
			}
		} else if( dir=='right' ) {
			if( p1.x > p2.x ) {
				return [p1, true];
			} else if( p2.x > p1.x ) {
				return [p2, true];
			} else {
				return [p1, false];
			}
		} else {
			throw new Error('dir parameter must be "up", "down", "left" or "right", not '+dir);
		}
	}
}

function makeDualCardinalPicker(dir1, dir2) {
	var pickFirst = makeSingleCardinalPicker(dir1);
	var pickLast = makeSingleCardinalPicker(dir2);
	
	return (p1,p2) => {
		let [p, distinct] = pickFirst(p1,p2);
		if( distinct ) {
			return [p, true];
		} else {
			let [p, distinct] = pickLast(p1,p2);
			if( distinct ) {
				return [p, true];
			} else {
				return [p, false];
			}
		}
	}
}

exports.makeSingleCardinalPicker = makeSingleCardinalPicker;
exports.makeDualCardinalPicker = makeDualCardinalPicker;

exports.Point = Point;
