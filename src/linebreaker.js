import { UnicodeTrie } from 'unicode-trie';
import {
  BK, CR, LF, NL, SG, WJ, SP, ZW, ZWJ, BA, HY, NS, AI, AL, CJ, HL, RI, SA,
  OP, QU, GL, CL, CP, EX, IS, SY, CM, AK, AP, AS, VF, VI, XX, NU, PR, PO, CB
} from './classes.js';
import { CLASS_MASK, INITIAL_PUNCTUATION, FINAL_PUNCTUATION, EAST_ASIAN } from './trie-properties.js';
import { DI_BRK, IN_BRK, CI_BRK, CP_BRK, PR_BRK, pairTable } from './pairs.js';
import data from './classes-trie-data.js';

export { UNICODE_VERSION } from './unicode-version.js';

const classTrie = new UnicodeTrie(data);
const quoteStartClasses = new Set([BK, CR, LF, NL, OP, QU, GL, SP, ZW]);
const quoteEndClasses = new Set([SP, GL, WJ, CL, QU, CP, EX, IS, SY, BK, CR, LF, NL, ZW]);
const combiningExceptions = new Set([BK, CR, LF, NL, SP, ZW]);
const hyphenStartClasses = new Set([BK, CR, LF, NL, SP, ZW, CB, GL]);
const isAksara = (context) => context && (context.type === AK || context.type === AS || context.codePoint === 0x25cc);

const mapClass = function (c) {
  switch (c) {
    case AI:
      return AL;

    case SA:
    case SG:
    case XX:
      return AL;

    case CJ:
      return NS;

    default:
      return c;
  }
};

const mapFirst = function (c) {
  switch (c) {
    case LF:
    case NL:
      return BK;

    case SP:
      return WJ;

    default:
      return c;
  }
};

class Break {
  constructor(position, required = false) {
    this.position = position;
    this.required = required;
  }
}

export class LineBreaker {
  constructor(string) {
    this.string = string;
    this.pos = 0;
    this.lastPos = 0;
    this.curClass = null;
    this.nextClass = null;
    this.LB8a = false;
    this.LB30a = 0;
    this.context = null;
    this.previousContext = null;
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

  nextCharClass() {
    const codePoint = this.nextCodePoint();
    const value = classTrie.get(codePoint);
    const type = mapClass(value & CLASS_MASK);
    this.leftContext = this.context;
    this.beforeLeftContext = this.previousContext;

    // LB9: attached combining marks inherit their base's properties and context
    if ((type === CM || type === ZWJ) && this.context && !combiningExceptions.has(this.context.type)) {
      return type;
    }

    this.previousContext = this.context;
    this.context = {
      type: type === CM || type === ZWJ ? AL : type,
      codePoint,
      eastAsian: type !== CM && type !== ZWJ && (value & EAST_ASIAN) !== 0,
      initialPunctuation: (value & INITIAL_PUNCTUATION) !== 0,
      finalQuote: (value & FINAL_PUNCTUATION) !== 0,
      numeric: type === NU || ((type === SY || type === IS) && !!this.context?.numeric),
      numericClose: (type === CL || type === CP) && !!this.context?.numeric,
      initialQuote: type === SP ? !!this.context?.initialQuote :
        (value & INITIAL_PUNCTUATION) !== 0 && (!this.context || quoteStartClasses.has(this.context.type))
    };
    return type;
  }

  followingContext(offset = 1) {
    // Look ahead past marks attached to the right-hand character (LB9)
    let pos = this.pos;
    while (pos < this.string.length) {
      const codePoint = this.string.codePointAt(pos);
      pos += codePoint > 0xffff ? 2 : 1;
      const value = classTrie.get(codePoint);
      const type = mapClass(value & CLASS_MASK);
      if (type !== CM && type !== ZWJ && --offset === 0) {
        return { type, eastAsian: (value & EAST_ASIAN) !== 0 };
      }
    }
    return null;
  }

  followingClass() {
    return this.followingContext()?.type ?? null;
  }

  getContextualBreak(shouldBreak, lastClass) {
    const left = this.leftContext;
    const right = this.context;
    const before = this.beforeLeftContext;

    // LB7
    if (right.type === ZW) {
      return false; // LB7
    }

    // LB8
    if (this.curClass === ZW) {
      return true;
    }

    // LB9
    if ((this.nextClass === CM || this.nextClass === ZWJ) && !combiningExceptions.has(left.type)) {
      return false;
    }

    if (this.LB8a || left.type === WJ || right.type === WJ || left.type === GL) {
      return false;
    }

    if (right.type === GL && lastClass !== SP && left.type !== BA && left.type !== HY) {
      return false;
    }

    // LB13
    if ([CL, CP, EX, SY].includes(right.type)) {
      return false;
    }

    // LB14
    if (this.curClass === OP) {
      return false;
    }

    // LB15a: initial quotation punctuation, including any following spaces
    if (left.initialQuote) {
      return false;
    }

    // LB15b: final quotation punctuation before closing punctuation or end of text
    if (right.finalQuote) {
      const following = this.followingClass();
      if (following === null || quoteEndClasses.has(following)) {
        return false;
      }
    }

    // LB15c/LB15d: a space may precede a decimal separator followed by a digit.
    if (right.type === IS) {
      return lastClass === SP && this.followingClass() === NU;
    }

    if (lastClass === SP) {
      return shouldBreak; // LB16/LB17/LB18 are in the table
    }

    // LB19/LB19a: directional quotes can break when surrounded by East Asian text.
    if (right.type === QU && (!right.initialPunctuation || !left.eastAsian || !this.followingContext()?.eastAsian)) {
      return false;
    }

    if (left.type === QU && (!left.finalQuote || !right.eastAsian || !before?.eastAsian)) {
      return false;
    }

    // LB20
    if (left.type === CB || right.type === CB) {
      return true;
    }

    // LB20a/LB21a: word-initial and Hebrew hyphens
    if ((left.type === HY || left.codePoint === 0x2010) && right.type === AL &&
        (!before || hyphenStartClasses.has(before.type))) {
      return false;
    }

    if (before?.type === HL && (left.type === HY || (left.type === BA && !left.eastAsian)) && right.type !== HL) {
      return false;
    }

    // LB25: retain numeric context across separators and an optional closing bracket.
    if ((right.type === PO || right.type === PR) && (left.numeric || left.numericClose)) {
      return false;
    }

    if ((left.type === PO || left.type === PR) && right.type === OP) {
      const following = this.followingClass();
      if (following === NU || (following === IS && this.followingContext(2)?.type === NU)) return false;
    }

    if (right.type === NU && (left.type === PO || left.type === PR || left.type === HY || left.type === IS || left.numeric)) {
      return false;
    }

    // LB18 precedes LB28a: a space always ends an orthographic syllable
    if (lastClass !== SP) {
      // LB28a: preserve Brahmic orthographic syllables, including dotted circles
      if ((left.type === AP && isAksara(right)) ||
          (isAksara(left) && (right.type === VF || right.type === VI)) ||
          (isAksara(this.beforeLeftContext) && left.type === VI && (right.type === AK || right.codePoint === 0x25cc)) ||
          (isAksara(left) && isAksara(right) && this.followingClass() === VF)) {
        shouldBreak = false;
      }
    }

    // LB30: only non-East-Asian brackets join adjacent letters and numbers
    if ((right.type === OP && !right.eastAsian && [AL, HL, NU].includes(left.type)) ||
        (left.type === CP && !left.eastAsian && [AL, HL, NU].includes(right.type))) {
      return false;
    }

    return shouldBreak;
  }

  getSimpleBreak() {
    // handle classes not handled by the pair table
    switch (this.nextClass) {
      case SP:
        return false;

      case BK:
      case LF:
      case NL:
        this.curClass = BK;
        return false;

      case CR:
        this.curClass = CR;
        return false;
    }

    return null;
  }

  getPairTableBreak(lastClass) {
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
        if (!shouldBreak) {
          shouldBreak = false;
          return shouldBreak;
        }
        break;

      case CP_BRK: // prohibited for combining marks
        if (lastClass !== SP) {
          return shouldBreak;
        }
        break;

      case PR_BRK:
        break;
    }

    if (this.LB8a) {
      shouldBreak = false;
    }

    shouldBreak = this.getContextualBreak(shouldBreak, lastClass);

    // Rule LB30a
    if (this.curClass === RI) {
      this.LB30a++;
      if (this.LB30a == 2 && (this.nextClass === RI)) {
        shouldBreak = true;
        this.LB30a = 0;
      }
    } else {
      this.LB30a = 0;
    }

    this.curClass = this.nextClass;

    return shouldBreak;
  }

  nextBreak() {
    // get the first char if we're at the beginning of the string
    if (this.curClass == null) {
      let firstClass = this.nextCharClass();
      this.curClass = mapFirst(firstClass);
      this.nextClass = firstClass;
      this.LB8a = (firstClass === ZWJ);
      this.LB30a = 0;
    }

    while (this.pos < this.string.length) {
      this.lastPos = this.pos;
      const lastClass = this.nextClass;
      this.nextClass = this.nextCharClass();

      // explicit newline
      if ((this.curClass === BK) || ((this.curClass === CR) && (this.nextClass !== LF))) {
        this.curClass = mapFirst(mapClass(this.nextClass));
        return new Break(this.lastPos, true);
      }

      let shouldBreak = this.getSimpleBreak();

      if (shouldBreak === null) {
        shouldBreak = this.getPairTableBreak(lastClass);
      }

      // Rule LB8a
      this.LB8a = (this.nextClass === ZWJ);

      if (shouldBreak) {
        return new Break(this.lastPos);
      }
    }

    if (this.lastPos < this.string.length) {
      this.lastPos = this.string.length;
      const required = (this.curClass === BK) || ((this.curClass === CR) && (this.nextClass !== LF));
      return new Break(this.string.length, required)
    }

    return null;
  }
}


