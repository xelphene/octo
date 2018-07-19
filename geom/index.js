
const Arc = require('./arc').Arc;
const Bezier = require('./bezier').Bezier;
const Shape = require('./shape').Shape;
const Point = require('./point').Point;
const Line = require('./line').Line;
const Circle = require('./circle').Circle;
const UnitVector = require('./unitvector').UnitVector;
const ShapeCollection = require('./collection').ShapeCollection;

function circleFromPoints( a, b, c ) {
	var r = new Line(a,b);
	var t = new Line(b,c);
	
	// compute the X coordinate of the center
	var n = ( r.slope() * t.slope() * (c.y-a.y)  +  r.slope() * (b.x+c.x)  -  t.slope() * (a.x+b.x) );
	var d = 2 * ( r.slope() - t.slope() );
	var x = n/d;
	
	// compute the Y coordinate of the center
	var y = (-1.0/r.slope()) * (x - (a.x+b.x)/2.0) + (a.y+b.y)/2.0;
	
	// compute the radius
	var radius = Math.sqrt( 
		Math.pow(b.x-x, 2) + Math.pow(b.y-y, 2)
	);
	
	return {
		centerX: x,
		centerY: y,
		radius: radius
	};
};

function pointNearestLine(l,p) 
{
	var A = p.x - l.start.x;
	var B = p.y - l.start.y;
	var C = l.end.x - l.start.x;
	var D = l.end.y - l.start.y;
	
	var dot = A*C + B*D;
	var len_sq = C*C + D*D;
	var param = -1;
	if( len_sq != 0 ) // line length==0 
	{
		param = dot / len_sq;
	}
	
	if( param<0 ) {
		console.log('case1');
		var xx = l.start.x; //x1;
		var yy = l.start.y; //y1;
	} else if( param > 1 ) {	
		console.log('case2');
		var xx = l.end.x; //x2;
		var yy = l.end.y; //y2;
	} else {
		console.log('case3');
		var xx = l.start.x + param*C;
		var yy = l.start.y + param*D;
	}
	
	return new Point(xx,yy);
	/*
	console.log('xx='+xx+' yy='+yy);
	
	var dx = p.x - xx;
	var dy = p.y - yy;

	console.log('dx='+dx+' dy='+dy);

	return Math.sqrt(dx*dx + dy*dy);
	*/
}

function extractShapesFromObject(obj, onUnknown) {
	var rv = [];
	if( typeof(obj)=='object' ) {
		if( obj instanceof Shape ) {
			rv.push(obj);
		} else if( obj instanceof Array ) {
			obj.map( (x) => {
				extractShapesFromObject(x,onUnknown).map( (newobj) => {
					rv.push(newobj);
				});
			});
		} else {
			Object.keys(obj).map( (k) => {
				extractShapesFromObject(obj[k],onUnknown).map( (newobj) => {
					rv.push(newobj);
				});
			});
		}
	} else {
		if( onUnknown ) {
			onUnknown(obj);
		}
	}
	return rv;
}

// DEPRECATED
function P(x,y) {
	return new Point(x,y);
};

exports.Point = Point;
exports.Line = Line;
exports.Bezier = Bezier;
exports.Arc = Arc;
exports.P = P;
exports.circleFromPoints = circleFromPoints;
exports.Shape = Shape;
exports.extractShapesFromObject = extractShapesFromObject;
exports.Circle = Circle;
exports.ShapeCollection = ShapeCollection;
exports.pointNearestLine = pointNearestLine;

exports.point = require('./point');
exports.line = require('./line');
exports.circle = require('./circle');
exports.bezier = require('./bezier');
exports.arc = require('./arc');
exports.collection = require('./collection');
exports.unitvector = require('./unitvector');
exports.tolerance = require('./tolerance');
