// cppEngine.js — backward-compatible re-export (superseded by engineBridge.js).
// Kept so older requires keep working; new code should require ./engineBridge.
module.exports = require('./engineBridge');

