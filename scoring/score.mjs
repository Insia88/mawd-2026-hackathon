// 콘텐츠 점수: 같은 질문 여섯 개를 모든 글에 똑같이 던진다. 사용: node score.mjs 입력.json 출력.json
// 입력 형식: [{ id, text, source? }]  source가 있으면 원자료 일치 질문도 던진다.
import { readFileSync, writeFileSync } from 'node:fs';
const env = {};
for (const l of readFileSync(new URL('../../.env', import.meta.url), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const [inFile, outFile] = process.argv.slice(2);
const items = JSON.parse(readFileSync(inFile, 'utf8'));
async function call(path, body) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch('https://api.articul8.ai/bivia' + path, { method: 'POST', headers: { Authorization: `Bearer ${env.ARTICUL8_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
      const j = await r.json();
      if (r.ok) return j;
      if (i === 2) return { status: 'error', http: r.status, detail: JSON.stringify(j).slice(0, 200) };
    } catch (e) { if (i === 2) return { status: 'error', detail: e.message }; }
  }
}
const TONES = ['사실 전달', '정책 요구', '상대 비난', '지지 호소'];
const out = [];
for (const it of items) {
  const state = (it.source ? `원자료: ${it.source}\n\n` : '') + `글: ${it.text}`;
  const [tone, attack, evidence, clean, novote, match] = await Promise.all([
    call('/choice', { state, question: '이 글의 말투는 어느 쪽에 가장 가까운가?', choices: TONES }),
    call('/score', { state, question: '이 글이 상대를 공격하는 정도는 0에서 10 가운데 얼마인가?' }),
    call('/boolean', { state, question: '이 글은 수치, 날짜, 기관 이름처럼 확인할 수 있는 근거를 하나 이상 제시하는가?' }),
    call('/boolean', { state, question: '이 글은 누구도 비난하거나 모욕하지 않고 사실만 전달하는가?' }),
    call('/score', { state, question: '이 글이 선거에서 지지나 심판을 호소하는 정도는 0에서 10 가운데 얼마인가?' }),
    it.source ? call('/boolean', { state, question: '글에 나온 수치와 일정이 원자료와 모두 일치하는가?' }) : Promise.resolve(null),
  ]);
  const b = (x) => x == null ? null : x.status === 'answered' ? { value: x.value, p: +x.probability.toFixed(3) } : { value: null, status: x.status, reason: x.abstain_reason ?? x.detail ?? null };
  const row = {
    id: it.id,
    tone: tone.status === 'answered' ? { value: tone.value, dist: Object.fromEntries(Object.entries(tone.distribution).map(([k, v]) => [k, +v.toFixed(3)])) } : { value: null, status: tone.status },
    attack: attack.status === 'answered' ? +attack.value.toFixed(3) : null,
    evidence: b(evidence), clean: b(clean), appeal: novote.status === 'answered' ? +novote.value.toFixed(3) : null, match: b(match),
    ms: [tone, attack, evidence, clean, novote].map((x) => x.latency_ms).filter(Boolean).reduce((a, c) => a + c, 0),
  };
  out.push(row);
  console.log(it.id, row.tone.value, 'attack', row.attack, 'evid', row.evidence?.value, 'clean', row.clean?.value, 'appeal', row.appeal, 'match', row.match?.value);
}
writeFileSync(outFile, JSON.stringify(out, null, 1));
