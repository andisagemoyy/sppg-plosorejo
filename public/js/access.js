(function(){
  const KEY_NAME='sppg_plosorejo_access_key';
  const params=new URLSearchParams(location.search);
  const fromUrl=(params.get('access')||'').trim();
  if(fromUrl) localStorage.setItem(KEY_NAME,fromUrl);

  function getKey(){return (fromUrl||localStorage.getItem(KEY_NAME)||'').trim();}
  function withAccess(url){
    const key=getKey();
    if(!key) return url;
    const u=new URL(url,location.href);
    if(u.origin===location.origin) u.searchParams.set('access',key);
    return u.pathname.split('/').pop()+u.search+u.hash;
  }
  function showGate(){
    if(document.getElementById('accessGate')) return;
    const gate=document.createElement('div');
    gate.id='accessGate';gate.className='access-gate';
    gate.innerHTML=`<div class="access-gate-card"><div class="access-gate-brand">SPPG PLOSOREJO</div><h1>Tautan akses tidak lengkap</h1><p>Website ini tidak memakai login. Data hanya dapat dibaca/diubah melalui tautan khusus yang berisi kode akses.</p><div class="notice"><strong>Minta tautan lengkap dari pengelola website.</strong><br>Tautan yang benar berbentuk <code>https://namasitus.netlify.app/?access=KODE_RAHASIA</code>.</div></div>`;
    document.body.appendChild(gate);
  }
  function decorateLinks(){
    const key=getKey();
    if(!key){showGate();return;}
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href');
      if(!href||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto:')||href.startsWith('tel:')) return;
      a.href=withAccess(href);
    });
  }
  window.SPPGAccess={getKey,withAccess};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',decorateLinks); else decorateLinks();
})();
