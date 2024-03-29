// UCD normalization property resources.

var ucd = require("./ucd.js");
var dehex = require("./dehex.js");
var Range = require("./range.js");
var RangeList = require("./range-list.js");

var data = ucd.readFileSync(__dirname + "/../UCD/DerivedNormalizationProps.txt");

var byProperty = {};
var byCodepoint = {};
data.forEach(function(row) {
	var range = dehex(row[0]);
	var property = row[1]; // E.g. "NFD_QC"
	var value = row[2]; // E.g. "N"

	if(byProperty[property] === undefined) {
		byProperty[property] = {};
	}
	if(byProperty[property][value] === undefined) {
		byProperty[property][value] = new RangeList();
	}
	byProperty[property][value] = byProperty[property][value].union(range);

	if(byCodepoint[property] === undefined) {
		byCodepoint[property] = [];
	}
	byCodepoint[property].push([range, value]);
});

var defaultValues = {
	"NFD_QC": "Y",
	"NFC_QC": "Y",
	"NFKD_QC": "Y",
	"NFKC_QC": "Y"
};

Object.keys(defaultValues).forEach(function(property) {
	var numCodepoints = (1 << 16) + (1 << 20); // 1,114,112
	var rangeList = new RangeList([new Range(0, numCodepoints)]);
	Object.keys(byProperty[property]).forEach(function(value) {
		rangeList = rangeList.difference(byProperty[property][value]);
	});
	byProperty[property][defaultValues[property]] = rangeList;
});

module.exports = {

	/** Get RangeList of codepoints with a specific property value */
	byProperty: function(property, value) {
		return byProperty[property][value];
	},

	/** Get property value for a specific codepoint, or default if set */
	byCodepoint: function(codepoint, property) {
		var result = null;
		if(byCodepoint[property] === undefined) {
			throw new Error("Unrecognised property");
		}
		byCodepoint[property].forEach(function(row) {
			var range = row[0];
			var value = row[1];
			if(range.lower <= codepoint && codepoint < range.upper) {
				if(result !== null) {
					throw new Error("Two results?");
				}
				result = value;
			}
		});
		if(result === null) {
			if(defaultValues[property] === undefined) {
				throw new Error("Property value unknown for " + String(codepoint));
			}
			result = defaultValues[property];
		}
		return result;
	}
};

console.log(module.exports.byCodepoint(parseInt("037A", 16), "FC_NFKC") === "0020 03B9");
console.log(module.exports.byCodepoint(parseInt("E0002", 16), "NFKC_CF") === "");
console.log(module.exports.byCodepoint(parseInt("FB1D", 16), "NFC_QC") === "N");
console.log(module.exports.byCodepoint(parseInt("10FFFF", 16), "NFKD_QC") === "Y");
console.log(module.exports.byProperty("NFC_QC", "N").cardinality() === 1120);
console.log(module.exports.byProperty("NFC_QC", "M").cardinality() === 110);
console.log(module.exports.byProperty("NFC_QC", "Y").cardinality() === 1112882);
console.log("---");
