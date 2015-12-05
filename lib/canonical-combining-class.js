// UCD Canonical_Combining_Class resources.

var ucd = require("./ucd.js");
var dehex = require("./dehex.js");
var RangeList = require("./range-list.js");

var data = ucd.readFileSync("UCD/extracted/DerivedCombiningClass.txt");

var byCcc = {};
var byCodepoint = [];
data.forEach(function(row) {
	var range = dehex(row[0]);
	var ccc = Number(row[1]);

	if(byCcc[ccc] === undefined) {
		byCcc[ccc] = new RangeList();
	}
	byCcc[ccc] = byCcc[ccc].union(range);

	byCodepoint.push([range, ccc]);
});

module.exports = {
	defaultCcc: 0,

	/** Get RangeList of codepoints for a specific CCC */
	byCcc: function(ccc) {
		return byCcc[ccc];
	},

	/** Get CCC for a specific codepoint */
	byCodepoint: function(codepoint) {
		var result = null;
		byCodepoint.forEach(function(row) {
			var range = row[0];
			var ccc = row[1];
			if(range.lower <= codepoint && codepoint < range.upper) {
				if(result !== null) {
					throw new Error("Two results?");
				}
				result = ccc;
			}
		});
		if(result === null) {
			throw new Error("Canonical_Combining_Class unknown for " + String(codepoint));
		}
		return result;
	}
};

console.log(module.exports.byCodepoint(0) === 0);
console.log(module.exports.byCodepoint(30) === 0);
console.log(module.exports.byCodepoint(parseInt("0345", 16)) === 240);
console.log(module.exports.byCcc(0).cardinality() === 257454);
console.log(module.exports.byCcc(1).cardinality() === 32);
console.log(module.exports.byCcc(224).cardinality() === 2);
console.log(module.exports.byCcc(226).cardinality() === 1);
console.log(module.exports.byCcc(230).cardinality() === 402);
console.log("---");
