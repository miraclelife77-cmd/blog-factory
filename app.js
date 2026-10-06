const K="blogFactoryV1";const D={records:[],archive:"",views:0,settings:{blogId:"chari77",identity:"사업 · 기술 · 환경 · AI를 직접 알아보고 만들어보는 사람의 기록",length:"1200~1800자",freq:"주 1~2회"},verify:[["ESG Global Vina 베트남 법인","확인","법인 존재 확인"],["케나프 실물 거래","확인","공개 거래 흔적 확인"],["500ha 왕대나무 농장 권리","검증 중","토지 권리·좌표·계약서 추가 확인 필요"],["CO2 100t/ha/year 근거","검증 중","회사 주장과 독립 검증 구분"],["등록·발급된 탄소크레딧","미확인","등록부·프로젝트 ID·발급 내역 필요"],["NFT와 실물자산의 법적 연결","미확인","계약상 권리 확인 필요"],["배당 재원","미확인","지급 주체·재원·계약 확인 필요"]]};let db=JSON.parse(localStorage.getItem(K)||"null")||D;db.records=db.records||[];db.verify=db.verify||D.verify;db.settings=db.settings||D.settings;function persist(){localStorage.setItem(K,JSON.stringify(db))}
document.querySelectorAll(".nav button").forEach(function(b){b.onclick=function(){document.querySelectorAll(".nav button,.page").forEach(function(x){x.classList.remove("active")});b.classList.add("active");document.getElementById(b.dataset.p).classList.add("active");render()}})
const banks={"일반 / 생각과 기록":["오래된 블로그를 다시 시작하며 정한 운영 원칙","일하면서 배운 것을 기록으로 남기는 이유","여러 프로젝트를 동시에 할 때 기록이 필요한 이유","현장 경험을 콘텐츠 자산으로 바꾸는 방법"],"AI와 기술":["산업 현장에서 AI를 실제 업무에 쓰는 방법","AI 자동화가 작은 회사에 주는 실질적 이점","AI에게 질문만 하지 않고 일을 맡기는 방법","반복 업무를 AI 시스템으로 바꾸기 전에 정리할 것"],"환경과 탄소":["탄소흡수량과 탄소크레딧은 왜 다른가","탄소사업 자료에서 반드시 확인해야 할 숫자","환경사업에서 회사 주장과 확인된 사실을 구분하는 법","탄소크레딧이 만들어지기까지 필요한 검증 단계"],"왕대나무 프로젝트":["왕대나무 사업을 검증할 때 필요한 서류","500ha 농장 주장을 확인하려면 무엇이 필요한가","왕대나무 탄소흡수량을 검증할 때 확인할 자료","실물자산과 NFT의 연결을 확인할 때 볼 계약"],"사업 탐구":["사업자료를 볼 때 숫자보다 먼저 확인할 것","좋아 보이는 사업모델을 검증하는 질문","매출과 현금흐름을 구분해서 보는 이유","투자 설명자료에서 확인과 주장을 나누는 방법"],"현장 기록":["펌프 고장 전에 기록해야 할 현장 데이터","펌프 선정에서 유량과 양정만 보면 안 되는 이유","수리 이력을 쌓으면 설비관리가 쉬워지는 이유","현장에서 반복되는 고장을 데이터로 바꾸는 방법"]};function usedTopics(){return new Set(db.records.map(r=>(r.topic||"").trim()).filter(Boolean))}function suggest(){let p=document.getElementById("project").value,u=usedTopics(),pool=(banks[p]||Object.values(banks).flat()).filter(x=>!u.has(x));if(pool.length<3)pool=(banks[p]||Object.values(banks).flat()).slice();let x=pool.slice().sort(()=>Math.random()-.5).slice(0,3);document.getElementById("topics").innerHTML=x.map(v=>'<div class="topic" onclick="pick(this)">'+v+'</div>').join("")}function pick(e){document.getElementById("topic").value=e.textContent;makePrompt()}
function makePrompt(){let t=document.getElementById("topic").value.trim();if(!t)return alert("주제를 먼저 입력해주세요.");let rules=document.getElementById("project").value==="왕대나무 프로젝트"?"\n\n[검증노트 연동]\n"+db.verify.map(v=>"- "+v[0]+" ["+v[1]+"]: "+v[2]).join("\n")+"\n규칙: 확인만 사실 단정, 검증 중은 귀속 표현, 미확인은 확인 필요사항으로 표시.":"";document.getElementById("aiPrompt").value="네이버 블로그 글을 작성해 주세요.\n\n주제: "+t+"\n콘텐츠 프로젝트: "+document.getElementById("project").value+"\n검증 수준: "+document.getElementById("level").value+"\n블로그 성격: "+db.settings.identity+"\n분량: "+db.settings.length+"\n\n요구사항:\n- 실제 경험과 실무 관점에서 이해하기 쉽게 작성\n- 과장된 홍보 문구 금지\n- 확인된 사실, 회사 측 주장, 미확인 사항을 명확히 구분\n- 최신 정보가 필요한 내용은 공개 출처로 검증\n- 내부적으로 여러 제목을 검토하되 최종 출력에는 선택된 제목 1개만 사용\n- 본문에는 제목 후보, 작성 지시, 검증노트, AI 작업과정 등 내부 제작 정보를 절대 노출하지 말 것\n- 결과물은 네이버 블로그에 그대로 붙여넣어도 되는 게시 직전 완성 원고로 작성\n- 썸네일 문구와 해시태그는 본문과 분리하여 반환\n- 네이버에서 읽기 좋은 짧은 문단\n- 투자수익 보장 또는 단정 표현 금지\n- 블로그를 살아있는 정보형 블로그로 만드는 것이 우선 목적이며 과도한 사업 홍보보다 독자에게 유용한 정보와 실제 확인 가능한 내용을 중심으로 작성\n- 공개 가능한 실물 검증: 회사·현지 법인·공장·농장·국내 연구소·제품·설비 등 실제 존재나 현장 확인이 가능한 내용은 확인 수준에 맞게 활용 가능\n- 비공개 검증: 업체 간 계약서, 계약금액, 거래조건, 수익배분, 상대방과의 세부 계약관계, NDA/MOU의 비공개 조항 등은 알고 있더라도 구체 내용·업체명·수치·문구를 본문/제목/썸네일/해시태그/출처에 노출하지 말 것\n- 비공개 계약 관련 내용은 필요한 경우에도 \"관련 협력 및 거래관계도 확인 중\" 정도의 추상적 언급만 허용\n- 공개 시점이 별도로 승인되기 전까지 비공개 자료는 사실 확인의 내부 참고용일 뿐 공개 근거로 사용하지 말 것\n- AI 작성 프롬프트는 운영 중 계속 수정될 수 있으므로 현재 공개·보안 원칙을 항상 우선 적용"+rules}
async function copyText(s){try{await navigator.clipboard.writeText(s);alert("복사했습니다.")}catch(e){alert("브라우저 복사 권한을 확인해주세요.")}}function copyArticle(){copyText(document.getElementById("title").value+"\n\n"+document.getElementById("content").value+"\n\n"+document.getElementById("tags").value)}
function savePost(pub){let title=document.getElementById("title").value.trim();if(!title)return alert("제목을 입력해주세요.");db.records.unshift({id:Date.now(),date:new Date().toLocaleDateString("ko-KR"),project:document.getElementById("project").value,topic:document.getElementById("topic").value,title:title,thumb:document.getElementById("thumb").value,tags:document.getElementById("tags").value,content:document.getElementById("content").value,url:document.getElementById("url").value,status:pub?"게시 완료":"초안"});persist();render();alert(pub?"게시 완료로 기록했습니다.":"초안을 저장했습니다.")}
function clearEditor(){["topic","aiPrompt","title","thumb","tags","content","url"].forEach(function(x){document.getElementById(x).value=""})}function esc(s){return String(s||"").replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function renderRecords(){let e=document.getElementById("records");e.innerHTML=db.records.length?db.records.map(function(r){return "<tr><td>"+r.date+"</td><td>"+r.project+"</td><td>"+esc(r.title)+"</td><td>"+r.status+"</td><td><button class='btn danger' onclick='delRec("+r.id+")'>삭제</button></td></tr>"}).join(""):"<tr><td colspan='5' class='muted'>아직 저장된 콘텐츠가 없습니다.</td></tr>"}function delRec(id){if(confirm("삭제할까요?")){db.records=db.records.filter(function(x){return x.id!==id});persist();render()}}
function statusClass(s){return s==="확인"?"ok":s==="검증 중"?"wait":"no"}function renderVerify(){document.getElementById("verifyRows").innerHTML=db.verify.map(function(v,i){return "<tr><td>"+esc(v[0])+"</td><td><button class='badge "+statusClass(v[1])+"' onclick='cycle("+i+")'>"+v[1]+"</button></td><td><input value='"+esc(v[2])+"' onchange='vmemo("+i+",this.value)'></td></tr>"}).join("")}function cycle(i){let a=["확인","검증 중","미확인"];db.verify[i][1]=a[(a.indexOf(db.verify[i][1])+1)%3];persist();renderVerify()}function vmemo(i,v){db.verify[i][2]=v;persist()}function addVerify(){let n=prompt("검증할 항목은?");if(n){db.verify.push([n,"미확인",""]);persist();renderVerify()}}
function saveArchive(){db.archive=document.getElementById("archiveText").value;persist()}function saveViews(){db.views=+document.getElementById("views").value||0;persist();renderMetrics()}function renderMetrics(){document.getElementById("mTotal").textContent=db.records.length;document.getElementById("mPublished").textContent=db.records.filter(function(x){return x.status==="게시 완료"}).length;document.getElementById("mViews").textContent=(db.views||0).toLocaleString()}
function saveSettings(){db.settings={blogId:document.getElementById("blogId").value,identity:document.getElementById("identity").value,length:document.getElementById("length").value,freq:document.getElementById("freq").value};persist();alert("저장했습니다.")}function loadSettings(){document.getElementById("blogId").value=db.settings.blogId;document.getElementById("identity").value=db.settings.identity;document.getElementById("length").value=db.settings.length;document.getElementById("freq").value=db.settings.freq}
function exportData(){let b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="blog-factory-backup.json";a.click();URL.revokeObjectURL(a.href)}function importData(el){let f=el.files[0];if(!f)return;let r=new FileReader();r.onload=function(){try{db=JSON.parse(r.result);persist();location.reload()}catch(e){alert("올바른 백업 파일이 아닙니다.")}};r.readAsText(f)}
function render(){renderRecords();renderVerify();document.getElementById("archiveText").value=db.archive||"";document.getElementById("views").value=db.views||0;renderMetrics()}document.getElementById("project").addEventListener("change",suggest);suggest();loadSettings();render();

/* BLOG FACTORY v1.2 workflow */
let editingId=null;
function projectSafety(){
  const p=document.getElementById("project").value;
  if(p==="왕대나무 프로젝트"){
    document.getElementById("level").value="검증 중 - 출처/귀속 표현 필수";
  }
}
function editRec(id){
  const r=db.records.find(x=>x.id===id); if(!r)return;
  editingId=id;
  document.getElementById("project").value=r.project||"일반 / 생각과 기록";
  document.getElementById("topic").value=r.topic||"";
  document.getElementById("title").value=r.title||"";
  document.getElementById("thumb").value=r.thumb||"";
  document.getElementById("tags").value=r.tags||"";
  document.getElementById("content").value=r.content||"";
  document.getElementById("url").value=r.url||"";
  projectSafety(); makePrompt();
  document.querySelector('[data-p="today"]').click();
}
function savePost(pub){
  const title=document.getElementById("title").value.trim();
  if(!title)return alert("제목을 입력해주세요.");
  const item={
    date:new Date().toLocaleDateString("ko-KR"),
    project:document.getElementById("project").value,
    topic:document.getElementById("topic").value,
    title,
    thumb:document.getElementById("thumb").value,
    tags:document.getElementById("tags").value,
    content:document.getElementById("content").value,
    url:document.getElementById("url").value,
    status:pub?"게시 완료":"초안"
  };
  if(editingId){
    const i=db.records.findIndex(x=>x.id===editingId);
    if(i>=0) db.records[i]={...db.records[i],...item};
  }else{
    const same=db.records.find(x=>x.title===title&&x.status!=="게시 완료");
    if(same){ Object.assign(same,item); editingId=same.id; }
    else { item.id=Date.now(); db.records.unshift(item); editingId=item.id; }
  }
  persist(); render(); suggest();
  alert(pub?"게시 완료로 기록했습니다.":"초안을 저장하고 캘린더에 등록했습니다.");
}
function clearEditor(){
  editingId=null;
  ["topic","aiPrompt","title","thumb","tags","content","url"].forEach(x=>document.getElementById(x).value="");
  projectSafety(); suggest();
}
function renderRecords(){
  const e=document.getElementById("records");
  e.innerHTML=db.records.length?db.records.map(r=>"<tr><td>"+esc(r.date)+"</td><td>"+esc(r.project)+"</td><td>"+esc(r.title)+"</td><td>"+esc(r.status)+"</td><td><button class='btn' onclick='editRec("+r.id+")'>열기</button> <button class='btn danger' onclick='delRec("+r.id+")'>삭제</button></td></tr>").join(""):"<tr><td colspan='5' class='muted'>아직 저장된 콘텐츠가 없습니다.</td></tr>";
}
document.getElementById("project").addEventListener("change",function(){projectSafety();suggest();});

/* BLOG FACTORY v1.5 AI bridge */
function aiEndpoint(){return (db.settings&&db.settings.aiEndpoint)||"https://blog-factory-omega.vercel.app/api/generate"}
const _saveSettings=saveSettings;
saveSettings=function(){
  db.settings={blogId:document.getElementById("blogId").value,identity:document.getElementById("identity").value,length:document.getElementById("length").value,freq:document.getElementById("freq").value,aiEndpoint:document.getElementById("aiEndpoint").value.trim()};
  persist();alert("저장했습니다.");
};
const _loadSettings=loadSettings;
loadSettings=function(){
  _loadSettings();
  const e=document.getElementById("aiEndpoint"); if(e)e.value=aiEndpoint();
};
async function generateAI(){
  const status=document.getElementById("aiStatus");
  const endpoint=aiEndpoint();
  makePrompt();
  if(!endpoint){status.textContent="AI 서버 연결이 필요합니다. 설정에서 AI 서버 주소를 입력해주세요.";document.querySelector('[data-p="settings"]').click();return}
  const prompt=document.getElementById("aiPrompt").value;
  if(!prompt)return;
  status.textContent="AI가 글을 작성하고 있습니다…";
  try{
    const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,project:document.getElementById("project").value,topic:document.getElementById("topic").value,verification:db.verify})});
    if(!res.ok)throw new Error("HTTP "+res.status);
    const data=await res.json();
    document.getElementById("title").value=data.title||"";
    document.getElementById("thumb").value=data.thumbnail||data.thumb||"";
    document.getElementById("tags").value=Array.isArray(data.hashtags)?data.hashtags.join(" "):(data.hashtags||data.tags||"");
    document.getElementById("content").value=data.content||data.body||"";
    imagePlan=Array.isArray(data.images)?data.images:[]; renderImageCards();
    status.textContent="게시용 원고 생성 완료. 본문을 검토하고 이미지를 생성해주세요.";
  }catch(e){status.textContent="AI 생성 실패: "+e.message+" — 서버 연결 설정을 확인해주세요."}
}
loadSettings();

/* BLOG FACTORY v2 publish-ready images */
let imagePlan=[];
function imageEndpoint(){return aiEndpoint().replace(/\/api\/generate\/?$/,"/api/image")}
function renderImageCards(){
  const box=document.getElementById("imageCards"); if(!box)return;
  if(!imagePlan.length){box.innerHTML="<div class='muted'>AI 글을 생성하면 본문에 맞는 이미지 계획도 함께 만들어집니다.</div>";return}
  box.innerHTML=imagePlan.map((x,i)=>`
    <div class="card" style="margin:0">
      <b>${esc(x.role||("이미지 "+(i+1)))}</b>
      <div class="muted" style="margin:6px 0">${esc(x.caption||"")}</div>
      <div id="imgStatus${i}" class="muted"></div>
      <div id="imgBox${i}" style="margin-top:8px"></div>
      <div class="actions"><button class="btn" onclick="generateImage(${i})">AI 이미지 생성</button></div>
    </div>`).join("");
}
async function generateImage(i){
  const x=imagePlan[i], st=document.getElementById("imgStatus"+i), box=document.getElementById("imgBox"+i);
  if(!x)return; st.textContent="이미지 생성 중…";
  try{
    const res=await fetch(imageEndpoint(),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:x.prompt,role:x.role})});
    const data=await res.json(); if(!res.ok)throw new Error(data.error||("HTTP "+res.status));
    const src="data:image/png;base64,"+data.image;
    x.dataUrl=src;
    box.innerHTML='<img src="'+src+'" style="width:100%;max-height:360px;object-fit:cover;border-radius:10px"><div class="actions"><button class="btn" onclick="downloadImage('+i+')">PNG 저장</button></div>';
    st.textContent=(x.role==="썸네일"?"썸네일 이미지":"본문 삽입 이미지")+" 생성 완료";
  }catch(e){st.textContent="이미지 생성 실패: "+e.message}
}
async function generateAllImages(){for(let i=0;i<imagePlan.length;i++)await generateImage(i)}
function downloadImage(i){
  const x=imagePlan[i]; if(!x?.dataUrl)return;
  const a=document.createElement("a"); a.href=x.dataUrl; a.download=(i===0?"thumbnail":"blog-image-"+i)+".png"; a.click();
}
renderImageCards();

/* BLOG FACTORY v2.1 one-click Naver publish preparation */
let preparedArticle="";
function bodyImagePlans(){return imagePlan.filter((x,i)=>i>0).slice(0,3)}
function placeImageMarkers(text){
  const clean=String(text||"").replace(/\n*\[이미지\s*[1-3]\s*삽입\]\n*/g,"\n\n");
  const paras=clean.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  if(paras.length<4){
    let out=clean.trim();
    bodyImagePlans().forEach((x,i)=>{out+="\n\n[이미지 "+(i+1)+" 삽입]\n"+(x.caption?("※ "+x.caption):"")});
    return out;
  }
  const count=bodyImagePlans().length;
  const slots=[];
  for(let i=1;i<=count;i++) slots.push(Math.max(1,Math.min(paras.length-1,Math.round(paras.length*i/(count+1)))));
  let offset=0;
  slots.forEach((pos,i)=>{
    const x=bodyImagePlans()[i];
    paras.splice(pos+offset,0,"[이미지 "+(i+1)+" 삽입]"+(x?.caption?"\n※ "+x.caption:""));
    offset++;
  });
  return paras.join("\n\n");
}
async function prepareNaver(){
  const st=document.getElementById("prepareStatus");
  if(!document.getElementById("content").value.trim()){st.textContent="먼저 AI 글을 생성해주세요.";return}
  if(imagePlan.length<4){st.textContent="이미지 계획이 없습니다. AI 글을 새로 생성해주세요.";return}
  st.textContent="네이버 게시 패키지를 준비하고 있습니다. 이미지 4장을 생성합니다…";
  try{
    for(let i=0;i<imagePlan.length;i++) if(!imagePlan[i].dataUrl) await generateImage(i);
    const failed=imagePlan.some(x=>!x.dataUrl);
    if(failed){st.textContent="일부 이미지 생성에 실패했습니다. 해당 이미지의 AI 이미지 생성을 다시 눌러주세요.";return}
    preparedArticle=placeImageMarkers(document.getElementById("content").value);
    document.getElementById("content").value=preparedArticle;
    document.getElementById("publishPack").style.display="block";
    st.textContent="준비 완료: 이미지 위치 지정 + 이미지 4장 생성 + 본문 일괄복사가 준비되었습니다.";
  }catch(e){st.textContent="게시 준비 실패: "+e.message}
}
async function copyPreparedArticle(){
  preparedArticle=placeImageMarkers(document.getElementById("content").value);
  const title=document.getElementById("title").value.trim();
  const tags=document.getElementById("tags").value.trim();
  await copyText(title+"\n\n"+preparedArticle+(tags?"\n\n"+tags:""));
}
function dataUrlToBlob(dataUrl){
  const [head,data]=dataUrl.split(","), mime=(head.match(/data:(.*?);/)||[])[1]||"image/png";
  const bin=atob(data); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type:mime});
}
async function downloadAllImages(){
  const ready=imagePlan.filter(x=>x.dataUrl);
  if(ready.length!==imagePlan.length)return alert("이미지 4장을 먼저 생성해주세요.");
  ready.forEach((x,i)=>setTimeout(()=>{
    const a=document.createElement("a"); a.href=URL.createObjectURL(dataUrlToBlob(x.dataUrl));
    a.download=i===0?"00-thumbnail.png":("0"+i+"-body-image-"+i+".png"); a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  },i*350));
}
