import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { initialDb } from '../lib/mock-data';

const outDir = join(process.cwd(), '.data');
const outFile = join(outDir, 'db.json');
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(initialDb, null, 2), 'utf8');
console.log(`Seed written to ${outFile}`);
