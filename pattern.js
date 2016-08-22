
const geom = require('./geom.js');

var Pattern = function () {
	this.unit = null;
	this.parts = [];
	this.title = null;
};

var Part = function() {
	this.shapes = [];
	this.bbox = new Object();
	this.bbox.left = null;
	this.bbox.right = null;
	this.bbox.top = null;
	this.bbox.bottom = null;
	this.title = null;
};

Part.prototype.addShape = function(shape) {
	isShape = (shape instanceof geom.Bezier) || (shape instanceof geom.Line);
	if( ! isShape ) {
		throw new Error('shape required for SubPattern.addShape(), not '+shape);
	}
	this.shapes.push(shape);
};


Part.prototype.height = function() {
	return Math.abs(this.bbox.bottom - this.bbox.top);
};

Part.prototype.width = function() {
	return Math.abs(this.bbox.left - this.bbox.right);
};

Part.prototype.size = function() {
	return {
		x: this.width(),
		y: this.height()
	};
};

Part.prototype.scaleWithin = function(availWidth, availHeight) {
	var scaleX = availWidth / this.width();
	var scaleY = availHeight / this.height();
	return this.scaleBy(scaleX, scaleY);
};

// scale the part to fit within a width and height but keeping the aspect
// ratio
Part.prototype.scaleWithinProp = function(availWidth, availHeight) {
	var sx = availWidth / this.width();
	var sy = availHeight / this.height();
	var s;
	
	if( sx < sy ) {
		s = sx;
	} else {
		s = sy;
	}
	
	return {
		scaledPart: this.scaleBy(s, s),
		scaleFactor: s
	};
};

// return a new Part like this one but scaled by the factors sx, sy on the X
// and Y axes, respectively.
Part.prototype.scaleBy = function(sx, sy) {
	//console.log('scaleBy '+sx+' '+sy);
	spart = new Part();
	spart.title = this.title;
	spart.bbox.left = this.bbox.left * sx;
	spart.bbox.right = this.bbox.right * sy;
	spart.bbox.top = this.bbox.top * sy;
	spart.bbox.bottom = this.bbox.bottom * sy;
	
	this.shapes.map( function(shape) {
		spart.shapes.push( shape.scaleBy(sx, sy) );
	});
	return spart;
};

exports.Pattern = Pattern;
exports.Part = Part;

