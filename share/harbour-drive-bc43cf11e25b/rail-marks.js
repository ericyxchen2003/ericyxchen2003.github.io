// Shared MTR roundel. Normalized artwork keeps its proportions on walls and entrance headers.
window.HKRailMarks=(()=>{
  const ratio=1.23;
  function paint(ctx,x,y,w,h){
    ctx.save();ctx.translate(x,y);ctx.scale(w/1260,h/1024);
    ctx.fillStyle='#ac2944';ctx.beginPath();ctx.ellipse(630,512,630,512,0,0,2*Math.PI);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=98;ctx.lineCap='butt';
    ctx.beginPath();ctx.moveTo(630,155);ctx.lineTo(630,869);ctx.stroke();
    ctx.beginPath();ctx.arc(630,179,235,0,Math.PI);ctx.stroke();
    ctx.beginPath();ctx.arc(630,846,235,Math.PI,2*Math.PI);ctx.stroke();
    ctx.restore();
  }
  let atlas,roundel;
  const headers=new Map();
  function header(zh,en,ref,width,height){
    const aspect=width/height,key=[zh,en,ref,aspect.toFixed(2)].join('|');
    if(headers.has(key))return headers.get(key);
    atlas??=HKDetails.atlas();
    const tag=atlas.add((c,w,h)=>{
      // A coordinate system in physical sign units keeps the logo oval and the type upright.
      const H=120,W=H*aspect;
      c.scale(w/W,h/H);c.fillStyle='#1e4052';c.fillRect(0,0,W,H);
      const symbolH=Math.min(H*.82,W*.32/ratio),symbolW=symbolH*ratio;
      paint(c,6,(H-symbolH)/2,symbolW,symbolH);
      const left=12+symbolW,exit=ref?Math.min(W*.24,Math.max(39,ref.length*26)):0;
      const space=W-left-exit-6;
      if(space>12){
        const center=left+space/2;
        HKDetails.lettering(c,zh,center,43,'bold 43px','#fff',space);
        HKDetails.lettering(c,en,center,86,'600 23px','#e6efee',space);
      }
      if(ref){
        c.fillStyle='#ecece3';c.fillRect(W-exit,13,exit-5,H-26);
        HKDetails.lettering(c,ref,W-exit/2-2,H/2,'bold 56px','#233c4a',exit-10);
      }
    });
    headers.set(key,tag);return tag;
  }
  // Surveyed above-ground passenger halls. Exclude shopping towers and railway plant.
  const halls=new Map([[63346,'柯士甸站'],[2667,'柯士甸站'],[305992,'紅磡站'],[208122,'旺角東站'],
    [81117,'奧運站'],[160493,'南昌站'],[6160413,'南昌站'],[82738,'九龍站'],[82493,'九龍站'],
    [2007647,'九龍塘站'],[2111840,'九龍塘站']]);
  function install(scene,buildings,nearest,ground,blocked){
    const candidates=new Map();
    for(const b of buildings){
      const name=halls.get(b.id);
      if(!name||b.foundation||b.slice)continue;
      const p=b.p,turn=Math.sign(p.reduce((v,a,i)=>{const q=p[(i+1)%p.length];return v+a[0]*q[1]-a[1]*q[0];},0));
      for(let i=0;i<p.length;i++){
        const a=p[i],q=p[(i+1)%p.length],dx=q[0]-a[0],dz=q[1]-a[1],len=Math.hypot(dx,dz);
        if(len<6)continue;
        const nx=turn*dz/len,nz=-turn*dx/len;
        for(const f of [.3,.5,.7]){
          const x=a[0]+dx*f,z=a[1]+dz*f,base=b.basePD??ground(x,z),top=b.top??base+b.h;
          const h=Math.min(3.1,(top-base)*.42,len*.35/ratio);
          const street=nearest(x+nx*4,z+nz*4);
          const streetLevel=street?(ground.surface?.(street.x,street.z,street.r.l,street.r.id)??ground(street.x,street.z)):base;
          const y=Math.min(top-h*.63,Math.max(base+.54*(top-base),streetLevel+4.2));
          if([.6,2.6,5.5].some(d=>blocked(x+nx*d,y,z+nz*d,b)))continue;
          const facing=street?((street.x-x)*nx+(street.z-z)*nz)/Math.max(1,Math.hypot(street.x-x,street.z-z)):0;
          const score=(street?Math.hypot(street.x-x,street.z-z):80)+25*(1-facing)+Math.abs(y-streetLevel)*.8;
          if(score<(candidates.get(name)?.score??Infinity))candidates.set(name,{name,x,y,z,nx,nz,h,score,depth:b.id===81117?.47:.13});
        }
      }
    }
    atlas??=HKDetails.atlas();
    roundel??=atlas.add((c,w,h)=>paint(c,0,0,w,h));
    const group=new THREE.Group(),signs=HKDetails.signBatch();
    const backingGeometry=new THREE.CylinderGeometry(.5,.5,1,40).rotateX(Math.PI/2);
    const backings=new THREE.InstancedMesh(backingGeometry,new THREE.MeshLambertMaterial({color:0x722737}),candidates.size);
    const mount=new THREE.Object3D();
    let index=0;
    for(const s of candidates.values()){
      const {x,y,z,nx,nz,h,depth}=s,point=(u,v)=>[x+nz*u+nx*(depth+.008),y+v,z-nx*u+nz*(depth+.008)];
      const w=h*ratio;
      mount.position.set(x+nx*depth/2,y,z+nz*depth/2);mount.rotation.y=Math.atan2(nx,nz);
      mount.scale.set(w,h,depth);mount.updateMatrix();backings.setMatrixAt(index++,mount.matrix);
      signs.quad(roundel,[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)]);
    }
    group.add(backings);signs.finish(group);group.name='港鐵站房標誌';group.userData.stations=[...candidates.values()];scene.add(group);
  }
  return {header,install};
})();
