// Retain the survey's individual hillside blocks and the separate shop and housing levels.
window.HKTszWanShanModels=(()=>{
  const sites=HKTszWanShanSites;
  const kinds=new Map(Object.entries(sites.groups).flatMap(([k,ids])=>ids.map(id=>[id,k])));
  const colors={mall:['#e1d8cb','#b26058'],ching:['#dad6c8','#ac8178'],oi:['#dddacb','#7a9b93'],
    lok:['#e2d4c5','#b18566'],man:['#dacfc1','#b6786c'],on:['#d9dacf','#839f9d'],
    hong:['#dcd9cc','#8796a1'],'pass-estate':['#e5decf','#919e8a'],transmitter:['#c8c8bc','#858e85']};
  function mast(b,g){
    const mesh=HKCoastModels.geometry.shell('慈雲山山頂電視發射塔',g);
    const x=3768,z=-6652,y=b.top;
    const ring=(r,h)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[x+u*r,y+h,z+v*r]);
    const beam=(a,c,w)=>{
      const axis=new THREE.Vector3(c[0]-a[0],c[1]-a[1],c[2]-a[2]).normalize();
      const side=axis.clone().cross(Math.abs(axis.z)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1)).normalize().multiplyScalar(w/2);
      const other=axis.clone().cross(side);
      const corners=p=>[side,other,side.clone().negate(),other.clone().negate()].map(v=>[p[0]+v.x,p[1]+v.y,p[2]+v.z]);
      const A=corners(a),B=corners(c);
      for(let j=0;j<4;j++)mesh.quad(A[j],A[(j+1)%4],B[(j+1)%4],B[j],'#999c98');
    };
    for(let k=0;k<5;k++){
      const a=ring(2.8-.46*k,k*5),c=ring(2.8-.46*(k+1),(k+1)*5);
      for(let j=0;j<4;j++){
        beam(a[j],c[j],.45);beam(a[j],c[(j+1)%4],.24);beam(c[j],c[(j+1)%4],.27);
      }
    }
    const base=ring(.49,25),top=ring(.32,34);
    for(let j=0;j<4;j++)mesh.quad(base[j],base[(j+1)%4],top[(j+1)%4],top[j],'#b76753');
    mesh.finish();
  }
  function draw(b,g,signs,lights,height,far){
    const k=kinds.get(b.id),kind=k==='mall'?'mall':k==='transmitter'?'hospital':'estate';
    HKLokFuModels.drawBlock(b,g,signs,lights,height,far,kind,sites.fronts[b.id],colors[k]);
    if(k==='transmitter'&&g)mast(b,g);
  }
  const replaces=b=>!b.foundation&&kinds.has(b.id);
  return {replaces,building(b,props,signs,height,g){if(replaces(b))draw(b,g,signs,props,height,false);},
    lights(b,lights,height){if(replaces(b))draw(b,null,null,lights,height,false);},
    distant(b,batch,g,height){if(!replaces(b))return false;draw(b,g,null,null,height,true);return true;}};
})();
