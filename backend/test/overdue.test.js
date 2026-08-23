const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isOverdue, daysOpen, effectivePriority, withOverdueFlag } = require('../src/utils/overdue');

test('a fresh OPEN complaint is not overdue', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-19T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), false);
});

test('an OPEN complaint older than the threshold is overdue', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' }; // 19 days old
  assert.equal(isOverdue(complaint, 7, now), true);
});

test('an IN_PROGRESS complaint older than the threshold is overdue', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'IN_PROGRESS', createdAt: '2026-08-01T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), true);
});

test('a RESOLVED complaint is never overdue, no matter how old', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { status: 'RESOLVED', createdAt: '2026-01-01T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), false);
});

test('exactly at the threshold boundary is not yet overdue (strictly greater-than)', () => {
  const now = new Date('2026-08-08T00:00:00Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' }; // exactly 7 days
  assert.equal(isOverdue(complaint, 7, now), false);
});

test('one millisecond past the threshold is overdue', () => {
  const now = new Date('2026-08-08T00:00:00.001Z');
  const complaint = { status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' };
  assert.equal(isOverdue(complaint, 7, now), true);
});

test('daysOpen floors to whole days', () => {
  const now = new Date('2026-08-10T12:00:00Z');
  const complaint = { createdAt: '2026-08-01T00:00:00Z' };
  assert.equal(daysOpen(complaint, now), 9);
});

test('withOverdueFlag adds both computed fields without mutating the input', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { id: '1', status: 'OPEN', createdAt: '2026-08-01T00:00:00Z' };
  const result = withOverdueFlag(complaint, 7, now);
  assert.equal(result.isOverdue, true);
  assert.equal(result.daysOpen, 19);
  assert.equal(complaint.isOverdue, undefined); // original untouched
});

test('LOW priority is not escalated before the overdue threshold', () => {
  const now = new Date('2026-08-08T00:00:00Z');
  const complaint = { status: 'OPEN', priority: 'LOW', createdAt: '2026-08-01T00:00:00Z' }; // exactly 7 days
  assert.equal(effectivePriority(complaint, 7, now), 'LOW');
});

test('LOW priority escalates to MEDIUM once overdue', () => {
  const now = new Date('2026-08-08T00:00:00.001Z');
  const complaint = { status: 'OPEN', priority: 'LOW', createdAt: '2026-08-01T00:00:00Z' }; // 7 days + 1ms
  assert.equal(effectivePriority(complaint, 7, now), 'MEDIUM');
});

test('MEDIUM priority is not escalated until past 2x the threshold', () => {
  const now = new Date('2026-08-15T00:00:00Z');
  const complaint = { status: 'OPEN', priority: 'MEDIUM', createdAt: '2026-08-01T00:00:00Z' }; // exactly 14 days (2x7)
  assert.equal(effectivePriority(complaint, 7, now), 'MEDIUM');
});

test('MEDIUM priority escalates to HIGH once open more than 2x the threshold', () => {
  const now = new Date('2026-08-15T00:00:00.001Z');
  const complaint = { status: 'OPEN', priority: 'MEDIUM', createdAt: '2026-08-01T00:00:00Z' }; // 14 days + 1ms
  assert.equal(effectivePriority(complaint, 7, now), 'HIGH');
});

test('LOW priority does not cascade past MEDIUM even well beyond 2x the threshold', () => {
  const now = new Date('2026-09-01T00:00:00Z');
  const complaint = { status: 'OPEN', priority: 'LOW', createdAt: '2026-08-01T00:00:00Z' }; // 31 days old
  assert.equal(effectivePriority(complaint, 7, now), 'MEDIUM');
});

test('HIGH priority always stays HIGH, no matter how overdue', () => {
  const now = new Date('2026-09-01T00:00:00Z');
  const complaint = { status: 'IN_PROGRESS', priority: 'HIGH', createdAt: '2026-01-01T00:00:00Z' };
  assert.equal(effectivePriority(complaint, 7, now), 'HIGH');
});

test('a RESOLVED complaint never escalates, no matter how old', () => {
  const now = new Date('2026-09-01T00:00:00Z');
  const complaint = { status: 'RESOLVED', priority: 'LOW', createdAt: '2026-01-01T00:00:00Z' };
  assert.equal(effectivePriority(complaint, 7, now), 'LOW');
});

test('withOverdueFlag includes effectivePriority', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const complaint = { id: '1', status: 'OPEN', priority: 'LOW', createdAt: '2026-08-01T00:00:00Z' };
  const result = withOverdueFlag(complaint, 7, now);
  assert.equal(result.effectivePriority, 'MEDIUM');
});
