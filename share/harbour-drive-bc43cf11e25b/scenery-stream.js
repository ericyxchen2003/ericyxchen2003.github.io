/* Navigation and collisions are resident. Visual assets follow the vehicle or inspector. */
window.HKScenery=(()=>{
  const SPAN=200, key=(x,z)=>Math.floor(x/SPAN)+','+Math.floor(z/SPAN);
  const url=file=>{
    const node=document.getElementById('asset-'+file);
    return node?'data:image/webp;base64,'+node.textContent:'scenery/'+file;
  };
  function create(scene,build,skyline){
    const cells=new Map(),tiles=[],gpu=new THREE.TextureLoader();
    let textureJobs=0,stamp=-1,revision=0;
    function bucket(x,z){
      const k=key(x,z);
      if(!cells.has(k)){
        const ix=Math.floor(x/SPAN),iz=Math.floor(z/SPAN);
        cells.set(k,{x:(ix+.5)*SPAN,z:(iz+.5)*SPAN,buildings:[],facades:[],stalls:[],entrances:[],props:[],half:SPAN/2,group:null});
      }
      return cells.get(k);
    }
    function putTerrain(mat,texture,x,z){
      tiles.push({x,z,half:160,mat,base:mat.map,texture,token:0,loaded:null,pending:false,retry:0,wanted:false});
    }
    function initialize(){
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
        tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
        tex.repeat.set(1/(u1-u0),1/(v1-v0));tex.offset.set(-u0/(u1-u0),-v0/(v1-v0));
        t.loaded=tex;t.mat.map=tex;revision++;
      },undefined,()=>{textureJobs--;t.pending=false;t.retry=performance.now()+3000;});
    }
    function release(c){
      scene.remove(c.group);
      c.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isMesh&&!o.geometry.userData.shared)o.geometry.dispose();});
      c.group=null;if(c.sky)c.sky.visible=true;revision++;
    }
    function update(x,z,dirX=0,dirZ=0,immediate=false){
      // Hysteresis keeps blocks at an intersection resident through U-turns.
      const aimX=x+dirX,aimZ=z+dirZ,near=(o,px,pz)=>Math.hypot(Math.max(0,Math.abs(px-o.x)-o.half),Math.max(0,Math.abs(pz-o.z)-o.half));
      const queue=[],images=[];
      for(const c of cells.values()){
        const d=near(c,x,z),rank=Math.min(d,near(c,aimX,aimZ)+60);
        if(c.group&&d>830&&near(c,aimX,aimZ)>670)release(c);
        if(!c.group&&rank<410)queue.push([rank,c,d]);
      }
      queue.sort((a,b)=>a[0]-b[0]);
      const start=performance.now();
      for(const [,c,d] of queue){
        if(performance.now()-start>3.5&&!(immediate&&d<130))break;
        const group=build(c);group.name='街景 '+key(c.x,c.z);scene.add(group);c.group=group;
        if(c.sky)c.sky.visible=false;revision++;
      }
      for(const t of tiles){
        const d=near(t,x,z),rank=Math.min(d,near(t,aimX,aimZ)+65);
        t.wanted=rank<560||(t.loaded&&d<950);
        if(!t.wanted&&t.loaded){t.mat.map=t.base;t.loaded.dispose();t.loaded=null;revision++;}
        if(t.wanted&&!t.loaded&&!t.pending&&performance.now()>=t.retry)images.push([rank,t]);
      }
      images.sort((a,b)=>a[0]-b[0]);
      for(const [,t] of images){if(textureJobs>=4)break;loadTile(t);}
      const changed=stamp!==revision;stamp=revision;
      return changed;
    }
    return {bucket,putTerrain,initialize,update,get stats(){return {blocks:cells.size,active:[...cells.values()].filter(c=>c.group).length,terrain:tiles.filter(t=>t.loaded).length,terrainTotal:tiles.length,revision};}};
  }
  return {create,url};
})();
