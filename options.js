
const $ = (s)=>document.querySelector(s);
const toast=(m)=>{const t=$("#toast"); t.textContent=m; t.classList.remove("hidden"); setTimeout(()=>t.classList.add("hidden"),1400);};

let autoTemplateInitial = false;

function syncApplyVisibility(){
  const btn = $("#applyAutoTemplate");
  if(!btn) return;
  const changed = $("#autoTemplate").checked !== autoTemplateInitial;
  btn.classList.toggle("hidden", !changed);
}

chrome.storage.sync.get(["OPENAI_API_KEY","AUTO_TEMPLATE"], r=>{
  if(r.OPENAI_API_KEY) $("#apiKey").value = r.OPENAI_API_KEY;
  autoTemplateInitial = r.AUTO_TEMPLATE === true;
  $("#autoTemplate").checked = autoTemplateInitial;
  syncApplyVisibility();
});

$("#autoTemplate").addEventListener("change", syncApplyVisibility);

$("#applyAutoTemplate").addEventListener("click", ()=>{
  const next = $("#autoTemplate").checked;
  chrome.storage.sync.set({ AUTO_TEMPLATE: next }, ()=>{
    autoTemplateInitial = next;
    syncApplyVisibility();
    toast("자동 생성 설정을 적용했습니다");
  });
});

$("#save").addEventListener("click", ()=>{
  const nextAuto = $("#autoTemplate").checked;
  chrome.storage.sync.set({
    OPENAI_API_KEY: $("#apiKey").value.trim(),
    AUTO_TEMPLATE: nextAuto
  }, ()=>{
    autoTemplateInitial = nextAuto;
    syncApplyVisibility();
    toast("저장했습니다");
  });
});
$("#clear").addEventListener("click", ()=>{
  chrome.storage.sync.remove(["OPENAI_API_KEY"], ()=>{ $("#apiKey").value=""; toast("삭제했습니다"); });
});
