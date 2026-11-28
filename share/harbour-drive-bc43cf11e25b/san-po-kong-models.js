// Use the original stepped volumes so the towers meet their own podiums at the survey datum.
window.HKSanPoKongModels=(()=>{
  const sites=HKSanPoKongSites,{faces,shell,badge}=HKCoastModels.geometry;
  const kinds=new Map(Object.entries(sites.groups).flatMap(([kind,ids])=>ids.map(id=>[id,kind])));
  const conventional={
    rhythm:['estate','#dad9c9','#849b86'],latitude:['estate','#d0d0cb','#778b9a'],
    king:['estate','#dfddcb','#a49677'],yue:['mall','#d2c3b1','#a05c51'],
    'rhythm-mall':['mall','#dad5bc','#72938d'],sports:['sports','#dbceb6','#8a7160'],
    market:['mall','#c1b9a4','#807960'],badminton:['sports','#dfd5be','#69878b']
  };
  const replaces=b=>!b.foundation&&kinds.has(b.id);
  function draw(b,group,signs,lights,height,far){
    const kind=kinds.get(b.id),front=sites.fronts[b.id],preset=conventional[kind];
    if(preset){
      HKLokFuModels.drawBlock(b,group,signs,lights,height,far,preset[0],front,preset.slice(1));
      return;
    }
    const mall=kind==='mikiki',office=kind==='aia',factory=!mall&&!office;
    const floor=b.basePD,top=b.top,h=top-floor,outer=faces(b.p);
    const entrance=outer[front]||outer.reduce((a,c)=>a.w>c.w?a:c);
    const wall=office?'#577f89':mall?'#c2c4b8':['#c3bfae','#c4b19f','#b3c1b8','#c9c6b5'][b.id%4];
    const trim=office?'#c4ced0':mall?'#a87861':'#94948a';
    const mesh=group&&shell(b.n,group);
    if(mesh){
      const rings=[b.p,...b.holes||[]].map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),points=rings.flat();
      for(const tri of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)))
        mesh.tri(...tri.map(i=>[points[i].x,top,points[i].y]),'#b5b5a9');
    }
    for(const f of [...outer,...(b.holes||[]).flatMap(faces)]){
      const panel=(u,y,w,v,depth,c)=>mesh?.quad(f.at(u-w/2,y-v/2,depth),f.at(u+w/2,y-v/2,depth),
        f.at(u+w/2,y+v/2,depth),f.at(u-w/2,y+v/2,depth),c);
      if(mesh){
        const a=f.at(-f.w/2,floor,0),c=f.at(f.w/2,floor,0);
        if(!b.base){a[1]=Math.min(floor,height(a[0],a[2])-.25);c[1]=Math.min(floor,height(c[0],c[2])-.25);}
        mesh.quad(a,c,f.at(f.w/2,top,0),f.at(-f.w/2,top,0),wall);
      }
      if(f.w<2||h<3)continue;
      if(far){
        panel(0,floor+h*.51,f.w*.93,h*.83,.035,office?'#688995':mall?'#8faca8':'#929c97');
        continue;
      }
      const levels=Math.max(1,Math.round(h/(mall?5.2:4))),pitch=h/levels;
      const bayCount=Math.max(1,Math.round(f.w/(factory?4.1:3.8))),bay=f.w/bayCount;
      for(let j=0;j<levels;j++){
        const y=floor+(j+.55)*pitch;
        panel(0,y,f.w*.95,pitch*(office?.89:mall?.71:.48),.045,office?'#577783':mall?'#51757a':'#718984');
        if(factory&&j%3===2)panel(0,y-pitch*.28,f.w*.97,.22,.23,'#a9aca4');
        if(lights&&f.w>5&&(j+b.id)%(factory?3:2)===0){
          const u=(((j+b.id)%bayCount)+.5-bayCount/2)*bay;
          lights.litPanel(f.at,u,y,.09,bay*.62,pitch*.4,office?'#c7dfdb':'#edd8b6');
        }
      }
      for(let i=1;i<bayCount;i++){
        const u=(i-bayCount/2)*bay;
        panel(u,floor+h/2,mall?.44:office?.23:.32,h,.13,trim);
      }
      if(f!==entrance||f.w<5)continue;
      const street=f.at(0,0,.7),base=Math.max(floor,height(street[0],street[2]));
      if(base+4<top){
        const w=Math.min(f.w*.76,mall?23:office?10:8);
        panel(0,base+1.8,w,3.5,.16,factory?'#697570':'#32565b');
        if(factory)for(let slat=1;slat<9;slat++)panel(0,base+slat*.38,w,.075,.18,'#9ca09a');
        else for(let i=1;i<5;i++)panel((i/5-.5)*w,base+1.8,.12,3.5,.19,'#b8c6c3');
        mesh?.quad(f.at(-w/2,base+3.7,.1),f.at(w/2,base+3.7,.1),f.at(w/2,base+3.7,1),f.at(-w/2,base+3.7,1),'#aeb6b0');
        lights?.litPanel(f.at,0,base+3.58,.9,w*.86,.12,'#ffe5b2');
      }
      const y=office&&h>35?top-4:Math.min(top-1.1,base+(mall?7.2:5)),w=Math.min(f.w*.88,mall?14:office?12:11);
      if(signs)badge(f,signs,y,.28,w,Math.min(2.2,w*.21),mall?['Mikiki','譽・港灣','#6e365f']:office?['AIA','友邦九龍金融中心','#a62e44']:[b.n,b.en,'#385b61']);
      if(!factory)lights?.litPanel(f.at,0,y-1.2,.30,w*.85,.13,'#efe9cf');
    }
    mesh?.finish();
  }
  return {replaces,building(b,props,signs,height,g){if(replaces(b))draw(b,g,signs,props,height,false);},
    lights(b,lights,height){if(replaces(b))draw(b,null,null,lights,height,false);},
    distant(b,batch,g,height){if(!replaces(b))return false;draw(b,g,null,null,height,true);return true;}};
})();
