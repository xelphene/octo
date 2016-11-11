
octo = require('octo');
P = octo.geom.P;

function main() {
	var pat = new octo.pattern.Pattern();
	pat.unit = 'inch';
	pat.title = 'Example pattern';
	pat.log();
	
	var part1 = new octo.pattern.Part();
	part1.title = 'Example Part';
	part1.bbox.left = 0;
	part1.bbox.right = 7;
	part1.bbox.bottom = 0;
	part1.bbox.top = 7;
	part1.addShape( new octo.geom.Line(
		P(0,0), P(7,7)
	));

	pat.parts.push(part1);
	
	var part2 = new octo.pattern.Part();
	part2.title = 'Example Part 2';
	part2.bbox.left = 0;
	part2.bbox.right = 7;
	part2.bbox.bottom = 0;
	part2.bbox.top = 7;
	part2.addShape( new octo.geom.Line(
		P(7,0), P(0,7)
	));
	
	pat.parts.push(part2);
	
	pat.log();
	octo.pdf.genpdf(pat, 'example.pdf');
}

main();
