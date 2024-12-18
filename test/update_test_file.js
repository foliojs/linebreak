import fs from 'fs';
import https from'https';

const file = fs.createWriteStream('LineBreakTest.txt');
https.get("https://www.unicode.org/Public/15.0.0/ucd/auxiliary/LineBreakTest.txt", function(response) {
   response.pipe(file);
   file.on("finish", () => {
       file.close();
       console.log("Test file updated.");
   });
});
