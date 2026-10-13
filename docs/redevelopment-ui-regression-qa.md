# 재개발 UI 회귀 로컬 검증 — 2026-10-13

기준 HEAD/원격 main: `2b46bce05b1c2e7b660792ead5c2ac2b93658430`. 시작 시 미커밋 변경 없음. 로컬 검증 완료 시점에는 커밋·push·추가 배포를 하지 않았다. 이후 사용자가 보고한9파일의 프리뷰 반영과 실제 카카오 회귀 검증을 승인했다. 배포 후 결과는 별도 실행 기록으로 보고한다.

## 원인과 수정

1. `style.css`의 `.project-progress li::before`가 기존 타임라인용 4px 회색 선을 생성했다. 새 진행도 grid의 `li`에도 적용되어 글자 위를 관통했다. 재개발 scope에서 before/after를 명시적으로 제거하고 실제 `progress-node` span을 넣었다. 현재 단계만 파란 점이며 이전 단계 완료를 추정하지 않는다.
2. 390×680에서 기존 헤더56px·서비스 탭48px·지역 필터121px에 구 제목·안내·subnav·listhead가 더해져 결과 스크롤 높이는169.5px였다. 중첩된 sticky를 새로 늘리지 않고 상단 chrome을 줄였다. 재개발 전용42px 헤더,53px 지역 선택·서울 복귀 한 줄,40px subnav와40px 결과 제목 줄을 사용한다. 결과 높이는505px다. 320×568에서는393px다.
3. 사용자 추가 승인에 따라 재개발 route에서만 전역 헤더·캘린더·서비스 탭/하단 메뉴를 숨겼다. 작은 홈 링크·재개발 지도 제목·검색·메뉴를 유지하고 기존 지도/목록 버튼을 재사용한다. 홈 링크는 기존 운영 홈으로 이동할 뿐 운영 홈을 수정하지 않는다.
4. 현재 단계·발생일의 큰 네이비 박스를 유지하면서 쉬운 단계 설명·다음 확인 자료·공식 절차 링크·장문 근거를 기본 닫힘의 보조 구역으로 옮겼다. 최신 상세 미확인 표시는 박스에 남겼다. 최종 우성 예시의 박스는180.72px이며 내부 링크는0개다. Q&A는 짧은 제목·확인 필요 상태·한 문장과 개별 펼침으로 줄였다. 390px의 첫 기본 질문 카드는108.28px이며 설명 펼침은 동작한다.

승인 시안의 실제 픽셀을 확인하지 못했으므로 시안과 일치했다고 주장하지 않는다. 사용자가 지정한 구도와 오류 제보에 따른 최소 수정이다.

## 사용자 PC Chrome 실제 로컬 QA

PC1920px, 실제 iframe390×680/320×568를 사용했다. 실제 iPhone/Safari 검증은 아니다. 로컬에서는 카카오 인증 도메인 연결 없이 기존 SVG/행정구역 지도 경로를 사용했다. 새 공개 카카오 검증은 배포 승인 후 별도 확인이 필요하다.

- 390px 최근 변화: 결과 viewport505px, top175px, 첫 카드 top185px로 초기 제목 가림 없음. PageDown 후 scrollTop122px, 결과 top175px 유지, body/root scrollTop0.
- 320px 최근 변화: 결과 viewport393px, client/scroll width309/309px, top175px. PageDown 후 scrollTop164px, body/root0. 페이지/상단 chrome이 아니라 결과 목록만 스크롤됐다.
- PC/390px/320px 우성 소규모재건축: 진행도 pseudo content `none`, display `none`, 실제 점5개. PC 상세 client/scroll412/412px,390px373/373px,320px303/303px. 기존 회색 connector가 제거됐고 Q&A3개를 유지했다.
- 상세 스크롤 중 진행도·Q&A 표시, 질문 첫 설명 펼침 확인. 기본 단계 근거는 닫힘. 현재 박스의 단계와 발생일/확인일 구분을 유지했다.
- 320px 지도/목록 전환, 서울 전체 복귀 select=all, 지역 선택, 필터 열기·가로주택 선택·필터 닫기 확인. 필터 결과15건은 모두 가로주택이었다. 숨긴 상단 유형/단계 필터는 기존 필터 패널에서 접근 가능하다.
- 공공주택 이동 시 route class 제거, 전용 shell hidden, 기존 헤더56px와 서비스 탭grid 복구. 공공주택↔재개발3회 이동 후 재개발 scope 재적용을 확인했다.

원래 사이트의 자료·좌표·경계·공공주택·지도 Engine 파일은 변경하지 않았다. 기존 거래/공급 로직을 재작성하지 않았다.

## 자동 검증

전체1,288 레코드의 상태·날짜·운영정보 분리/불변성 테스트, 방화6 전용13/18/56 기록 테스트, 지도 카메라20회 왕복, 공공주택 공급 테스트, 마감28개 테스트 통과. 변경 JS 구문과 git diff 공백 검사를 수행했다.

## 원본 사진의 지원 흐름 한계

수신된 새 사진은 `IMG_9245`/`IMG_9246` 두 장이며 세 번째 독립 사진은 없다. 별도로 기존 승인 시안을 확인 대상으로 삼았다.

Library `read`로 정확한 파일ID/이름을 확인하고 소비자 Windows workspace를 목적지로 `prepare_materialize`를 호출했다. 세 원본은 signed transfer로 반환됐다. 표준 helper의 첫 materialize가 Windows `os.setxattr` 부재로 metadata 적용 단계에서 실패했다. 최종 PNG가 설치되지 않았고 원본 픽셀은 직접 열람하지 못했다. 메타데이터를 우회하거나 부모의 클라우드 경로를 이 PC 경로로 가정하지 않았다.

## 실거래 상태와 후속 범위

현장별 실거래는 미완료다. 화면도 ‘현장별 실거래 미연결’을 유지한다. 읽기 확인한 최신 강서 요약·상세는 같은 운영 저장소 커밋에 존재하며684개 ID·단지명·동 일치와 계약일 범위를 확인했다. 상세 자체의 독립 생성 시각과 공식 필지 귀속은 검증되지 않았다. 서울 전체 연결 완료로 표현하지 않는다.

같은 snapshot의 상세를 이용하는 강서 한정 adapter, 구역 안 주소점 후보와 주변 일반 아파트의 분리, 불확실 주소·경계 근처 분류, 데이터 없음과 거래0건의 구분 계획은 `redevelopment-portability-and-trades.md`에 기록했다. 이번에 그 adapter를 연결하거나 운영 Engine을 수정하지 않았다.

## 소비자 PC 실제 스크린샷

Workspace `../evidence/`:

- iphone-before390-changes.jpg
- iphone-after390-changes-top.jpg / iphone-after390-changes-scroll.jpg
- iphone-after390-progress-scroll.jpg / iphone-after390-qa-scroll.jpg
- iphone-after390-detail-top.jpg
- iphone-after320-changes-top.jpg / iphone-after320-changes-scroll.jpg
- iphone-after320-qa-scroll.jpg
- iphone-after-pc-progress-scroll.jpg

PC 로컬 파일이며 Library 공유 링크로 표현하지 않는다. 스크린샷은 실제 브라우저 픽셀이고 일부는 해당 iframe 영역을 직접 캡처했다.
