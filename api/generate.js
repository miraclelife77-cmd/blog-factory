export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","https://miraclelife77-cmd.github.io");
 res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 if(req.method==="OPTIONS")return res.status(204).end();
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
 const prompt=req.body?.prompt;if(!prompt)return res.status(400).json({error:"prompt is required"});
 const schema={type:"object",properties:{
  title:{type:"string"},thumbnail:{type:"string"},hashtags:{type:"array",items:{type:"string"}},content:{type:"string"},
  sources:{type:"array",items:{type:"object",properties:{source:{type:"string"},title:{type:"string"},date:{type:"string"},url:{type:"string"},status:{type:"string"}},required:["source","title","date","url","status"],additionalProperties:false}},
  images:{type:"array",minItems:4,maxItems:4,items:{type:"object",properties:{role:{type:"string"},caption:{type:"string"},prompt:{type:"string"}},required:["role","caption","prompt"],additionalProperties:false}}
 },required:["title","thumbnail","hashtags","content","sources","images"],additionalProperties:false};
 try{
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({
   model:"gpt-5.6-luna",reasoning:{effort:"low"},
   input:[{role:"system",content:[{type:"input_text",text:"Write a publish-ready Korean Naver blog post and return only JSON matching the schema. Never invent verification, dates, URLs, or sources. Missing source dates/URLs must be empty strings with status 보완 필요. Create exactly four visual plans: 썸네일, 본문 이미지 1, 본문 이미지 2, 본문 이미지 3. Image prompts must contain no logos or watermarks and must not present AI images as documentary evidence."}]},{role:"user",content:[{type:"input_text",text:prompt}]}],
   text:{format:{type:"json_schema",name:"blog_post",strict:true,schema}}
  })});
  const data=await r.json();if(!r.ok)return res.status(r.status).json({error:data?.error?.message||"OpenAI request failed"});
  const raw=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
  if(!raw)return res.status(502).json({error:"No model output"});
  return res.status(200).json(JSON.parse(raw));
 }catch(e){return res.status(500).json({error:e.message})}
}