
const Line = require('../line').Line;
const BezierPoint = require('./points').BezierPoint;
const BezierStepPoint = require('./points').BezierStepPoint;

const DEFAULT_FLATTEN_PRECISION=1000;

var BezierApproximation = function(bezier, numLines) {
	if( numLines===undefined ) {
		numLines = DEFAULT_FLATTEN_PRECISION;
	}
	this.bezier = bezier;

	this.lines = [];
	this.maxLineLen = 0;

	/* this is used to cache things computed by getExtent since it is
	 * particularly intensive on bezier approximations */
	this._extentCache = {
		x: {
			'1': null,
			'-1': null
		},
		y: {
			'1': null,
			'-1': null
		}
	};


	var priorT=null;
	for( var i=0; i<=numLines; i++ ) {
		var t = i*(1/numLines);
		
		if( priorT != null ) {
			var l = new Line({
				start: bezier.interval(priorT),
				end: bezier.interval(t)
			});
			this.lines.push(l);
			if( l.len() > this.maxLineLen ) {
				this.maxLineLen = l.len();
			}
		}
		
		priorT=t;
	}
}

BezierApproximation.prototype.points = function(func) {
	/* call func with every Point comprising this approximation */
	func(this.lines[0].start);
	this.lines.map( (line) => func(line.end) );
}

BezierApproximation.prototype.getExtent = function(axis, direction) {
	if( this._extentCache[axis][direction] != null ) {
		return this._extentCache[axis][direction.toString()];
	}

	var max=null;
	var theShape = this;
	this.points( (point) => {
		if( max==null || point[axis]*direction > max ) {
			//if( max==null || theShape[point][axis]*direction > max ) {
			max = point[axis]*direction;
		}
	});

	var extent = max*direction + this.maxLineLen*direction;

	this._extentCache[axis][direction.toString()] = extent;

	return extent;
}

BezierApproximation.prototype.len = function() {
	var sum=0;
	this.lines.map( (line) => {
		sum+=line.len();
	});
	return sum;
}

BezierApproximation.prototype.walkMap = function(stepDistance, func) {

	/* iterate over points on this Bezier curve spaced with stepDistance
	 * distance from each other.
	 *
	 * As far as I can tell, it isn't possible to do this perfectly with a
	 * Bezier curve; the curve must be approximated by breaking it down into
	 * a bunch of tiny straight lines which follow a similar path.  The
	 * 'precision' parameter determines how many lines this curve will be
	 * broken down into and thus how accurate the approximation is.
	 */

	/* these two are only to keep track of where we are in the series.  not
	 * needed for the approximation algorithm.  Start at index 1 since the
	 * initial point was yielded above. */
	var curPointIndex=1;
	var maxPointIndex = Math.floor(this.len()/stepDistance);

	// yield the start point first
	func( new BezierStepPoint({
		x: this.bezier.start.x, y:this.bezier.start.y,
		bezier: this.bezier,
		stepInex: 0, stepMax: maxPointIndex
	}));

	var curLinesSum=0;
	this.lines.map( (line) => 
	{
		if( curLinesSum <= stepDistance && curLinesSum+line.len() >= stepDistance ) {
			
			/* one of the step points we want to call func with lies between
			 * the endpoints of 'line'.  */
		
			if( Math.abs(stepDistance-curLinesSum) < Math.abs(stepDistance-(curLinesSum+line.len())) )
			{
				/* length iterated over so far (since last point) is closer
				 * to the desired distance excluding the current line */
				
				//console.log('*** S '+line.start+' len: '+curLinesSum);
				var point = line.start;
			} else {
				/* length iterated over so far (since last point) is closer
				 * to the desired distance including the current line
				 * */
				//console.log('*** E '+line.end+' len: '+(curLinesSum+line.len()));
				var point = line.end;
			}
			
			func( new BezierStepPoint({
				x: point.x, y: point.y, bezier: this.bezier,
				stepIndex: curPointIndex, stepMax: maxPointIndex
			}));
			
			curPointIndex+=1;
			curLinesSum=0;
		}
		
		//curLines.push(line);
		curLinesSum += line.len();
	});
}

exports.BezierApproximation = BezierApproximation;
