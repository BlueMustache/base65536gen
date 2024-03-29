// A rangelist is a list of closed-open ranges of integers. This takes up less
// space than some kind of data structure containing the full collection of
// integers.

var Range = require("./range.js");

var RangeList = function(ranges){
	ranges = ranges || [];

	// These are kept sorted. Each range is always separated from the next by a
	// gap of at least one. E.g. [[0, 1], [1, 2]] is illegal, it should collapse
	// to [[0, 2]].
	for(var i = 0; i + 1 < ranges.length; i++) {
		if(ranges[i].upper >= ranges[i + 1].lower) {
			throw new Error("Indistinct ranges");
		}
	}

	this.ranges = ranges;
};

// Iterate steadily through all the bounds of both RangeLists, determining at
// each stage whether we are "in" the new RangeList or not, according to the
// supplied test.
RangeList.prototype.combine = function(other, test) {
	if(other instanceof Range) {
		other = new RangeList([other]);
	}
	var n       = -Infinity,
	    i       = -1,
	    j       = -1,
	    inThis  = false,
	    inOther = false,
	    inNew   = test(inThis, inOther);
	var newRanges = [];
	var newRangeLower = null;
	while(n < Infinity) {
		var nextThis =
			inThis                     ? this.ranges[i].upper     :
			i + 1 < this.ranges.length ? this.ranges[i + 1].lower :
			Infinity;
		var nextOther =
			inOther                     ? other.ranges[j].upper     :
			j + 1 < other.ranges.length ? other.ranges[j + 1].lower :
			Infinity;
		if(nextThis <= nextOther) {
			n = nextThis;
			inThis = !inThis;
			i += inThis ? 1 : 0;
		}
		if(nextOther <= nextThis) {
			n = nextOther;
			inOther = !inOther;
			j += inOther ? 1 : 0;
		}
		if(inNew !== test(inThis, inOther)) {
			if(inNew) {
				newRanges.push(new Range(newRangeLower, n));
				newRangeLower = null;
			} else {
				newRangeLower = n;
			}
			inNew = !inNew;
		}
	}
	return new RangeList(newRanges);
};

RangeList.prototype.contains = function(otherRange) {
	return this.ranges.some(function(range) {
		return range.contains(otherRange);
	});
};

RangeList.prototype.cardinality = function() {
	var cardinality = 0;
	this.ranges.forEach(function(range) {
		cardinality += range.cardinality();
	});
	return cardinality;
};

RangeList.prototype.union = function(other) {
	return this.combine(other, function(inThis, inOther) {
		return inThis || inOther;
	});
};

RangeList.prototype.intersection = function(other) {
	return this.combine(other, function(inThis, inOther) {
		return inThis && inOther;
	});
};

RangeList.prototype.difference = function(other) {
	return this.combine(other, function(inThis, inOther) {
		return inThis && !inOther;
	});
};

module.exports = RangeList;

var rla = new RangeList();

rla = rla.union(new Range(0, 1));
console.log(rla.ranges.length === 1);
console.log(rla.ranges[0].equals(new Range(0, 1)));
rla = rla.union(new Range(2, 3));
console.log(rla.ranges.length === 2);
console.log(rla.ranges[0].equals(new Range(0, 1)));
console.log(rla.ranges[1].equals(new Range(2, 3)));
rla = rla.union(new Range(3, 4));
console.log(rla.ranges.length === 2);
console.log(rla.ranges[0].equals(new Range(0, 1)));
console.log(rla.ranges[1].equals(new Range(2, 4)));
rla = rla.union(new Range(-2, 1));
console.log(rla.ranges.length === 2);
console.log(rla.ranges[0].equals(new Range(-2, 1)));
console.log(rla.ranges[1].equals(new Range(2, 4)));
rla = rla.union(new Range(0, 78));
console.log(rla.ranges.length === 1);
console.log(rla.ranges[0].equals(new Range(-2, 78)));
rla = rla.difference(new Range(-3, 1));
console.log(rla.ranges.length === 1);
console.log(rla.ranges[0].equals(new Range(1, 78)));
rla = rla.difference(new Range(76, 90));
console.log(rla.ranges.length === 1);
console.log(rla.ranges[0].equals(new Range(1, 76)));
rla = rla.difference(new Range(35, 48));
console.log(rla.ranges.length === 2);
console.log(rla.ranges[0].equals(new Range(1, 35)));
console.log(rla.ranges[1].equals(new Range(48, 76)));
rla = rla.difference(new Range(0, 40));
console.log(rla.ranges.length === 1);
console.log(rla.ranges[0].equals(new Range(48, 76)));
rla = rla.intersection(new Range(49, 77));
console.log(rla.ranges.length === 1);
console.log(rla.ranges[0].equals(new Range(49, 76)));
console.log("---");
