// 게시물 파일에서 점수 입력 파일을 만든다. 사용: node prep.mjs 게시물.json 입력.json
// 대변인 이름과 직함, 게시판 머리표는 판정에 영향을 주지 않게 빼고 제목과 발췌 원문만 보낸다.
import { readFileSync, writeFileSync } from 'node:fs';
const [inFile, outFile] = process.argv.slice(2);
const posts = JSON.parse(readFileSync(inFile, 'utf8'));
const strip = (t) => t
  .replace(/\[[^\]]*(대변인|정책위|보도자료|현수막|Live|투데이뉴스|브리핑)[^\]]*\]/g, '')
  .replace(/ㅣ.*대변인/, '')
  .trim();
const rows = posts.map((x) => ({
  id: x.id,
  text: (strip(x.title) + (x.excerpt ? ' ' + x.excerpt : '')).trim(),
  ...(x.source ? { source: x.source } : {}),
}));
writeFileSync(outFile, JSON.stringify(rows, null, 1));
console.log(rows.length + '건');
