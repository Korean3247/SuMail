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
      outEl.textContent = content;
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
