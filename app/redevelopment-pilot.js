/* Banghwa 6 only: verified public records, never inferred completion dates. */
(()=>{'use strict';
const id='cleanup-banghwa6',checked='2026-10-13',home='https://cleanup.seoul.go.kr/cafe/mainIndx.do?cafeUrl=banghwa6',history='https://cleanup.seoul.go.kr/cafe/mainIndx/cleanup-prtnelapse/vscr.do?bsnsPk=11500-900000103&cafeId=500900000103o05';
const stages=[['안전진단','건축물 상태를 살펴 재건축 필요성을 판단합니다.'],['정비구역지정','정비계획과 사업구역을 정합니다.'],['조합설립추진위원회승인','조합 설립을 준비할 추진위원회를 승인합니다.'],['조합설립인가','사업을 추진할 조합 설립을 인가합니다.'],['사업시행인가','건축·시설 등 사업시행계획을 인가합니다.'],['관리처분인가','종전 권리와 새 주택의 배분 계획을 인가합니다.'],['철거신고','기존 건축물 철거에 관한 신고와 기록입니다.'],['착공신고','공사 시작에 관한 신고 단계입니다.'],['일반분양승인','일반분양에 관한 승인 단계입니다.'],['준공인가','완공된 사업이 인가된 계획에 맞는지 확인합니다.'],['이전고시','새 토지·건축물의 권리 이전을 고시합니다.'],['조합해산','사업을 마무리하고 조합 해산 절차를 진행합니다.'],['조합청산','채권·채무 등을 정리해 조합 업무를 마무리합니다.']];
const supplementary=[['정비사업전문관리업자선정','사업 준비와 관리를 지원할 업체 선정 기록입니다.'],['설계자선정','사업 설계를 담당할 업체 선정 기록입니다.'],['시공자선정','공사를 맡을 업체 선정·계약 기록입니다.'],['철거업자선정','철거를 담당할 업체 선정 기록입니다.'],['이주','조합원과 세입자의 이주 기록입니다.']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener" data-preserve>${esc(label)} ↗</a>`;
function renderLegacy(p,ctx){
const verified=window.RentBanghwa6Verified,meta=ctx.manifest?.[p.registry?.id||p.id],point=p.map_point||window.RentKakaoMap?.point?.(p.id),current=verified?.project.currentStage||'일반분양승인',events=verified?verified.stages.flatMap(s=>s.events.map(e=>({date:e.date,stage:s.label,title:e.type,detail:e.description}))):p.history_verified===true?(p.events||[]):[];
const step=([name,meaning],i,extra=false)=>{const records=events.filter(e=>e.stage===name).sort((a,b)=>String(b.date).localeCompare(String(a.date)));return `<details class="pilot-step ${name===current?'current':''}" ${name===current?'open':''}><summary ${name===current?'aria-current="step"':''}><span class="step-number">${extra?'·':i+1}</span><span>${esc(name)}<small>${name===current?'현재 단계 · 날짜 미공개':records.length?'확인 기록 '+records.length+'건':'공개 날짜·경과 없음'}</small></span><b aria-hidden="true">+</b></summary><div class="step-content"><span class="pilot-label">일반 절차 설명</span><p>${esc(meaning)}</p><span class="pilot-label">방화6 확인 기록</span>${records.length?records.map(e=>`<article><time>${esc(e.date)}</time><p>${esc(e.title)}${e.detail?' · '+esc(e.detail):''}</p></article>`).join(''):'<p>공식 추진경과에 날짜와 내용이 공개되어 있지 않습니다. 미진행을 뜻하지 않습니다.</p>'}${name==='시공자선정'?'<p class="warning">2019년 HDC 선정 기록입니다. 현재 시공사를 확정하는 정보는 아닙니다.</p>':''}${name==='이주'?'<p class="warning">이주개시 표제는 2021-09-01, 본문 접수기간은 2022-09-01~07로 서로 다릅니다. 원문 날짜 불일치이며 접수기간을 추정하지 않았습니다.</p>':''}${source(history,'공식 추진경과')}</div></details>`;};
return `<div class="redevelopment-pilot redevelopment-card">${ctx.card?ctx.card.header(p):`<h2 id="detailTitle">${esc(p.official_name||p.title)}</h2>`}${ctx.current?ctx.current(p):`<section class="pilot-current"><span class="pilot-label">현재 공식 단계</span><strong>${current}</strong><p>단계 발생일 미확인</p></section>`}<section class="project-progress"><h3>사업 유형별 진행도</h3><p>방화6 공식 홈 · 주요 13단계 중 9번째 항목</p><ol class="pilot-track" aria-label="전체 절차상 현재 위치"><li><span class="progress-node" aria-hidden="true"></span><span class="progress-label">계획·조합</span></li><li><span class="progress-node" aria-hidden="true"></span><span class="progress-label">사업 인가</span></li><li><span class="progress-node" aria-hidden="true"></span><span class="progress-label">이주·공사</span></li><li aria-current="step"><span class="progress-node" aria-hidden="true"></span><span class="progress-label">분양 <b>현재</b></span></li><li><span class="progress-node" aria-hidden="true"></span><span class="progress-label">준공·입주</span></li><li><span class="progress-node" aria-hidden="true"></span><span class="progress-label">해산·청산</span></li></ol><p class="coverage">절차상의 위치입니다. 공정률이나 남은 기간을 뜻하지 않습니다.</p></section><details class="pilot-all"><summary>전체 이력 펼치기 <small>주요 13단계 · 세부경과 18항목</small></summary><p class="coverage">각 단계를 눌러 의미와 확인 기록을 보세요. 현재 단계 이전의 모든 날짜가 확인된 것은 아닙니다.</p><details class="pilot-step"><summary>계획 수립 · 절차 시작 안내</summary><div class="step-content"><span class="pilot-label">일반 절차 설명</span><p>기본계획과 정비계획을 수립하고 사업 추진의 방향을 정합니다. 아래 번호는 방화6 공식 홈의 주요단계 순서를 따릅니다.</p><p>방화6 계획 수립의 개별 날짜는 이 시범에서 수집하지 않았습니다.</p>${source('https://cleanup.seoul.go.kr/cleanup/view/rebuild.do','서울시 재건축 절차 안내')}</div></details>${stages.map((s,i)=>step(s,i)+(i===9?`<details class="pilot-step"><summary>입주 · 준공 이후 안내</summary><div class="step-content"><span class="pilot-label">일반 절차 설명</span><p>준공과 사용 절차 이후 입주가 이어집니다. 입주와 조합 청산은 구분합니다.</p><p>방화6 입주일은 확인되지 않았습니다. 예정일을 만들지 않았습니다.</p></div></details>`:'')).join('')}<h4>별도 세부경과</h4><p class="coverage">업체 선정과 이주는 주요 13단계에 더해 공개된 5개 항목입니다. 같은 사업의 보조 기록이며 진행률에 합산하지 않습니다.</p>${supplementary.map((s,i)=>step(s,i,true)).join('')}</details>${ctx.card?ctx.card.questions(p)+ctx.card.transactions(p):''}<section class="project-information"><h3>사업 정보·확인 자료</h3><p class="pilot-note">공식 홈은 ‘일반분양승인’, 등록 목록은 ‘분양’으로 표시합니다. 착공신고·일반분양승인의 날짜는 공개 경과에 없습니다.</p><section class="pilot-section"><h4>사업 핵심 정보</h4><dl>${[['사업유형',p.project_type],['대표지번',p.representative_lot]].map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v||'미확인')}</dd>`).join('')}<dt>확인일</dt><dd>${checked} · 공식 홈·개요·경과 열람</dd></dl></section><section class="pilot-section"><h3>별도 공식 공사·입주 정보</h3><p><strong>래미안 엘라비네 · 공사 중</strong></p><p>공식 공사현황 2026년 10월호: 9월 말 기준 기초·지하층 골조공사 진행.</p><p><strong>입주 예정 · 2028년 8월</strong></p><p class="coverage">래미안의 공사·분양 정보입니다. 정비사업 진행단계와 구분하며 입주 완료·조합 청산 시기를 뜻하지 않습니다.</p>${source(verified.sources.raemian,'공식 입주예정 정보')}${source('https://www.raemian.co.kr/sales/sub/s/elravine?menuSeq=10652','공식 월별 공사현황')}</section><section class="pilot-section"><h3>최근 확인된 사건</h3><p><time>2026-04-22</time> · 조합설립 변경인가</p><p><time>2026-01-28</time> · 관리처분 변경인가</p><p><time>2026-01-07</time> · 사업시행 변경인가</p><p class="coverage">이전 단계의 변경인가가 최근 사건으로 남을 수 있습니다. 현재 단계를 변경하는 날짜로 해석하지 않습니다.</p></section><section class="pilot-section">${ctx.overview(p)}</section><section class="pilot-section"><h3>위치 근거</h3><p>${meta?.verified&&ctx.boundaryStatus&&ctx.boundaryStatus(p)!=='ready'?(ctx.boundaryStatus(p)==='failed'?'공식 경계를 불러오지 못했습니다. 경계 다시 불러오기를 이용하세요.':'공식 경계를 불러오는 중입니다. 아직 화면 표시가 완료되지 않았습니다.'):meta?.verified?'서울시 공식 정비구역 경계가 연결되어 있습니다. 핀은 경계의 표시 중심점입니다. 개별 필지·건물 경계는 아닙니다.':point?'확인된 대표주소 위치입니다. 사업구역 경계는 아닙니다.':'지도 위치 미확인입니다. 핀과 사업구역 경계를 임의로 표시하지 않습니다.'}</p>${meta?.source?source(meta.source,'공식 경계 출처'):''}${ctx.mapControl(p)}</section><section class="pilot-section pilot-sources"><h3>확인 자료</h3>${source(home,'공식 사업장')}${source(history,'공식 추진경과')}${source(verified?.sources.overview||home,'공식 사업개요')}<p class="coverage">주요 13단계와 세부경과 18항목·56개 날짜 기록을 공식 원문과 대조했습니다. 조사 자료는 웹 수집본이며, 이 PC에서 홈·개요·추진경과를 직접 다시 열람했습니다. 공란은 미진행으로 판정하지 않습니다.</p></section>${ctx.operations?ctx.operations(p):''}</section>${ctx.tool()}</div>`;
}
let activeTab='overview',renderSerial=0;
function render(p,ctx){
 const template=document.createElement('template');template.innerHTML=renderLegacy(p,ctx);
 const old=template.content.firstElementChild,info=old.querySelector('.project-information');
 const take=selector=>{const node=old.querySelector(selector);if(!node)return '';const html=node.outerHTML;node.remove();return html;};
 // The compact header replaces the legacy title block.
 take('.project-card-heading');
 old.querySelector(':scope > #detailTitle')?.remove();
 const stage=take('.project-stage-banner')||take('.pilot-current');
 const stageHelp=take('.stage-verification');
 const progress=take('.project-progress'),historyHtml=take('.pilot-all');
 const questions=take('.purchase-questions');
 const transactions=ctx.card?ctx.card.transactions(p):'';
 // Remove the original transaction markup once; do not duplicate IDs or fetch targets.
 if(transactions){const tx=document.createElement('template');tx.innerHTML=transactions;
  for(const candidate of [...old.children])if(candidate.outerHTML===tx.content.firstElementChild?.outerHTML)candidate.remove();
 }
 // Move, rather than copy, the verified overview out of the source fold.
 const overviewNode=old.querySelector('.project-overview'),overviewWrapper=overviewNode?.parentElement;
 const overview=take('.project-overview')||ctx.overview(p)||'<p>사업개요 수치 미확인</p>';
 if(overviewWrapper?.classList.contains('pilot-section')&&!overviewWrapper.textContent.trim())overviewWrapper.remove();
 // Separate ending detail exploration from locating the selected site.
 old.querySelectorAll('[data-project-map]').forEach(node=>node.remove());
 const mapTemplate=document.createElement('template');mapTemplate.innerHTML=ctx.mapControl(p);
 const mapButton=mapTemplate.content.querySelector('[data-project-map]');
 if(mapButton){mapButton.removeAttribute('data-project-map');mapButton.setAttribute('data-bw6-locate-map','');mapButton.textContent='방화6 위치 보기';}
 const mapAction='<button type="button" class="action" data-bw6-browse-map>상세 닫고 지도 둘러보기</button>'+mapTemplate.innerHTML;
 const infoHtml=info?.outerHTML||'';info?.remove();
 const leftovers=[...old.children].filter(n=>!n.classList.contains('project-card-heading')).map(n=>n.outerHTML).join('');
 const verified=window.RentBanghwa6Verified,o=p.overview||{},uid='bw6-'+(++renderSerial);
 const metric=(name,value,unit)=>`<div><dt>${name}</dt><dd>${value===null||value===undefined||value===''?'미확인':esc(Number(value).toLocaleString('ko-KR'))+unit}</dd></div>`;
 const tab=(key,label)=>`<button type="button" role="tab" id="${uid}-${key}-tab" aria-controls="${uid}-${key}" aria-selected="${activeTab===key}" tabindex="${activeTab===key?0:-1}" data-bw6-tab="${key}">${label}</button>`;
 const panel=(key,html)=>`<section role="tabpanel" id="${uid}-${key}" aria-labelledby="${uid}-${key}-tab" data-bw6-panel="${key}" ${activeTab===key?'':'hidden'}>${html}</section>`;
 return `<div class="redevelopment-pilot redevelopment-card banghwa6-compact" data-bw6-only>
 <div class="bw6-top-actions">${mapAction}</div>
 <header class="bw6-heading"><small>강서구 · ${esc(p.project_type||'재건축')}</small><h2 id="detailTitle">방화6재정비촉진구역</h2><p>${esc(verified?.project.address||p.address||'주소 미확인')}</p><small>자료 확인 ${esc(verified?.verifiedAt||checked)} · 단계 발생일 ${esc(verified?.project.currentStageDate||'미확인')}</small></header>
 <div class="bw6-status"><span>현재 단계</span><strong>${esc(verified?.project.currentStage||'미확인')}</strong></div>
 <dl class="bw6-metrics">${metric('구역면적',o.area_m2,'㎡')}${metric('조합원',o.members,'명')}${metric('지상',o.floors_above_ground,'층')}</dl>
 <div class="bw6-tabs" role="tablist" aria-label="방화6 상세 정보">${tab('overview','사업 개요')}${tab('history','추진 이력')}${tab('transactions','주변 실거래')}</div>
 ${panel('overview',`<p class="bw6-next"><strong>다음에 확인할 자료</strong><br>공식 변경 공고와 분양 안내</p><details class="bw6-fold"><summary>사업 상세</summary>${overview}</details><details class="bw6-fold"><summary>매수 전 확인사항</summary>${questions}</details><details class="bw6-fold"><summary>공식 출처 · 기준일 · 위치 근거</summary>${stage}${stageHelp}${infoHtml}${leftovers}</details>`)}
 ${panel('history',progress+historyHtml)}
 ${panel('transactions',`<p class="bw6-data-note">좌표가 연결된 거래만 표시합니다. 주변 전체 거래가 아닙니다.</p>${transactions}`)}
 <div class="bw6-footer">${source(home,'공식 자료 보기')}</div></div>`;
}
function selectTab(button){const root=button.closest('[data-bw6-only]');if(!root)return;activeTab=button.dataset.bw6Tab;
 root.querySelectorAll('[data-bw6-tab]').forEach(b=>{const selected=b===button;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 root.querySelectorAll('[data-bw6-panel]').forEach(panel=>{panel.hidden=panel.dataset.bw6Panel!==activeTab;});
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-bw6-tab]');if(b)selectTab(b);});
document.addEventListener('keydown',e=>{const b=e.target.closest?.('[data-bw6-tab]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...b.parentElement.querySelectorAll('[data-bw6-tab]')],i=tabs.indexOf(b);const next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];selectTab(next);next.focus();});

window.RentRedevelopmentPilot={matches:p=>(p.registry?.id||p.id)===id,render};
})();

