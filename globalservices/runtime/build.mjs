import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const web = resolve(process.argv[2] ?? join(root, 'dist'));
const output = resolve(process.argv[3] ?? join(root, 'dist', 'server', 'index.js'));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.sort((a, b) => a.name.localeCompare(b.name)).map(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name === 'assets') return files(path);
    return !entry.isFile() || !types[extname(entry.name)] ? [] : [path];
  }))).flat();
}

const pages = {};
for (const path of await files(web)) {
  const type = types[extname(path)];
  const plain = /^(text\/|application\/json)/.test(type);
  const data = await readFile(path, plain ? 'utf8' : 'base64');
  const name = '/' + relative(web, path).split(sep).join('/');
  pages[name] = { type, plain, data };
}
if (!pages['/index.html'] || !pages['/news-fallback.json']) throw new Error('Missing site entry or fallback');

const moduleSource = await readFile(join(here, 'news.mjs'), 'utf8');
const worker = await readFile(join(here, 'worker.mjs'), 'utf8');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, [
  moduleSource,
  'const pages = ' + JSON.stringify(pages) + ';',
  worker,
].join('\n'));
console.log('Built ' + basename(output) + ' with ' + Object.keys(pages).length + ' static assets');
