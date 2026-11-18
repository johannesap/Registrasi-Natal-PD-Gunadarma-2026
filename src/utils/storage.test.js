import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvCell } from './storage.js';

test('CSV cells that Excel would run as a formula start with a quote', () => {
  // A participant can type this as their name; the panitia open the export in Excel
  assert.equal(csvCell('=HYPERLINK("http://x","klik")'), `"'=HYPERLINK(""http://x"",""klik"")"`);
  assert.equal(csvCell('@SUM(A1)'), `"'@SUM(A1)"`);
  assert.equal(csvCell('+62812'), `"'+62812"`);
  assert.equal(csvCell('-1+2'), `"'-1+2"`);
  assert.equal(csvCell('Maria Natalia'), '"Maria Natalia"');
});
