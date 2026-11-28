// The survey supplies each block's footprint and roof datum, including the two mall wings.
window.HKLokFuModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  const kinds=new Map(Object.entries(HKLokFuSites.groups).flatMap(([k,ids])=>ids.map(id=>[id,k])));
  const replaces=b=>!b.foundation&&kinds.has(b.id);
  const colors={
    estate:['#ded6be','#ac805c'],wang:['#e4d6bd','#ad7a72'],ka:['#d9ddd2','#83a09a'],fu:['#e7d9c8','#ab8677'],
    tak:['#e6d3c6','#af8d85'],hong:['#d9dad2','#89a29a'],hospital:['#ece2d1','#b99a78'],mall:['#dbc7aa','#a65c42'],
    station:['#d6cfc3','#95354a'],sports:['#dacbbc','#998674'],pool:['#e1d9c5','#6c989c']
  };
  function model(b,group,signs,lights,height,far,kind=kinds.get(b.id),frontIndex=HKLokFuSites.fronts[b.id],palette=colors[kind]){
    const [wall,accent]=palette,floor=b.basePD,top=b.top,h=top-floor;
    const homes=['wang','estate','ka','fu','tak','hong'].includes(kind),retail=kind==='mall',hospital=kind==='hospital';
    const mesh=group&&shell(b.n,group);
    const rings=[b.p,...(b.holes||[])],outer=faces(b.p);
    const frontage=outer[frontIndex]||outer.reduce((a,f)=>a.w>f.w?a:f);
    if(mesh){
      const shapes=rings.map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),vertices=shapes.flat();
      for(const tri of THREE.ShapeUtils.triangulateShape(shapes[0],shapes.slice(1))){
        mesh.tri(...tri.map(i=>[vertices[i].x,top,vertices[i].y]),'#c9c7b8');
      }
    }
    function panel(f,u,y,w,v,d,c){
      mesh?.quad(f.at(u-w/2,y-v/2,d),f.at(u+w/2,y-v/2,d),f.at(u+w/2,y+v/2,d),f.at(u-w/2,y+v/2,d),c);
    }
    for(const f of [...outer,...rings.slice(1).flatMap(faces)]){
      if(mesh){
        const a=f.at(-f.w/2,floor,0),c=f.at(f.w/2,floor,0);
        if(!b.base){a[1]=Math.min(floor,height(a[0],a[2])-.4);c[1]=Math.min(floor,height(c[0],c[2])-.4);}
        mesh.quad(a,c,f.at(f.w/2,top,0),f.at(-f.w/2,top,0),wall);
      }
      if(f.w<2.3||h<3)continue;
      const levels=Math.max(1,Math.round(h/(homes?3.05:retail?5.3:3.95))),pitch=h/levels;
      const bays=Math.max(1,Math.round(f.w/(retail?4.3:3.1))),w=f.w/bays;
      if(far){
        panel(f,0,floor+h*.52,f.w*.82,h*.84,.035,homes?'#a5ac9f':'#859b99');
      }else{
        for(let j=0;j<levels;j++){
          const y=floor+(j+.54)*pitch;
          panel(f,0,y,f.w*.89,pitch*(retail?.68:.48),.055,retail?'#597c83':hospital?'#809a99':'#7e8b87');
          if(hospital)panel(f,0,y+pitch*.27,f.w*.93,.19,.16,'#f1e8d5');
          if(lights&&f.w>4)for(let i=(b.id+j*3)%5;i<bays;i+=5){
            lights.litPanel(f.at,(i+.5-bays/2)*w,y,.10,w*.55,pitch*.37,hospital?'#d6e3d3':'#edcea0');
          }
        }
        for(let j=1;j<bays;j++)panel(f,(j-bays/2)*w,floor+h/2,retail?.27:.36,h,.09,wall);
      }
      if(homes&&f.w>=6)panel(f,-f.w*.38,floor+h/2,Math.min(1.5,f.w*.13),h,.12,accent);
      if(retail||hospital)panel(f,0,top-1.1,f.w,retail?1.4:.7,.14,accent);
      if(f===frontage&&!far&&f.w>6){
        const y=retail?top-2.8:homes?Math.min(top-1,floor+8):floor+Math.min(h-1,4.5);
        const w=Math.min(f.w*.85,homes?8:15);
        if((retail||hospital)&&f.w>14&&h>8){
          const street=f.at(0,0,.6),entry=Math.max(floor,height(street[0],street[2]));
          if(entry+4.8<top){
            const width=Math.min(f.w*.62,retail?19:11),capacity=retail?6:4;
            panel(f,0,entry+1.8,width,3.5,.15,'#375958');
            for(let i=1;i<capacity;i++)panel(f,width*(i/capacity-.5),entry+1.8,.17,3.5,.20,'#cdd5cd');
            mesh?.quad(f.at(-width/2,entry+3.7,.18),f.at(width/2,entry+3.7,.18),
              f.at(width/2,entry+3.7,.88),f.at(-width/2,entry+3.7,.88),'#d8d2bc');
            lights?.litPanel(f.at,0,entry+3.6,.85,width,.12,'#f3deb1');
          }
        }
        if(signs)badge(f,signs,y,.18,w,Math.min(1.65,w*.2),[b.n,b.en,kind==='station'?'#98394b':accent]);
        lights?.litPanel(f.at,0,y-.9,.20,w*.74,.1,'#f3d598');
      }
    }
    mesh?.finish();
  }
  return {drawBlock:model,replaces,building(b,props,signs,height,group){if(replaces(b))model(b,group,signs,props,height,false);},
    lights(b,lights,height){if(replaces(b))model(b,null,null,lights,height,false);},
    distant(b,batch,group,height){if(!replaces(b))return false;model(b,group,null,null,height,true);return true;}};
})();
