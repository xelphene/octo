
const sin  = require('../util').sin;    
const cos  = require('../util').cos;
const tan  = require('../util').atan;
const asin = require('../util').asin;
const roundTo = require('../util').roundTo;

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

Point.prototype.ymirror = function() {
	return new Point( -this.x, this.y );
};

exports.Point = Point;
