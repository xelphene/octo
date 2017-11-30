
const roundTo = require('../util').roundTo;
const Line = require('./line').Line;

var UnitVector = function(x,y) {
	var mag = Math.sqrt( Math.pow(x,2) + Math.pow(y,2) );
	
	if( Math.abs(1-mag) > 0.0001 ) {
		throw new Error('The vector '+x+','+y+' is not a unit vector; magnitude='+mag);
	}
	this.x = x;
	this.y = y;
}

UnitVector.prototype.rotate90cw = function() {
	return new UnitVector(this.y, -this.x);
}

UnitVector.prototype.rotate90ccw = function() {
	return new UnitVector(-this.y, this.x);
}

UnitVector.prototype.toString = function() {
	return roundTo(this.x,2)+','+roundTo(this.y,2);
}

UnitVector.prototype.toLine = function() {
	return new Line({
		start: [0,0],
		end: [x,y]
	});
}

exports.UnitVector = UnitVector;
