import fs from 'fs';
import https from'https';
import { UNICODE_VERSION } from '../src/unicode-version.js';

const file = fs.createWriteStream('LineBreakTest.txt');
https.get(`https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/LineBreakTest.txt`, function(response) {
   response.pipe(file);
   file.on("finish", () => {
       file.close();
       console.log("Test file updated.");
   });
});
