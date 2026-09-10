export function getExpectedKey(){
  return globalThis.Netlify?.env?.get?.('SITE_ACCESS_KEY') || process.env.SITE_ACCESS_KEY || '';
}
export function authorize(req){
  const expected=getExpectedKey();
  if(!expected) return {ok:false,status:503,message:'SITE_ACCESS_KEY belum diatur di Environment Variables Netlify.'};
  const actual=(req.headers.get('x-sppg-key')||'').trim();
  if(!actual||actual!==expected) return {ok:false,status:403,message:'Tautan akses tidak valid.'};
  return {ok:true};
}
