export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","https://miraclelife77-cmd.github.io");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  const prompt=req.body?.prompt, role=req.body?.role||"본문 이미지", thumbnailText=String(req.body?.thumbnailText||"").trim();
  if(!prompt)return res.status(400).json({error:"prompt is required"});
  try{
    const r=await fetch("https://api.openai.com/v1/images/generations",{
      method:"POST",
      headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gpt-image-2",
        prompt: role==="썸네일" ? ("Create a polished Korean Naver blog cover/thumbnail, informative editorial style, not a flashy ad. "+prompt+" Integrate this exact Korean headline prominently and legibly: \\""+thumbnailText.replace(/[\\"]/g,"")+"\\". No other text, no logos, no watermark. Do not imply this is documentary evidence of a specific real company or site.") : ("Korean Naver blog editorial image. "+prompt+" No text, no letters, no logos, no watermark. Do not imply this is documentary evidence of a specific real company or site."),
        n:1,
        size:role==="썸네일"?"1024x1024":"1536x1024",
        quality:"low",
        output_format:"png"
      })
    });
    const data=await r.json();
    if(!r.ok)return res.status(r.status).json({error:data?.error?.message||"Image generation failed"});
    const image=data?.data?.[0]?.b64_json;
    if(!image)return res.status(502).json({error:"No image returned"});
    return res.status(200).json({image});
  }catch(e){return res.status(500).json({error:e.message})}
}