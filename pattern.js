
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

// load a Pattern from a YAML file
function loadFromYaml(path) {
	var fs = require('fs');
	var yaml = require('js-yaml');
	var data = fs.readFileSync(path, 'utf8');
	var P = require('./geom.js').P;
	var Line = require('./geom.js').Line;
	var Bezier = require('./geom.js').Bezier;
	
	data = yaml.safeLoad(data);
	//console.log(data);

	var pat = new Pattern();
	pat.unit = data.unit;
	pat.title = data.title;
	data.parts.map( function (p) {
		//console.log(p);
		var part = new Part();
		part.title = p.title;
		part.bbox.left = p.bbox.left;
		part.bbox.right = p.bbox.right;
		part.bbox.top = p.bbox.top;
		part.bbox.bottom = p.bbox.bottom;

		if( typeof p.shapes === 'undefined' ) {
			p.shapes = [];
		}
		
		p.shapes.map( function(s) { 
			if( s.type == 'line' ) {
				part.shapes.push( new Line(
					P(s.start[0], s.start[1]),
					P(s.end[0], s.end[1])
				));
			} else if( s.type == 'bezier' ) {
				part.shapes.push( new Bezier(
					P(s.start[0], s.start[1]),
					P(s.sctl[0], s.sctl[1]),
					P(s.ectl[0], s.ectl[1]),
					P(s.end[0], s.end[1])
				));
			} else {
				throw "Unknown shape type in YAML file: "+s.type;
			}

		});

		pat.parts.push(part);
		
	});
	return pat;
};

exports.Pattern = Pattern;
exports.Part = Part;
exports.loadFromYaml = loadFromYaml;

