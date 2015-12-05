/**
	Generate a list of "safe" characters for use in Base65536. These are
	characters which
	(1) are assigned codepoints
	(2) remain unaltered when subjected to all four forms of Unicode normalization
			(i.e. have the property Quick_Check = Yes for all four forms)
	(3) are not combining characters
			(i.e. have the property Canonical_Combining_Class = Not_Reordered (0))
	(4) have a safe character category
			(i.e. General_Category is not whitespace, etc.)

	Results are output to two files:
		get-block-start.json, which converts a byte (or -1) to the first codepoint
		in a safe, unique block of 256 codepoints
		get-b2.json, which reverses the above transformation.

	Ideally this program, once written correctly, should only ever need to be run
	once. This is the reason for the relatively poor performance of this code.
	If it ever needs executing a second time, this is a sign that there was
	something wrong with the previous version of Base65536, which is rather
	undesirable :-/
*/

var fs = require("fs");
var RangeList = require("./lib/range-list.js");
var Range = require("./lib/range.js");

var ucd = require("./lib/ucd.js");
var canonicalCombiningClass = require("./lib/canonical-combining-class.js");
var generalCategory = require("./lib/general-category.js");
var normalizationProperties = require("./lib/normalization-properties.js");

var numCodepoints = (1 << 16) + (1 << 20); // 1,114,112
var candidates = new RangeList([new Range(0, numCodepoints)]);

var quickChecks = [
	"NFD_QC" , // canonical decomposition
	"NFC_QC" , // canonical decomposition + canonical composition 
	"NFKD_QC", // compatibility decomposition
	"NFKC_QC", // compatibility decomposition + canonical composition
];

quickChecks.forEach(function(property) {
	candidates = candidates.intersection(normalizationProperties.byProperty(property, "Y"));
});

candidates = candidates.intersection(generalCategory.byGc("Lo")); // Letter, other

candidates = candidates.intersection(canonicalCombiningClass.byCcc(0));

// Now we have a large pool of candidate code points. Because we have some
// leeway here, we can be a little more demanding in how we set out our encoding
// and decoding mappings.
// Note that we need 65536 + 256 = 65792 code points, because we need to handle
// all 256 * 256 possible combinations of two bytes but we also need to handle
// the case where only one byte is supplied and the sequence ends. In other
// words we have 257 possible "second bytes" (one of which is -1 = "missing").
// So the first useful thing we will do is simply select 257 individual blocks
// of 256 contiguous code points, meaning that the first byte can simply be used
// as an offset into the block. The second useful thing we will do is make sure
// that the first code point in the block is divisible by 256.
var blocksize = (1 << 8);
var get_block_start = {};
var get_b2 = {};
var block_start = 0;
for(var b2 = -1; b2 < blocksize; b2++) {
	while(!candidates.contains(new Range(block_start, block_start + blocksize))) {
		block_start += blocksize;
	}
	get_block_start[b2] = block_start;
	get_b2[block_start] = b2;
	block_start += blocksize;
}

// Take any two bytes and encode them as a single Unicode code point. To encode
// only a single byte (e.g. at the end of an odd-lengthed byte sequence), set
// b2 to -1.
var encodepoint = function(b1, b2) {
	return get_block_start[b2] + b1;
};

// Take a Unicode code point and return the two bytes to which they decode. In
// some cases the second byte will be -1, indicating that only one byte was
// encoded.
var decodepoint = function(codepoint) {
	var offset = codepoint & (blocksize - 1);
	return [offset, get_b2[codepoint - offset]];
};

// Tests...
console.log("Final testing... (takes a little while)");

var seen = {};
for(var b1 = 0; b1 < blocksize; b1++) {
	for(var b2 = -1; b2 < blocksize; b2++) {
		var codepoint = encodepoint(b1, b2);
		if(codepoint < 0 || numCodepoints <= codepoint) {
			throw new Error("Bad code point: " + String(codepoint) + " for bytes " + [b1,b2]);
		}
		if(seen[codepoint] !== undefined) {
			throw new Error("Code point already seen: " + String(codepoint));
		}
		seen[codepoint] = true;

		// Make sure our encoded code point has all of the desired properties
		var gc = generalCategory.byCodepoint(codepoint);
		if(gc !== "Lo") {
			throw new Error("Bad general category " + gc + " for codepoint " + String(codepoint));
		}
		quickChecks.forEach(function(property) {
			if(normalizationProperties.byCodepoint(codepoint, property) !== "Y") {
				throw new Error("qc:" + String(codepoint));
			}
		});
		if(canonicalCombiningClass.byCodepoint(codepoint) !== 0) {
			throw new Error("ccc:" + String(codepoint));
		}

		// Make sure the round trip works too
		var decoded = decodepoint(codepoint);
		if(decoded[0] !== b1) {
			throw new Error("Bad b1 after round trip. Expected " + b1 + ", actual " + decoded[0]);
		}
		if(decoded[1] !== b2) {
			throw new Error("Bad second byte");
		}
	}
}

fs.writeFileSync("get-block-start.json", JSON.stringify(get_block_start));
fs.writeFileSync("get-b2.json", JSON.stringify(get_b2));
console.log("OK");
