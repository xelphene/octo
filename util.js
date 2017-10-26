
function degreesToRadians(d) {
	return (d*Math.PI) / 180;
}

function radiansToDegrees(r) {
	return r * (180/Math.PI);
}

function sin(d) {
	return Math.sin(
		degreesToRadians(d)
	)
}

function cos(d) {
	return Math.cos(
		degreesToRadians(d)
	)
}

function tan(d) {
	return Math.tan(
		degreesToRadians(d)
	)
}

function atan(x) {
	return radiansToDegrees(
		Math.atan(x)
	);
}

function acos(x) {
	return radiansToDegrees(
		Math.acos(x)
	);
}

function asin(x) {
	return radiansToDegrees(
		Math.asin(x)
	);
}

function roundTo( value, precision ) {
	if( precision===undefined ) {
		precision=3;
	}
	var m = Math.pow(10,precision);
	return Math.round(value*m)/m;
}

function ConicalSurfaceSpecifier({method, len, frac, addLen, circle}) {
	if( method=='arclen' ) {
		if( circle==null ) {
			throw new Error('if method=="arclen", circle must be "top" or "bottom"');
		}
		if( len==null ) {
			throw new Error('if method=="arclen", len must be specified');
		}
	} else if( method=='frac' ) {
		if( len!=null ) {
			throw new Error('if method=="frac", len must not be specified');
		}
		if( frac==null ) {
			throw new Error('if method=="frac", frac must be specified');
		}
		
		if( addLen==null ) {
			addLen=0;
		} else {
			if( circle==null ) {
				throw new Error('if method=="frac" and addLen is specified, circle must also be specified');
			}
		}
	} else {
		throw new Error('method must be arclen or frac');
	}
	
	if( addLen==null ) {
		addLen=0;
	}
	
	this.method = method;
	this.circle = circle;
	this.len = len;
	this.addLen = addLen;
	this.frac = frac;
	
}

function ConicalSurface({cl, tl, aa, gb, gt, xb, xt}) {
	this.cl=cl;
	this.tl=tl;
	this.aa=aa;
	this.gb=gb;
	this.gt=gt;
	this.xb=xb;
	this.xt=xt;
}

ConicalSurface.prototype.debug = function(f) {
	if( f==null ) { f=console.log; };
	
	['cl','tl','aa','gb','gt','xb','xt'].map( (field) => {
		f(field+'='+this[field]);
	});
}

function computeConicalSurface({len, bottomCircumf, topCircumf, spec})
{
	var br = bottomCircumf / (2*Math.PI);
	var tr = topCircumf / (2*Math.PI);
	var at = acos(  (br-tr)/len  );
	
	var cl = br/cos(at);
	var tl = tr/cos(at);

	if( spec.method=='arclen' ) {
		if( spec.circle=='bottom' ) {
			if( spec.len > (bottomCircumf-spec.addLen) ) {
				throw new Error('specified length is greater than the circumference of the circle it is based on');
			}
			let c = 2*Math.PI*cl; // circumf of circle with radius cl;
			let arcLen = spec.len + spec.addLen;
			var aa = 360 * ( arcLen/c );
		} else { 
			// spec.circle==top
			if( spec.len > (topCircumf-spec.addLen) ) {
				throw new Error('specified length is greater than the circumference of the circle it is based on');
			}
			let c = 2*Math.PI*tl; // circumf of circle with radius tl;
			let arcLen = spec.len + spec.addLen;
			var aa = 360 * ( arcLen/c );
		}
	} else {
		// spec.method=='frac'
		let c;
		let arcLen;
		if( spec.addLen!=0 ) {
			if( spec.circle=='top' ) {
				c = 2*Math.PI*tl;
				arcLen = topCircumf*spec.frac + spec.addLen;
			} else {
				c = 2*Math.PI*cl;
				arcLen = bottomCircumf*spec.frac + spec.addLen;
			}
		} else {
			// no additional len specified.
			// doesn't matter which circle we use
			c = 2*Math.PI*cl;
			arcLen = bottomCircumf*spec.frac;
		}
		var aa = 360*(arcLen / c);
	}
	
	var gb = sin(aa)*cl;
	var gt = sin(aa)*tl;
	var xb = cl - (gb/tan(aa));
	var xt = cl - (gt/tan(aa));
	
	return new ConicalSurface({
		cl: cl,
		tl: tl,
		aa: aa,
		gb: gb,
		gt: gt,
		xb: xb,
		xt: xt
	});
}

function debugComputeConicalSurface(f, cs) {
	['cl','tl','aa','gb','gt','xb','xt'].map( (field) => {
		f(field+'='+cs[field]);
	});
}

function isNegative(n) {
	return ((n = +n) || 1 / n) < 0;
}

exports.isNegative = isNegative;
exports.roundTo = roundTo;
exports.cos = cos;
exports.sin = sin;
exports.tan = tan;
exports.atan = atan;
exports.acos = acos;
exports.asin = asin;
exports.radiansToDegrees = radiansToDegrees;
exports.degreesToRadians = degreesToRadians;
exports.ConicalSurfaceSpecifier = ConicalSurfaceSpecifier;
exports.computeConicalSurface = computeConicalSurface;
