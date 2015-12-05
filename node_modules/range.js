// A range is just a closed-open pair of integers.

var Range = function(lower, upper) {
	if(lower !== Number(lower)) {
		throw new Error("Non-numeric lower bound");
	}
	if(upper !== Number(upper)) {
		throw new Error("Non-numeric upper bound");
	}
	if(lower > upper) {
		throw new Error("Disordered range");
	}
	if(lower === upper) {
		throw new Error("Empty range");
	}
	this.lower = lower;
	this.upper = upper;
};
Range.prototype.contains = function(other) {
	return this.lower <= other.lower && other.upper <= this.upper;
};
Range.prototype.cardinality = function() {
	return this.upper - this.lower;
};
Range.prototype.create = function(lower, upper) {
	if(lower !== Number(lower)) {
		throw new Error("Lower bound is not a number");
	}
	if(upper !== Number(upper)) {
		throw new Error("Upper bound is not a number");
	}
	if(upper <= lower) {
		throw new Error("Disordered range");
	}
};
Range.prototype.compare = function(other) {
	return (this.lower - other.lower) || (this.upper - other.upper);
};
Range.prototype.overlaps = function(other) {
	return !(this.lower > other.upper || this.upper < other.lower);
};
Range.prototype.equals = function(other) {
	return this.lower === other.lower && this.upper === other.upper;
};
Range.prototype.intersection = function(other) {
	// 1 or 0 ranges
	if(this.overlaps(other)) {
		return [
			new Range(
				Math.max(this.lower, other.lower),
				Math.min(this.upper, other.upper)
			)
		];
	}
	return [];
};
Range.prototype.union = function(other) {
	// 1 or 2 ranges
	if(this.overlaps(other)) {
		return [new Range(
			Math.min(this.lower, other.lower),
			Math.max(this.upper, other.upper)
		)];
	}
	return [this, other];
};
Range.prototype.difference = function(other) {
	// 0, 1 or 2 ranges
	var result = [];
	if(this.lower < other.lower) {
		result.push(new Range(
			this.lower,
			Math.min(this.upper, other.lower)
		));
	}
	if(this.upper > other.upper) {
		result.push(new Range(
			Math.max(this.lower, other.upper),
			this.upper
		));
	}
	return result;
};

module.exports = Range;

console.log(new Range(0, 2).overlaps(new Range(1, 3)));
console.log(new Range(1, 3).overlaps(new Range(0, 2)));
console.log(new Range(0, 2).union(new Range(1, 3))[0].equals(new Range(0, 3)));
console.log(new Range(1, 3).union(new Range(0, 2))[0].equals(new Range(0, 3)));
console.log(new Range(0, 2).union(new Range(2, 3))[0].equals(new Range(0, 3)));
console.log(new Range(2, 3).union(new Range(0, 2))[0].equals(new Range(0, 3)));
console.log(new Range(0, 1).cardinality() === 1);
console.log(new Range(0, 2).cardinality() === 2);
console.log(new Range(0, 11).cardinality() === 11);
console.log("---");
