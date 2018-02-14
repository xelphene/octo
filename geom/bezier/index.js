
const Point = require('../point').Point;
const Shape = require('../shape').Shape;
const roundTo = require('../../util').roundTo;
const Line = require('../line').Line;
const BezierApproximation = require('./approx').BezierApproximation;

var Bezier = function(start, sctl, ectl, end) {
	Shape.apply(this, arguments);

	if( arguments.length == 4 ) {
	
		/* constructor call in the traditional manner */
	
		var start = arguments[0];
		var sctl  = arguments[1];
		var ectl  = arguments[2];
		var end   = arguments[3];

		if( ! (start instanceof Point) ) {
			throw new Error('start must be an instance of Point, not '+start);
		}
		if( ! (end instanceof Point) ) {
			throw new Error('end must be an instance of Point, not '+end);
		}
		if( ! (sctl instanceof Point) ) {
			throw new Error('sctl must be an instance of Point, not '+start);
		}
		if( ! (ectl instanceof Point) ) {
			throw new Error('ectl must be an instance of Point, not '+end);
		}
	
		this.start = start;
		this.sctl = sctl;
		this.ectl = ectl;
		this.end = end;
		
	} else if( arguments.length==1 ) {
	
		/* constructor call with a single object containing parameters */

		var a = validateBezierArg(arguments[0]);

		this.start = a.start;
		this.sctl = a.sctl;
		this.end = a.end;
		this.ectl = a.ectl;
		
	} else {
		throw new Error('Bezier() called with incorrect number of arguments');
	}

	this.comment = undefined;
	this._approximations = {};
};

function validateBezierArg(a) {
	if( typeof(a)  != 'object' ) {
		throw new Error('Bezier() called with one argument but that argument is not an object.');
	}
			
	// make sure the object has all required parameters
	['start','sctl','end','ectl'].map( function(attName) {
		if( ! (attName in a) ) {
			throw new Error('Bezier() called with an object as sole parameter; object does not have a "'+attName+'" attribute.');
		}

		if( a[attName] instanceof Point ) {
			// already the right kind of object. nothing to do.
		} else if( Array.isArray(a[attName]) ) {
			if( a[attName].length==2 && typeof(a[attName][0]) == 'number' && typeof(a[attName][1])=='number' ) {
				a[attName] = new Point(
					a[attName][0],
					a[attName][1]
				);
			} else {
				throw new Error('Bezier() called with an object as sole parameter; attribute "'+attName+'" is an array but does not contain two numbers; it is '+a[attName]);
			}
		} else {
			throw new Error('Bezier() called with an object as sole parameter; attribute "'+attName+'" is neither a Point nor an array; it is '+a[attName]);
		}
	});

	return a;
};

Bezier.prototype = Object.create(Shape.prototype);

Bezier.prototype.getPointNames = function () {
	return ['start','sctl','ectl','end'];
};

Bezier.prototype.ymirror = function() {
	return new Bezier({
		start: new Point( -this.start.x, this.start.y),
		sctl:  new Point( -this.sctl.x, this.sctl.y ),
		end:   new Point( -this.end.x,   this.end.y),
		ectl:  new Point( -this.ectl.x, this.ectl.y ),
		shapeClass: this.getShapeClass()
	})
};

Bezier.prototype.toString = function() {
	return (
		'Bezier '+roundTo(this.start.x,3)+','+roundTo(this.start.y,3)+
		' ['+roundTo(this.sctl.x,3)+','+roundTo(this.sctl.y,3)+'] -> '+
		roundTo(this.end.x,3)+','+roundTo(this.end.y,3)+
		' ['+roundTo(this.ectl.x,3)+','+roundTo(this.ectl.y,3)+']'
	);
}

Bezier.prototype.scaleBy = function(s) {
	return new Bezier({
		start: new Point( this.start.x*s, this.start.y*s ),
		sctl: new Point( this.sctl.x*s, this.sctl.y*s ),
		ectl: new Point( this.ectl.x*s, this.ectl.y*s ),
		end: new Point( this.end.x*s, this.end.y*s ),
		shapeClass: this.getShapeClass()
	});
};

Bezier.prototype.xlate = function(dx, dy) {
	return new Bezier({
		start: new Point( this.start.x+dx, this.start.y+dy ),
		sctl: new Point( this.sctl.x+dx, this.sctl.y+dy ),
		ectl: new Point( this.ectl.x+dx, this.ectl.y+dy ),
		end:  new Point( this.end.x+dx, this.end.y+dy ),
		shapeClass: this.getShapeClass()
	});
};

Bezier.prototype.xlatef = function(xlatePoint, xlateLength) {
	/* f is a function which takes a Point and returns a Point.
	 * f will typically move all Points comprising this Shape in
	 * the same manner.
	 */
	return new Bezier({
		start: xlatePoint(this.start),
		sctl: xlatePoint(this.sctl),
		ectl: xlatePoint(this.ectl),
		end:  xlatePoint(this.end),
		shapeClass: this.getShapeClass()
	});
};


Bezier.prototype.xlateAngular = function(a, d) {
	/* return a Bezier similar to this one but is shifted by distance d in
	 * direction a.  a is an angle in degrees measured with respect to the X
	 * axis.  a=90 is straight up.  a=0 is to the right.  a and d may be
	 * negative.
	 */
	
	return new Bezier({
		start: this.start.xlateAngular(a, d),
		sctl: this.sctl.xlateAngular(a, d),
		ectl: this.ectl.xlateAngular(a, d),
		end: this.end.xlateAngular(a, d),
		shapeClass: this.getShapeClass()
	});
};

Bezier.prototype.interval = function(t) {
	var x = (
		this.start.x *                     Math.pow((1-t),3) + // start * (1-t)^3
		this.sctl.x  * 3 * t *             Math.pow((1-t),2) + // sctl * 3 * (1-t)^2
		this.ectl.x  * 3 * Math.pow(t,2) * (1-t)             + // ectl * 3 * t^2 * (1-t)
		this.end.x   *     Math.pow(t,3)                       // end * t^3
	);
	var y = (
		this.start.y *                     Math.pow((1-t),3) + // start * (1-t)^3
		this.sctl.y  * 3 * t *             Math.pow((1-t),2) + // sctl * 3 * (1-t)^2
		this.ectl.y  * 3 * Math.pow(t,2) * (1-t)             + // ectl * 3 * t^2 * (1-t)
		this.end.y   *     Math.pow(t,3)                       // end * t^3
	);
	return new Point(x,y);
}

Bezier.prototype.intervalMap = function(t, f) {
	var count=0;
	for( let i=0; i<=1.0; i+=t ) {
		let thisPoint = this.interval(i);
		f(thisPoint, i, count);
		count+=1;
	}
}

Bezier.prototype.intervalMapAdv = function(t, f) {
	var count=0;
	
	for( let i=0; i<=1.0; i+=t ) {
		let thisPoint = this.interval(i);
		let isFirst=false;
		let isLast=false;

		/////////////////////////////////////////////////////////
		// estimate the slope of the tangent line at this point
		////////////////////////////////////////////////////////

		if( i==0 ) {
			/* we're at the start point. estimate slope based on the line 
			 * from start to sctl */
			var priorPoint = this.start;
			var nextPoint = this.sctl;
			isFirst=true;
		} else if( i+t > 1.0 ) {
			/* we're at the final point. estimate slope based on line from 
			 * ectl to end */
			var priorPoint = this.ectl;
			var nextPoint = this.end;
			isLast=true;
		} else {
			/* we're somewhere in the middle. estimate slope based on 
			 * line from last pound found by interval to the next */
			var priorPoint = this.interval(i-t);
			var nextPoint = this.interval(i+t);
		}
		
		/* estLine is a line which approximates a section of this Bezier
		 * curve around thisPoint.  We base most of our calculations here
		 * upon it.
		 */
		var estLine = new Line(priorPoint, nextPoint);
		

		///////////////////////////////////////////////////////
		// make a function which returns a point somewhere on
		// the estimated tangent line to this point (distance
		// d from this point)
		///////////////////////////////////////////////////////

		let getTanPoint = function(distance) {
			return thisPoint.xlateUnitVector(estLine.toUnitVector(), distance);
		}

		///////////////////////////////////////////////////////
		// make a function which returns a point somewhere on
		// the line tangent to the estimated tangent line to 
		// this point (distance d from this point)
		///////////////////////////////////////////////////////
		
		let getPerpTanPoint = function(distance) {
			return thisPoint.xlateUnitVector(
				estLine.toUnitVector().rotate90cw(),
				distance
			);
		}

		//////////////////////////////////////////////////////
		// call the caller's callback function for this point
		//////////////////////////////////////////////////////

		f({
			point: thisPoint,
			interval: i,
			count: count,
			slope: estLine.slope(),
			getTanPoint: getTanPoint,
			getPerpTanPoint: getPerpTanPoint,
			isFirst: isFirst,
			isLast: isLast
		});
		count+=1;
	}
}

Bezier.prototype.flatten = function(numLines) {
	if( numLines < 1 ) {
		throw new Error('numLines must be >=1');
	}
	var lines = [];
	var priorT=null;
	for( var i=0; i<=numLines; i++ ) {
		var t = i*(1/numLines);
		
		if( priorT != null ) {
			var l = new Line({
				start: this.interval(priorT),
				end: this.interval(t)
			});
			lines.push(l);
		}
		
		priorT=t;
	}
	return lines;
}

Bezier.prototype.approx = function(precision) {

	/* return a new BezierApproximation, which approximates a Bezier curve
	 * as a series of straight lines.  This is necessary for various
	 * computations (like length) which can't be computed.
	 *
	 * precision must be a postive integer. The higher the precision, the
	 * closer the approximation will be to the real thing, but the longer it
	 * will take to compute.
	 *
	 * the approximation for a given precision will be cached so it doesn't
	 * need to be rebuilt for every call to this method.
	 */

	if( this._approximations[precision] === undefined ) {
		this._approximations[precision] = new BezierApproximation(this,precision);
	}
	return this._approximations[precision];
}

Bezier.prototype.len = function(precision) {
	return this.approx().len();
}

Bezier.prototype.getExtent = function(axis, direction) {
	return this.approx().getExtent(axis, direction);
}

Bezier.prototype.walkMap = function(stepDistance, func) {
	return this.approx().walkMap(stepDistance, func);
}

exports.Bezier = Bezier;
