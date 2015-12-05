// This module reads in most kinds of Unicode Character Data set text files.
// Comments (marked with a #) are stripped, empty lines are removed. The
// remaining lines are divided up into fields on the semicolon delimiter, and
// the fields have whitespace trimmed.

var fs = require("fs");

module.exports.readFileSync = function(name) {
	return fs.readFileSync(name, {"encoding" : "utf8"}).split(/\n/).map(function(line) {
		return line.replace(/^(.*?)(?:#.*)?$/, "$1");
	}).filter(function(line) {
		return line !== "";
	}).map(function(line) {
		return line.split(";").map(function(field) {
			return field.trim();
		});
	});
};

console.log("---");
