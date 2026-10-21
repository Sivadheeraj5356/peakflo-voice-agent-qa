const test = require('node:test');
const assert = require('node:assert/strict');
const { parseScenario, evaluate, scoreScenario } = require('./app.js');

test('parses one scenario per line', () => {
  const rows = parseScenario('Collections call | verify invoice INV-1 and amount | ERP | high\n\nVendor question | answer from policy | knowledge base | low');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].risk, 'high');
});

test('grounded voice workflow scores above an ungrounded one', () => {
  const grounded = scoreScenario({ name: 'Invoice call', workflow: 'verify invoice amount and date, escalate disputes', source: 'ERP invoice record', risk: 'medium' });
  const loose = scoreScenario({ name: 'General call', workflow: 'talk to customer', source: '', risk: 'medium' });
  assert.ok(grounded > loose);
});

test('high-risk flow gets a concrete pre-pilot fix', () => {
  const [item] = evaluate('Collections call | read balance |  | high');
  assert.equal(item.status, 'needs work');
  assert.match(item.recommendation, /human review/);
});
