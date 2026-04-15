// Script to clean up console statements for production
// Run this before deployment

const fs = require('fs');
const path = require('path');

const filesToClean = [
  'src/pages/ProjectsPage.jsx',
  'src/store/userStore.js',
  'src/store/appStore.js',
  'src/lib/api.js'
];

filesToClean.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console.log statements but keep console.error for debugging
    content = content.replace(/console\.log\([^)]*\);?\n?/g, '');
    
    // Comment out console.error instead of removing (for debugging)
    content = content.replace(/console\.error\(/g, '// console.error(');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned console statements in ${file}`);
  }
});

console.log('🎉 Console cleanup completed!');