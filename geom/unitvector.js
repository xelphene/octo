
const roundTo = require('../util').roundTo;
const acos = require('../util').acos;

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

UnitVector.prototype.dotProduct = function(uv) {
	return this.x * uv.x  +  this.y * uv.y;
}

UnitVector.prototype.angleFrom = function(uv) {
	return acos( this.dotProduct(uv) );
}

Object.defineProperty(UnitVector.prototype, 'xangleAcute', {
	get: function() {
		var Line = require('./line').Line;
		var l = new Line([0,0],[this.x,this.y]);
		return Math.abs(l.xangle());
	}
});

exports.UnitVector = UnitVector;
exports.up = function()    { return new UnitVector(0,1)  };
exports.down = function()  { return new UnitVector(0,-1) };
exports.left = function()  { return new UnitVector(-1,0) };
exports.right = function() { return new UnitVector(1,0)  };
