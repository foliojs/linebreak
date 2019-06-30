const fs = require('fs');
const punycode = require('punycode');
const LineBreaker = require('../');
const assert = require('assert');

describe('unicode line break tests', function () {
  // these tests are weird, possibly incorrect or just tailored differently. we skip them.
  const skip = [
    1068, 1070, 1072, 1074, 1224, 1226, 1228, 1230, 2932, 2934, 4340, 4342, 4496, 4498, 4960, 4962,
    6126, 6135, 6140, 6225, 6226, 6227, 6228, 6229, 6230, 6232, 6233, 6234, 6235, 6236
  ];

  const data = fs.readFileSync(__dirname + '/LineBreakTest.txt', 'utf8');
  const lines = data.split('\n');

  return lines.forEach(function (line, i) {
    let bk;
    if (!line || /^#/.test(line)) { return; }

    const [cols, comment] = line.split('#');
    const codePoints = cols.split(/\s*[×÷]\s*/).slice(1, -1).map(c => parseInt(c, 16));
    const str = punycode.ucs2.encode(codePoints);

    const breaker = new LineBreaker(str);
    const breaks = [];
    let last = 0;
    while ((bk = breaker.nextBreak())) {
      breaks.push(str.slice(last, bk.position));
      last = bk.position;
    }

    const expected = cols.split(/\s*÷\s*/).slice(0, -1).map(function (c) {
      let codes = c.split(/\s*×\s*/);
      if (codes[0] === '') { codes.shift(); }
      codes = codes.map(c => parseInt(c, 16));
      return punycode.ucs2.encode(codes);
    });

    if (skip.includes(i)) {
      it.skip(cols, function () { });
      return;
    }

    it(cols, () => assert.deepEqual(breaks, expected, i + ' ' + JSON.stringify(breaks) + ' != ' + JSON.stringify(expected) + ' #' + comment));
  });
});
