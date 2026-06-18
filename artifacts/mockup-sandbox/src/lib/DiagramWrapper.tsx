import { useEffect, useRef } from "react";

let mermaidLoaded = false;
let mermaidLoading = false;
const listeners: (() => void)[] = [];

function loadMermaid(cb: () => void) {
  if (mermaidLoaded) { cb(); return; }
  listeners.push(cb);
  if (mermaidLoading) return;
  mermaidLoading = true;
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
  script.onload = () => {
    mermaidLoaded = true;
    listeners.forEach((fn) => fn());
    listeners.length = 0;
  };
  document.head.appendChild(script);
}

export function useMermaid(diagram: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = "m-" + Math.random().toString(36).slice(2, 10);
    loadMermaid(() => {
      const m = (window as any).mermaid;
      if (!m || !ref.current) return;
      m.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose", fontSize: 13 });
      m.render(id, diagram)
        .then(({ svg }: { svg: string }) => { if (ref.current) ref.current.innerHTML = svg; })
        .catch((err: unknown) => { if (ref.current) ref.current.innerHTML = `<pre style="color:red;font-size:11px">${String(err)}</pre>`; });
    });
  }, [diagram]);
  return ref;
}

export function DiagramPage({ title, subtitle, diagram }: { title: string; subtitle: string; diagram: string }) {
  const ref = useMermaid(diagram);
  return (
    <div style={{ padding: "20px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 20px", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{title}</h2>
          <p style={{ margin: "3px 0 0", fontSize: "11px", opacity: 0.75 }}>{subtitle}</p>
        </div>
        <button
          style={{ fontSize: "11px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "4px 10px", borderRadius: "4px", cursor: "pointer" }}
          onClick={() => {
            const svg = ref.current?.querySelector("svg");
            if (!svg) return;
            const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = `${title.replace(/\s+/g, "-")}.svg`; a.click();
          }}
        >
          Telecharger SVG
        </button>
      </div>
      <div style={{ background: "#fff", borderRadius: "8px", padding: "16px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <div ref={ref} style={{ minHeight: "60px", display: "flex", justifyContent: "center" }}>
          <span style={{ color: "#94a3b8", fontSize: "12px", alignSelf: "center" }}>Chargement...</span>
        </div>
      </div>
    </div>
  );
}
