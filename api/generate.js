export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://miraclelife77-cmd.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({error:"POST only"});
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  const prompt = req.body?.prompt;
  if (!prompt) return res.status(400).json({error:"prompt is required"});
  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gpt-5.6-luna",
        reasoning:{effort:"low"},
        input:[{role:"system",content:[{type:"input_text",text:"You write Korean Naver blog drafts. Return ONLY valid JSON with keys title, thumbnail, hashtags, content. hashtags must be an array of strings. Never invent verification. Respect attribution requirements in the user's prompt."}]},{role:"user",content:[{type:"input_text",text:prompt}]}],
        text:{format:{type:"json_schema",name:"blog_post",strict:true,schema:{type:"object",properties:{title:{type:"string"},thumbnail:{type:"string"},hashtags:{type:"array",items:{type:"string"}},content:{type:"string"}},required:["title","thumbnail","hashtags","content"],additionalProperties:false}}}
      })
    });
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message||"OpenAI request failed"});
    const raw=data.output_text || data.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
    if(!raw) return res.status(502).json({error:"No model output"});
    return res.status(200).json(JSON.parse(raw));
  } catch(e) { return res.status(500).json({error:e.message}); }
}
