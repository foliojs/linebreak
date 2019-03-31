/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let AI, AL, BA, BK, CB, characterClasses, CJ, CR, ID, LF, NL, NS, SA, SG, SP, WJ, XX;
const UnicodeTrie = require('unicode-trie');
const fs = require('fs');
const base64 = require('base64-js');
({BK, CR, LF, NL, CB, BA, SP, WJ, SP, BK, LF, NL, AI, AL, SA, SG, XX, CJ, ID, NS, characterClasses} = require('./classes'));
const {DI_BRK, IN_BRK, CI_BRK, CP_BRK, PR_BRK, pairTable} = require('./pairs');

const data = base64.toByteArray(fs.readFileSync(__dirname + '/classes.trie', 'base64'));
const classTrie = new UnicodeTrie(data);

var LineBreaker = (function() {
  let mapClass = undefined;
  let mapFirst = undefined;
  let Break = undefined;
  LineBreaker = class LineBreaker {
    static initClass() {
    
      mapClass = function(c) {
        switch (c) {
          case AI:         return AL;
          case SA: case SG: case XX: return AL;
          case CJ:         return NS;
          default:            return c;
        }
      };
          
      mapFirst = function(c) {
        switch (c) {
          case LF: case NL: return BK;
          case CB:     return BA;
          case SP:     return WJ;
          default:        return c;
        }
      };
      
      Break = class Break {
        constructor(position, required) {
          this.position = position;
          if (required == null) { required = false; }
          this.required = required;
        }
      };
    }
    constructor(string) {
      this.string = string;
      this.pos = 0;
      this.lastPos = 0;
      this.curClass = null;
      this.nextClass = null;
    }
    
    nextCodePoint() {
      const code = this.string.charCodeAt(this.pos++);
      const next = this.string.charCodeAt(this.pos);
    
      // If a surrogate pair
      if ((0xd800 <= code && code <= 0xdbff) && (0xdc00 <= next && next <= 0xdfff)) {
        this.pos++;
        return ((code - 0xd800) * 0x400) + (next - 0xdc00) + 0x10000;
      }
      
      return code;
    }
        
    nextCharClass(first) {
      if (first == null) { first = false; }
      return mapClass(classTrie.get(this.nextCodePoint()));
    }
    
    nextBreak() {    
      // get the first char if we're at the beginning of the string
      if (this.curClass == null) { this.curClass = mapFirst(this.nextCharClass()); }
    
      while (this.pos < this.string.length) {
        this.lastPos = this.pos;
        const lastClass = this.nextClass;
        this.nextClass = this.nextCharClass();
      
        // explicit newline
        if ((this.curClass === BK) || ((this.curClass === CR) && (this.nextClass !== LF))) {
          this.curClass = mapFirst(mapClass(this.nextClass));
          return new Break(this.lastPos, true);
        }
      
        // handle classes not handled by the pair table
        const cur = (() => { switch (this.nextClass) {
          case SP:         return this.curClass;
          case BK: case LF: case NL: return BK;
          case CR:         return CR;
          case CB:         return BA;
        } })();
        
        if (cur != null) {
          this.curClass = cur;
          if (this.nextClass === CB) { return new Break(this.lastPos); }
          continue;
        }
      
        // if not handled already, use the pair table
        let shouldBreak = false;
        switch (pairTable[this.curClass][this.nextClass]) {
          case DI_BRK: // Direct break
            shouldBreak = true;
            break;
          
          case IN_BRK: // possible indirect break
            shouldBreak = lastClass === SP;
            break;
            
          case CI_BRK:
            shouldBreak = lastClass === SP;
            if (!shouldBreak) { continue; }
            break;
            
          case CP_BRK: // prohibited for combining marks
            if (lastClass !== SP) { continue; }
            break;
        }
          
        this.curClass = this.nextClass;
        if (shouldBreak) {
          return new Break(this.lastPos);
        }
      }
      
      if (this.pos >= this.string.length) {
        if (this.lastPos < this.string.length) {
          this.lastPos = this.string.length;
          return new Break(this.string.length);
        } else {
          return null;
        }
      }
    }
  };
  LineBreaker.initClass();
  return LineBreaker;
})();
          
module.exports = LineBreaker;
