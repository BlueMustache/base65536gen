// UCD General_Category resources.

var ucd = require("./ucd.js");
var dehex = require("./dehex.js");
var RangeList = require("./range-list.js");

var data = ucd.readFileSync("UCD/extracted/DerivedGeneralCategory.txt");

var byGc = {};
var byCodepoint = [];
data.forEach(function(row) {
	var range = dehex(row[0]);
	var gc = row[1]; // E.g. "Lo", "Po"

	if(byGc[gc] === undefined) {
		byGc[gc] = new RangeList();
	}
	byGc[gc] = byGc[gc].union(range);

	byCodepoint.push([range, gc]);
});

module.exports = {
	/** Get RangeList of codepoints for a specific gc */
	byGc: function(gc) {
		return byGc[gc];
	},

	/** Get GC for a specific codepoint */
	byCodepoint: function(codepoint) {
		var result = null;
		byCodepoint.forEach(function(row) {
			var range = row[0];
			var gc = row[1];
			if(range.lower <= codepoint && codepoint < range.upper) {
				if(result !== null) {
					throw new Error("Two results?");
				}
				result = gc;
			}
		});
		if(result === null) {
			throw new Error("General_Category unknown for " + String(codepoint));
		}
		return result;
	}
};

console.log(module.exports.byCodepoint(0) === "Cc");
console.log(module.exports.byCodepoint(31) === "Cc");
console.log(module.exports.byCodepoint(parseInt("055A", 16)) === "Po");
console.log(module.exports.byGc("Cc").cardinality() === 65);
console.log(module.exports.byGc("Zp").cardinality() === 1);
console.log(module.exports.byGc("Mc").cardinality() === 383);
console.log("---");
