import { put, list, get } from "@vercel/blob";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function jsonCall(url,body,tries=2){
 let err;for(let i=0;i<tries;i++){try{const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(r.ok)return d;err=new Error(d.error||("HTTP "+r.status));}catch(e){err=e}if(i<tries-1)await sleep(3500*(i+1))}throw err;
}
async function ai(path,body){return jsonCall("https://blog-factory-omega.vercel.app/api/"+path,body,2)}
async function imageCall(plan,thumb){
 const d=await ai("image",{prompt:plan.prompt,role:plan.role,thumbnailText:thumb});
 if(!d.image)throw new Error("이미지 생성 결과 없음");
 return "data:image/png;base64,"+d.image;
}
async function saveImage(id,dataUrl,plan,i){
 const m=String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);if(!m)throw new Error("이미지 데이터 오류");
 const pathname="queue-assets/"+id+"/"+String(i).padStart(2,"0")+"-"+(i===0?"thumbnail":"body")+".png";
 await put(pathname,Buffer.from(m[2],"base64"),{access:"private",contentType:m[1],addRandomSuffix:false});
 return {pathname,role:plan.role||"",caption:plan.caption||"",sourceType:"ai"};
}
async function latestTopics(){
 const {blobs}=await list({prefix:"queue/",limit:30});const used=[];
 for(const b of blobs.slice(0,20)){try{const r=await get(b.pathname,{access:"private"});if(r?.statusCode===200){const x=JSON.parse(await new Response(r.stream).text());if(x.title)used.push(x.title)}}catch{}}
 return used;
}
export default async function handler(req,res){
 if(req.method!=="POST"&&req.method!=="GET")return res.status(405).json({error:"GET/POST only"});
 if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY missing"});
 const b=req.body||{}, started=new Date().toISOString();
 try{
  let topic=String(b.topic||process.env.BLOG_PRIORITY_TOPIC||"").trim();
  const project=String(b.project||"전체 자유주제");
  if(!topic){
   const td=await ai("topics",{project,identity:"사업 · 기술 · 환경 · AI를 직접 알아보고 만들어보는 사람의 기록",used:await latestTopics()});
   topic=td.topics?.[0]||"";if(!topic)throw new Error("자동 주제를 만들지 못했습니다.");
  }
  const research=await ai("research",{topic,project});
  const sources=(research.sources||[]).filter(x=>x.url&&x.title);
  if(!sources.length)throw new Error("확인된 공개 출처가 없어 자동 제작을 중단했습니다.");
  const sourceText=sources.map((s,i)=>(i+1)+". "+[s.source,s.title,s.date,s.url].filter(Boolean).join(" | ")).join("\n");
  const prompt="네이버 블로그 게시용 완성 원고를 작성하세요.\n주제: "+topic+"\n프로젝트: "+project+"\n\n공개자료 조사 요약:\n"+research.summary+"\n\n확인된 출처:\n"+sourceText+"\n\n규칙: 위 출처가 뒷받침하지 않는 구체적 사실·수치·링크를 만들지 말 것. 과장 홍보 금지. 네이버에서 읽기 좋은 짧은 문단. 내부 제작지시나 AI 작업과정 노출 금지. 출처는 글 마지막에 정리. 이미지 계획은 썸네일 1장과 본문 이미지 3장.";
  const post=await ai("generate",{prompt,project,topic});
  if(!post.title||!post.content||!Array.isArray(post.images)||post.images.length!==4)throw new Error("완성 원고 또는 이미지 계획이 불완전합니다.");
  const id="auto-"+Date.now().toString(36);
  const images=[];
  for(let i=0;i<4;i++){const dataUrl=await imageCall(post.images[i],post.thumbnail||post.title);images.push(await saveImage(id,dataUrl,post.images[i],i))}
  let content=String(post.content).replace(/\n*\[이미지\s*[1-3]\s*삽입\]\n*/g,"\n\n");
  const paras=content.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  if(paras.length>=4){let off=0;for(let i=1;i<=3;i++){const p=Math.max(1,Math.min(paras.length-1,Math.round(paras.length*i/4)));paras.splice(p+off,0,"[이미지 "+i+" 삽입]");off++}content=paras.join("\n\n")}
  else content+="\n\n[이미지 1 삽입]\n\n[이미지 2 삽입]\n\n[이미지 3 삽입]";
  const item={id,title:post.title,content,category:project,hashtags:(post.hashtags||[]).map(x=>String(x).startsWith("#")?x:"#"+x).join(" "),thumbnail:post.thumbnail||"",sourcePrompt:"자동 제작 · "+topic,sources:sources.map(x=>({...x,status:"완료"})),images,status:"게시 대기",createdAt:new Date().toISOString(),automation:{started,topic,mode:b.topic?"사용자 지정":"AI 자동 선정"}};
  await put("queue/"+id+".json",JSON.stringify(item),{access:"private",contentType:"application/json",addRandomSuffix:false});
  return res.status(200).json({ok:true,id,topic,title:item.title,sources:sources.length,images:images.length,status:"게시 대기"});
 }catch(e){
  const id="failure-"+Date.now().toString(36);
  try{await put("automation-failures/"+id+".json",JSON.stringify({id,started,failedAt:new Date().toISOString(),error:e.message}),{access:"private",contentType:"application/json",addRandomSuffix:false})}catch{}
  return res.status(500).json({ok:false,error:e.message,status:"실패/재검토"});
 }
}