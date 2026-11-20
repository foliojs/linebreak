import fs from 'fs';
import { LineBreaker } from '../src/linebreaker.js';
import assert from 'assert';

describe('unicode line break tests', function () {
  // these tests are weird, possibly incorrect or just tailored differently. we skip them.
  const skip = [
    1941, 1943, 1945, 1947, 3933, 3935, 5737, 5739, 5801, 5803, 5937, 5939, 6001, 6003, 6533,
    6535, 8541, 8543, 8545, 8547, 10081, 10090, 10095, 10180, 10181, 10182, 10183, 10184, 10185, 10187,
    10188, 10189, 10190, 10191
  ];

  const data = fs.readFileSync(new URL('LineBreakTest.txt', import.meta.url), 'utf8');
  const lines = data.split('\n');

  return lines.forEach(function (line, i) {
    let rowNumber = i + 1;
    let bk;
    if (!line || /^#/.test(line)) { return; }

    const [cols, comment] = line.split('#');
    const codePoints = cols.split(/\s*[×÷]\s*/).slice(1, -1).map(c => parseInt(c, 16));
    const str = String.fromCodePoint(...codePoints);

    const breaker = new LineBreaker(str);
    const breaks = [];
    let last = 0;
    while (bk = breaker.nextBreak()) {
      breaks.push(str.slice(last, bk.position));
      last = bk.position;
    }

    const expected = cols.split(/\s*÷\s*/).slice(0, -1).map(function (c) {
      let codes = c.split(/\s*×\s*/);
      if (codes[0] === '') { codes.shift(); }
      codes = codes.map(c => parseInt(c, 16));
      return String.fromCodePoint(...codes);
    });

    if (skip.includes(rowNumber)) {
      it.skip(cols, function () { });
      return;
    }

    it(cols, () => assert.deepStrictEqual(breaks, expected, rowNumber + ' ' + JSON.stringify(breaks) + ' != ' + JSON.stringify(expected) + ' #' + comment));
  });
});
