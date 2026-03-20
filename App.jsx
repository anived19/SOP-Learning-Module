import { useState, Fragment } from "react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const DEMO_SOP = `STANDARD OPERATING PROCEDURE
Nutrabay — Customer Complaint & Return Handling
Version 1.2 | Effective: January 2025

PURPOSE
Standardize complaint and return handling across all customer service channels to ensure fast, consistent, and customer-friendly resolution.

SCOPE
Applies to all customer service representatives handling post-purchase queries via email, chat, or phone.

STEP 1 — Receive & Log Complaint
• Acknowledge customer within 2 hours of first contact
• Log in CRM: Order ID, issue type, customer contact details
• Assign priority: High (damaged/wrong product), Medium (delayed delivery), Low (general query)

STEP 2 — Verify Order Details
• Pull order record using Order ID from system
• Confirm purchase date, product, and delivery status
• Check if request falls within the 7-day return window

STEP 3 — Categorize & Resolve
• Damaged/Wrong Product → Initiate replacement + send prepaid return label
• Delayed Delivery → Escalate to logistics team; provide update within 24 hrs
• Quality Issue → Escalate to QA team; offer refund or replacement
• General Query → Resolve directly and close ticket

STEP 4 — Process Refund/Return (if applicable)
• Approve in system (supervisor sign-off required for orders > ₹2,000)
• Refund processed within 5–7 business days to original payment method
• Send confirmation email with timeline to customer

STEP 5 — Close & Document
• Update CRM with resolution details and complaint category tag
• Tag complaint type for monthly trend analysis
• Follow up with customer after 48 hours to confirm satisfaction

ESCALATION MATRIX
• Level 1 (CS Rep): resolution value < ₹500
• Level 2 (Team Lead): ₹500–₹2,000
• Level 3 (Manager): > ₹2,000 or any legal concerns

KEY PERFORMANCE INDICATORS
• First Response Time: < 2 hours
• Resolution Time: < 48 hours
• Customer Satisfaction Score: > 4.2 / 5`;

const SYSTEM_PROMPT = `You are a corporate training designer. Convert the given SOP into a structured training module.
Return ONLY valid compact JSON — no markdown, no backticks, no explanation. Exact schema:
{"title":"string","summary":"2-3 sentences","keyPoints":["...","...","..."],"modules":[{"id":1,"title":"string","objective":"string","steps":["...","...","..."]}],"quiz":[{"q":"string","opts":["A","B","C","D"],"ans":0,"exp":"string"}],"path":[{"id":1,"label":"short string","type":"intro"}]}
Constraints: 3-4 modules, exactly 5 quiz questions, ans is index 0-3, 5-7 path nodes with types intro|step|assess. Keep all values concise.`;

const C = {
  teal:   { bg: "#E6F5F2", border: "#5DCAA5", text: "#0F6E56", dot: "#1D9E75" },
  amber:  { bg: "#FDF3E0", border: "#EF9F27", text: "#854F0B", dot: "#BA7517" },
  purple: { bg: "#EEEDFE", border: "#AFA9EC", text: "#3C3489", dot: "#7F77DD" },
  coral:  { bg: "#FAECE7", border: "#F0997B", text: "#712B13", dot: "#D85A30" },
  gray:   { bg: "#F5F4F0", border: "#B4B2A9", text: "#444441", dot: "#888780" },
};

const MOD_COLS = [C.teal, C.purple, C.amber, C.coral];
const PATH_COLS = { intro: C.teal, step: C.purple, assess: C.amber };

export default function App() {
  const [sop, setSop] = useState(DEMO_SOP);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("summary");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState({ 0: true });
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true); setError(null); setResult(null);
    setAnswers({}); setSubmitted(false); setExpanded({ 0: true });
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + sop.slice(0, 3000) }] }],
            generationConfig: { temperature: 0.3 },
          }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        const status = res.status;
        if (status === 429) throw new Error("429");
        if (status === 403) throw new Error("403");
        throw new Error(String(status));
      }

      const raw = data.candidates[0].content.parts[0].text;
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("JSON");
      setResult(JSON.parse(match[0]));
      setTab("summary");
    } catch (e) {
      console.error(e);
      const msg = e?.message || "";
      if (msg.includes("429")) setError("Rate limited — wait 30 seconds and try again.");
      else if (msg.includes("403")) setError("Invalid API key — check your .env file.");
      else if (msg.includes("JSON")) setError("Model returned an unexpected format — try again.");
      else setError("Generation failed — " + (msg || "unknown error"));
    } finally {
      setLoading(false);
    }
  }

  const score = result ? result.quiz?.filter((q, i) => answers[i] === q.ans).length : 0;
  const TABS = [["summary","Summary"],["modules","Modules"],["quiz","Quiz"],["path","Learning path"]];

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", padding: "1.25rem", background: "#F7F6F2", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:.25;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
        textarea:focus { outline: none; border-color: #5DCAA5 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0F6E56", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "5px" }}>
            <span style={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", letterSpacing: ".06em", textTransform: "uppercase" }}>Nutrabay AI</span>
            <span style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", fontSize: "10px", padding: "2px 8px", borderRadius: "4px" }}>Option 4 · Advanced</span>
          </div>
          <h1 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 2px", color: "#fff" }}>SOP Training Generator</h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,.6)", margin: 0 }}>Paste any SOP — auto-generate modules, quiz, and learning path.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[["Modules", result?.modules?.length], ["Quiz Qs", result?.quiz?.length], ["Path nodes", result?.path?.length]].map(([lbl, val]) => (
            <div key={lbl} style={{ background: "rgba(255,255,255,.1)", borderRadius: "10px", padding: "7px 13px", textAlign: "center", minWidth: "60px" }}>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "2px" }}>{lbl}</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>{val ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.75fr)", gap: "1rem", alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ background: "#fff", border: "1px solid #E2E0D9", borderRadius: "12px", padding: "1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1D9E75" }} />
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#888780", textTransform: "uppercase", letterSpacing: ".06em" }}>SOP Document</span>
          </div>
          <textarea value={sop} onChange={e => setSop(e.target.value)} style={{ width: "100%", height: "280px", fontSize: "10.5px", fontFamily: "monospace", lineHeight: 1.7, resize: "vertical", background: "#FAFAF8", border: "1px solid #E2E0D9", borderRadius: "8px", padding: "9px", color: "#2C2C2A" }} />
          <button onClick={generate} disabled={loading || !sop.trim()} style={{ width: "100%", padding: "10px", marginTop: "9px", fontSize: "13px", fontWeight: 700, cursor: (loading || !sop.trim()) ? "default" : "pointer", background: (loading || !sop.trim()) ? "#B4B2A9" : "#0F6E56", color: "#fff", border: "none", borderRadius: "8px" }}>
            {loading ? "Generating..." : "Generate training module →"}
          </button>
          {error && (
            <div style={{ marginTop: "9px", background: C.coral.bg, border: `1px solid ${C.coral.border}`, borderRadius: "8px", padding: "8px 12px" }}>
              <p style={{ fontSize: "12px", color: C.coral.text, margin: 0 }}>{error}</p>
            </div>
          )}
          <div style={{ marginTop: "11px", background: C.teal.bg, border: `1px solid ${C.teal.border}`, borderRadius: "8px", padding: "9px 12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: C.teal.text, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 2px" }}>Demo loaded</p>
            <p style={{ fontSize: "11px", color: C.teal.text, margin: 0, lineHeight: 1.55, opacity: .85 }}>Nutrabay Complaint &amp; Return Handling SOP v1.2. Replace with any SOP document.</p>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {!result && !loading && (
            <div style={{ background: "#fff", border: "1px solid #E2E0D9", borderRadius: "12px", padding: "3.5rem 2rem", textAlign: "center" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: C.teal.bg, border: `1px solid ${C.teal.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 11px" }}>
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                  <rect x="2" y="1" width="14" height="18" rx="2" stroke="#1D9E75" strokeWidth="1.2"/>
                  <line x1="5" y1="7" x2="13" y2="7" stroke="#1D9E75" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="5" y1="10.5" x2="13" y2="10.5" stroke="#1D9E75" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="5" y1="14" x2="10" y2="14" stroke="#1D9E75" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#2C2C2A", margin: "0 0 4px" }}>Ready to generate</p>
              <p style={{ fontSize: "12px", color: "#888780", margin: 0 }}>Click generate to convert the SOP into interactive training content.</p>
            </div>
          )}

          {loading && (
            <div style={{ background: "#fff", border: "1px solid #E2E0D9", borderRadius: "12px", padding: "3.5rem 2rem", textAlign: "center" }}>
              <div style={{ display: "flex", gap: "7px", justifyContent: "center", marginBottom: "13px" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1D9E75", animation: `pulse 1.2s ease-in-out ${i*.2}s infinite` }} />)}
              </div>
              <p style={{ fontSize: "13px", color: "#5F5E5A", margin: 0 }}>Analyzing SOP and building training content...</p>
            </div>
          )}

          {result && (
            <div style={{ background: "#fff", border: "1px solid #E2E0D9", borderRadius: "12px", overflow: "hidden" }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #E2E0D9", background: "#FAFAF8", padding: "8px 12px 0", gap: "2px" }}>
                {TABS.map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)} style={{ fontSize: "12.5px", fontWeight: tab===id ? 700 : 400, padding: "7px 12px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", background: tab===id ? "#fff" : "transparent", color: tab===id ? "#0F6E56" : "#888780", borderBottom: tab===id ? "2px solid #1D9E75" : "2px solid transparent" }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ padding: "1.1rem" }}>

                {/* SUMMARY */}
                {tab === "summary" && (
                  <div>
                    <div style={{ background: C.teal.bg, border: `1px solid ${C.teal.border}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "1rem" }}>
                      <h2 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 5px", color: C.teal.text }}>{result.title}</h2>
                      <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: C.teal.text, margin: 0, opacity: .85 }}>{result.summary}</p>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#888780", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>Key points</p>
                    {result.keyPoints?.map((pt, i) => (
                      <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "7px", alignItems: "flex-start", background: i%2===0 ? "#FAFAF8" : "#fff", borderRadius: "8px", padding: "8px 10px", border: "1px solid #EEECE8" }}>
                        <span style={{ minWidth: "22px", height: "22px", borderRadius: "50%", background: MOD_COLS[i%4].bg, border: `1px solid ${MOD_COLS[i%4].border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: MOD_COLS[i%4].text, flexShrink: 0 }}>{i+1}</span>
                        <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.65, color: "#2C2C2A" }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* MODULES */}
                {tab === "modules" && (
                  <div>
                    {result.modules?.map((m, i) => {
                      const c = MOD_COLS[i%4];
                      return (
                        <div key={i} style={{ marginBottom: "8px", border: `1px solid ${expanded[i] ? c.border : "#E2E0D9"}`, borderRadius: "10px", overflow: "hidden" }}>
                          <button onClick={() => setExpanded(e => ({...e,[i]:!e[i]}))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: expanded[i] ? c.bg : "#fff", border: "none", cursor: "pointer", textAlign: "left" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ width: "26px", height: "26px", borderRadius: "7px", background: c.dot, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{String(m.id||i+1).padStart(2,"0")}</span>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: expanded[i] ? c.text : "#2C2C2A" }}>{m.title}</span>
                            </div>
                            <span style={{ color: c.dot, fontSize: "20px", lineHeight: 1 }}>{expanded[i] ? "−" : "+"}</span>
                          </button>
                          {expanded[i] && (
                            <div style={{ padding: "11px 14px", borderTop: `1px solid ${c.border}`, background: "#fff" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: "6px", padding: "4px 10px", marginBottom: "10px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: c.text }}>Objective:</span>
                                <span style={{ fontSize: "11.5px", color: c.text, opacity: .85 }}>{m.objective}</span>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                                {m.steps?.map((step, j) => (
                                  <li key={j} style={{ fontSize: "12.5px", lineHeight: 1.75, marginBottom: "3px", color: "#3d3d3a" }}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* QUIZ */}
                {tab === "quiz" && (
                  <div>
                    {result.quiz?.map((q, i) => (
                      <div key={i} style={{ marginBottom: "1rem", padding: "12px 14px", background: "#FAFAF8", borderRadius: "10px", border: "1px solid #E2E0D9" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 9px", lineHeight: 1.55, color: "#2C2C2A", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "21px", height: "21px", borderRadius: "5px", background: C.amber.bg, color: C.amber.text, fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>{i+1}</span>
                          {q.q}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {q.opts?.map((opt, j) => {
                            const sel = answers[i]===j, correct = j===q.ans;
                            let bg="#fff", border="1px solid #E2E0D9", color="#3d3d3a";
                            if (submitted) {
                              if (correct) { bg=C.teal.bg; border=`1.5px solid ${C.teal.border}`; color=C.teal.text; }
                              else if (sel) { bg=C.coral.bg; border=`1.5px solid ${C.coral.border}`; color=C.coral.text; }
                            } else if (sel) { bg=C.purple.bg; border=`1.5px solid ${C.purple.border}`; color=C.purple.text; }
                            return (
                              <button key={j} onClick={() => !submitted && setAnswers(a=>({...a,[i]:j}))} style={{ textAlign: "left", padding: "8px 11px", fontSize: "12.5px", background: bg, border, borderRadius: "7px", cursor: submitted?"default":"pointer", color, display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ width: "19px", height: "19px", borderRadius: "4px", border: "1px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0, opacity: .7 }}>{String.fromCharCode(65+j)}</span>
                                <span style={{ flex: 1 }}>{opt}</span>
                                {submitted && correct && <span>✓</span>}
                                {submitted && sel && !correct && <span>✗</span>}
                              </button>
                            );
                          })}
                        </div>
                        {submitted && q.exp && (
                          <div style={{ marginTop: "8px", padding: "7px 10px", background: answers[i]===q.ans ? C.teal.bg : C.amber.bg, borderRadius: "6px", border: `1px solid ${answers[i]===q.ans ? C.teal.border : C.amber.border}` }}>
                            <p style={{ fontSize: "11.5px", color: answers[i]===q.ans ? C.teal.text : C.amber.text, margin: 0, lineHeight: 1.6 }}>{q.exp}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {!submitted ? (
                      <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < (result.quiz?.length||0)} style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", background: "#0F6E56", color: "#fff", border: "none", borderRadius: "8px", opacity: Object.keys(answers).length < (result.quiz?.length||0) ? .35 : 1 }}>
                        Submit answers
                      </button>
                    ) : (
                      <div style={{ background: score>=(result.quiz?.length||0)*.8 ? C.teal.bg : C.amber.bg, border: `1px solid ${score>=(result.quiz?.length||0)*.8 ? C.teal.border : C.amber.border}`, borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                        <p style={{ fontSize: "24px", fontWeight: 700, color: score>=(result.quiz?.length||0)*.8 ? C.teal.text : C.amber.text, margin: "0 0 3px" }}>{score} / {result.quiz?.length}</p>
                        <p style={{ fontSize: "12.5px", color: score>=(result.quiz?.length||0)*.8 ? C.teal.text : C.amber.text, margin: 0, opacity: .8 }}>
                          {score===result.quiz?.length ? "Perfect score — training complete!" : score>=(result.quiz?.length||0)*.8 ? "Well done — competency demonstrated" : "Review the modules and try again"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* LEARNING PATH */}
                {tab === "path" && (
                  <div>
                    <p style={{ fontSize: "12.5px", color: "#5F5E5A", margin: "0 0 1.1rem", lineHeight: 1.65 }}>
                      Recommended sequence for completing this training. Each node represents a stage the employee moves through.
                    </p>
                    <div style={{ overflowX: "auto", paddingBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", minWidth: "max-content", padding: "8px 4px" }}>
                        {result.path?.map((node, i) => {
                          const c = PATH_COLS[node.type] || C.gray;
                          return (
                            <Fragment key={node.id}>
                              <div style={{ textAlign: "center", width: "90px" }}>
                                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: c.dot, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", boxShadow: `0 0 0 3px ${c.bg}, 0 0 0 5px ${c.border}` }}>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{i+1}</span>
                                </div>
                                <div style={{ fontSize: "9px", color: c.text, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "2px", opacity: .7 }}>{node.type}</div>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "#2C2C2A", lineHeight: 1.35 }}>{node.label}</div>
                              </div>
                              {i < result.path.length-1 && (
                                <div style={{ height: "1px", width: "20px", background: "#D3D1C7", marginTop: "17px", flexShrink: 0 }} />
                              )}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #E2E0D9" }}>
                      {[["intro","Introduction"],["step","Module"],["assess","Assessment"]].map(([type, label]) => {
                        const c = PATH_COLS[type];
                        return (
                          <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: "6px", padding: "4px 10px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.dot }} />
                            <span style={{ fontSize: "11px", color: c.text, fontWeight: 700 }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}