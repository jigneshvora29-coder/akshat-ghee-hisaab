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
            if (file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.ts')) {
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
        
        // Solid BG
        content = content.replace(/bg-green-900/g, 'bg-zinc-950');
        content = content.replace(/bg-green-800/g, 'bg-zinc-800');
        content = content.replace(/bg-green-700/g, 'bg-zinc-900');
        content = content.replace(/bg-green-600/g, 'bg-zinc-800');
        content = content.replace(/bg-green-500/g, 'bg-zinc-700');
        content = content.replace(/bg-green-100/g, 'bg-zinc-100');
        content = content.replace(/bg-green-50/g, 'bg-zinc-50');
        
        // Text
        content = content.replace(/text-green-800/g, 'text-zinc-800');
        content = content.replace(/text-green-700/g, 'text-zinc-900');
        content = content.replace(/text-green-600/g, 'text-zinc-700');
        content = content.replace(/text-green-500/g, 'text-zinc-600');
        content = content.replace(/text-green-400/g, 'text-zinc-500');
        
        // Borders & Rings
        content = content.replace(/border-green-700/g, 'border-zinc-800');
        content = content.replace(/border-green-600/g, 'border-zinc-700');
        content = content.replace(/border-green-500/g, 'border-zinc-300');
        content = content.replace(/border-green-200/g, 'border-zinc-200');
        content = content.replace(/ring-green-500/g, 'ring-zinc-900');
        
        // Gradients
        content = content.replace(/from-green-600 to-green-800/g, 'from-zinc-800 to-zinc-950');
        content = content.replace(/from-green-50/g, 'from-zinc-50');
        content = content.replace(/to-green-100\/50/g, 'to-zinc-100/50');

        // Hovers
        content = content.replace(/hover:bg-green-900/g, 'hover:bg-zinc-800');
        content = content.replace(/hover:bg-green-800/g, 'hover:bg-zinc-800');
        content = content.replace(/hover:bg-green-50/g, 'hover:bg-zinc-100');
        content = content.replace(/hover:text-green-700/g, 'hover:text-zinc-700');
        content = content.replace(/hover:border-green-500/g, 'hover:border-zinc-400');
        
        // Dark Mode
        content = content.replace(/dark:bg-green-950\/30/g, 'dark:bg-zinc-800/30');
        content = content.replace(/dark:bg-green-900/g, 'dark:bg-zinc-900');
        content = content.replace(/dark:text-green-500/g, 'dark:text-zinc-300');
        content = content.replace(/dark:text-green-400/g, 'dark:text-zinc-400');
        content = content.replace(/dark:border-green-400/g, 'dark:border-zinc-600');

        fs.writeFileSync(file, content, 'utf8');
    });
  }
});
console.log("Theme updated!");
