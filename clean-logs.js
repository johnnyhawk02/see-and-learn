#!/usr/bin/env node

/**
 * This script removes all console.log statements from JavaScript files
 * It's intended to be run as part of the build process
 * 
 * Usage: node clean-logs.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Regex patterns to match different forms of console.log statements
const patterns = [
  // Standard console.log('message')
  /console\.log\s*\([^)]*\)\s*;?/g,
  
  // JSX embedded console.log statements like {console.log('something')}
  /\{[\s]*console\.log\s*\([^}]*\)\s*\}/g,
  
  // console.error and console.warn
  /console\.error\s*\([^)]*\)\s*;?/g,
  /console\.warn\s*\([^)]*\)\s*;?/g,
  
  // chained console logs like .catch(err => console.log("error", err))
  /=>\s*console\.log\s*\([^)]*\)/g,
];

async function processDirectory(directory) {
  const entries = await readdir(directory);
  let modifiedCount = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const entryStat = await stat(fullPath);
    
    if (entryStat.isDirectory()) {
      // Skip node_modules and build directories
      if (entry !== 'node_modules' && entry !== 'build') {
        modifiedCount += await processDirectory(fullPath);
      }
    } else if (
      entryStat.isFile() && 
      (entry.endsWith('.js') || entry.endsWith('.jsx') || entry.endsWith('.tsx'))
    ) {
      const modified = await processFile(fullPath);
      if (modified) modifiedCount++;
    }
  }
  
  return modifiedCount;
}

async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    let originalSize = content.length;
    
    // Apply all regex patterns
    for (const pattern of patterns) {
      const newContent = content.replace(pattern, '');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    if (modified) {
      await writeFile(filePath, content, 'utf8');
      const newSize = content.length;
      const savedBytes = originalSize - newSize;
      console.log(`Cleaned ${filePath} (saved ${savedBytes} bytes)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  console.log('Starting console.log removal process...');
  
  try {
    const srcDir = path.join(process.cwd(), 'src');
    const modifiedCount = await processDirectory(srcDir);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`Done! Processed ${modifiedCount} files in ${duration.toFixed(2)} seconds.`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 