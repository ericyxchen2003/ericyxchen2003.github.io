/* Navigation and collisions are resident. Visual assets follow the vehicle or inspector. */
window.HKScenery=(()=>{
  const SPAN=200, drivingRadius=410, key=(x,z)=>Math.floor(x/SPAN)+','+Math.floor(z/SPAN);
  // Phones share a much smaller graphics budget with the browser tab.
  const compact=window.matchMedia?.('(pointer: coarse)').matches && Math.min(innerWidth,innerHeight)<=820;
  const phoneProfiles={
    smooth:{scale:1,pixels:1000000},
    balanced:{scale:1.5,pixels:1100000},
    high:{scale:2,pixels:1650000}
  };
  const qualityKey='harbour-drive.phone-quality';
  let phoneQuality='balanced';
  if(compact){
    try{
      const saved=localStorage.getItem(qualityKey);
      if(Object.hasOwn(phoneProfiles,saved))phoneQuality=saved;
    }catch{/* Storage can be unavailable for local copies. */}
  }
  function setPhoneQuality(value){
    if(!compact||!Object.hasOwn(phoneProfiles,value))return;
    phoneQuality=value;
    try{localStorage.setItem(qualityKey,value);}catch{/* Use the selection for this session. */}
  }
  function renderRatio(width,height){
    const native=window.devicePixelRatio||1;
    if(!compact)return Math.min(native,1.55);
    const {scale,pixels}=phoneProfiles[phoneQuality];
    return Math.min(native,scale,Math.sqrt(pixels/(width*height)));
  }
  const url=(file,mime='image/webp',fallback='scenery/'+file)=>{
    const node=document.getElementById('asset-'+file);
    return node?'data:'+mime+';base64,'+node.textContent:fallback;
  };
  async function loadOverviews(pages){
    const atlas=new Image();atlas.src=url('region-overviews.webp');
    try{await atlas.decode();}
    catch{
      // Older multi-file installs may still have only the individual sheets.
      return Promise.all(pages.map(async page=>{
        const image=new Image();image.src=url(page.base);await image.decode();return image;
      }));
    }
    const size=atlas.naturalWidth/4;
    return pages.map((_,i)=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
      canvas.getContext('2d').drawImage(atlas,(i%4)*size,Math.floor(i/4)*size,size,size,0,0,size,size);
      return canvas;
    });
  }
  const roofs=['ground','north','mong-kok','tai-kok-tsui','west-kowloon','hung-hom','to-kwa-wan',
    'kowloon-city','kowloon-tong','kai-tak','sham-shui-po','shek-kip-mei','cheung-sha-wan'];
  const distanceToCell=(o,x,z)=>Math.hypot(Math.max(0,Math.abs(x-o.x)-o.half),Math.max(0,Math.abs(z-o.z)-o.half));
  function districtPhotos(overviews,prepareTexture){
    const sheets=overviews.map((preview,i)=>{
      const base=new THREE.Texture(preview);base.colorSpace=THREE.SRGBColorSpace;base.anisotropy=4;base.needsUpdate=true;
      return {preview,base,file:HK_GROUND_TILES[i].base,roofFile:roofs[i]+'.jpg',distance:Infinity,
        ground:{},roof:{},material:null};
    });
    let jobs=0,revision=0;
    function request(sheet,roof){
      const slot=roof?sheet.roof:sheet.ground;
      jobs++;slot.pending=true;const image=new Image();
      image.src=roof?url(sheet.roofFile,'image/jpeg',sheet.roofFile):url(sheet.file);
      image.decode().then(()=>{if(slot.wanted)slot.ready=image;},()=>{slot.retry=performance.now()+3000;})
        .finally(()=>{jobs--;slot.pending=false;});
    }
    function use(sheet,roof,image){
      revision++;
      if(roof){
        if(sheet.roof.texture)sheet.roof.texture.dispose();
        const texture=image?new THREE.Texture(image):sheet.base;
        if(image){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true;prepareTexture(texture);}
        sheet.roof.texture=image?texture:null;sheet.material.map=texture;
      }else{
        sheet.base.dispose();sheet.base.image=image||sheet.preview;sheet.base.needsUpdate=true;
        if(image)prepareTexture(sheet.base);
      }
    }
    function update(radius){
      const candidates=[];
      for(const sheet of sheets){
        // Ground is visible beyond the detailed buildings. Keep a wider exit
        // band so an intersection on a sheet seam can be crossed repeatedly.
        for(const roof of [false,true]){
          if(roof&&(compact||!sheet.material))continue;
          const slot=roof?sheet.roof:sheet.ground;
          const range=roof?radius+180:Math.max(radius+320,compact?900:1500);
          slot.wanted=sheet.distance<range+(slot.active?300:0);
          if(!slot.wanted){
            slot.ready=null;
            if(slot.active){use(sheet,roof,null);slot.active=false;}
          }else if(!slot.active)candidates.push({sheet,slot,roof,rank:sheet.distance+(roof?280:0)});
        }
      }
      candidates.sort((a,b)=>a.rank-b.rank);
      let uploaded=false;
      for(const {sheet,slot,roof} of candidates){
        if(slot.ready){
          if(uploaded)continue;
          use(sheet,roof,slot.ready);slot.ready=null;slot.active=true;uploaded=true;
        }else if(!slot.pending&&jobs<2&&!(performance.now()<slot.retry))request(sheet,roof);
      }
      return uploaded;
    }
    return {sheets,update,get revision(){return revision;}};
  }
  function removeGroup(group){
    if(!group)return;
    group.removeFromParent();
    group.traverse(o=>{
      if(o.isInstancedMesh)o.dispose();
      if(o.isMesh&&!o.geometry.userData.shared)o.geometry.dispose();
    });
  }
  function create(scene,build,skyline,prepareTexture,photos){
    const cells=new Map(),tiles=[],groundMeshes=[],gpu=new THREE.TextureLoader();
    const preparedBases=new WeakSet();
    let uploaded=false;
    let textureJobs=0,stamp=-1,revision=0,previousInspectionRadius;
    function bucket(x,z){
      const k=key(x,z);
      if(!cells.has(k)){
        const ix=Math.floor(x/SPAN),iz=Math.floor(z/SPAN);
        cells.set(k,{x:(ix+.5)*SPAN,z:(iz+.5)*SPAN,buildings:[],shops:[],facades:[],stalls:[],entrances:[],props:[],half:SPAN/2,group:null});
      }
      return cells.get(k);
    }
    function putTerrain(mat,texture,x,z,sheet){
      tiles.push({x,z,sheet,half:160,mat,base:mat.map,texture,ready:null,loaded:null,pending:false,retry:0,wanted:false});
    }
    function putGround(x,z,half,overview,build){
      groundMeshes.push({x,z,half,overview,build,detail:null});
    }
    // Rebuild the neighbourhood after moving a block, rather than scanning the
    // whole map at every frame. Sweep the old neighbourhood once on departure.
    let nearbyCells=[],nearbyTerrain=[],nearbyGround=[],lastX=Infinity,lastZ=Infinity,lastReach=0;
    function loadTile(t){
      t.pending=true;textureJobs++;
      gpu.load(url(t.texture.file),async tex=>{
        // Decoding at first draw makes a turn towards several new tiles stall.
        // Some browsers can still draw an image for which decode() rejects.
        try{await tex.image.decode?.();}catch{}
        t.pending=false;
        if(!t.wanted){textureJobs--;tex.dispose();return;}
        const [u0,v0,u1,v1]=t.texture.uv;
        tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=compact?8:4;
        tex.repeat.set(1/(u1-u0),1/(v1-v0));tex.offset.set(-u0/(u1-u0),-v0/(v1-v0));
        t.ready=tex;
      },undefined,()=>{textureJobs--;t.pending=false;t.retry=performance.now()+3000;});
    }
    function addSky(c){
      c.sky=skyline(c.buildings);
      if(c.sky){scene.add(c.sky);revision++;}
    }
    async function prepareDeparture(x,z){
      const radius=compact?205:drivingRadius;
      if(photos){
        for(const s of photos.sheets)s.distance=Infinity;
        for(const t of tiles)t.sheet.distance=Math.min(t.sheet.distance,distanceToCell(t,x,z));
        photos.update(radius);
      }
      // Build the visible surroundings while the selected rank is still
      // covered. Yield between batches so the departure UI can paint.
      const visible=[...cells.values()].filter(c=>!c.group&&c.sky===undefined&&distanceToCell(c,x,z)<(compact?850:1800));
      visible.sort((a,b)=>distanceToCell(a,x,z)-distanceToCell(b,x,z));
      let end=performance.now()+6;
      for(const c of visible){
        addSky(c);
        if(performance.now()>=end){
          await new Promise(resolve=>setTimeout(resolve,0));
          end=performance.now()+6;
        }
      }
    }
    function release(c){
      c.steps?.return();c.steps=null;
      removeGroup(c.group);
      c.group=null;if(c.sky)c.sky.visible=true;revision++;
    }
    function update(x,z,dirX=0,dirZ=0,immediate=false,inspectionRadius){
      // Hysteresis keeps blocks at an intersection resident through U-turns.
      const radius=inspectionRadius??(compact?205:drivingRadius),extra=radius-drivingRadius;
      const trim=previousInspectionRadius!==undefined&&(inspectionRadius===undefined||radius<previousInspectionRadius);
      previousInspectionRadius=inspectionRadius;
      const aimX=x+dirX,aimZ=z+dirZ,near=distanceToCell;
      const queue=[],images=[],distant=[],ground=[];
      const skyRadius=Math.max(compact?900:2100,radius);
      const reach=Math.max(skyRadius+320,Math.min(radius,1500)+1000)+Math.hypot(dirX,dirZ);
      const refresh=reach>lastReach+100||reach<lastReach-100||Math.hypot(x-lastX,z-lastZ)>120||immediate;
      if(refresh){
        lastX=x;lastZ=z;lastReach=reach;
        const close=o=>near(o,x,z)<=reach+240;
        nearbyCells=[...cells.values()].filter(close);
        nearbyGround=groundMeshes.filter(close);
        nearbyTerrain=tiles.filter(close);
      }
      for(const c of refresh?cells.values():nearbyCells){
        const d=near(c,x,z),rank=Math.min(d,near(c,aimX,aimZ)+60);
        if((c.group||c.steps)&&(trim&&rank>=radius||d>830+extra&&near(c,aimX,aimZ)>670+extra))release(c);
        if(!c.group&&rank<radius)queue.push([rank,c,d]);
        if(!c.group&&c.sky===undefined&&rank<skyRadius)distant.push([rank,c]);
        if(c.sky!==undefined&&d>skyRadius+200){
          removeGroup(c.sky);
          c.sky=undefined;
        }
      }
      for(const g of refresh?groundMeshes:nearbyGround){
        const d=near(g,x,z);
        if(g.detail&&d>Math.max(360,radius+120)){
          scene.remove(g.detail);g.detail.geometry.dispose();g.detail=null;g.overview.visible=true;revision++;
        }
        if(!g.detail&&d<Math.max(245,radius))ground.push([d,g]);
      }
      ground.sort((a,b)=>a[0]-b[0]);
      const groundStart=performance.now();
      for(const [d,g] of ground){
        if(performance.now()-groundStart>3 && !(immediate&&d<100))break;
        g.detail=g.build();g.overview.visible=false;revision++;
      }
      queue.sort((a,b)=>a[0]-b[0]);
      const start=performance.now();
      for(const [,c,d] of queue){
        if(performance.now()-start>3.5&&!(immediate&&d<130))break;
        c.steps??=build(c);
        let step;
        do{
          step=c.steps.next();
          if(step.done)break;
        }while(immediate&&d<130||performance.now()-start<3.5);
        if(!step.done)break;
        c.steps=null;
        const group=step.value;group.name='街景 '+key(c.x,c.z);scene.add(group);c.group=group;
        if(c.sky)c.sky.visible=false;revision++;
      }
      distant.sort((a,b)=>a[0]-b[0]);
      const skyDeadline=Math.min(performance.now()+1.5,groundStart+5);
      for(const [,c] of distant){
        if(c.group)continue;
        addSky(c);
        if(performance.now()>=skyDeadline)break;
      }
      // Unlimited building detail does not need every high-resolution ground photo resident.
      const terrainExtra=Number.isFinite(radius)?extra:1500-drivingRadius;
      let nextBase=null,baseDistance=Infinity,nextTile=null,tileDistance=Infinity;
      if(photos)for(const sheet of photos.sheets)sheet.distance=Infinity;
      for(const t of refresh?tiles:nearbyTerrain){
        const d=near(t,x,z),rank=Math.min(d,near(t,aimX,aimZ)+65);
        if(t.sheet)t.sheet.distance=Math.min(t.sheet.distance,rank);
        if(d<800&&d<baseDistance&&!preparedBases.has(t.base)){nextBase=t.base;baseDistance=d;}
        t.wanted=rank<560+terrainExtra||(!trim&&t.loaded&&d<950+terrainExtra);
        if(!t.wanted&&t.loaded){t.mat.map=t.base;t.loaded.dispose();t.loaded=null;revision++;}
        if(t.ready){
          if(!t.wanted){t.ready.dispose();t.ready=null;textureJobs--;}
          else if(rank<tileDistance){nextTile=t;tileDistance=rank;}
        }else if(t.wanted&&!t.loaded&&!t.pending&&performance.now()>=t.retry)images.push([rank,t]);
      }
      // Warm the surroundings in every direction. Commit only one photo per
      // update, even if four decodes finish together while the player turns.
      const oldRevision=photos?.revision;
      const photoUploaded=photos?.update(radius);
      if(photos?.revision!==oldRevision)revision++;
      uploaded=!!(photoUploaded||nextBase||nextTile);
      if(!photoUploaded&&nextBase){prepareTexture?.(nextBase);preparedBases.add(nextBase);}
      else if(!photoUploaded&&nextTile){
        prepareTexture?.(nextTile.ready);
        nextTile.mat.map=nextTile.loaded=nextTile.ready;nextTile.ready=null;textureJobs--;revision++;
      }
      images.sort((a,b)=>a[0]-b[0]);
      for(const [,t] of images){if(textureJobs>=4)break;loadTile(t);}
      const changed=stamp!==revision;stamp=revision;
      return changed;
    }
    return {bucket,putTerrain,putGround,prepareDeparture,update,get uploaded(){return uploaded;},get stats(){return {blocks:cells.size,active:[...cells.values()].filter(c=>c.group).length,terrain:tiles.filter(t=>t.loaded).length,terrainTotal:tiles.length,revision};}};
  }
  return {create,url,loadOverviews,districtPhotos,drivingRadius,compact,removeGroup,renderRatio,setPhoneQuality,get phoneQuality(){return phoneQuality;}};
})();
