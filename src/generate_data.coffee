fs = require 'fs'
request = require 'request'

# this loads the LineBreak.txt file for Unicode 6.2.0 and parses it to
# combine ranges and generate CoffeeScript
request 'http://www.unicode.org/Public/6.2.0/ucd/LineBreak.txt', (err, res, data) ->
  matches = data.match /^[0-9A-F]+(\.\.[0-9A-F]+)?;[A-Z][A-Z0-9]/gm

  start = null
  end = null
  type = null
  out = []

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
      out.push "new CharRange(0x#{start}, 0x#{end}, #{type})"
      type = null
    
    if not type?
      start = rangeStart
      type = rangeType
    
    end = rangeEnd
  
  out.push "new CharRange(0x#{start}, 0x#{end}, #{type})"

  # replace the current character class ranges with the new ones
  classes = fs.readFileSync 'classes.coffee', 'utf8'
  classes = classes.replace /exports.characterClasses = \[[\S\s]*\]/, 
                            'exports.characterClasses = [\n  ' + out.join('\n  ') + '\n]'
              
  fs.writeFile 'classes.coffee', classes