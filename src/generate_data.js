import fs from 'fs';
import * as classes from './classes.js';
import { INITIAL_PUNCTUATION, FINAL_PUNCTUATION, EAST_ASIAN } from './trie-properties.js';
import { UnicodeTrieBuilder } from 'unicode-trie/builder.js';
import { UNICODE_VERSION } from './unicode-version.js';

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

// Load LineBreak.txt, EastAsianWidth.txt, emoji-data.txt and DerivedGeneralCategory.txt to generate the class trie
async function generateData() {
  const lbResponse = await fetch(`https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/LineBreak.txt`);
  if (!lbResponse.ok) {
    throw new Error(`Failed to download LineBreak.txt: ${lbResponse.status} ${lbResponse.statusText}`);
  }

  const eawResponse = await fetch(`https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/EastAsianWidth.txt`);
  if (!eawResponse.ok) {
    throw new Error(`Failed to download EastAsianWidth.txt: ${eawResponse.status} ${eawResponse.statusText}`);
  }

  const emojiResponse = await fetch(`https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/emoji/emoji-data.txt`);
  if (!emojiResponse.ok) {
    throw new Error(`Failed to download emoji-data.txt: ${emojiResponse.status} ${emojiResponse.statusText}`);
  }

  const categoryResponse = await fetch(`https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/extracted/DerivedGeneralCategory.txt`);
  if (!categoryResponse.ok) {
    throw new Error(`Failed to download DerivedGeneralCategory.txt: ${categoryResponse.status} ${categoryResponse.statusText}`);
  }

  const lbData = await lbResponse.text();
  const matches = lbData.matchAll(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Z][A-Z0-9][A-Z]?)/gm);

  const eawData = await eawResponse.text();
  const isEastAsianWide = parseEastAsianWide(eawData);

  const trie = new UnicodeTrieBuilder(classes.XX);

  for (const [, start, end = start, type] of matches) {
    if (!Number.isInteger(classes[type])) {
      throw new Error(`Unknown line break class: ${type}`);
    }

    const rangeStart = parseInt(start, 16);
    const rangeEnd = parseInt(end, 16);

    trie.setRange(rangeStart, rangeEnd, classes[type], true);
  }

  const categoryData = await categoryResponse.text();

  // LB15a/LB15b need General_Category as well as Line_Break=QU
  for (const [, start, end = start, category] of categoryData.matchAll(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(Pi|Pf)\b/gm)) {
    const flag = category === 'Pi' ? INITIAL_PUNCTUATION : FINAL_PUNCTUATION;
    for (let cp = parseInt(start, 16); cp <= parseInt(end, 16); cp++) {
      if (trie.get(cp) === classes.QU) {
        trie.set(cp, classes.QU | flag);
      }
    }
  }

  // Treat unassigned Extended_Pictographic code points as emoji bases for LB30b
  const unassigned = new Uint8Array(0x110000);
  for (const [, start, end = start] of categoryData.matchAll(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*Cn\b/gm)) {
    unassigned.fill(1, parseInt(start, 16), parseInt(end, 16) + 1);
  }

  const emojiData = await emojiResponse.text();
  for (const [, start, end = start] of emojiData.matchAll(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*Extended_Pictographic\b/gm)) {
    const rangeEnd = parseInt(end, 16);
    for (let cp = parseInt(start, 16); cp <= rangeEnd; cp++) {
      if (unassigned[cp]) {
        trie.setRange(cp, cp, classes.EB, true);
      }
    }
  }

  // LB19a, LB21a and LB30 use East Asian Width alongside the line break class.
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (isEastAsianWide(cp)) {
      trie.set(cp, trie.get(cp) | EAST_ASIAN);
    }
  }

  // write the trie Uint8Array to a file
  const trieBuffer = trie.toBuffer();
  const output = `export default new Uint8Array([${[...trieBuffer].join(',')}]);\n`;
  fs.writeFileSync(new URL('classes-trie-data.js', import.meta.url), output);
}

generateData().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
