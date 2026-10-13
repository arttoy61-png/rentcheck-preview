/* Shared redevelopment card sections. No transaction/eligibility inference. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=(url,label)=>url?`<a href="${esc(url)}" target="_blank" rel="noopener" data-preserve>${esc(label)} ↗</a>`:'';
const standard=[['계획·구역',['정비계획 수립','정비구역지정','안전진단','안전진단(1차)']],['조합',['추진위원회승인','추진위구성','조합설립인가']],['사업·분양계획',['사업시행인가','관리처분인가']],['철거·공사',['철거','철거 및 착공','착공','분양','일반분양승인']],['준공·권리이전',['부분준공인가','준공인가','이전고시']],['해산·청산',['조합해산','조합청산','청산 및 조합해산']]];
const small=[['조합',['조합설립인가']],['심의·사업계획',['사업시행인가']],['이주·공사',['철거','철거 및 착공','착공','분양']],['준공·입주',['준공인가','부분준공인가']],['해산·청산',['조합해산','조합청산','청산 및 조합해산']]];
const localHouse=[['추진·모집',['추진위구성','조합규약작성','조합원 모집신고']],['조합',['조합설립인가','조합창립총회']],['사업계획',['사업계획승인']],['공사·분양',['착공','조합원 동 호수 추첨, 일반분양']],['사용검사·입주',['사용검사']],['해산·청산',['조합해산','조합청산','청산 및 조합해산']]];
const remodeling=[['조합',['조합설립인가']],['진단·심의',['안전진단(1차)','도시계획심의']],['허가·계획',['사업계획승인(리모델링 허가)']],['이주·공사',['철거','착공']],['사용검사',['준공인가']]];
function header(p){return `<header class="project-card-heading"><span class="badge blue">${esc(p.project_type||'사업 유형 미확인')}</span><h2 id="detailTitle">${esc(p.official_name||p.title)}</h2><p class="project-address">${esc(p.location?.representative_address||p.address||'대표주소 미확인')}</p></header>`;}
function progress(p){const c=window.RentRedevelopmentStatus.current(p),t=p.project_type;let groups=null,url=null;
if(['재건축','재개발(주택정비형)','재개발(도시정비형)'].includes(t)){groups=standard;url='https://cleanup.seoul.go.kr/cleanup/view/'+(t==='재건축'?'rebuild':'redevelop')+'.do';}
else if(['가로주택정비','소규모재건축'].includes(t)){groups=small;url='https://cleanup.seoul.go.kr/cleanup/view/'+(t==='가로주택정비'?'garoHouse':'smallRcnstctn')+'.do';}
else if(t==='지역주택'){groups=localHouse;url='https://cleanup.seoul.go.kr/cleanup/view/localHouse.do';}
else if(t==='리모델링'){groups=remodeling;url='https://cleanup.seoul.go.kr/cleanup/view/remodeling.do';}
const index=groups?.findIndex(([,stages])=>stages.includes(c.stage))??-1;
return `<section class="project-progress"><h3>${t==='모아타운'?'관리구역 기록':'사업 유형별 진행도'}</h3>${groups?`<ol class="pilot-track" aria-label="${esc(t)} 일반 절차상 현재 위치">${groups.map(([label],i)=>`<li ${i===index?'aria-current="step"':''}>${esc(label)}${i===index?'<b>현재</b>':''}</li>`).join('')}</ol><p class="coverage">${index<0?'현재 단계는 이 요약 절차에 대응하지 않아 위치를 표시하지 않았습니다. ':''}유형별 일반 절차를 묶어 보여줍니다. 앞 단계 완료, 공정률·남은 기간을 뜻하지 않습니다.</p>${source(url,'유형별 공식 절차')}`:`<p class="coverage">${t==='모아타운'?'관리계획 단계는 구역 내 개별 사업의 공사 진행도와 다릅니다. 개별 사업장별로 확인해야 합니다.':'이 유형의 공식 절차를 추가 확인해야 합니다. 다른 사업의 단계를 복사해 진행도로 표시하지 않았습니다.'}</p>`}</section>`;}
function questions(p){return `<section class="purchase-questions"><h3>지금 매수하면?</h3><p class="coverage">현장 단계만으로 개별 매물의 권리·자격을 판단할 수 없습니다.</p>${[['조합원 지위를 승계할 수 있나요?','확인 필요','매물의 소유·취득 이력과 해당 사업의 적용 기준을 확인해야 합니다. 조합 또는 추진주체와 관할 구청에 이 매물의 승계 가능 여부를 확인하세요.'],['새 주택의 분양대상인가요?','확인 필요','해당 필지·매물의 분양대상 여부와 관련 기준·계획을 확인해야 합니다. 현재 단계나 주변 주소만으로 분양대상이라고 표시하지 않습니다.'],['계약 전에 어떤 서류를 확인하나요?','매물별 확인 필요','등기사항증명서·건축물대장·토지대장, 공식 구역·사업계획 고시, 해당되는 조합원·분양대상 관련 자료를 서로 대조하세요. 공개되지 않은 내용은 추진주체·관할 구청의 확인이 필요합니다.']].map(([q,b,a])=>`<article class="purchase-question"><h4>${q}</h4><span class="check-needed">${b}</span><p>${a}</p></article>`).join('')}<p class="coverage">공개 자료만으로 개인별 자격·분담금·완료 시기를 확정하지 않습니다.</p>${source(p.source,'이 현장의 공식 확인 자료')}</section>`;}
function transactions(){return `<section class="project-transactions"><h3>주변 실거래</h3><p class="connection-state">현장별 실거래 미연결</p><div class="trade-empty"><strong>구역 안 거래 · 확인 필요</strong><p>공식 경계와 필지를 대조한 거래 자료가 연결되지 않았습니다.</p></div><div class="trade-empty"><strong>주변 일반 주택 거래 · 미연결</strong><p>구역 밖 주변 거래는 별도로 확인해야 합니다. 입주권 거래와 구분합니다.</p></div><p class="coverage">확인된 거래 건수·금액이 없어 표와 가격을 표시하지 않습니다.</p></section>`;}
window.RentRedevelopmentCard={header,progress,questions,transactions};
})();
