(function(){
 const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
 const num=v=>Number.isFinite(Number(v))?Number(v):0;
 const int=v=>Math.max(0,parseInt(v||0,10)||0);
 const formatDate=iso=>{if(!iso)return '-';const [y,m,d]=String(iso).slice(0,10).split('-');return `${d}-${m}-${y}`};
 const isoNow=()=>new Date().toISOString();
 const uid=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
 const escapeHtml=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
 function debounce(fn,wait=500){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait)}}
 function setError(el,msg=''){const box=el.closest('.field')?.querySelector('.error');if(box)box.textContent=msg;el.setAttribute('aria-invalid',msg?'true':'false');}
 function clearErrors(root=document){qsa('.error',root).forEach(e=>e.textContent='');qsa('[aria-invalid="true"]',root).forEach(e=>e.setAttribute('aria-invalid','false'));}
 window.MBG={qs,qsa,num,int,formatDate,isoNow,uid,escapeHtml,debounce,setError,clearErrors};
})();
