var staticModule = require('static-module');
var quote = require('quote-stream');
var through = require('through2');
var fs = require('fs');

function write (buf, enc, next) {
  this.push(buf);
  next();
}

function end (next) {
  this.push(')');
  this.push(null);
  next();
}

var sm = staticModule({
    fs: {
        readFileSync: function (file) {
          const stream = fs.createReadStream(file, 'base64').pipe(quote()).pipe(through(write, end));
          stream.push('base64.toByteArray(')
          return stream;
        }
    }
}, { vars: { __dirname: __dirname + '/../src' } });

const src = fs.createReadStream('src/linebreaker.js');
const dest = fs.createWriteStream('src/linebreaker-browser.js');

src.push('const base64 = require(\'base64-js\');\n');
src.pipe(sm).pipe(dest);