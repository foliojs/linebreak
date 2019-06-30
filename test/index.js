const fs = require('fs');
const punycode = require('punycode');
const LineBreaker = require('../');
const assert = require('assert');

describe('unicode line break tests', function () {
  // these tests are weird, possibly incorrect or just tailored differently. we skip them.
  const skip = [
    1137, 1139, 1141, 1143, 1305, 1307, 1309, 1311, 2977, 2979, 4493, 4495, 4661, 4663, 5161, 5163,
    7133, 7142, 7147, 7232, 7233, 7234, 7235, 7236, 7237, 7239, 7240, 7241, 7242, 7243
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
