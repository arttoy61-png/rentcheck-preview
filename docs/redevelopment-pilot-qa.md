# 재개발 지도 로컬 검수 — 2026-10-13

대상은 arttoy61-png/rentcheck-preview만이다. 아래는 배포 전 로컬 검수 기록이며 그 시점에는 커밋·push·배포하지 않았다. 이후 2026-10-13 사용자의 별도 승인으로 이8개 파일의 프리뷰 커밋·배포를 진행한다. 공개 반영 성공과 실제 Kakao 지도 검수는 배포 후 별도 결과로 확인한다.

## 작업 기준과 보존

- 별도 Windows checkout: `C:\Users\aasd\Documents\Codex\2026-10-13\task\rentcheck-preview`.
- main `aed86a0fa23b9b01ae5b04cfd3608cfbb517b00f`. clone 직후 작업 트리 clean. 최종 `git ls-remote origin refs/heads/main`도 같은 SHA.
- 이 저장소에는 AGENTS.md와 .agents/skills가 없었다. README 실행 안내에 따라 로컬 HTTP 서버로 검수했다.
- 부모 클라우드의 기존 미커밋 변경은 이 PC에서 접근할 수 없었다. 별도 clone에서만 변경했으므로 기존 checkout을 덮어쓰지 않았다. 부모 작업에 합칠 때 기존 diff와 대조해야 한다.
- 운영 rent-check.kr, rentcheck-home-v2, 공공주택, 실거래 Engine 파일을 수정하지 않았다. 공통 app.js/index.html 변경은 재개발 조건과 시범 ID로 제한했다.
- 기존 geometry-manifest.json, geometries/*, redevelopment-map-points.json 변경 없음. 좌표를 생성하거나 수정하지 않았다.

## 적용 내용

- 방화6 ID `cleanup-banghwa6`, 사업키 `11500-900000103`, 카페 ID `500900000103o05`에만 새 진행도 적용.
- 현장 선택 즉시 상세를 열고 현재 ‘일반분양승인’을 자동 강조. 기본 설명과 간결한 전체 절차 위치를 상세 맨 위에 표시.
- 주요 13단계, 세부경과 18항목, 날짜 기록 56건 구분. 전체 펼침 안에서 각 항목의 일반 의미와 현장 기록을 분리. 계획 수립/입주 안내는 공식 13단계에 번호를 추가하지 않고 별도 설명.
- 현재단계 날짜 null, 착공신고/일반분양승인 경과 공란을 미진행으로 판정하지 않음. 과거 HDC 기록과 이주 날짜 충돌 안내 보존.
- 공식 홈 단계, 등록 목록 단계, 최근 변경인가 사건, 열람일, 별도 삼성물산 공사현황과 입주예정을 구분.
- 재개발 공통: 상세 박스/긴 문자열 넘침 방지, 기본 사업정보 펼침, 위치 근거를 경계 연결/대표주소 핀/미확인에 따라 표시. 미수집 경과·입찰을 확인한 0건으로 표시하던 분기 보정.
- 지역 선택 옆 ‘서울 전체로’ 버튼을 목록과 상세 고정 머리글에 배치. 지역·지도범위·검색·사업필터를 서울 기본 상태로 돌리며 뒤로가기로 이전 상태 복원.
- 선택 경계: 파란 외곽선 `#175ccc` (Kakao 5px, SVG 4px), 파란 채움 `#3b82f6` opacity 0.12. 기존 경계 생성·선택 흐름 유지.

## 공식 원문 대조

이 PC의 Chrome에서 직접 홈·추진경과 전체 펼침·개요·래미안 분양개요·월별 공사현황을 열람했다.

- [방화6 공식 홈](https://cleanup.seoul.go.kr/cafe/mainIndx.do?cafeUrl=banghwa6): 현재 일반분양승인, 주요 13단계.
- [방화6 추진경과](https://cleanup.seoul.go.kr/cafe/mainIndx/cleanup-prtnelapse/vscr.do?bsnsPk=11500-900000103&cafeId=500900000103o05): 18분류·56날짜기록, 최근 조합설립 (변경)인가 2026-04-22, 사업시행 2026-01-07, 관리처분 2026-01-28. 착공신고/일반분양승인 칸은 비어 있음.
- [방화6 개요](https://cleanup.seoul.go.kr/cafe/mastr-cleanup-bsnsSumry/execute.do?cafeId=500900000103o05&div=sumry&stepSeCode=103): 면적 31,554.2㎡, 조합원 178명, 소유자 185명, 지상16/지하3 등 기존 수집 수치 대조.
- [래미안 분양개요](https://www.raemian.co.kr/sales/sub/s/elravine?menuSeq=10583): 같은 방화동608-97, 입주예정 2028.08. 입주 완료/청산일을 추정하지 않음.
- [래미안 월별 공사현황](https://www.raemian.co.kr/sales/sub/s/elravine?menuSeq=10652): 2026년10월호, 9월 말 기초·지하층 골조공사 진행. 정비몽땅 현재단계와 별도 사실.
- [서울시 재건축 절차 안내](https://cleanup.seoul.go.kr/cleanup/view/rebuild.do): 일반 의미 설명 근거. 이 시범 절차를 가로주택·모아타운 등 다른 유형에 적용하지 않음.
- 화곡1동354번지 일대는 `moa-urban-8791`, [공식 연결 출처](https://urban.seoul.go.kr/view/html/PMNU1100000001?seq=8791), `geometries/moa-urban-8791.geojson`. 기존 EPSG:5174 변환 경계/원본해시 연결 보존. A2-2/A2-4 등록 사업과 모아타운 관리구역을 같은 ID로 합치지 않음.
- 당산동5가7-2 공식 목록은 `youwon2-apt` (정비계획 수립·일시중단)와 `yuwon2` (사업시행인가) 두 ID. 주소로 합치지 않음. 신규 상세 수집이나 최신 공식 날짜 추가는 하지 않음.

조사 JSON은 Library `libfile_5bfb8d64c31c81918ebe8665f531d1a9`를 지원 read로 읽었다. `banghwa6-pilot.js`는 읽은 연구 스냅샷이며 Library 원본을 교체하지 않았다. 원래 연구의 ‘최대2주 전 웹 수집본’ 한계를 보존하고 위 PC 직접 열람 사실을 별도로 구분했다.

## 검증 결과

- PC Chrome 1920×867: 강서구 진입→방화6 선택 즉시 상세→전체 단계 펼침→조합설립인가 날짜 표시, 서울 전체 복귀→뒤로가기 상세 복원, 공공주택↔재개발 탭 왕복 성공.
- 방화6/화곡1동354 상세 `scrollWidth <= clientWidth`, 페이지 가로 넘침 없음, detailTitle 1개. 서울 전체 버튼이 상세 고정 머리글에 실제 표시됨.
- 화곡1동354 위치 문구는 공식 모아타운 관리구역 경계로 표시, SVG 파란선4/채움.12 실제 DOM 확인.
- JS syntax checks 및 `git diff --check` 통과.
- test-redevelopment-pilot.cjs 통과: 사업 ID, 13/18/56, null dates, 한 현재단계, 날짜충돌, pilot ID 제한.
- test-map-camera-lifecycle.cjs 통과: 기존 20회 왕복/숨김 지도/카메라 보존 회귀 검증.
- test-housing-supply.cjs 통과, test-housing-deadlines.cjs 28건 통과. 공공주택 코드는 변경하지 않았으며 공통 부위의 회귀 확인만 수행.
- 최종 PC 브라우저 console error 0건.
- 실제 스크린샷: 상위 작업 폴더 `evidence/pc-banghwa6-current.jpg`, `evidence/pc-stage-history.jpg`.

## 남은 검수 제한

- 첨부 PNG 직접 materialize는 파일을 받는 과정에서 Windows Python의 os.setxattr 미지원으로 실패했다. helper를 변조하거나 메타데이터를 누락한 파일로 우회하지 않았다. Library image read는 image pointer/OCR만 반환했으므로 실제 픽셀 확인 완료로 기록하지 않는다. 초기 3 PNG materialize를 실제 시도했고, 후속 ID도 prepare/read로 접근했지만 동일 지원 제한으로 완결하지 못했다.
- 최초 Chrome viewport override는 innerWidth를 바꾸지 않았다. 후속 검수에서는 PC Chrome 안에 검수용 iframe을 두어 실제 iframe viewport 390×780 및 320×780으로 렌더링했다. 아래 후속 결과를 참조한다. 실제 iPhone 하드웨어 검수는 아니다.
- 로컬 Kakao 타일이 안 보이는 원인은 확인했다. 기존 공개키를 기존 SDK 엔드포인트에 로컬 Referer/Origin으로 읽기 요청했을 때 HTTP 401 AccessDeniedError, domain mismatched, caller=http://127.0.0.1:8765 응답이다. 앱 실패 처리에서 SDK script를 제거하고 SVG 보조 지도로 복귀한다. 키·허용 도메인·권한 설정은 변경하지 않았다. 따라서 Kakao 실제 타일 위 파란 경계 가독성 검수는 남고, SVG 표시와 엔진 옵션/카메라 테스트만 확인됐다.
- 공개 반영, 다른 현장 전체 절차 시범 확장, 미공개 단계 날짜/입주 완료/청산일 추가 수집은 하지 않았다.

## 후속 모바일 검수

- PC Chrome 검수용 iframe의 실제 viewport: 390×780, 320×780. DOM defaultView.innerWidth 값도 각각 390/320 확인. CSS media query가 실제 적용된 브라우저 렌더링이며 정적 이미지/가상 스케치가 아니다.
- 두 폭에서 강서구→목록→방화6 선택→현재 단계 자동 표시→전체 추진단계→조합설립인가 펼침(18개 실제 날짜 기록)→서울 전체 복귀 성공.
- 390px 현재 단계의 빈 날짜 설명과 ‘미진행을 뜻하지 않음’ 문구 확인. 전체 추진단계 내 현재 항목은 기본 open이며 자동 마킹된다.
- 두 폭 모두 페이지 가로 넘침 false. 상세 scrollWidth/clientWidth는 390px에서 373/373, 320px에서 303/303. 방화6 긴 사업명 제목은 한 번만 표시하며 320px에서 폭267px 안에 줄바꿈.
- 상세 지역 선택과 서울 전체 버튼은 머리글에 고정. 390px에서는 서울 전체 복귀 후 브라우저 뒤로가기로 방화6 상세 복원도 확인.
- 모바일 목록의 서울 전체 버튼과 필터 버튼 겹침 발견→재개발 모바일 필터 행에 60px 예약 공간을 두어 보정. 320px 복귀 화면에서 버튼이 겹치지 않는 실제 픽셀 확인.
- 증거: evidence/mobile-390-current.jpg, mobile-390-stages.jpg, mobile-320-current.jpg, mobile-320-stages.jpg, mobile-320-seoul.jpg. PC evidence 2개도 유지.
- 작업 파일은 동일8개이며 부모의 별도 미승인 좌표 패치를 합치지 않았다. 최종 patch는 로컬 변경과 reverse --check 대조한다.

## Library 저장 시도 결과

PC 2개·모바일 5개 스크린샷, 검수보고서, 전체패치 총9개를 공식 Library 일괄 helper의 동일 요청으로 저장 시도했다. 첫 시도는 도구 목록 조회 네트워크 단계에서 실패했다. 네트워크 허용으로 같은 요청을 재시도한 결과 `Library prepare_uploads is not available`로 종료했다.

실패는 준비 기능 조회 단계이며 파일 바이트 전송·finalize·Library ID 생성·Windows 메타데이터 적용 이전이다. 따라서 생성된 Library ID가 없고 저장 성공으로 보고하지 않는다. 앞선 첨부 다운로드의 os.setxattr 오류와 이번 업로드 실패 단계는 서로 다르다.

Library skill references/prepared-uploads.md의 “Never switch a started helper write to a direct action.”에 따라 임의 직접 업로드나 공개 호스팅으로 대체하지 않았다. iPhone용 결과 링크를 제공할 수 없는 상태이며 PC 로컬 증거와 패치는 보존했다.
