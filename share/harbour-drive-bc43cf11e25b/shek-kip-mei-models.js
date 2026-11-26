// The original factory wings leave a real open court. Each residential wing
// keeps its own surveyed footprint, street datum and roof height.
window.HKShekKipMeiModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  const types=new Map([[2074743,'studio'],[2268752,'studio'],[2137361,'inno'],
    ...[2075914,2076415,2076500,2078911].map(id=>[id,'sports'])]);
  for(const b of HKMAP.buildings)if(/^Parc Oasis Tower /i.test(b.en))types.set(b.id,'oasis');
  const replaces=b=>types.has(b.id)&&!b.foundation;
  function render(b,m,light,signs,detail){
    const type=types.get(b.id),base=b.basePD,top=b.top,h=top-base,fs=faces(b.p);
    const panel=(f,u,y,w,hh,out,col)=>m?.quad(f.at(u-w/2,y-hh/2,out),f.at(u+w/2,y-hh/2,out),f.at(u+w/2,y+hh/2,out),f.at(u-w/2,y+hh/2,out),col);
    const glow=(f,u,y,w,hh,out,col)=>light?.litPanel(f.at,u,y,out,w,hh,col);
    if(m){
      const rings=[b.p,...(b.holes||[])].map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),v=rings.flat();
      for(const t of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)))m.tri(...t.map(i=>[v[i].x,top,v[i].y]),type==='sports'?'#b5beb5':'#b8b5a9');
    }
    const frontAt=type==='studio'?[-455,-4320]:type==='inno'?[581,-4325]:type==='sports'?[-93,-4562]:[430,-4257];
    const preference=f=>{const [x,,z]=f.at(0,0,0),[a,,c]=f.at(0,0,1),dx=frontAt[0]-x,dz=frontAt[1]-z,n=Math.hypot(dx,dz)||1;
      return n-14*(dx*(a-x)+dz*(c-z))/n+Math.max(0,9-f.w)*3;};
    const main=fs.reduce((a,b)=>preference(a)<preference(b)?a:b);
    for(const f of fs){
      const studio=type==='studio',office=type==='inno',estate=type==='oasis';
      const wall=studio?'#e2e1d6':office?'#aab8ba':estate?['#ba9987','#c4a694','#bb9a89'][b.id%3]:'#bdc7bd';
      panel(f,0,base+h/2,f.w,h,0,wall);
      if(f.w<1.6)continue;
      const rows=studio?9:office?7:estate?Math.max(6,Math.round(h/3.05)):3;
      const rise=h/rows,bays=Math.max(1,Math.round(f.w/(studio?3.5:office?3.1:3.8))),pitch=f.w/bays;
      for(let i=0;i<rows;i++){
        const y=base+(i+.55)*rise;
        if(studio||office||type==='sports')panel(f,0,y,f.w-.22,rise*(office?.80:.56),.035,studio?'#647771':office?'#507786':'#618186');
        if(studio){
          panel(f,0,y-rise*.37,f.w,.40,.18,'#96ad92');
          panel(f,0,y-rise*.30,f.w,.13,.20,'#e2e4d9');
        }else if(office){
          panel(f,0,y-rise*.35,f.w,.21,.10,'#acb7b5');
        }
        for(let j=0;j<bays;j++){
          const u=(j+.5-bays/2)*pitch;
          if(estate){
            panel(f,u,y,pitch*.72,rise*.55,.07,'#566c6c');
            if(detail){
              panel(f,u,y,pitch*.055,rise*.55,.10,'#ddd4bf');
              panel(f,u,y-rise*.30,pitch*.83,.18,.14,'#ddc6ad');
              if(i%2===0&&j%2===0)panel(f,u+pitch*.31,y-.58,.58,.31,.22,'#c3beb2');
            }
          }else if(detail){
            panel(f,u-pitch*.48,y,studio?.18:.12,rise*(office?.85:.67),.11,studio?'#d7dccd':'#a3b2b5');
          }
          if((j*7+i*5+b.id)%11<4)glow(f,u+.08,y+.11,pitch*.53,Math.min(1.2,rise*.4),.135,office?'#cfe3dc':studio?'#e4d7a7':'#edc698');
        }
      }
      if(estate||studio)panel(f,0,top-.18,f.w,.32,.12,studio?'#789981':'#d1b59d');
    }
    if(type==='studio'&&b.id===2268752){
      const w=Math.min(main.w*.80,8),rise=h/9;
      // Green switchback stairs and white handrails on the Pak Tin Street elevation.
      for(let i=0;i<8;i++){
        const sign=i%2?-1:1,y=base+rise*(i+.5),a=-sign*w/2,c=sign*w/2;
        for(const [offset,thick,tone] of [[0,.50,'#568769'],[.91,.10,'#e3e3d5']])
          m?.quad(main.at(a,y+offset, .26),main.at(c,y+rise+offset,.26),main.at(c,y+rise+offset+thick,.26),main.at(a,y+offset+thick,.26),tone);
        panel(main,c,y+rise,.85,.22,.28,'#608b6c');
      }
    }
    const number=type==='oasis'?Number(b.en.match(/\d+/)?.[0]):0;
    const label=type==='inno'?['創新中心','InnoCentre','#924c44']:type==='studio'&&b.id===2268752?['賽馬會創意藝術中心','JCCAC','#486b57']:
      type==='sports'&&b.id===2076500?['石硤尾公園體育館','SHEK KIP MEI PARK SPORTS CENTRE','#44685f']:number===1?['又一居','PARC OASIS','#48443d']:null;
    if(label){
      const width=Math.min(main.w*.94,type==='inno'?16:12),y=base+(type==='inno'?8.4:3.55);
      panel(main,0,y,width,1.55,.30,label[2]);
      if(signs)badge(main,signs,y,.32,width,1.55,label);
      glow(main,0,y-.87,width*.87,.10,.34,'#ffdda6');
    }
  }
  function model(b,g,signs,near){const m=shell(b.n||b.en,g);render(b,m,null,signs,near);m.finish();}
  return {replaces,
    building(b,props,signs,height,g){if(replaces(b)){model(b,g,signs,true);render(b,null,props,null,false);}},
    lights(b,lit){if(replaces(b))render(b,null,lit,null,false);},
    distant(b,batch,g){if(!replaces(b))return false;model(b,g,null,false);return true;}
  };
})();
