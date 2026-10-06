export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","https://miraclelife77-cmd.github.io");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  const topic=String(req.body?.topic||"전체 연결 이슈"),region=String(req.body?.region||"국내 + 해외");
  const q="현재 날짜 기준 최근 주요 뉴스를 검색해 한국 독자용 산업 브리핑을 만들어라. 관심 분야: "+topic+". 지역: "+region+". 탄소중립, 탄소시장/배출권, CBAM, 에너지와 전력망, 핵심광물과 희토류, 배터리와 재활용, 글로벌 공급망, 친환경 기술 중 관련성이 높은 실제 최신 기사 5건을 우선하라. 신뢰할 수 있는 언론사·정부·국제기구·산업기관의 원문을 우선하고 각 항목에 실제 원문 URL과 보도/발표 날짜를 넣어라. 같은 사건의 중복 기사는 피하라. 해외 기사는 한국어로 쉽게 요약하되 원문을 장문 번역하지 마라. 마지막 connection에는 서로 다른 뉴스 사이의 산업적 연결고리를 2~4문장으로 설명하라.";
  try{
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({
      model:"gpt-6-luna",tools:[{type:"web_search"}],input:q,
      text:{format:{type:"json_schema",name:"global_briefing",strict:true,schema:{type:"object",properties:{connection:{type:"string"},items:{type:"array",minItems:3,maxItems:5,items:{type:"object",properties:{title:{type:"string"},source:{type:"string"},date:{type:"string"},url:{type:"string"},category:{type:"string"},summary:{type:"string"},why:{type:"string"},korea:{type:"string"}},required:["title","source","date","url","category","summary","why","korea"],additionalProperties:false}}},required:["connection","items"],additionalProperties:false}}}
    })});
    const d=await r.json(); if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"OpenAI web search failed"});
    const raw=d.output_text||d.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
    if(!raw)return res.status(502).json({error:"No briefing returned"});
    return res.status(200).json(JSON.parse(raw));
  }catch(e){return res.status(500).json({error:e.message})}
}