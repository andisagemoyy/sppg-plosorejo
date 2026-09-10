(function(){
  async function parseError(res){
    let data=null;try{data=await res.json();}catch{}
    const err=new Error(data?.message||data?.error||`Server merespons ${res.status}.`);
    err.status=res.status;err.code=data?.code||'';return err;
  }
  async function request(path,{method='GET',json,body,headers={}}={}){
    const key=window.SPPGAccess?.getKey?.();
    if(!key) throw new Error('Tautan akses tidak valid atau tidak lengkap.');
    const h=new Headers(headers);h.set('x-sppg-key',key);
    if(json!==undefined){h.set('content-type','application/json');body=JSON.stringify(json);}
    const res=await fetch(path,{method,headers:h,body,cache:'no-store'});
    if(!res.ok) throw await parseError(res);
    if(res.status===204) return null;
    const type=res.headers.get('content-type')||'';
    if(type.includes('application/json')) return res.json();
    return res.blob();
  }
  window.SPPGApi={request};
})();
