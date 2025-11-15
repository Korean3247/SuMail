
const $ = (sel)=>document.querySelector(sel);
const toast = (m)=>{ const t=$("#toast"); t.textContent=m; t.classList.remove("hidden"); setTimeout(()=>t.classList.add("hidden"),1400); };

$("#openOptions").addEventListener("click", ()=> chrome.runtime.openOptionsPage());

async function getKey(){
  return new Promise(resolve=>chrome.storage.sync.get(["OPENAI_API_KEY","LANG"],r=>resolve(r)));
}

function langToHint(v){
  if(v==="auto") return "Respond in the input language.";
  if(v.toLowerCase().includes("korean")) return "Respond in Korean.";
  if(v.toLowerCase().includes("japanese")) return "Respond in Japanese.";
  if(v.toLowerCase().includes("chinese")) return "Respond in Chinese.";
  if(v.toLowerCase().includes("uk")) return "Respond in British English.";
  return "Respond in English.";
}

$("#useTemplate").addEventListener("click", async ()=>{
  const tpl = "Subject: Apology for the delay\n\nDear Professor,\n\nI apologize for the delay in my response. I have attached the updated file and will meet the revised deadline.\n\nBest regards,\n[Your Name]";
  await navigator.clipboard.writeText(tpl);
  toast("Template copied to clipboard");
});

$("#moreTemplates").addEventListener("click", ()=>{
  toast("Coming soon: more templates");
});

$("#copySummary").addEventListener("click", async ()=>{
  const text = $("#summaryOut").innerText.trim();
  if(!text){ toast("Nothing to copy"); return; }
  await navigator.clipboard.writeText(text);
  toast("Copied");
});

$("#btnSummarize").addEventListener("click", async ()=>{
  const text = $("#inputText").value.trim();
  if(!text){ toast("Paste email text first"); return; }
  const {OPENAI_API_KEY} = await getKey();
  if(!OPENAI_API_KEY){ toast("Set API key in Settings"); return; }
  const lang = $("#language").value;
  $("#btnSummarize").disabled = true; $("#summaryOut").innerText = "Summarizing…";

  const prompt = [
    "Summarize the following email thread for a busy reader.",
    "- Output sections: (1) Summary bullets (3–5), (2) Action items (owner/due), (3) Deadlines.",
    langToHint(lang),
    "",
    "Thread:",
    text
  ].join("\n");

  try{
    const resp = await chrome.runtime.sendMessage({type:"OPENAI_CHAT", payload:{
      messages:[
        {role:"system", content:"You are a concise assistant producing business-ready summaries."},
        {role:"user", content: prompt}
      ],
      max_tokens: 400,
      temperature: 0.2
    }});
    if(resp.error){ throw new Error(resp.error); }
    $("#summaryOut").innerText = resp.content || "(empty)";
  }catch(e){
    $("#summaryOut").innerText = "Error: " + e.message;
  }finally{
    $("#btnSummarize").disabled = false;
  }
});

$("#btnAnalyze").addEventListener("click", async ()=>{
  const text = $("#inputText").value.trim();
  if(!text){ toast("Paste email text first"); return; }
  const {OPENAI_API_KEY} = await getKey();
  if(!OPENAI_API_KEY){ toast("Set API key in Settings"); return; }
  $("#btnAnalyze").disabled = true; $("#emotionOut").innerText = "Analyzing…";

  const prompt = [
    "Analyze the emotional tone (e.g., positive, neutral, negative, urgent, apologetic).",
    "Return brief bullets with confidence (0-1).",
    "",
    "Email thread:",
    text
  ].join("\n");

  try{
    const resp = await chrome.runtime.sendMessage({type:"OPENAI_CHAT", payload:{
      messages:[
        {role:"system", content:"You are an analyst that labels tone succinctly."},
        {role:"user", content: prompt}
      ],
      max_tokens: 200,
      temperature: 0.2
    }});
    if(resp.error){ throw new Error(resp.error); }
    $("#emotionOut").innerText = resp.content || "(empty)";
  }catch(e){
    $("#emotionOut").innerText = "Error: " + e.message;
  }finally{
    $("#btnAnalyze").disabled = false;
  }
});

$("#generateEmail").addEventListener("click", async ()=>{
  const text = $("#summaryOut").innerText.trim();
  const {OPENAI_API_KEY} = await getKey();
  if(!OPENAI_API_KEY){ toast("Set API key in Settings"); return; }
  if(!text){ toast("Generate a summary first"); return; }
  $("#generateEmail").disabled = true;

  try{
    const resp = await chrome.runtime.sendMessage({type:"OPENAI_CHAT", payload:{
      messages:[
        {role:"system", content:"Write a polite, concise email based on a meeting summary."},
        {role:"user", content: "Write an email draft (subject + body) based on this summary:\n" + text}
      ],
      max_tokens: 300,
      temperature: 0.4
    }});
    if(resp.error){ throw new Error(resp.error); }
    await navigator.clipboard.writeText(resp.content || "");
    toast("Draft copied to clipboard");
  }catch(e){
    toast("Error: " + e.message);
  }finally{
    $("#generateEmail").disabled = false;
  }
});

// persist language pick
chrome.storage.sync.get(["LANG"], r=>{
  if(r.LANG) $("#language").value = r.LANG;
});
$("#language").addEventListener("change", ()=>{
  chrome.storage.sync.set({LANG: $("#language").value});
});
