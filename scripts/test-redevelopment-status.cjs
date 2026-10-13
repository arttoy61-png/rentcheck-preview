const assert=require('node:assert/strict'),{records,sandbox,audit}=require('./audit-redevelopment-records.cjs');
const model=sandbox.window.RentRedevelopmentStatus,card=sandbox.window.RentRedevelopmentCard;
assert.equal(records.length,1288);assert.equal(audit.duplicate_id_keys.length,0);
for(const p of records){const before=JSON.stringify(p),c=model.current(p),html=card.header(p)+model.renderCurrent(p)+card.progress(p)+card.questions(p)+card.transactions();
assert.ok(!html.includes('일시중단'),p.id+' primary operation leak');assert.ok(!model.summary(p).includes('일시중단'));assert.ok(model.coreFacts(p).every(([k])=>!['운영구분','운영단계'].includes(k.replace(/\s/g,''))));
assert.ok(html.includes('현장별 실거래 미연결'));assert.ok(html.includes('확인 필요'));assert.equal(JSON.stringify(p),before);
if(['미공개','미확인',''].includes(p.status)||p.status==null){assert.equal(c.known,false);assert.equal(c.date,null);assert.ok(!html.includes('aria-current="step"'));}
if(p.project_type==='모아타운'){assert.ok(!html.includes('13단계'));assert.equal(model.operations(p),'');}
if(p.operation_status==='일시중단'||p.registry?.operation_status==='일시중단')assert.ok(model.operations(p).includes('구체적인 사유는 확인되지 않았습니다'));
}
assert.equal(audit.display.primary_suspended_operation_mentions,0);assert.equal(audit.display.unknown_stage,25);
const ssangmun=records.find(p=>(p.registry?.id||p.id)==='cleanup-W0zS4n6n');assert.equal(model.current(ssangmun).date,'2014-05-29');assert.equal(model.current(ssangmun).stage,'이전고시');
const banghwa=records.find(p=>(p.registry?.id||p.id)==='cleanup-banghwa6');assert.equal(model.current(banghwa).stage,'일반분양승인');assert.equal(model.current(banghwa).date,null);
const yuwon=records.find(p=>p.id==='cleanup-yuwon2');assert.equal(model.current(yuwon).date,'2025-03-13');assert.equal(model.current(yuwon).stage,'사업시행인가');
assert.ok(model.current(records.find(p=>p.id==='cleanup-youwon2-apt')).verificationNote.includes('최신 상세 단계는 미확인'));
assert.equal(model.current({id:'x',status:'착공',collected_at:'2026-10-13',events:[{stage:'조합설립인가',date:'2026-01-01'}]}).recentStageEvent,null);
assert.equal(model.current({id:'x',status:'미공개',status_date:'2026-10-13',project_type:'모아타운'}).date,null);
console.log('PASS all 1,288 records: immutable data, separate operations, unknown stages preserved, no invented dates/eligibility/trades, type-aware progress; verified Ssangmun1 and Banghwa6');

const sourceDateRecord=records.find(p=>p.id==='moa-urban-8791');
assert.equal(model.sourceDate(sourceDateRecord),'2026.10.02');
assert.ok(model.coreFacts(sourceDateRecord).some(([k,v])=>k==='공식자료 수정일'&&v==='2026.10.02'));
assert.equal(sourceDateRecord.source_updated_at,'2026-10-02T17:41:08.000');
assert.equal(model.current(sourceDateRecord).date,'2023-12-28');
assert.ok(model.sourceDateHelp(sourceDateRecord).includes('원천 포털의 자료 수정일'));
assert.ok(model.sourceDateHelp(sourceDateRecord).includes('사업 인가·착공일이나 이 페이지의 자료 수집일과 다를 수 있습니다'));
assert.equal(model.sourceDate({source_updated_at:'미확인'}),'');
