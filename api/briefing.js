const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function callOpenAI(payload,key){
  let last;
  for(let i=0;i<2;i++){
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json(); last={r,d};
    if(r.status!==429)return last;
    const wait=Math.min(15000,3000*(i+1)); await sleep(wait);
  }
  return last;
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","https://miraclelife77-cmd.github.io");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  const topic=String(req.body?.topic||"전체 연결 이슈"),region=String(req.body?.region||"국내 + 해외");
  const q=`최근 48시간을 우선하여 ${region}의 ${topic} 관련 중요 뉴스 3건만 찾아라. 범위는 탄소중립/배출권/CBAM/에너지/전력망/핵심광물/희토류/배터리/재활용/공급망/친환경기술이다. 서로 다른 사건을 고르고 정부·국제기구·주요 언론·산업기관을 우선하라. 각 뉴스는 실제 원문 URL과 날짜, 2문장 이내 한국어 요약, 왜 중요한지 1문장, 한국 산업과의 연결 1문장만 작성하라. 원문 장문 번역 금지. connection은 세 뉴스의 연결고리를 최대 3문장으로 작성하라.`;
  const payload={model:"gpt-6-luna",reasoning:{effort:"low"},tools:[{type:"web_search"}],input:q,
    text:{format:{type:"json_schema",name:"global_briefing",strict:true,schema:{type:"object",properties:{connection:{type:"string"},items:{type:"array",minItems:3,maxItems:3,items:{type:"object",properties:{title:{type:"string"},source:{type:"string"},date:{type:"string"},url:{type:"string"},category:{type:"string"},summary:{type:"string"},why:{type:"string"},korea:{type:"string"}},required:["title","source","date","url","category","summary","why","korea"],additionalProperties:false}}},required:["connection","items"],additionalProperties:false}}}
  };
  try{
    const {r,d}=await callOpenAI(payload,key);
    if(!r.ok){
      const msg=r.status===429?"잠시 사용량이 몰렸습니다. 15초 정도 후 다시 눌러주세요.":(d?.error?.message||"뉴스 검색에 실패했습니다.");
      return res.status(r.status).json({error:msg});
    }
    const raw=d.output_text||d.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
    if(!raw)return res.status(502).json({error:"뉴스 결과를 받지 못했습니다."});
    return res.status(200).json(JSON.parse(raw));
  }catch(e){return res.status(500).json({error:e.message})}
}