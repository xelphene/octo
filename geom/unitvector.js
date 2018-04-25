
const roundTo = require('../util').roundTo;
const acos = require('../util').acos;
const atan = require('../util').atan;
const asin = require('../util').asin;
const cos = require('../util').cos;
const sin = require('../util').sin;

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

UnitVector.prototype.toString = function(precision) {
	if( precision!==undefined ) {
		return roundTo(this.x,precision)+','+roundTo(this.y,precision);
	} else {
		return this.x+','+this.y;
	}
}

UnitVector.prototype.dotProduct = function(uv) {
	return this.x * uv.x  +  this.y * uv.y;
}

UnitVector.prototype.angleFrom = function(uv) {
	return acos( this.dotProduct(uv) );
}

UnitVector.prototype.rotate = function(angle) {
	var a = this.directionAngle + angle;
	console.log('a: '+a);
	var x = cos(a);
	console.log('x: '+x);
	var y = sin(a);
	return new UnitVector(x,y);
}

Object.defineProperty(UnitVector.prototype, 'directionAngle', {
	get: function() {
		if( this.quadrant==1 ) {
			return atan(this.y/this.x);
		} else if( this.quadrant==2 ) {
			return 180+atan(this.y/this.x);
		} else if( this.quadrant==3 ) {
			return 180+atan(this.y/this.x);
		} else {
			return 360+atan(this.y/this.x);
		}
	}
});

Object.defineProperty(UnitVector.prototype, 'quadrant', {
	get: function() {
		if( this.x>=0 && this.y>=0 ) {
			return 1;
		} else if( this.x<0 && this.y>=0 ) {
			return 2;
		} else if( this.x<0 && this.y<0 ) {
			return 3;
		} else{
			return 4;
		}
	}
});

Object.defineProperty(UnitVector.prototype, 'xangleAcute', {
	get: function() {
		var Line = require('./line').Line;
		var l = new Line([0,0],[this.x,this.y]);
		return Math.abs(l.xangle());
	}
});

UnitVector.fromDirectionAngle = function(angle) {
	var x = cos(angle);
	var y = sin(angle);
	return new UnitVector(x,y);
}

exports.UnitVector = UnitVector;
exports.up = function()    { return new UnitVector(0,1)  };
exports.down = function()  { return new UnitVector(0,-1) };
exports.left = function()  { return new UnitVector(-1,0) };
exports.right = function() { return new UnitVector(1,0)  };
