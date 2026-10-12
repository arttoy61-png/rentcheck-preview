/* Supply belongs to a notice. A building can have several independent notices.
 * Address-only rows never receive invented coordinates, unit counts or prices. */
(()=>{'use strict';
 const key=v=>String(v||'').trim().replace(/\s+/g,' ');
 const addresses=s=>[...new Set((Array.isArray(s?.addresses)?s.addresses:s?.address?[s.address]:[]).filter(x=>typeof x==='string'&&key(x)).map(key))];
 const coord=s=>Number.isFinite(s?.lat)&&Number.isFinite(s?.lng)&&s.lat>33&&s.lat<39&&s.lng>124&&s.lng<132;
 function forNotice(n,supply){
  if(!n)return[];
  const supplement=supply?.notice_id===n.id?supply.sites||[]:[];
  const rows=new Map();
  for(const s of [...(Array.isArray(n.sites)?n.sites:[]),...supplement]){
   if(!s||typeof s!=='object')continue;
   const a=addresses(s),id=s.id||'supply:'+n.id+':'+encodeURIComponent(a.join('|')||s.site||'');
   if(!a.length&&!s.site)continue;
   rows.set(id,{...s,id,addresses:a,site:s.site||a[0],notice_id:n.id,notice_ids:[n.id],lat:coord(s)?s.lat:null,lng:coord(s)?s.lng:null,source_url:s.source_url||((supplement.length&&supply.source_url)||n.district_evidence?.url||n.official_url||n.url||n.source_url)});
  }
  const covered=new Set([...rows.values()].flatMap(s=>s.addresses));
  for(const a of addresses(n))if(!covered.has(a)){
   const id='supply:'+n.id+':'+encodeURIComponent(a);
   rows.set(id,{id,site:a,addresses:[a],notice_id:n.id,notice_ids:[n.id],unit_count:null,units:[],lat:null,lng:null,coordinate_status:'좌표 미확인',source_url:n.district_evidence?.url||n.official_url||n.url||n.source_url});
  }
  return [...rows.values()];
 }
 function collect(notices,supply,{district='all',query='',knownNotices=notices}={}){
  const coordinateEvidence=new Map();
  const addressKey=s=>s.addresses.slice().sort().join('|');
  for(const n of knownNotices||[])for(const s of forNotice(n,supply))if(coord(s)&&s.addresses.length&&s.coordinate_source?.url)coordinateEvidence.set(addressKey(s),s);
  const result=new Map(),q=key(query).replace(/\s/g,'').toLowerCase();
  for(const n of notices||[])for(const raw of forNotice(n,supply)){
   let s=raw;const evidence=coordinateEvidence.get(addressKey(s));
   if(!coord(s)&&evidence)s={...s,lat:evidence.lat,lng:evidence.lng,coordinate_source:{...evidence.coordinate_source},coordinate_status:evidence.coordinate_status};
   if(district!=='all'&&!s.addresses.some(a=>a.includes(district))&&s.district!==district)continue;
   if(q&&!key(s.site+' '+s.addresses.join(' ')+' '+n.title).replace(/\s/g,'').toLowerCase().includes(q))continue;
   // Coordinates can be reused only for an identical address set with evidence.
   // Recruitment state and unit/price facts always stay attached to this notice.
   const building=s.addresses.length?'address:'+s.addresses.slice().sort().join('|'):'record:'+n.id+':'+s.id;
   const prior=result.get(building);
   if(prior){prior.notice_ids=[...new Set([...prior.notice_ids,n.id])];continue;}
   result.set(building,{...s});
  }
  return [...result.values()];
 }
 window.RentCheckHousingSupply=Object.freeze({forNotice,collect,coord,addresses});
})();
