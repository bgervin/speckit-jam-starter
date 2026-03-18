import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/server.js';
import { clearSessions } from '../src/sessions.js';

async function createTestSession(items = ['Search', 'Dark Mode', 'Export CSV', 'Notifications']) {
  const res = await request(app)
    .post('/api/sessions')
    .send({ title: 'Test Session', items });
  return res.body.data.code;
}

function validAllocations() {
  return { 'Search': 40, 'Dark Mode': 25, 'Export CSV': 25, 'Notifications': 10 };
}

describe('POST /api/sessions/:code/votes', () => {
  beforeEach(() => {
    clearSessions();
  });

  it('1 - valid vote with correct allocations summing to $100', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: validAllocations() });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.voterName, 'Alice');
    assert.deepStrictEqual(res.body.data.allocations, validAllocations());
  });

  it('2 - valid vote allocating $0 to some items', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Bob', allocations: { 'Search': 100, 'Dark Mode': 0, 'Export CSV': 0, 'Notifications': 0 } });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  it('3 - valid vote allocating all $100 to one item', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Carol', allocations: { 'Search': 0, 'Dark Mode': 0, 'Export CSV': 100, 'Notifications': 0 } });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  it('4 - session code does not exist', async () => {
    const res = await request(app)
      .post('/api/sessions/ZZZZZZ/votes')
      .send({ voterName: 'Alice', allocations: {} });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Session not found');
  });

  it('5 - missing voterName', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ allocations: validAllocations() });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Voter name is required');
  });

  it('6 - empty string voterName', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: '', allocations: validAllocations() });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Voter name is required');
  });

  it('7 - missing allocations', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Allocations must be an object');
  });

  it('8 - allocations is not an object (array)', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: [40, 25, 25, 10] });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Allocations must be an object');
  });

  it('9 - allocations has extra keys not in session items', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: { ...validAllocations(), 'Extra': 0 } });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Allocations must include exactly the session items');
  });

  it('10 - allocations is missing a session item key', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: { 'Search': 50, 'Dark Mode': 50 } });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Allocations must include exactly the session items');
  });

  it('11 - an allocation value is negative', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: { 'Search': -10, 'Dark Mode': 60, 'Export CSV': 25, 'Notifications': 25 } });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Each allocation must be a non-negative integer');
  });

  it('12 - an allocation value is not an integer', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: { 'Search': 10.5, 'Dark Mode': 39.5, 'Export CSV': 25, 'Notifications': 25 } });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Each allocation must be a non-negative integer');
  });

  it('13 - allocations sum to less than $100', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: { 'Search': 10, 'Dark Mode': 10, 'Export CSV': 10, 'Notifications': 10 } });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Allocations must sum to exactly $100');
  });

  it('14 - allocations sum to more than $100', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: { 'Search': 50, 'Dark Mode': 50, 'Export CSV': 50, 'Notifications': 50 } });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Allocations must sum to exactly $100');
  });

  it('15 - duplicate voter name (exact match)', async () => {
    const code = await createTestSession();
    await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: validAllocations() });

    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: validAllocations() });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'This name has already voted in this session');
  });

  it('16 - duplicate voter name (different casing)', async () => {
    const code = await createTestSession();
    await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: validAllocations() });

    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'ALICE', allocations: validAllocations() });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'This name has already voted in this session');
  });

  it('17 - voter name is trimmed in the stored vote', async () => {
    const code = await createTestSession();
    const res = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: '  Alice  ', allocations: validAllocations() });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.voterName, 'Alice');
  });

  it('18 - two different voters can vote in the same session', async () => {
    const code = await createTestSession();

    const res1 = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Alice', allocations: validAllocations() });
    assert.strictEqual(res1.status, 200);

    const res2 = await request(app)
      .post(`/api/sessions/${code}/votes`)
      .send({ voterName: 'Bob', allocations: { 'Search': 10, 'Dark Mode': 20, 'Export CSV': 30, 'Notifications': 40 } });
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.data.voterName, 'Bob');
  });
});
