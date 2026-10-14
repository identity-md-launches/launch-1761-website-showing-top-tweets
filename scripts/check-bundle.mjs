import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';

const cap = 8388608;
const root = process.cwd();
const files = [];
const generated = new Set(['node_modules', '.npm', '.cache', '.vite', '.vite-temp', '__pycache__', 'coverage', '.playwright-mcp']);
const machineInputs = new Set(['.git', '.github', '.imd', '.agents', '.aws', '.codex']);
const ignored = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const name = relative(root, path).split('\\').join('/');
    if (dir === root && machineInputs.has(entry.name)) continue;
    if (name === 'test/scratch' || generated.has(entry.name) || entry.name.endsWith('.tsbuildinfo')) { ignored.push(name); continue; }
    assert.ok(!entry.name.startsWith('.env'), `Environment file must not be delivered: ${name}`);
    assert.ok(!entry.isSymbolicLink(), `No symlinks or submodules: ${name}`);
    assert.notEqual(entry.name, '.git', `Nested Git metadata: ${name}`);
    assert.notEqual(entry.name, '.gitmodules', `Submodule config: ${name}`);
    if (entry.isDirectory()) await walk(path);
    else {
      assert.ok(!/\.(tgz|tar|zip|gz|log)$/i.test(name), `Unnecessary archive/log: ${name}`);
      files.push({ path: name, bytes: (await stat(path)).size });
    }
  }
}
await walk(root);
const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
const distBytes = files.filter(file => file.path.startsWith('dist/')).reduce((sum, file) => sum + file.bytes, 0);
assert.ok(bytes < cap, `${bytes} bytes exceeds ${cap}`);
assert.ok((await stat('.gitignore')).size <= 512, '.gitignore path budget exceeded');
const html = await readFile('dist/index.html', 'utf8');
for (const attr of html.matchAll(/(?:src|href|content)="([^\"]+)"/g)) {
  if (/\.(js|css|svg|jpg|webp|woff2)(?:$|\?)/.test(attr[1])) {
    assert.ok(attr[1].startsWith('./'), `Export asset must be relative: ${attr[1]}`);
    assert.ok((await stat(join('dist', attr[1]))).isFile(), `Missing asset: ${attr[1]}`);
  }
}
for (const file of files.filter(file => file.path.startsWith('dist/') && file.path.endsWith('.css'))) {
  const css = await readFile(file.path, 'utf8');
  assert.ok(!/url\(["']?(?:\/|https?:)/.test(css), 'CSS contains an absolute asset URL');
}
assert.ok(files.some(file => file.path === 'package-lock.json'));
assert.ok(files.some(file => file.path === 'DESIGN.md'));
assert.ok(files.some(file => file.path === 'README.md'));
const groups = Object.fromEntries(['src/', 'public/', 'dist/', 'artifacts/', 'scripts/'].map(prefix => [prefix, files.filter(f => f.path.startsWith(prefix)).reduce((total, f) => total + f.bytes, 0)]));
console.log(JSON.stringify({ passed: true, cap, bytes, headroom: cap - bytes, distBytes, files: files.length, groups, ignored }, null, 2));
