// 지원금 데이터와 검색 로직.
// 지금은 보조금24·기업마당 공고(2026-10-21 기준)에서 뽑은 샘플 데이터를 쓰고 있어요.
// 실제 API를 연결할 때는 searchBenefits 안쪽만 바꾸면 화면은 그대로 쓸 수 있어요.

export type Target = "청년" | "소상공인" | "육아" | "누구나";

export type Benefit = {
  id: string;
  name: string;
  agency: string;
  /** 시·도 이름. 전국 사업은 "전국" */
  region: string;
  targets: Target[];
  ageMin?: number;
  ageMax?: number;
  /** 신청 마감일(YYYY-MM-DD). 상시·예산 소진 시까지는 null */
  applyEnd: string | null;
  /** 목록 오른쪽에 크게 보여줄 지원 금액(또는 지원 형태) */
  amount: string;
  support: string;
  url: string;
  source: "보조금24" | "기업마당";
};

export const REGIONS = [
  "전체",
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export const TARGETS = ["전체", "청년", "소상공인", "육아"] as const;

const BENEFITS: Benefit[] = [
  {
    id: "PBLN_000000000127250",
    name: "광진구 우리동네 소상공인 경영주치의(시설개선)",
    agency: "서울신용보증재단",
    region: "서울",
    targets: ["소상공인"],
    applyEnd: "2026-10-28",
    amount: "최대 150만원",
    support: "시설개선 비용 최대 150만원",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127250",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127377",
    name: "해운대구 청년 창업자 임차료 지원",
    agency: "부산 해운대구",
    region: "부산",
    targets: ["청년"],
    ageMin: 19,
    ageMax: 40,
    applyEnd: "2026-11-01",
    amount: "총 60만원",
    support: "사업장 월 임차료 20만원 × 3개월",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127377",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127164",
    name: "익산시 청년공유주방 예비창업자 모집",
    agency: "전북 익산시",
    region: "전북",
    targets: ["청년"],
    ageMin: 19,
    ageMax: 39,
    applyEnd: "2026-10-26",
    amount: "임대료 50%",
    support: "공유주방 임대료 50%, 공과금·POS 지원",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127164",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127173",
    name: "김제전통시장 청년몰 입점 모집",
    agency: "전북 김제시",
    region: "전북",
    targets: ["청년", "소상공인"],
    ageMin: 19,
    ageMax: 49,
    applyEnd: "2026-10-23",
    amount: "입점 지원",
    support: "청년몰 입점, 창업 소상공인 지원 연계",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127173",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127192",
    name: "서귀포시 청년농업인 농지임대료 지원",
    agency: "제주 서귀포시",
    region: "제주",
    targets: ["청년"],
    ageMin: 19,
    ageMax: 45,
    applyEnd: "2026-11-10",
    amount: "임대료 50%",
    support: "농지은행 임대료 50%",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127192",
    source: "기업마당",
  },
  {
    id: "119200000174",
    name: "청년어촌정착지원",
    agency: "해양수산부",
    region: "전국",
    targets: ["청년"],
    ageMin: 18,
    ageMax: 39,
    applyEnd: null,
    amount: "월 110만원",
    support: "어촌정착자금 월 최대 110만원",
    url: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/119200000174",
    source: "보조금24",
  },
  {
    id: "PBLN_000000000127171",
    name: "공주시 소상공인 카드수수료 지원",
    agency: "충남 공주시",
    region: "충남",
    targets: ["소상공인"],
    applyEnd: "2026-10-30",
    amount: "최대 60만원",
    support: "카드매출액의 0.4~1.0%, 최대 60만원",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127171",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127263",
    name: "고령군 소상공인 카드수수료 지원",
    agency: "경상북도경제진흥원",
    region: "경북",
    targets: ["소상공인"],
    applyEnd: null,
    amount: "최대 40만원",
    support: "카드매출액의 0.4%, 최대 40만원",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127263",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127287",
    name: "포항시 소상공인 무료 택시지붕광고",
    agency: "경북 포항시",
    region: "경북",
    targets: ["소상공인"],
    applyEnd: "2026-11-30",
    amount: "광고 무료",
    support: "택시지붕 디지털 광고 무료 송출",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127287",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127360",
    name: "소공인 클린제조환경조성 사업",
    agency: "소상공인시장진흥공단",
    region: "전국",
    targets: ["소상공인"],
    applyEnd: "2026-10-30",
    amount: "장비·개보수",
    support: "작업장 안전장비·개보수 지원",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127360",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127211",
    name: "평창군 소상공인 세무서비스 수수료 지원",
    agency: "강원 평창군",
    region: "강원",
    targets: ["소상공인"],
    applyEnd: null,
    amount: "최대 10만원",
    support: "세무사 이용 수수료 최대 10만원",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127211",
    source: "기업마당",
  },
  {
    id: "PBLN_000000000127233",
    name: "경북 소상공인 출산장려 아이보듬",
    agency: "경상북도경제진흥원",
    region: "경북",
    targets: ["소상공인", "육아"],
    applyEnd: null,
    amount: "월 200만원",
    support: "대체인력 인건비 월 최대 200만원",
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000127233",
    source: "기업마당",
  },
  {
    id: "135200005015",
    name: "첫만남이용권",
    agency: "보건복지부",
    region: "전국",
    targets: ["육아"],
    applyEnd: null,
    amount: "최대 300만원",
    support: "첫째 200만원, 둘째 이상 300만원",
    url: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/135200005015",
    source: "보조금24",
  },
  {
    id: "135200000114",
    name: "고위험 임산부 의료비 지원",
    agency: "보건복지부",
    region: "전국",
    targets: ["육아"],
    applyEnd: null,
    amount: "의료비 90%",
    support: "입원치료 본인부담·비급여의 90%",
    url: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/135200000114",
    source: "보조금24",
  },
  {
    id: "135200005050",
    name: "2세 미만 영유아 입원진료비 면제",
    agency: "보건복지부",
    region: "전국",
    targets: ["육아"],
    applyEnd: null,
    amount: "본인부담 면제",
    support: "입원 진료비 본인부담금 면제",
    url: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/135200005050",
    source: "보조금24",
  },
  {
    id: "135200005045",
    name: "전국민 마음투자 지원",
    agency: "보건복지부",
    region: "전국",
    targets: ["누구나"],
    applyEnd: null,
    amount: "상담 8회",
    support: "전문 심리상담 바우처 8회",
    url: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/135200005045",
    source: "보조금24",
  },
];

export type SearchFilter = {
  age: number | null;
  region: (typeof REGIONS)[number];
  target: (typeof TARGETS)[number];
  onlyOpen: boolean;
};

export type BenefitResult = Benefit & {
  /** 마감까지 남은 일수. 상시면 null */
  dday: number | null;
};

const DAY = 24 * 60 * 60 * 1000;

function daysUntil(date: string, today: Date) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(`${date}T00:00:00`).getTime() - start.getTime()) / DAY);
}

export async function searchBenefits(
  filter: SearchFilter,
  today = new Date(),
): Promise<BenefitResult[]> {
  return BENEFITS.map((b) => ({
    ...b,
    dday: b.applyEnd ? daysUntil(b.applyEnd, today) : null,
  }))
    .filter((b) => {
      if (filter.onlyOpen && b.dday !== null && b.dday < 0) return false;
      if (filter.region !== "전체" && b.region !== "전국" && b.region !== filter.region) {
        return false;
      }
      if (
        filter.target !== "전체" &&
        !b.targets.includes(filter.target) &&
        !b.targets.includes("누구나")
      ) {
        return false;
      }
      if (filter.age !== null) {
        if (b.ageMin !== undefined && filter.age < b.ageMin) return false;
        if (b.ageMax !== undefined && filter.age > b.ageMax) return false;
      }
      return true;
    })
    .sort((a, b) => (a.dday ?? Infinity) - (b.dday ?? Infinity));
}
