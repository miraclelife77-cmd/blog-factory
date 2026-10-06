import { put, list, get } from "@vercel/blob";
const origin="https://miraclelife77-cmd.github.io";
function cors(res){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type")}
async function saveImage(id,img,i){
 const m=String(img.dataUrl||"").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/); if(!m)return null;
 const ext=m[1].includes("jpeg")?"jpg":m[1].includes("webp")?"webp":"png";
 const pathname="queue-assets/"+id+"/"+String(i).padStart(2,"0")+"-"+(i===0?"thumbnail":"body") +"."+ext;
 await put(pathname,Buffer.from(m[2],"base64"),{access:"private",contentType:m[1],addRandomSuffix:false});
 return {pathname,role:String(img.role||""),caption:String(img.caption||""),sourceType:String(img.sourceType||"ai")};
}
export default async function handler(req,res){
 cors(res); if(req.method==="OPTIONS")return res.status(204).end();
 try{
  if(req.method==="POST"){
   const b=req.body||{}; if(!b.title||!b.content)return res.status(400).json({error:"제목과 본문이 필요합니다."});
   const id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
   const sources=(Array.isArray(b.sources)?b.sources:[]).slice(0,10).map(x=>({title:String(x.title||"").slice(0,500),source:String(x.source||"").slice(0,200),date:String(x.date||"").slice(0,50),url:String(x.url||"").slice(0,2000)}));
   const images=[];
   for(let i=0;i<(Array.isArray(b.images)?b.images:[]).slice(0,4).length;i++){const saved=await saveImage(id,b.images[i],i);if(saved)images.push(saved)}
   const item={id,title:String(b.title).slice(0,300),content:String(b.content).slice(0,30000),category:String(b.category||""),hashtags:String(b.hashtags||""),thumbnail:String(b.thumbnail||""),sourcePrompt:String(b.sourcePrompt||"").slice(0,10000),sources,images,status:"게시 대기",createdAt:b.createdAt||new Date().toISOString()};
   await put("queue/"+id+".json",JSON.stringify(item),{access:"private",contentType:"application/json",addRandomSuffix:false});
   return res.status(200).json({ok:true,id,sources:sources.length,images:images.length});
  }
  if(req.method==="GET"){
   const id=String(req.query?.id||"");
   const asset=String(req.query?.asset||"");
   if(asset){
    if(!asset.startsWith("queue-assets/"))return res.status(400).json({error:"Invalid asset"});
    const r=await get(asset,{access:"private"}); if(!r||r.statusCode!==200)return res.status(404).end();
    res.setHeader("Content-Type",r.blob.contentType||"image/png");res.setHeader("Cache-Control","private, max-age=3600");
    const ab=await new Response(r.stream).arrayBuffer();return res.status(200).send(Buffer.from(ab));
   }
   const {blobs}=await list({prefix:"queue/",limit:50}); const items=[];
   for(const b of blobs.sort((a,z)=>new Date(z.uploadedAt)-new Date(a.uploadedAt)).slice(0,20)){
    const r=await get(b.pathname,{access:"private"});if(!r||r.statusCode!==200)continue;
    const txt=await new Response(r.stream).text();try{items.push(JSON.parse(txt))}catch{}
   }
   return res.status(200).json({items});
  }
  return res.status(405).json({error:"Method not allowed"});
 }catch(e){return res.status(500).json({error:e.message})}
}