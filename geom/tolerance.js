
tolerance = Math.pow(10,-5);

function get() { return tolerance; }

function set(t) { tolerance=t; }

exports.get = get;
exports.set = set;
