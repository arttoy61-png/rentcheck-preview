/* Read-only HOME feed adapter. Source records, official IDs, map keys and production files stay unchanged. */
(()=>{'use strict';
const HOME='https://rent-check.kr/public-housing/current.json';
const CACHE='rentcheck-public-home-calendar-v1';
const SCHEDULE=['application_start','application_start_at','deadline','deadline_at','deadline_precision','application_windows','schedule_type','schedule_source','schedule_note','schedule_text','schedule_evidence','sh_schedule_version','status_text','open_state'];
const COPY_SCHEDULE=SCHEDULE.concat(['start','end','status','status_label','status_as_of']);
const TRUST=new Set(['verified_official_pdf','official_detail_html','verified_regression','verified_application_windows','official_notice_pdf']);
const ALIASES={'SHYOUTH:23a63706ef0b942659cb':'SH:seq:310653','SHYOUTH:16da04d0f88309079939':'SH:seq:310258'};
const BASELINE={"SH:seq:311087":"93c91b667ee50f81ebf8ca54d09761dc60a249272afa6cdc85cf9c42a7a82ee6","LH:panId:2015122300020843":"01f81fd5cc3e65400bb08f3d20d199a594b3cb762f1ffc30221f825169a5aeb8","SHYOUTH:23a63706ef0b942659cb":"b6aa63c2be48ed5af08b5caf4c4d1e8fa6f205c72806bb8d3780448c9e28676d","SH:seq:310673":"fd4738e6853480c62e0351d2547e670a81dada2a501b176334de90021b70b6b3","LH:panId:2015122300020807":"f383d78ee653da0705bb83060a88a8cffc4af19b6bea5752f51b683b9a1fed1a","LH:panId:2015122300020753":"4a1fe8da162714f518c80163f7388146fb26e47e10a8be34ff0a72289a904fc1","LH:panId:2015122300020759":"bd66e6dbde22e4af2d561083778b6d821400e982c76e95b40d9c73da317806e2","LH:panId:2015122300020749":"bd66e6dbde22e4af2d561083778b6d821400e982c76e95b40d9c73da317806e2","LH:panId:2015122300020750":"bd66e6dbde22e4af2d561083778b6d821400e982c76e95b40d9c73da317806e2","SHYOUTH:16da04d0f88309079939":"5bdfbb5e309f91a03e5c7f3f96f80aba9173f00277308290f8481cb2e918b619","SHYOUTH:db00fb65694bea420e6b":"5bdfbb5e309f91a03e5c7f3f96f80aba9173f00277308290f8481cb2e918b619","SHYOUTH:2722eda65475422215a2":"44e4220d6167bd93f0b022ade28db115ae958fd6c3090c74f1f47d4bf133d671","SHYOUTH:ac0c542c9045e8e7d0ce":"fa3cb8d663d6dbb54c5e728df61d27715487285306b6071d52bf3cd51de8d26f","LH:panId:2015122300020605":"71d0e5e666da0538d2b77b92ecc5479833ee7e09ac537da3e1dc2e73c61a8ad0","LH:panId:2015122300020326":"15202877bae231cc022950400c1f766724b908089da3c7cf27d1537837540187","LH:panId:2015122300019941":"f539bf68377b79c4c9e3edcc9b12e14b0b4c7fc0a59f53e17ad9a48a6e12a90e","LH:panId:2015122300019968":"f539bf68377b79c4c9e3edcc9b12e14b0b4c7fc0a59f53e17ad9a48a6e12a90e","LH:panId:2015122300019890":"22e258a483f2b1bb0cd05e0186b7ee1708707273c2b1824f7e1c84328110f200","LH:panId:2015122300019657":"53251a23f7f8ac76a855f43fe9252641aa54f68819ba72fb4c9c8cc179781cf4","LH:panId:2015122300018941":"54ad4b664c3213590b2b04a7c3ce26fcc0ba98cbbb8a2b1b8af64a35c6440c95","LH:panId:2015122300019045":"8d5d7119e2b6d94fca55ff7bd48c26ec559f5e612f87d006dd30c955a7f61c24","SH:seq:310258":"5bdfbb5e309f91a03e5c7f3f96f80aba9173f00277308290f8481cb2e918b619","SH:seq:310653":"b6aa63c2be48ed5af08b5caf4c4d1e8fa6f205c72806bb8d3780448c9e28676d","SH:seq:310650":"b6aa63c2be48ed5af08b5caf4c4d1e8fa6f205c72806bb8d3780448c9e28676d"};
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const date=v=>{if(!/^20\d{2}-\d{2}-\d{2}$/.test(String(v||'')))return null;const d=new Date(v+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v?v:null;};
const instant=v=>typeof v==='string'&&/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v))?Date.parse(v):null;
const today=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['verified_at','checked_at','collected_at'].includes(k)).map(([k,val])=>[k,strip(val)])):v;
const signatureObject=x=>Object.fromEntries(SCHEDULE.filter(k=>!['open_state','status_text','sh_schedule_version'].includes(k)).map(k=>[k,strip(x[k]??null)]));
async function signature(x){const b=new TextEncoder().encode(JSON.stringify(sorted(signatureObject(x))));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function validate(feed){
 if(!feed||!Array.isArray(feed.items)||feed.items.length>10000)throw Error('invalid-feed');
 if(feed.recruitment_count!==undefined&&feed.recruitment_count!==feed.items.length)throw Error('count-mismatch');
 const ids=new Set();for(const n of feed.items){if(!n||typeof n.id!=='string'||!n.id||typeof n.title!=='string'||!n.title||ids.has(n.id))throw Error('invalid-record');ids.add(n.id);}
 // An unexplained empty upstream feed is not a successful deletion of all notices.
 if(!feed.items.length)throw Error('empty-feed');
 return feed;
}
function canonical(n,byId){const id=ALIASES[n.id],target=id&&byId.get(id);if(!target)return n.id;
 const clean=s=>String(s||'').replace(/^(매입|희망)(?=20\d{2})/,'').replace(/\s+/g,'');
 return clean(n.title)===clean(target.title)?id:n.id;
}
function safeHomeUrl(route){try{const u=new URL(route,'https://rent-check.kr');return u.origin==='https://rent-check.kr'&&u.pathname.startsWith('/public-housing/')?u.href:null;}catch{return null;}}
function partial(feed){return Object.values(feed.source_status||{}).some(x=>x&&typeof x==='object'&&(x.status==='부분수집'||x.status==='failure'||x.status==='failed'||x.errors?.length||x.diagnostic_errors?.length));}
function scheduleCopy(n){return Object.fromEntries(COPY_SCHEDULE.filter(k=>n[k]!==undefined).map(k=>[k,clone(n[k])]));}
async function merge(feed,archive,mode='live',checkedAt=new Date().toISOString()){
 validate(feed);const enrich=new Map((archive?.items||[]).map(n=>[n.id,n]));const byId=new Map(feed.items.map(n=>[n.id,n]));const groups=new Map();
 for(const n of feed.items){const id=canonical(n,byId);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(n);}
 const items=[],changes=[];
 for(const [id,group] of groups){const home=group.find(n=>n.id===id)||group[0],old=enrich.get(id);const unchanged=!!BASELINE[home.id]&&await signature(home)===BASELINE[home.id];const n={...clone(old||{}),...clone(home),id,canonical_id:id};
  // Preserve the verified detail layer only while the HOME schedule matches the audited baseline.
  // Changed schedule groups are applied atomically, never by mixing new dates and old times.
  if(old&&unchanged){for(const k of COPY_SCHEDULE)delete n[k];Object.assign(n,scheduleCopy(old));}
  else if(old){for(const k of COPY_SCHEDULE)delete n[k];Object.assign(n,scheduleCopy(home));changes.push(id);}
  if(old){for(const k of ['districts','district_coverage','district_evidence','addresses','address','sites','site_coverage','source_link_kind'])if(old[k]!==undefined&&(!home[k]||(Array.isArray(home[k])&&!home[k].length)))n[k]=clone(old[k]);
   if(home.title===old.original_title)n.title=old.title;
   if(!home.official_url&&old.source_link_kind==='official_detail'&&old.url)n.official_url=old.url;
  }
  n.housing_types=clone(home.housing_types||old?.housing_types||[]);n.audiences=clone(home.audiences||old?.audiences||[]);
  n.warnings=[...new Set([...(old&&unchanged?old.warnings||[]:[]),...(home.warnings||[])])];
  n.home_url=safeHomeUrl(home.route)||old?.home_url||null;
  n._homeLink={mode,source:HOME,generatedAt:feed.generated_at||null,sourceIds:group.map(r=>r.id),routes:group.map(r=>safeHomeUrl(r.route)).filter(Boolean),scheduleLayer:old&&unchanged?'verified-enrichment':'home',scheduleChanged:!!old&&!unchanged,previousSchedule:old&&!unchanged?scheduleCopy(old):null,retained:false};
  // Raw IDs remain in sourceIds. No source file/ID is deleted.
  items.push(n);enrich.delete(id);
 }
 for(const old of enrich.values())items.push({...clone(old),_homeLink:{mode,source:HOME,sourceIds:[old.id],retained:true,scheduleChanged:false,scheduleLayer:'archive'}});
 items.sort((a,b)=>String(b.published_at||'').localeCompare(String(a.published_at||''))||a.id.localeCompare(b.id));
 return {...clone(archive||{}),items,generated_at:feed.generated_at||null,source_generated_at:feed.source_generated_at||null,source_status:clone(feed.source_status||{}),total_raw_records:feed.items.length,total_canonical_notices:groups.size,home_link:{mode,source:HOME,checked_at:checkedAt,generated_at:feed.generated_at||null,raw_count:feed.items.length,canonical_count:groups.size,alias_count:feed.items.length-groups.size,retained_count:items.filter(n=>n._homeLink.retained).length,partial:partial(feed),changed_schedules:changes,stale:instant(feed.generated_at)!==null&&Date.now()-instant(feed.generated_at)>48*3600000}};
}
function readCache(){try{const c=JSON.parse(localStorage.getItem(CACHE));validate(c?.feed);return c;}catch{return null;}}
function saveCache(feed,checkedAt){try{if(JSON.stringify(feed).length<1500000)localStorage.setItem(CACHE,JSON.stringify({feed,checkedAt}));}catch{}}
async function load(archive,{fetchImpl=fetch,timeout=9000}={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);let failure='unavailable';
 try{const r=await fetchImpl(HOME,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});if(!r.ok)throw Error('http-'+r.status);const text=await r.text();if(text.length>5000000)throw Error('oversize-feed');const feed=validate(JSON.parse(text));const now=new Date().toISOString(),model=await merge(feed,archive,'live',now);saveCache(feed,now);return model;
 }catch(e){failure=e.name==='AbortError'?'timeout':/^(http-\d+|invalid-feed|invalid-record|count-mismatch|empty-feed|oversize-feed)$/.test(e.message)?e.message:'unavailable';
 }finally{clearTimeout(timer);}
 const cached=readCache();if(cached){try{const m=await merge(cached.feed,archive,'cached',cached.checkedAt);m.home_link.failure=failure;return m;}catch{}}
 if(archive?.items?.length)return {...clone(archive),home_link:{mode:'archive',source:HOME,failure,checked_at:null,generated_at:archive.generated_at||archive.checked_at||null,raw_count:archive.total_raw_records??archive.items.length,canonical_count:archive.items.length,alias_count:(archive.total_raw_records??archive.items.length)-archive.items.length,retained_count:0,partial:true,stale:true,changed_schedules:[]}};
 throw Error('no-calendar-source');
}
const core=window.RentCheckHousingList;
function validWindow(w){if(!w||!date(w.start)||!date(w.end)||w.start>w.end||typeof w.conditional!=='boolean'||typeof w.restricted!=='boolean')return false;if(w.precision==='minute'){const a=instant(w.start_at),b=instant(w.end_at);return a!==null&&b!==null&&a<b&&today(new Date(a))===w.start&&today(new Date(b))===w.end;}return !w.start_at&&!w.end_at;}
function normalize(n){if(core.isSH(n))return core.normalize(n);if(n.application_windows?.length){if(!TRUST.has(n.schedule_source)||!n.application_windows.every(validWindow))return {...n,application_start:'',deadline:'',application_windows:[],schedule_type:'unknown'};return {...n,application_windows:n.application_windows.map(w=>({...w})),schedule_type:'windows'};}return n;}
function windows(n){const x=normalize(n);return x.schedule_type==='windows'&&Array.isArray(x.application_windows)?x.application_windows:[];}
function phase(w,day,now){if(day<w.start)return'upcoming';if(day>w.end)return'closed';if(day===today(now)&&w.precision==='minute'){if(+now<instant(w.start_at))return'upcoming';if(+now>=instant(w.end_at))return'closed';}return w.conditional?'conditional':w.restricted?'scoped':'open';}
function state(n,day=today(),now=new Date()){
 const x=normalize(n);if(x._homeLink?.retained)return'unknown';const ws=windows(x);
 if(ws.length){const stages=ws.map(w=>phase(w,day,now));if(stages.every(s=>s==='closed'))return'closed';if(stages.includes('open'))return'open';if(stages.includes('scoped'))return'scoped';if(stages.some((s,i)=>s==='upcoming'&&!ws[i].conditional))return'upcoming';return'unknown';}
 if(['unknown','not_applicable'].includes(x.schedule_type))return'unknown';if(x.schedule_type==='rolling')return'rolling';
 const s=core.state(x,day,now);if(s==='open'&&day===today(now)){const start=instant(x.application_start_at),end=instant(x.deadline_at);if(start!==null&&+now<start)return'upcoming';if(end!==null&&+now>=end)return'closed';}return s;
}
const short=d=>date(d)?`${+d.slice(5,7)}/${+d.slice(8,10)}`:'미확인';
function stamp(t){if(instant(t)===null)return'시간 미확인';return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(t));}
function windowText(w){const period=w.precision==='minute'?`${stamp(w.start_at)} ~ ${stamp(w.end_at)} (한국시간)`:`${short(w.start)}${w.start!==w.end?'~'+short(w.end):''} · 시간 미확인`;return `${w.label||'접수'} · ${period}${w.daily_hours?' · 매일 '+w.daily_hours:''}${w.restricted?' · 대상 제한':''}${w.conditional?' · 조건부, 시행 여부 확인':''}${w.end_rule==='received_by'?' · 마감일까지 도착 기준':''}`;}
function scheduleText(n){const x=normalize(n),ws=windows(x);if(ws.length)return ws.map(windowText).join(' / ')+(x.schedule_note?' · '+x.schedule_note:'');return core.scheduleText(x);}
function displayLabel(n,day=today(),now=new Date()){const x=normalize(n),s=state(x,day,now);if(x._homeLink?.retained)return'홈 목록에서 미확인 · 보관 자료';const ws=windows(x);if(ws.length){if(s==='closed')return'확인된 일정 종료';if(ws.some(w=>phase(w,day,now)==='conditional'))return'조건부 일정 · 시행 확인';if(s==='scoped')return'대상자 접수 · 순위 확인';return'대상별 접수일정 확인';}return s==='scoped'?'대상자 접수':s==='rolling'?'상시모집 · 모집 여부 확인':core.labels[s]||core.displayLabel(x,day,now);}
function eventsOn(n,day){const x=normalize(n),labels=[];if(!date(day)||x._homeLink?.retained)return labels;if(x.published_at===day)labels.push('공고');const ws=windows(x);const general=ws.length?ws.filter(w=>!w.conditional&&!w.restricted):['unknown','not_applicable','rolling'].includes(x.schedule_type)?[]:[{start:x.application_start,end:x.deadline}];for(const w of general){if(date(w.start)&&date(w.end)&&w.start<=day&&day<=w.end)labels.push('접수');if(date(w.end)&&w.end===day)labels.push('마감');}return [...new Set(labels)];}
function matches(n,filter,day){const s=state(n,day);return filter==='all'||(filter==='active'?['open','upcoming','rolling','scoped'].includes(s):s===filter);}
function summary(n){const x=normalize(n),ws=windows(x);if(ws.length===1&&!ws[0].restricted&&!ws[0].conditional){const w=ws[0];return {start:w.precision==='minute'?stamp(w.start_at):w.start,end:w.precision==='minute'?stamp(w.end_at):w.end,multiple:false};}if(ws.length)return {start:'대상·순위별로 다름',end:'아래 접수 일정 확인',multiple:true};return {start:date(x.application_start)?(instant(x.application_start_at)!==null?stamp(x.application_start_at):x.application_start):'미확인',end:date(x.deadline)?(instant(x.deadline_at)!==null?stamp(x.deadline_at):x.deadline):'미확인',multiple:false};}
function statusText(m){if(!m)return'현재 홈 공고 원장 연결 준비';const mode={live:'현재 홈 공고 원장 연결',cached:'홈 연결 실패 · 마지막 정상본',archive:'홈 연결 실패 · 프리뷰 보관본'}[m.mode]||'홈 공고 원장';return `${mode} · 원장 ${m.raw_count}개 / 중복 구분 ${m.canonical_count}개${m.partial?' · 일부 수집':''}${m.stale?' · 보관 시점 확인':''}`;}
window.RentCheckHousingList=Object.freeze({...core,normalize,windows,state,matches,displayLabel,scheduleText,counts:(items,day)=>Object.fromEntries(Object.keys(core.labels).map(k=>[k,items.filter(n=>matches(n,k,day)).length])),activeOn:(n,day)=>eventsOn(n,day).includes('접수'),deadlineDays:n=>{const x=normalize(n),ws=windows(x);return ws.length?[...new Set(ws.filter(w=>!w.conditional&&!w.restricted).map(w=>w.end))]:date(x.deadline)?[x.deadline]:[];}});
window.RentCheckHomeCalendar=Object.freeze({load,merge,validate,signature,eventsOn,summary,statusText,source:HOME,windowText});
})();
