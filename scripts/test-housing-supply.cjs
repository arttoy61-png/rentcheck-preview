'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const app=path.join(__dirname,'../app');
const ctx=vm.createContext({window:{},Date,URL,Intl,console});
for(const file of ['housing-list-state.js','home-calendar-link.js','housing-supply.js'])vm.runInContext(fs.readFileSync(path.join(app,file),'utf8'),ctx);
const supply=ctx.window.RentCheckHousingSupply,core=ctx.window.RentCheckHousingList;
const notices=JSON.parse(fs.readFileSync(path.join(app,'data/public-notices.json'))).items;
const housing=JSON.parse(fs.readFileSync(path.join(app,'data/housing.json')));
const all=notices.flatMap(n=>supply.forNotice(n,housing));
assert.equal(all.length,44,'25 rich site rows + 19 address-only associations');
assert.equal(supply.collect(notices,housing).length,43,'identical address sets deduplicate, associations remain');
assert.equal(all.filter(supply.coord).length,4);
assert.equal(all.filter(s=>s.units?.length).reduce((a,s)=>a+s.units.length,0),56);
assert.equal(all.filter(s=>s.unit_count===null).length,19);
assert.equal(notices.filter(n=>!supply.forNotice(n,housing).length).length,11);
assert.equal(notices.filter(core.isSH).flatMap(n=>supply.forNotice(n,housing)).length,0);
const gangseo=supply.collect(notices,housing,{district:'강서구'});
assert(gangseo.some(s=>s.addresses.some(a=>a.includes('공항대로81길'))));
assert(gangseo.some(s=>s.addresses.some(a=>a.includes('강서로68길'))));
assert.equal(supply.collect(notices,housing,{district:'강서구',query:'염창'}).length,1);
assert.equal(supply.collect(notices,housing,{district:'강서구',query:'염창'})[0].notice_ids.length,2);
assert.equal(supply.forNotice(notices.find(n=>n.id.endsWith('19045')),housing).length,8,'verified PDF addresses are usable regardless of coverage label');
const ds=JSON.parse(fs.readFileSync(path.join(app,'districts.geojson'))).features.map(f=>f.properties.district_name);
assert.equal(ds.length,25);for(const district of ds){for(const s of supply.collect(notices,housing,{district}))assert(s.addresses.some(a=>a.includes(district)));}
const n={id:'SH:test:active',agency:'SH',schedule_source:'verified_official_pdf',schedule_type:'single',application_start:'2026-10-12',deadline:'2026-10-12',deadline_precision:'minute',deadline_at:'2026-10-12T18:00:00+09:00',sites:[{id:'same-site',site:'test',addresses:['서울특별시 강서구 테스트로 1'],lat:37.5,lng:126.9}]};
const old={...n,id:'SH:test:closed',deadline_at:'2026-10-12T17:00:00+09:00'};
const now=new Date('2026-10-12T17:30:00+09:00');const alive=[old,n].filter(x=>['open','upcoming','scoped'].includes(core.state(x,core.today(now),now)));
assert.equal(alive.length,1);assert.equal(supply.collect(alive,housing).length,1,'other active notice preserves same building');
assert.equal(supply.collect(alive,housing)[0].notice_ids[0],n.id);
const shFuture={...n,id:'SH:new',sites:[],addresses:['서울특별시 마포구 새주소 2']};assert.equal(supply.forNotice(shFuture,housing).length,1,'generic SH join, no hardcoded agency');assert.equal(supply.forNotice(shFuture,housing)[0].lat,null);
const oldEvidence={...old,sites:[{...old.sites[0],coordinate_source:{url:'https://example.com/verified-address'}}]};
const newAddress={...n,sites:[],addresses:old.sites[0].addresses};
const reused=supply.collect([newAddress],housing,{knownNotices:[oldEvidence,newAddress]})[0];
assert(supply.coord(reused),'same building keeps verified location when a different notice is active');
assert.equal(reused.unit_count,null,'coordinate reuse never copies old notice supply facts');
assert.equal(reused.notice_ids.length,1,'expired notice is not reintroduced to active associations');
// Narrow app integration tests exercise actual source functions, without pretending to be browser QA.
const code=fs.readFileSync(path.join(app,'app.js'),'utf8');
function fn(name,next){return code.slice(code.indexOf('function '+name+'('),code.indexOf(next,code.indexOf('function '+name+'(')));}
const nodes=new Map();const stub=()=>({scrollTop:0,innerHTML:'',textContent:'',getBoundingClientRect:()=>({height:100}),setAttribute(){}});
Object.assign(ctx,{state:{tab:'housing',district:'all',query:'',noticeCategory:'all',noticeStatus:'all',calendarDate:null,bounds:null},publicNotices:{items:notices},housing,supplyModel:supply,notice:{id:housing.notice_id},norm:s=>String(s).replace(/\s/g,'').toLowerCase(),inBounds:()=>true,esc:s=>String(s??'').replaceAll('<','&lt;'),$:s=>{if(!nodes.has(s))nodes.set(s,stub());return nodes.get(s);},empty:(a,b)=>a+' '+b,link:()=>'',homeCalendarBanner:()=>''});
vm.runInContext(fn('supplyRows','function filteredComplexes'),ctx); // supply helpers up to next unrelated helper
for(const [name,next] of [['baseHousingNoticeRows','function noticeEventsOn'],['noticeDistricts','function filterDisclosure'],['housingNoticeRows','function noticeDistricts'],['housingSiteCard','function renderPublicNoticeList']])vm.runInContext(fn(name,next),ctx);
vm.runInContext('state.district="강서구";state.query="염창";',ctx);
assert.equal(vm.runInContext('baseHousingNoticeRows().length',ctx),2,'address search returns both notices');
assert(vm.runInContext('localHousingSitesHtml(baseHousingNoticeRows())',ctx).includes('위치 미확인'));
// District selection clears stale query/category/date and restores active defaults.
Object.assign(ctx,{locationPending:false,remember(){},render(){},history:{pushState(){},replaceState(){}},serializedState:()=>({}),routeFor:()=>'',resetDetailScroll:false});
vm.runInContext(fn('navigate','const tabFields='),ctx);
vm.runInContext('Object.assign(state,{district:"강서구",query:"염창",noticeCategory:"youth",noticeStatus:"closed",calendarDate:"2026-10-01",calendarOpen:true});navigate({district:"마포구"});',ctx);
assert.equal(ctx.state.query,'');assert.equal(ctx.state.noticeCategory,'all');assert.equal(ctx.state.noticeStatus,'active');assert.equal(ctx.state.calendarDate,null);assert.equal(ctx.state.calendarOpen,false);
vm.runInContext('state.query="염창";navigate({district:"강서구",keepTopicFilters:true});',ctx);assert.equal(ctx.state.query,'염창','explicit bounds/site flow can preserve filters');
vm.runInContext(fn('restoreHousingNoticeList','function noticeContext'),ctx);
const origin={district:'all',query:'염창',noticeCategory:'youth',noticeStatus:'closed',calendarDate:'2026-10-01',sub:'notices'};
ctx.state.noticeOrigin=origin;vm.runInContext('Object.assign(state,{district:"강서구",query:"",noticeCategory:"all",noticeStatus:"active",calendarDate:null,notice:true,selected:"supply:test"});restoreHousingNoticeList();',ctx);
for(const k of Object.keys(origin))assert.equal(ctx.state[k],origin[k],'all -> supply -> explicit return restores '+k);
assert.equal(ctx.state.notice,false);assert.equal(ctx.state.selected,null);
vm.runInContext('navigate({district:"마포구"});',ctx);assert.equal(ctx.state.query,'');assert.equal(ctx.state.noticeStatus,'active');assert.equal(ctx.state.calendarDate,null,'ordinary district change still resets stale date');
console.log(JSON.stringify({passed:true,noticeSiteAssociations:44,uniqueAddressGroups:43,coordinates:4,addressOnlyAssociations:19,noticesWithoutSites:11,districtsTested:25}));
