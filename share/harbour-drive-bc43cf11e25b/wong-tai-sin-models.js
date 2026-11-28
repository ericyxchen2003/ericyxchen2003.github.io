// Surveyed halls and podiums supply the outlines, local floor levels and orientation.
window.HKWongTaiSinModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry,sites=HKWongTaiSinSites;
  const kinds=new Map(Object.entries(sites.groups).flatMap(([kind,ids])=>ids.map(id=>[id,kind])));
  const main=8044714, replaces=b=>!b.foundation&&kinds.has(b.id);
  const palettes={upper:['#e7d6be','#ab7657'],lower:['#dfdfc7','#9d9475'],
    south:['#d8dcce','#78988b'],north:['#e2d2c7','#ae7e76'],tinma:['#e0d6d0','#9c7978'],
    'mall-north':['#ded2bb','#985d36'],'mall-south':['#d6c7b4','#9b6345'],station:['#cbcdbe','#8f384c']};
  function panel(m,f,u,y,w,h,d,tint){
    m?.quad(f.at(u-w/2,y-h/2,d),f.at(u+w/2,y-h/2,d),f.at(u+w/2,y+h/2,d),f.at(u-w/2,y+h/2,d),tint);
  }
  function block(m,f,u,y,d,w,h,depth,color){
    if(!m)return;
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
    const row=z=>corners.map(([a,b])=>f.at(u+a*w/2,y+b*h/2,z));
    const front=row(d+depth/2),back=row(d-depth/2);
    m.quad(...front,color);
    for(let i=0;i<4;i++){const j=(i+1)%4;m.quad(front[i],back[i],back[j],front[j],color);}
    m.quad(...back.reverse(),color);
  }
  function temple(b,m,signs,lit,height,far){
    const hall=b.id===main,base=b.basePD,top=b.top,span=top-base,eave=top-span*(hall?.46:.32);
    const ring=sites.roofs[b.id],side=faces(ring);
    const longest=side.reduce((a,f)=>a.w>f.w?a:f),width=longest.w,depth=Math.min(...side.map(f=>f.w));
    const point=(u,y,v)=>longest.at(u,y,v-depth/2);
    function roof(scale,y,rise){
      const hw=width*.5*scale,hd=depth*.5*scale;
      const ridge=Math.max(.3,hw-hd*.72),lift=Math.min(.95,rise*.27);
      // Each section sweeps from a slightly upswept eave through the concave tile
      // slope. The two hips meet the same ridge as the front and rear faces.
      const rings=[[hw,hd,y,lift],[hw*.91,hd*.80,y+.17*rise,lift*.72],
        [hw*.75+ridge*.25,hd*.45,y+.45*rise,lift*.35],[ridge,.055,y+rise,0]];
      const vertex=([u,v,h,c],i,t)=>{
        const a=[[-u,-v],[u,-v],[u,v],[-u,v]],p=a[i],q=a[(i+1)%4];
        return point(p[0]+t*(q[0]-p[0]),h+c*Math.pow(Math.abs(2*t-1),4),p[1]+t*(q[1]-p[1]));
      };
      if(!m)return;
      for(let i=0;i<4;i++){
        const steps=far?4:i%2===0?30:18;
        for(let j=0;j<steps;j++){
          const u=j/steps,v=(j+1)/steps;
          for(let k=1;k<rings.length;k++){
            const color=hall?(j%3===0?'#d99c35':'#e9b653'):(b.id===8268585?'#668d80':j%3===0?'#698b77':'#739485');
            m.quad(vertex(rings[k-1],i,u),vertex(rings[k-1],i,v),vertex(rings[k],i,v),vertex(rings[k],i,u),color);
          }
          const a=vertex(rings[0],i,u),c=vertex(rings[0],i,v);
          m.quad(a,c,[c[0],c[1]-.28,c[2]],[a[0],a[1]-.28,a[2]],'#655940');
        }
      }
      const line=y+rise;
      m.quad(point(-ridge,line,-.13),point(ridge,line,-.13),point(ridge,line+.23,.13),point(-ridge,line+.23,.13),'#d1aa5c');
    }
    for(const f of faces(b.p)){
      panel(m,f,0,(base+eave-1.4)/2,f.w,eave-base+1.4,0,'#9c4937');
      panel(m,f,0,eave-.5,f.w,.85,.1,'#46766a');
      if(f.w<2.8)continue;
      const count=Math.max(1,Math.floor(f.w/3.6)),bay=f.w/count;
      for(let i=0;i<count;i++){
        const u=(i+.5-count/2)*bay;
        panel(m,f,u,base+(eave-base)*.43,bay*.72,(eave-base)*.74,.055,'#663c30');
        panel(m,f,u-bay*.4,base+(eave-base)*.45,Math.min(.55,bay*.14),(eave-base)*.92,.14,'#b64c34');
        if(!far){panel(m,f,u,eave-1.6,bay*.67,.38,.13,'#ac9765');lit?.litPanel(f.at,u,eave-1.55,.16,bay*.52,.14,'#eec16c');}
      }
    }
    if(hall){
      roof(1.07,eave,span*.19);
      const hw=width*.385,hd=depth*.38,lo=eave+.20,hi=eave+span*.275;
      const upper=faces([[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([u,v])=>{
        const [x,,z]=point(u,0,v);return [x,z];
      }));
      for(const f of upper){
        panel(m,f,0,(lo+hi)/2,f.w,hi-lo,0,'#934a36');
        const n=Math.max(2,Math.round(f.w/3.1)),bay=f.w/n;
        for(let i=0;i<n;i++)panel(m,f,(i+.5)*bay-f.w/2,hi-.72,bay*.8,.83,.04,'#527b74');
        panel(m,f,0,hi-.18,f.w,.15,.07,'#d0a05b');
      }
      roof(.84,eave+span*.27,span*.19);
      const front=side.reduce((a,f)=>f.w>width*.93&&f.at(0,0,0)[2]>a.at(0,0,0)[2]?f:a,longest);
      const landing=base+1.05,beam=eave-.85,porch=1.65;
      block(m,front,0,base-.35,1.13,width*.97,2.8,2.35,'#b4a58a');
      for(let i=0;i<5;i++){
        const top=landing-.22*(i+1);
        block(m,front,0,top-.52,2.43+.37*i,width*.57,1.04,.39,'#bfb297');
      }
      block(m,front,0,beam,porch,width*1.02,.65,1.22,'#37776c');
      block(m,front,0,beam-.39,porch,width*1.015,.14,1.23,'#d4ab5c');
      for(let i=0;i<6;i++){
        const u=width*(i/5-.5)*.86,h=beam-landing-.27;
        block(m,front,u,landing+.21,porch,.76,.42,.76,'#b6a58c');
        block(m,front,u,landing+.42+h/2,porch,.50,h,.50,'#b53d30');
        block(m,front,u,beam-.45,porch,.98,.45,.81,'#567e72');
      }
      if(!far){
        for(let i=0;i<5;i++){
          const u=width*(i/5-.4)*.86;
          for(const off of [-.72,0,.72])panel(m,front,u+off,landing+2.5,.11,4.4,.09,'#9e764c');
          panel(m,front,u,landing+3.6,2.35,.12,.11,'#bc965b');
        }
        for(const u of [-width*.28,width*.28]){
          block(m,front,u,beam-1.35,porch,.70,.79,.70,'#c75337');
          lit?.litPanel(front.at,u,beam-1.34,porch+.36,.58,.23,'#ffc67e');
        }
      }
      if(signs)badge(front,signs,beam-.15,porch+.65,5.4,1.38,['赤松黃仙祠','WONG TAI SIN TEMPLE','#77382c']);
      const wall=faces(sites.dragonWall.slice(0,-1)),wallHeight=height(2379,-5192);
      for(const f of wall){
        panel(m,f,0,wallHeight+1.5,f.w,3,0,'#7d9a93');
        panel(m,f,0,wallHeight+3.02,f.w+.25,.32,.05,'#d1a857');
        if(f.w>7&&!far)for(let i=-4;i<=4;i++)panel(m,f,i*f.w/10,wallHeight+1.65,.88,1.14,.07,i%2?'#b5ad75':'#809ba7');
      }
    }else roof(1.05,eave,top-eave);
  }
  function terminus(b,kind,m,signs,lit,height,far){
    if(kind==='chuk-bus'){
      for(const [x,z] of sites.platforms){
        const ground=height(x,z),axis=faces([[x-3.4,z+.2],[x+3.4,z-.2],[x+3.5,z+1.65],[x-3.3,z+2.05]])[0];
        block(m,axis,0,ground+.04,0,9.8,.22,1.75,'#c4bca5');
        m?.quad(axis.at(-3.6,ground+3.25,-.95),axis.at(3.6,ground+3.25,-.95),axis.at(3.6,ground+3.4,1),axis.at(-3.6,ground+3.4,1),'#abb8ae');
        for(const u of [-2.6,2.6])panel(m,axis,u,ground+1.6,.13,3.2,-.6,'#71827d');
        if(!far){
          block(m,axis,3.95,ground+1.37,-.18,.08,2.64,.08,'#596762');
          block(m,axis,3.95,ground+2.36,-.18,.38,.60,.12,'#b84c3b');
          block(m,axis,0,ground+.6,-.45,2.8,.15,.38,'#868c80');
        }
        if(!far)lit?.litPanel(axis.at,0,ground+3.15,.15,3.8,.12,'#e4dcb6');
      }
      const f=faces(b.p).sort((a,b)=>b.w-a.w)[0];
      if(signs)badge(f,signs,b.basePD+2.4,.2,Math.min(f.w,8),1.2,['竹園邨巴士總站','CHUK YUEN BUS TERMINUS','#446d62']);
      return;
    }
    // The bus hall occupies the street level below the multistorey car park.
    const floor=b.basePD,ceiling=floor+5.3,fs=faces(b.p),front=fs[sites.fronts[b.id]]||fs[0];
    for(const f of fs){
      panel(m,f,0,(ceiling+b.top)/2,f.w,b.top-ceiling,0,'#c9c1ae');
      for(let y=ceiling+1.7;y<b.top-1;y+=3.1)panel(m,f,0,y,f.w*.94,1.35,.04,'#677773');
      if(f.w<3)continue;
      const count=Math.max(1,Math.round(f.w/6.3));
      for(let i=0;i<count;i++)panel(m,f,(i+.5-count/2)*f.w/count,floor+2.65,.62,5.3,-.1,'#bcb6a7');
      if(!far)lit?.litPanel(f.at,0,ceiling-.18,-.5,f.w*.72,.13,'#e7dfbe');
    }
    if(m){
      const ring=b.p.map(([x,z])=>new THREE.Vector2(x,z));
      for(const tri of THREE.ShapeUtils.triangulateShape(ring,[]))for(const y of [ceiling,b.top])m.tri(...tri.map(i=>[ring[i].x,y,ring[i].y]),'#b3afa2');
    }
    if(signs)badge(front,signs,ceiling+.4,.18,Math.min(front.w*.85,16),1.4,['黃大仙巴士總站','WONG TAI SIN BUS TERMINUS','#45645a']);
  }
  function draw(b,g,signs,lit,height,far){
    const k=kinds.get(b.id);
    if(k==='temple'||k==='bus'||k==='chuk-bus'){
      const m=g&&shell(b.n,g);
      if(k==='temple')temple(b,m,signs,lit,height,far);else terminus(b,k,m,signs,lit,height,far);
      m?.finish();
      if(k!=='chuk-bus')return;
    }
    const style=k.startsWith('mall-')?'mall':k==='station'?'station':k==='chuk-bus'?'mall':'estate';
    HKLokFuModels.drawBlock(b,g,signs,lit,height,far,style,sites.fronts[b.id],palettes[k]||['#ccc8b5','#668175']);
    if(k==='station'&&signs){
      const f=faces(b.p).sort((a,c)=>c.w-a.w)[0],w=Math.min(5.5,f.w*.9),h=Math.min(1,w*.22),y=b.top-.65;
      const label=HKRailMarks.header('黃大仙','Wong Tai Sin','',w,h);
      signs.quad(label,[f.at(-w/2,y-h/2,.23),f.at(w/2,y-h/2,.23),f.at(w/2,y+h/2,.23),f.at(-w/2,y+h/2,.23)]);
    }
  }
  return {replaces,building(b,props,signs,height,g){if(replaces(b))draw(b,g,signs,props,height,false);},
    lights(b,lit,height){if(replaces(b))draw(b,null,null,lit,height,false);},
    distant(b,batch,g,height){if(!replaces(b))return false;draw(b,g,null,null,height,true);return true;}};
})();
