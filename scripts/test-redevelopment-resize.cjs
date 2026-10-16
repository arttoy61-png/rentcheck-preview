const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/app.js'),'utf8'),scope={};vm.createContext(scope);vm.runInContext(source.split('\n').find(l=>l.startsWith('function redevelopmentResizeTarget(')),scope);
const anchor={camera:{lat:37.56517420555522,lng:126.97292541335095,level:10},width:780,height:758},original=JSON.stringify(anchor);
for(let i=0;i<20;i++){for(const [width,height,level] of [[390,705,11],[320,705,12],[780,758,10]]){const c=scope.redevelopmentResizeTarget(anchor,{width,height});assert.equal(c.lat,anchor.camera.lat);assert.equal(c.lng,anchor.camera.lng);assert.equal(c.level,level);}}
assert.equal(JSON.stringify(anchor),original,'resize anchor cannot ratchet its zoom or drift its center');
assert.equal(scope.redevelopmentResizeTarget(anchor,{width:0,height:705}),null,'hidden map cannot restore a camera');
assert.equal(scope.redevelopmentResizeTarget(null,{width:390,height:705}),null);
assert.equal(scope.redevelopmentResizeTarget({...anchor,camera:{...anchor.camera,level:12}},{width:320,height:705}).level,12);
assert.ok(source.includes("if(state.page!=='map'||state.tab!=='redevelopment'"),'resize repair must stay redevelopment scoped');
assert.ok(source.includes('placeDesignControls();queueRedevelopmentResize();renderPins();'),'queue intent after toolbar placement and before Engine layout');
console.log('PASS redevelopment resize: preserve pre-layout center, retain geographic coverage, 20 mobile/PC roundtrips without zoom ratchet, hidden layout guard and topic isolation');

vm.runInContext(source.split('\n').find(l=>l.startsWith('function sameRedevelopmentCamera(')),scope);
const intended={lat:37.564381287303554,lng:126.97274460132365,level:12},rounded={lat:37.562650291071954,lng:126.9683989567372,level:12,bounds:[126.06127516804933,35.93264223675019,127.91582079626369,39.1849483124847]};
assert.equal(scope.sameRedevelopmentCamera(intended,rounded,{width:320,height:705}),true,'real Kakao sub-pixel center rounding must not reset the resize anchor');
assert.equal(scope.sameRedevelopmentCamera(intended,{...rounded,lng:rounded.lng+.03},{width:320,height:705}),false,'actual user pan starts a new anchor');
assert.equal(scope.sameRedevelopmentCamera(intended,{...rounded,level:11},{width:320,height:705}),false,'actual user zoom starts a new anchor');
console.log('PASS real Kakao pixel quantization tolerated, genuine pan/zoom resets anchor');
