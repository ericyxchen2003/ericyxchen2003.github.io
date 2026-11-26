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
  function removeGroup(group){
    if(!group)return;
    group.removeFromParent();
    group.traverse(o=>{
      if(o.isInstancedMesh)o.dispose();
      if(o.isMesh&&!o.geometry.userData.shared)o.geometry.dispose();
    });
  }
  function create(scene,build,skyline){
    const cells=new Map(),tiles=[],groundMeshes=[],gpu=new THREE.TextureLoader();
    let textureJobs=0,stamp=-1,revision=0,previousInspectionRadius;
    function bucket(x,z){
      const k=key(x,z);
      if(!cells.has(k)){
        const ix=Math.floor(x/SPAN),iz=Math.floor(z/SPAN);
        cells.set(k,{x:(ix+.5)*SPAN,z:(iz+.5)*SPAN,buildings:[],shops:[],facades:[],stalls:[],entrances:[],props:[],half:SPAN/2,group:null});
      }
      return cells.get(k);
    }
    function putTerrain(mat,texture,x,z){
      tiles.push({x,z,half:160,mat,base:mat.map,texture,token:0,loaded:null,pending:false,retry:0,wanted:false});
    }
    function putGround(x,z,half,overview,build){
      groundMeshes.push({x,z,half,overview,build,detail:null});
    }
    function initialize(){
      if(compact)return;
      for(const c of cells.values()){
        c.sky=skyline(c.buildings);
        if(c.sky)scene.add(c.sky);
      }
    }
    function loadTile(t){
      t.pending=true;textureJobs++;const token=++t.token;
      gpu.load(url(t.texture.file),tex=>{
        textureJobs--;t.pending=false;
        if(token!==t.token||!t.wanted){tex.dispose();return;}
        const [u0,v0,u1,v1]=t.texture.uv;
        tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=compact?8:4;
        tex.repeat.set(1/(u1-u0),1/(v1-v0));tex.offset.set(-u0/(u1-u0),-v0/(v1-v0));
        t.loaded=tex;t.mat.map=tex;revision++;
      },undefined,()=>{textureJobs--;t.pending=false;t.retry=performance.now()+3000;});
    }
    function release(c){
      removeGroup(c.group);
      c.group=null;if(c.sky)c.sky.visible=true;revision++;
    }
    function update(x,z,dirX=0,dirZ=0,immediate=false,inspectionRadius){
      // Hysteresis keeps blocks at an intersection resident through U-turns.
      const radius=inspectionRadius??(compact?205:drivingRadius),extra=radius-drivingRadius;
      const trim=previousInspectionRadius!==undefined&&(inspectionRadius===undefined||radius<previousInspectionRadius);
      previousInspectionRadius=inspectionRadius;
      const aimX=x+dirX,aimZ=z+dirZ,near=(o,px,pz)=>Math.hypot(Math.max(0,Math.abs(px-o.x)-o.half),Math.max(0,Math.abs(pz-o.z)-o.half));
      const queue=[],images=[],distant=[],ground=[];
      for(const c of cells.values()){
        const d=near(c,x,z),rank=Math.min(d,near(c,aimX,aimZ)+60);
        if(c.group&&(trim&&rank>=radius||d>830+extra&&near(c,aimX,aimZ)>670+extra))release(c);
        if(!c.group&&rank<radius)queue.push([rank,c,d]);
        if(compact&&!c.group&&c.sky===undefined&&rank<Math.max(900,radius))distant.push([rank,c]);
        if(compact&&c.sky!==undefined&&d>Math.max(1100,radius+200)){
          removeGroup(c.sky);
          c.sky=undefined;
        }
      }
      for(const g of groundMeshes){
        const d=near(g,x,z);
        if(g.detail&&d>Math.max(360,radius+120)){
          scene.remove(g.detail);g.detail.geometry.dispose();g.detail=null;g.overview.visible=true;
        }
        if(!g.detail&&d<Math.max(245,radius))ground.push([d,g]);
      }
      ground.sort((a,b)=>a[0]-b[0]);
      const groundStart=performance.now();
      for(const [d,g] of ground){
        if(performance.now()-groundStart>3 && !(immediate&&d<100))break;
        g.detail=g.build();g.overview.visible=false;
      }
      queue.sort((a,b)=>a[0]-b[0]);
      const start=performance.now();
      for(const [,c,d] of queue){
        if(performance.now()-start>3.5&&!(immediate&&d<130))break;
        const group=build(c);group.name='街景 '+key(c.x,c.z);scene.add(group);c.group=group;
        if(c.sky)c.sky.visible=false;revision++;
      }
      distant.sort((a,b)=>a[0]-b[0]);
      const skyStart=performance.now();
      for(const [,c] of distant){
        if(c.group)continue;
        c.sky=skyline(c.buildings);
        if(c.sky){scene.add(c.sky);revision++;}
        if(performance.now()-skyStart>2.5)break;
      }
      // Unlimited building detail does not need every high-resolution ground photo resident.
      const terrainExtra=Number.isFinite(radius)?extra:1500-drivingRadius;
      for(const t of tiles){
        const d=near(t,x,z),rank=Math.min(d,near(t,aimX,aimZ)+65);
        t.wanted=rank<560+terrainExtra||(!trim&&t.loaded&&d<950+terrainExtra);
        if(!t.wanted&&t.loaded){t.mat.map=t.base;t.loaded.dispose();t.loaded=null;revision++;}
        if(t.wanted&&!t.loaded&&!t.pending&&performance.now()>=t.retry)images.push([rank,t]);
      }
      images.sort((a,b)=>a[0]-b[0]);
      for(const [,t] of images){if(textureJobs>=4)break;loadTile(t);}
      const changed=stamp!==revision;stamp=revision;
      return changed;
    }
    return {bucket,putTerrain,putGround,initialize,update,get stats(){return {blocks:cells.size,active:[...cells.values()].filter(c=>c.group).length,terrain:tiles.filter(t=>t.loaded).length,terrainTotal:tiles.length,revision};}};
  }
  return {create,url,drivingRadius,compact,removeGroup,renderRatio,setPhoneQuality,get phoneQuality(){return phoneQuality;}};
})();
