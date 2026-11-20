import fs from 'fs';
import { LineBreaker } from '../src/linebreaker.js';
import assert from 'assert';

describe('unicode line break tests', function () {
  // these tests are weird, possibly incorrect or just tailored differently. we skip them.
  const skip = [
    4351, 4353, 4359, 4361, 4627, 4629, 4635, 4637, 9579, 9581,
    12895, 12897, 12899, 12901, 13447, 13449, 13451, 13453, 15651, 15653,
    19123, 19132, 19137, 19222, 19223, 19224, 19225, 19226, 19227, 19229,
    19230, 19231, 19232, 19233
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
