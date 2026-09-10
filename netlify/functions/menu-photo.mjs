import { getStore } from '@netlify/blobs';
import { authorize } from '../lib/access.mjs';
import { json,fail } from '../lib/http.mjs';
function store(){return getStore({name:'sppg-menu-photos',consistency:'strong'});}
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||'');}
export default async(req)=>{
  const auth=authorize(req);if(!auth.ok)return fail(auth.message,auth.status);
  const url=new URL(req.url),date=url.searchParams.get('date');if(!validDate(date))return fail('Tanggal foto tidak valid.',400);
  const s=store();
  try{
    if(req.method==='GET'){
      const entry=await s.getWithMetadata(date,{type:'blob',consistency:'strong'});if(!entry)return fail('Foto tidak ditemukan.',404);
      return new Response(entry.data,{headers:{'content-type':entry.metadata?.mime_type||'image/jpeg','cache-control':'no-store','content-disposition':'inline'}});
    }
    if(req.method==='POST'){
      const blob=await req.blob(),type=req.headers.get('content-type')||blob.type||'';const allowed=['image/jpeg','image/png','image/webp'];
      if(!allowed.includes(type))return fail('Format foto harus JPG/JPEG/PNG/WEBP.',400);
      if(blob.size<0.1*1024*1024)return fail('Ukuran foto minimal 0,1 MB.',400);
      if(blob.size>0.5*1024*1024)return fail('Ukuran foto maksimal 0,5 MB. Kompres dulu.',400);
      const raw=req.headers.get('x-file-name')||'foto-menu';let name='foto-menu';try{name=decodeURIComponent(raw);}catch{name=raw;}
      const meta={ada:true,nama_file:name,mime_type:type,ukuran_byte:blob.size,photo_key:date};
      await s.set(date,blob,{metadata:meta});return json(meta,201);
    }
    if(req.method==='DELETE'){await s.delete(date);return new Response(null,{status:204});}
    return fail('Metode tidak didukung.',405);
  }catch(err){return fail(err?.message||'Gagal mengakses foto menu.',500);}
};
export const config={path:'/api/menu-photo'};
