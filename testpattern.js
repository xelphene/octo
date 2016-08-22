
const geom = require('./geom.js');
const Pattern = require('./pattern.js').Pattern;
const Part = require('./pattern.js').Part;
const Point = geom.Point;
const P = geom.P;

function generate() {
	pat = new Pattern();
	part = new Part();
	pat.unit = 'inch';

	part.addShape(
		new geom.Line( start = new Point(0, 0), end = new Point(5, 10) )
	);
	part.addShape(
		new geom.Line( start = new Point(0, 10), end = new Point(10, 0) )
	);

	// edge test lines
	part.addShape( new geom.Line( P(0,0), P(0,1) ) );
	part.addShape( new geom.Line( P(0,0), P(1,0) ) );

	// begin measurement test lines
	part.addShape(
		new geom.Line( start=P(1,1), end=P(6,1) )
	);
	part.addShape(
		new geom.Line( start=P(1,1), end=P(1,6) )
	);

	// begin corner markers
	part.addShape(
		new geom.Line( start = new Point(0.25,0.25), end = new Point(1,0.25) )
	);
	part.addShape(
		new geom.Line( start = new Point(0.25,0.25), end = new Point(0.25,1) )
	);

	part.addShape(
		new geom.Line( start = new Point(9.75, 9.75), end = new Point(9.75,9) )
	);
	part.addShape(
		new geom.Line( start = new Point(9.75, 9.75), end = new Point(9,9.75) )
	);
	// end corner markers

	/*
	// "L" in lower left
	part.addShape(
		new geom.Line( start = new Point(-2, 2), end = new Point(-2, 0) )
	);
	part.addShape(
		new geom.Line( start = new Point(-2, 0), end = new Point(0, 0) )
	);

	part.addShape(
		new geom.Bezier(
			start = new Point(1,1), sctl = new Point(1,4),
			ectl = new Point(4,7), end = new Point(4,10)
		)
	);
	*/

	/*
	// padded bounding box
	part.bbox.left = 9.5;
	part.bbox.right = 15.5;
	part.bbox.top = 20.5;
	part.bbox.bottom = 9.5;
	*/
	part.bbox.left = 0;
	part.bbox.right = 10;
	part.bbox.top = 10;
	part.bbox.bottom = 0;
	part.title = 'Front';

	pat.parts.push(part);

	pat.title = 'Test Pattern';

	return pat;
};

exports.generate = generate;
