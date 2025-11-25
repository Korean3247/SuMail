
chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.type === "OPENAI_CHAT"){
    handleChat(msg.payload).then(sendResponse);
    return true;
  }
});

chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.create({
    id: "summarize-selection",
    title: "선택 영역 요약",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "translate-selection",
    title: "선택 영역 번역 (한국어)",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab)=>{
  const text = (info.selectionText || "").trim();
  if(!text) return;

  if(info.menuItemId === "summarize-selection"){
    chrome.storage.local.set({QUEUED_SELECTION: text});
    if(chrome.action?.openPopup){
      chrome.action.openPopup(()=>{});
    }
    chrome.runtime.sendMessage({type:"CONTEXT_SUMMARIZE", text}).catch(()=>{});
  }

  if(info.menuItemId === "translate-selection"){
    chrome.storage.local.set({QUEUED_TRANSLATE: text});
    if(chrome.action?.openPopup){
      chrome.action.openPopup(()=>{});
    }
    chrome.runtime.sendMessage({type:"CONTEXT_TRANSLATE", text}).catch(()=>{});
  }
});

async function getKey(){
  return new Promise(resolve=> chrome.storage.sync.get(["OPENAI_API_KEY"], resolve));
}

async function handleChat(payload){
  try{
    const { OPENAI_API_KEY } = await getKey();
    if(!OPENAI_API_KEY) return { error: "API 키가 설정되어 있지 않습니다." };

    const body = JSON.stringify({
      model: "gpt-4o-mini",
      messages: payload.messages,
      max_tokens: payload.max_tokens ?? 300,
      temperature: payload.temperature ?? 0.2
    });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer " + OPENAI_API_KEY
      },
      body
    });
    if(!res.ok){
      const t = await res.text();
      return { error: "OpenAI 오류: " + t };
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { content };
  }catch(e){
    return { error: "오류: " + (e.message || String(e)) };
  }
}
