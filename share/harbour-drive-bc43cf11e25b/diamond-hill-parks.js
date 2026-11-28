// Terrain painting and instanced park furniture use the same projected survey axes.
(()=>{
  const site=HKDiamondHillSites,field=site.field,[a,b,c]=field;
  const cx=(a[0]+c[0])/2,cz=(a[1]+c[1])/2,angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
  site.clearPlanting=(x,z)=>{
    if(x<2800||x>3990||z< -5500||z> -4540)return false;
    const dx=x-cx,dz=z-cz;
    const u=dx*Math.cos(angle)+dz*Math.sin(angle),v=dz*Math.cos(angle)-dx*Math.sin(angle);
    if(Math.hypot(Math.max(0,Math.abs(u)-42),v)<47)return true;
    return site.ponds.some(p=>HKSanPoKong.contains(p,x,z));
  };
  site.paint=ctx=>{
    ctx.save();
    for(const ring of site.ponds){
      ctx.beginPath();ctx.moveTo(...ring[0]);for(const p of ring.slice(1))ctx.lineTo(...p);
      ctx.closePath();ctx.fillStyle='#658f83';ctx.fill();ctx.strokeStyle='#a5ab90';ctx.lineWidth=.65;ctx.stroke();
    }
    ctx.translate(cx,cz);ctx.rotate(angle);
    const oval=r=>{ctx.beginPath();ctx.moveTo(-42,-r);ctx.lineTo(42,-r);ctx.arc(42,0,r,-Math.PI/2,Math.PI/2);ctx.lineTo(-42,r);ctx.arc(-42,0,r,Math.PI/2,3*Math.PI/2);ctx.closePath();};
    oval(45.1);ctx.fillStyle='#a45f4e';ctx.fill();ctx.lineWidth=.18;ctx.strokeStyle='#e4c7ad';
    for(let i=0;i<=8;i++){oval(45.1-i*1.22);ctx.stroke();}
    oval(35.2);ctx.fillStyle='#829467';ctx.fill();ctx.strokeStyle='#e2e5cd';ctx.lineWidth=.28;
    ctx.strokeRect(-48,-31,96,62);ctx.beginPath();ctx.moveTo(0,-31);ctx.lineTo(0,31);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,9.15,0,2*Math.PI);ctx.stroke();
    for(const side of [-1,1]){ctx.strokeRect(48*side,-20,side*-16,40);ctx.strokeRect(48*side,-9,side*-5,18);}
    ctx.restore();
  };
  site.furnish=(height,props,heads)=>{
    const box=(x,y,z,w,h,d,col,rot=0)=>props.add('box',x,y,z,w,h,d,col,rot);
    function lamp(x,z,size){
      const base=height(x,z);props.add('pole',x,base+size/2,z,.08,size,.08,'#6c7268');
      box(x,base+size,z,.48,.24,.48,'#d3cab0');heads.push({x,z,y:base+size-.15,base,angle:0,road:null,layer:0});
    }
    for(const points of site.redBridges){
      const a=points[0],b=points.at(-1),dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),rot=Math.atan2(dx,dz);
      const heightA=height(...a)+.24,heightB=17.85-.16,n=Math.ceil(length/2);
      for(let i=0;i<n;i++){
        const u=(i+.5)/n,x=a[0]+dx*u,z=a[1]+dz*u,y=heightA+(heightB-heightA)*u+.35*Math.sin(Math.PI*u);
        box(x,y,z,2.65,.32,length/n+.04,'#b2513c',rot);
        for(const side of [-1,1]){
          const px=x+side*dz/length*1.23,pz=z-side*dx/length*1.23;
          box(px,y+.52,pz,.14,1.10,.14,'#b13d31',rot);
          for(const off of [.48,1])box(px,y+off,pz,.12,.12,length/n+.05,'#c84b34',rot);
        }
      }
    }
    for(const [x,z] of site.graves){
      const base=height(x,z);box(x,base+.18,z,2.05,.5,1.4,'#b4b0a5',-.12);
      box(x,base+.76,z-.35,1.32,.95,.29,'#a49e93',-.12);
    }
    // A small rock grotto at the water garden in Fung Tak Park.
    for(let i=0;i<13;i++){
      const theta=i*Math.PI/12,x=2893+6*Math.cos(theta),z=-5165+4*Math.sin(theta),y=height(x,z);
      props.add('leaf',x,y+.65,z,1.7,1.5+Math.sin(theta),1.45,i%2?'#918c79':'#a29b85',theta);
    }
    // A timber shelter and low tiled wall in the narrow Hammer Hill garden.
    const x=3732,z=-4843,y=height(x,z);
    for(const dx of [-2.1,2.1])for(const dz of [-1.6,1.6])box(x+dx,y+1.5,z+dz,.24,3,.24,'#765742');
    for(let i=0;i<5;i++)box(x,y+3+i*.21,z,5.8-i*.4,.26,4.6-i*.8,'#596461');
    for(const [x,z] of [[3719,-4847],[3746,-4838],[2882,-5180],[2908,-5167],[3540,-4770],[3550,-4804],[3592,-4855],[3622,-4766]])lamp(x,z,2.8);
    for(const side of [-1,1])for(const end of [-1,1]){
      const u=end*46,v=side*46,x=cx+Math.cos(angle)*u-Math.sin(angle)*v,z=cz+Math.sin(angle)*u+Math.cos(angle)*v;
      const base=height(x,z);props.add('pole',x,base+8,z,.18,16,.18,'#828982');
      box(x,base+16,z,2.8,.7,.5,'#b6bdb1',-angle);heads.push({x,z,y:base+15.6,base,angle:0,road:null,layer:0,flood:true,aimX:(cx-x)*.46,aimZ:(cz-z)*.46});
    }
  };
})();
