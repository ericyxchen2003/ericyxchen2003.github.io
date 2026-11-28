// Port silhouettes and closer fittings share the same cell lifetime as the rest of the city.
window.HKStonecuttersModels=(()=>{
  const T=THREE,material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  const shades=new Map(),containers=['#89493e','#436577','#615e4d','#a75b49','#647e73','#afa896','#3a6570','#80634e'];
  function tint(code){if(!shades.has(code))shades.set(code,new T.Color(code));return shades.get(code);}
  let yardMaterial;
  function containerMaterial(){
    if(yardMaterial)return yardMaterial;
    if(typeof document==='undefined')return material;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');
    for(let row=0;row<8;row++)for(let col=0;col<8;col++){
      const x=col*32,y=row*32,hash=((row*937+col*1217+83)*(col*11+row*17+41))>>>2;
      ctx.fillStyle=containers[hash%containers.length];ctx.fillRect(x,y,32,32);
      ctx.fillStyle='rgba(255,249,229,.12)';
      for(let i=3;i<31;i+=3)ctx.fillRect(x+i,y+2,1,28);
      ctx.fillStyle='rgba(26,31,29,.38)';ctx.fillRect(x,y,32,1);ctx.fillRect(x,y,1,32);
      ctx.fillStyle='rgba(248,230,201,.32)';ctx.fillRect(x+2,y+3,4,2);
    }
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
    tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;
    yardMaterial=new T.MeshLambertMaterial({map:tex,vertexColors:true});
    return yardMaterial;
  }
  function register(stream){
    for(const feature of HKPortScenery){
      const [kind,x,z]=feature,cell=stream.bucket(x,z);
      (cell.port??=[]).push(feature);
      if(kind.endsWith('Tower'))cell.half=Math.max(cell.half,510);
    }
  }
  function draw(cell,group,height,Batch,far){
    if(!cell?.port?.length)return;
    const mesh=new Batch(),lit=new Batch(),yard=new Batch();
    let hasYard=false;
    for(const [kind,x,z,angle,seed=0,tips] of cell.port){
      const ca=Math.cos(angle),sa=Math.sin(angle),base=kind==='workboat'||kind==='lighter'?-.58:height(x,z);
      const at=(u,y,v)=>[x+ca*u-sa*v,y+base,z+sa*u+ca*v];
      function face(a,b,c,d,shade,light=false){(light?lit:mesh).quad(at(...a),at(...b),at(...c),at(...d),tint(shade));}
      function box(u,y,v,w,h,l,shade,light=false){
        const a=u-w/2,b=u+w/2,c=v-l/2,d=v+l/2,t=y+h;
        face([a,y,c],[a,t,c],[b,t,c],[b,y,c],shade,light);face([a,y,d],[b,y,d],[b,t,d],[a,t,d],shade,light);
        face([a,y,c],[a,y,d],[a,t,d],[a,t,c],shade,light);face([b,y,c],[b,t,c],[b,t,d],[b,y,d],shade,light);
        face([a,t,c],[a,t,d],[b,t,d],[b,t,c],shade,light);
      }
      function spire(y0,y1,r0,r1,shade,light=false){
        for(let i=0;i<16;i++){
          const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
          face([r0*Math.cos(a),y0,r0*Math.sin(a)],[r1*Math.cos(a),y1,r1*Math.sin(a)],
               [r1*Math.cos(b),y1,r1*Math.sin(b)],[r0*Math.cos(b),y0,r0*Math.sin(b)],shade,light);
        }
      }
      // Oriented square section, also used for the crane trusses and booms.
      function beam(a,b,r,shade,light=false){
        const along=new T.Vector3(...b).sub(new T.Vector3(...a)).normalize();
        const cross=new T.Vector3().crossVectors(along,Math.abs(along.y)>.92?new T.Vector3(1,0,0):new T.Vector3(0,1,0)).normalize().multiplyScalar(r);
        const up=new T.Vector3().crossVectors(along,cross).normalize().multiplyScalar(r);
        const corners=[cross.clone().add(up),up.clone().sub(cross),cross.clone().add(up).negate(),cross.clone().sub(up)];
        const pt=(p,k)=>[p[0]+k.x,p[1]+k.y,p[2]+k.z];
        for(let i=0;i<4;i++){const c=corners[i],d=corners[(i+1)%4];face(pt(a,c),pt(a,d),pt(b,d),pt(b,c),shade,light);}
      }
      function hall(u,v,w,l,h,wall,roof){
        box(u,0,v,w,h,l,wall);
        for(const side of [-1,1]){
          face([u-w/2-.8,h,v+side*l/2],[u+w/2+.8,h,v+side*l/2],[u+w/2+.8,h+2.5,v],[u-w/2-.8,h+2.5,v],roof);
          box(u,h*.64,v+side*(l/2+.1),w*.83,h*.19,.24,'#596e71');
          for(let i=-1;i<=1;i++)box(u+i*w*.31,h*.60,v+side*(l/2+.27),w*.095,.8,.22,'#f6d39a',true);
        }
        if(!far)for(let i=-1;i<=1;i++)box(u+i*w*.30,.3,v+l/2+.16,w*.21,h*.49,.35,'#738286');
      }
      if(kind.endsWith('Tower')){
        const top=298-base,cladding=175-base;let tip=0;
        spire(-base,top*.28,6.2,5.15,'#b5b8b0');spire(top*.28,cladding,5.15,5.7,'#c3c4ba');
        spire(cladding,top,5.7,4.4,'#b9c9c6');spire(top-1,top,4.53,4.46,'#f9e1ae',true);
        for(let y=cladding;y<top;y+=12)spire(y,y+.68,5.78-(y-cladding)*.0104,5.78-(y-cladding)*.0104,'#ecdfaf',true);
        box(0,top,0,.8,1.4,.8,'#fd6954',true);
        for(const side of [-1,1])for(const toward of [-1,1]){
          for(let i=1;i<=28;i++){
            const [u,y,v]=tips[tip++];
            if(far&&i%2)continue;
            beam([toward*3,top*.74+i*2.42,side*3.7],[u,y-base,v],far?.51:.32,'#e1e2d8');
            if(!far){
              const level=y-base;
              beam([u,level-2.3,0],[u,level-2.3,v],.55,'#899492');
              box(u,level-2.8,v,1.35,2.95,1.1,'#a9b2af');
            }
          }
        }
      }else if(kind==='crane'){
        const paint='#447779',steel='#659496';
        for(const u of [-10,10])for(const v of [-11,15]){
          box(u,0,v,4,2.4,6,'#495859');beam([u,1,v],[u,45,v>0?12:-8],1.32,paint);
        }
        for(const u of [-10,10]){
          beam([u,5,15],[u,34,-10],.68,steel);beam([u,5,-11],[u,34,14],.68,steel);
          beam([u,44,30],[u,44,-54],1.68,paint);beam([u,44,-8],[u,70,2],1.25,steel);
          beam([u,70,2],[u,45,-50],.48,steel);beam([u,70,2],[u,44,26],.56,steel);
        }
        box(0,40,22,23,7,14,'#567f83');box(0,42,-16,19,2.6,4,'#416c72');
        for(const u of [-5,5])beam([u,42,-16],[u,23,-16],.20,'#434c4d');
        box(0,22,-16,13,1.2,3,'#b48f51');box(0,47,24,5,.4,1,'#ffd894',true);
      }else if(kind==='yard'){
        hasYard=true;
        // The atlas gives each 40-foot box its own roof and end panels. Joined
        // boxes share a shell, so storage rows need only a few faces at distance.
        const white=tint('#ffffff'),cols=far?4:2;
        for(let col=0;col<4;col+=cols){
          const a=(col-2)*12.3+.12,b=a+cols*12.3-.24;
          const tier=1+((seed>>((col+2)%8))%4),y=tier*2.59+.12;
          const c=-3.8,d=3.8,u=(seed%8+col)/8,v=((seed>>4)%8)/8;
          const side=[u,v,u+cols/8,v+tier/8],end=[u,v,u+3/8,v+tier/8];
          yard.quad(at(b,.12,c),at(a,.12,c),at(a,y,c),at(b,y,c),white,side);
          yard.quad(at(a,.12,d),at(b,.12,d),at(b,y,d),at(a,y,d),white,side);
          yard.quad(at(a,.12,c),at(a,.12,d),at(a,y,d),at(a,y,c),white,end);
          yard.quad(at(b,.12,d),at(b,.12,c),at(b,y,c),at(b,y,d),white,end);
          yard.quad(at(a,y,d),at(b,y,d),at(b,y,c),at(a,y,c),white,[u,v,u+cols/8,v+3/8]);
        }
      }else if(kind==='cargo'){
        const rows=4;
        if(far){
          for(let j=0;j<rows;j++)box((j-(rows-1)/2)*12.6,.1,0,12.15,2.65*(1+(seed+j)%3),8.8,containers[(seed+3*j)%containers.length]);
          continue;
        }
        for(let j=0;j<rows;j++)for(let k=0;k<3;k++){
          const levels=1+(j*7+k*3+seed)%4;
          for(let n=0;n<levels;n++){
            const u=(j-(rows-1)/2)*12.6,v=(k-1)*3.15;
            box(u,.10+n*2.65,v,12.15,2.54,2.48,containers[(seed+3*j+5*k+n)%containers.length]);
            if(!far&&n===levels-1)box(u+5.5,n*2.65+.30,v+1.25,.13,2.1,.04,'#b2b0a7');
          }
        }
      }else if(kind==='fence'){
        box(0,0,0,11.7,.48,.3,'#93968e');
        for(const u of [-5.8,-2.9,0,2.9,5.8])box(u,.48,0,.12,1.55,.12,'#879897');
        for(const y of [.74,1.8])box(0,y,0,11.75,.10,.12,'#8c9996');
      }else if(kind==='mast'){
        box(0,0,0,1.9,.9,1.9,'#989990');
        beam([0,.9,0],[0,28,0],.21,'#929791');
        for(const u of [-1.15,1.15])for(const v of [-.75,.75]){
          box(u,27.7,v,1.5,.65,1.1,'#5f6b69');
          box(u,27.6,v,1.55,.18,1.16,'#ffe2ac',true);
        }
      }else if(kind==='dock'){
        for(let i=-1;i<=1;i++)hall(i*23,0,21,48,14,'#c0bfb3','#899893');
        hall(-12,38,48,14,16,'#c3c4b5','#829e9a');
      }else if(kind==='diving'){
        hall(0,0,35,29,13,'#d5c6af','#b8ada0');box(6,13,-4,13,5,17,'#c3b4a0');
        for(const side of [-1,1]){
          for(const y of [4.3,8.4]){
            box(side*17.58,y,0,.22,2.1,24,'#677e80');
            box(side*17.72,y+.37,0,.12,.72,11,'#ffe1af',true);
            for(const v of [-8,-4,0,4,8])box(side*17.78,y,v,.14,2.15,.23,'#c5c4b5');
          }
          box(5,14,side*2+4,12,.8,.4,'#a5ada6');
        }
        box(0,5.2,14.8,34,1.0,.38,'#983c35');box(-6,0,17,16,1,5,'#b2b4ac');
      }else if(kind==='plant'){
        for(const v of [-26,0,26]){
          box(0,0,v,108,4.5,23,'#abae9b');box(0,4.5,v,104,.9,20,'#859c91');
          for(let i=-3;i<=3;i++)box(i*14,5.4,v,.50,1,20,'#c8c6b4');
        }
        hall(12,57,79,24,15,'#b4bfac','#9aa59a');
      }else if(kind==='control'){
        box(0,0,0,22,5,13,'#d0c9b6');box(0,5,0,10,9,8,'#c4c6bc');
        box(0,14,0,16,4.1,13,'#526e73');box(0,18.1,0,18,1,15,'#d8d4c4');
        box(0,15.6,6.6,11,.75,.25,'#ffe3af',true);box(-3,19,0,.34,6,.34,'#636d69');
      }else if(kind==='transfer'){
        hall(0,0,46,31,15,'#a9baae','#698884');
      }else if(kind==='south'){
        // A fictional distant massing against the green ridge.
        for(let i=-1;i<=1;i++){
          box(i*41,-1,5*i,32,.99,16,'#9c9b8c');
          hall(i*41,5*i,31,15,9+i*2,'#c0bfb1','#777f73');
        }
      }else{
        const l=kind==='lighter'?42:21,w=kind==='lighter'?12:6.6;
        box(0,0,0,l,w*.27,w,'#465a60');
        for(const side of [-1,1])face([l/2,0,side*w*.43],[l/2,w*.27,side*w/2],[l*.65,w*.29,0],[l*.6,0,0],'#475a5e');
        box(-l*.25,w*.27,0,l*.26,w*.48,w*.72,kind==='lighter'?'#ad9b86':'#d5d5c9');
        box(-l*.25,w*.55,0,l*.23,w*.17,w*.74,'#4d6c72');
        box(-l*.25,w*.76,0,1.9,.30,1,'#ead7a4',true);
      }
    }
    mesh.mesh(material,group,false,true);lit.mesh(HKModels.nightMaterial,group,false,false);
    if(hasYard)yard.mesh(containerMaterial(),group,false,true);
  }
  return {register,draw};
})();
