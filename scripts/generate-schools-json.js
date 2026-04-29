#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'uniformhub-schools.csv');
const outPath = path.join(__dirname, '..', 'public', 'schools.json');

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n').filter(l => l.trim());

function parseFirstColumn(line) {
  if (line[0] === '"') {
    const end = line.indexOf('"', 1);
    return line.slice(1, end);
  }
  return line.split(',')[0];
}

lines.shift();
const names = lines.map(parseFirstColumn).filter(n => n && n.length > 0);
const unique = Array.from(new Set(names)).sort();

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(unique));
console.log(`✓ Wrote ${unique.length} unique school names to public/schools.json`);
console.log(`  File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
console.log(`  Sample: ${unique.slice(0, 5).join(' | ')}`);
