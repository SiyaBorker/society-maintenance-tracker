const { test } = require('node:test');
const assert = require('node:assert/strict');
const { canComment } = require('../src/utils/commentPermissions');

test('the complaint\'s owning resident can comment', () => {
  const user = { id: 'resident-1', role: 'RESIDENT' };
  const complaint = { residentId: 'resident-1' };
  assert.equal(canComment(user, complaint), true);
});

test('a different resident cannot comment on someone else\'s complaint', () => {
  const user = { id: 'resident-2', role: 'RESIDENT' };
  const complaint = { residentId: 'resident-1' };
  assert.equal(canComment(user, complaint), false);
});

test('any admin can comment, regardless of who raised the complaint', () => {
  const user = { id: 'admin-1', role: 'ADMIN' };
  const complaint = { residentId: 'resident-1' };
  assert.equal(canComment(user, complaint), true);
});

test('an admin can comment even when the complaint has no matching resident id', () => {
  const user = { id: 'admin-1', role: 'ADMIN' };
  const complaint = { residentId: 'someone-else' };
  assert.equal(canComment(user, complaint), true);
});
