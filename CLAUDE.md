# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 저장소 구성

- 앱은 `subsidy-finder/` 하나뿐입니다. 앱인토스(토스 미니앱) 웹앱이고, Vite 6 + React 18 + TypeScript + TDS(토스 디자인 시스템)로 되어 있습니다.
  - `npx create-ait-app subsidy-finder --inline --pm npm --tds`로 만들었습니다.
  - 아직 git 저장소가 아닙니다.
- 이 최상위 폴더의 `.claude/launch.json`에 미리보기 서버 `subsidy-finder-dev`가 정의되어 있습니다. 5173 포트에서 `npm --prefix subsidy-finder run dev`를 실행합니다(`--strictPort`).

## 환경 주의점 (Windows)

- Node.js 24 LTS는 winget으로 `C:\Program Files\nodejs`에 설치했습니다. 설치 전에 열린 셸에서는 PATH에 없을 수 있으니, PowerShell에서 먼저 PATH를 다시 불러옵니다.
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
- `npx`와 `create-ait-app`은 실행 중에 질문을 띄우고 멈춥니다. `npx`에는 `--yes`를, CLI에는 `--inline`과 필요한 옵션을 직접 넘깁니다.

## 명령어 (`subsidy-finder/` 안에서 실행)

```bash
npm run dev                          # Vite 개발 서버. 개발 도구가 떠 있는 "AIT" 버튼을 넣지만 배포본에는 안 나옵니다
npm run build                        # vite build && ait build → dist/와 배포용 subsidy-finder.ait 생성
npm run deploy                       # ait deploy. 앱인토스 콘솔에서 받은 콘솔 API 키가 필요합니다
npm run lint                         # eslint
npx tsc -p tsconfig.app.json --noEmit  # 타입 검사만 실행 (strict, noUnusedLocals/Parameters)
```

테스트 코드는 없습니다. 변경 후에는 타입 검사, 빌드, 휴대폰 크기(375×812) 미리보기 화면 확인으로 검증합니다.

## 구조

- `src/main.tsx`는 `App`을 `TDSMobileAITProvider`로 감쌉니다. 브랜드 색은 `apps-in-toss.config.ts`의 `brand.primaryColor`(현재 `#0064FF`)에서 가져옵니다. 색을 바꿀 때는 CSS가 아니라 이 파일을 고칩니다.
- `apps-in-toss.config.ts`의 `appName: 'subsidy-finder'`는 콘솔에 등록한 앱 이름과 같아야 합니다. 이 이름으로 미니앱 주소(Origin)가 정해지고, 백엔드의 CORS 허용 목록에 이 주소들이 들어가야 합니다.
  - 운영: `https://subsidy-finder.apps.tossmini.com`
  - 콘솔 QR 테스트: `https://subsidy-finder.private-apps.tossmini.com`
- `src/benefits.ts`는 데이터 계층입니다. `Benefit` 타입, 필터 선택지 `REGIONS`·`TARGETS`, 검색 함수 `searchBenefits(filter)`가 있습니다.
  - 지금은 보조금24·기업마당의 실제 공고를 뽑아 둔 샘플 데이터(2026-10-21 기준)를 거릅니다.
  - `dday`는 `applyEnd`로 실행 시점에 계산하고, `null`이면 상시입니다.
  - 지역이 `"전국"`인 지원금은 어느 지역을 골라도 나옵니다.
  - 대상에 `"누구나"`가 있는 지원금은 어느 대상을 골라도 나옵니다.
  - 화면은 `searchBenefits`와 타입에만 의존합니다. 실제 API로 바꿀 때는 이 함수 안쪽만 바꾸면 됩니다.
- `src/App.tsx`는 화면 하나로 되어 있습니다. TDS 컴포넌트는 `FixedBottomCTA`와 `Result`만 쓰고, 나머지는 `src/App.css` 클래스로 직접 만든 마크업입니다.
  - 조건 입력: 상단 검색창(검색어 `keyword`), 대상 4열 타일, 나이 입력, 지역·신청 상태 칩
  - 결과: "검색 결과 N건" 머리글과 목록형 카드(왼쪽 D-day 썸네일, 제목 2줄, 금액·기관·출처). 카드를 누르면 공고 원문이 열립니다.
  - 검색창에서 Enter를 누르거나 하단 고정 `FixedBottomCTA`를 누르면 검색합니다.

### 실제 데이터 연결 계획 (아직 만들지 않음)

API 키를 앱 코드에 넣으면 빌드 결과물에 노출되고, 운영 미니앱은 HTTPS만 허용합니다. 그래서 중계 서버를 거쳐 실제 데이터를 받을 계획입니다. Cloudflare Worker로 만들 중계 서버는 다음을 맡습니다.

- 키 2개를 비밀 값(secret)으로 보관합니다.
  - 공공데이터포털 "행정안전부_대한민국 공공서비스(혜택) 정보"(`serviceKey`, data.go.kr id 15113968). 정확한 요청 경로는 포털 명세에서 확인해야 합니다.
  - 기업마당 `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do`(`crtfcKey`). 신청서에 시스템 IP를 적게 되어 있는데, 실제로 IP를 막는지는 확인하지 않았습니다. `dataType=json`이어도 XML이 온다는 사례가 있어 둘 다 처리해야 합니다.
- 두 응답을 `Benefit` 형식으로 맞추고(금액 `amount` 추출 포함), 1시간 정도 저장해 재사용하며, 위 미니앱 주소와 `http://localhost:5173`에 CORS를 허용합니다.
- 키는 `.dev.vars`에 두고 git에 올리지 않습니다. 키는 사용자가 직접 넣습니다.

## UI 규칙

- 직접 마크업을 짜기 전에 `@toss/tds-mobile`의 TDS 컴포넌트를 먼저 씁니다. props는 `node_modules/@toss/tds-mobile/dist/esm/index.d.ts`에서 확인합니다. 알아 둘 점:
  - `Chip`은 묶음 컨테이너이고, 선택 항목은 `ChipItem`입니다.
  - `ListRow.Texts`는 `"2RowTypeA"` 같은 `type`과 `top`/`bottom`을 받습니다.
  - `Badge` 색은 blue/teal/green/red/yellow/elephant만 됩니다.
  - `SegmentedControl`은 한글 3자 넘는 문구가 휴대폰 폭에서 두 줄로 꺾입니다. 이럴 때는 칩을 씁니다.
- 디자인은 네이버 느낌 가이드를 따릅니다(이전의 토스 느낌 디자인을 대체).
  - 색·모서리·간격 값은 `src/App.css`의 `:root`에 모아 두었습니다. 주색 초록 `#03C75A`, 글자 `#111111`, 강조 배경 민트 `#E9F8F0`, 구분선 `#E5E8EB`입니다. 브랜드 색(`apps-in-toss.config.ts`)도 `#03C75A`라서 TDS 버튼이 초록으로 나옵니다.
  - 화면 맨 위에 폭을 최대로 넓힌 둥근 검색창(SearchBar)을 둡니다.
  - 진입 선택지는 아이콘과 라벨을 세로로 쌓은 정사각 타일(ServiceTile) 4열 그리드로 묶습니다.
  - 목록은 썸네일 왼쪽, 제목 2줄, 회색 작은 메타를 붙인 카드(NewsCard)로 만들고 구분선 하나로만 나눕니다.
  - 선택 상태는 초록 테두리와 민트 배경으로 표시합니다.
  - 네이버 로고, 일러스트, 슬로건은 쓰지 않고, 네이버와 관련 있는 것처럼 보이게 하지 않습니다.
- 글꼴: 가이드에 따라 `src/index.css`에서 Pretendard(jsdelivr)를 우선 씁니다.
- 화면 문구는 한국어 해요체로 씁니다.
- iframe은 쓰지 않습니다. 앱인토스 보안 심사에서 반려됩니다.
