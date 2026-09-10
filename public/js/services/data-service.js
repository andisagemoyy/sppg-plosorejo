(function(){
  const {request}=SPPGApi;
  const drafts={
    get:id=>window.MBGDraftDB.get(id),
    save:data=>window.MBGDraftDB.put(data),
    remove:id=>window.MBGDraftDB.remove(id)
  };

  function cleanRecord(data){
    const copy=structuredClone(data);
    if(copy.foto_menu?.data instanceof Blob) delete copy.foto_menu.data;
    return copy;
  }

  async function rawGet(id){
    if(!id) return null;
    try{
      return await request(`/api/kegiatan?id=${encodeURIComponent(id)}`);
    }catch(err){
      // 404 berarti tanggal tersebut memang belum mempunyai laporan.
      // Ini bukan kegagalan koneksi dan harus dikembalikan sebagai null.
      if(err?.status===404) return null;
      throw err;
    }
  }
  async function get(id){
    if(!id) return null;
    const row=await rawGet(id);
    if(!row) return null;
    if(row?.foto_menu?.ada){
      try{row.foto_menu.data=await request(`/api/menu-photo?date=${encodeURIComponent(id)}`);}catch{}
    }
    return row;
  }
  async function getAll(){return request('/api/kegiatan');}
  async function getByDateRange(from,to){
    const q=new URLSearchParams();if(from)q.set('from',from);if(to)q.set('to',to);
    return request(`/api/kegiatan?${q.toString()}`);
  }
  async function uploadPhoto(date,file){
    return request(`/api/menu-photo?date=${encodeURIComponent(date)}`,{
      method:'POST',body:file,headers:{'content-type':file.type,'x-file-name':encodeURIComponent(file.name||'foto-menu')}
    });
  }
  async function deletePhoto(date){try{return await request(`/api/menu-photo?date=${encodeURIComponent(date)}`,{method:'DELETE'});}catch{} }
  async function save(data,originalId=null){
    if(!data?.id) throw new Error('Tanggal laporan belum diisi.');
    if(originalId&&originalId!==data.id) throw new Error('Tanggal laporan tidak dapat diubah saat mode edit.');
    if(!originalId){
      const existing=await rawGet(data.id);
      if(existing){
        const e=new Error('DUPLICATE');
        e.code='DUPLICATE';
        throw e;
      }
    }
    const photo=data.foto_menu?.data instanceof Blob?data.foto_menu.data:null;
    let photoMeta=data.foto_menu?{...data.foto_menu}:null;
    if(photoMeta) delete photoMeta.data;
    if(photo){photoMeta=await uploadPhoto(data.id,photo);}
    const payload=cleanRecord({...data,foto_menu:photoMeta});
    try{
      const saved=await request('/api/kegiatan',{method:originalId?'PUT':'POST',json:payload});
      if(originalId&&!payload.foto_menu) await deletePhoto(data.id);
      return saved;
    }catch(err){
      if(!originalId&&photo) await deletePhoto(data.id);
      if(err.status===409){const e=new Error('DUPLICATE');e.code='DUPLICATE';throw e;}
      throw err;
    }
  }
  async function remove(id){
    await request(`/api/kegiatan?id=${encodeURIComponent(id)}`,{method:'DELETE'});
    await deletePhoto(id);
    return true;
  }

  window.MBGService={kegiatan:{get,getAll,getByDateRange,save,remove},drafts};
})();
