// Surveyed exhibition hall on Tonkin Street. The neighbouring protected mound
// and its weather canopy share the hall's streaming cell and local ground datum.
window.HKCheungShaWanModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  const museum=5252259,plaza=new Set([6075616,6078913]);
  const replaces=b=>!b.foundation&&(b.id===museum||plaza.has(b.id));
  function roof(mesh,b,tone){
    const rings=[b.p,...(b.holes||[])].map(r=>r.map(p=>new THREE.Vector2(...p)));
    const vertices=rings.flat();
    for(const t of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)))
      mesh.tri(...t.map(i=>[vertices[i].x,b.top,vertices[i].y]),tone);
  }
  function canopy(mesh,height){
    const x=-1030.8,z=-4655.1,y=height(x,z),c=.77,s=.638;
    const at=(u,h,v)=>[x+u*c-v*s,y+h,z+u*s+v*c];
    // A gently domed earth covering under a four-point tensioned membrane.
    const point=(r,a)=>at(7.1*r*Math.cos(a),.12+2.1*(1-r*r),6.5*r*Math.sin(a));
    for(let j=0;j<20;j++)for(let i=0;i<3;i++){
      const a=j*Math.PI/10,b=(j+1)*Math.PI/10;
      mesh.quad(point(i/3,a),point((i+1)/3,a),point((i+1)/3,b),point(i/3,b),'#788854');
    }
    // The approach stops at the viewing glass set into the front of the mound.
    const frame='#aa705c',glass='#415754';
    mesh.quad(at(-1.65,.12,7.1),at(1.65,.12,7.1),at(1.65,2.45,7.1),at(-1.65,2.45,7.1),frame);
    mesh.quad(at(-1.29,.29,7.14),at(1.29,.29,7.14),at(1.29,2.13,7.14),at(-1.29,2.13,7.14),glass);
    mesh.quad(at(-1.85,2.43,6.1),at(1.85,2.43,6.1),at(1.85,2.54,8.1),at(-1.85,2.54,8.1),frame);
    const cloth=(u,v)=>at(u*(8.8+.7*v*v),5.4+1.5*u*v+.8*u*u+.6*v*v,v*(7.5+.6*u*u));
    for(let i=0;i<8;i++)for(let j=0;j<8;j++){
      const u=i/4-1,v=j/4-1;
      mesh.quad(cloth(u,v),cloth(u+.25,v),cloth(u+.25,v+.25),cloth(u,v+.25),'#edece0');
    }
    for(const u of [-1,1])for(const v of [-1,1]){
      const [px,top,pz]=cloth(u,v),base=height(px,pz);
      for(let j=0;j<6;j++){
        const a=j*Math.PI/3,b=(j+1)*Math.PI/3,post=(angle,h)=>[px+.15*Math.cos(angle),h,pz+.15*Math.sin(angle)];
        mesh.quad(post(a,base),post(b,base),post(b,top+.2),post(a,top+.2),'#9daba4');
      }
    }
  }
  function facade(b,mesh,light,signs,height){
    const hall=b.id===museum,fs=faces(b.p),h=b.top-b.basePD;
    const main=fs.filter(f=>f.w>5).sort((a,b)=>{
      const score=f=>{const [x,,z]=f.at(0,0,0);return Math.hypot(x+1011,z+4627)-.22*f.w;};
      return score(a)-score(b);
    })[0];
    for(const f of fs){
      const panel=(u,y,w,hh,d,tone)=>mesh?.quad(f.at(u-w/2,y-hh/2,d),f.at(u+w/2,y-hh/2,d),f.at(u+w/2,y+hh/2,d),f.at(u-w/2,y+hh/2,d),tone);
      panel(0,b.basePD+h/2,f.w,h,0,hall?'#e6e1d2':'#b6a99d');
      if(hall){
        panel(0,b.basePD+.42,f.w,.84,.06,'#964c45');
        panel(0,b.top-.18,f.w,.32,.12,'#ddd6ca');
        if(f!==main){
          if(f.w>3){
            const n=Math.max(1,Math.floor(f.w/3));
            for(let i=0;i<n;i++){
              const u=(i+.5-n/2)*f.w/n;
              panel(u,b.top-.92,f.w/n*.64,.78,.07,'#56665c');
              panel(u,b.top-1.35,f.w/n*.70,.13,.1,'#bd9b7d');
            }
          }
          continue;
        }
        if(f.w<4)continue;
        const w=Math.min(5.3,f.w*.82);
        const threshold=b.basePD+.10;
        // A shallow grey relief frieze and dark red surrounds frame the glass doors.
        const wing=Math.max(.25,(f.w-w)*.42);
        for(const side of [-1,1]){
          const u=side*(w/2+wing*.56);
          panel(u,b.basePD+1.63,wing,1.89,.09,'#9c514b');
          panel(u,b.basePD+1.90,wing*.89,.86,.13,'#8b9090');
          for(let k=0;k<Math.floor(wing/.55);k++){
            const a=u-wing*.40+k*.55;
            mesh?.quad(f.at(a,b.basePD+1.67,.16),f.at(a+.13,b.basePD+1.67,.16),
              f.at(a+.42,b.basePD+2.15,.16),f.at(a+.29,b.basePD+2.15,.16),'#a7aaa6');
          }
        }
        panel(0,threshold+1.04,w,2.08,.09,'#405652');
        panel(0,threshold+.99,.10,1.98,.15,'#d0bfac');
        if(mesh&&height){
          // Lay each tile to the local slope and join the public footway with a shallow ramp.
          for(let j=0;j<6;j++)for(let i=0;i<8;i++){
            const paver=(col,row)=>{
              const d=row*.68+.03,p=f.at((col/8-.5)*(w+1.15),0,d);
              return [p[0],Math.max(height(p[0],p[2])+.055,threshold+.04-d*.085),p[2]];
            };
            mesh.quad(paver(i,j),paver(i+1,j),paver(i+1,j+1),paver(i,j+1),(i+j)%2?'#ba9d86':'#c1a78f');
          }
        }
        for(const side of [-1,1])panel(side*w*.38,threshold+1.04,.13,2.08,.12,'#775e4d');
        const y=b.top-.67;
        if(signs)badge(f,signs,y,.19,w,.64,['李鄭屋漢墓博物館','LEI CHENG UK HAN TOMB MUSEUM','#77503e']);
        light?.litPanel(f.at,0,threshold+2.09,.18,w*.85,.11,'#f6d4a3');
        for(const side of [-1,1])light?.litPanel(f.at,side*w*.46,threshold+1.64,.13,.14,.27,'#f4d3a9');
      }else{
        for(let floor=0;floor<7;floor++){
          const yy=b.basePD+(floor+.5)*h/7;
          panel(0,yy,f.w*.97,h/7*.64,.07,'#526d70');
          if(f.w<3)continue;
          const bays=Math.ceil(f.w/4),pitch=f.w/bays;
          for(let i=0;i<bays;i++){
            const u=(i+.5-bays/2)*pitch;
            panel(u-pitch*.46,yy,.14,h/7*.67,.10,'#b7c0b5');
            if((i*3+floor*2+b.id)%9<3)light?.litPanel(f.at,u,yy,.12,pitch*.73,h/7*.46,'#dacb9d');
          }
        }
      }
    }
  }
  function model(b,g,height,signs,light){
    const m=shell(b.n||b.en,g);
    roof(m,b,b.id===museum?'#b9b9ae':'#bab8a8');
    if(b.id===museum)canopy(m,height);
    facade(b,m,light,signs,height);m.finish();
  }
  return {replaces,
    building(b,props,signs,height,g){if(replaces(b))model(b,g,height,signs,props);},
    lights(b,light){if(replaces(b))facade(b,null,light,null);},
    distant(b,batch,g,height){if(!replaces(b))return false;model(b,g,height,null,null);return true;}
  };
})();
