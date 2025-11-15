
const $ = (s)=>document.querySelector(s);
const toast=(m)=>{const t=$("#toast"); t.textContent=m; t.classList.remove("hidden"); setTimeout(()=>t.classList.add("hidden"),1400);};

chrome.storage.sync.get(["OPENAI_API_KEY","LANG"], r=>{
  if(r.OPENAI_API_KEY) $("#apiKey").value = r.OPENAI_API_KEY;
  if(r.LANG) $("#language").value = r.LANG;
});

$("#save").addEventListener("click", ()=>{
  chrome.storage.sync.set({ OPENAI_API_KEY: $("#apiKey").value.trim(), LANG: $("#language").value }, ()=> toast("Saved"));
});
$("#clear").addEventListener("click", ()=>{
  chrome.storage.sync.remove(["OPENAI_API_KEY"], ()=>{ $("#apiKey").value=""; toast("Cleared"); });
});
