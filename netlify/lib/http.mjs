export function json(data,status=200,headers={}){
  return Response.json(data,{status,headers:{'cache-control':'no-store',...headers}});
}
export function fail(message,status=400,code=''){
  return json({error:true,message,code},status);
}
export async function readJSON(req){
  try{return await req.json();}catch{throw new Error('Payload JSON tidak valid.');}
}
