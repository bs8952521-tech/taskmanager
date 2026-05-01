const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const map = {
  'bg-[#0a0a0b]': 'bg-background',
  'bg-[#0d0d0f]': 'bg-card',
  'bg-[#161618]': 'bg-input',
  'bg-[#1f1f23]': 'bg-border',
  'border-[#1f1f23]': 'border-border',
  'text-[#ecedee]': 'text-foreground',
  'text-[#a1a1aa]': 'text-muted',
  'text-[#52525b]': 'text-faint',
  'border-[#0d0d0f]': 'border-card',
};

const files = walkSync('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  for (const [key, value] of Object.entries(map)) {
    content = content.split(key).join(value);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
