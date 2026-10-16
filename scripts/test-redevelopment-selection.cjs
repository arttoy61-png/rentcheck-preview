const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {records,sandbox}=require('./audit-redevelopment-records.cjs');
const src=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8');
const scope={boundaryStatus:()=>'ready',boundaryPanel:()=>'',routeFor:p=>'#map/redevelopment?site='+p.selected,window:sandbox.window,esc:s=>String(s??''),link:(url,label)=>`<a href="${url}">${label}</a>`,tool:()=>'<a href="https://rent-check.kr/calc/">내부 도구</a>',projectRecordDetail:p=>sandbox.window.RentRedevelopmentCard.header(p)+sandbox.window.RentRedevelopmentStatus.renderCurrent(p),projectHistory:p=>JSON.stringify(p.events||[])};vm.createContext(scope);
vm.runInContext(src.split('\n').find(l=>l.startsWith('function selectedRedevelopmentBody(')),scope);
const p=records.find(p=>p.title.includes('긴등마을')),before=JSON.stringify(records);assert.ok(p);
for(const tab of ['sites','changes','calculator','related']){const html=scope.selectedRedevelopmentBody(p,tab);assert.ok(html.includes(p.title));assert.ok(html.includes('전체 목록으로'));assert.ok(!html.includes('등촌2동 모아타운'));assert.ok(!html.includes('화곡동 1130-7'));}
assert.equal(JSON.stringify(records),before);
const externalScope={URL,location:{href:'https://arttoy61-png.github.io/rentcheck-preview/'},window:{},MutationObserver:class{observe(){}},document:{body:{classList:{contains:()=>false}},querySelectorAll:()=>[],addEventListener(){}}};vm.createContext(externalScope);vm.runInContext(fs.readFileSync(path.join(__dirname,'../app/redevelopment-external-links.js'),'utf8'),externalScope);
const isExternal=externalScope.window.RentRedevelopmentExternalLinks.isExternal,origin=externalScope.location.href;
assert.equal(isExternal('https://cleanup.seoul.go.kr/cleanup/',origin),true);assert.equal(isExternal('https://www.raemian.co.kr/sales/',origin),true);assert.equal(isExternal('http://map.kakao.com/',origin),true);assert.equal(isExternal('#map/redevelopment',origin),false);assert.equal(isExternal('https://rent-check.kr/calc/',origin),false);assert.equal(isExternal('/rentcheck-preview/',origin),false);
const sourceHref=externalScope.window.RentRedevelopmentExternalLinks.sourceHref;
for(const value of [null,undefined,'','null','undefined','#','javascript:alert(1)','/missing-source'])assert.equal(sourceHref(value),null);
assert.equal(sourceHref('https://cleanup.seoul.go.kr/cafe/mainIndx.do?cafeUrl=hwagok_a1'),'https://cleanup.seoul.go.kr/cafe/mainIndx.do?cafeUrl=hwagok_a1');
const missing={dataset:{},getAttribute:()=>null,replaceWith(node){this.replacement=node;}};
const knownUnavailable={dataset:{},getAttribute:()=> 'https://cleanup.seoul.go.kr/cafe/mainIndx.do?cafeUrl=unavailable',replaceWith(node){this.replacement=node;}};
externalScope.document.body.classList.contains=()=>true;
externalScope.document.createElement=tag=>({tag});
externalScope.document.querySelectorAll=()=>[missing,knownUnavailable];
externalScope.window.PROJECTS=[{source:knownUnavailable.getAttribute(),detail_status:'official_page_not_found'}];
externalScope.window.RentRedevelopmentExternalLinks.sync();
assert.equal(missing.replacement.tag,'p');assert.equal(missing.replacement.textContent,'공식 자료 링크 미확인');
assert.equal(knownUnavailable.replacement.textContent,'공식 상세자료 미확인');
assert.ok(!missing.replacement.textContent.includes('↗'));
console.log('PASS citywide selected-ID tab content, original records preserved, external source classification and own-site navigation');

const card=sandbox.window.RentRedevelopmentCard;
assert.ok(card.transactions({district:'강서구'}).includes('개별 거래 취소 여부'));
assert.ok(card.transactions({district:'강서구'}).includes('data-tab="transactions"'));
assert.ok(!card.transactions({district:'마포구'}).includes('data-tab="transactions"'));
vm.runInContext(src.split('\n').find(l=>l.startsWith('function freshRedevelopmentEntryPatch(')),scope);
assert.equal(scope.freshRedevelopmentEntryPatch({page:'map',tab:'redevelopment'},{},false).district,'all');
assert.equal(scope.freshRedevelopmentEntryPatch({page:'map',tab:'redevelopment'},{selected:p.id},false),null);
assert.equal(scope.freshRedevelopmentEntryPatch({page:'map',tab:'redevelopment'},{},true),null);
for(const tab of ['housing','transactions','sale','auction'])assert.equal(scope.freshRedevelopmentEntryPatch({page:'map',tab},{},false),null);
assert.equal(scope.freshRedevelopmentEntryPatch({page:'tools',tab:'redevelopment'},{},false),null);
assert.ok(src.includes("listScroll:state.tab==='redevelopment'?0:"),'selected panel must start at its title');
assert.ok(src.includes('if(selected&&!detailShown)renderSelectedRedevelopment(selected);'),'async boundary outcome must reach the selected panel');
console.log('PASS Gangseo-only internal trade navigation with cancellation/join limitations; fresh redevelopment entry Seoul-wide, explicit links/history/other topics preserved');

const summaryHTML=scope.selectedRedevelopmentBody(p,'sites');
assert.equal((summaryHTML.match(/class="project-stage-banner"/g)||[]).length,1);
assert.ok(summaryHTML.indexOf(p.title)<summaryHTML.indexOf('project-stage-banner'));
assert.ok(summaryHTML.indexOf('project-stage-banner')<summaryHTML.indexOf('전체 목록으로'));
assert.ok(!summaryHTML.includes('class="project-card-heading"'));
assert.ok(!summaryHTML.includes('class="boundary-state"'));
console.log('PASS selected summary: name then single current-stage card, compact actions, no duplicate heading or full boundary notice');

assert.ok(src.includes("{push:!(state.tab==='redevelopment'&&state.selected)}"),'selected subtabs must replace the selected entry so Back returns to the original district list');
