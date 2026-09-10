import { getStore } from '@netlify/blobs';
import { authorize } from '../lib/access.mjs';
import { json,fail,readJSON } from '../lib/http.mjs';
const MAX_FILE=30*1024*1024;
function metaStore(){return getStore({name:'sppg-archive-meta',consistency:'strong'});}
function fileStore(){return getStore({name:'sppg-archive-files',consistency:'strong'});}
function validBagian(v){return ['ahli_gizi','akuntansi'].includes(v);}
export default async(req)=>{
  const auth=authorize(req);if(!auth.ok)return fail(auth.message,auth.status);
  const url=new URL(req.url),bagian=url.searchParams.get('bagian'),id=url.searchParams.get('id');const meta=metaStore();
  try{
    if(req.method==='GET'){
      if(id){const row=await meta.get(id,{type:'json',consistency:'strong'});return row?json(row):fail('Dokumen tidak ditemukan.',404);}
      if(!validBagian(bagian))return fail('Bagian arsip tidak valid.',400);
      const {blobs}=await meta.list();const rows=[];
      for(const b of blobs){const row=await meta.get(b.key,{type:'json',consistency:'strong'});if(row?.bagian===bagian&&row?.status==='complete')rows.push(row);}
      rows.sort((a,b)=>String(b.tanggal_dokumen||b.created_at).localeCompare(String(a.tanggal_dokumen||a.created_at)));return json(rows);
    }
    if(req.method==='POST'){
      const data=await readJSON(req);if(!validBagian(data.bagian))return fail('Bagian arsip tidak valid.',400);
      const size=Number(data.ukuran_byte)||0,count=Number(data.chunk_count)||0;if(size<=0||size>MAX_FILE)return fail('Ukuran file harus lebih dari 0 dan maksimal 30 MB.',400);
      if(count<1||count>20)return fail('Jumlah potongan file tidak valid.',400);
      if(!String(data.judul||'').trim()||!String(data.nama_file||'').trim())return fail('Judul dan nama file wajib diisi.',400);
      const newId=crypto.randomUUID();const now=new Date().toISOString();
      const row={id:newId,bagian:data.bagian,judul:String(data.judul).trim(),tanggal_dokumen:data.tanggal_dokumen||'',keterangan:String(data.keterangan||'').trim(),diunggah_oleh:String(data.diunggah_oleh||'').trim(),nama_file:String(data.nama_file).slice(0,240),mime_type:String(data.mime_type||'application/octet-stream').slice(0,120),ukuran_byte:size,chunk_count:count,status:'uploading',created_at:now,updated_at:now};
      await meta.setJSON(newId,row,{onlyIfNew:true});return json(row,201);
    }
    if(req.method==='PATCH'){
      const data=await readJSON(req);if(!data.id)return fail('ID arsip wajib diisi.',400);const row=await meta.get(data.id,{type:'json',consistency:'strong'});if(!row)return fail('Dokumen tidak ditemukan.',404);
      const updated={...row,status:'complete',updated_at:new Date().toISOString()};await meta.setJSON(row.id,updated);return json(updated);
    }
    if(req.method==='DELETE'){
      if(!id)return fail('ID arsip wajib diisi.',400);const row=await meta.get(id,{type:'json',consistency:'strong'});if(!row)return new Response(null,{status:204});
      const fs=fileStore();for(let i=0;i<(row.chunk_count||0);i++)await fs.delete(`${id}/${i}`);await meta.delete(id);return new Response(null,{status:204});
    }
    return fail('Metode tidak didukung.',405);
  }catch(err){return fail(err?.message||'Gagal mengakses arsip dokumen.',500);}
};
export const config={path:'/api/archive'};
