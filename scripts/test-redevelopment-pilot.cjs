const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const {createDocument,parseFragment}=require('./helpers/pilot-test-dom.cjs');
const app=path.join(__dirname,'../app');const sandbox={window:{},document:createDocument()};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(app,'data/banghwa6-pilot.js'),'utf8'),sandbox);
const d=sandbox.window.RentBanghwa6Verified;
assert.equal(d.project.bsnsPk,'11500-900000103');assert.equal(d.project.cafeId,'500900000103o05');
assert.equal(d.majorStages.length,13);assert.equal(d.stages.length,18);
assert.equal(d.stages.reduce((n,s)=>n+s.events.length,0),56);
assert.equal(d.project.currentStage,'일반분양승인');assert.equal(d.project.currentStageDate,null);
for(const name of ['착공신고','일반분양승인','준공인가','이전고시','조합해산','조합청산'])assert.equal(d.stages.find(s=>s.label===name).events.length,0);
assert.equal(d.stages.filter(s=>s.isCurrent).length,1);
assert.equal(d.stages.find(s=>s.label==='이주').dateConflict,true);
assert.equal(d.stages.find(s=>s.label==='시공자선정').potentiallyStaleContractor,true);
vm.runInContext(fs.readFileSync(path.join(app,'redevelopment-pilot.js'),'utf8'),sandbox);
const pilot=sandbox.window.RentRedevelopmentPilot;
assert.equal(pilot.matches({id:'cleanup-banghwa6'}),true);
assert.equal(pilot.matches({id:'cleanup-banghwa3'}),false);
const html=pilot.render({id:'cleanup-banghwa6',title:d.project.name,project_type:'재건축',location:{}},{manifest:{},overview:()=>'',mapControl:()=>'',tool:()=>''});
assert.equal((html.match(/id="detailTitle"/g)||[]).length,1);
assert.ok(html.includes('2026-04-22'));assert.ok(html.includes('2028년 8월'));
assert.ok(html.includes('단계 발생일 미확인'));
assert.ok(html.includes('미진행을 뜻하지 않습니다.'));
assert.ok(html.includes('현재 시공사를 확정하는 정보는 아닙니다.'));
assert.ok(html.includes('공개 날짜·경과 없음'));
assert.ok(html.indexOf('입주 · 준공 이후 안내')<html.indexOf('11</span>'));
console.log('PASS redevelopment pilot: correct business identity, 13 major / 18 detail / 56 events, null dates, current marking, source conflicts and pilot-only routing');

const root=parseFragment(html),overview=root.querySelector('[data-bw6-panel="overview"]'),summary=overview.querySelector('.bw6-construction-summary');
assert.ok(summary,'construction facts must be in the default overview, not the source fold');
assert.equal(overview.hasAttribute('hidden'),false);
assert.ok(summary.textContent.includes('래미안 엘라비네 · 공사 중'));
assert.ok(summary.textContent.includes('입주 예정 · 2028년 8월'));
assert.ok(summary.textContent.includes('입주 완료·조합 청산 시기를 뜻하지 않습니다.'));
assert.ok(summary.outerHTML.includes(d.sources.raemian));
assert.equal(root.querySelectorAll('.bw6-construction-summary').length,1,'move facts rather than duplicate them');
assert.equal((html.match(/입주 예정 · 2028년 8월/g)||[]).length,1);
assert.equal(root.querySelector('[data-bw6-panel="transactions"]').querySelector('.bw6-data-note'),null,'nearby module owns the single visible coverage warning');
assert.ok(root.querySelector('[data-bw6-browse-map]'),'browse-map action retained');
assert.ok(html.includes('방화6재정비촉진구역'));
const linked=pilot.render({id:'cleanup-banghwa6',title:d.project.name,project_type:'재건축',location:{}},{manifest:{},overview:()=>'',mapControl:()=>'<button data-project-map>지도 보기</button>',tool:()=>''});
assert.ok(linked.includes('data-bw6-locate-map'),'locate-map action retained');
assert.ok(linked.includes('방화6 위치 보기'));
assert.ok(!linked.includes('data-project-map'),'legacy map action must not be duplicated');
console.log('PASS Banghwa6 overview: visible existing construction/expected move-in facts, single copy, source and caveats retained, map actions retained, no duplicate nearby warning');

// Navigation handlers are tested without a map SDK or live-browser claims.
const appSource=fs.readFileSync(path.join(app,'app.js'),'utf8');
const nav={state:{},selectionEpoch:0,remember(){},clone:value=>JSON.parse(JSON.stringify(value)),window:{PROJECTS:[{id:'cleanup-banghwa6',map_point:{lat:37.57,lng:126.81}}],matchMedia:()=>({matches:false})},navigate(patch){this.lastPatch=patch;Object.assign(this.state,patch);}};
nav.navigate=patch=>{nav.lastPatch=patch;Object.assign(nav.state,patch);};vm.createContext(nav);
vm.runInContext(appSource.slice(appSource.indexOf('function closeDetail()'),appSource.indexOf('function back()')),nav);
const camera={lat:37.58,lng:126.82,level:5};
nav.state={tab:'redevelopment',selected:'cleanup-banghwa6',detailOpen:true,selectionOrigin:{listScroll:125},kakaoCameras:{redevelopment:camera}};
nav.browseBanghwa6Map();assert.equal(nav.state.selected,null);assert.equal(nav.state.detailOpen,false);assert.equal(nav.state.showMap,true);assert.equal(nav.state.listScroll,125);assert.equal(JSON.stringify(nav.restoreRedevelopmentCamera),JSON.stringify(camera));
for(const mobile of [false,true]){nav.window.matchMedia=()=>({matches:mobile});nav.state={tab:'redevelopment',selected:'cleanup-banghwa6',detailOpen:true};nav.locateBanghwa6Map();assert.equal(nav.state.selected,'cleanup-banghwa6');assert.equal(nav.state.detailOpen,!mobile);assert.equal(nav.restoreRedevelopmentCamera.level,4);assert.equal(nav.restoreRedevelopmentCamera.lat,37.57);}
nav.state={tab:'redevelopment',selected:'cleanup-banghwa3',detailOpen:true};nav.lastPatch=null;nav.browseBanghwa6Map();nav.locateBanghwa6Map();assert.equal(nav.lastPatch,null);
nav.state={tab:'redevelopment',selectionOrigin:{district:'강서구',query:'방화',projectType:'재건축',listScroll:64,kakaoCameras:{redevelopment:camera}}};nav.closeDetail();assert.equal(nav.state.query,'방화');assert.equal(nav.state.projectType,'재건축');assert.equal(nav.state.listScroll,64);assert.equal(nav.state.selected,null);assert.equal(JSON.stringify(nav.restoreRedevelopmentCamera),JSON.stringify(camera));
console.log('PASS Banghwa6 map actions: browse retains current camera, locate retains selection, desktop/mobile intent, other-site no-op and list-origin restoration');

