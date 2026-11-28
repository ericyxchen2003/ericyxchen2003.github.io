(()=>{
  const sites=HKTszWanShanSites;
  const outline=(c,p)=>{c.beginPath();c.moveTo(...p[0]);for(const pt of p.slice(1))c.lineTo(...pt);};
  sites.clearPlanting=(x,z)=>x>3000&&x<3800&&z>-6050&&z<-5120&&
    (HKSanPoKong.contains(sites.park,x,z)||HKSanPoKong.contains(sites.playground,x,z));
  sites.paint=c=>{
    c.save();c.lineJoin=c.lineCap='round';
    c.strokeStyle='#c1b69c';c.lineWidth=1.85;
    for(const p of sites.trails){outline(c,p);c.stroke();}
    for(const [i,field] of sites.fields.entries()){
      let [a,b,d]=field;
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<Math.hypot(b[0]-d[0],b[1]-d[1]))[a,b,d]=field.slice(1);
      const w=Math.hypot(a[0]-b[0],a[1]-b[1]),h=Math.hypot(b[0]-d[0],b[1]-d[1]);
      c.save();c.translate((a[0]+d[0])/2,(a[1]+d[1])/2);c.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));
      c.fillStyle=i<2?'#66885e':'#9f7059';c.fillRect(-w/2,-h/2,w,h);
      c.strokeStyle='#e4e4cd';c.lineWidth=.24;c.strokeRect(-w/2,-h/2,w,h);
      c.beginPath();c.moveTo(0,-h/2);c.lineTo(0,h/2);c.stroke();c.beginPath();c.arc(0,0,w*.085,0,Math.PI*2);c.stroke();
      for(const sign of [-1,1])c.strokeRect(sign*w/2,-h*.28,-sign*w*.15,h*.56);
      c.restore();
    }
    for(const {p,raised} of sites.tracks){
      if(raised)continue;
      outline(c,p);c.lineWidth=3.25;c.strokeStyle='#a97860';c.stroke();
    }
    c.restore();
  };
  sites.furnish=(height,props,heads)=>{
    function lamp(x,z,h){
      const y=height(x,z);
      props.add('pole',x,y+h/2,z,.15,h,.15,'#90988c');
      props.add('box',x,y+h,z,1.05,.28,.6,'#d8d9c1');
      heads.push({x,z,y:y+h-.14,base:y,angle:0,road:null,layer:0});
    }
    // Ease the ground approaches to the same deck height as each mapped raised span.
    const ends=sites.tracks.filter(t=>t.raised).flatMap(t=>[t.p[0],t.p.at(-1)]);
    for(const {p,raised} of sites.tracks){
      let station=0;
      for(let i=1;i<p.length;i++){
        const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
        if(len<.01)continue;
        const count=Math.ceil(len/3.3),angle=Math.atan2(dx,dz),lift=(x,z)=>raised?3.45:Math.max(0,3.45-Math.min(...ends.map(q=>Math.hypot(x-q[0],z-q[1])))*.085);
        for(let j=0;j<count;j++){
          const t=(j+.5)/count,x=a[0]+dx*t,z=a[1]+dz*t,up=lift(x,z),base=height(x,z),y=base+up;
          if(up<.12)continue;
          props.add('box',x,y,z,3.65,.32,len/count+.18,'#ac7964',angle);
          for(const side of [-1,1]){
            const xx=x+side*dz/len*1.73,zz=z-side*dx/len*1.73;
            props.add('box',xx,y+.64,zz,.12,1.05,.12,'#858f85',angle);
            props.add('box',xx,y+1.12,zz,.16,.14,len/count+.15,'#d7d5b9',angle);
          }
          if(up>1&&Math.floor((station+j*len/count)/14)!==Math.floor((station+(j+1)*len/count)/14))
            props.add('pole',x,base+up/2,z,.46,up,.46,'#a8aaa0');
        }
        station+=len;
      }
    }
    // Poles sit off the pitch corners, outside the playing and running surfaces.
    for(const field of sites.fields){
      const cx=field.reduce((s,p)=>s+p[0],0)/4,cz=field.reduce((s,p)=>s+p[1],0)/4;
      for(const [x,z] of [field[0],field[2]])lamp(x+(x-cx)*.05,z+(z-cz)*.05,12);
    }
  };
})();
