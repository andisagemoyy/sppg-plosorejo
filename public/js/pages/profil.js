(function(){
  const form=document.getElementById('profileForm'),status=document.getElementById('profileStatus'),msg=document.getElementById('profileMessage');let loading=false;
  function setStatus(text,ok=false){status.textContent=text;status.classList.toggle('saved',ok);}
  function setMessage(text,type=''){msg.textContent=text;msg.className='form-message '+type;}
  function fill(data){document.querySelectorAll('[data-section][data-key]').forEach(el=>{el.value=data?.[el.dataset.section]?.[el.dataset.key]??'';});document.getElementById('profileNote').value=data?.catatan||'';}
  function collect(){const out={};document.querySelectorAll('[data-section][data-key]').forEach(el=>{out[el.dataset.section]??={};out[el.dataset.section][el.dataset.key]=el.value.trim();});out.catatan=document.getElementById('profileNote').value.trim();return out;}
  async function load(){loading=true;setStatus('Memuat...');setMessage('');try{const data=await SPPGApi.request('/api/profile');fill(data);setStatus(data.updated_at?'Tersimpan online':'Data awal siap disimpan',!!data.updated_at);}catch(e){setStatus('Gagal memuat');setMessage(e.message,'error-text');}finally{loading=false;}}
  form.addEventListener('input',()=>{if(!loading)setStatus('Belum disimpan');});
  form.addEventListener('submit',async e=>{e.preventDefault();const btn=document.getElementById('saveProfile');btn.disabled=true;btn.textContent='Menyimpan...';setMessage('Menyimpan Data SPPG ke arsip online...');try{await SPPGApi.request('/api/profile',{method:'PUT',json:collect()});setStatus('Tersimpan online',true);setMessage('Data SPPG berhasil disimpan dan dapat dibuka dari perangkat lain menggunakan tautan akses yang sama.','success-text');}catch(err){setStatus('Gagal menyimpan');setMessage(err.message,'error-text');}finally{btn.disabled=false;btn.textContent='Simpan Data SPPG';}});
  document.getElementById('reloadProfile').onclick=load;load();
})();
