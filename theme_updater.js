import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./client/src', function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace emerald with yellow
    content = content.replace(/emerald/g, 'yellow');
    
    // Replace to-teal-500 with to-amber-500
    content = content.replace(/to-teal-500/g, 'to-amber-500');
    
    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  }
});
