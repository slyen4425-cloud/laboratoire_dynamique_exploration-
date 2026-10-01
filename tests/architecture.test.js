import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url);

async function sourceFiles(dirUrl = root) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) files.push(...await sourceFiles(child));
    else if (entry.name.endsWith('.js')) files.push(child);
  }
  return files;
}

async function readSources() {
  const files = await sourceFiles();
  return Promise.all(files.map(async (url) => ({
    path: relative(new URL('../', root).pathname, url.pathname),
    content: await readFile(url, 'utf8')
  })));
}

test('architecture sentinel: no forbidden global repair mechanisms in src', async () => {
  const sources = await readSources();
  const forbidden = [
    ['MutationObserver', /\bMutationObserver\s*\(/],
    ['setInterval', /\bsetInterval\s*\(/],
    ['stopImmediatePropagation', /\.stopImmediatePropagation\s*\(/],
    ['location.reload', /\blocation\.reload\s*\(/]
  ];

  const violations = [];
  for (const file of sources) {
    for (const [label, pattern] of forbidden) {
      if (pattern.test(file.content)) violations.push(`${file.path}: ${label}`);
    }
  }

  assert.deepEqual(violations, []);
});

test('architecture sentinel: core remains DOM independent', async () => {
  const coreUrl = new URL('../src/core/', import.meta.url);
  const entries = await readdir(coreUrl, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const content = await readFile(new URL(entry.name, coreUrl), 'utf8');
    if (/\bdocument\b|\bwindow\b|\bHTMLElement\b/.test(content)) {
      violations.push(entry.name);
    }
  }

  assert.deepEqual(violations, []);
});
