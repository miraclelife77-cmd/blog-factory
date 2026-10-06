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
        input:[{role:"system",content:[{type:"input_text",text:"Write a publish-ready Korean Naver blog post. Return ONLY valid JSON matching the schema. The content field must contain ONLY the final reader-facing article: never include title candidates, drafting notes, verification-note labels, prompt instructions, internal reasoning, or AI workflow. Never invent verification. Respect confidentiality and attribution requirements. Extract cited/public references into sources. Never invent missing dates or URLs: use empty strings and status "보완 필요"; use status "완료" only when source, title, date and URL are all available. Create exactly 4 image plans. The first role MUST be exactly \"썸네일\" and must describe a clean editorial cover composition with uncluttered space for the supplied thumbnail headline; the next three roles MUST be \"본문 이미지 1\", \"본문 이미지 2\", \"본문 이미지 3\" and should match the article flow. Image prompts must be visual-only with no embedded text, logos or watermarks. AI-generated images must never be described as documentary proof of a real site."}]},{role:"user",content:[{type:"input_text",text:prompt}]}],
        text:{format:{type:"json_schema",name:"blog_post",strict:true,schema:{type:"object",properties:{
          title:{type:"string"},
          thumbnail:{type:"string"},
          hashtags:{type:"array",items:{type:"string"}},
          content:{type:"string"},
          sources:{type:"array",items:{type:"object",properties:{source:{type:"string"},title:{type:"string"},date:{type:"string"},url:{type:"string"},status:{type:"string"}},required:["source","title","date","url","status"],additionalProperties:false}},
          images:{type:"array",minItems:4,maxItems:4,items:{type:"object",properties:{role:{type:"string"},caption:{type:"string"},prompt:{type:"string"}},required:["role","caption","prompt"],additionalProperties:false}}
        },required:["title","thumbnail","hashtags","content","sources","images"],additionalProperties:false}}}
      })
    });
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message||"OpenAI request failed"});
    const raw=data.output_text || data.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;
    if(!raw) return res.status(502).json({error:"No model output"});
    return res.status(200).json(JSON.parse(raw));
  } catch(e) { return res.status(500).json({error:e.message}); }
}
