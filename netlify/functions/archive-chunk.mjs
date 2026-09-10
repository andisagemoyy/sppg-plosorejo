import { getStore } from '@netlify/blobs';
import { authorize } from '../lib/access.mjs';
import { fail } from '../lib/http.mjs';
const MAX_CHUNK=3.2*1024*1024;
function metaStore(){return getStore('sppg-archive-meta');}
function fileStore(){return getStore('sppg-archive-files');}
export default async(req)=>{
  const auth=authorize(req);if(!auth.ok)return fail(auth.message,auth.status);
  const url=new URL(req.url),id=url.searchParams.get('id'),idx=Number(url.searchParams.get('index'));if(!id||!Number.isInteger(idx)||idx<0)return fail('Parameter potongan file tidak valid.',400);
  try{
    const meta=await metaStore().get(id,{type:'json',consistency:'strong'});if(!meta)return fail('Metadata arsip tidak ditemukan.',404);if(idx>=meta.chunk_count)return fail('Index potongan di luar batas.',400);
    const key=`${id}/${idx}`,s=fileStore();
    if(req.method==='POST'){
      const blob=await req.blob();if(blob.size<=0||blob.size>MAX_CHUNK)return fail('Ukuran potongan file tidak valid.',400);await s.set(key,blob,{metadata:{mime_type:meta.mime_type,index:idx}});return new Response(null,{status:204});
    }
    if(req.method==='GET'){
      const blob=await s.get(key,{type:'blob',consistency:'strong'});if(!blob)return fail('Potongan file tidak ditemukan.',404);return new Response(blob,{headers:{'content-type':'application/octet-stream','cache-control':'no-store'}});
    }
    return fail('Metode tidak didukung.',405);
  }catch(err){return fail(err?.message||'Gagal memproses potongan file.',500);}
};
export const config={path:'/api/archive-chunk'};
