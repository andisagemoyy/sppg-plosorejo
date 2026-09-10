import { getStore } from '@netlify/blobs';
import { authorize } from '../lib/access.mjs';
import { json,fail,readJSON } from '../lib/http.mjs';

function store(){return getStore({name:'sppg-kegiatan',consistency:'strong'});}
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||'');}

export default async(req)=>{
  const auth=authorize(req);if(!auth.ok)return fail(auth.message,auth.status);
  const url=new URL(req.url),id=url.searchParams.get('id'),from=url.searchParams.get('from'),to=url.searchParams.get('to');
  const s=store();
  try{
    if(req.method==='GET'){
      if(id){if(!validDate(id))return fail('ID tanggal tidak valid.',400);const row=await s.get(id,{type:'json',consistency:'strong'});return row?json(row):fail('Laporan tidak ditemukan.',404);}
      const {blobs}=await s.list();const rows=[];
      for(const b of blobs){const row=await s.get(b.key,{type:'json',consistency:'strong'});if(row&&(!from||row.id>=from)&&(!to||row.id<=to))rows.push(row);}
      rows.sort((a,b)=>String(a.id).localeCompare(String(b.id)));return json(rows);
    }
    if(req.method==='POST'){
      const data=await readJSON(req);if(!validDate(data.id)||data.id!==data.tanggal_operasional)return fail('Tanggal laporan tidak valid.',400);
      const existing=await s.get(data.id,{type:'json',consistency:'strong'});if(existing)return fail('Laporan untuk tanggal ini sudah ada.',409,'DUPLICATE');
      const now=new Date().toISOString(),row={...data,created_at:now,updated_at:now,schema_version:6};const result=await s.setJSON(row.id,row,{onlyIfNew:true});if(result?.modified===false)return fail('Laporan untuk tanggal ini sudah ada.',409,'DUPLICATE');return json(row,201);
    }
    if(req.method==='PUT'){
      const data=await readJSON(req);if(!validDate(data.id)||data.id!==data.tanggal_operasional)return fail('Tanggal laporan tidak valid.',400);
      const old=await s.get(data.id,{type:'json',consistency:'strong'});if(!old)return fail('Laporan tidak ditemukan.',404);
      const row={...old,...data,id:old.id,tanggal_operasional:old.tanggal_operasional,created_at:old.created_at||new Date().toISOString(),updated_at:new Date().toISOString(),schema_version:6};await s.setJSON(row.id,row);return json(row);
    }
    if(req.method==='DELETE'){
      if(!id)return fail('ID laporan wajib diisi.',400);await s.delete(id);return new Response(null,{status:204});
    }
    return fail('Metode tidak didukung.',405);
  }catch(err){return fail(err?.message||'Gagal mengakses arsip kegiatan.',500);}
};
export const config={path:'/api/kegiatan'};
