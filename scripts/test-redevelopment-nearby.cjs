const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../app/redevelopment-nearby.js'),'utf8');
const scope={window:{}};vm.createContext(scope);vm.runInContext(src,scope);const api=scope.window.RentRedevelopmentNearby;
// Synthetic fixtures only: stable tests must not hard-code live transaction totals.
const project={id:'fixture-project',district:'강서구',map_point:{lat:37.565,lng:126.815}};
const row={id:'a',complex_id:'11500-fixture-a',lawd_cd:'11500',gu_name:'강서구',name:'검증 <주소>',type:'아파트_매매',date:'2026-10-01',address:'테스트 주소',lat:37.565,lng:126.815,coordinate_source:'fixture://verified',coordinate_checked_at:'2026-10-16',area_m2:84.9,floor:3,deal_amount:25000,deposit:null,monthly_rent:null};
const data={version:2,meta:{collection_complete:true,complete_districts:25,successful_partitions:150,expected_partitions:150,period:['2026-10-01','2026-10-16'],source_checked_at:'2026-10-16T15:00:00Z',latest_contract_date:'2026-10-01',raw_rows:4,eligible_rows:3,excluded_cancelled:1,coordinate_limit:'테스트 범위',cancellation_limit:'전월세 취소 여부 미확인',raw_source:'https://rt.molit.go.kr/'},projects:{'fixture-project':{verified:true,point:[37.565,126.815],source:'fixture://official'}},services:['아파트_매매','아파트_전월세','연립다세대_매매'],counts:{'아파트_매매':{raw:3,eligible:2,excluded_cancelled:1,coordinate_unlinked:1,coordinate_linked:1},'아파트_전월세':{raw:1,eligible:1,coordinate_linked:1}},rows:[row,{...row,id:'b',complex_id:'11500-fixture-b',lat:37.578,type:'아파트_전월세',deal_amount:null,deposit:10000,monthly_rent:90}]};
const before=JSON.stringify(data),one=api.query(project,data),two=api.query(project,data,{radius:2000,property:'all',deal:'all'});
assert.equal(one.recordCount,1);assert.equal(two.recordCount,2);assert.equal(one.totals.coordinate_unlinked,1);assert.equal(one.totals.excluded_cancelled,1);
assert.equal(api.query(project,data,{radius:2000,property:'all',deal:'매매'}).recordCount,1);
assert.equal(api.query(project,data,{radius:2000,property:'all',deal:'전월세'}).recordCount,1);
assert.equal(api.query(project,data,{radius:1000,property:'연립다세대',deal:'all'}).recordCount,0);
assert.equal(api.query({...project,map_point:null},data).status,'unverified-point');assert.equal(api.query({...project,map_point:{lat:37.5,lng:127}},data).status,'unverified-point');
assert.equal(api.query(project,{...data,meta:{...data.meta,collection_complete:false}}).status,'invalid-data');
assert.equal(api.query(project,data,{radius:10000,property:'all',deal:'all'}).status,'invalid-filter');
const future=JSON.parse(before);future.rows.push({...row,id:'future',date:'2027-01-01'});assert.equal(api.query(project,future).recordCount,1);
const noProof=JSON.parse(before);noProof.rows.forEach(x=>x.coordinate_source='');assert.equal(api.query(project,noProof).recordCount,0);
assert.equal(api.amount(25000),'2억 5,000만원');assert.equal(api.amount(10000),'1억원');assert.equal(api.amount(90),'90만원');assert.equal(JSON.stringify(data),before);
(async()=>{let reads=0;await api.ensureLoaded(async url=>{reads++;return url.endsWith('-status.json')?{version:1,state:'ready',execution_environment:'local'}:data;});await api.ensureLoaded(async()=>{throw Error('cached');});assert.equal(reads,2);const html=api.render(project);assert.ok(html.includes('value="1500"'));assert.ok(html.includes('1.5km'));for(const s of ['좌표 미연결','서울 전체 기준','계약일','원천 최신 계약','자료 확인','전월세 취소 여부','사업구역 안의 거래나 입주권 거래로 해석하지 않습니다','data-nearby-filter','검증 &lt;주소&gt;'])assert.ok(html.includes(s),s);
assert.ok(html.includes('2026-10-01 ~ 2026-10-16'));assert.ok(html.includes('3개 거래 유형 150/150'));
assert.ok(api.updateBanner(data.meta,{state:'failed',attempted_at:'2026-10-16T16:00:00Z'},Date.parse('2026-10-16T16:00:00Z')).includes('마지막 정상자료'));
const failed={window:{}};vm.createContext(failed);vm.runInContext(src,failed);await failed.window.RentRedevelopmentNearby.ensureLoaded(async()=>{throw Error('network');});assert.ok(failed.window.RentRedevelopmentNearby.render(project).includes('거래 0건을 뜻하지 않습니다'));
console.log('PASS nearby fixture: radius/type/date/address guards, counts, escaping, last-good status, load failure, immutable data');})().catch(e=>{console.error(e);process.exitCode=1;});

assert.ok(!src.includes("8~10월"),"collection window must not be frozen to August–October");
assert.ok(src.includes("m.period||[]"),"source scope uses actual snapshot dates");


for (const radius of [500,1000,1500,2000]) assert.equal(api.query(project,data,{radius,property:'all',deal:'all'}).status,'ready');
for (const radius of [0,499,750,1499,2500,NaN,Infinity]) assert.equal(api.query(project,data,{radius,property:'all',deal:'all'}).status,'invalid-filter');
assert.equal(api.query(project,data,{radius:1500,property:'all',deal:'all'}).recordCount,2);
assert.equal(api.query(project,data).radius,1000,'existing 1km default is retained');
assert.ok(api.render(project).includes('불러오는 중'),'unloaded snapshot must not claim unverified position');

// Banghwa6 alone uses the compact caution and closed provenance disclosure.
// Freeze freshness so these layout assertions do not depend on the day of execution.
const fixtureNow=Date.parse('2026-10-17T01:00:00Z');
class FixtureDate extends Date { static now(){return fixtureNow;} }
function isolatedApi(){
  let changeHandler,lastFocused;
  const document={addEventListener(type,handler){if(type==='change')changeHandler=handler;},querySelector(selector){return{focus(){lastFocused=selector;}};}};
  const context={window:{},document,Date:FixtureDate,CSS:{escape:value=>value}};
  vm.createContext(context);vm.runInContext(src,context);
  return {api:context.window.RentRedevelopmentNearby,window:context.window,change(event){changeHandler(event);},focused(){return lastFocused;}};
}
const banghwa={...project,id:'cleanup-banghwa6'};
function compactFixture(){const fixture=JSON.parse(before);fixture.projects[banghwa.id]={...fixture.projects[project.id]};fixture.counts['아파트_매매'].invalid_value=2;return fixture;}
const readyStatus={version:1,state:'ready',execution_environment:'github-actions'};
async function loadedApi(fixture,status=readyStatus){const isolated=isolatedApi();await isolated.api.ensureLoaded(async url=>url.endsWith('-status.json')?status:fixture);return isolated;}
function splitSources(html){
  const marker='<details class="nearby-sources">',index=html.indexOf(marker);
  assert.ok(index>=0,'source disclosure is closed by default, with no open attribute');
  return {visible:html.slice(0,index),details:html.slice(index)};
}
function assertLegacyLayout(html,empty=false){
  const {visible,details}=splitSources(html);
  assert.ok(!html.includes('nearby-transactions-compact'));
  assert.ok(!html.includes('nearby-compact-warning'));
  for(const text of ['계약일','원천 최신 계약','자료 확인','좌표 미연결','서울 전체 기준'])assert.ok(visible.includes(text),'other-site visible '+text);
  assert.ok(details.includes('<summary>거리·수집 범위 확인</summary>'));
  if(empty){assert.ok(visible.includes('이 조건의 주변 거래 연결 미완료'));assert.ok(visible.includes('class="trade-empty"'));}
  else assert.ok(visible.includes('<span>최근 1건 먼저 표시 · 나머지는 각 주소에서 펼쳐보기</span>'));
}
(async()=>{
  const fixture=compactFixture(),fixtureBefore=JSON.stringify(fixture),loaded=await loadedApi(fixture),html=loaded.api.render(banghwa),parts=splitSources(html);
  assert.ok(html.includes('nearby-transactions-compact'));
  assert.ok(parts.visible.includes('주소 위치가 확인된 주변 1곳 · 거래 1건'));
  assert.ok(parts.visible.includes('좌표 연결 거래만 표시하며, 누락·미연결 자료가 있어 주변 전체 거래는 아닙니다.'));
  assert.ok(parts.visible.indexOf('nearby-compact-warning')<parts.visible.indexOf('nearby-sale'),'the concise caution precedes the first price');
  assert.equal((parts.visible.match(/nearby-compact-warning/g)||[]).length,1);
  for(const text of ['최근 자료 갱신 확인','계약일','원천 최신 계약','자료 확인','좌표 미연결','서울 전체 기준','최근 1건 먼저 표시']){
    assert.ok(!parts.visible.includes(text),'details hidden from compact preamble: '+text);
    assert.ok(parts.details.includes(text),'details retain: '+text);
  }
  for(const text of ['자료 기준·누락 범위 확인','서울 수집 자료 3건 중 좌표 미연결 1건','금액·면적 확인이 필요한 2건','25개 구','3개 거래 유형 150/150','원천 4건 중 취소표시 1건','전월세 취소 여부 미확인','테스트 범위','주소 좌표 확인일 2026-10-16','사업구역 안의 거래나 입주권 거래로 해석하지 않습니다','https://rt.molit.go.kr/','이후 신고·취소로 달라질 수 있습니다'])assert.ok(parts.details.includes(text),'provenance retained: '+text);
  assert.ok(parts.visible.includes('검증 &lt;주소&gt;'));
  for(const radius of [500,1000,1500,2000])assert.ok(html.includes('value="'+radius+'"'));
  assert.ok(html.includes('value="1000" selected'));
  assertLegacyLayout(loaded.api.render(project));

  const emptyFixture=compactFixture();emptyFixture.rows=[];
  const emptyApi=await loadedApi(emptyFixture),empty=splitSources(emptyApi.api.render(banghwa));
  assert.ok(empty.visible.includes('이 조건에 맞는 확인된 거래를 찾지 못했습니다.'));
  assert.ok(empty.visible.includes('좌표 연결 거래만 확인한 결과입니다.'));
  assert.ok(empty.visible.includes('누락·미연결 자료가 있어 실제 거래가 없다는 뜻은 아닙니다.'));
  assert.ok(!empty.visible.includes('연결 미완료'));
  assert.ok(!empty.visible.includes('class="trade-empty"'),'empty result is stated once rather than repeated');
  assert.ok(empty.details.includes('좌표 미연결 1건'));
  assertLegacyLayout(emptyApi.api.render(project),true);

  const failedUpdate=await loadedApi(compactFixture(),{version:1,state:'failed',attempted_at:'2026-10-16T16:00:00Z'});
  const failedUpdateVisible=splitSources(failedUpdate.api.render(banghwa)).visible;
  assert.ok(failedUpdateVisible.includes('최근 갱신에 실패해 마지막 정상자료를 표시합니다.'));
  assert.ok(failedUpdateVisible.indexOf('nearby-update warning')<failedUpdateVisible.indexOf('nearby-sale'));
  assertLegacyLayout(failedUpdate.api.render(project));
  const staleFixture=compactFixture();staleFixture.meta.source_checked_at='2026-10-14T00:00:00Z';
  const stale=await loadedApi(staleFixture),staleVisible=splitSources(stale.api.render(banghwa)).visible;
  assert.ok(staleVisible.includes('자료 확인 후 48시간이 지났습니다.'));
  assert.ok(staleVisible.includes('최신 전체 자료로 표시하지 않습니다.'));
  assert.ok(staleVisible.indexOf('nearby-update warning')<staleVisible.indexOf('nearby-sale'));
  assertLegacyLayout(stale.api.render(project));
  for(const status of [null,{version:1,state:'ready',execution_environment:'local'}]){
    const normal=await loadedApi(compactFixture(),status),normalParts=splitSources(normal.api.render(banghwa));
    assert.ok(!normalParts.visible.includes('nearby-update'));
    assert.ok(normalParts.details.includes('nearby-update coverage'));
  }
  const unavailable=isolatedApi();assert.ok(unavailable.api.render(banghwa).includes('불러오는 중'));
  await unavailable.api.ensureLoaded(async()=>{throw Error('network');});
  assert.ok(unavailable.api.render(banghwa).includes('자료를 불러오지 못했습니다. 거래 0건을 뜻하지 않습니다.'));
  assert.ok(!unavailable.api.render(banghwa).includes('이 조건에 맞는 확인된 거래를 찾지 못했습니다.'));
  const unverified=loaded.api.render({...banghwa,map_point:null});
  assert.ok(unverified.includes('사업 기준 위치 미확인'));
  assert.ok(!unverified.includes('이 조건에 맞는 확인된 거래를 찾지 못했습니다.'));

  // Exercise the unchanged change handler: selected filters survive rerenders and
  // remain per-project; focus returns to the same control after radius changes.
  loaded.window.PROJECTS=[banghwa,project];
  const section={dataset:{nearbyProject:banghwa.id},outerHTML:''};
  function change(name,value){const control={dataset:{nearbyFilter:name},value,closest:()=>section};loaded.change({target:{closest:()=>control}});return section.outerHTML;}
  let changed=change('radius','1500');assert.ok(changed.includes('value="1500" selected'));assert.ok(changed.includes('거래 2건'));
  changed=change('property','연립다세대');assert.ok(changed.includes('value="1500" selected'));assert.ok(changed.includes('value="연립다세대" selected'));assert.ok(changed.includes('이 조건에 맞는 확인된 거래를 찾지 못했습니다.'));
  changed=change('deal','매매');assert.ok(changed.includes('value="매매" selected'));
  changed=change('radius','2000');for(const text of ['value="2000" selected','value="연립다세대" selected','value="매매" selected'])assert.ok(changed.includes(text));
  assert.ok(loaded.focused().endsWith('[data-nearby-filter="radius"]'));
  assert.ok(loaded.api.render(project).includes('value="1000" selected'),'other project retains its default radius');
  assert.equal(JSON.stringify(fixture),fixtureBefore,'render and filter changes do not mutate snapshot data');
  console.log('PASS Banghwa6 compact UI: positive/empty/load failure/update failure/stale/unverified, hidden provenance and exact omissions, unchanged other-site layout, four radii/default and filter state');
})().catch(e=>{console.error(e);process.exitCode=1;});
