(function(){
  const {escapeHtml,int}=MBG;
  const master=window.MBG_PENERIMA_MASTER||{items:[]};
  const category=document.getElementById('masterCategory');
  const group=document.getElementById('masterPosyanduGroup');
  const groupWrap=document.getElementById('masterPosyanduWrap');
  const search=document.getElementById('masterSearch');
  const sections=document.getElementById('masterSections');
  const count=document.getElementById('masterCount');

  const normalize=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const topCategory=item=>item.jenis==='posyandu'?'POSYANDU':item.kategori;
  const order=['PAUD','TK/RA','SD/MI','SMP/MTS','SMA/SMK/MA','ATS','3B PLOSOREJO','3B MAYAHAN'];

  function ref(item){
    const r=item.referensi||{};
    if(item.jenis==='posyandu') return `Balita ${int(r.balita)} • Ibu Hamil ${int(r.ibu_hamil)} • Ibu Menyusui ${int(r.ibu_menyusui)} • PJ ${int(r.pj)} • Total ${int(r.total)}`;
    return `Anak ${int(r.anak)} • Dewasa ${int(r.dewasa)} • PJ/Guru ${int(r.pj_guru)} • Total ${int(r.total)}${r.jarak?` • Jarak ${r.jarak}`:''}`;
  }

  function render(){
    const cat=category.value;
    const posyanduGroup=group.value;
    const q=normalize(search.value);
    const rows=master.items.filter(item=>{
      if(cat&&topCategory(item)!==cat)return false;
      if(cat==='POSYANDU'&&posyanduGroup&&item.kategori!==posyanduGroup)return false;
      if(q&&!normalize(item.nama).includes(q))return false;
      return true;
    });
    count.textContent=`${rows.length} data`;
    if(!rows.length){sections.innerHTML='<div class="empty">Tidak ada data yang cocok.</div>';return;}
    const grouped=new Map();
    rows.forEach(item=>{const key=item.kategori;(grouped.get(key)||grouped.set(key,[]).get(key)).push(item);});
    sections.innerHTML=order.filter(key=>grouped.has(key)).map(key=>{
      const isPosyandu=key.startsWith('3B ');
      const title=isPosyandu?`POSYANDU • ${key}`:key;
      const cards=grouped.get(key).map(item=>`<article class="master-item"><div><strong>${escapeHtml(item.nama)}</strong><span>${escapeHtml(ref(item))}</span></div><span class="badge ${isPosyandu?'green':'gray'}">${escapeHtml(isPosyandu?'Posyandu':key)}</span></article>`).join('');
      return `<section class="master-group"><div class="master-group-head"><h3>${escapeHtml(title)}</h3><span>${grouped.get(key).length} penerima</span></div>${cards}</section>`;
    }).join('');
  }

  category.addEventListener('change',()=>{
    groupWrap.classList.toggle('hidden',category.value!=='POSYANDU');
    if(category.value!=='POSYANDU')group.value='';
    render();
  });
  group.addEventListener('change',render);
  search.addEventListener('input',render);
  render();
})();
