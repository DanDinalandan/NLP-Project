import { useState } from "react";
import { Ic } from "../../components/ui/Icons";
import { Btn } from "../../components/ui/Btn";
import { Toggle } from "../../components/ui/Toggle";
import { PillGroup } from "../../components/ui/PillGroup";

export function GenerateModal({ onClose }) {
  const [type, setType] = useState("Flashcards");
  const [diff, setDiff] = useState("Easy");
  const [cards, setCards] = useState("10");
  const [kw, setKw] = useState(true);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box-large" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <div className="stepper">
            <div className="step done"><div className="step-dot"><Ic n="check" s={12}/></div> Upload files</div>
            <div className="step-line"></div>
            <div className="step cur"><div className="step-dot">X</div> Generate</div>
          </div>

          <div className="generate-grid">
            {/* Left Col: Upload Zone */}
            <div>
              <div className="drop-zone gap-20">
                <div className="drop-icon"><Ic n="upload" s={28} /></div>
                <div className="drop-title">Drop your files here</div>
                <div className="drop-sub">or click to browse from your device</div>
                <div className="format-pills">
                  {["PDF", "TXT", "PPTX", "CSV"].map(f => (
                    <div key={f} className="format-pill">{f}</div>
                  ))}
                </div>
              </div>
              <div className="slabel gap-8">UPLOADED FILES</div>
              
              <div className="source-row">
                <div className="file-type-badge file-type-badge-pdf">PDF</div>
                <div className="file-info">
                  <div className="file-name">Lecture_07_Biology.pdf</div>
                  <div className="file-size">2.4 MB · Uploading...</div>
                  <div className="upload-bar"><div className="upload-bar-fill" style={{ width: "60%" }} /></div>
                </div>
                <Ic n="x" s={14} c="var(--muted)" />
              </div>
            </div>

            {/* Right Col: Output Options */}
            <div>
              <div className="slabel gap-8">CHOOSE OUTPUT TYPE</div>
              <div className="output-type-grid">
                <TypeCard t="Flashcards" i="flashcard" d="Key terms with context-aware definitions" s={type} set={setType} />
                <TypeCard t="MCQ" i="mcq" d="Multiple choice questions from content" s={type} set={setType} />
                <TypeCard t="Fill-in-blanks" i="fib" d="Critical keywords removed from sentences" s={type} set={setType} />
                <TypeCard t="Summary PDF" i="summary" d="Abstractive summary with bullet points" s={type} set={setType} />
              </div>

              <div className="slabel gap-8">OPTIONS</div>
              <div className="card options-card gap-20">
                <div className="opt-row">
                  <div className="opt-label">Number of cards</div>
                  <PillGroup options={["10", "20", "30"]} value={cards} onChange={setCards} />
                </div>
                <div className="opt-row">
                  <div className="opt-label">Difficulty</div>
                  <PillGroup options={["Easy", "Medium", "Hard"]} value={diff} onChange={setDiff} />
                </div>
                <div className="opt-row">
                  <div className="opt-label">Extract keywords</div>
                  <Toggle checked={kw} onChange={() => setKw(!kw)} />
                </div>
              </div>

              <div className="flex-end-row">
                <Btn variant="ghost" onClick={onClose}>Back</Btn>
                <Btn variant="primary" onClick={onClose}><Ic n="sparkles" s={14} /> Generate</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeCard({ t, i, d, s, set }) {
  return (
    <div className={`output-type-card ${s === t ? "selected" : ""}`} onClick={() => set(t)}>
      <div className="output-type-header"><Ic n={i} s={16} c={s === t ? "var(--blue)" : "var(--lav)"} /> {t}</div>
      <div className="output-type-desc">{d}</div>
    </div>
  );
}