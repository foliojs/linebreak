import fs from 'fs';
import request from 'request';
import * as classes from './classes.js';
import UnicodeTrieBuilder from 'unicode-trie/builder.js';

// this loads the LineBreak.txt file for Unicode and parses it to
// combine ranges and generate JavaScript
request('http://www.unicode.org/Public/14.0.0/ucd/LineBreak.txt', function (err, res, data) {
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
      trie.setRange(parseInt(start, 16), parseInt(end, 16), classes[type], true);
      type = null;
    }

    if (type == null) {
      start = rangeStart;
      type = rangeType;
    }

    end = rangeEnd;
  }

  trie.setRange(parseInt(start, 16), parseInt(end, 16), classes[type], true);

  // write the trie to a file
  fs.writeFileSync(new URL('classes.trie', import.meta.url), trie.toBuffer());
});
