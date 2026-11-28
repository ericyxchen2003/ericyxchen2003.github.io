// Surveyed building parts keep their actual footprint, holes and podium heights.
window.HKNgauChiWanModels=(()=>{
  const sites=HKNgauChiWanSites,{faces,shell,badge}=HKCoastModels.geometry;
  const kinds=new Map(Object.entries(sites.groups).flatMap(([kind,ids])=>ids.map(id=>[id,kind])));
  const colors={hung:['#e6dcbe','#baac88'],wan:['#dedbd1','#789d9a'],shek:['#dedbc8','#879b9d'],
    civic:['#bc8775','#794945'],market:['#e4dbca','#8b5f53'],station:['#d7cfc1','#963a4a'],
    home:['#eee1ca','#ae775a'],court:['#dedaca','#9b9a87']};
  const rainbow=['#c9a4b8','#a8bbc9','#9dbdb8','#b6c799','#dfce91','#e5bc94','#d8a398'];
  const stone={黃:'#d5ba65',金:'#bd9a63',紅:'#af7266',翠:'#83a68a',藍:'#7699b3',玉:'#9eb5a5'};
  function panel(m,f,u,y,w,h,d,color){
    m.quad(f.at(u-w/2,y,d),f.at(u+w/2,y,d),f.at(u+w/2,y+h,d),f.at(u-w/2,y+h,d),color);
  }
  function roofCourts(mesh,y,far){
    for(const [a,b,,d] of sites.courts){
      const len=Math.hypot(b[0]-a[0],b[1]-a[1]),w=Math.hypot(d[0]-a[0],d[1]-a[1]);
      const at=(x,z,h=0)=>[a[0]+(b[0]-a[0])*x/len+(d[0]-a[0])*z/w,y+h,a[1]+(b[1]-a[1])*x/len+(d[1]-a[1])*z/w];
      const rect=(x,z,l,v,h,c)=>mesh.quad(at(x,z,h),at(x+l,z,h),at(x+l,z+v,h),at(x,z+v,h),c);
      rect(0,0,len,w,.05,'#86aba6');
      for(const x of [0,len-4.3])rect(x,(w-4.8)/2,4.3,4.8,.07,'#d7ae83');
      const line='#f5edda';
      for(const x of [.18,len/2,len-.29])rect(x,.18,.11,w-.36,.09,line);
      for(const z of [.18,w-.29])rect(.18,z,len-.36,.11,.09,line);
      if(far)continue;
      for(let n=0;n<24;n++){
        const t=n*Math.PI/12,s=(n+1)*Math.PI/12;
        const arc=(angle,r)=>at(len/2+Math.cos(angle)*r,w/2+Math.sin(angle)*r,.10);
        mesh.quad(arc(t,1.63),arc(s,1.63),arc(s,1.73),arc(t,1.73),line);
      }
      for(const x of [1,len-1]){
        const board=(z,h)=>at(x,z+w/2,h);
        mesh.quad(board(-.075,0),board(.075,0),board(.075,3.4),board(-.075,3.4),'#677d7c');
        mesh.quad(board(-.87,2.95),board(.87,2.95),board(.87,4),board(-.87,4),'#f1ede1');
        const dir=x===1?1:-1;
        for(let i=0;i<12;i++){
          const rim=(j,r)=>at(x+dir*.38+r*Math.cos(j*Math.PI/6),w/2+r*Math.sin(j*Math.PI/6),3.05);
          mesh.quad(rim(i,.20),rim(i+1,.20),rim(i+1,.26),rim(i,.26),'#bf6547');
        }
      }
    }
  }
  function gateway(mesh,signs,lights,height,far){
    const x=3914,z=-4355,base=height(x,z),angle=.19,c=Math.cos(angle),s=Math.sin(angle);
    const f={at:(u,y,d)=>[x+c*u-s*d,y,z+s*u+c*d]};
    const beam=(u,y,w,h,depth,col)=>{
      if(!mesh)return;
      const pts=[[-w/2,-depth/2],[w/2,-depth/2],[w/2,depth/2],[-w/2,depth/2]];
      const at=(i,dy)=>f.at(u+pts[i][0],base+y+dy,pts[i][1]);
      for(let i=0;i<4;i++)mesh.quad(at(i,0),at((i+1)%4,0),at((i+1)%4,h),at(i,h),col);
      mesh.quad(at(0,h),at(1,h),at(2,h),at(3,h),col);
    };
    for(const u of [-2.15,2.15]){beam(u,-.2,.86,.93,.86,'#a5a596');beam(u,.73,.52,3.62,.52,'#d6d1ba');}
    beam(0,3.6,5,.87,.52,'#d3c5a1');beam(0,4.42,5.8,.22,1.4,'#667b73');
    if(mesh)for(const d of [-1,1])mesh.quad(f.at(-2.9,base+4.61,d*.7),f.at(2.9,base+4.61,d*.7),f.at(2.52,base+5.07,0),f.at(-2.52,base+5.07,0),'#577168');
    if(!far&&signs){
      badge(f,signs,base+4.02,.28,3.6,.73,['牛池灣鄉','NGAU CHI WAN','#74534a']);
      badge({at:(u,y,d)=>f.at(-u,y,-d)},signs,base+4.02,.28,3.6,.73,['牛池灣鄉','NGAU CHI WAN','#74534a']);
    }
    lights?.litPanel(f.at,0,base+3.67,.31,2.8,.09,'#f2d9a8');
  }
  function draw(b,g,signs,lights,height,far){
    const k=kinds.get(b.id),kind=k==='civic'||k==='market'?'mall':k==='home'?'hospital':k==='station'?'station':k==='court'?'sports':'estate';
    const palette=k==='shek'?[colors.shek[0],stone[b.n[0]]||colors.shek[1]]:colors[k];
    HKLokFuModels.drawBlock(b,g,signs,lights,height,far,kind,sites.fronts[b.id],palette);
    if(!['market','court','hung','shek','home'].includes(k))return;
    const mesh=g&&shell(b.n,g),h=b.top-b.basePD;
    if(k==='market')gateway(mesh,signs,lights,height,far);
    if(!mesh)return;
    if(k==='court')roofCourts(mesh,b.top,far);
    for(const f of faces(b.p)){
      if(f.w<5)continue;
      if(k==='hung'){
        const levels=Math.max(1,Math.round(h/3.05)),pitch=h/levels;
        for(let j=0;j<levels;j++)panel(mesh,f,0,b.basePD+j*pitch,f.w,pitch*(far?.46:.30),.14,rainbow[Math.min(6,Math.floor(j*7/levels))]);
      }else if(k==='shek'&&f.w>10){
        for(const t of [-.43,.43])panel(mesh,f,t*f.w,b.basePD,1.05,h,.16,palette[1]);
      }else if(k==='home'&&f.w>9){
        // Shaded arched verandas and a tiled eave on the retained low-rise building.
        const bays=Math.max(2,Math.round(f.w/3.8)),w=f.w/bays;
        for(let j=0;j<bays;j++){
          const u=(j+.5-bays/2)*w,r=Math.min(1.38,w*.34),y=b.basePD+2.6;
          panel(mesh,f,u,y-1.65,2*r,1.65,.19,'#696e62');
          for(let i=0;i<8;i++){
            const arch=t=>f.at(u+r*Math.cos(t*Math.PI/8),y+r*Math.sin(t*Math.PI/8),.19);
            mesh.tri(f.at(u,y,.19),arch(i),arch(i+1),'#696e62');
          }
        }
        mesh.quad(f.at(-f.w/2,b.top-.35,.54),f.at(f.w/2,b.top-.35,.54),f.at(f.w/2,b.top+.36,-.72),f.at(-f.w/2,b.top+.36,-.72),'#af785e');
      }
    }
    mesh.finish();
  }
  const replaces=b=>!b.foundation&&kinds.has(b.id);
  return {replaces,building(b,p,signs,height,g){if(replaces(b))draw(b,g,signs,p,height,false);},
    lights(b,p,height){if(replaces(b))draw(b,null,null,p,height,false);},
    distant(b,batch,g,height){if(!replaces(b))return false;draw(b,g,null,null,height,true);return true;}};
})();
