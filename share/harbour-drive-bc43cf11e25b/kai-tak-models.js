// Detailed landmarks share the measured outlines and heights with the driving map.
window.HKKaiTakModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  const stadium=318813,arena=318794,tax=3312496,trade=3341618,terminal=3262795;
  const air=new Set([3335073,3335074,3335075]);
  const names=new Map([[tax,['稅務中心','INLAND REVENUE CENTRE','#315966']],
    [trade,['工業貿易大樓','TRADE AND INDUSTRY TOWER','#795a43']],
    [3335073,['AIRSIDE','KAI TAK','#47635b']],[stadium,['啟德主場館','KAI TAK STADIUM','#574478']],
    [arena,['啟德體藝館','KAI TAK ARENA','#545c72']],[terminal,['啟德郵輪碼頭','KAI TAK CRUISE TERMINAL','#365762']]]);
  const replaces=b=>!b.foundation&&(air.has(b.id)||names.has(b.id));
  function cap(m,p,holes,y,col){
    const rings=[p,...holes].map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),v=rings.flat();
    for(const t of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)))m.tri(...t.map(i=>[v[i].x,y,v[i].y]),col);
  }
  function panel(m,f,u,y,w,h,d,col){m.quad(f.at(u-w/2,y-h/2,d),f.at(u+w/2,y-h/2,d),f.at(u+w/2,y+h/2,d),f.at(u-w/2,y+h/2,d),col);}
  function offices(b,m,lit,signs,detail){
    const isAir=air.has(b.id),isTrade=b.id===trade,hall=b.id===terminal,isArena=b.id===arena;
    const base=b.basePD,top=b.top,h=top-base,fs=faces(b.p);
    for(const f of fs){
      if(m)panel(m,f,0,(base+top)/2,f.w,h,0,isTrade?'#a79076':hall?'#77908c':isArena?'#647786':isAir?'#789695':'#77919d');
      const modules=Math.max(1,Math.ceil(f.w/(hall?10:4.7))),pitch=f.w/modules;
      const floorHeight=hall?5.3:isArena?4:4.1;
      for(let y=base+floorHeight*.6,i=0;y<top-.7;y+=floorHeight,i++){
        if(m&&(isTrade||b.id===tax||isAir)){
          const glazing=isTrade?'#667e7b':isAir?'#66898a':i%2?'#63828e':'#708c97';
          panel(m,f,0,y,f.w,Math.min(2.8,top-y),.045,glazing);
          if(isTrade&&f.w>13){
            // The planted terraces step across the sun screens floor by floor.
            const span=Math.min(9,f.w*.24),u=(.5-Math.min(1,(y-base)/h))*(f.w-span)*.76;
            panel(m,f,u,y-.28,span,2.9,.23,'#465c53');
            panel(m,f,u,y-.76,span,1.16,.36,i%3?'#638262':'#76916a');
            m.quad(f.at(u-span/2,y-1.39,.18),f.at(u+span/2,y-1.39,.18),f.at(u+span/2,y-1.39,.95),f.at(u-span/2,y-1.39,.95),'#c3b6a3');
          }
        }
        if(m&&(detail||i%2===0))panel(m,f,0,y-.95,f.w,.38,.08,isTrade?'#be9573':isAir?'#bacac4':'#c4cfd0');
        if(lit&&f.w>2&&i%2===(hall?1:0))for(let j=0;j<modules;j++){
          if((i*3+j*7+b.id)%11<4)lit.litPanel(f.at,(j+.5-modules/2)*pitch,y,.18,pitch*.75,Math.min(1.6,h*.16),isTrade?'#f1cb94':hall?'#bdddd2':'#cce1d8');
        }
      }
      if(m&&b.id===tax&&base<8&&f.w>8){
        panel(m,f,0,base+3.0,f.w,6,.16,'#a5adb0');
        panel(m,f,0,base+2.55,f.w*.67,4.9,.19,'#526e77');
      }
      if(m&&detail&&f.w>3){
        for(let j=0;j<modules;j++){
          const u=(j+.5-modules/2)*pitch;
          panel(m,f,u,(base+top)/2,isTrade?.72:isAir?.29:.41,h,.13,isTrade?'#ae7655':isAir?'#dae2d7':'#c1cdd0');
          if(isAir){ // Paired highlights give the glass fins their folded profile.
            const a=f.at(u-.25,base,.15),c=f.at(u,base,.37);
            m.quad(a,c,f.at(u,top,.37),f.at(u-.25,top,.15),'#d1ddd6');
          }
          if(isArena&&j%2===0){
            const a=f.at(u-pitch*.43,base+.6,.18),c=f.at(u+pitch*.43,top-.3,.18);
            m.tri(a,c,f.at(u-pitch*.43,top-.3,.18),'#8295a0');
          }
        }
      }
      if(isTrade||isAir&&b.id!==3335074||hall){
        if(m)panel(m,f,0,top-.53,f.w,1.06,.06,'#73886c');
        if(lit&&f.w>5)lit.litPanel(f.at,0,top-.9,.12,f.w*.96,.15,isTrade?'#e9c297':'#b6dbcb');
      }
    }
    if(m){
      cap(m,b.p,b.holes||[],top,isAir&&b.id!==3335074||isTrade||hall?'#889a7d':'#bfcbc8');
      if(hall&&base>12)cap(m,b.p,b.holes||[],base,'#c4c9bd');
      for(const hole of b.holes||[])for(const f of faces(hole))panel(m,f,0,(base+top)/2,f.w,h,0,'#82928e');
      if(signs&&names.has(b.id)&&(!hall||base>12)){
        const f=fs.reduce((a,c)=>a.w>c.w?a:c),w=Math.min(f.w*.79,hall?31:22);
        badge(f,signs,base+Math.min(7,h*.59),.23,w,Math.min(2.4,w*.17),names.get(b.id));
      }
    }
  }
  // The arena bowl sits above the concourse on the original station-area sheet.
  function bowl(b,m,lit,signs,detail){
    const cx=2820.1,cz=-2902.15,rx=114.25,rz=139.55,angle=.017,n=64;
    const rr=(a,r,y)=>{
      const co=Math.cos(a),si=Math.sin(a);
      const x=rx*r*Math.sign(co)*Math.pow(Math.abs(co),.86),z=rz*r*Math.sign(si)*Math.pow(Math.abs(si),.86);
      return [cx+x*Math.cos(angle)-z*Math.sin(angle),y,cz+x*Math.sin(angle)+z*Math.cos(angle)];
    };
    const bands=[[.82,b.basePD],[.91,23],[1,39],[.99,47],[.94,53.5],[.76,b.top],[.54,58]];
    const palette=['#727aaa','#768da7','#697ba5','#9c89b2','#798fa3','#7f7caa','#9c93ad','#709399'];
    for(let i=0;i<n;i++){
      const a=i*2*Math.PI/n,c=(i+1)*2*Math.PI/n;
      if(m)for(let j=1;j<bands.length;j++){
        const [r,y]=bands[j-1],[s,h]=bands[j],A=rr(a,r,y),B=rr(c,r,y),C=rr(c,s,h),D=rr(a,s,h);
        if(j>4)m.quad(A,B,C,D,j===5?'#c2c4cb':'#d4d5d6');
        else{m.tri(A,B,C,palette[(i+j*3)%8]);m.tri(A,C,D,palette[(i*3+j+2)%8]);}
      }
      if(m){
        const edge=rr(a,.51,40),next=rr(c,.51,40);
        m.quad(rr(a,.54,58),rr(c,.54,58),next,edge,'#66737b');
        for(let j=0;j<4;j++)m.quad(rr(a,.51-j*.03,40-j*3),rr(c,.51-j*.03,40-j*3),rr(c,.48-j*.03,37-j*3),rr(a,.48-j*.03,37-j*3),j%2?'#926d88':'#6c8394');
        if(detail&&i%2===0)m.quad(rr(a,.77,59.78),rr(a+.007,.77,59.78),rr(a+.007,.545,58.16),rr(a,.545,58.16),'#8e979f');
      }
      if(lit){
        const colour=['#9ba8fb','#ac9fef','#8fd2df','#c2a5e2'][Math.floor(i/8)%4];
        lit.litQuad(rr(a,1.006,40.2),rr(c,1.006,40.2),rr(c,1.003,41.2),rr(a,1.003,41.2),colour);
        if(i%2===0)lit.litQuad(rr(a,.94,53.55),rr(c,.94,53.55),rr(c,.931,53.85),rr(a,.931,53.85),'#c9cfe8');
      }
    }
    if(m){
      m.quad([cx-36,26,cz-54],[cx+36,26,cz-54],[cx+36,26,cz+54],[cx-36,26,cz+54],'#629451');
      m.quad([cx-34,26.03,cz-.24],[cx+34,26.03,cz-.24],[cx+34,26.03,cz+.24],[cx-34,26.03,cz+.24],'#d4d8b8');
      if(signs){const front=faces([[cx-25,cz+121],[cx+25,cz+121]])[0];badge(front,signs,27,.1,30,2.4,names.get(stadium));}
    }
  }
  function render(b,m,lit,signs,detail){(b.id===stadium?bowl:offices)(b,m,lit,signs,detail);}
  function scenery(b,group,signs,detail){
    const m=shell(b.n||'AIRSIDE',group);render(b,m,null,signs,detail);m.finish();
  }
  // These small features share the normal distance-based scenery lifetime.
  const sites=[[2002,-3227,'stone'],[4728,-1033,'plane']];
  function allot(stream){for(const [x,z,id] of sites){const c=stream.bucket(x,z);(c.kaiPark||=[]).push([x,z,id]);}}
  function park(c,props,signs,height,group){
    for(const [x,z,id] of c.kaiPark||[]){
      const h=height(x,z),m=shell(id==='stone'?'宋王臺石刻':'啟德航空展區',group);
      if(id==='stone'){
        const outline=[[-2.3,-.75],[-1.6,-1.2],[1.6,-1.26],[2.32,-.65],[2.14,.69],[1.21,1.07],[-1.98,.86]];
        const p=outline.map(([u,v])=>[x+u,z+v]),crest=outline.map(([u,v],i)=>[x+u*.83,h+2.00+.36*Math.cos(i*1.6),z+v*.81]);
        for(let i=0;i<p.length;i++){const j=(i+1)%p.length;m.quad([p[i][0],h+.32,p[i][1]],[p[j][0],h+.32,p[j][1]],crest[j],crest[i],i%3===0?'#a08e79':'#b4a48c');m.tri(crest[i],crest[j],[x,h+2.43,z],'#b6a691');}
        props.add('box',x,h+.19,z,5.1,.38,2.8,'#968c79');
        const f=faces([[x-1.7,z+1.02],[x+1.7,z+1.02]])[0];badge(f,signs,h+1.34,.11,2.25,.72,['宋 王 臺','','#9f8e78']);
      }else{
        const p=HKKaiTakParks.plane;cap(m,p,[],h+1.78,'#d8dcd7');
        for(const f of faces(p))panel(m,f,0,h+1.67,f.w,.22,0,'#adb6ae');
        // Fuselage lies along the long axis of the mapped aircraft silhouette.
        const at=(u,y,d)=>[x+.69*u-.724*d,h+y,z+.724*u+.69*d];
        const stations=[[-10,.14,1.62],[-7,.65,1.89],[1,.88,2.06],[6,.99,2.18],[9,.44,2.14],[10,.05,2.0]];
        for(let i=1;i<stations.length;i++)for(let j=0;j<10;j++){
          const v=(s,k)=>{const [u,r,y]=s,a=k*2*Math.PI/10;return at(u,y+.74*r*Math.sin(a),r*Math.cos(a));};
          m.quad(v(stations[i-1],j),v(stations[i],j),v(stations[i],j+1),v(stations[i-1],j+1),i===4&&j<4?'#617c89':'#e6e6d9');
        }
        m.tri(at(-9,1.9,0),at(-9.7,4.5,0),at(-5.6,2,0),'#b6644b');
        for(const d of [-1,1])props.add('box',...at(1,.68,d),.28,1.36,.35,'#505450');
      }
      m.finish();
    }
  }
  return {replaces,allot,park,
    lights(b,lit){if(replaces(b))render(b,null,lit,null,false);},
    building(b,props,signs,height,group){if(replaces(b)){scenery(b,group,signs,true);render(b,null,props,null,true);}},
    distant(b,batch,group){if(!replaces(b))return false;scenery(b,group,null,false);return true;}
  };
})();
