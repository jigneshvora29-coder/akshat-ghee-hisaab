const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dirs = [
  'E:\\Akshat Ghee\\akshat-ghee-hisaab\\app',
  'E:\\Akshat Ghee\\akshat-ghee-hisaab\\components'
];

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = walk(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        
        // Remove dark mode classes
        const newContent = content.replace(/dark:[a-zA-Z0-9\-\/]+\s?/g, '');
        
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
        }
    });
  }
});
console.log("Dark mode stripped!");
