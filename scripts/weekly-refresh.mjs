// 주간 브랜드 데이터 갱신(무인 실행용). 사용: bash scripts/weekly-refresh.sh [--dry-run] [--no-scrape] [--no-push]
//  1) ThaiFranchiseCenter 를 정중하게 다시 수집(robots.txt·1.6초 간격·UA, 24시간보다 오래된 페이지만 → 중간에 끊겨도 같은 명령을 다시 실행하면 이어감)
//  2) 임시 파일로 brands.json 재생성(meta.version 증가) → 건전성 검사 → 실패하면 게시하지 않고 종료코드 1
//  3) 내용이 실제로 바뀌었으면: 사이트 저장소 docs/data/{brands,meta}.json 갱신 → commit → push → 라이브 URL 확인 → 앱 저장소 web/data/brands.json commit
//  종료코드: 0 = 정상(게시했거나 변경 없음) · 1 = 검사 실패(게시 안 함) · 2 = 수집 실패 · 3 = 게시했지만 라이브 확인 실패 · 4 = 사전 조건/기타 오류
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync, unlinkSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { diffData, sanity, makeMeta } from '../scraper/weekly-lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.SITE_REPO || '/workspace/aafranchise-site';
const LIVE = process.env.DATA_LIVE_BASE || 'https://motoraathailand.github.io/aafranchise-site/data';
const CACHE = join(ROOT, 'data/cache'); const CUR = join(ROOT, 'web/data/brands.json'); const NEXT = join(CACHE, 'next-brands.json');
const ID = ['-c', 'user.name=Grok Bot', '-c', 'user.email=motoraathailand@gmail.com'];
const flag = (n) => process.argv.includes('--' + n);
const DRY = flag('dry-run'), NOSCRAPE = flag('no-scrape'), NOPUSH = flag('no-push');
const say = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);
const die = (code, msg) => { console.error('\nWEEKLY REFRESH FAILED: ' + msg + '\nNothing was published.'); process.exit(code); };
const run = (cmd, args, o = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: o.inherit ? 'inherit' : 'pipe', ...o });
const git = (repo, args) => run('git', ['-C', repo, ...args]);
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));

// 동시 실행 방지
const LOCK = join(CACHE, 'weekly.lock'); mkdirSync(CACHE, { recursive: true });
if (existsSync(LOCK)) { const pid = Number(readFileSync(LOCK, 'utf8')); let alive = false; try { process.kill(pid, 0); alive = true; } catch {} if (alive) die(4, `another weekly refresh is running (pid ${pid})`); }
writeFileSync(LOCK, String(process.pid)); process.on('exit', () => { try { unlinkSync(LOCK); } catch {} });

const t0 = Date.now(); say('weekly refresh start', DRY ? '(dry run)' : '');
if (!existsSync(join(SITE, 'docs'))) die(4, `site repo not found at ${SITE} (set SITE_REPO)`);
if (!DRY) {
  if (git(SITE, ['status', '--porcelain', 'docs/data']).stdout.trim()) die(4, 'site repo has uncommitted changes in docs/data');
  const pull = git(SITE, [...ID, 'pull', '--ff-only', '-q']); if (pull.status !== 0) die(4, 'git pull --ff-only failed in site repo: ' + pull.stderr.trim());
}
const prev = readJson(CUR);

// 1) 수집
if (!NOSCRAPE) {
  const f = run('node', ['scraper/fetch.mjs', '--max-age-hours', '24'], { inherit: true });
  if (f.status !== 0) die(2, 'scraper/fetch.mjs failed (exit ' + f.status + '); re-run to resume');
}
// 2) 재생성
const b = run('node', ['scraper/build-brands.mjs', '--out', 'data/cache/next-brands.json', '--prev', 'web/data/brands.json'], { inherit: true });
if (b.status !== 0) die(1, 'build-brands.mjs failed');
const next = readJson(NEXT); const bs = readJson(join(CACHE, 'build-summary.json'));
const ids = existsSync(join(CACHE, 'thai-ids.json')) ? readJson(join(CACHE, 'thai-ids.json')) : []; const idx = readJson(join(CACHE, 'fetch-index.json'));
const stale = ids.filter((id) => !(idx[id] && idx[id].fetchedAt && Date.now() - Date.parse(idx[id].fetchedAt) < 26 * 3600e3)).length;
const errs = sanity(prev, next, { problems: bs.problems, stale: NOSCRAPE ? 0 : stale, total: ids.length });
if (errs.length) die(1, 'sanity checks failed:\n  - ' + errs.join('\n  - '));
const d = diffData(prev, next);
const summary = (published) => {
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== weekly refresh summary ===\nbrands total: ${next.brands.length} (was ${prev.brands.length})\nadded: ${d.added.length}${d.added.length ? ' [' + d.added.slice(0, 8).join(', ') + (d.added.length > 8 ? ', …' : '') + ']' : ''}\nremoved: ${d.removed.length}${d.removed.length ? ' [' + d.removed.slice(0, 8).join(', ') + (d.removed.length > 8 ? ', …' : '') + ']' : ''}\nchanged: ${d.changed.length}\nversion: ${prev.meta.version} -> ${published ? next.meta.version : prev.meta.version + ' (unchanged)'}\nas-of: ${next.meta.asofMin} ~ ${next.meta.asofMax}\npublished: ${published ? 'yes' : 'no'}\nruntime: ${mins} min`);
};
if (!d.any) { say('no content changes'); summary(false); process.exit(0); }
if (DRY) { say('dry run: would publish'); summary(false); process.exit(0); }

// 3) 게시
const text = readFileSync(NEXT, 'utf8'); const meta = makeMeta(next, text);
mkdirSync(join(SITE, 'docs/data'), { recursive: true });
writeFileSync(join(SITE, 'docs/data/brands.json'), text); writeFileSync(join(SITE, 'docs/data/meta.json'), JSON.stringify(meta, null, 1) + '\n');
git(SITE, ['add', 'docs/data']);
const msg = `Brand data v${next.meta.version}: ${next.brands.length} brands (+${d.added.length} -${d.removed.length} ~${d.changed.length}), as of ${next.meta.asofMax}`;
const c = git(SITE, [...ID, 'commit', '-q', '-m', msg]); if (c.status !== 0) die(4, 'site commit failed: ' + (c.stderr || c.stdout));
if (NOPUSH) { say('--no-push: committed in site repo only'); summary(false); process.exit(0); }
const p = git(SITE, ['push', '-q', 'origin', 'HEAD']); if (p.status !== 0) die(4, 'site push failed (local commit kept in ' + SITE + '): ' + p.stderr.trim());
say('pushed:', msg);
// 앱 저장소: 다음 빌드가 최신 데이터를 번들하도록
copyFileSync(NEXT, CUR);
git(ROOT, ['add', 'web/data/brands.json']);
const fc = git(ROOT, [...ID, 'commit', '-q', '-m', `data: bundled brands v${next.meta.version} (${next.brands.length} brands, as of ${next.meta.asofMax}; weekly refresh)`]);
if (fc.status !== 0) console.error('WARN: app repo commit failed: ' + (fc.stderr || fc.stdout));
// 라이브 확인(Pages 배포는 보통 1~2분)
let live = false;
for (let i = 0; i < 30 && !live; i++) {
  try { const r = await fetch(`${LIVE}/meta.json?cb=${Date.now()}`, { cache: 'no-store' }); if (r.ok) { const m = await r.json(); if (m.version === next.meta.version) { const f = await fetch(`${LIVE}/brands.json?cb=${Date.now()}`, { cache: 'no-store' }); const j = f.ok ? await f.json() : null; live = !!(j && j.meta.version === next.meta.version && j.brands.length === next.brands.length && f.headers.get('access-control-allow-origin') === '*'); } } } catch {}
  if (!live) await new Promise((r) => setTimeout(r, 20000));
}
summary(true);
if (!live) { console.error(`\nWARN: pushed, but ${LIVE}/meta.json did not show version ${next.meta.version} within 10 min. Check GitHub Pages deployment.`); process.exit(3); }
console.log(`live: ${LIVE}/brands.json serves v${next.meta.version} (CORS *) — verified`);
