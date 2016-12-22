
const geom = require('./geom.js');

var Pattern = function () {
	this.unit = 'inch';
	this.parts = [];
	this.title = 'Untitled Pattern';
};

Pattern.prototype.log = function(f) {
	if( ! f ) {
		f = console.log;
	}
	f('Pattern title: '+this.title);
	f('Pattern units: '+this.unit);
	f('asdf '+this.parts.length);
	var pattern = this;
	this.parts.forEach( function(part, index) {
		// "this" in here refers to something different than 'this' just
		// outside of here.  I don't understand why.  hence the 'var pattern
		// = this' assignment above.
		f('Part '+(index+1)+' / '+pattern.parts.length+': '+part.title);
		f('  Bounding Box:');
		f('    top : '+part.bbox.top);
		f('    bot : '+part.bbox.bottom);
		f('    left: '+part.bbox.left);
		f('    rght: '+part.bbox.right);
		f('  Shapes:');
		part.shapes.forEach( function(shape,sindex) {
			if( shape.comment ) {
				f('    '+sindex+': '+shape+' ('+shape.comment+')');
			} else {
				f('    '+sindex+': '+shape);
			}
		});
	});
};

var Part = function() {
	this.shapes = [];
	this.bbox = new Object();
	this.bbox.left = null;
	this.bbox.right = null;
	this.bbox.top = null;
	this.bbox.bottom = null;
	this.title = 'Untitled Part';
};

Part.prototype.getExtent = function(axis,direction) {
	var max=null;
	this.shapes.map( function(shape) {
		if( max==null || shape.getExtent(axis,direction)*direction > max*direction ) {
			max = shape.getExtent(axis,direction);
		}
	});
	return max;
};

Part.prototype.getAutoBBox = function(padding) {
	var bbox = {};
	if( padding==null ) {
		padding=0;
	}
	bbox.left = this.getExtent('x',-1)-padding;
	bbox.right = this.getExtent('x',1)+padding;
	bbox.bottom = this.getExtent('y',-1)-padding;
	bbox.top = this.getExtent('y',1)+padding;
	return bbox;
};

Part.prototype.setAutoBBox = function(padding) {
	this.bbox = this.getAutoBBox(padding);
};

Part.prototype.addShape = function(shape) {
	isShape = (shape instanceof geom.Bezier) || (shape instanceof geom.Line) || (shape instanceof geom.Arc);
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
		scaledPart: this.scaleBy(s),
		scaleFactor: s
	};
};

// return a new Part like this one but scaled by the factors sx, sy on the X
// and Y axes, respectively.
Part.prototype.scaleBy = function(s) {
	//console.log('scaleBy '+sx+' '+sy);
	spart = new Part();
	spart.title = this.title;
	spart.bbox.left = this.bbox.left * s;
	spart.bbox.right = this.bbox.right * s;
	spart.bbox.top = this.bbox.top * s;
	spart.bbox.bottom = this.bbox.bottom * s;
	
	this.shapes.map( function(shape) {
		spart.shapes.push( shape.scaleBy(s) );
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
	var Arc = require('./geom.js').Arc;
	
	data = yaml.safeLoad(data);
	//console.log(data);

	var pat = new Pattern();
	pat.unit = data.unit;
	pat.title = data.title;
	data.parts.forEach( function (p, part_index) {
		//console.log(p);
		var part = new Part();
		
		if( typeof p.title === "undefined" ) {
			throw "Part "+(part_index+1)+" has no title";
		}
		
		part.title = p.title;

		["left","right","top","bottom"].map( function(side) {
			if( typeof p.bbox[side] === 'undefined' ) {
				throw "Bounding box "+side+" is undefined in part "+part.title;
			}
		});

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
			} else if( s.type == 'arc' ) {
				part.shapes.push( new Arc(
					P(s.start[0], s.start[1]),
					P(s.end[0], s.end[1]),
					s.radius, s.large, s.clockwise
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

