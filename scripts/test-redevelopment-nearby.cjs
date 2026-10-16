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
(async()=>{let reads=0;await api.ensureLoaded(async url=>{reads++;return url.endsWith('-status.json')?{version:1,state:'ready',execution_environment:'local'}:data;});await api.ensureLoaded(async()=>{throw Error('cached');});assert.equal(reads,2);const html=api.render(project);for(const s of ['좌표 미연결','서울 전체 기준','계약일','원천 최신 계약','자료 확인','전월세 취소 여부','사업구역 안의 거래나 입주권 거래로 해석하지 않습니다','data-nearby-filter','검증 &lt;주소&gt;'])assert.ok(html.includes(s),s);
assert.ok(html.includes('2026-10-01 ~ 2026-10-16'));assert.ok(html.includes('3개 거래 유형 150/150'));
assert.ok(api.updateBanner(data.meta,{state:'failed',attempted_at:'2026-10-16T16:00:00Z'},Date.parse('2026-10-16T16:00:00Z')).includes('마지막 정상자료'));
const failed={window:{}};vm.createContext(failed);vm.runInContext(src,failed);await failed.window.RentRedevelopmentNearby.ensureLoaded(async()=>{throw Error('network');});assert.ok(failed.window.RentRedevelopmentNearby.render(project).includes('거래 0건을 뜻하지 않습니다'));
console.log('PASS nearby fixture: radius/type/date/address guards, counts, escaping, last-good status, load failure, immutable data');})().catch(e=>{console.error(e);process.exitCode=1;});

assert.ok(!src.includes("8~10월"),"collection window must not be frozen to August–October");
assert.ok(src.includes("m.period||[]"),"source scope uses actual snapshot dates");
