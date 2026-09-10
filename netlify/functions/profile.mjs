import { getStore } from '@netlify/blobs';
import { authorize } from '../lib/access.mjs';
import { json,fail,readJSON } from '../lib/http.mjs';
import { DEFAULT_PROFILE } from '../lib/default-profile.mjs';
const KEY='utama';
function store(){return getStore('sppg-profile');}
export default async(req)=>{
  const auth=authorize(req);if(!auth.ok)return fail(auth.message,auth.status);
  const s=store();
  try{
    if(req.method==='GET'){const saved=await s.get(KEY,{type:'json',consistency:'strong'});return json(saved||{...DEFAULT_PROFILE,updated_at:null});}
    if(req.method==='PUT'){
      const data=await readJSON(req);const row={...data,updated_at:new Date().toISOString(),schema_version:1};await s.setJSON(KEY,row);return json(row);
    }
    return fail('Metode tidak didukung.',405);
  }catch(err){return fail(err?.message||'Gagal mengakses Data SPPG.',500);}
};
export const config={path:'/api/profile'};
