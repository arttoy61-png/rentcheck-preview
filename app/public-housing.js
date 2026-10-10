(()=>{'use strict';
const $=id=>document.getElementById(id);
const LH='LH:panId:2015122300020843',isMap=document.body.dataset.view==='map';
const core=window.RentCheckHousingList,cal=window.RentCheckHomeCalendar;
const today=core.today(),st={month:today.slice(0,7),day:today,all:false,id:null};
let model=null,supply=null,archive=null,map=null,markers=[],sdkReady=false,sdkLoading=false;
const entries=()=>model?.items||[];
const byId=id=>entries().find(n=>n.id===id);
const events=(n,d)=>cal.eventsOn(n,d);
const forDay=d=>entries().filter(n=>events(n,d).length);
const siteList=n=>n?.id===LH&&supply?.sites?.length?supply.sites:null;
const coord=s=>Number.isFinite(s?.lat)&&Number.isFinite(s?.lng)&&s.lat>33&&s.lat<39&&s.lng>124&&s.lng<132;
const mapped=n=>(siteList(n)||[]).filter(coord);
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:null}catch{return null}};
const official=n=>n?.official_url||n?.url||n?.source_url||null;
const link=(u,label,cls='inline')=>{const v=safeUrl(u);return v?'<a class="'+cls+'" href="'+esc(v)+'" rel="noopener noreferrer" target="_blank">'+esc(label)+' ↗</a>':'';};
const detailNotice=()=>byId(st.id);
const status=()=>{if(model)$('dataStatus').textContent=cal.statusText(model.home_link)};
function siteSummary(n){const s=siteList(n);return s?'공급현장 '+s.length+'곳 · 공급 '+s.reduce((v,x)=>v+(Number(x.unit_count)||0),0)+'호 · 위치 확인 '+s.filter(coord).length+'곳':'공급현장 위치 자료 미연결';}
function noticeCard(n){const labels=st.day?events(n,st.day):[];return '<button class="noticecard" data-id="'+esc(n.id)+'"><span class="label">'+esc(n.agency||'모집')+' · '+esc(core.displayLabel(n))+'</span><strong>'+esc(n.title)+'</strong><small>'+esc(labels.length?labels.join(' · '):n.published_at||'공고일 미확인')+' · '+esc(cal.scheduleText(n))+'</small><small>'+esc(siteSummary(n))+'</small></button>';}
