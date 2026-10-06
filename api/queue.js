import { put, list, get } from "@vercel/blob";
const origin="https://miraclelife77-cmd.github.io";
function cors(res){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type")}
export default async function handler(req,res){
 cors(res); if(req.method==="OPTIONS")return res.status(204).end();
 try{
  if(req.method==="POST"){
   const b=req.body||{}; if(!b.title||!b.content)return res.status(400).json({error:"제목과 본문이 필요합니다."});
   const id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);
   const item={id,title:String(b.title).slice(0,300),content:String(b.content).slice(0,30000),category:String(b.category||""),hashtags:String(b.hashtags||""),thumbnail:String(b.thumbnail||""),sourcePrompt:String(b.sourcePrompt||"").slice(0,10000),status:"게시 대기",createdAt:b.createdAt||new Date().toISOString()};
   await put("queue/"+id+".json",JSON.stringify(item),{access:"private",contentType:"application/json",addRandomSuffix:false});
   return res.status(200).json({ok:true,id});
  }
  if(req.method==="GET"){
   const {blobs}=await list({prefix:"queue/",limit:50});
   const items=[];
   for(const b of blobs.sort((a,z)=>new Date(z.uploadedAt)-new Date(a.uploadedAt)).slice(0,20)){
    const r=await get(b.pathname,{access:"private"}); if(!r||r.statusCode!==200)continue;
    const txt=await new Response(r.stream).text(); try{items.push(JSON.parse(txt))}catch{}
   }
   return res.status(200).json({items});
  }
  return res.status(405).json({error:"Method not allowed"});
 }catch(e){return res.status(500).json({error:e.message})}
}