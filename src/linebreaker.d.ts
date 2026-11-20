/** A line break opportunity in the input string. */
export interface Break {
  /** The position after the break, measured in UTF-16 code units. */
  position: number;
  /** Whether this is a mandatory line break. */
  required: boolean;
}

/** A line break opportunity yielded by the iterator. */
export interface BreakInfo extends Break {
  /** The text between the previous break and this one. */
  substring: string;
}

export class LineBreaker implements Iterable<BreakInfo> {
  constructor(string: string);

  /** Return the next break, or null when the input is exhausted. */
  nextBreak(): Break | null;

  /** Iterate over the remaining breaks and their substrings. */
  [Symbol.iterator](): Generator<BreakInfo, void, unknown>;
}

/** The supported Unicode version. */
export const UNICODE_VERSION: string;
