
chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.type === "OPENAI_CHAT"){
    handleChat(msg.payload).then(sendResponse);
    return true;
  }
});

async function getKey(){
  return new Promise(resolve=> chrome.storage.sync.get(["OPENAI_API_KEY"], resolve));
}

async function handleChat(payload){
  try{
    const { OPENAI_API_KEY } = await getKey();
    if(!OPENAI_API_KEY) return { error: "No API key set." };

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
      return { error: "OpenAI error: " + t };
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { content };
  }catch(e){
    return { error: e.message || String(e) };
  }
}
