(function(){
  const {qs,qsa,int,num,formatDate,uid,debounce,setError,clearErrors,isoNow,escapeHtml}=MBG;
  const {kegiatan,drafts}=MBGService;
  const form=qs('#kegiatanForm'), stages=qs('#stages'), recipients=qs('#recipients');
  const params=new URLSearchParams(location.search);
  const requestedEdit=params.get('edit');
  let editingId=/^\d{4}-\d{2}-\d{2}$/.test(requestedEdit||'')?requestedEdit:null;
  let draftId=editingId?`draft_kegiatan_edit_${editingId}`:'draft_kegiatan_harian';
  let currentPhoto=null, currentPhotoName='', existingPhotoMeta=null, submitting=false, loading=true;
  const defaultStages=['Persiapan','Memasak','Pengemasan','Distribusi'];
  const nutritionMetrics=[['energi_kkal','Energi','kkal'],['protein_gram','Protein','gram'],['lemak_gram','Lemak','gram'],['karbohidrat_gram','Karbohidrat','gram'],['serat_gram','Serat','gram']];

  function stageHTML(data={}){
    const id=data.id||uid('tahap');
    return `<div class="stage" data-id="${escapeHtml(id)}"><div class="row-head"><span class="row-title">Tahapan Produksi</span><button type="button" class="btn btn-danger btn-small remove-stage">Hapus</button></div><div class="grid grid-3"><div class="field"><label class="required">Nama Tahapan</label><input class="stage-name" value="${escapeHtml(data.nama_tahapan||'')}"><div class="error"></div></div><div class="field"><label>Jam Mulai</label><input type="time" class="stage-start" value="${escapeHtml(data.jam_mulai||'')}"></div><div class="field"><label>Jam Selesai</label><input type="time" class="stage-end" value="${escapeHtml(data.jam_selesai||'')}"><div class="error"></div></div></div><div class="field"><label class="required">Uraian Kegiatan</label><textarea class="stage-desc">${escapeHtml(data.uraian_kegiatan||'')}</textarea><div class="error"></div></div></div>`;
  }

  function recipientHTML(data={}){
    const p=data.penerima||{};
    return `<div class="recipient-row" data-id="${escapeHtml(data.id||uid('kelompok'))}"><div class="row-head"><span class="row-title">Kelompok Penerima</span><button type="button" class="btn btn-danger btn-small remove-recipient">Hapus</button></div><div class="grid grid-2"><div class="field"><label class="required">Nama Kelompok/Kategori</label><input class="r-name" value="${escapeHtml(data.nama_kelompok||'')}" placeholder="Contoh: ATS 9-18 Tahun"><div class="error"></div></div><div class="field"><label>Nama Sekolah/Desa/Lokasi</label><input class="r-location" value="${escapeHtml(data.lokasi||'')}" placeholder="Lokasi terkait"></div></div><div class="grid grid-3"><div class="field"><label>Pria</label><input type="number" min="0" class="r-male" value="${int(p.pria)}"></div><div class="field"><label>Wanita</label><input type="number" min="0" class="r-female" value="${int(p.wanita)}"></div><div class="field"><label>Lainnya</label><input type="number" min="0" class="r-other" value="${int(p.lainnya)}"></div></div><div class="grid grid-2"><div class="field"><label>Total Penerima</label><input class="r-total" value="${int(p.total)}" readonly></div><div class="field"><label class="required">Total Porsi yang Diterima</label><input type="number" min="0" class="r-portions" value="${int(data.total_porsi_diterima)}" placeholder="Total Porsi, contoh: 28"><div class="error"></div></div></div></div>`;
  }

  function addStage(data){stages.insertAdjacentHTML('beforeend',stageHTML(data));}
  function addRecipient(data){recipients.insertAdjacentHTML('beforeend',recipientHTML(data));calculate();}

  function buildNutrition(){
    const n=qs('#nutrition');
    nutritionMetrics.forEach(([key,label,unit])=>{
      n.insertAdjacentHTML('beforeend',`<div class="metric">${label}</div><div class="unit-input"><input type="number" min="0" step="0.1" data-size="besar" data-key="${key}" value="0.0"><span class="unit">${unit}</span></div><div class="unit-input"><input type="number" min="0" step="0.1" data-size="kecil" data-key="${key}" value="0.0"><span class="unit">${unit}</span></div>`);
    });
  }

  function calculate(){
    let grand=0;
    qsa('.recipient-row').forEach(row=>{
      const total=int(qs('.r-male',row).value)+int(qs('.r-female',row).value)+int(qs('.r-other',row).value);
      qs('.r-total',row).value=total;
      grand+=int(qs('.r-portions',row).value);
    });
    qs('#grandTotal').textContent=grand.toLocaleString('id-ID');
    const diff=int(qs('#jumlah_porsi_produksi').value)-grand;
    qs('#difference').textContent=diff.toLocaleString('id-ID');
    const box=qs('#differenceBox');
    box.classList.toggle('ok',diff===0);
    box.classList.toggle('bad',diff!==0);
    return {grand,diff};
  }

  function collect(){
    const ada=qs('input[name="ada_operasional"]:checked').value==='true';
    const calc=calculate();
    const tahap=qsa('.stage').map(row=>({id:row.dataset.id,nama_tahapan:qs('.stage-name',row).value.trim(),jam_mulai:qs('.stage-start',row).value,jam_selesai:qs('.stage-end',row).value,uraian_kegiatan:qs('.stage-desc',row).value.trim()}));
    const groups=qsa('.recipient-row').map(row=>({id:row.dataset.id,nama_kelompok:qs('.r-name',row).value.trim(),lokasi:qs('.r-location',row).value.trim(),penerima:{pria:int(qs('.r-male',row).value),wanita:int(qs('.r-female',row).value),lainnya:int(qs('.r-other',row).value),total:int(qs('.r-total',row).value)},total_porsi_diterima:int(qs('.r-portions',row).value)}));
    const totals=groups.reduce((a,g)=>({pria:a.pria+g.penerima.pria,wanita:a.wanita+g.penerima.wanita,lainnya:a.lainnya+g.penerima.lainnya,total:a.total+g.penerima.total}),{pria:0,wanita:0,lainnya:0,total:0});
    const besar={},kecil={};
    qsa('#nutrition input').forEach(el=>(el.dataset.size==='besar'?besar:kecil)[el.dataset.key]=num(el.value));
    const peng=qs('input[name="pengalihan"]:checked').value==='true';
    const date=qs('#tanggal_operasional').value;
    let fotoMenu=null;
    if(ada&&currentPhoto) fotoMenu={ada:true,nama_file:currentPhotoName,mime_type:currentPhoto.type,ukuran_byte:currentPhoto.size,data:currentPhoto};
    else if(ada&&existingPhotoMeta) fotoMenu={...existingPhotoMeta,data:undefined};
    return {
      id:date,tanggal_operasional:date,ada_operasional:ada,status_operasional:ada?'operasional':'tidak_operasional',
      nama_petugas:qs('#nama_petugas').value.trim(),kepala_sppg:qs('#kepala_sppg').value.trim(),
      tahapan_produksi:ada?tahap:[],nama_menu_mbg:ada?qs('#nama_menu_mbg').value.trim():'',
      kandungan_gizi:ada?{porsi_besar:besar,porsi_kecil:kecil}:{porsi_besar:{energi_kkal:0,protein_gram:0,lemak_gram:0,karbohidrat_gram:0,serat_gram:0},porsi_kecil:{energi_kkal:0,protein_gram:0,lemak_gram:0,karbohidrat_gram:0,serat_gram:0}},
      jumlah_porsi_produksi:ada?int(qs('#jumlah_porsi_produksi').value):0,
      pengalihan_porsi:ada?{ada:peng,alasan:peng?qs('#alasan_pengalihan').value.trim():'',jumlah_porsi:peng?int(qs('#jumlah_pengalihan').value):0}:{ada:false,alasan:'',jumlah_porsi:0},
      kelompok_penerima:ada?groups:[],
      rekap:{total_pria:ada?totals.pria:0,total_wanita:ada?totals.wanita:0,total_lainnya:ada?totals.lainnya:0,total_penerima:ada?totals.total:0,grand_total_porsi:ada?calc.grand:0,selisih_porsi:ada?calc.diff:0},
      foto_menu:fotoMenu,schema_version:5
    };
  }

  async function validate(){
    clearErrors(form);
    showFormMessage('');
    let ok=true;
    const date=qs('#tanggal_operasional');
    if(!date.value){setError(date,'Tanggal operasional wajib diisi.');ok=false;}
    else if(!editingId || date.value!==editingId){
      try{
        if(await kegiatan.get(date.value)){
          showFormMessage(`Laporan untuk tanggal ${formatDate(date.value)} sudah ada.`,'error-text');
          ok=false;
        }
      }catch(err){
        showFormMessage('Gagal mengecek tanggal pada arsip online.','error-text');
        ok=false;
      }
    }

    const ada=qs('input[name="ada_operasional"]:checked').value==='true';
    if(!ada)return ok;
    if(!qs('#nama_menu_mbg').value.trim()){setError(qs('#nama_menu_mbg'),'Nama Menu MBG wajib diisi.');ok=false;}
    qsa('.stage').forEach(row=>{
      const name=qs('.stage-name',row),desc=qs('.stage-desc',row),start=qs('.stage-start',row).value,end=qs('.stage-end',row).value;
      if(!name.value.trim()){setError(name,'Nama tahapan wajib diisi.');ok=false;}
      if(!desc.value.trim()){setError(desc,'Uraian kegiatan wajib diisi.');ok=false;}
      if(start&&end&&end<start){setError(qs('.stage-end',row),'Jam selesai tidak boleh lebih awal dari jam mulai.');ok=false;}
    });
    qsa('.recipient-row').forEach(row=>{
      const name=qs('.r-name',row),p=qs('.r-portions',row);
      if(!name.value.trim()){setError(name,'Nama kelompok wajib diisi.');ok=false;}
      if(Number(p.value)<0){setError(p,'Total porsi tidak boleh negatif.');ok=false;}
    });
    const peng=qs('input[name="pengalihan"]:checked').value==='true';
    if(peng){
      if(!qs('#alasan_pengalihan').value.trim()){setError(qs('#alasan_pengalihan'),'Alasan pengalihan wajib diisi.');ok=false;}
      if(int(qs('#jumlah_pengalihan').value)<=0){setError(qs('#jumlah_pengalihan'),'Jumlah porsi dialihkan harus lebih dari 0.');ok=false;}
    }
    if(!currentPhoto&&!existingPhotoMeta){setError(qs('#foto_menu'),'Foto menu wajib diunggah.');ok=false;}
    return ok;
  }

  function setSave(s){const el=qs('#saveState');el.textContent=s;el.classList.toggle('saved',s==='Tersimpan');}
  const autoSave=debounce(async()=>{
    if(submitting||loading)return;
    try{await drafts.save({id:draftId,jenis:'kegiatan_harian',editing_id:editingId||null,data:collect(),updated_at:isoNow()});setSave('Tersimpan');}
    catch(e){setSave('Belum tersimpan');}
  },500);
  function onChange(){if(loading)return;setSave('Belum tersimpan');calculate();autoSave();}

  function toggleOperational(){const ada=qs('input[name="ada_operasional"]:checked').value==='true';qs('#operationalFields').classList.toggle('hidden',!ada);}

  function revokePreview(){const img=qs('#menuPreview img');if(img.dataset.objectUrl){URL.revokeObjectURL(img.dataset.objectUrl);delete img.dataset.objectUrl;}}
  function showPhoto(file,name){
    const p=qs('#menuPreview'),img=qs('img',p);revokePreview();
    const url=URL.createObjectURL(file);img.src=url;img.dataset.objectUrl=url;
    qs('#menuFileInfo').textContent=`${name} - ${(file.size/1024/1024).toFixed(2)} MB`;
    p.style.display='block';
  }
  function showExistingPhoto(meta){
    if(!meta)return;
    const p=qs('#menuPreview'),img=qs('img',p);revokePreview();
    if(meta.data instanceof Blob){const url=URL.createObjectURL(meta.data);img.src=url;img.dataset.objectUrl=url;}else if(meta.url){img.src=meta.url;}else{return;}
    qs('#menuFileInfo').textContent=`Foto tersimpan: ${meta.nama_file||'foto menu'}${meta.ukuran_byte?` - ${(meta.ukuran_byte/1024/1024).toFixed(2)} MB`:''}`;
    p.style.display='block';
  }

  function fillForm(x){
    qs('#tanggal_operasional').value=x.tanggal_operasional||x.id||'';
    qs('#tanggalDisplay').textContent=qs('#tanggal_operasional').value?formatDate(qs('#tanggal_operasional').value):'Format: dd-mm-yyyy';
    const ada=x.ada_operasional!==false;
    qs(`input[name="ada_operasional"][value="${ada}"]`).checked=true;
    qs('#nama_petugas').value=x.nama_petugas||'';
    qs('#kepala_sppg').value=x.kepala_sppg||'';
    stages.innerHTML='';
    (x.tahapan_produksi?.length?x.tahapan_produksi:defaultStages.map(n=>({nama_tahapan:n}))).forEach(addStage);
    qs('#nama_menu_mbg').value=x.nama_menu_mbg||'';
    qs('#jumlah_porsi_produksi').value=int(x.jumlah_porsi_produksi);
    const pg=!!x.pengalihan_porsi?.ada;
    qs(`input[name="pengalihan"][value="${pg}"]`).checked=true;
    qs('#alasan_pengalihan').value=x.pengalihan_porsi?.alasan||'';
    qs('#jumlah_pengalihan').value=int(x.pengalihan_porsi?.jumlah_porsi);
    qs('#diversionFields').classList.toggle('hidden',!pg);
    recipients.innerHTML='';
    (x.kelompok_penerima?.length?x.kelompok_penerima:[{}]).forEach(addRecipient);
    qsa('#nutrition input').forEach(el=>el.value=num(x.kandungan_gizi?.[el.dataset.size==='besar'?'porsi_besar':'porsi_kecil']?.[el.dataset.key]).toFixed(1));
    if(x.foto_menu?.data instanceof Blob){currentPhoto=x.foto_menu.data;currentPhotoName=x.foto_menu.nama_file||'foto-menu';showPhoto(currentPhoto,currentPhotoName);}
    else if(x.foto_menu?.storage_path||x.foto_menu?.url){existingPhotoMeta=x.foto_menu;showExistingPhoto(existingPhotoMeta);}
    toggleOperational();calculate();setSave('Tersimpan');
  }

  function resetForm(){
    form.reset();stages.innerHTML='';recipients.innerHTML='';currentPhoto=null;currentPhotoName='';existingPhotoMeta=null;revokePreview();qs('#menuPreview').style.display='none';
    defaultStages.forEach(n=>addStage({nama_tahapan:n}));addRecipient();qs('input[name="ada_operasional"][value="true"]').checked=true;toggleOperational();qsa('#nutrition input').forEach(i=>i.value='0.0');calculate();qs('#tanggalDisplay').textContent='Format: dd-mm-yyyy';
  }

  function showFormMessage(text,type=''){const el=qs('#duplicateError');el.textContent=text;el.className='form-message';if(type)el.classList.add(type);}

  async function loadInitial(){
    if(editingId){
      qs('#pageTitle').textContent='Edit Kegiatan Harian';
      qs('#pageSubtitle').textContent='Ubah laporan yang sudah tersimpan pada arsip online SPPG.';
      qs('#editNotice').textContent=`Mode edit laporan tanggal ${formatDate(editingId)}. Foto lama tetap digunakan jika tidak diganti.`;
      qs('#editNotice').classList.remove('hidden');
      qs('#cancelEdit').classList.remove('hidden');
      qs('#submitReport').textContent='Simpan Perubahan';
      qs('#tanggal_operasional').readOnly=true;
      const savedDraft=await drafts.get(draftId);
      if(savedDraft?.data){fillForm(savedDraft.data);return;}
      const row=await kegiatan.get(editingId);
      if(!row)throw new Error(`Laporan tanggal ${formatDate(editingId)} tidak ditemukan.`);
      fillForm(row);
      return;
    }
    const d=await drafts.get(draftId);
    if(d?.data){fillForm(d.data);return;}
    defaultStages.forEach(n=>addStage({nama_tahapan:n}));addRecipient();
  }

  function wireEvents(){
    qs('#addStage').addEventListener('click',()=>{addStage();onChange();});
    qs('#addRecipient').addEventListener('click',()=>{addRecipient();onChange();});
    form.addEventListener('click',e=>{
      if(e.target.matches('.remove-stage')){e.target.closest('.stage').remove();onChange();}
      if(e.target.matches('.remove-recipient')){e.target.closest('.recipient-row').remove();if(!qsa('.recipient-row').length)addRecipient();onChange();}
    });
    form.addEventListener('input',onChange);
    form.addEventListener('change',async e=>{
      if(e.target.name==='ada_operasional')toggleOperational();
      if(e.target.name==='pengalihan')qs('#diversionFields').classList.toggle('hidden',e.target.value!=='true');
      if(e.target.id==='tanggal_operasional'){
        qs('#tanggalDisplay').textContent=e.target.value?formatDate(e.target.value):'Format: dd-mm-yyyy';
        if(e.target.value && (!editingId || e.target.value!==editingId)){
          try{
            const existing=await kegiatan.get(e.target.value);
            showFormMessage(existing?`Laporan untuk tanggal ${formatDate(e.target.value)} sudah ada.`:'',existing?'error-text':'');
          }catch{showFormMessage('Tidak dapat mengecek tanggal pada arsip online.','error-text');}
        }else showFormMessage('');
      }
      onChange();
    });
    qs('#foto_menu').addEventListener('change',e=>{
      const f=e.target.files[0];currentPhoto=null;currentPhotoName='';setError(e.target,'');
      if(!f){if(existingPhotoMeta)showExistingPhoto(existingPhotoMeta);return;}
      const allowed=['image/jpeg','image/png','image/webp'],min=.1*1024*1024,max=.5*1024*1024;
      if(!allowed.includes(f.type)){setError(e.target,'Format foto harus JPG, JPEG, PNG, atau WEBP.');e.target.value='';return;}
      if(f.size<min){setError(e.target,'Ukuran foto terlalu kecil. Minimal 0,1 MB.');e.target.value='';return;}
      if(f.size>max){setError(e.target,'Ukuran foto terlalu besar. Maksimal 0,5 MB; kompres dulu foto lalu unggah kembali.');e.target.value='';return;}
      currentPhoto=f;currentPhotoName=f.name;showPhoto(f,f.name);onChange();
    });
    qs('#scrollNext').addEventListener('click',()=>{const sections=['umum','produksi','gizi','penerima','foto'];const y=window.scrollY+100;const next=sections.map(id=>qs('#'+id)).find(el=>el.offsetTop>y);(next||qs('#umum')).scrollIntoView({behavior:'smooth'});});
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(submitting)return;
      if(!(await validate())){qs('[aria-invalid="true"]')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
      const button=qs('#submitReport'),data=collect();submitting=true;button.disabled=true;button.textContent=editingId?'Menyimpan perubahan...':'Menyimpan...';showFormMessage(editingId?'Menyimpan perubahan laporan...':'Menyimpan laporan dan foto ke arsip online...');
      try{
        await kegiatan.save(data,editingId);
        await drafts.remove(draftId);
        setSave('Tersimpan');
        if(editingId){location.href=window.SPPGAccess?.withAccess('dashboard.html')||'dashboard.html';return;}
        resetForm();window.scrollTo({top:0,behavior:'smooth'});showFormMessage('Laporan berhasil disimpan online dan tersedia pada Dashboard Rekap di semua perangkat yang memakai tautan akses yang sama.','success-text');
      }catch(err){showFormMessage(err.message==='DUPLICATE'?`Laporan untuk tanggal ${formatDate(data.id)} sudah ada.`:`Gagal menyimpan: ${err.message}`,'error-text');}
      finally{submitting=false;button.disabled=false;if(!editingId)button.textContent='Simpan Laporan';else button.textContent='Simpan Perubahan';}
    });
  }

  async function init(){
    if(location.protocol==='file:')qs('#fileNotice').classList.remove('hidden');
    buildNutrition();wireEvents();
    try{await loadInitial();}
    finally{loading=false;calculate();}
  }

  init().catch(err=>{loading=false;showFormMessage(`Gagal memuat aplikasi: ${err.message}`,'error-text');});
})();
