(() => {
  const $ = (id) => document.getElementById(id);

  const apiKeyEl = $("apiKey");
  const saveKeyBtn = $("saveKeyBtn");
  const clearKeyBtn = $("clearKeyBtn");
  const maxTokensEl = $("maxTokens");
  const maxTokensValEl = $("maxTokensVal");
  const emailTextEl = $("emailText");
  const summarizeBtn = $("summarizeBtn");
  const outEl = $("out");
  const copyBtn = $("copyBtn");
  const clearOutBtn = $("clearOutBtn");
  const exKrBtn = $("exKr");
  const exEnBtn = $("exEn");

  // 저장된 API 키 불러오기
  apiKeyEl.value = localStorage.getItem("OPENAI_API_KEY") || "";

  // 키 저장/삭제
  saveKeyBtn.addEventListener("click", () => {
    localStorage.setItem("OPENAI_API_KEY", apiKeyEl.value.trim());
    toast("API 키 저장됨");
  });
  clearKeyBtn.addEventListener("click", () => {
    localStorage.removeItem("OPENAI_API_KEY");
    apiKeyEl.value = "";
    toast("API 키 삭제됨");
  });

  // 토큰 슬라이더 표시 업데이트
  maxTokensValEl.textContent = maxTokensEl.value;
  maxTokensEl.addEventListener("input", () => {
    maxTokensValEl.textContent = maxTokensEl.value;
  });

  // 결과 복사 / 초기화
  copyBtn.addEventListener("click", async () => {
    const text = outEl.textContent || "";
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    toast("요약 복사 완료");
  });
  clearOutBtn.addEventListener("click", () => {
    outEl.textContent = "(아직 요약 없음)";
  });

  // 예시 텍스트
  exKrBtn.addEventListener("click", () => {
    emailTextEl.value = `안녕하세요 팀,\n\n내일(10/18) 2시 회의에서 베타 출시 범위 확정하려고 합니다.\n- 마케팅: 랜딩 페이지 초안은 10/19까지(철수)\n- 엔지니어링: 알림 기능 제외하고 QA 완료(기영)\n- 디자인: 모달 접근성 이슈 해결(민지)\n\n의견이나 리스크 있으면 오늘 오후 6시 전까지 회신 부탁드립니다.\n감사합니다.\n`;
  });
  exEnBtn.addEventListener("click", () => {
    emailTextEl.value = `Hi team,\n\nFor tomorrow's 2pm meeting (10/18), we plan to finalize the beta scope:\n- Marketing: landing page draft by 10/19 (Chul-Soo)\n- Engineering: finish QA excluding notifications (Ki-Young)\n- Design: resolve modal a11y issue (Minji)\n\nPlease reply with risks or blockers by 6pm today.\nThanks!\n`;
  });

  // 요약 실행
  summarizeBtn.addEventListener("click", async () => {
    const apiKey = apiKeyEl.value.trim();
    const model = "gpt-4o-mini"; // 🔒 모델 고정
    const maxTokens = Number(maxTokensEl.value) || 300;
    const text = emailTextEl.value.trim();
    if (!apiKey) return (outEl.textContent = "API 키를 입력하세요.");
    if (!text) return (outEl.textContent = "이메일 텍스트를 입력하세요.");

    outEl.textContent = "요약 중…";

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: maxTokens,
          messages: [
            {
              role: "system",
              content:
                "You write crisp, localized (same language as input) email summaries with bullets and explicit action items.",
            },
            {
              role: "user",
              content: [
                "다음 이메일 스레드를 바쁜 사람이 빠르게 파악할 수 있도록 요약해줘.",
                "- 3–5줄 핵심 요약",
                "- Action items (담당자/기한이 있으면 함께)",
                "- 데드라인 하이라이트",
                "",
                "Thread:",
                text,
              ].join("\\n"),
            },
          ],
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error("API 오류: " + t);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim() || "(빈 응답)";
      renderPrettySummary(content);
    } catch (e) {
      outEl.textContent = "Error: " + (e.message || e);
    }
  });

  // 작은 알림창
  function toast(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    div.style.position = "fixed";
    div.style.bottom = "16px";
    div.style.right = "16px";
    div.style.padding = "10px 14px";
    div.style.background = "rgba(0,0,0,0.75)";
    div.style.color = "#fff";
    div.style.borderRadius = "10px";
    div.style.zIndex = "9999";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1600);
  }
})();

// --- Pretty Summary Renderer ---
function renderPrettySummary(raw) {
  const out = document.getElementById("out");
  try {
    const parsed = parseSections(raw);
    out.innerHTML = [
      // 핵심 요약
      parsed.summary.length ? `
        <div class="s-card">
          <h3>📄 <span class="badge badge-blue">핵심 요약</span></h3>
          <ul class="s-list">
            ${parsed.summary.map(li => `<li>${escapeHTML(li)}</li>`).join("")}
          </ul>
        </div>` : "",

      // 액션 아이템 (표)
      parsed.actions.length ? `
        <div class="s-card">
          <h3>✅ <span class="badge badge-green">Action items</span></h3>
          <table class="s-table">
            <thead><tr><th>팀</th><th>작업</th><th>담당</th><th>기한</th></tr></thead>
            <tbody>
              ${parsed.actions.map(ai => `
                <tr>
                  <td>${escapeHTML(ai.team || "")}</td>
                  <td>${escapeHTML(ai.task || "")}</td>
                  <td>${escapeHTML(ai.owner || "")}</td>
                  <td class="s-deadline">${escapeHTML(ai.due || "")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>` : "",

      // 데드라인
      parsed.deadlines.length ? `
        <div class="s-card">
          <h3>🕒 <span class="badge badge-amber">데드라인</span></h3>
          <ul class="s-list">
            ${parsed.deadlines.map(dl => `<li class="s-deadline">${escapeHTML(dl)}</li>`).join("")}
          </ul>
        </div>` : ""
    ].join("") || `<div class="s-card"><em>표시할 항목이 없습니다.</em></div>`;
  } catch (e) {
    // 파서 실패 시 순수 텍스트로 폴백
    out.textContent = raw;
  }
}

function escapeHTML(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * 간단 파서:
 * - 섹션 제목을 기반으로 분리(핵심/Action/데드라인)
 * - 액션 라인 패턴 파싱: "- 팀: 작업 (담당: OO, 기한: XX)" 형태
 * - 유연 파싱: "담당", "owner", "기한", "deadline" 한국어/영어 섞여도 인식
 */
function parseSections(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 섹션 인덱스 잡기
  const idx = {
    summary: findIndex(lines, /^(?:\*{0,2}\s*)?(핵심\s*요약|summary|tldr)/i),
    actions: findIndex(lines, /^(?:\*{0,2}\s*)?(action\s*items?|todo|tasks?)/i),
    deadlines: findIndex(lines, /^(?:\*{0,2}\s*)?(데드라인|deadline|due\s*dates?)/i),
  };

  const ranges = sliceByHeaders(lines, idx);

  // 1) 핵심 요약: 불릿만 추출
  const summary = (ranges.summary || []).filter(l => /^[-*•]/.test(l))
                                        .map(l => l.replace(/^[-*•]\s*/, ""));

  // 2) 액션 아이템: 각 줄 파싱
  const actions = (ranges.actions || [])
    .filter(l => /^[-*•]/.test(l))
    .map(l => l.replace(/^[-*•]\s*/, ""))
    .map(parseActionLine)
    .filter(x => x && (x.team || x.task));

  // 3) 데드라인: 불릿 추출
  const deadlines = (ranges.deadlines || [])
    .filter(l => /^[-*•]/.test(l))
    .map(l => l.replace(/^[-*•]\s*/, ""));

  return { summary, actions, deadlines };
}

function findIndex(arr, regex) {
  const i = arr.findIndex(l => regex.test(l.replace(/\*\*/g, "")));
  return i === -1 ? null : i;
}

function sliceByHeaders(lines, idx) {
  // 섹션 순서대로 범위를 계산
  const order = ["summary", "actions", "deadlines"]
    .map(k => ({ k, i: idx[k] }))
    .filter(x => x.i !== null)
    .sort((a, b) => a.i - b.i);

  const out = { summary: [], actions: [], deadlines: [] };
  if (!order.length) return out;

  for (let n = 0; n < order.length; n++) {
    const start = order[n].i + 1; // 제목 다음 줄부터
    const end = (order[n + 1]?.i ?? lines.length) - 0;
    out[order[n].k] = lines.slice(start, end);
  }
  return out;
}

// "- 팀: 작업 (담당: OOO, 기한: 10/19)" 형태 파싱
function parseActionLine(line) {
  // 먼저 "팀: 작업" 구조 분리 시도
  let team = "", task = line, owner = "", due = "";

  // "팀: 내용" 패턴 (마케팅: 랜딩 제출)
  const m1 = line.match(/^([^:：]+)\s*[:：]\s*(.+)$/);
  if (m1) {
    team = m1[1].trim();
    task = m1[2].trim();
  }

  // 괄호 안 메타정보 추출
  // (담당: OOO, 기한: 10/19) 또는 (owner: XX, deadline: YY)
  const meta = task.match(/\(([^)]+)\)$/);
  if (meta) {
    const metaStr = meta[1];
    task = task.replace(/\s*\([^)]+\)\s*$/, "").trim();

    const ownerMatch = metaStr.match(/(?:담당|owner)\s*[:：]\s*([^,]+)\s*/i);
    const dueMatch = metaStr.match(/(?:기한|deadline|due)\s*[:：]\s*([^,]+)\s*/i);
    if (ownerMatch) owner = ownerMatch[1].trim();
    if (dueMatch) due = dueMatch[1].trim();
  }

  // 문장 끝에 날짜가 있는 케이스도 보정 (ex. "... 기한: 10/19")
  if (!due) {
    const tailDue = task.match(/(?:기한|deadline|due)\s*[:：]\s*([^\s)]+.*)$/i);
    if (tailDue) {
      due = tailDue[1].trim();
      task = task.replace(/\s*(?:기한|deadline|due)\s*[:：]\s*[^\s)]+.*$/i, "").trim();
    }
  }

  return { team, task, owner, due };
}
