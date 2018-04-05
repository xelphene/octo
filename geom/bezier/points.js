
const Point = require('../point').Point;
const makeDualCardinalPicker = require('../point').makeDualCardinalPicker;

var BezierPoint = function(x,y,bezier) {
	Point.apply(this,[x,y]);
	this.bezier = bezier;
}

BezierPoint.prototype = Object.create(Point.prototype);


// *****************************************************

var BezierStepPoint = function({x, y, bezier, stepIndex, stepMax, vector}) {
	BezierPoint.apply(this, [x,y,bezier]);
	this.stepIndex = stepIndex;
	this.stepMax = stepMax;

	// vector is a UnitVector which points in the direction that the bezier
	// is being walked. It is used for the xlateForward/Backward/Left/Right
	// methods
	this.vector = vector;
}

BezierStepPoint.prototype = Object.create(BezierPoint.prototype);

BezierStepPoint.prototype.isFirst = function() {
	return this.stepIndex==0;
}

BezierStepPoint.prototype.isLast = function() {
	return this.stepIndex==this.stepMax;
}

BezierStepPoint.prototype.xlateForward = function(dist) { 
	return this.xlateUnitVector(this.vector, dist);
}
BezierStepPoint.prototype.xlateBackward = function(dist) {
	return this.xlateUnitVector(this.vector, -dist);
}
BezierStepPoint.prototype.xlateLeft = function(dist) {
	return this.xlateUnitVector(this.vector.rotate90ccw(), dist);
}
BezierStepPoint.prototype.xlateRight = function(dist) { 
	return this.xlateUnitVector(this.vector.rotate90cw(), dist);
}

BezierStepPoint.prototype.xlatePerpCardinal = function(distance, dirPref1, dirPref2) {
	var pick = makeDualCardinalPicker(dirPref1, dirPref2);
	var p1 = this.xlateUnitVector(this.vector.rotate90cw(), distance);
	var p2 = this.xlateUnitVector(this.vector.rotate90cw(), -distance);
	var [p, _] = pick(p1,p2);
	return p;
}

exports.BezierStepPoint = BezierStepPoint;
exports.BezierPoint = BezierPoint;
