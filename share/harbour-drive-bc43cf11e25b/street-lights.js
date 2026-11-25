// Fixtures and their night lighting are fixed in map coordinates.
window.HKStreetLights=(()=>{
  function build(map,height,scene,props,hasSpace,sharedRoad){
    const T=THREE,heads=[],cells=new Map();
    const cell=(x,z)=>Math.floor(x/24)+','+Math.floor(z/24);
    function nearby(x,z,r,visit){
      for(let i=Math.floor((x-r)/24);i<=Math.floor((x+r)/24);i++)
        for(let j=Math.floor((z-r)/24);j<=Math.floor((z+r)/24);j++)
          for(const p of cells.get(i+','+j)||[])visit(p);
    }
    // Longer ways first. At junctions several short ways can share a lantern.
    const ways=[];
    for(const road of map.roads){
      if(road.covered||road.indoor||road.l<0&&!road.underpass)continue;
      // These narrow cuttings have wall fixtures. A freestanding pole based
      // on the tunnel floor sits inside the shoulder or sticks out of the bank.
      if(road.portal&&road.en==='Wuhu Street underpass')continue;
      const sections=[];let total=0;
      const path=road.fork?road.fork.rows.map(([a,b])=>[(a[0]+b[0])/2,(a[1]+b[1])/2]):road.p;
      for(let i=1;i<path.length;i++){
        const a=path[i-1],b=path[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(len<.05)continue;
        sections.push({a,start:total,dx:(b[0]-a[0])/len,dz:(b[1]-a[1])/len});
        total+=len;
      }
      if(total>0)ways.push({road,sections,total});
    }
    for(const {road,sections,total} of ways.sort((a,b)=>b.total-a.total)){
      const half=road.w/2,spacing=road.w>=9?34:road.cls==='service'?32:27;
      const count=Math.ceil(total/spacing),interval=total/count;
      function section(at){
        const d=Math.max(0,Math.min(total,at));
        let lo=0,hi=sections.length;
        while(lo+1<hi){const mid=(lo+hi)>>1;if(sections[mid].start<=d)lo=mid;else hi=mid;}
        const {a,start,dx,dz}=sections[lo];
        const row={x:a[0]+dx*(d-start),z:a[1]+dz*(d-start),dx,dz};
        if(road.fork){
          const a=road.fork.rows[lo][0],b=road.fork.rows[lo+1][0];
          const t=(d-start)/((sections[lo+1]?.start??total)-start);
          row.outer=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
        }
        return row;
      }
      for(let k=0;k<count;k++){
        const target=(k+.5)*interval,mid=section(target),floor=height.surface(mid.x,mid.z,road.l,road.id);
        let covered=false;
        nearby(mid.x,mid.z,16,p=>{
          if(Math.abs(p.base-floor)<2&&Math.hypot(mid.x-p.x,mid.z-p.z)<Math.min(16,spacing*.46))covered=true;
        });
        if(covered)continue;
        let head;
        for(const shift of [0,-.2,.2,-.38,.38]){
          const station=target+shift*interval,{x,z,dx,dz,outer}=section(station);
          const side=k%2?1:-1;
          for(const s of (outer?[Math.sign((outer[1]-z)*dx-(outer[0]-x)*dz)]:[side,-side])){
            const elevated=road.l>0;
            const rim=elevated?(height.deckEdge?.(x,z,road.id,s,half+.43)??half+.43):half;
            for(const out of (road.l===0?[1.05,1.7,.67,2.45]:[elevated?-.17:.19])){
              const v=(rim+out)*s;
              const px=outer?outer[0]-dz*out*s:x-dz*v, pz=outer?outer[1]+dx*out*s:z+dx*v;
              if(!road.l&&(!hasSpace(px,pz)||window.HKNorthWorks?.excavated(px,pz)))continue;
              const base=height.surface(px,pz,road.l,road.id);
              if(road.l&&sharedRoad(px,pz,road,base))continue;
              const arm=Math.min(2.15,Math.abs(v)-.35),hx=px+dz*arm*s,hz=pz-dx*arm*s;
              let h=road.w>8?8.3:6.35;
              for(let l=Math.max(1,road.l+1);l<=height.maxLayer;l++){
                for(const [xx,zz] of [[px,pz],[hx,hz]]){
                  const ceiling=height.overhead(xx,zz,l);
                  if(ceiling!==undefined&&ceiling>=base)h=Math.min(h,ceiling-base-1.55);
                }
              }
              if(h<3.6)continue;
              props.add('pole',px,base+h/2,pz,.073,h,.073,'#65716f');
              const angle=Math.atan2(dz*s,-dx*s);
              props.add('box',(px+hx)/2,base+h-.07,(pz+hz)/2,.105,.12,arm,'#747e79',angle);
              props.add('box',hx,base+h-.12,hz,.43,.17,.86,'#909790',angle);
              head={x:hx,y:base+h-.218,z:hz,angle,base,road:road.id,layer:road.l};
              break;
            }
            if(head)break;
          }
          if(head)break;
        }
        if(!head&&road.l===0){
          for(const shift of [0,-.28,.28]){
            const station=target+shift*interval,{x,z,dx,dz}=section(station),base=height(x,z);
            const top=Math.min(base+5.0,(height.overhead(x,z)??Infinity)-1.35);
            if(top-base<3.45)continue;
            for(const s of [-1,1]){
              const nx=-dz*s,nz=dx*s,d=hasSpace.wallMount(x,z,nx,nz,half,top);
              if(!Number.isFinite(d))continue;
              const reach=Math.min(1.7,d-.35),hx=x+nx*(d-reach),hz=z+nz*(d-reach),angle=Math.atan2(nx,nz);
              props.add('box',x+nx*(d-.045),top-.12,z+nz*(d-.045),.26,.46,.16,'#647170',angle);
              props.add('box',x+nx*(d-reach/2),top,z+nz*(d-reach/2),.10,.09,reach,'#808d89',angle);
              props.add('box',hx,top-.10,hz,.43,.14,.85,'#909790',angle);
              head={x:hx,y:top-.184,z:hz,angle,base,road:road.id,layer:road.l};
              break;
            }
            if(head)break;
          }
        }
        if(head){heads.push(head);const key=cell(head.x,head.z);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(head);}
      }
    }
    for(const [x,z] of [...(window.HKHoManTin?.parkLamps||[]),...(window.HKKowloonGarden?.lamps||[]),...(window.HKTongParkLamps||[]),...(window.HKKaiTakParks?.lamps||[])]){
      if(!hasSpace(x,z))continue;
      const base=height(x,z);
      if((height.overhead(x,z)??Infinity)-base<5)continue;
      let covered=false;
      nearby(x,z,12,p=>{if(Math.hypot(p.x-x,p.z-z)<12&&Math.abs(base-p.base)<3)covered=true;});
      if(covered)continue;
      props.add('pole',x,base+2.05,z,.065,4.1,.065,'#52635a');
      props.add('box',x,base+4.1,z,.55,.16,.55,'#6e7c72');
      const head={x,z,y:base+4.01,angle:0,base,road:null,layer:0},key=cell(x,z);
      heads.push(head);
      if(!cells.has(key))cells.set(key,[]);
      cells.get(key).push(head);
    }
    return {heads,nearby,...lightField(heads)};
  }

  // Bake irradiance once onto a grid fixed to the city. Four height slices share
  // an RGBA tile. Linear filtering in X/Z plus interpolation in Y also works on
  // WebGL 1, including moving vehicles and façades with very large triangles.
  function lightField(heads){
    const T=THREE,range=20,spacing=5,vertical=4,scale=2.6;
    let west=Infinity,east=-Infinity,north=Infinity,south=-Infinity,bottom=Infinity,top=-Infinity;
    for(const p of heads){
      west=Math.min(west,p.x);east=Math.max(east,p.x);north=Math.min(north,p.z);south=Math.max(south,p.z);
      bottom=Math.min(bottom,p.base);top=Math.max(top,p.y);
    }
    if(!heads.length)return {bind(){},setAmount(){}};
    const x0=Math.floor((west-range)/spacing)*spacing,z0=Math.floor((north-range)/spacing)*spacing;
    const y0=Math.floor((bottom-5)/vertical)*vertical;
    const nx=Math.ceil((east+range-x0)/spacing)+1,nz=Math.ceil((south+range-z0)/spacing)+1;
    const ny=Math.ceil((top+4-y0)/vertical)+1,groups=Math.ceil(ny/4);
    const cols=Math.ceil(Math.sqrt(groups*nz/nx)),width=cols*nx,height=Math.ceil(groups/cols)*nz;
    const data=new Uint8Array(width*height*4);
    for(const p of heads){
      const ix0=Math.ceil((p.x-range-x0)/spacing),ix1=Math.floor((p.x+range-x0)/spacing);
      const iz0=Math.ceil((p.z-range-z0)/spacing),iz1=Math.floor((p.z+range-z0)/spacing);
      for(let iy=Math.ceil((p.base-5-y0)/vertical);iy<ny&&y0+iy*vertical<p.y+3.5;iy++){
        const y=y0+iy*vertical,dy=y-p.y;
        // Keep a flyover's wash on its own deck; a downlight falls off above its housing.
        const fall=Math.max(0,Math.min(1,(y-p.base+4.5)/4.5,(3.5-dy)/4));
        const group=iy>>2,row=Math.floor(group/cols)*nz,col=group%cols*nx;
        for(let iz=iz0;iz<=iz1;iz++){
          const dz=z0+iz*spacing-p.z;
          for(let ix=ix0;ix<=ix1;ix++){
            const dx=x0+ix*spacing-p.x,d2=dx*dx+dz*dz+dy*dy;
            if(d2>=range*range)continue;
            const edge=1-d2*d2/range**4;
            const value=125*fall*edge*edge/(d2+33);
            const k=((row+iz)*width+col+ix)*4+(iy&3);
            data[k]=Math.min(255,data[k]+Math.round(255*value/scale));
          }
        }
      }
    }
    const texture=new T.DataTexture(data,width,height,T.RGBAFormat);
    texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
    const uniforms={
      hkStreetField:{value:texture},hkLampAmount:{value:0},hkFieldOrigin:{value:new T.Vector3(x0,y0,z0)},
      hkFieldSize:{value:new T.Vector3(nx,ny,nz)},hkAtlasSize:{value:new T.Vector2(width,height)},hkAtlasCols:{value:cols}
    };
    const materialSet=new WeakSet();
    function bind(root){
      root.traverse(o=>{
        if(!o.isMesh)return;
        for(const mat of [].concat(o.material)){
          if(materialSet.has(mat)||!(mat.isMeshLambertMaterial||mat.isMeshPhongMaterial||mat.isMeshStandardMaterial))continue;
          materialSet.add(mat);
          const previous=mat.onBeforeCompile,key=mat.customProgramCacheKey();
          mat.onBeforeCompile=function(shader,renderer){
            previous.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
            shader.vertexShader='varying vec3 hkStreetPosition;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
              vec4 hkPos=vec4(transformed,1.0);
              #ifdef USE_BATCHING
                hkPos=batchingMatrix*hkPos;
              #endif
              #ifdef USE_INSTANCING
                hkPos=instanceMatrix*hkPos;
              #endif
              hkStreetPosition=(modelMatrix*hkPos).xyz;`);
            shader.fragmentShader=`varying vec3 hkStreetPosition;
              uniform sampler2D hkStreetField;
              uniform float hkLampAmount, hkAtlasCols;
              uniform vec3 hkFieldOrigin, hkFieldSize;
              uniform vec2 hkAtlasSize;
              float streetSlice(vec2 grid,float y){
                float group=floor(y*0.25);
                vec2 tile=vec2(mod(group,hkAtlasCols),floor(group/hkAtlasCols));
                vec4 values=texture2D(hkStreetField,(tile*hkFieldSize.xz+grid+0.5)/hkAtlasSize);
                float channel=mod(y,4.0);
                if(channel<0.5)return values.r;
                if(channel<1.5)return values.g;
                return channel<2.5?values.b:values.a;
              }
              float streetWash(){
                vec3 p=(hkStreetPosition-hkFieldOrigin)/vec3(${spacing}.0,${vertical}.0,${spacing}.0);
                if(any(lessThan(p,vec3(0.0)))||any(greaterThanEqual(p,hkFieldSize-1.0)))return 0.0;
                float y=floor(p.y);
                return ${scale}*mix(streetSlice(p.xz,y),streetSlice(p.xz,y+1.0),fract(p.y));
              }\n`+shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
                if(hkLampAmount>0.0){
                  float facing=0.58+0.42*max(0.0,dot(normal,viewMatrix[1].xyz));
                  reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(1.0,0.79,0.53)*facing*hkLampAmount*streetWash();
                }`);
          };
          mat.customProgramCacheKey=()=>key+'|fixed-street-light';mat.needsUpdate=true;
        }
      });
    }
    return {bind,setAmount(value){uniforms.hkLampAmount.value=value;}};
  }
  return {build};
})();
