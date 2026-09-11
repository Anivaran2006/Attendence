const assert = require('assert');
const { JSDOM } = require('jsdom');

// Since parser is in TypeScript/ESM, let's load it or create an instance
const { ABESAttendanceParser } = require('../extension/dist/chunks/attendance-parser.js') || {};

// If chunks name is different, let's check extension build or import from extension
console.log('Testing Parser resilience...');
