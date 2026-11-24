/* Shared rank signs and kerb markings. Draw calls stay constant as ranks are added. */
window.HKTaxiStands=(()=>{
  // A flared entry and exit join the existing kerb. Rendered pavement and
  // street-furniture exclusion both use this cross-section.
  const run=10,straight=4.8;
  function rim(rank,along){
    const half=rank.anchor.road.w/2;
    const blend=Math.max(0,Math.min(1,(run-Math.abs(along))/(run-straight)));
    return half+(rank.offset+1.3-half)*blend;
  }
  function inApron(rank,x,z,margin=0){
    if(rank.layer!==0)return false;
    const {anchor:a,side}=rank,s=a.segment,dx=x-a.x,dz=z-a.z;
    const u=dx*s.dx+dz*s.dz,v=(dx*s.dz-dz*s.dx)*side;
    return Math.abs(u)<=run+margin&&v>=s.half-margin&&v<=rim(rank,u)+margin;
  }
  function paint(rank,groundMark,color){
    if(rank.layer!==0)return;
    const {anchor:a,side}=rank,s=a.segment,half=a.road.w/2;
    const p=(u,v)=>[a.x+s.dx*u+s.dz*side*v,a.z+s.dz*u-s.dx*side*v];
    // Paint over the baked straight kerb, retaining a footway around the recess.
    const stops=[-run,-straight,straight,run];
    for(let i=1;i<stops.length;i++){
      const l=stops[i-1],r=stops[i],vl=rim(rank,l),vr=rim(rank,r);
      groundMark([p(l,vl),p(r,vr),p(r,vr+.65),p(l,vl+.65)],color('#c0b9a9'),undefined,.034);
      groundMark([p(l,half-.62),p(r,half-.62),p(r,vr),p(l,vl)],color('#555b5b'),undefined,.036);
      groundMark([p(l,vl-.085),p(r,vr-.085),p(r,vr+.04),p(l,vl+.04)],color('#d1c6ab'),undefined,.041);
    }
  }
  function draw(scene,stands,height,props){
    const T=THREE,plateVerts=[],plateUV=[],paint=[],paintUV=[];
    function texture(w,h,draw){
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      draw(canvas.getContext('2d'),w,h);
      const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
    }
    const boardVerts=[],boardUV=[];
    const board=texture(768,176,(g,w,h)=>{
      g.fillStyle='#173d42';g.fillRect(0,0,w,h);g.fillStyle='#f7e2a9';g.fillRect(0,0,150,h);
      g.textAlign='center';g.fillStyle='#213638';g.font='bold 76px Arial';g.fillText('B2',75,116);
      g.textAlign='left';g.fillStyle='#fff9e9';g.font='bold 51px sans-serif';g.fillText('市區的士　↑ 出口',180,82);
      g.font='30px Arial';g.fillText('Urban taxis     ·     Way out',183,135);
    });
    const sign=texture(256,320,(g,w,h)=>{
      g.fillStyle='#fcf9ed';g.fillRect(0,0,w,h);g.fillStyle='#22578b';g.fillRect(8,8,w-16,h-16);
      g.textAlign='center';g.fillStyle='#ffffff';g.font='bold 69px sans-serif';g.fillText('的士',128,107);
      g.font='bold 68px Arial';g.fillText('TAXI',128,183);
      g.fillRect(36,209,184,4);g.font='bold 38px sans-serif';g.fillText('候車處',128,272);
    });
    const stencil=texture(256,512,(g,w,h)=>{
      g.strokeStyle='#f5e7a6';g.lineWidth=6;g.setLineDash([31,24]);g.strokeRect(6,6,w-12,h-12);
      g.fillStyle='#f7edc4';g.textAlign='center';g.font='bold 77px sans-serif';g.fillText('的 士',128,249);
      g.font='bold 72px Arial';g.fillText('TAXI',128,334);
    });
    function quad(verts,uv,a,b,c,d){for(const p of [a,b,c,a,c,d])verts.push(...p);uv.push(0,0,1,0,1,1,0,0,1,1,0,1);}
    for(const rank of stands){
      const {anchor:a,side,layer}=rank,s=a.segment,fx=Math.sin(rank.yaw),fz=-Math.cos(rank.yaw);
      const nx=s.dz*side,nz=-s.dx*side,edge=layer===0?rim(rank,0)+.24:s.half+.32,px=a.x+nx*edge,pz=a.z+nz*edge;
      const surface=(x,z)=>height.surface(x,z,layer,a.road.id);
      const y=surface(px,pz);
      props.add('pole',px,y+1.53,pz,.085,3.06,.085,'#7c8685');
      if(a.road.platformWidth){
        const platform=(across,along,up,w,d,h,color)=>{
          const x=a.x+nx*across+fx*along,z=a.z+nz*across+fz*along;
          props.add('box',x,y+up,z,w,h,d,color,-rank.yaw);
        };
        const at=(across,up)=>[a.x+fx*13-fz*across,y+up,a.z+fz*13+fx*across];
        quad(boardVerts,boardUV,at(-2.1,3.4),at(2.1,3.4),at(2.1,4.36),at(-2.1,4.36));
        for(const across of [-1.6,1.6])platform(across,13,4.94,.055,.055,1.19,'#666e69');
        platform(6.15,0,.08,3.65,32,.16,'#bbb6a7');
        platform(4.65,0,.17,.25,31,.04,'#e3bb62');
        for(const along of [-12,-4,4,12]){
          platform(7.65,along,2.8,.36,.55,5.52,'#c8c8b9');
          platform(7.65,along,1.15,.38,.57,.23,'#54877f');
          platform(6.75,along,.53,.58,2.5,.13,'#848f93');
          platform(7.00,along,.75,.09,2.5,.43,'#818d90');
          for(const off of [-.88,.88])platform(6.75,along+off,.30,.32,.12,.46,'#50595c');
        }
      }
      const face=(across,up)=>[px-fz*across,y+2.73+up,pz+fx*across];
      quad(plateVerts,plateUV,face(-.31,-.4),face(.31,-.4),face(.31,.4),face(-.31,.4));
      const floor=(across,forward)=>{
        const x=rank.x-fz*across+fx*forward,z=rank.z+fx*across+fz*forward;
        return [x,surface(x,z)+.062,z];
      };
      quad(paint,paintUV,floor(-1.12,-4),floor(1.12,-4),floor(1.12,4),floor(-1.12,4));
    }
    function mesh(verts,uv,tex,name){
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      const obj=new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,alphaTest:.25,polygonOffset:true,polygonOffsetFactor:-1}));obj.name=name;scene.add(obj);
    }
    mesh(boardVerts,boardUV,board,'西九龍站 B2 導向牌');
    mesh(plateVerts,plateUV,sign,'市區的士站');mesh(paint,paintUV,stencil,'的士候車線');
    // A short illuminated kerb identifies the actual stopping side at drop-off.
    const kerb=new T.Group(),mat=new T.MeshBasicMaterial({color:0x6be5c4,side:T.DoubleSide});
    const strip=new T.PlaneGeometry(.14,1.4);strip.rotateX(-Math.PI/2);
    for(let i=-3;i<=3;i++)for(const side of [-1,1]){
      const m=new T.Mesh(strip,mat);m.position.set(side*1.22,0,i*2.2);kerb.add(m);
    }
    kerb.visible=false;scene.add(kerb);
    let last=null;
    return state=>{
      const point=state?.phase==='hired'?state.target:null;
      if(last===point)return;last=point;kerb.visible=!!point;if(!point)return;
      kerb.position.set(point.x,0,point.z);kerb.rotation.y=-point.yaw;
      for(const m of kerb.children){
        const x=point.x+m.position.x*Math.cos(point.yaw)-m.position.z*Math.sin(point.yaw);
        const z=point.z+m.position.x*Math.sin(point.yaw)+m.position.z*Math.cos(point.yaw);
        m.position.y=height.surface(x,z,point.layer)+.084;
      }
    };
  }
  return {draw,inApron,paint};
})();
