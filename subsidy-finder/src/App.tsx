import {
  Chip,
  ChipItem,
  FixedBottomCTA,
  ListRow,
  Result,
  SegmentedControl,
  TextField,
  Top,
} from "@toss/tds-mobile";
import { useRef, useState } from "react";

import {
  REGIONS,
  TARGETS,
  searchBenefits,
  type BenefitResult,
  type SearchFilter,
} from "./benefits";
import "./App.css";

function DdayText({ dday }: { dday: number | null }) {
  if (dday === null) return <span className="dday dday--muted">상시</span>;
  if (dday < 0) return <span className="dday dday--muted">마감</span>;
  return (
    <span className={dday <= 7 ? "dday dday--urgent" : "dday"}>
      {dday === 0 ? "오늘 마감" : `D-${dday}`}
    </span>
  );
}

function SummaryCard({ results }: { results: BenefitResult[] }) {
  const closingThisWeek = results.filter((b) => b.dday !== null && b.dday >= 0 && b.dday <= 7);
  const always = results.filter((b) => b.dday === null);
  return (
    <div className="summary-card">
      <p className="summary-label">받을 수 있는 지원금</p>
      <p className="summary-value">{results.length}개</p>
      <p className="summary-desc">
        이번 주 마감 {closingThisWeek.length}개 · 상시 신청 {always.length}개
      </p>
    </div>
  );
}

function App() {
  const [age, setAge] = useState("");
  const [region, setRegion] = useState<SearchFilter["region"]>("전체");
  const [target, setTarget] = useState<SearchFilter["target"]>("전체");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [results, setResults] = useState<BenefitResult[] | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    const parsedAge = Number.parseInt(age, 10);
    const found = await searchBenefits({
      age: Number.isNaN(parsedAge) ? null : parsedAge,
      region,
      target,
      onlyOpen,
    });
    setResults(found);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <div className="page">
      <Top
        title={<Top.TitleParagraph size={22}>나에게 맞는 지원금 찾기</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            조건을 알려주면 받을 수 있는 지원금을 골라드려요.
          </Top.SubtitleParagraph>
        }
      />

      <TextField
        variant="box"
        label="나이"
        labelOption="sustain"
        placeholder="만 나이를 입력해 주세요"
        inputMode="numeric"
        suffix="세"
        value={age}
        onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
      />

      <div className="section" style={{ marginTop: 28 }}>
        <h2 className="section-title">대상</h2>
        <Chip size="small" wrap>
          {TARGETS.map((t) => (
            <ChipItem key={t} selected={target === t} onClick={() => setTarget(t)}>
              {t}
            </ChipItem>
          ))}
        </Chip>
      </div>

      <div className="section">
        <h2 className="section-title">사는 곳</h2>
        <Chip size="small" wrap>
          {REGIONS.map((r) => (
            <ChipItem key={r} selected={region === r} onClick={() => setRegion(r)}>
              {r}
            </ChipItem>
          ))}
        </Chip>
      </div>

      <div className="section">
        <h2 className="section-title">신청 상태</h2>
        <SegmentedControl
          size="small"
          value={onlyOpen ? "open" : "all"}
          onChange={(v) => setOnlyOpen(v === "open")}
        >
          <SegmentedControl.Item value="open">신청 가능</SegmentedControl.Item>
          <SegmentedControl.Item value="all">마감 포함</SegmentedControl.Item>
        </SegmentedControl>
      </div>

      <div ref={resultsRef}>
        {results !== null && (
          <>
            <div className="divider" />
            {results.length === 0 ? (
              <Result
                title="조건에 맞는 지원금이 없어요"
                description="지역이나 대상을 바꿔서 다시 찾아보세요."
              />
            ) : (
              <>
                <SummaryCard results={results} />
                <ul style={{ margin: 0, padding: 0 }}>
                  {results.map((b) => (
                    <ListRow
                      key={b.id}
                      withTouchEffect
                      onClick={() => window.open(b.url, "_blank", "noopener,noreferrer")}
                      contents={
                        <ListRow.Texts
                          type="2RowTypeA"
                          top={b.name}
                          bottom={`${b.support} · ${b.agency}`}
                        />
                      }
                      right={
                        <span className="row-right">
                          <span className="amount">{b.amount}</span>
                          <DdayText dday={b.dday} />
                        </span>
                      }
                    />
                  ))}
                </ul>
                <p className="notice">
                  보조금24·기업마당 공고를 바탕으로 안내해요. 신청 전에 원문에서 자격요건과
                  신청기간을 꼭 확인해 주세요.
                </p>
              </>
            )}
          </>
        )}
      </div>

      <FixedBottomCTA onClick={handleSearch}>
        {results === null ? "지원금 찾기" : "이 조건으로 다시 찾기"}
      </FixedBottomCTA>
    </div>
  );
}

export default App;
