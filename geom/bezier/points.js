
const Point = require('../point').Point;

var BezierPoint = function(x,y,bezier) {
	Point.apply(this,[x,y]);
	this.bezier = bezier;
}

BezierPoint.prototype = Object.create(Point.prototype);

// *****************************************************

var BezierStepPoint = function({x, y, bezier, stepIndex, stepMax}) {
	BezierPoint.apply(this, [x,y,bezier]);
	this.stepIndex = stepIndex;
	this.stepMax = stepMax;
}

BezierStepPoint.prototype.isFirst = function() {
	return this.stepIndex==0;
}

BezierStepPoint.prototype.isLast = function() {
	return this.stepIndex==this.stepMax;
}

BezierStepPoint.prototype = Object.create(BezierPoint.prototype);

exports.BezierStepPoint = BezierStepPoint;
exports.BezierPoint = BezierPoint;
