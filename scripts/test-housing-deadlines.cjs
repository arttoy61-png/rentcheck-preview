#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const FIXED='2026-10-12T15:00:00.000Z';
class FixedDate extends Date {constructor(...args){super(...(args.length?args:[FIXED]));}static now(){return Date.parse(FIXED);}}
function setup(wrapped=true){
 const saved=new Map(),context={window:{},URL,Intl,Date:FixedDate,TextEncoder,crypto:webcrypto,AbortController,setTimeout,clearTimeout,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},fetch:async()=>{throw Error('offline');}};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(ROOT,'app/housing-list-state.js'),'utf8'),context);
 if(wrapped)vm.runInContext(fs.readFileSync(path.join(ROOT,'app/home-calendar-link.js'),'utf8'),context);
 return {...context.window,saved};
}
const contexts=[setup(false),setup(true)];
const core=contexts[1].RentCheckHousingList,cal=contexts[1].RentCheckHomeCalendar;
const clone=x=>JSON.parse(JSON.stringify(x));
const asDate=s=>new Date(s);
const t=s=>Date.parse(s);
const single=(extra={})=>({id:'LH:test',agency:'LH',title:'검증된 입주자 모집공고',schedule_source:'official_detail_html',schedule_type:'single',application_start:'2026-10-14',application_start_at:'2026-10-14T10:00:00+09:00',deadline:'2026-10-16',deadline_at:'2026-10-16T16:00:00+09:00',deadline_precision:'minute',application_windows:[],...extra});
const win=(extra={})=>({start:'2026-10-14',end:'2026-10-16',start_at:'2026-10-14T10:00:00+09:00',end_at:'2026-10-16T16:00:00+09:00',precision:'minute',conditional:false,restricted:false,...extra});
const windowed=(ws=[win()],extra={})=>single({id:'SH:test',agency:'SH',application_windows:ws,schedule_type:'windows',...extra});
const feed=items=>({items,recruitment_count:items.length,generated_at:FIXED,source_status:{SH:{status:'success'}}});
let passed=0;
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
async function main(){
 for(const [index,c] of contexts.entries()){
  const api=c.RentCheckHousingList,tag=index?'HOME wrapper':'core';
  await check(tag+': exact KST start/end, inclusive start and exclusive end',()=>{
   for(const agency of ['LH','SH']){
    const n=single({id:agency+':test',agency});
    assert.equal(api.state(n,undefined,asDate('2026-10-14T09:59:59+09:00')),'upcoming');
    assert.equal(api.state(n,undefined,asDate('2026-10-14T10:00:00+09:00')),'open');
    assert.equal(api.state(n,undefined,asDate('2026-10-16T15:59:59+09:00')),'open');
    assert.equal(api.state(n,undefined,asDate('2026-10-16T16:00:00+09:00')),'closed');
    assert.equal(api.displayLabel(n,undefined,asDate('2026-10-16T16:00:00+09:00')),'접수 마감');
    assert.equal(api.matches(n,'active',undefined,asDate('2026-10-16T16:00:00+09:00')),false);
    assert.equal(api.counts([n],undefined,asDate('2026-10-16T16:00:00+09:00')).closed,1);
   }
  });
  await check(tag+': date-only time remains unknown through KST midnight',()=>{
   const n=single({deadline_precision:'date',application_start_at:undefined,deadline_at:'2026-10-16T16:00:00+09:00'});
   assert.equal(api.state(n,undefined,asDate('2026-10-16T23:59:59+09:00')),'open');
   assert.equal(api.state(n,undefined,asDate('2026-10-17T00:00:00+09:00')),'closed');
   assert.match(api.displayLabel(n,undefined,asDate('2026-10-16T18:00:00+09:00')),/시간 확인/);
   assert.match(api.scheduleText(n),/마감시간 미확인/);assert.doesNotMatch(api.scheduleText(n),/16:00|23:59/);
  });
  await check(tag+': trust, KST date consistency and strict timestamp parsing',()=>{
   for(const deadline_at of ['2026-10-15T16:00:00+09:00','2026-10-16T24:00:00+09:00','2026-10-16T16:00:00','2026-02-30T16:00:00+09:00']){
    const n=single({deadline_at});assert.equal(api.state(n,undefined,asDate('2026-10-16T18:00:00+09:00')),'open');assert.match(api.scheduleText(n),/마감시간 미확인/);
   }
   assert.equal(api.state(single({schedule_source:'source_list'}),undefined,asDate('2026-10-16T18:00:00+09:00')),'open');
   assert.equal(api.state(single({id:'SH:test',agency:'SH',schedule_source:'source_list'})),'unknown');
   assert.equal(api.state(single({application_start_at:'2026-10-14T01:00:00Z'}),undefined,asDate('2026-10-14T09:59:59+09:00')),'upcoming');
   assert.equal(api.instant('2026-02-30T10:00:00+09:00'),null);
   assert.equal(api.state(single({application_start:'2026-10-16',application_start_at:'2026-10-16T18:00:00+09:00'}),undefined,asDate('2026-10-16T15:00:00+09:00')),'unknown');
  });
  await check(tag+': precise multi-window phases and conditional/restricted separation',()=>{
   const n=windowed();assert.equal(api.state(n,undefined,asDate('2026-10-14T09:59:59+09:00')),'upcoming');assert.equal(api.state(n,undefined,asDate('2026-10-14T10:00:00+09:00')),'open');assert.equal(api.state(n,undefined,asDate('2026-10-16T16:00:00+09:00')),'closed');
   assert.equal(api.state(windowed([win({restricted:true})]),undefined,asDate('2026-10-15T12:00:00+09:00')),'scoped');
   const conditional=windowed([win({conditional:true,restricted:true})]);
   assert.equal(api.state(conditional,undefined,asDate('2026-10-15T12:00:00+09:00')),'unknown');assert.equal(api.matches(conditional,'active',undefined,asDate('2026-10-15T12:00:00+09:00')),false);
   assert.equal(api.activeOn(conditional,'2026-10-15'),false);assert.equal(api.deadlineDays(conditional).length,0);
  });
  await check(tag+': invalid windows cannot fall back to old single dates',()=>{
   for(const bad of [win({start_at:'2026-10-13T10:00:00+09:00'}),win({precision:'guess'}),win({restricted:undefined}),win({end_at:'2026-10-14T09:00:00+09:00'}),win({precision:'date'})])assert.equal(api.state(windowed([bad])),'unknown');
   assert.equal(api.state(windowed([])),'unknown');assert.equal(api.state(windowed([win()],{schedule_source:'unverified'})),'unknown');
  });
  await check(tag+': daily visit hours close between sessions',()=>{
   const n=windowed([win({daily_hours:'10:00~16:00',restricted:true})]);
   assert.equal(api.state(n,undefined,asDate('2026-10-15T09:59:59+09:00')),'upcoming');
   assert.equal(api.state(n,undefined,asDate('2026-10-15T10:00:00+09:00')),'scoped');
   assert.equal(api.state(n,undefined,asDate('2026-10-15T16:00:00+09:00')),'upcoming');
   assert.equal(api.nextTransition([n],asDate('2026-10-15T09:00:00+09:00')),t('2026-10-15T10:00:00+09:00'));
  });
  await check(tag+': historical day queries do not borrow the real-time clock',()=>{
   assert.equal(api.state(single(),'2026-10-14',asDate('2026-10-16T18:00:00+09:00')),'open');
   assert.equal(api.state(windowed(),'2026-10-13',asDate('2026-10-15T12:00:00+09:00')),'upcoming');
   assert.equal(api.state(windowed(),'2026-10-17',asDate('2026-10-15T12:00:00+09:00')),'closed');
  });
  await check(tag+': next transition is earliest trusted time or next KST midnight',()=>{
   assert.equal(api.nextTransition([single()],asDate('2026-10-14T09:59:59+09:00')),t('2026-10-14T10:00:00+09:00'));
   assert.equal(api.nextTransition([single()],asDate('2026-10-16T15:59:59+09:00')),t('2026-10-16T16:00:00+09:00'));
   assert.equal(api.nextTransition([single()],asDate('2026-10-16T16:00:00+09:00')),t('2026-10-17T00:00:00+09:00'));
   assert.equal(api.nextTransition([single({deadline_precision:'date'})],asDate('2026-10-16T15:00:00+09:00')),t('2026-10-17T00:00:00+09:00'));
   assert.equal(api.nextTransition([windowed()],asDate('2026-10-14T09:59:59+09:00')),t('2026-10-14T10:00:00+09:00'));
   assert.equal(api.nextTransition([],asDate('2026-10-14T23:59:59+09:00')),t('2026-10-15T00:00:00+09:00'));
   assert.equal(api.nextTransition([single({_homeLink:{retained:true}})],asDate('2026-10-14T09:00:00+09:00')),t('2026-10-15T00:00:00+09:00'));
   assert.equal(api.nextTransition([],new Date(NaN)),null);
  });
  await check(tag+': results and document notices never reopen as recruitment',()=>{
   for(const kind of ['result','document_submission','document_review'])for(const agency of ['LH','SH']){
    const n=single({notice_kind:kind,id:agency+':test',agency});assert.equal(api.state(n,undefined,asDate('2026-10-15T12:00:00+09:00')),'unknown');assert.equal(api.recruitment(n),false);assert.equal(api.activeOn(n,'2026-10-15'),false);assert.equal(api.deadlineDays(n).length,0);assert.match(api.displayLabel(n),/신규 접수 대상 아님/);
   }
   assert.equal(api.state(single({title:'서류제출 대상자 안내'}),undefined,asDate('2026-10-15T12:00:00+09:00')),'unknown');
  });
 }
 await check('summary never displays untrusted or mismatched exact times',()=>{
  for(const extra of [{deadline_precision:'date'},{deadline_at:'2026-10-15T16:00:00+09:00'},{schedule_source:'source_list'}])assert.match(cal.summary(single(extra)).end,/시간 미확인/);
  assert.match(cal.summary(single({application_start_at:undefined})).start,/시간 미확인/);
 });
 await check('retained history preserves publication, results and documents without recruitment',()=>{
  const n=single({notice_kind:'result',published_at:'2026-10-19',_homeLink:{retained:true},events:[{kind:'result',date:'2026-10-19'},{kind:'document_submission',start:'2026-10-20',end:'2026-10-23'},{kind:'application',date:'2026-10-20'}]});
  assert.deepEqual(clone(cal.eventsOn(n,'2026-10-19')),['공고','발표']);
  assert.deepEqual(clone(cal.eventsOn(n,'2026-10-21')),['서류제출']);assert.equal(core.state(n),'unknown');assert.equal(core.matches(n,'all'),true);assert.equal(core.matches(n,'active'),false);assert.equal(core.activeOn(n,'2026-10-21'),false);
  assert.deepEqual(clone(cal.eventsOn(single({_homeLink:{retained:true}}),'2026-10-16')),['접수','마감']);
 });
 await check('calendar never extracts application/result dates from prose',()=>{
  const n=single({deadline:'2026-10-16',schedule_note:'서류제출 10/21~10/23, 발표 10/28',events:[{kind:'result',date:'2026-02-30'},{kind:'document_submission',start:'2026-10-23',end:'2026-10-21'}]});assert.deepEqual(clone(cal.eventsOn(n,'2026-10-21')),[]);assert.deepEqual(clone(cal.eventsOn(n,'2026-10-28')),[]);
 });
 const baseline=single({id:'SH:seq:311087',agency:'SH',title:'강동구 청년창업가,예술인주택(수요자맞춤형) 잔여세대 모집 공고',application_start:'2026-10-08',application_start_at:undefined,deadline:'2026-10-22',deadline_at:'2026-10-22T15:00:00+09:00',schedule_note:'공식 상세본문 신청기간 기준입니다. 정확한 접수시각과 대상은 공고문을 확인하세요.',schedule_evidence:{url:'https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_241/view.do?seq=311087',kind:'official_notice_body',excerpt:'접수기간 : 2026.10.08.(목) ~2026.10.22.(목) 15시까지',verified_at:'2026-10-12T09:33:47'}});
 const archive={items:[{...baseline,schedule_note:'보강된 공식 상세 주의사항',events:[{kind:'result',date:'2026-11-01'}]}]};
 await check('baseline signature remains compatible with the audited atomic merge',async()=>{
  const unchanged={id:'SH:seq:310653',agency:'SH',title:'2026년 하반기 신혼·신생아 매입임대주택Ⅱ 입주자 모집공고(2026.09.30.)',application_start:'2026-10-13',deadline:'2026-10-15',schedule_type:'single',deadline_precision:'date',schedule_source:'verified_regression',schedule_note:'공식 공고 검증 일정입니다. 접수시각과 대상은 공고문을 확인하세요.',application_windows:[],schedule_evidence:{}};
  assert.equal(await cal.signature(unchanged),'b6aa63c2be48ed5af08b5caf4c4d1e8fa6f205c72806bb8d3780448c9e28676d');
  const enriched={...unchanged,schedule_note:'보강된 공식 상세 주의사항',schedule_type:'windows',application_windows:[win()]};
  const m=await cal.merge(feed([unchanged]),{items:[enriched]});assert.equal(m.items[0]._homeLink.scheduleLayer,'verified-enrichment');assert.equal(m.items[0].schedule_note,enriched.schedule_note);assert.equal(m.items[0].application_windows.length,1);assert.equal(m.home_link.changed_schedules.length,0);
 });
 await check('verified extension atomically replaces old deadline and precise time',async()=>{
  const change={...baseline,deadline:'2026-10-23',deadline_at:'2026-10-23T18:00:00+09:00',schedule_note:'공식 연장 공고'};
  const m=await cal.merge(feed([change]),archive),n=m.items[0];assert.equal(n._homeLink.scheduleChanged,true);assert.equal(n.deadline_at,change.deadline_at);assert.equal(n._homeLink.previousSchedule.deadline_at,baseline.deadline_at);assert.equal(core.state(n,undefined,asDate('2026-10-22T16:00:00+09:00')),'open');assert.equal(core.state(n,undefined,asDate('2026-10-23T18:00:00+09:00')),'closed');assert.equal(n.events.length,1);
 });
 await check('date-only correction removes old precise timestamp and stale windows',async()=>{
  const change={...baseline,deadline:'2026-10-23',deadline_precision:'date',schedule_note:'공식 날짜 정정'};delete change.deadline_at;
  const old={...archive.items[0],application_windows:[win()]};const n=(await cal.merge(feed([change]),{items:[old]})).items[0];assert.equal(n.deadline_at,undefined);assert.equal(n.application_windows.length,0);assert.match(core.scheduleText(n),/마감시간 미확인/);assert.equal(core.state(n,undefined,asDate('2026-10-23T23:59:59+09:00')),'open');
 });
 await check('corrected multiple windows never borrow old scalar dates/times',async()=>{
  const change={id:baseline.id,agency:'SH',title:baseline.title,schedule_type:'windows',schedule_source:'verified_application_windows',application_windows:[win({start:'2026-10-22',end:'2026-10-23',start_at:'2026-10-22T11:00:00+09:00',end_at:'2026-10-23T18:00:00+09:00'})]};
  const n=(await cal.merge(feed([change]),archive)).items[0];assert.equal(n.deadline,undefined);assert.equal(n.deadline_at,undefined);assert.equal(n.application_start,undefined);assert.equal(core.state(n,undefined,asDate('2026-10-22T10:59:59+09:00')),'upcoming');assert.equal(core.state(n,undefined,asDate('2026-10-23T18:00:00+09:00')),'closed');
 });
 await check('partial current feed retains archived result/document records',async()=>{
  const historical=single({id:'LH:historic',notice_kind:'result',events:[{kind:'result',date:'2026-10-14'},{kind:'document_submission',date:'2026-10-15'}]});
  const f=feed([baseline]);f.source_status.SH.status='부분수집';const m=await cal.merge(f,{items:[...archive.items,historical]});const n=m.items.find(n=>n.id===historical.id);assert.equal(m.home_link.partial,true);assert.equal(m.home_link.retained_count,1);assert.equal(n._homeLink.retained,true);assert.deepEqual(clone(cal.eventsOn(n,'2026-10-15')),['서류제출']);assert.equal(core.matches(n,'active'),false);
 });
 await check('live -> cache -> archive fallback does not erase notices',async()=>{
  const c=setup(),api=c.RentCheckHomeCalendar;
  assert.equal((await api.load(archive,{fetchImpl:async()=>({ok:true,text:async()=>JSON.stringify(feed([baseline]))})})).home_link.mode,'live');
  const cached=await api.load(archive,{fetchImpl:async()=>{throw Error('offline');}});assert.equal(cached.home_link.mode,'cached');assert.equal(cached.items.length,1);
  c.saved.clear();const fallback=await api.load(archive,{fetchImpl:async()=>({ok:true,text:async()=>JSON.stringify(feed([]))})});assert.equal(fallback.home_link.mode,'archive');assert.equal(fallback.home_link.failure,'empty-feed');assert.equal(fallback.items.length,1);
 });
 await check('checked-in archive regression: trusted active records and expired windows',()=>{
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,'app/data/public-notices.json'))),now=asDate('2026-10-13T00:00:00+09:00');
  assert.equal(data.items.length,22);assert.equal(data.items.filter(n=>core.state(n,undefined,now)==='open').length,1);assert.equal(data.items.filter(n=>core.state(n,undefined,now)==='upcoming').length,3);assert.equal(data.items.filter(n=>core.state(n,undefined,now)==='closed').length,18);
  const sh=data.items.find(n=>n.id==='SH:seq:310653');assert.equal(core.nextTransition(data.items,now),t('2026-10-13T10:00:00+09:00'));assert.equal(core.state(sh,undefined,asDate('2026-10-15T17:00:00+09:00')),'closed');
  for(const n of data.items)assert.doesNotThrow(()=>{core.normalize(n);core.scheduleText(n);cal.summary(n);cal.eventsOn(n,'2026-10-13');});
 });
 console.log(`\n${passed} housing deadline/state tests passed; 0 failures.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
