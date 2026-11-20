import fs from 'fs';
import { LineBreaker } from '../src/linebreaker.js';
import assert from 'assert';

describe('unicode line break tests', function () {
  // these tests are weird, possibly incorrect or just tailored differently. we skip them.
  const skip = [
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
