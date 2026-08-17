import fs from 'fs';
import request from 'request';
import * as classes from './classes.js';
import UnicodeTrieBuilder from 'unicode-trie/builder.js';

const BASE = 'https://www.unicode.org/Public/15.0.0/ucd/';

// Build a predicate for East Asian Wide/Full/Halfwidth code points. Rule LB30
// treats opening punctuation and closing parens differently when they are East
// Asian, so those need to be split from the OP/CP classes.
function parseEastAsianWide(data) {
  const ranges = [];
  const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([WFH])\b/gm;
  let match;
  while ((match = re.exec(data)) !== null) {
    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    ranges.push([start, end]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  return function isEastAsianWide(cp) {
    let lo = 0;
    let hi = ranges.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cp < ranges[mid][0]) {
        hi = mid - 1;
      } else if (cp > ranges[mid][1]) {
        lo = mid + 1;
      } else {
        return true;
      }
    }
    return false;
  };
}

function setTypedRange(trie, start, end, type, isEastAsianWide) {
  // Opening punctuation is set one code point at a time so the East Asian ones
  // can be assigned OP_EA for Rule LB30's East Asian exception.
  if (type === 'OP') {
    for (let cp = start; cp <= end; cp++) {
      trie.setRange(cp, cp, isEastAsianWide(cp) ? classes.OP_EA : classes.OP, true);
    }
  } else {
    trie.setRange(start, end, classes[type], true);
  }
}

function fail(name, err, res, body) {
  if (err) throw err;
  if (!res || res.statusCode !== 200) throw new Error(`${name}: unexpected status ${res && res.statusCode}`);
  if (!body) throw new Error(`${name}: empty response`);
}

request(`${BASE}EastAsianWidth.txt`, function (eawErr, eawRes, eawData) {
  fail('EastAsianWidth.txt', eawErr, eawRes, eawData);
  const isEastAsianWide = parseEastAsianWide(eawData);

  // this loads the LineBreak.txt file for Unicode and parses it to
  // combine ranges and generate JavaScript
  request(`${BASE}LineBreak.txt`, function (err, res, data) {
    fail('LineBreak.txt', err, res, data);
    const matches = data.match(/^[0-9A-F]+(\.\.[0-9A-F]+)?;[A-Z][A-Z0-9]([A-Z])?/gm);

    let start = null;
    let end = null;
    let type = null;
    const trie = new UnicodeTrieBuilder(classes.XX);

    // collect entries in the linebreaking table into ranges
    // to keep things smaller.
    for (let match of matches) {
      var rangeEnd, rangeType;
      match = match.split(/;|\.\./);
      const rangeStart = match[0];

      if (match.length === 3) {
        rangeEnd = match[1];
        rangeType = match[2];
      } else {
        rangeEnd = rangeStart;
        rangeType = match[1];
      }

      if ((type != null) && (rangeType !== type)) {
        setTypedRange(trie, parseInt(start, 16), parseInt(end, 16), type, isEastAsianWide);
        type = null;
      }

      if (type == null) {
        start = rangeStart;
        type = rangeType;
      }

      end = rangeEnd;
    }

    setTypedRange(trie, parseInt(start, 16), parseInt(end, 16), type, isEastAsianWide);

    // write the trie Uint8Array to a file
    const trieBuffer = trie.toBuffer();
    const output = `export default new Uint8Array([${[...trieBuffer].join(',')}]);\n`;
    fs.writeFileSync(new URL('classes-trie-data.js', import.meta.url), output);
  });
});
