const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'src', 'app');
const pagesDir = path.join(__dirname, 'src', 'pages');

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir);
}

// Home page
if (fs.existsSync(path.join(appDir, 'page.tsx'))) {
  fs.renameSync(path.join(appDir, 'page.tsx'), path.join(pagesDir, 'HomePage.tsx'));
}

// Other pages
const dirs = fs.readdirSync(appDir);
dirs.forEach(d => {
  const pDir = path.join(appDir, d);
  if (fs.statSync(pDir).isDirectory()) {
    if (fs.existsSync(path.join(pDir, 'page.tsx'))) {
      const pageName = d.charAt(0).toUpperCase() + d.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase()) + 'Page.tsx';
      fs.renameSync(path.join(pDir, 'page.tsx'), path.join(pagesDir, pageName));
    }
  }
});
