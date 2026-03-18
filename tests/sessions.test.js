import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/server.js';
import { clearSessions } from '../src/sessions.js';

describe('POST /api/sessions', () => {
  beforeEach(() => {
    clearSessions();
  });

  it('1 - valid title and 4 items returns 200 with code, title, items', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Q3 Priorities', items: ['Search', 'Dark Mode', 'Export CSV', 'Notifications'] });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.code);
    assert.strictEqual(res.body.data.title, 'Q3 Priorities');
    assert.deepStrictEqual(res.body.data.items, ['Search', 'Dark Mode', 'Export CSV', 'Notifications']);
  });

  it('2 - valid title and exactly 2 items (minimum)', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Min Items', items: ['A', 'B'] });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  it('3 - valid title and exactly 20 items (maximum)', async () => {
    const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Max Items', items });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  it('4 - missing title returns 400', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ items: ['A', 'B'] });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Title is required');
  });

  it('5 - empty string title returns 400', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: '', items: ['A', 'B'] });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Title is required');
  });

  it('6 - missing items returns 400', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Test' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Items must be an array');
  });

  it('7 - items is not an array returns 400', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Test', items: 'not-an-array' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Items must be an array');
  });

  it('8 - only 1 item returns 400', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Test', items: ['Only one'] });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Items must contain between 2 and 20 entries');
  });

  it('9 - 21 items returns 400', async () => {
    const items = Array.from({ length: 21 }, (_, i) => `Item ${i + 1}`);
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Test', items });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Items must contain between 2 and 20 entries');
  });

  it('10 - an item is an empty string returns 400', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Test', items: ['Good', ''] });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Each item must be a non-empty string');
  });

  it('11 - session code is 6 uppercase alphanumeric chars', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Code Test', items: ['A', 'B'] });

    assert.strictEqual(res.status, 200);
    assert.match(res.body.data.code, /^[A-Z0-9]{6}$/);
  });

  it('12 - title and items are trimmed', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: '  Spaced Title  ', items: ['  A  ', '  B  '] });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.title, 'Spaced Title');
    assert.deepStrictEqual(res.body.data.items, ['A', 'B']);
  });
});
