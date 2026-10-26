import { Device } from "@apps-in-toss/web-framework";
import { FixedBottomCTA, Result } from "@toss/tds-mobile";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";

import {
  KINDS,
  REGIONS,
  TARGETS,
  searchBenefits,
  type BenefitResult,
  type SearchFilter,
} from "./benefits";
import { loadConditions, loadUserKey, saveConditions } from "./persistence";
import "./App.css";

const TARGET_ICONS: Record<SearchFilter["target"], string> = {
  전체: "📋",
  청년: "🎓",
  소상공인: "🏪",
  육아: "👶",
};

function ddayLabel(dday: number | null) {
  if (dday === null) return "상시";
  if (dday < 0) return "마감";
  if (dday === 0) return "오늘";
  return `D-${dday}`;
}

function ddayTone(dday: number | null) {
  if (dday === null || dday < 0) return "thumb thumb--muted";
  return dday <= 7 ? "thumb thumb--urgent" : "thumb";
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// 토스 앱 안에서는 웹뷰 밖(기본 브라우저)으로 공고 원문을 열어요.
function openExternal(e: MouseEvent<HTMLAnchorElement>, url: string) {
  e.preventDefault();
  Device.openURL(url).catch(() => window.open(url, "_blank", "noopener,noreferrer"));
}

function BenefitCard({ benefit }: { benefit: BenefitResult }) {
  return (
    <li>
      <a
        className="news-card"
        href={benefit.url}
        rel="noopener noreferrer"
        onClick={(e) => openExternal(e, benefit.url)}
      >
        <span className={ddayTone(benefit.dday)}>{ddayLabel(benefit.dday)}</span>
        <span className="news-body">
          <span className="news-title">{benefit.name}</span>
          <span className="news-meta">
            <strong>{benefit.amount}</strong> · {benefit.agency} · {benefit.source}
          </span>
        </span>
      </a>
    </li>
  );
}

function App() {
  const [keyword, setKeyword] = useState("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState<SearchFilter["region"]>("전체");
  const [target, setTarget] = useState<SearchFilter["target"]>("전체");
  const [kind, setKind] = useState<SearchFilter["kind"]>("전체");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [results, setResults] = useState<BenefitResult[] | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const userKeyRef = useRef<string | null>(null);

  // 시작할 때 한 번만 식별키를 받고, 이 사용자가 마지막으로 쓴 검색 조건을 되살려요.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userKey = await loadUserKey();
      userKeyRef.current = userKey;
      const saved = await loadConditions(userKey);
      if (cancelled || !saved) return;
      setKeyword(saved.keyword);
      setAge(saved.age);
      setRegion(saved.region);
      setTarget(saved.target);
      setOnlyOpen(saved.onlyOpen);
      // 종류를 추가하기 전에 저장된 조건에는 kind가 없어요.
      setKind(saved.kind ?? "전체");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async () => {
    if (userKeyRef.current) {
      saveConditions(userKeyRef.current, { keyword, age, region, target, kind, onlyOpen });
    }
    const parsedAge = Number.parseInt(age, 10);
    const found = await searchBenefits({
      age: Number.isNaN(parsedAge) ? null : parsedAge,
      region,
      target,
      kind,
      onlyOpen,
      keyword,
    });
    setResults(found);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">지원금 찾기</h1>
        <p className="subtitle">조건에 맞는 정부·지자체 지원금을 빠르게 찾고 비교해요.</p>
      </header>

      <form className="search-bar" role="search" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="search"
          placeholder="지원금 이름이나 기관을 검색해 보세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="지원금 검색"
        />
        <button className="search-button" type="submit" aria-label="검색">
          <SearchIcon />
        </button>
      </form>

      <div className="kind-row" role="group" aria-label="지원금 종류">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className={kind === k ? "chip chip--selected" : "chip"}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <section className="section">
        <h2 className="section-title">누구를 위한 지원금인가요?</h2>
        <div className="tile-grid">
          {TARGETS.map((t) => (
            <button
              key={t}
              type="button"
              className={target === t ? "tile tile--selected" : "tile"}
              aria-pressed={target === t}
              onClick={() => setTarget(t)}
            >
              <span className="tile-icon" aria-hidden="true">
                {TARGET_ICONS[t]}
              </span>
              <span className="tile-label">{t}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">나이</h2>
        <label className="age-field">
          <input
            className="age-input"
            inputMode="numeric"
            placeholder="만 나이 (선택)"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
          <span className="age-suffix">세</span>
        </label>
      </section>

      <section className="section">
        <h2 className="section-title">사는 곳</h2>
        <div className="chips">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={region === r ? "chip chip--selected" : "chip"}
              aria-pressed={region === r}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">신청 상태</h2>
        <div className="chips">
          {[
            { value: true, label: "신청 가능한 것만" },
            { value: false, label: "마감 포함" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              className={onlyOpen === o.value ? "chip chip--selected" : "chip"}
              aria-pressed={onlyOpen === o.value}
              onClick={() => setOnlyOpen(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section ref={resultsRef} className="results">
        {results !== null &&
          (results.length === 0 ? (
            <Result
              title="조건에 맞는 지원금이 없어요"
              description="검색어나 지역, 대상을 바꿔서 다시 찾아보세요."
            />
          ) : (
            <>
              <div className="results-header">
                <h2 className="results-title">
                  검색 결과 <em>{results.length}</em>건
                </h2>
                <span className="results-sort">마감 임박순</span>
              </div>
              <ul className="news-list">
                {results.map((b) => (
                  <BenefitCard key={b.id} benefit={b} />
                ))}
              </ul>
              <p className="notice">
                보조금24·기업마당 공고를 바탕으로 안내해요. 신청 전에 원문에서 자격요건과
                신청기간을 꼭 확인해 주세요.
              </p>
            </>
          ))}
      </section>

      <FixedBottomCTA onClick={handleSearch}>
        {results === null ? "지원금 찾기" : "이 조건으로 다시 찾기"}
      </FixedBottomCTA>
    </div>
  );
}

export default App;
