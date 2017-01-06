
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

function roundTo( value, precision ) {
	var m = Math.pow(10,precision);
	return Math.round(value*m)/m;
}

exports.roundTo = roundTo;
exports.cos = cos;
exports.sin = sin;
exports.radiansToDegrees = radiansToDegrees;
exports.degreesToRadians = degreesToRadians;
