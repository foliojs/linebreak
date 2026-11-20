import { UnicodeTrie } from 'unicode-trie';
import {
  BK, CR, LF, NL, SG, WJ, SP, ZW, ZWJ, BA, HY, NS, AI, AL, CJ, HL, RI, SA,
  OP, QU, GL, CL, CP, EX, IS, SY, CM, AK, AP, AS, VF, VI, XX, NU, PR, PO, CB,
  BB, B2, IN, ID, EB, EM, JL, JV, JT, H2, H3, HH
} from './classes.js';
import { CLASS_MASK, INITIAL_PUNCTUATION, FINAL_PUNCTUATION, EAST_ASIAN, UNASSIGNED_EXTENDED_PICTOGRAPHIC } from './trie-properties.js';
import data from './classes-trie-data.js';

export { UNICODE_VERSION } from './unicode-version.js';

const classTrie = new UnicodeTrie(data);
const quoteStartClasses = new Set([BK, CR, LF, NL, OP, QU, GL, SP, ZW]);
const quoteEndClasses = new Set([SP, GL, WJ, CL, QU, CP, EX, IS, SY, BK, CR, LF, NL, ZW]);
const combiningExceptions = new Set([BK, CR, LF, NL, SP, ZW]);
const hyphenStartClasses = new Set([BK, CR, LF, NL, SP, ZW, CB, GL]);
const alphabeticClasses = new Set([AL, HL]);
const hangulClasses = new Set([JL, JV, JT, H2, H3]);
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

    case CM:
    case ZWJ:
      return AL;

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
    this.context = null;
    this.previousContext = null;
  }

  _nextCodePoint() {
    const code = this.string.charCodeAt(this.pos++);
    const next = this.string.charCodeAt(this.pos);

    // If a surrogate pair
    if ((0xd800 <= code && code <= 0xdbff) && (0xdc00 <= next && next <= 0xdfff)) {
      this.pos++;
      return ((code - 0xd800) * 0x400) + (next - 0xdc00) + 0x10000;
    }

    return code;
  }

  _nextCharClass() {
    const codePoint = this._nextCodePoint();
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
      unassignedExtendedPictographic: (value & UNASSIGNED_EXTENDED_PICTOGRAPHIC) !== 0,
      numeric: type === NU || ((type === SY || type === IS) && !!this.context?.numeric),
      numericClose: (type === CL || type === CP) && !!this.context?.numeric,
      regionalIndicators: type === RI ? (this.context?.regionalIndicators ?? 0) + 1 : 0,
      initialQuote: type === SP ? !!this.context?.initialQuote :
        (value & INITIAL_PUNCTUATION) !== 0 && (!this.context || quoteStartClasses.has(this.context.type))
    };
    return type;
  }

  _followingContext(offset = 1) {
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

  _followingClass() {
    return this._followingContext()?.type ?? null;
  }

  // UAX #14: apply LB7-LB31 in precedence order.
  // LB4-LB6 and breaks before SP are handled by nextBreak/_getSimpleBreak.
  _getRuleBreak(lastClass) {
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

    // LB8a
    if (this.LB8a) {
      return false;
    }

    // LB9; _nextCharClass resolves remaining CM/ZWJ to AL for LB10.
    if ((this.nextClass === CM || this.nextClass === ZWJ) && !combiningExceptions.has(left.type)) {
      return false;
    }

    // LB11/LB12
    if (left.type === WJ || right.type === WJ || left.type === GL) {
      return false;
    }

    // LB12a
    if (right.type === GL && lastClass !== SP && left.type !== BA && left.type !== HY && left.type !== HH) {
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
      const following = this._followingClass();
      if (following === null || quoteEndClasses.has(following)) {
        return false;
      }
    }

    // LB15c/LB15d: a space may precede a decimal separator followed by a digit
    if (right.type === IS) {
      return lastClass === SP && this._followingClass() === NU;
    }

    // LB16/LB17: curClass retains the class before a run of spaces
    if ((right.type === NS && (this.curClass === CL || this.curClass === CP)) ||
        (this.curClass === B2 && right.type === B2)) {
      return false;
    }

    // LB18
    if (lastClass === SP) {
      return true;
    }

    // LB19/LB19a: directional quotes can break when surrounded by East Asian text
    if (right.type === QU && (!right.initialPunctuation || !left.eastAsian || !this._followingContext()?.eastAsian)) {
      return false;
    }

    if (left.type === QU && (!left.finalQuote || !right.eastAsian || !before?.eastAsian)) {
      return false;
    }

    // LB20
    if (left.type === CB || right.type === CB) {
      return true;
    }

    // LB20a: word-initial hyphens
    if ((left.type === HY || left.type === HH) && alphabeticClasses.has(right.type) &&
        (!before || hyphenStartClasses.has(before.type))) {
      return false;
    }

    // LB21
    if (right.type === BA || right.type === HY || right.type === HH || right.type === NS || left.type === BB) {
      return false;
    }

    // LB21a/LB21b
    if ((before?.type === HL && (left.type === HY || left.type === HH) && right.type !== HL) ||
        (left.type === SY && right.type === HL)) {
      return false;
    }

    // LB22
    if (right.type === IN) {
      return false;
    }

    // LB23
    if ((alphabeticClasses.has(left.type) && right.type === NU) ||
        (left.type === NU && alphabeticClasses.has(right.type))) {
      return false;
    }

    // LB23a
    if ((left.type === PR && [ID, EB, EM].includes(right.type)) ||
        ([ID, EB, EM].includes(left.type) && right.type === PO)) {
      return false;
    }

    // LB24
    if (([PR, PO].includes(left.type) && alphabeticClasses.has(right.type)) ||
        (alphabeticClasses.has(left.type) && [PR, PO].includes(right.type))) {
      return false;
    }

    // LB25: retain numeric context across separators and an optional closing bracket
    if ((right.type === PO || right.type === PR) && (left.numeric || left.numericClose)) {
      return false;
    }

    if ((left.type === PO || left.type === PR) && right.type === OP) {
      const following = this._followingClass();
      if (following === NU || (following === IS && this._followingContext(2)?.type === NU)) return false;
    }

    if (right.type === NU && (left.type === PO || left.type === PR || left.type === HY || left.type === IS || left.numeric)) {
      return false;
    }

    // LB26
    if ((left.type === JL && [JL, JV, H2, H3].includes(right.type)) ||
        ([JV, H2].includes(left.type) && [JV, JT].includes(right.type)) ||
        ([JT, H3].includes(left.type) && right.type === JT)) {
      return false;
    }

    // LB27
    if ((hangulClasses.has(left.type) && right.type === PO) ||
        (left.type === PR && hangulClasses.has(right.type))) {
      return false;
    }

    // LB28
    if (alphabeticClasses.has(left.type) && alphabeticClasses.has(right.type)) {
      return false;
    }

    // LB28a: preserve Brahmic orthographic syllables, including dotted circles.
    if ((left.type === AP && isAksara(right)) ||
        (isAksara(left) && (right.type === VF || right.type === VI)) ||
        (isAksara(before) && left.type === VI && (right.type === AK || right.codePoint === 0x25cc)) ||
        (isAksara(left) && isAksara(right) && this._followingClass() === VF)) {
      return false;
    }

    // LB29
    if (left.type === IS && alphabeticClasses.has(right.type)) {
      return false;
    }

    // LB30: only non-East-Asian brackets join adjacent letters and numbers
    if ((right.type === OP && !right.eastAsian && [AL, HL, NU].includes(left.type)) ||
        (left.type === CP && !left.eastAsian && [AL, HL, NU].includes(right.type))) {
      return false;
    }

    // LB30a: attached combining marks do not advance the RI count.
    if (left.type === RI && right.type === RI && left.regionalIndicators % 2 === 1) {
      return false;
    }

    // LB30b
    if ((left.type === EB || left.unassignedExtendedPictographic) && right.type === EM) {
      return false;
    }

    return true; // LB31
  }

  _getSimpleBreak() {
    // LB6/LB7: no break before hard line breaks or spaces
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

  nextBreak() {
    // get the first char if we're at the beginning of the string
    if (this.curClass == null) {
      let firstClass = this._nextCharClass();
      this.curClass = mapFirst(firstClass);
      this.nextClass = firstClass;
      this.LB8a = (firstClass === ZWJ);
    }

    while (this.pos < this.string.length) {
      this.lastPos = this.pos;
      const lastClass = this.nextClass;
      this.nextClass = this._nextCharClass();

      // explicit newline
      if ((this.curClass === BK) || ((this.curClass === CR) && (this.nextClass !== LF))) {
        this.curClass = mapFirst(mapClass(this.nextClass));
        this.LB8a = (this.nextClass === ZWJ);
        return new Break(this.lastPos, true);
      }

      let shouldBreak = this._getSimpleBreak();

      if (shouldBreak === null) {
        shouldBreak = this._getRuleBreak(lastClass);
        // LB9 keeps the base class; LB10 has already resolved unattached marks.
        this.curClass = this.context.type;
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


