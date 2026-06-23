const fs = require('fs');
const path = require('path');

let count = 0;

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const f = path.join(dir, file);
    if (fs.statSync(f).isDirectory()) {
      if (!file.match(/node_modules|\.next|\.git/)) {
        walk(f);
      }
    } else if (file.match(/\.(ts|tsx|css|sql)$/)) {
      count += fs.readFileSync(f, 'utf8').split('\n').length;
    }
  }
}

walk('.');
console.log(count);
