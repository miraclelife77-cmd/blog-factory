export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","https://miraclelife77-cmd.github.io");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  const project=String(req.body?.project||"전체 자유주제");
  const identity=String(req.body?.identity||"사업 · 기술 · 환경 · AI를 직접 알아보고 만들어보는 사람의 기록");
  const used=Array.isArray(req.body?.used)?req.body.used.slice(0,40):[];
  const instruction="한국 네이버 블로그용으로 서로 겹치지 않는 주제 3개를 제안하세요. 프로젝트는 제한조건이 아니라 느슨한 방향 힌트입니다. 직접적인 프로젝트 설명만 반복하지 말고 주변 지식, 생활 속 궁금증, 현장 경험, 검색형 질문, 비교, 오해 바로잡기, 숫자의 의미, 역사/과학/산업 연결, 사람 이야기, 실용 팁 등으로 넓게 확장하세요. 세 주제의 각도도 서로 달라야 합니다. '전체 자유주제'라면 블로그 정체성에 어울리는 범위에서 분야 제한 없이 제안하세요. 이미 사용한 주제/제목과 유사한 것은 피하세요. 투자수익 홍보나 검증되지 않은 사실 단정은 피하세요.\n블로그 정체성: "+identity+"\n현재 프로젝트 힌트: "+project+"\n이미 사용한 소재: "+(used.join(" | ")||"없음");
  try{
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({
      model:"gpt-5.6-luna",reasoning:{effort:"low"},
      input:[{role:"user",content:[{type:"input_text",text:instruction}]}],
      text:{format:{type:"json_schema",name:"topic_suggestions",strict:true,schema:{type:"object",properties:{topics:{type:"array",minItems:3,maxItems:3,items:{type:"string"}}},required:["topics"],additionalProperties:false}}}
    })});
    const d=await r.json(); if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"OpenAI request failed"});
    const raw=d.output_text||d.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
    return res.status(200).json(JSON.parse(raw));
  }catch(e){return res.status(500).json({error:e.message})}
}