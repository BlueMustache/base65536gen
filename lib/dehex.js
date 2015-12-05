// Returns a Range of code points
// e.g. "0000" becomes `new Range(0, 1)`
// e.g. "0000..000A" becomes `new Range(0, 11)`
var Range = require("./range.js");

module.exports = function(str) {
	var components = str.split("..");
	if(components.length !== 1 && components.length !== 2) {
		throw new Error("Could not dehex this string");
	}
	var lower = parseInt(components[0], 16);
	var upper;
	if(components.length === 2) {
		upper = parseInt(components[1], 16) + 1;
	} else {
		upper = lower + 1;
	}
	return new Range(lower, upper);
};

console.log(module.exports("0000").equals(new Range(0, 1)));
console.log(module.exports("0000..000A").equals(new Range(0, 11)));
console.log("---");
