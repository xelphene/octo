
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
	var m = Math.pow(10,precision);
	return Math.round(value*m)/m;
}

exports.roundTo = roundTo;
exports.cos = cos;
exports.sin = sin;
exports.tan = tan;
exports.atan = atan;
exports.acos = acos;
exports.asin = asin;
exports.radiansToDegrees = radiansToDegrees;
exports.degreesToRadians = degreesToRadians;
