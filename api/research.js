export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","https://miraclelife77-cmd.github.io");
 res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS")return res.status(204).end();
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
 const topic=String(req.body?.topic||"").trim(),project=String(req.body?.project||"전체 자유주제");
 if(!topic)return res.status(400).json({error:"topic is required"});
 const schema={type:"object",properties:{
  summary:{type:"string"},
  sources:{type:"array",minItems:1,maxItems:6,items:{type:"object",properties:{source:{type:"string"},title:{type:"string"},date:{type:"string"},url:{type:"string"},status:{type:"string"}},required:["source","title","date","url","status"],additionalProperties:false}}
 },required:["summary","sources"],additionalProperties:false};
 try{
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({
   model:"gpt-5.6-luna",reasoning:{effort:"low"},tools:[{type:"web_search"}],
   input:[{role:"user",content:[{type:"input_text",text:"네이버 블로그 글 작성을 위한 공개자료 조사를 하세요. 주제: "+topic+"\n프로젝트 힌트: "+project+"\n신뢰할 수 있는 1차 자료, 공식기관, 원문 보고서, 신뢰도 높은 보도를 우선하세요. 3~6개의 실제 출처만 사용하세요. 검색으로 실제 확인한 URL만 기록하고 URL을 추측하거나 만들지 마세요. 날짜를 확인할 수 없으면 빈 문자열로 두세요. summary에는 출처가 뒷받침하는 핵심 사실만 한국어로 요약하세요. 각 source의 status는 URL과 제목이 실제 검색에서 확인되면 완료, 그렇지 않으면 보완 필요로 하세요."}]}],
   text:{format:{type:"json_schema",name:"blog_research",strict:true,schema}}
  })});
  const d=await r.json();if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"Research failed"});
  const raw=d.output_text||d.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
  if(!raw)return res.status(502).json({error:"No research output"});
  return res.status(200).json(JSON.parse(raw));
 }catch(e){return res.status(500).json({error:e.message})}
}