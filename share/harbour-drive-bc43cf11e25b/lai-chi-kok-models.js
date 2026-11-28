// Keep each surveyed ward, podium or hillside lodge in its own streaming cell.
window.HKLaiChiKokModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry,{groups,garden}=HKLaiChiKokSites;
  const kind=new Map(Object.entries(groups).flatMap(([site,ids])=>ids.map(id=>[id,site])));
  const replaces=b=>!b.foundation&&kind.has(b.id);
  const names={
    pmh:['瑪嘉烈醫院','PRINCESS MARGARET HOSPITAL','#36666b'],kch:['葵涌醫院','KWAI CHUNG HOSPITAL','#677f54'],
    academy:['饒宗頤文化館','JAO TSUNG-I ACADEMY','#793c32'],centre:['荔枝角收押所','LAI CHI KOK RECEPTION CENTRE','#556053'],
    offices:['荔枝角政府合署','LAI CHI KOK GOVERNMENT OFFICES','#535d58'],
    terminus:['荔枝角（九華徑）巴士總站','LAI CHI KOK BUS TERMINUS','#354c53'],park:['荔枝角公園','LAI CHI KOK PARK','#526c4c']
  };
  const signed=new Set([7093437,7290621,6083034,6252655,7231278,7098640,7280826]);
  // The signs face the public approach. Tall hospital wings carry a second window rhythm.
  const approach={pmh:[-3750,-4960],kch:[-3875,-5185],academy:[-2876,-4567],centre:[-2624,-4645],offices:[-3213,-4881],terminus:[-3408,-5028],park:[-3350,-4732]};
  function lid(mesh,rings,roof,shade){
    const v=rings.map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),pts=v.flat();
    for(const tri of THREE.ShapeUtils.triangulateShape(v[0],v.slice(1)))mesh.tri(...tri.map(i=>[pts[i].x,roof(pts[i].x,pts[i].y),pts[i].y]),shade);
  }
  function ridge(mesh,p,y,amount,shade){
    const f=faces(p).sort((a,b)=>b.w-a.w)[0],origin=f.at(0,0,0),end=f.at(1,0,0);
    const dx=end[0]-origin[0],dz=end[2]-origin[2];
    const side=p.map(([x,z])=>-dz*x+dx*z),mid=(Math.min(...side)+Math.max(...side))/2;
    const ridgePoint=([x,z])=>{const delta=mid-(-dz*x+dx*z);return [x-dz*delta,y+amount,z+dx*delta];};
    for(let i=0;i<p.length;i++){
      const a=p[i],b=p[(i+1)%p.length];
      mesh.quad([a[0],y,a[1]],[b[0],y,b[1]],ridgePoint(b),ridgePoint(a),shade);
    }
  }
  function panel(mesh,f,u,h,w,v,depth,tone){
    if(mesh)mesh.quad(f.at(u-w/2,h-v/2,depth),f.at(u+w/2,h-v/2,depth),f.at(u+w/2,h+v/2,depth),f.at(u-w/2,h+v/2,depth),tone);
  }
  function gardenScene(mesh,fixtures,height){
    for(const feature of garden){
      const p=feature.p,base=p.reduce((v,[x,z])=>v+height(x,z),0)/p.length;
      if(feature.kind==='pond'){
        if(mesh){
          lid(mesh,[p],(x,z)=>height(x,z)+.14,'#618e86');
          for(const f of faces(p)){
            const a=f.at(-f.w/2,0,0),b=f.at(f.w/2,0,0);
            const ya=height(a[0],a[2])+.19,yb=height(b[0],b[2])+.19;
            mesh.quad(f.at(-f.w/2,ya,.02),f.at(f.w/2,yb,.02),f.at(f.w/2,yb+.07,.33),f.at(-f.w/2,ya+.07,.33),'#b8b5a0');
          }
        }
        continue;
      }
      const x=p.reduce((s,a)=>s+a[0],0)/p.length,z=p.reduce((s,a)=>s+a[1],0)/p.length;
      const boat=feature.kind==='boat',eave=base+(boat?4.0:3.45),top=eave+1.65;
      const ring=p.map(([px,pz])=>[x+(px-x)*1.10,z+(pz-z)*1.10]);
      for(const f of faces(p)){
        if(boat)panel(mesh,f,0,base+.57,f.w,1.16,0,'#d9d4be');
        if(f.w<1.4)continue;
        for(const u of [-f.w*.45,f.w*.45])panel(mesh,f,u,(base+eave)/2,.29,eave-base,.015,'#9f5747');
        panel(mesh,f,0,eave-.12,f.w,.30,.08,'#b38c71');
      }
      if(mesh){
        // Faceted tile courses rise from the curved eaves to a pitched ridge.
        const axis=faces(p).sort((a,b)=>b.w-a.w)[0];
        const o=axis.at(0,0,0),v=axis.at(1,0,0),ux=v[0]-o[0],uz=v[2]-o[2];
        const span=Math.max(...p.map(([a,b])=>Math.abs((a-x)*ux+(b-z)*uz)));
        const crown=([a,b])=>{
          const u=Math.max(-span*.46,Math.min(span*.46,((a-x)*ux+(b-z)*uz)*.63));
          return [x+ux*u,top,z+uz*u];
        };
        for(let i=0;i<ring.length;i++){
          const a=ring[i],b=ring[(i+1)%ring.length],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
          for(const [u,v,lip,tip] of [[a,mid,.21,0],[mid,b,0,.21]]){
            const low=[u[0],eave+lip,u[1]],end=[v[0],eave+tip,v[1]],ra=crown(u),rb=crown(v);
            const fold=(pt,r)=>[pt[0]*.63+r[0]*.37,eave+.35,pt[2]*.63+r[2]*.37];
            const fa=fold(low,ra),fb=fold(end,rb);
            mesh.quad(low,end,fb,fa,'#687b75');mesh.quad(fa,fb,rb,ra,'#495e58');
            mesh.quad(low,end,[end[0],end[1]-.14,end[2]],[low[0],low[1]-.14,low[2]],'#c8bba1');
          }
        }
        if(boat){
          const q=(u,v,h)=>[x+ux*u-uz*v,base+h,z+uz*u+ux*v];
          const outline=[[-span-2.3,0],[-span,-2.7],[span,-2.7],[span+2.6,-1.4],[span+3.45,0],[span+2.6,1.4],[span,2.7],[-span,2.7]];
          for(let i=0;i<outline.length;i++){
            const [u,v]=outline[i],[a,b]=outline[(i+1)%outline.length],y=.91+.10*Math.max(0,Math.abs(u)-span),h=.91+.10*Math.max(0,Math.abs(a)-span);
            mesh.quad(q(u*.92,v*.72,.04),q(a*.92,b*.72,.04),q(a,b,h),q(u,v,y),'#b5b3a2');
            mesh.tri(q(0,0,.91),q(u,v,y),q(a,b,h),'#d4cdb5');
          }
        }
      }
      const face=faces(p).sort((a,b)=>b.w-a.w)[0];
      fixtures?.litPanel(face.at,0,eave-.34,.15,Math.min(1.5,face.w*.48),.18,'#edc68a');
      if(boat)for(const f of faces(p))fixtures?.litPanel(f.at,0,eave-.10,.18,f.w*.94,.08,'#e5b99b');
    }
  }
  function model(b,mesh,fixtures,signs,height,far=false){
    const site=kind.get(b.id);
    if(site==='garden'){
      if(b.id===7172508)gardenScene(mesh,fixtures,height);
      return;
    }
    const heritage=site==='academy',terminal=site==='terminus',hospital=site==='pmh'||site==='kch';
    const base=b.basePD,h=b.top-base;
    const wall={pmh:'#e3d7c5',kch:'#e5e4d7',academy:'#b16954',centre:'#babbb0',offices:'#cacbc4',terminus:'#c1ab97',park:'#d1c6ae'}[site];
    const trim={pmh:'#b47e69',kch:'#8ca982',academy:'#eee2c5',centre:'#7d897c',offices:'#909e9c',terminus:'#a38168',park:'#7c9891'}[site];
    const fs=faces(b.p),[ax,az]=approach[site];
    const display=fs.filter(f=>f.w>5).sort((a,b)=>{
      const score=f=>{const [x,,z]=f.at(0,0,0);return Math.hypot(x-ax,z-az)-Math.min(f.w,35)*.24;};return score(a)-score(b);
    })[0];
    if(mesh){
      lid(mesh,[b.p,...(b.holes||[])],()=>b.top,heritage?'#a36a58':'#c4c6b9');
      if(heritage)ridge(mesh,b.p,b.top,Math.min(2.2,h*.22),'#99705a');
      if(terminal)lid(mesh,[b.p,...(b.holes||[])],()=>base,'#beb7a2');
    }
    for(const f of [...fs,...(b.holes||[]).flatMap(faces)]){
      panel(mesh,f,0,base+h*.5,f.w,h,0,wall);
      if(f.w<2||h<2)continue;
      const floors=Math.max(1,Math.round(h/(heritage?3.5:terminal?5.3:3.8))),pitch=h/floors;
      const bays=Math.max(1,Math.floor(f.w/(heritage?3.2:4.4))),w=f.w/bays;
      for(let j=0;j<floors;j++){
        const y=base+(j+.54)*pitch,glass=heritage?'#54675c':hospital?'#728e92':'#687c7b';
        if(!heritage)panel(mesh,f,0,y,f.w*.97,pitch*.49,.035,glass);
        if(!far)for(let i=0;i<bays;i++){
          const u=(i+.5-bays/2)*w;
          if(heritage){
            panel(mesh,f,u,y,w*.57,pitch*.58,.06,'#e0c9ad');
            panel(mesh,f,u,y,w*.45,pitch*.48,.10,glass);
          }else panel(mesh,f,u-w*.47,y,site==='kch'&&i%4===0?.7:.18,pitch*.63,.09,j%3||site!=='kch'?wall:trim);
          if((i+j*5+b.id)%7<2)fixtures?.litPanel(f.at,u,y,.13,w*(heritage?.33:.62),pitch*.34,heritage?'#f1c48b':hospital?'#cce0d4':'#e1d0a1');
        }
        panel(mesh,f,0,base+(j+.18)*pitch,f.w,.15,.14,trim);
      }
      if(terminal&&f.w>3){
        const n=Math.max(1,Math.floor(f.w/7));
        for(let k=0;k<n;k++)panel(mesh,f,(k+.5-n/2)*f.w/n,base-2.7,.75,5.4,-.15,'#b6aa97');
      }
      if(terminal&&f===display&&mesh&&!far){
        // Two parallel waiting islands and their painted platform edges sit below the podium.
        for(const offset of [-4,-10]){
          const q=(u,v,h)=>f.at(u,base-5.24+h,offset+v);
          const len=Math.min(13,f.w*.70);
          mesh.quad(q(-len/2,-.7,0),q(len/2,-.7,0),q(len/2,.7,0),q(-len/2,.7,0),'#bebcad');
          mesh.quad(q(-len/2,.57,.02),q(len/2,.57,.02),q(len/2,.7,.02),q(-len/2,.7,.02),'#e4bd61');
          panel(mesh,f,-len*.33,base-4.11,.12,2.3,offset,'#687579');
          panel(mesh,f,-len*.33,base-3.18,.62,.55,offset+.025,'#bd3c3b');
        }
      }
      if(f===display&&signed.has(b.id)){
        const y=terminal?base+.85:Math.min(b.top-.8,base+(heritage?2.7:4.9)),w=Math.min(f.w*.85,heritage?6.5:18);
        if(signs)badge(f,signs,y,.22,w,Math.min(1.3,w*.16),names[site]);
        fixtures?.litPanel(f.at,0,y-.76,.25,w*.90,.11,'#f6dea0');
      }
    }
  }
  function render(b,g,height,signs,fixtures,far=false){
    if(kind.get(b.id)==='garden'&&b.id!==7172508)return;
    const m=shell(b.n||names[kind.get(b.id)]?.[0]||'嶺南之風',g);
    model(b,m,fixtures,signs,height,far);m.finish();
  }
  return {replaces,
    building(b,props,signs,height,g){if(replaces(b))render(b,g,height,signs,props);},
    lights(b,fixtures,height){if(replaces(b))model(b,null,fixtures,null,height);},
    distant(b,batch,g,height){if(!replaces(b))return false;render(b,g,height,null,null,true);return true;}
  };
})();
