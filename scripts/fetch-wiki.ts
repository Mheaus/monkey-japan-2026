/**
 * Pre-fetch Wikipedia thumbnails + summaries for every article referenced in
 * trip.ts, save the images to `public/img/wiki/` and generate
 * `src/data/wiki-prefetch.json` so the planning page can render offline.
 *
 * Run once before each build:  `pnpm fetch-wiki` (also wired as `prebuild`).
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ITINERARY } from '../src/data/trip';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const IMG_DIR = join(ROOT, 'public/img/wiki');
const MANIFEST_PATH = join(ROOT, 'src/data/wiki-prefetch.json');
const PUBLIC_BASE = '/img/wiki';

type WikiEntry = {
  title: string;
  description: string;
  image: string | null;
};

type Manifest = Record<string, WikiEntry>;

function articleSlug(article: string): string {
  return article
    .toLowerCase()
    .replace(/[āàá]/g, 'a')
    .replace(/[ēèé]/g, 'e')
    .replace(/[īìí]/g, 'i')
    .replace(/[ōòó]/g, 'o')
    .replace(/[ūùú]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

type WikiSummary = {
  title?: string;
  description?: string;
  extract?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
};

async function fetchSummary(article: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`;
  const res = await fetchWithRetry(url);
  if (!res || !res.ok) {
    console.warn(`[skip] ${article}: ${res ? `HTTP ${res.status}` : 'no response'}`);
    return null;
  }
  return (await res.json()) as WikiSummary;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, attempts = 6): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'monkey-japan-2026 (https://monkey-japan.fr)' },
      });
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        const wait = 1000 * 2 ** i;
        await sleep(wait);
        continue;
      }
      return res; // 404 etc. — don't retry
    } catch {
      await sleep(1000 * 2 ** i);
    }
  }
  return null;
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  if (await fileExists(dest)) return true;
  const res = await fetchWithRetry(url);
  if (!res || !res.ok) {
    console.warn(`[img skip] ${url}: ${res ? `HTTP ${res.status}` : 'no response'}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return true;
}

function collectArticles(): string[] {
  const set = new Set<string>();
  for (const day of ITINERARY) {
    for (const a of day.wikiArticles ?? []) set.add(a);
    for (const a of day.optionArticles ?? []) set.add(a);
  }
  return [...set].sort();
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  const articles = collectArticles();
  console.log(`Found ${articles.length} unique Wikipedia articles`);

  const manifest: Manifest = {};
  let downloaded = 0;
  let cached = 0;
  let missing = 0;

  for (const article of articles) {
    await sleep(150); // gentle throttling to stay under Wikipedia's rate limit
    const summary = await fetchSummary(article);
    if (!summary) {
      manifest[article] = { title: article, description: '', image: null };
      missing++;
      continue;
    }

    const imgUrl = summary.thumbnail?.source ?? null;
    let imagePublic: string | null = null;

    if (imgUrl) {
      const ext = extname(new URL(imgUrl).pathname).toLowerCase() || '.jpg';
      const slug = articleSlug(article) + ext;
      const dest = join(IMG_DIR, slug);
      const wasCached = await fileExists(dest);
      const ok = await downloadImage(imgUrl, dest);
      if (ok) {
        imagePublic = `${PUBLIC_BASE}/${slug}`;
        if (wasCached) cached++;
        else downloaded++;
      }
    }

    manifest[article] = {
      title: summary.title ?? article,
      description: summary.description ?? summary.extract?.split('.')[0] ?? '',
      image: imagePublic,
    };
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Manifest written: ${MANIFEST_PATH}`);
  console.log(`Images: ${downloaded} downloaded, ${cached} cached, ${missing} without summary`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
