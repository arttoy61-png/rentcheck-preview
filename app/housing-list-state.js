(()=>{'use strict';
  const labels={active:'접수중·예정',all:'전체 보관 공고',open:'접수중',upcoming:'접수예정',closed:'접수 마감',unknown:'일정 확인 중'};
  const trusted=new Set(['verified_official_pdf','official_detail_html','verified_regression','verified_application_windows','official_notice_pdf']);
  const guarded=new Set(['SH:seq:310673','SH:seq:310041']);
  const DAY=86400000;
  function parse(value){const m=String(value||'').match(/^(20\d{2})-(\d{2})-(\d{2})$/);if(!m)return null;const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return d.toISOString().slice(0,10)===m[0]?m[0]:null;}
  function today(now=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
  function instant(v){
    const m=typeof v==='string'&&v.match(/^(20\d{2}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/);
    if(!m||!parse(m[1])||+m[2]>23||+m[3]>59||+(m[4]||0)>59)return null;
    const n=Date.parse(v);return Number.isFinite(n)?n:null;
  }
  function isSH(item){if(/^(?:SH:|SHYOUTH:)/i.test(String(item?.id||''))||[item?.agency_group,item?.agency].some(v=>String(v||'').toUpperCase()==='SH'))return true;try{const u=new URL(item?.official_url||item?.url||'');return u.protocol==='https:'&&['www.i-sh.co.kr','i-sh.co.kr'].includes(u.hostname);}catch(_){return false;}}
  function guardedNotice(item){if(guarded.has(item.id)||/신정도시마을.*잔여세대|2026년.*재개발임대주택.*일반모집/.test(item.title||''))return true;try{const u=new URL(item.official_url||item.url||'');return u.protocol==='https:'&&['www.i-sh.co.kr','i-sh.co.kr'].includes(u.hostname)&&guarded.has('SH:seq:'+u.searchParams.get('seq'));}catch(_){return false;}}
  function scheduleBounds(x){
    if(!trusted.has(x.schedule_source))return {start:null,end:null};
    const at=(value,day)=>{const t=instant(value);return t!==null&&today(new Date(t))===day?t:null;};
    const start=at(x.application_start_at,x.application_start);
    const end=x.deadline_precision==='minute'?at(x.deadline_at,x.deadline):null;
    return start!==null&&end!==null&&start>=end?{start:null,end:null}:{start,end};
  }
  function validWindow(w){
    if(!w||typeof w!=='object'||!parse(w.start)||!parse(w.end)||w.start>w.end||typeof w.conditional!=='boolean'||typeof w.restricted!=='boolean')return false;
    if(w.precision==='minute'){const a=instant(w.start_at),b=instant(w.end_at);return a!==null&&b!==null&&a<b&&today(new Date(a))===w.start&&today(new Date(b))===w.end;}
    return w.precision==='date'&&!w.start_at&&!w.end_at;
  }
  function dailyBounds(w,day){
    if(w.precision!=='minute'||!w.daily_hours)return null;
    const m=String(w.daily_hours).match(/^(\d{2}):(\d{2})\s*[~～–-]\s*(\d{2}):(\d{2})$/);
    if(!m||+m[1]>23||+m[2]>59||+m[3]>23||+m[4]>59)return null;
    const start=instant(`${day}T${m[1]}:${m[2]}:00+09:00`),end=instant(`${day}T${m[3]}:${m[4]}:00+09:00`);
    return start!==null&&end!==null&&start<end?{start:Math.max(start,instant(w.start_at)),end:Math.min(end,instant(w.end_at))}:null;
  }
  function nonRecruitment(item){return ['result','announcement','move_in','document','documents','document_submission','document_review','contract'].includes(item.notice_kind)||['not_applicable','result','announcement','document_submission','document_review'].includes(item.schedule_type)||/결과|서류제출/.test(item.event||'')||/발표|당첨|선정결과|서류심사\s*대상자|서류\s*(?:제출|접수)\s*(?:대상자|안내|공고|일정)|입주안내문|재계약\s*안내|최종\s*청약접수\s*결과/.test(item.title||'');}
  function withheld(item,type='unknown'){return {...item,application_start:'',application_start_at:'',deadline:'',deadline_at:'',deadline_precision:'unknown',application_windows:[],schedule_type:type,open_state:type==='not_applicable'?'해당 없음':'일정 확인',status_text:type==='not_applicable'?'신규 접수 대상 아님':'일정 확인 중'};}
  function normalize(item){
    if(nonRecruitment(item))return withheld(item,'not_applicable');
    const source=String(item.schedule_source||''),type=String(item.schedule_type||'');
    if((isSH(item)&&!trusted.has(source))||['unknown','not_applicable'].includes(type))return withheld(item);
    if(type==='rolling')return {...withheld(item,'rolling'),open_state:'상시모집',status_text:'상시모집 · 모집 여부 확인'};
    const ws=item.application_windows;
    if(ws!=null&&!Array.isArray(ws))return withheld(item);
    if(Array.isArray(ws)&&ws.length){
      if(!trusted.has(source)||!ws.every(validWindow))return withheld(item);
      return {...item,application_start:'',application_start_at:'',deadline:'',deadline_at:'',application_windows:ws.map(w=>({...w})),schedule_type:'windows',open_state:'대상별 일정 확인',status_text:'대상별 일정 확인'};
    }
    if((isSH(item)&&guardedNotice(item))||['windows','ranked','conditional','multiple','multi_window'].includes(type))return withheld(item);
    const start=parse(item.application_start),end=parse(item.deadline);
    if(!start||!end||start>end)return withheld(item);
    const a=instant(item.application_start_at),b=item.deadline_precision==='minute'?instant(item.deadline_at):null;
    if(trusted.has(source)&&a!==null&&b!==null&&today(new Date(a))===start&&today(new Date(b))===end&&a>=b)return withheld(item);
    return {...item,application_start:start,deadline:end,application_windows:[],schedule_type:'single'};
  }
  const recruitment=item=>!nonRecruitment(item);
  function windows(item){const x=normalize(item);return x.schedule_type==='windows'?x.application_windows:[];}
  function phase(w,day,now){
    if(day<w.start)return 'upcoming';if(day>w.end)return 'ended';
    if(day===today(now)&&w.precision==='minute'){
      if(+now<instant(w.start_at))return 'upcoming';if(+now>=instant(w.end_at))return 'ended';
      const hours=dailyBounds(w,day);
      if(hours&&(+now<hours.start||+now>=hours.end))return day<w.end||+now<hours.start?'upcoming':'ended';
    }
    return w.conditional?'conditional':w.restricted?'scoped':'open';
  }
  function state(item,day,now=new Date()){
    day=day||today(now);const x=normalize(item);
    if(x.schedule_type==='rolling')return 'rolling';
    if(['unknown','not_applicable'].includes(x.schedule_type))return 'unknown';
    const ws=windows(x);
    if(ws.length){const phases=ws.map(w=>phase(w,day,now));if(phases.every(s=>s==='ended'))return 'closed';if(phases.includes('open'))return 'open';if(phases.includes('scoped'))return 'scoped';if(ws.some((w,i)=>!w.conditional&&phases[i]==='upcoming'))return 'upcoming';return 'unknown';}
    if(x.deadline<day)return 'closed';if(x.application_start>day)return 'upcoming';
    if(day===today(now)){const at=scheduleBounds(x);if(at.start!==null&&+now<at.start)return 'upcoming';if(at.end!==null&&+now>=at.end)return 'closed';}
    return 'open';
  }
  function displayLabel(item,day,now=new Date()){
    day=day||today(now);const x=normalize(item),s=state(x,day,now);
    if(x.schedule_type==='not_applicable')return '신규 접수 대상 아님';
    if(s==='rolling')return '상시모집 · 모집 여부 확인';
    const ws=windows(x);
    if(ws.length){if(s==='closed')return '확인된 일정 종료';if(ws.some(w=>phase(w,day,now)==='conditional'))return '조건부 일정 · 시행 여부 확인';if(s==='upcoming')return '접수예정 · 대상별 일정 확인';if(s==='scoped')return '대상자 접수 · 순위 확인';return '대상별 접수일정 확인';}
    if(s==='open'&&scheduleBounds(x).end===null)return x.deadline===day?'오늘 접수마감일 · 시간 확인':'접수기간 · 시간 확인';
    return labels[s];
  }
  function windowPeriod(w){const short=v=>`${+v.slice(5,7)}/${+v.slice(8,10)}`;if(w.precision==='minute'){const stamp=v=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(v)).map(x=>[x.type,x.value]));return `${+p.month}/${+p.day} ${p.hour}:${p.minute}`;};return `${stamp(w.start_at)}~${stamp(w.end_at)} (한국시간)${w.daily_hours?' · 매일 '+w.daily_hours:''}`;}return `${short(w.start)}${w.start===w.end?'':'~'+short(w.end)} · 시간 미확인${w.end_rule==='received_by'?' · 마감일까지 도착 기준':''}`;}
  function scheduleText(item){
    const x=normalize(item),short=v=>parse(v)?`${+v.slice(5,7)}/${+v.slice(8,10)}`:'확인 중';
    if(x.schedule_type==='not_applicable')return '신규 신청일정 없음';
    if(x.schedule_type==='rolling')return ['상시모집 · 정해진 최종 마감일 없음',x.schedule_note||'현재 모집 여부는 운영기관 확인'].join(' · ');
    const ws=windows(x);
    if(ws.length)return ws.map(w=>`${w.label||'접수'} ${windowPeriod(w)}${w.conditional?' (조건부 · 시행 여부 확인)':''}${w.restricted?' (대상 제한)':''}`).join(' · ')+(x.schedule_note?' · '+x.schedule_note:'');
    if(x.schedule_type==='unknown')return '신청 일정 확인 중';
    const s=short(x.application_start),e=short(x.deadline),at=scheduleBounds(x),time=t=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(t));
    return `${s}${at.start!==null?' '+time(at.start):''}${s===e&&at.start===null?'':'~'+e} 신청${at.end!==null?' · '+time(at.end)+' 마감 (한국시간)':' · 마감시간 미확인'}${at.start===null?' · 시작시간 미확인':''}`;
  }
  function activeOn(item,day){const x=normalize(item);if(!parse(day))return false;const ws=windows(x);if(ws.length)return ws.some(w=>!w.conditional&&!w.restricted&&w.start<=day&&day<=w.end);return x.schedule_type==='single'&&x.application_start<=day&&day<=x.deadline;}
  function deadlineDays(item){const x=normalize(item),ws=windows(x);if(ws.length)return [...new Set(ws.filter(w=>!w.conditional&&!w.restricted).map(w=>w.end))];return x.schedule_type==='single'?[x.deadline]:[];}
  function matches(item,filter,day,now=new Date()){const s=state(item,day,now);return filter==='all'||(filter==='active'?['open','upcoming','rolling','scoped'].includes(s):s===filter);}
  function counts(items,day,now=new Date()){return Object.fromEntries(Object.keys(labels).map(k=>[k,items.filter(i=>matches(i,k,day,now)).length]));}
  // Always refresh at KST midnight for day-only schedules and the calendar's today marker.
  // Exact boundaries are accepted only from the same validated schedule used by state().
  function nextTransition(items,now=new Date()){
    if(!Number.isFinite(+now))return null;
    const day=today(now);let next=Date.parse(day+'T00:00:00+09:00')+DAY;
    const add=t=>{if(t!==null&&t>+now&&t<next)next=t;};
    for(const item of items||[]){
      const x=normalize(item);if(x._homeLink?.retained)continue;
      if(x.schedule_type==='single'){const at=scheduleBounds(x);add(at.start);add(at.end);}
      for(const w of windows(x)){if(w.precision!=='minute')continue;add(instant(w.start_at));add(instant(w.end_at));if(w.start<=day&&day<=w.end){const hours=dailyBounds(w,day);if(hours){add(hours.start);add(hours.end);}}}
    }
    return next;
  }
  window.RentCheckHousingList=Object.freeze({labels,today,state,matches,counts,pageSize:6,isSH,normalize,recruitment,windows,displayLabel,scheduleText,activeOn,deadlineDays,nextTransition,scheduleBounds,instant});
})();
