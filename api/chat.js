export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","https://miraclelife77-cmd.github.io");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  const messages=Array.isArray(req.body?.messages)?req.body.messages.slice(-12):[];
  if(!messages.length)return res.status(400).json({error:"messages required"});
  const identity=String(req.body?.identity||"사업 · 기술 · 환경 · AI를 직접 알아보고 만들어보는 사람의 기록");
  try{
    const input=[
      {role:"system",content:[{type:"input_text",text:"You are BLOG FACTORY AI 작업실. Converse naturally in Korean and help the user explore a very broad range of possible blog topics. Do not force every conversation into a predefined category. Ask or suggest useful angles when needed. Keep replies compact enough for an ideation chat. Never reveal or invent confidential business facts. Blog identity: "+identity}]},
      ...messages.map(m=>({role:m.role==="assistant"?"assistant":"user",content:[{type:"input_text",text:String(m.text||"")}]}))
    ];
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-5.6-luna",reasoning:{effort:"low"},input})});
    const d=await r.json(); if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"OpenAI request failed"});
    const reply=d.output_text||d.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
    return res.status(200).json({reply:reply||""});
  }catch(e){return res.status(500).json({error:e.message})}
}