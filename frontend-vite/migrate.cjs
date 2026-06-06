const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('g:/freelance 2 task/frontend-vite/src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let modified = false;
  
  if (content.includes('next/link')) {
    content = content.replace(/import Link from ["']next\/link["'];?/g, 'import { Link } from "react-router-dom";');
    content = content.replace(/<Link([^>]*?)href=/g, '<Link$1to=');
    modified = true;
  }
  
  if (content.includes('next/navigation')) {
    content = content.replace(/import \{ useRouter \} from ["']next\/navigation["'];?/g, 'import { useNavigate } from "react-router-dom";');
    content = content.replace(/const router = useRouter\(\)/g, 'const navigate = useNavigate()');
    content = content.replace(/router\.push\(/g, 'navigate(');
    content = content.replace(/router\.refresh\(\)/g, 'navigate(0)');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(f, content);
    console.log('Updated', f);
  }
});
