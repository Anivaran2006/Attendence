const assert = require('assert');
const path = require('path');

// Import compiled shared code
const {
  calculatePercentage,
  calculateClassesToReachTarget,
  calculateBunkCapacity,
  getAttendanceThresholds,
  projectAttendance,
  aggregateAttendance,
  MOCK_ABES_SUBJECTS,
} = require('../shared/dist/index.js');

console.log('--- Running Attendance Calculator Tests ---');

// 1. Exact prompt check: Aggregated 12 subjects
const overall = aggregateAttendance(MOCK_ABES_SUBJECTS);
console.log('Aggregated Overall:', overall);
assert.strictEqual(overall.totalLectures, 200, 'Total lectures must be exactly 200');
assert.strictEqual(overall.present, 176, 'Present lectures must be exactly 176');
assert.strictEqual(overall.absent, 24, 'Absent lectures must be exactly 24');
assert.strictEqual(overall.percentage, 88.0, 'Percentage must be 88.0%');

// 2. Bunk capacity test
// Formula: floor((P - 0.75 * T) / 0.75) = floor((176 - 0.75*200) / 0.75) = floor(26 / 0.75) = floor(34.66) = 34
const bunkOverall = calculateBunkCapacity(176, 200, 75);
console.log('Bunkable classes overall for 75%:', bunkOverall);
assert.strictEqual(bunkOverall, 34, 'Should be 34 classes bunkable for overall 200');

// Test single subject bunk capacity: 25CS302 (16/20 = 80%)
// floor((16 - 0.75*20) / 0.75) = floor(1 / 0.75) = 1
const bunkSub = calculateBunkCapacity(16, 20, 75);
console.log('Bunkable classes for 25CS302 (16/20):', bunkSub);
assert.strictEqual(bunkSub, 1, '25CS302 can miss 1 class and stay at 16/21 = 76.19% >= 75%');

// If misses 2 classes: 16 / 22 = 72.72% < 75% (verifying formula validity)
assert.ok(16 / 21 >= 0.75, '16/21 must be >= 75%');
assert.ok(16 / 22 < 0.75, '16/22 must be < 75%');

// 3. Classes required to reach target test
// For attendance below 75%: e.g. 10/20 = 50%
// Need: (10 + x)/(20 + x) >= 0.75 => x >= (0.75*20 - 10) / (1 - 0.75) = 5 / 0.25 = 20
const req75 = calculateClassesToReachTarget(10, 20, 75);
console.log('Classes needed to reach 75% from 10/20:', req75);
assert.strictEqual(req75, 20, 'Needs 20 classes (30/40 = 75%)');

// For 80%: (16 + x)/(20 + x) >= 0.85
// x = ceil((0.85*20 - 16) / 0.15) = ceil((17 - 16) / 0.15) = ceil(6.666) = 7
const req85 = calculateClassesToReachTarget(16, 20, 85);
console.log('Classes needed for 25CS302 to reach 85%:', req85);
assert.strictEqual(req85, 7, 'Needs 7 classes (23/27 = 85.18%)');
assert.ok((16 + 7) / (20 + 7) >= 0.85, '23/27 must be >= 85%');
assert.ok((16 + 6) / (20 + 6) < 0.85, '22/26 must be < 85%');

// 4. Projection test
const proj = projectAttendance(176, 200, 4);
console.log('Projection +4 classes:', proj);
assert.strictEqual(proj.projectedAttended, calculatePercentage(180, 204));
assert.strictEqual(proj.projectedMissed, calculatePercentage(176, 204));

// 5. Edge cases
assert.strictEqual(calculatePercentage(0, 0), 0);
assert.strictEqual(calculateBunkCapacity(0, 0), 0);
assert.strictEqual(calculateClassesToReachTarget(0, 0, 75), 0);
assert.strictEqual(calculateClassesToReachTarget(10, 10, 75), 0);

console.log('✓ All Attendance Calculator unit tests PASSED successfully!');
