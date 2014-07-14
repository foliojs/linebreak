UnicodeTrie = require 'unicode-trie'
classTrie = new UnicodeTrie require './class_trie.json'
{BK, CR, LF, NL, CB, BA, SP, WJ, SP, BK, LF, NL, AI, AL, SA, SG, XX, CJ, ID, NS, characterClasses} = require './classes'
{DI_BRK, IN_BRK, CI_BRK, CP_BRK, PR_BRK, pairTable} = require './pairs'

class LineBreaker
  constructor: (@string) ->
    @pos = 0
    @lastPos = 0
    @curClass = null
    @nextClass = null
    
  nextCodePoint: ->
    code = @string.charCodeAt @pos++
    next = @string.charCodeAt @pos
    
    # If a surrogate pair
    if 0xd800 <= code <= 0xdbff and 0xdc00 <= next <= 0xdfff
      @pos++
      return ((code - 0xd800) * 0x400) + (next - 0xdc00) + 0x10000
      
    return code
  
  mapClass = (c) ->
    switch c
      when AI         then AL
      when SA, SG, XX then AL
      when CJ         then NS
      else            c
        
  mapFirst = (c) ->
    switch c
      when LF, NL then BK
      when CB     then BA
      when SP     then WJ
      else        c
        
  nextCharClass: (first = false) ->
    return mapClass classTrie.get @nextCodePoint()
    
  class Break
    constructor: (@position, @required = false) ->
    
  nextBreak: ->    
    # get the first char if we're at the beginning of the string
    @curClass ?= mapFirst @nextCharClass()
    
    while @pos < @string.length
      @lastPos = @pos
      lastClass = @nextClass
      @nextClass = @nextCharClass()
      
      # explicit newline
      if @curClass is BK or (@curClass is CR and @nextClass isnt LF)
        @curClass = mapFirst mapClass @nextClass
        return new Break(@lastPos, true)
      
      # handle classes not handled by the pair table
      cur = switch @nextClass
        when SP         then @curClass
        when BK, LF, NL then BK
        when CR         then CR
        when CB         then BA
        
      if cur?
        @curClass = cur
        return new Break(@lastPos) if @nextClass is CB
        continue
      
      # if not handled already, use the pair table
      shouldBreak = false
      switch pairTable[@curClass][@nextClass]
        when DI_BRK # Direct break
          shouldBreak = true
          
        when IN_BRK # possible indirect break
          shouldBreak = lastClass is SP
            
        when CI_BRK
          shouldBreak = lastClass is SP
          continue unless shouldBreak
            
        when CP_BRK # prohibited for combining marks
          continue unless lastClass is SP
          
      @curClass = @nextClass
      if shouldBreak
        return new Break(@lastPos)
      
    if @pos >= @string.length
      if @lastPos < @string.length
        @lastPos = @string.length
        return new Break @string.length
      else
        return null
          
module.exports = LineBreaker