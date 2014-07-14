fs = require 'fs'
request = require 'request'
classes = require './classes'
UnicodeTrieBuilder = require 'unicode-trie/builder'

# this loads the LineBreak.txt file for Unicode 6.2.0 and parses it to
# combine ranges and generate CoffeeScript
request 'http://www.unicode.org/Public/6.2.0/ucd/LineBreak.txt', (err, res, data) ->
  matches = data.match /^[0-9A-F]+(\.\.[0-9A-F]+)?;[A-Z][A-Z0-9]/gm

  start = null
  end = null
  type = null
  trie = new UnicodeTrieBuilder classes.XX

  # collect entries in the linebreaking table into ranges
  # to keep things smaller.
  for match in matches
    match = match.split(/;|\.\./)
    rangeStart = match[0]
  
    if match.length is 3
      rangeEnd = match[1]
      rangeType = match[2]
    else
      rangeEnd = rangeStart
      rangeType = match[1]
  
    if type? and rangeType isnt type
      trie.setRange parseInt(start, 16), parseInt(end, 16), classes[type], true
      type = null
    
    if not type?
      start = rangeStart
      type = rangeType
    
    end = rangeEnd
  
  trie.setRange parseInt(start, 16), parseInt(end, 16), classes[type], true

  # write the trie to a file
  frozen = trie.freeze()
  frozen.data = [frozen.data...]
  fs.writeFile __dirname + '/class_trie.json', JSON.stringify frozen