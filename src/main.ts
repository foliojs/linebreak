// @ts-ignore next line
import _LineBreaker from "./linebreaker.js";

interface Break {
  position: number;
  required: boolean;
}

interface BreakInfo extends Break {
  substring: string;
}

interface LineBreaker {
  new(input: string): LineBreaker;
  nextBreak(): Break | null;
  [Symbol.iterator](): Generator<BreakInfo, undefined, undefined>;
}

export default _LineBreaker as LineBreaker;
