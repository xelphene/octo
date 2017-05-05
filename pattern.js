
const geom = require('./geom.js');
const roundTo = require('./util.js').roundTo;

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
	var pattern = this;
	this.parts.forEach( function(part, index) {
		// "this" in here refers to something different than 'this' just
		// outside of here.  I don't understand why.  hence the 'var pattern
		// = this' assignment above.
		f('Part '+(index+1)+' / '+pattern.parts.length+': '+part.title);
		f('  Bounding Box:');
		f('    top : '+roundTo(part.getBoundingBox().top, 3));
		f('    bot : '+roundTo(part.getBoundingBox().bottom, 3));
		f('    left: '+roundTo(part.getBoundingBox().left, 3));
		f('    rght: '+roundTo(part.getBoundingBox().right, 3));
		f('  Shapes:');
		part.getShapes().forEach( function(shape,sindex) {
			if( shape.comment ) {
				f('    '+sindex+': '+shape+' ('+shape.comment+')');
			} else {
				f('    '+sindex+': '+shape);
			}
		});
	});
};

Pattern.prototype.newPart = function() {
	var p = new Part();
	this.parts.push(p);
	return p;
};

Pattern.prototype.addPart = function(part) {
	this.parts.push(part);
};

var Part = function() {
	this._shapes = [];
	this._namedShapes = {};
	this._bbox = null; // null means auto
	this._autoBoundingBoxPadding = 0;
	this.title = 'Untitled Part';
};

Part.prototype.getShapes = function() {
	var shapeList = [];
	this._shapes.map( (shape) => {
		shapeList.push(shape);
	});
	Object.keys(this._namedShapes).map( (shapeName) => {
		shapeList.push( this._namedShapes[shapeName] );
	});
	return shapeList;
}

Part.prototype.getNamedShape = function(shapeName) {
	return this._namedShapes[shapeName];
}

Part.prototype.getShapeNames = function() {
	return Object.keys(this._namedShapes);
}

Part.prototype.addShape = function(shape) {
	isShape = (shape instanceof geom.Bezier) || (shape instanceof geom.Line) || (shape instanceof geom.Arc);
	if( ! isShape ) {
		throw new Error('shape required for Part.addShape(), not '+shape);
	}
	this._shapes.push(shape);
};

Part.prototype.addShapes = function(shapes) {
	shapes.map( (shape) => {
		this.addShape(shape);
	});
}

Part.prototype.addNamedShape = function(name, shape) {
	if( typeof(name) != 'string' ) {
		throw new Error('string required for name parameter, not '+typeof(name));
	}
	if( this._namedShapes.hasOwnProperty(name) ) {
		throw new Error('this Part already has a shape named '+name);
	}
	this._namedShapes[name] = shape;
}

Part.prototype.getExtent = function(axis,direction) {
	var max=null;
	this.getShapes().map( function(shape) {
		if( max==null || shape.getExtent(axis,direction)*direction > max*direction ) {
			max = shape.getExtent(axis,direction);
		}
	});
	return max;
};

Part.prototype.getAutoBoundingBox = function(padding) {
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

Part.prototype.getBoundingBox = function() {
	if( this._bbox == null ) {
		return this.getAutoBoundingBox(this._autoBoundingBoxPadding);
	} else {
		return this._bbox;
	}
};

/*
Part.prototype.setAutoBoundingBox = function(padding) {
	this._bbox = this.getAutoBoundingBox(padding);
};
*/

Part.prototype.setAutoBoundingBox = function() { 
	this._bbox = null;
};

Part.prototype.setAutoBoundingBoxPadding = function(padding) {
	if( typeof(padding) != 'number') {
		throw new Error('number required for padding argument, not '+padding);
	}
	this._autoBoundingBoxPadding = padding;
};

Part.prototype.setBoundingBox = function(bbox) {
	// TODO: validate
	this._bbox = bbox;
};


Part.prototype.height = function() {
	return Math.abs(this.getBoundingBox().bottom - this.getBoundingBox().top);
};

Part.prototype.width = function() {
	return Math.abs(this.getBoundingBox().left - this.getBoundingBox().right);
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

	spart.setBoundingBox({
		left: this.getBoundingBox().left * s,
		right: this.getBoundingBox().right * s,
		top: this.getBoundingBox().top * s,
		bottom: this.getBoundingBox().bottom * s
	});

	this.getShapes().map( function(shape) {
		spart.addShape( shape.scaleBy(s) );
	});
	return spart;
};

exports.Pattern = Pattern;
exports.Part = Part;

