
PDFDocument = require('pdfkit');
fs = require('fs');
const geom = require('./geom.js');
const Point = geom.Point;
const testpattern = require('./testpattern.js');
const Pattern = require('./pattern.js').Pattern;
const Part = require('./pattern.js').Part;

function drawLine(doc, line) {
	var s = line.start;
	var e = line.end;

	//console.log('drawLine: sx='+ s.x +' sy='+s.y+' ex='+e.x+' ey='+e.y);
	
	// draw the shape
	doc.moveTo( s.x, s.y );
	doc.lineTo( e.x, e.y );
	doc.stroke();
	
};

function drawBezier(doc, pt, origin, bezier) {
	var sx = pt( bezier.start.x );
	var sy = pt( bezier.start.y );
	var scx = pt( bezier.sctl.x );
	var scy = pt( bezier.sctl.y );
	var ecx = pt( bezier.ectl.x );
	var ecy = pt( bezier.ectl.y );
	var ex = pt( bezier.end.x );
	var ey = pt( bezier.end.y );

	// invert the Y axes
	// in geom, Y+ is upward. in PDF, Y+ is downward.
	sy = -sy;
	scy = -scy;
	ecy = -ecy;
	ey = -ey;

	// transform to PDF coordinate space
	var ox = pt( origin.x );
	var oy = pt( origin.y );
	sx += ox;
	sy += oy;
	scx += ox;
	scy += oy;
	ecx += ox;
	ecy += oy;
	ex += ox;
	ey += oy;
	
	// draw the shape
	doc.moveTo( sx, sy );
	doc.bezierCurveTo(
		scx, scy,
		ecx, ecy,
		ex, ey
	);
	doc.stroke();
};

function drawShape(doc, shape) {
	//console.log('drawShape: '+shape.toString());
	if( shape instanceof geom.Bezier ) {
		drawBezier(doc, shape );
	} else if ( shape instanceof geom.Line ) {
		drawLine(doc, shape);
	} else {
		throw new Error('shape is an unknown type of object: '+shape);
	}
};

// //////////////////////////////////////////////////////

// return a function which will transform a shape (Line, Bezier) from
// pattern coordinates to PDFKit coordinates.  pattern coordinates are some
// physical unit (inches, mm) and Y+ is upward.  PDFkit coordinates are
// points (1/72 inch) and Y+ is downward.
function makexformShape(unit) {
	
	if( unit=='inch' ) {
		M = 72;
	} else {
		throw new Error('unknown unit: '+unit);
	};
	
	var xformPoint = function(p) {
		return new geom.Point(
			p.x * M,
			-(p.y * M)
		);
	};
	
	return function (shape) {
		if( shape instanceof geom.Line ) {
			return new geom.Line(
				xformPoint(shape.start),
				xformPoint(shape.end)
			);
		} else if( shape instanceof geom.Bezier ) {
			return new geom.Bezier(
				xformPoint(shape.start),
				xformPoint(shape.sctl),
				xformPoint(shape.ectl),
				xformPoint(shape.end)
			);
		} else {
			throw new Error('dont know how to transform '+shape);
		};
	};
};

// return a function needed to convert lengths of the given unit
// ("inch","mm") to points (1/72 inch)
function makept(unit) {
	if( pattern.unit == 'inch' ) {
		return function (length) { 
			// TODO: verify that length is a number
			return length*72; 
		};
	} else {
		throw new Error('pattern has unknown unit: '+pattern.unit);
	}
};

// given a part in a pattern, return the dimensions (in points) of a page
// needed to hold the entire part.
function computeDocSize(pattern, part) {
	var pt = makept(pattern.unit);

	var width = Math.abs(part.bbox.left - part.bbox.right);
	width = pt(width);
	var height = Math.abs(part.bbox.bottom - part.bbox.top);
	height = pt(height);

	return {
		x: width, 
		y: height
	};	
};

// return a function which will translate a Point by the specified number
// of (arbitrary) units
function makexlatePoint(dx,dy) {
	return function (point) {
		return new geom.Point(
			x = point.x + dx,
			y = point.y + dy
		);
	}
};

// return a function which will translate a Shape by the specified number of
// (arbitrary) units
function makexlateShape(x,y) {
	xlatePoint = makexlatePoint(x,y);
	return function (shape) {
		if( shape instanceof geom.Line ) {
			return new geom.Line(
				start = xlatePoint(shape.start),
				end = xlatePoint(shape.end)
			)
		} else {
			throw new Error("dont know how to translate a "+shape);
		}
	};
};

function drawPageMargins(pdfdoc, pageSize, pageMargin) {
	pdfdoc.moveTo(pageMargin.x, pageMargin.y);
	pdfdoc.lineTo( pageSize.x-pageMargin.x, pageMargin.y);
	pdfdoc.lineTo( pageSize.x-pageMargin.x, pageSize.y-pageMargin.y);
	pdfdoc.lineTo( pageMargin.x, pageSize.y-pageMargin.y);
	pdfdoc.lineTo( pageMargin.x, pageMargin.y);
	pdfdoc.dash(5);
	pdfdoc.stroke();
	pdfdoc.undash();
};

// render one Part from a Pattern into a PDF file of multiple pages, as many
// pages needed to fit the part.
function renderPartPaged(pattern, part, pdfdoc, pageSize, pageMargin) {
	console.log(' -------- begin renderPartPaged --------');
	
	var windowSize = {
		x: pageSize.x - pageMargin.x*2,
		y: pageSize.y - pageMargin.y*2
	};
	
	console.log('pageSize.x: '+pageSize.x+'  pageSize.y: '+pageSize.y);
	console.log('pageMargin.x: '+pageMargin.x+'  pageMargin.y: '+pageMargin.y);
	console.log('windowSize.x: '+windowSize.x+'  windowSize.y: '+windowSize.y);
	var pages = paginate(part.size(), windowSize);
	
	// marginXlate() will move a shape to accomodate margins
	var marginXlate = makexlateShape(pageMargin.x, pageMargin.y);
	
	pages.forEach( function(page, index) {
		/*
		console.log('***** new page '+(index)+' / '+pages.length+' ****');
		console.log('  xlation for this page: '+page.xlx+','+page.xly);
		*/
		
		drawPageMargins(pdfdoc, pageSize, pageMargin);
		pdfdoc.rect(
			pageMargin.x, pageMargin.y, 
			(pageSize.x-pageMargin.x*2), (pageSize.y-pageMargin.y*2)
		);
		pdfdoc.clip();

		// move all the shapes so the particular region for this page will
		// be drawn in the page.  the excess that's off the page will just
		// be ignored by PDFKit
		var pageShapes = part.shapes.map( makexlateShape(-page.xlx, -page.xly) );

		// shift again to accomodate margins
		var windowShapes = pageShapes.map( makexlateShape(pageMargin.x,pageMargin.y) );

		/*
		// log the translated shapes
		console.log('  shapes xlated for this page:');
		windowShapes.map( function(s) { 
			console.log('    '+s); 
		} );
		*/

		// actually draw the shapes
		windowShapes.map( function(shape) {
			drawShape(pdfdoc, shape);
		});

		// draw joint labels
		var fontSize=12;
		var extraSpace=4;
		pdfdoc.fontSize(fontSize);
		pdfdoc.text(page.top, pageSize.x/2, pageMargin.y+extraSpace);
		pdfdoc.text(page.bot, pageSize.x/2, pageSize.y-pageMargin.y-fontSize-extraSpace );
		pdfdoc.text(page.left, pageMargin.x+extraSpace, pageSize.y/2);
		pdfdoc.text(page.right, pageSize.x - pageMargin.x - fontSize - extraSpace, pageSize.y/2);
		//pdfdoc.text(page.bot, pageSize.x/2, pageSize.y-pageMargin.y);

		// if another page comes after this one, add a new page to the doc
		if( index < (pages.length-1) ) {
			//console.log('adding a new page to the doc');
			pdfdoc.addPage();
		}
	});
};

// draw a part preview on one page, scaling the part as needed to occupy the whole page
// gridSpacing = number of points between each grid line in the preview
// pageMargin = {
//	x: number of points for the left/right margins
//	y: number of points in the top/bottom margins
// }
function renderPartScaled(pattern, part, pdfdoc, pageSize, pageMargin, gridSpacing, origUnit) 
{
	pdfdoc.text('Pattern: '+pattern.title, pageMargin.x, pageMargin.y);
	pdfdoc.text('Part: '+part.title);
	pdfdoc.text('Units: '+origUnit);
	var textBottom = pdfdoc.y;
	var textHeight = pdfdoc.y - pageMargin.y;

	// the amount of space (in points) available in which to draw the preview
	// note that the preview will not necessarily be this size
	var availWidth = pageSize.x - pageMargin.x*2;
	var availHeight = pageSize.y - pageMargin.y*2 - textHeight;

	// start drawing out of the margins and title text area
	var startX = pageMargin.x;
	var startY = textBottom;

	// scale the part to within the available region on the page
	var scaled = part.scaleWithinProp(availWidth, availHeight);

	// number of points between grid lines scaled for the preview
	gridSpacing = scaled.scaleFactor * gridSpacing;

	// translate all shapes to fit the preview area
	var xlate = makexlateShape(startX, startY);
	var xshapes = scaled.scaledPart.shapes.map(xlate);

	// draw the translated-for-preview shapes
	xshapes.map( function(xshape) {
		drawShape(pdfdoc, xshape);
	});

	// draw the vertical grid lines
	// the "space" option to dash() doesn't seem to do anything... PDFKit problem?
	pdfdoc.dash(length=2, space=10);
	pdfdoc.strokeOpacity(0.2);
	var gridEndX = startX + scaled.scaledPart.height();
	for( var x = startX; x<=gridEndX; x+=gridSpacing ) {
		console.log('vertical grid line at '+x);
		pdfdoc.moveTo( x, startY );
		pdfdoc.lineTo( x, startY+scaled.scaledPart.height() );
		pdfdoc.stroke();
	}
	// draw the horizontal grid lines
	var gridEndY = startY + scaled.scaledPart.width();
	for( var y = startY; y<=gridEndY; y+=gridSpacing ) {
		pdfdoc.moveTo( startX, y );
		pdfdoc.lineTo( startX+scaled.scaledPart.width(), y );
		pdfdoc.stroke();
	}
	pdfdoc.undash();
};

function jointLabel() {
	var curJointLabel = 64; // (before "A")
	return function () {
		curJointLabel++;
		return String.fromCharCode(curJointLabel);
	};
};

// given the size of the stuff to be drawn (bounding box) and the size of
// the area in which to draw on each page, compute translations for each
// page on the drawing as well as labels for each edge (to line them up and
// assemble after printing out and cutting out).  The translations
// describe how to reposition the drawing so a particular part will be
// visible on a particular page.
function paginate(drawingSize, windowSize) {
	pagesx = Math.ceil(drawingSize.x / windowSize.x)
	pagesy = Math.ceil(drawingSize.y / windowSize.y)
	
	var xlations = [];
	var pages = [];

	for( var iy=0; iy<pagesy; iy++ ) {
		pages.push([]);
		for( var ix=0; ix<pagesx; ix++ ) {
			pages[iy].push({
				top: '',
				bot: '',
				left: '',
				right: '',
				xlx: ix * windowSize.x,
				xly: iy * windowSize.y
			});
			xlations.push({
				x: ix * windowSize.x,
				y: iy * windowSize.y
			});
		}
	}
	
	//console.log(pages);
	var getJointLabel = jointLabel();
	
	for( var iy=0; iy<pagesy; iy++ ) {
		for( var ix=0; ix<pagesx; ix++ ) {

			if( pages[iy][ix].right == '' ) {
				if( pages[iy][ix+1] ) {
					
					// there is a page to the right of me and I haven't been
					// assigned a right joint label yet so assign the one
					// from this page's neighbor or generate a joint label
					// for both
					if( pages[iy][ix+1].left != '' ) {
						pages[iy][ix].right = pages[iy][ix+1].left
					} else {
						var label = getJointLabel();
						pages[iy][ix].right = label;
						pages[iy][ix+1].left = label;
					}
				}
			}

			if( pages[iy][ix].bot == '' ) {
				if( pages[iy+1] ) {
					// there is a page below me and I haven't been
					// assigned a top joint label yet so assign the one
					// from this page's neighbor or generate a joint label
					// for both
					if( pages[iy+1][ix].top != '' ) {
						pages[iy][ix].bot = pages[iy+1][ix].top;
					} else {
						var label = getJointLabel();
						pages[iy][ix].bot = label;
						pages[iy+1][ix].top = label;
					}
				}
			}
		}
	}
	
	//console.log(pages);

	// flatten out the above 2 dimensional pages array
	var pages_flat = [];
	pages.map( function (row) {
		row.map( function (page) {
			pages_flat.push(page);
		});
	});

	//return xlations;
	return pages_flat;
};

// given a part in a pattern, transform all shapes to PDF coordinates (1/72
// inch, Y+ downward, 0,0 in upper left of drawing).  return the new list of
// shapes.
function coordXform(pattern, part) {
	var pt = makept(pattern.unit);
	
	var xformShape = makexformShape(pattern.unit);
	var shapes = part.shapes.map(xformShape);
	console.log('--- transformed shapes ---');
	shapes.map(function (s) { console.log('    '+s.toString()) } );
	console.log('---');

	// always move everything down by the top's distance above the y-axis
	var xly = pt(part.bbox.top);
	// always move everything right by the left's distance from the x-axis
	var xlx = pt(-part.bbox.left);
	xlateShape = makexlateShape(xlx, xly );
	shapes = shapes.map(xlateShape);
	//shapes = shapes.map( function(s) { return xlateShape(shape, xlx, xly) } );
	console.log('--- translated + transformed shapes ---');
	shapes.map(function (s) { console.log('    '+s.toString()) } );
	console.log('---');

	return shapes;
};

// this will return a new version of the given Pattern with:
// - units turned into PDF points
// - the Y axis will be Y+ downward (like in PDFkit)
// - the top left of each part (i.e. the bounding box's upper left corner) will be at 0,0
function pdfizePattern(pattern) {
	ppattern = new Pattern();
	ppattern.unit = 'point';
	ppattern.title = pattern.title;
	
	pattern.parts.map( function(part) {
		ppart = new Part();
		ppart.bbox.left = 0;
		ppart.bbox.top = 0;
		ppart.bbox.right = computeDocSize(pattern, part).x;
		ppart.bbox.bottom = computeDocSize(pattern, part).y;
		ppart.title = part.title;
		ppart.shapes = coordXform(pattern, part);
		ppattern.parts.push(ppart);
	});
	return ppattern;
};

function logPattern(p, f) {
	if( ! f ) {
		f = console.log;
	}
	f('Pattern title: '+p.title);
	f('Pattern units: '+p.unit);
	p.parts.forEach( function(part, index) {
		f('Part '+(index+1)+' / '+p.parts.length);
		f('  Bounding Box:');
		f('    top : '+part.bbox.top);
		f('    bot : '+part.bbox.bottom);
		f('    left: '+part.bbox.left);
		f('    rght: '+part.bbox.right);
		f('  Shapes:');
		part.shapes.forEach( function(shape,sindex) {
			f('    '+sindex+': '+shape);
		});
	});
};

function logPart(part, f) {
	if( ! f ) {
		f = console.log;
	}
	f('Part: '+part.title);
	f('  Bounding Box:');
	f('    top : '+part.bbox.top);
	f('    bot : '+part.bbox.bottom);
	f('    left: '+part.bbox.left);
	f('    rght: '+part.bbox.right);
	f('  Shapes:');
	part.shapes.forEach( function(shape,sindex) {
		f('    '+sindex+': '+shape);
	});
};

function main() {
	pattern = testpattern.generate();

	var pageSize = {
		x: 8.5*72,
		y: 11*72
	};
	/*
	var pageSize = {
		x: 5*72,
		y: 5*72
	};
	*/
	var pageMargin = {
		x: 0.5*72,
		y: 0.5*72
	};

	var pageOptions = {
		size: [pageSize.x, pageSize.y],
		margin: 0
	};

	doc = new PDFDocument(pageOptions);
	doc.pipe(fs.createWriteStream('pp.pdf'));
	doc.lineWidth(1);

	var ppattern = pdfizePattern(pattern);

	// the grid lines in the preview page will be every 1 pattern unit (i.e.
	//every inch, every cm...)
	previewGridSpacing = makept(pattern.unit)(1);
	renderPartScaled(ppattern, ppattern.parts[0], doc, pageSize, pageMargin, previewGridSpacing, origUnit=pattern.unit);

	doc.addPage();

	renderPartPaged(ppattern, ppattern.parts[0], doc, pageSize, pageMargin);

	doc.end();
};

// //////////////////////////////////////////////////////

main();


