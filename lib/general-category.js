/** UCD General_Category resources. */

// General Categories CONSIDERED SAFE (for the purposes of Base65536)
var safe = {
	"Ll": true,  // Letter, Lowercase
	"Lm": true,  // Letter, Modifier
	"Lo": true,  // Letter, Other
	"Lt": true,  // Letter, Titlecase
	"Lu": true,  // Letter, Uppercase
	"Me": false, // Mark, Enclosing
	"Mn": false, // Mark, Nonspacing
	"Mc": false, // Mark, Spacing Combining
	"Nd": true,  // Number, Decimal Digit
	"Nl": true,  // Number, Letter
	"No": true,  // Number, Other
	"Cc": false, // Other, Control
	"Cf": false, // Other, Format
	"Cn": false, // Other, Not Assigned (no characters in the file have this property)
	"Co": false, // Other, Private Use
	"Cs": false, // Other, Surrogate
	"Pe": false, // Punctuation, Close
	"Pc": false, // Punctuation, Connector
	"Pd": false, // Punctuation, Dash
	"Pf": false, // Punctuation, Final quote (may behave like Ps or Pe depending on usage)
	"Pi": false, // Punctuation, Initial quote (may behave like Ps or Pe depending on usage)
	"Ps": false, // Punctuation, Open
	"Po": false, // Punctuation, Other
	"Zl": false, // Separator, Line
	"Zp": false, // Separator, Paragraph
	"Zs": false, // Separator, Space
	"Sc": true,  // Symbol, Currency
	"Sm": true,  // Symbol, Math
	"Sk": true,  // Symbol, Modifier
	"So": true   // Symbol, Other
};

var ucd = require("./ucd.js");
var dehex = require("./dehex.js");
var RangeList = require("./range-list.js");

var data = ucd.readFileSync(__dirname + "/../UCD/extracted/DerivedGeneralCategory.txt");

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
	/** List all possible GCs */
	gcs: Object.keys(byGc),

	safeGcs: Object.keys(byGc).filter(function(gc) {
		return safe[gc];
	}),

	/** Is this GC safe? */
	isSafe: function(gc) {
		var isSafe = safe[gc];
		if(isSafe === undefined) {
			throw new Error("Unrecognised GC");
		}
		return isSafe;
	},

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
