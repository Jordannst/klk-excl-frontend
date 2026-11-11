// Run: node tests/invoice-pdf-columns.check.mjs
// The cases mirror backend/src/checks/pdf-service.check.ts so the two
// implementations of the column width rule are proven to agree.
import assert from 'node:assert';
import {
  resolveInvoicePdfColumnWidths as resolve,
  visibleInvoicePdfColumns,
} from '../lib/invoice-pdf-columns.ts';

assert.deepEqual(visibleInvoicePdfColumns(false, false), ['noResi', 'coly', 'berat', 'min', 'tarif', 'total']);
assert.deepEqual(visibleInvoicePdfColumns(true, true).at(0), 'tanggal');
assert.deepEqual(visibleInvoicePdfColumns(true, true).at(-1), 'keterangan');

// Same defaults as the backend for all four column combinations.
assert.equal(resolve(true, true, undefined).textColumnWidth, 24.5);
assert.equal(resolve(true, false, undefined).textColumnWidth, 29.5);
assert.equal(resolve(false, true, undefined).textColumnWidth, 34.5);
assert.equal(resolve(false, false, undefined).textColumnWidth, 40.5);
assert.equal(resolve(true, true, undefined).defaults.noResi, 34);
assert.equal(resolve(true, false, undefined).defaults.noResi, 38);
// The date column is wider without Ket, where the larger table font applies.
assert.equal(resolve(true, true, undefined).defaults.tanggal, 20);
assert.equal(resolve(true, false, undefined).defaults.tanggal, 22);

// Overrides apply and the text columns absorb the difference.
const custom = resolve(true, false, { noResi: 30, berat: 11 });
assert.equal(custom.widths.noResi, 30);
assert.equal(custom.widths.berat, 11);
assert.equal(custom.textColumnWidth, 32);
assert.equal(custom.overridesApplied, true);

// Finite numbers are clamped to 6..60 and rounded to 0.5 mm.
const clamped = resolve(false, false, { tarif: 500, noResi: -5 });
assert.equal(clamped.widths.tarif, 60);
assert.equal(clamped.widths.noResi, 6);
assert.equal(resolve(true, false, { berat: 9.26 }).widths.berat, 9.5);

// Junk values, unknown keys, hidden columns and non-object input are ignored.
for (const junk of [{ berat: 'abc', min: Number.NaN, tarif: null, bogus: 40 }, { keterangan: 40 }, 'abc', null, [30, 30]]) {
  const result = resolve(true, false, junk);
  assert.deepEqual(result.widths, result.defaults);
  assert.equal(result.overridesApplied, true);
  assert.equal(result.widths.keterangan, undefined);
}

// Overrides that squeeze Pengirim/Penerima below 24 mm fall back to defaults.
const tooWide = resolve(true, true, { berat: 20 });
assert.equal(tooWide.overridesApplied, false);
assert.deepEqual(tooWide.widths, tooWide.defaults);
assert.equal(tooWide.textColumnWidth, 24.5);

console.log('invoice-pdf-columns check passed');
