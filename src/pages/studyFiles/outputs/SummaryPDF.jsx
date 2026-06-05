import { useState } from "react";
import { Btn } from "../../../components/ui/Btn";
import { Ic } from "../../../components/ui/Icons";
import { SUMMARY_DATA } from "../../../data/mockData";

export function SummaryPDF() {
  const [activeKw, setActiveKw] = useState(new Set([0, 1]));
  const toggle = i => setActiveKw(prev => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });

  return (
    <div>
      <div className="mcq-header">
        <div className="output-title">{SUMMARY_DATA.title}</div>
        <div className="flex-center row-gap-8">
          <Btn variant="secondary" size="sm"><Ic n="download" s={13} /> Download</Btn>
          <Btn variant="secondary" size="sm"><Ic n="share" s={13} /> Share</Btn>
        </div>
      </div>

      <div className="card summary-card">
        <div className="summary-heading">Overview</div>
        <div className="summary-para">{SUMMARY_DATA.overview}</div>

        <div className="summary-heading">Key Points</div>
        <ul className="summary-list">
          {SUMMARY_DATA.points.map((pt, i) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
      </div>

      <div className="slabel gap-8">EXTRACTED KEYWORDS</div>
      <div className="kw-row">
        {SUMMARY_DATA.keywords.map((k, i) => (
          <div
            key={k}
            className={`kw-chip ${activeKw.has(i) ? "active" : ""}`}
            onClick={() => toggle(i)}
          >
            {k}
          </div>
        ))}
      </div>
    </div>
  );
}