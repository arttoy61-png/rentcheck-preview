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
function noticeCard(n){const labels=st.day?events(n,st.day):[];return '<button class="noticecard" data-id="'+esc(n.id)+'"><span class="label">'+esc(n.agency||'모집')+' · '+esc(core.displayLabel(n))+'</span><strong>'+esc(n.title)+'</strong><small>'+esc(labels.length?labels.join(' · '):n.published_at||'공고일 미확인')+' · '+esc(core.scheduleText(n))+'</small><small>'+esc(siteSummary(n))+'</small></button>';}
// Calendar UI
function monthShift(n){const [y,m]=st.month.split('-').map(Number),d=new Date(y,m-1+n,1);st.month=d.getFullYear()+'-'+pad(d.getMonth()+1);st.day=null;st.all=false;st.id=null;render();}
function renderCalendar(){const [y,m]=st.month.split('-').map(Number);$('monthTitle').textContent=y+'년 '+m+'월';const first=new Date(y,m-1,1).getDay();let html='';for(let i=0;i<42;i++){const dt=new Date(y,m-1,1-first+i),day=dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());const all=forDay(day),tags=all.flatMap(n=>events(n,day)),dots=['공고','접수','마감'].filter(t=>tags.includes(t));
html+='<button class="day'+(day.slice(0,7)!==st.month?' other':'')+(day===st.day?' active':'')+(day===today?' today':'')+'" data-day="'+day+'" aria-pressed="'+(day===st.day)+'"><span class="daynum">'+dt.getDate()+'</span><span class="events">'+dots.map(t=>'<i class="'+(t==='접수'?'apply':t==='마감'?'end':'')+'"></i>').join('')+'</span>'+(all.length?'<span class="eventcount">'+all.length+'건</span>':'')+'</button>';} $('calendarDays').innerHTML=html;}
function renderList(){const rows=st.all?entries():st.day?forDay(st.day):[];$('selectedDate').textContent=st.all?'기존 홈 원장의 전체 모집공고':st.day?st.day+' · 공고일 / 접수일 / 마감일':'날짜를 선택해 주세요';$('noticeCount').textContent=rows.length+'개 공고';$('noticeList').innerHTML=rows.length?rows.map(noticeCard).join(''):'<p class="empty">선택 날짜의 확인된 공고가 없습니다. 날짜를 바꾸거나 전체 공고를 확인하세요.</p>';}
function renderDetail(){const box=$('noticeDetail'),n=detailNotice();box.hidden=!n;if(!n)return;const period=cal.summary(n);box.innerHTML='<button class="backlink" id="detailBack">← 공고 목록으로</button><small>'+esc(n.agency||'공고')+' · '+esc(core.displayLabel(n))+'</small><h2 id="detailTitle">'+esc(n.title)+'</h2>';
box.innerHTML+='<dl class="meta"><dt>공고일</dt><dd>'+esc(n.published_at||'미확인')+'</dd><dt>접수 시작</dt><dd>'+esc(period.start)+'</dd><dt>접수 마감</dt><dd>'+esc(period.end)+'</dd><dt>공급지역</dt><dd>'+esc((n.districts||[]).join(' · ')||'원문 확인')+'</dd></dl><p>'+esc(core.scheduleText(n))+'</p><p>'+esc(n.schedule_note||'세부 신청요건과 시간은 공식 원문을 확인하세요.')+'</p>';
box.innerHTML+='<p>'+esc(siteSummary(n))+'</p>'+(mapped(n).length?'<a class="action" href="public-housing-map.html?id='+encodeURIComponent(n.id)+'">이 공고 공급현장 지도 보기 →</a>':'<p class="subtext">지도 위치 자료 미연결 · 공식 공고 원문에서 확인</p>')+link(official(n),'기관 공식 공고 보기','action secondary')+(n.home_url?link(n.home_url,'기존 Rent Check 공고 보기','action secondary'):'')+(n._homeLink?.scheduleChanged?'<p>홈 일정 변경 감지 · 공식 원문 재확인 필요</p>':'');}
function siteCard(s){return '<div class="sitecard"><strong>'+esc(s.site)+'</strong><small>'+esc((s.addresses||[]).join(' / '))+'</small><small>'+esc(s.unit_count)+'호 · '+esc(s.coordinate_status||'위치 미확인')+'</small></div>';}
function showMapPage(){const id=new URLSearchParams(location.search).get('id'),n=byId(id);$('mapBack').href='public-housing.html#notice='+encodeURIComponent(id||'');if(!n){$('mapPageTitle').textContent='공고를 찾을 수 없습니다';$('mapPageDesc').textContent='공고 목록에서 다시 선택해 주세요.';return;}$('mapPageTitle').textContent=n.title;const sites=siteList(n);$('mapPageDesc').textContent=siteSummary(n);$('mapSiteCount').textContent=sites?sites.length+'곳':'위치 미연결';$('fullSiteList').innerHTML=sites?sites.map(siteCard).join('')+'<p class="panelnotice">'+link(supply?.source_url,'공식 56호 공급목록')+'</p>':'<p class="empty">이 공고는 공급현장 상세 위치가 아직 확인되지 않았습니다. 임의의 지도 핀을 표시하지 않습니다.</p>';showMarkers('fullMap',n);}
function desktopView(){if(matchMedia('(max-width:900px)').matches)return;const n=detailNotice()||byId(LH),sites=siteList(n),pins=mapped(n);$('desktopMapTitle').textContent=detailNotice()?'선택 공고의 공급현장':'위치 검증된 공급현장 · LH';$('desktopMapCount').textContent=sites?sites.length+'곳 / 핀 '+pins.length+'곳':'좌표 미연결';$('desktopMapGuide').textContent=detailNotice()?siteSummary(n):'참고 지도: LH 서울 든든전세 공식 공급목록의 확인된 4개 주소. 다른 공고를 선택하면 지도도 바뀝니다.';$('desktopSiteList').innerHTML=pins.map(siteCard).join('')+(n?'<p class="panelnotice"><a class="inline" href="public-housing-map.html?id='+encodeURIComponent(n.id)+'">공급현장 상세 지도 보기 →</a></p>':'');showMarkers('desktopMap',n);}

function showMarkers(id,n){
 const target=$(id);if(!target)return;
 const pins=mapped(n);markers.forEach(m=>m.setMap(null));markers=[];
 if(!sdkReady||!window.kakao?.maps){target.textContent='지도 연결 대기 중';return;}
 if(map)map=null;target.replaceChildren();
 map=new kakao.maps.Map(target,{center:new kakao.maps.LatLng(37.55,126.9),level:8});
 if(pins.length){const bounds=new kakao.maps.LatLngBounds();for(const s of pins){const pos=new kakao.maps.LatLng(s.lat,s.lng);bounds.extend(pos);const marker=new kakao.maps.Marker({position:pos,map,title:s.site});markers.push(marker);}map.setBounds(bounds);if(map.getLevel()<4)map.setLevel(4);}
 else target.insertAdjacentHTML('beforeend','<div class="map-unavailable">검증된 위치 좌표가 없습니다. 공급현장 목록과 공식 공고를 확인하세요.</div>');
 if(isMap&&$('mapSiteStatus'))$('mapSiteStatus').textContent='지도 핀 '+pins.length+'곳 · 전체 공급현장 '+(siteList(n)?.length||0)+'곳';
 setTimeout(()=>map?.relayout(),100);
}
function initMap(){
 const key=window.RENTCHECK_MAP_CONFIG?.kakaoJavaScriptKey;
 if(!key||sdkLoading)return;sdkLoading=true;
 if(window.kakao?.maps){kakao.maps.load(()=>{sdkReady=true;isMap?showMapPage():desktopView()});return;}
 const script=document.createElement('script');script.src='https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey='+encodeURIComponent(key);
 script.onload=()=>kakao.maps.load(()=>{sdkReady=true;isMap?showMapPage():desktopView()});
 script.onerror=()=>{const target=$(isMap?'fullMap':'desktopMap');if(target)target.textContent='지도 연결 실패 · 공식 목록은 계속 확인할 수 있습니다.';};
 document.head.appendChild(script);
}
function render(){
 if(isMap){showMapPage();return;}
 renderCalendar();renderList();renderDetail();desktopView();
 $('noticesSection').hidden=!!detailNotice();
}
function openNotice(id){if(!byId(id))return;st.id=id;history.pushState({id},'','#notice='+encodeURIComponent(id));render();$('noticeDetail').scrollIntoView({block:'start'});}
function restoreHash(){const match=location.hash.match(/^#notice=(.+)$/);const id=match?decodeURIComponent(match[1]):null;st.id=id&&byId(id)?id:null;render();}
async function boot(){
 try{
  const [a,b]=await Promise.all([fetch('data/public-notices.json').then(r=>{if(!r.ok)throw Error('공고 보관본');return r.json()}),fetch('data/housing.json').then(r=>{if(!r.ok)throw Error('공급 목록');return r.json()})]);
  archive=a;supply=b;model=await cal.load(archive);if(!model?.items?.length)throw Error('공고 목록 없음');
  status();if(isMap)showMapPage();else{restoreHash();document.addEventListener('click',e=>{
   const day=e.target.closest('[data-day]');if(day){st.day=day.dataset.day;st.all=false;st.id=null;render();$('noticesSection').scrollIntoView({block:'nearest'});return;}
   const card=e.target.closest('.noticecard');if(card){openNotice(card.dataset.id);return;}
   if(e.target.closest('#detailBack')){st.id=null;history.pushState({},'','public-housing.html');render();return;}
   if(e.target.closest('#prevMonth')){monthShift(-1);return;}
   if(e.target.closest('#nextMonth')){monthShift(1);return;}
   if(e.target.closest('#allNotices')){st.all=true;st.day=null;st.id=null;render();return;}
  });window.addEventListener('popstate',restoreHash);}
  initMap();
 }catch(err){$('dataStatus').textContent='공고 연결 오류 · '+String(err.message||err);if(!isMap){$('noticeList').textContent='공고 데이터를 불러오지 못했습니다.';}else $('mapPageDesc').textContent='공고 데이터를 불러오지 못했습니다.';}
}
boot();
})();
