// Round to 2 decimals to avoid floating point drift in totals.
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

module.exports = { round2 };
