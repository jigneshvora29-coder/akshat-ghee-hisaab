const fs = require('fs');

const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.ts')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const apiDir = path.join(__dirname, 'app', 'api');
const files = getFiles(apiDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('import { auth } from "@/lib/auth";')) {
    content = content.replace('import { auth } from "@/lib/auth";', 'import { getSession } from "@/lib/auth";');
    
    // Remove the local getSession function
    const getSessionRegex = /async function getSession\(.*?\)\s*\{\s*return auth\.api\.getSession\(\{ headers: req\.headers \}\);\s*\}/g;
    content = content.replace(getSessionRegex, '');
    
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
  }
}
