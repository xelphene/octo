
PDFDocument = require('pdfkit');
fs = require('fs');
const geom = require('./geom');
const Point = geom.Point;
const testpattern = require('./testpattern.js');
const Pattern = require('./pattern.js').Pattern;
const Part = require('./pattern.js').Part;
const loadFromYaml = require('./pattern.js').loadFromYaml;
const format = require('string-template');

function getClassStyle(className) {
	if( className=='guide' ) {
		return {
			strokeOpacity: 0.3
		}
	} else if( className=='align' ) {
		return {
			strokeOpacity: 0.5
		}
	} else if( className=='medium' ) {
		return {
			strokeOpacity: 0.7
		}
	} else {
		return {
			strokeOpacity: 1.0
		};
	}
}

function drawLine(doc, line) {
	var s = line.start;
	var e = line.end;

	var style = getClassStyle(line.getShapeClass());

	doc.strokeOpacity(style.strokeOpacity);
	//pdfdoc.dash(5);
	//pdfdoc.stroke();
	//pdfdoc.undash();

	doc.moveTo( s.x, s.y );
	doc.lineTo( e.x, e.y );
	doc.stroke();

	doc.strokeOpacity(1.0);
};

function drawBezier(doc, bezier) {
	var style = getClassStyle(bezier.getShapeClass());

	doc.strokeOpacity(style.strokeOpacity);
	
	doc.moveTo( bezier.start.x, bezier.start.y );
	doc.bezierCurveTo(
		bezier.sctl.x, bezier.sctl.y,
		bezier.ectl.x, bezier.ectl.y,
		bezier.end.x, bezier.end.y
	);
	doc.stroke();

	doc.strokeOpacity(1.0);
};

function drawArc(doc, arc) {
	var style = getClassStyle(arc.getShapeClass());

	var path = format("M {startX},{startY} A{radiusX},{radiusY} {xAxisRotation} {largeArc},{antiClockwise} {endX},{endY}", {
		startX: arc.start.x, startY: arc.start.y,
		radiusX: arc.radius, radiusY: arc.radius,
		endX: arc.end.x, endY: arc.end.y,
		largeArc: arc.large ? '1' : '0', 
		antiClockwise: arc.clockwise ? '1' : '0',
		xAxisRotation: 0
	});

	doc.strokeOpacity(style.strokeOpacity);
	
	doc.path(path);
	doc.stroke();

	doc.strokeOpacity(1.0);
};

function drawShape(doc, shape) {
	if( shape instanceof geom.Bezier ) {
		drawBezier(doc, shape );
	} else if ( shape instanceof geom.Line ) {
		drawLine(doc, shape);
	} else if( shape instanceof geom.Arc ) {
		drawArc(doc, shape);
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
	}
	var xformLength = function(l) {
		return l*M;
	}
	
	return function (shape) {
		return shape.xlatef(xformPoint, xformLength);
	};
};

// return a function needed to convert lengths of the given unit
// ("inch","mm") to points (1/72 inch)
function makept(unit) {
	if( unit == 'inch' ) {
		return function (length) { 
			// TODO: verify that length is a number
			return length*72; 
		};
	} else {
		throw new Error('pattern has unknown unit: '+unit);
	}
};

// given a part in a pattern, return the dimensions (in points) of a page
// needed to hold the entire part.
function computeDocSize(pattern, part) {
	var pt = makept(pattern.unit);

	var width = Math.abs(part.getBoundingBox().left - part.getBoundingBox().right);
	width = pt(width);
	var height = Math.abs(part.getBoundingBox().bottom - part.getBoundingBox().top);
	height = pt(height);

	return {
		x: width, 
		y: height
	};	
};

// draw dashed lines at the page margin
function drawPageMargins(pdfdoc, pageSize, pageMargin) {
	pdfdoc.moveTo(pageMargin.x, pageMargin.y);
	pdfdoc.lineTo( pageSize.x-pageMargin.x, pageMargin.y);
	pdfdoc.lineTo( pageSize.x-pageMargin.x, pageSize.y-pageMargin.y);
	pdfdoc.lineTo( pageMargin.x, pageSize.y-pageMargin.y);
	pdfdoc.lineTo( pageMargin.x, pageMargin.y);
	pdfdoc.strokeOpacity(0.5);
	pdfdoc.dash(5);
	pdfdoc.stroke();
	pdfdoc.undash();
	pdfdoc.strokeOpacity(1.0);
};

// render one Part from a Pattern into a PDF file of multiple pages, as many
// pages needed to fit the part.
function renderPartPaged(pattern, part, pdfdoc, pageSize, pageMargin) {
	
	var windowSize = {
		x: pageSize.x - pageMargin.x*2,
		y: pageSize.y - pageMargin.y*2
	};
	
	/*
	console.log('pageSize.x: '+pageSize.x+'  pageSize.y: '+pageSize.y);
	console.log('pageMargin.x: '+pageMargin.x+'  pageMargin.y: '+pageMargin.y);
	console.log('windowSize.x: '+windowSize.x+'  windowSize.y: '+windowSize.y);
	*/
	var pages = paginate(part.size(), windowSize);
	
	pages.forEach( function(page, index) {
		//console.log('***** new page '+(index)+' / '+pages.length+' ****');
		//console.log('  xlation for this page: '+page.xlx+','+page.xly);
		
		// draw the page margins and cut off anything beyond them
		drawPageMargins(pdfdoc, pageSize, pageMargin);
		pdfdoc.rect(
			pageMargin.x, pageMargin.y, 
			(pageSize.x-pageMargin.x*2), (pageSize.y-pageMargin.y*2)
		);
		pdfdoc.clip();

		// move all the shapes so the particular region for this page will
		// be drawn in the page.  the excess that's off the page will just
		// be ignored by PDFKit
		var pageShapes = part.getShapes().map( function(s) { 
			return s.xlate( -page.xlx, -page.xly );
		});
		// shift again to accomodate margins
		var windowShapes = pageShapes.map( function(s) {
			return s.xlate( pageMargin.x, pageMargin.y );
		});

		// log the translated shapes
		/*
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

		// draw part name watermark
		pdfdoc.strokeOpacity(0.2);
		pdfdoc.fillOpacity(0.2);
		pdfdoc.fontSize(24);
		pdfdoc.text(part.title, pageSize.x/2, pageSize.y/2, width=72*8, align='justify', height=10);

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
	pdfdoc.fontSize(12);
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
	var xshapes = scaled.scaledPart.getShapes().map( function(s) {
		return s.xlate(startX, startY);
	});

	// draw the translated-for-preview shapes
	xshapes.map( function(xshape) {
		drawShape(pdfdoc, xshape);
	});

	// draw the vertical grid lines
	// the "space" option to dash() doesn't seem to do anything... PDFKit problem?
	pdfdoc.dash(length=2, space=10);
	pdfdoc.strokeOpacity(0.2);
	var gridEndX = startX + scaled.scaledPart.width();
	for( var x = startX; x<=gridEndX; x+=gridSpacing ) {
		pdfdoc.moveTo( x, startY );
		pdfdoc.lineTo( x, startY+scaled.scaledPart.height() );
		pdfdoc.stroke();
	}
	// draw the horizontal grid lines
	var gridEndY = startY + scaled.scaledPart.height();
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

// given the size of the stuff to be drawn (drawingSize) and the size of the
// area in which to draw on each page (windowSize), compute translations for
// each page on the drawing as well as labels for each edge (to line them up
// and assemble after printing out and cutting out).  The translations
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
	var shapes = part.getShapes().map(xformShape);
	/*
	console.log('--- transformed shapes ---');
	shapes.map(function (s) { console.log('    '+s.toString()) } );
	console.log('---');
	*/

	// always move everything down by the top's distance above the y-axis
	var xly = pt(part.getBoundingBox().top);
	// always move everything right by the left's distance from the x-axis
	var xlx = pt(-part.getBoundingBox().left);
	
	shapes = shapes.map( function(s) {
		return s.xlate(xlx, xly);
	});
	
	//shapes = shapes.map( function(s) { return xlateShape(shape, xlx, xly) } );

	/*
	console.log('--- translated + transformed shapes ---');
	shapes.map(function (s) { console.log('    '+s.toString()) } );
	console.log('---');
	*/

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
		ppart.setBoundingBox({
			left: 0,
			top: 0,
			right: computeDocSize(pattern, part).x,
			bottom: computeDocSize(pattern, part).y
		});
		ppart.title = part.title;
		//ppart.shapes = coordXform(pattern, part);
		ppart.addShapes( coordXform(pattern, part) );
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
		f('Part '+(index+1)+' / '+p.parts.length+': '+part.title);
		f('  Bounding Box:');
		f('    top : '+part.getBoundingBox().top);
		f('    bot : '+part.getBoundingBox().bottom);
		f('    left: '+part.getBoundingBox().left);
		f('    rght: '+part.getBoundingBox().right);
		f('  Shapes:');
		part.getShapes().forEach( function(shape,sindex) {
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
	f('    top : '+part.getBoundingBox().top);
	f('    bot : '+part.getBoundingBox().bottom);
	f('    left: '+part.getBoundingBox().left);
	f('    rght: '+part.getBoundingBox().right);
	f('  Shapes:');
	part.getShapes().forEach( function(shape,sindex) {
		f('    '+sindex+': '+shape);
	});
};

var PageOptions = function() {
	this._pageWidth = 8.5*72;
	this._pageHeight = 11*72;
	this._layout = 'portrait';
	this._sections = 'all';
}

PageOptions.prototype.setLayoutPortrait = function() {
	this._layout = 'portrait';
}

PageOptions.prototype.setLayoutLandscape = function() {
	this._layout = 'landscape';
}

PageOptions.prototype.setSectionsPreviewsOnly = function() {
	this._sections = 'previews';
}

PageOptions.prototype.setSectionsAll = function() {
	this._sections = 'all';
}

PageOptions.prototype.getSections = function() {
	return this._sections;
}

PageOptions.prototype.getLayout = function() {
	return this._layout;
}

PageOptions.prototype.setPageSize = function(width, height) {
	this._pageWidth = width;
	this._pageHeight = height;
}

PageOptions.prototype.getPageWidth = function() { 
	return this._pageWidth;
}

PageOptions.prototype.getPageHeight = function() {
	return this._pageHeight;
}

PageOptions.prototype.getMaxX = function() {
	if( this._layout=='portrait' ) {
		return this._pageWidth;
	} else {
		return this._pageHeight;
	}
}

PageOptions.prototype.getMaxY = function() {
	if( this._layout=='portrait' ) {
		return this._pageHeight;
	} else {
		return this._pageWidth;
	}
}

function genpdf(pattern, outfn, pageOptions) {
	if( ! (pattern instanceof Pattern) ) {
		throw new Error('pattern parameter is not a Pattern object');
	}

	if( pageOptions==null ) {
		pageOptions = new PageOptions();
	}

	var pageMargin = {
		x: 0.5*72,
		y: 0.5*72
	};

	var pdfkitPageOptions = {
		size: [pageOptions.getPageWidth(), pageOptions.getPageHeight()],
		layout: pageOptions.getLayout(),
		margin: 0
	};

	var octoPageSize = {
		x: pageOptions.getMaxX(),
		y: pageOptions.getMaxY()
	};
	
	doc = new PDFDocument(pdfkitPageOptions);
	doc.pipe(fs.createWriteStream(outfn));
	doc.lineWidth(1);

	var ppattern = pdfizePattern(pattern);

	// the grid lines in the preview page will be every 1 pattern unit (i.e.
	//every inch, every cm...)
	previewGridSpacing = makept(pattern.unit)(1);

	ppattern.parts.forEach( function(ppart, index) {
		renderPartScaled(ppattern, ppart, doc, octoPageSize, pageMargin, previewGridSpacing, origUnit=pattern.unit);
		if( pageOptions.getSections() == 'all' ) {
			doc.addPage();
			renderPartPaged(ppattern, ppart, doc, octoPageSize, pageMargin);
		}
		if( index < ppattern.parts.length-1 ) {
			doc.addPage();
		}
	});

	doc.end();
};

exports.genpdf = genpdf;
exports.PageOptions = PageOptions;
