/**
 * Diagnostic Script - Run this to check for common issues
 * Run: node diagnose.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Diagnosing Educate Elevate Bot Setup...\n');

let issues = [];
let warnings = [];

// Check 1: .env file exists
console.log('1. Checking .env file...');
if (existsSync(join(__dirname, '.env'))) {
  console.log('   ✅ .env file exists');
  
  // Check .env content
  try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
    if (envContent.includes('VITE_SUPABASE_URL')) {
      console.log('   ✅ VITE_SUPABASE_URL found');
    } else {
      issues.push('Missing VITE_SUPABASE_URL in .env');
      console.log('   ❌ VITE_SUPABASE_URL not found');
    }
    
    if (envContent.includes('VITE_SUPABASE_ANON_KEY')) {
      console.log('   ✅ VITE_SUPABASE_ANON_KEY found');
    } else {
      issues.push('Missing VITE_SUPABASE_ANON_KEY in .env');
      console.log('   ❌ VITE_SUPABASE_ANON_KEY not found');
    }
  } catch (error) {
    issues.push('Cannot read .env file');
    console.log('   ❌ Cannot read .env file:', error.message);
  }
} else {
  issues.push('.env file does not exist');
  console.log('   ❌ .env file not found');
}

// Check 2: package.json exists
console.log('\n2. Checking package.json...');
if (existsSync(join(__dirname, 'package.json'))) {
  console.log('   ✅ package.json exists');
} else {
  issues.push('package.json not found');
  console.log('   ❌ package.json not found');
}

// Check 3: node_modules exists
console.log('\n3. Checking node_modules...');
if (existsSync(join(__dirname, 'node_modules'))) {
  console.log('   ✅ node_modules directory exists');
} else {
  warnings.push('node_modules not found - run npm install');
  console.log('   ⚠️  node_modules not found');
}

// Check 4: src directory structure
console.log('\n4. Checking source files...');
const requiredFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/pages/Index.tsx',
  'src/lib/supabase.ts',
];

requiredFiles.forEach(file => {
  if (existsSync(join(__dirname, file))) {
    console.log(`   ✅ ${file} exists`);
  } else {
    issues.push(`Missing file: ${file}`);
    console.log(`   ❌ ${file} not found`);
  }
});

// Check 5: index.html
console.log('\n5. Checking index.html...');
if (existsSync(join(__dirname, 'index.html'))) {
  const htmlContent = readFileSync(join(__dirname, 'index.html'), 'utf8');
  if (htmlContent.includes('<div id="root">')) {
    console.log('   ✅ root div found');
  } else {
    issues.push('root div not found in index.html');
    console.log('   ❌ root div not found');
  }
  
  if (htmlContent.includes('main.tsx')) {
    console.log('   ✅ main.tsx script tag found');
  } else {
    issues.push('main.tsx script tag not found');
    console.log('   ❌ main.tsx script tag not found');
  }
} else {
  issues.push('index.html not found');
  console.log('   ❌ index.html not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 DIAGNOSIS SUMMARY');
console.log('='.repeat(50));

if (issues.length === 0 && warnings.length === 0) {
  console.log('\n✅ No issues found! Your setup looks good.');
  console.log('\n💡 If you still see blank output:');
  console.log('   1. Make sure dev server is running: npm run dev');
  console.log('   2. Check browser console (F12) for errors');
  console.log('   3. Access http://localhost:8080 (not 5173)');
  console.log('   4. Clear browser cache and hard refresh (Ctrl+Shift+R)');
} else {
  if (issues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES FOUND:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  }
  
  console.log('\n🔧 RECOMMENDED FIXES:');
  
  if (issues.some(i => i.includes('.env'))) {
    console.log('\n   1. Create .env file:');
    console.log('      VITE_SUPABASE_URL=https://fflucpqfqfrzvcdnsgcf.supabase.co');
    console.log('      VITE_SUPABASE_ANON_KEY=your-key-here');
  }
  
  if (warnings.some(w => w.includes('node_modules'))) {
    console.log('\n   2. Install dependencies:');
    console.log('      npm install');
  }
  
  console.log('\n   3. Restart dev server:');
  console.log('      npm run dev');
}

console.log('\n' + '='.repeat(50));

