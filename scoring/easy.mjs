// 쉬운 말 점수와 전략 관찰값을 만든다. 사용: node easy.mjs
// 입력은 모두 실제 게시물(seoul-posts.json, nat-posts.json)과 seoul-base.json의 초안이다.
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, here), 'utf8'));
const env = {};
for (const l of readFileSync(new URL('../../.env', here), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
async function score(text) {
  const r = await fetch('https://api.articul8.ai/bivia/score', { method: 'POST', headers: { Authorization: `Bearer ${env.ARTICUL8_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ state: `글: ${text}`, question: '정치와 행정에 익숙하지 않은 유권자가 이 글을 한 번 읽고 무슨 일인지 이해하기 쉬운 정도는 0에서 10 가운데 얼마인가?' }), signal: AbortSignal.timeout(30000) });
  const j = await r.json();
  return j.status === 'answered' ? +j.value.toFixed(3) : null;
}
const sentences = (t) => t.split(/(?<=[.?!다요])\s+/).map((s) => s.trim()).filter((s) => s.length > 3);
const metrics = (t) => { const ss = sentences(t); return { chars: [...t].length, sentences: ss.length, avgLen: Math.round(ss.reduce((a, s) => a + [...s].length, 0) / (ss.length || 1)), numbers: (t.match(/\d[\d,.]*/g) || []).length }; };

const base = read('seoul-base.json');
const easyText = '서울에서 작년 한 해 어린이 교통사고는 1,190건 났습니다. 그중 144건은 학교 앞 어린이보호구역 안에서 났습니다. 등하굣길에 인도가 끊긴 곳이 서울에 몇 군데인지는 교육청도 아직 세지 못했습니다. 7월 시의회에서 이 질문이 나오자 교육청은 "정확한 숫자는 저희가 파악을 못 했는데요"라고 답했습니다. 올해 점검한 곳은 초등학교 250곳입니다.';
const drafts = [{ id: 'draft', label: '처음 초안', text: base.deskText }, { id: 'easy', label: '쉬운 말 초안', text: easyText }];
for (const d of drafts) { d.easy = await score(d.text); d.m = metrics(d.text); console.log(d.id, d.easy, JSON.stringify(d.m)); }

// 실제 게시물의 쉬운 말 점수
const sp = read('seoul-posts.json');
const rows = [];
for (const p of sp) { const text = (p.title + ' ' + (p.excerpt || '')).trim(); const e = await score(text); rows.push({ id: p.id, side: p.side, channel: p.channel, views: p.views ?? null, easy: e, titleLen: [...p.title].length, hasNum: /\d/.test(p.title) }); console.log(p.id, e); }
const avg = (a) => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null;
const by = (f) => { const g = {}; for (const r of rows) (g[f(r)] = g[f(r)] || []).push(r); return Object.entries(g).map(([k, v]) => ({ k, n: v.length, views: avg(v.filter((r) => r.views != null).map((r) => r.views)), easy: avg(v.filter((r) => r.easy != null).map((r) => r.easy)) })); };

// 정당 유튜브 조회수(실제 값): 쇼츠와 긴 영상
const yt = [
  { id: 'D09', kind: '쇼츠', views: 3810 }, { id: 'D10', kind: '쇼츠', views: 9233 }, { id: 'D11', kind: '생중계', views: 32915 },
  { id: 'P09', kind: '쇼츠', views: 5302 }, { id: 'P10', kind: '쇼츠', views: 1310 }, { id: 'P11', kind: '생중계', views: 65964 },
  { id: 'O04', kind: '쇼츠', views: 5422 }, { id: 'O05', kind: '기획 영상', views: 9087 },
];
const ytBy = {}; for (const y of yt) (ytBy[y.kind] = ytBy[y.kind] || []).push(y.views);
const out = {
  drafts: drafts.map(({ id, label, text, easy, m }) => ({ id, label, text, easy, m })),
  easyAll: avg(rows.filter((r) => r.easy != null).map((r) => r.easy)),
  byChannel: by((r) => r.channel.replace('교섭단체 ', '교섭단체 ').replace('의원 ', '의원 ')),
  byNum: by((r) => (r.hasNum ? '제목에 숫자 있음' : '제목에 숫자 없음')),
  byLen: by((r) => (r.titleLen <= 50 ? '제목 50자 이하' : '제목 51자 이상')),
  yt: Object.entries(ytBy).map(([k, v]) => ({ k, n: v.length, views: Math.round(avg(v)) })),
  rows,
};
writeFileSync(new URL('easy.json', here), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ easyAll: out.easyAll, byChannel: out.byChannel, byNum: out.byNum, byLen: out.byLen, yt: out.yt }, null, 1));
