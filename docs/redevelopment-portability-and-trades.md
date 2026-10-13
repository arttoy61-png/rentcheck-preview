# 재개발 UI 분리와 실거래 연결 계획

현재는 프리뷰의 로컬 UI 회귀 수정만 진행했다. 기존 운영 홈·Engine으로 이관하거나 배포하지 않았으며, 재개발 현장별 실거래는 계속 미연결 상태다.

## 분리할 UI와 호스트 접점

| 모듈 | 책임 | 필요한 입력 |
| --- | --- | --- |
| redevelopment-shell.js / .css | 재개발 route의 작은 홈 경로·제목·검색·지도/목록·메뉴, 모바일 높이 | `page`, `tab`, `expanded`, `selected`, `detailOpen`, `showMap`; 선택적 `homeHref` |
| redevelopment-status.js | 원문 사업 단계·발생일·최근 사건·확인일 구분, 운영정보 분리 | 프로젝트 record, 검증 날짜 override; 데이터 수집 기능 없음 |
| redevelopment-card.js | 현장명·유형별 점 노드·Q&A·실거래 미연결 상태 | 프로젝트 record와 status model |
| redevelopment-pilot.js | 방화6에 한정한 상세 기록과 13개 주요 단계 | banghwa6-pilot.js와 호스트의 overview/map/tool callback |
| redevelopment-pilot.css | 상세 폭·DL·지도 팝업의 기존 재개발 스타일 | 재개발 topic scope와 기존 지도 DOM |

현재 `app.js`에는 `render()` 시작의 `RentRedevelopmentShell.sync(state)` 호출과 지도/목록 버튼을 기존 `mobileToggle`에 전달하는 UI adapter만 추가했다. 재개발 CSS는 `body.redevelopment-route` 범위에 적용되고 다른 page/topic으로 이동하면 제거된다. 일반 공공주택·전역 헤더의 스타일은 변경하지 않았다.

Shell의 검색·메뉴 버튼은 현재 호스트의 `data-open-search`, `data-open-menu` 동작을 사용한다. 추후 분리할 때 이 동작과 지역 선택·서울 복귀·현장 선택·지도 보기·목록 스크롤·뒤로가기를 호스트 callback으로 연결하면 된다. 공공주택 데이터/캘린더를 가져올 필요는 없다. 기본 홈 링크는 기존 `https://rent-check.kr/`이며 이식 환경에서는 `homeHref`로 바꿀 수 있다.

데이터 adapter는 등록 ID, 유형, 현재 공개 단계, 날짜의 종류, 수집/확인일, source URL, 원문 운영구분/단계, 선택적으로 사업개요·확인 사건을 넘긴다. 값이 없으면 미확인으로 표시한다. 현재 preview의 `seoul-projects.json`, `moa-projects.json`, Gangseo enrichment, verified stage checks는 수집 결과이며 UI module이 직접 수집하거나 운영 Engine을 갱신하지 않는다.

지도는 기존 지도 renderer와 공식 geometry manifest/GeoJSON을 호스트가 제공한다. 이번 수정은 지도 Engine 파일이나 좌표·경계를 바꾸지 않았다. 모아타운 관리구역과 개별 정비사업 경계는 같은 단위로 합치지 않는다.

## 최신 강서 공개 실거래의 읽기 검증

읽기 전용으로 운영 저장소의 동일 커밋 `21290385798fda53fabf6b4d1a8fcf265bd78bd4`에 고정해 다음 두 파일을 확인했다. 운영 저장소에는 쓰지 않았다.

- [요약 파일](https://github.com/arttoy61-png/rent-check/blob/21290385798fda53fabf6b4d1a8fcf265bd78bd4/gangseo_apt_summary.json): blob `0ebd5e276ccffc214669ee14e99b3733cdf22432`, 생성일 `2026-10-13T03:04:47+00:00`, 계약일 기간 2026-04-12~2026-10-12.
- [상세 파일](https://github.com/arttoy61-png/rent-check/blob/21290385798fda53fabf6b4d1a8fcf265bd78bd4/gangseo_apt_detail.json): blob `0a6316a4e63e3785d66f421b6cffbd3c6a2e722b`, 684개 ID의 면적별 거래 상세가 존재한다.
- 요약 684개와 상세 684개의 ID·단지명·동 일치 684/684. 누락/추가 ID 0. 상세 자체의 독립 스냅샷 시각은 없으므로 같은 생성 시각을 확인했다고 표현하지 않는다. 같은 저장소 커밋, ID/명칭/동, 계약일 범위와 행수를 대조했다.
- 요약 좌표 684개. 동별로 가양28·공항9·내발산90·등촌73·마곡37·방화70·염창72·화곡305개이며 **강서 아파트 범위**다.
- 상세 행수: 매매2,217·전세3,488·월세2,612. 최소/최대 계약일은 요약의 기간과 같다. 매매/보증금은 억원, 월세는 만원 계약을 유지해야 한다.

현재 preview의 10/9 요약·분리 상세와 이 10/13 pair를 섞으면 안 된다. 요약과 상세는 한 커밋에 고정해 함께 읽고 ID·명칭·동을 검증한 후 일괄 교체하는 adapter가 필요하다. 이후에는 생성 커밋·파일 hash·계약일 기간·행수·좌표 근거를 가진 snapshot manifest를 함께 기록해야 한다. 이 문서는 갱신 작업을 실제로 실행하거나 예약한 것이 아니다.

## 제한 연결 구현 순서 — 아직 미구현

1. 강서 아파트부터 동일 commit의 요약/상세 pair를 읽는 독립 read-only adapter를 만든다. 타입·면적·기간 필터와 금액 단위를 명시한다. 강서 밖은 지원 범위 밖/자료 미연결로 표시한다. 서울 전체 연결 완료라고 표시하지 않는다.
2. 공식 사업 경계와 요약의 `dong`/지번 `j`/단지명·주소를 대조한다. 공개 좌표는 주소 캐시/Hwagok fallback을 포함하며 공식 필지 귀속 검증을 뜻하지 않는다. ID도 공식 건물·거래 ID가 아니다.
3. 경계 안 주소점은 우선 후보로 분류한다. 명칭·지번·건물 동일성과 필지 귀속을 확인하기 전에는 구역 안 거래로 확정하지 않는다. 경계 부근·주소 불일치·미검증 좌표는 별도 불확실 상태로 남긴다. 임의 지오코딩/새 핀은 만들지 않는다.
4. 구역 내 확인 거래와 구역 밖 주변 일반 아파트 거래를 분리한다. 주변 범위는 사용자에게 표시하며 입주권/분양권과 일반 주택을 섞지 않는다. 모아타운 관리구역 안에 있다는 것만으로 개별 사업의 권리를 부여하지 않는다.
5. 상세 읽기 성공 후 선택 조건에서 0행인 경우만 ‘조건 일치 거래 0건’으로 표시한다. fetch 실패·지원 지역 밖·상세 미연결·주소 귀속 미확인은 각각 ‘자료 없음/미연결/확인 필요’로 구분한다.
6. 실거래의 공식 거래 ID·해제일이 보존되지 않는 한 취소·정정의 실시간 완결성을 보장하지 않는다. 최신 pair와 25구의 과거 실험 원천을 혼합하지 않는다. 새 키·유료 지오코딩·운영 Engine 변경은 별도 범위다.

같은 snapshot의 실제 상세가 있으므로 강서 한정 후보 조회 연결은 가능하지만, 재개발 구역 귀속과 권리 판단까지 검증된 것은 아니다. 현재 UI의 ‘현장별 실거래 미연결’ 표시는 그대로 남겼다.
