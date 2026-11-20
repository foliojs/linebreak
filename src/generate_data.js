import fs from 'fs';
import * as classes from './classes.js';
import { UnicodeTrieBuilder } from 'unicode-trie/builder.js';

const setTypedRange = (trie, start, end, type, isEastAsianWide) => {
  // Split East Asian opening punctuation and closing parentheses for LB30.
  if (type === 'OP' || type === 'CP') {
    for (let cp = start; cp <= end; cp++) {
      trie.setRange(cp, cp, isEastAsianWide(cp) ? classes[`${type}_EA`] : classes[type], true);
    }
  } else {
    trie.setRange(start, end, classes[type], true);
  }
}

// Build a predicate for East Asian Wide/Fullwidth/Halfwidth code points
const parseEastAsianWide = (data) => {
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

// Load LineBreak.txt and EastAsianWidth.txt to generate the class trie
async function generateData() {
  const lbResponse = await fetch('https://www.unicode.org/Public/15.0.0/ucd/LineBreak.txt');
  if (!lbResponse.ok) {
    throw new Error(`Failed to download LineBreak.txt: ${lbResponse.status} ${lbResponse.statusText}`);
  }

  const eawResponse = await fetch('https://www.unicode.org/Public/15.0.0/ucd/EastAsianWidth.txt');
  if (!eawResponse.ok) {
    throw new Error(`Failed to download EastAsianWidth.txt: ${eawResponse.status} ${eawResponse.statusText}`);
  }

  const lbData = await lbResponse.text();
  const matches = lbData.match(/^[0-9A-F]+(\.\.[0-9A-F]+)?;[A-Z][A-Z0-9]([A-Z])?/gm);

  const eawData = await eawResponse.text();
  const isEastAsianWide = parseEastAsianWide(eawData);

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
}

generateData().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
