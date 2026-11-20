import fs from 'fs';
import { UNICODE_VERSION } from '../src/unicode-version.js';

const response = await fetch(`https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/LineBreakTest.txt`);
if (!response.ok) {
  throw new Error(`Failed to download LineBreakTest.txt: ${response.status} ${response.statusText}`);
}
const data = await response.text();
if (!data.startsWith(`# LineBreakTest-${UNICODE_VERSION}.txt`)) {
  throw new Error('Unexpected Unicode test file version');
}
await fs.writeFileSync(new URL('LineBreakTest.txt', import.meta.url), data);
console.log('Test file updated.');
