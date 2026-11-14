// 조사 결과와 점수 파일을 모아 live.js를 만든다. 사용: node build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const here = new URL('.', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, here), 'utf8'));
const live = {};

// 정당 공식 게시물 점수판
const posts = read('nat-posts.json');
const scores = read('nat-score.json');
// 발췌가 있는 글(제목과 본문 문장이 함께 있는 글)을 앞에 두고 여당과 제1야당을 번갈아 놓는다
const withText = (p) => (p.excerpt ? 0 : 1);
const order = (side) => posts.filter((p) => p.side === side).sort((a, b) => withText(a) - withText(b));
const a = order('여당'), b = order('제1야당'), c = order('그 밖의 원내 정당');
const mixed = [];
for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) mixed.push(a[i]); if (b[i]) mixed.push(b[i]); }
live.posts = [...mixed, ...c];
live.scores = scores;
live.postrows = 8;
live.postlead = `2026년 11월 2일부터 14일 사이 정당 공식 홈페이지와 유튜브, 페이스북에 올라온 게시물 ${posts.length}건(여당 12건, 제1야당 12건, 그 밖의 원내 정당 8건)의 제목과 발췌 원문을 Articul8 Bivia에 그대로 보냈다. 질문에는 정당 이름이 들어가지 않고, 대변인 이름과 직함은 빼고 보냈다.`;

// 서울시 실제 자료
const base = read('seoul-base.json');
const deskScore = read('desk-score.json')[0];
const { deskSource, deskText, ...rest } = base;
Object.assign(live, rest);
live.samples = [{ label: '도구가 만든 초안 · SNS 글', short: '통학로 SNS 글 초안, 승인을 기다려요.', html: base.desk.postHtml.replace(/<sup[^>]*>.*?<\/sup>/g, ''), score: deskScore, url: '원자료: 서울시의회 교육위원회 회의록(2026.7.27, 8.31), 서울시 어린이 교통사고 현황 통계' }];
// 실제 게시물과 원자료의 짝
if (existsSync(new URL('pairs.json', here)) && existsSync(new URL('pairs-score.json', here))) {
  const pairs = read('pairs.json'), ps = Object.fromEntries(read('pairs-score.json').map((x) => [x.id, x]));
  for (const p of pairs) if (ps[p.id]) live.samples.push({ label: p.label, short: p.short, html: p.html, score: ps[p.id], url: p.url, note: ps[p.id].match && ps[p.id].match.value === 'no' ? '이 원자료에 없는 수치가 글에 있어요. 다른 출처의 수치일 수 있으니 사람이 확인해요.' : '' });
}
// 서울시의회 여야 게시물 점수판
if (existsSync(new URL('seoul-posts.json', here)) && existsSync(new URL('seoul-score.json', here))) {
  const sp = read('seoul-posts.json'); const sa = sp.filter((p) => p.side === '민주당 쪽'), sb = sp.filter((p) => p.side === '국민의힘 쪽'); live.sposts = []; for (let i = 0; i < 10; i++) { if (sa[i]) live.sposts.push(sa[i]); if (sb[i]) live.sposts.push(sb[i]); }
  live.sscores = read('seoul-score.json');
  live.spostlead = '2026년 10월 19일부터 11월 13일 사이 서울특별시의회 보도자료 게시판에 올라온 교섭단체와 의원 보도자료 20건(더불어민주당 쪽 10건, 국민의힘 쪽 10건)의 제목과 발췌 원문을 Articul8 Bivia에 그대로 보냈다. 제12대 의회는 더불어민주당 80명, 국민의힘 38명이다.';
}

// 쉬운 말과 다음 전략
if (existsSync(new URL('easy.json', here))) {
  const e = read('easy.json');
  live.easy = {
    drafts: e.drafts.map(({ label, text, m }) => ({ label, text, m })),
    byChannel: e.byChannel, byNum: e.byNum, yt: e.yt,
    seoulYt: [{ k: '청년 일자리 대담 영상 (11.2)', n: 1, views: 13482 }, { k: '키오스크 지원 안내 영상 (11.1)', n: 1, views: 15903 }],
    next: [
      ['11.17~19', '시정질문 사흘', '질의한 날 저녁에 30초 쇼츠 한 편과 카드 두 장. 질문과 답변을 회의록 문장 그대로'],
      ['11.23~27', '상임위 예산 예비심사', '상임위마다 숫자 한 개를 고른 카드. 작년 금액과 나란히'],
      ['11.30', '행정사무감사 결과보고서 채택', '감사에서 물은 것과 받은 답을 쉬운 말 SNS 글 한 편으로'],
      ['12.2~4', '예산결산특별위원회', '주간 뉴스레터에 예산 꼭지. 지역구에 닿는 사업 위주'],
      ['12.16, 12.23', '본회의', '처리된 안건을 문자 한 통으로'],
    ],
  };
}
writeFileSync(new URL('../live.js', here), '// build.mjs가 만든 파일. 직접 고치지 않는다.\nwindow.AIDE=Object.assign(window.AIDE||{},' + JSON.stringify(live, null, 1) + ');\n');
console.log('live.js', Object.keys(live).join(', '));
