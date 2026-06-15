import { useEffect, useState } from "react";
import { Btn } from "../../../components/ui/Btn";
import { Ic }  from "../../../components/ui/Icons";
import { outputsApi } from "../../../api/outputs.js";

// Minimal markdown → React elements (no dependency needed)
function renderMarkdown(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.startsWith("#### ")) return <h4 key={i} className="cv-h4">{line.slice(5)}</h4>;
    if (line.startsWith("### "))  return <h3 key={i} className="cv-h3">{line.slice(4)}</h3>;
    if (line.startsWith("## "))   return <h2 key={i} className="cv-h2">{line.slice(3)}</h2>;
    if (line.startsWith("# "))    return <h1 key={i} className="cv-h1">{line.slice(2)}</h1>;
    if (line.startsWith("- ") || line.startsWith("* "))
      return <li key={i} className="cv-li">{renderInline(line.slice(2))}</li>;
    if (!line.trim()) return <div key={i} className="cv-gap" />;
    return <p key={i} className="cv-p">{renderInline(line)}</p>;
  });
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function ContentViewer({ output }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!output?.id) return;
    setLoading(true);
    setError("");
    fetch(outputsApi.contentUrl(output.id))
      .then(r => r.json())
      .then(d => { setContent(d.content_markdown ?? ""); setLoading(false); })
      .catch(() => { setError("Could not load content."); setLoading(false); });
  }, [output?.id]);

  const handleDownload = () => {
    if (output?.downloadUrl) {
      const a = document.createElement("a");
      a.href = output.downloadUrl;
      a.download = `${output.name}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };

  return (
    <div>
      <div className="mcq-header">
        <div className="output-title">{output?.name ?? "Content"}</div>
        <div className="flex-center row-gap-8">
          {output?.downloadUrl && (
            <Btn variant="secondary" size="sm" onClick={handleDownload}>
              <Ic n="download" s={13} /> Download PDF
            </Btn>
          )}
        </div>
      </div>

      {loading && <div className="cv-loading">Loading…</div>}
      {error   && <div className="cv-error">{error}</div>}

      {!loading && !error && !content && (
        <div className="cv-empty">
          No content available. Generate outputs first to view this {output?.type?.toLowerCase()}.
        </div>
      )}

      {!loading && !error && content && (
        <div className="card cv-body">
          {renderMarkdown(content)}
        </div>
      )}
    </div>
  );
}
