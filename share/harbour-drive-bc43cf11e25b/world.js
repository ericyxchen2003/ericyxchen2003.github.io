/* All dimensions are in metres. Local +X is east and +Z is south. */
window.HKWorld = (() => {
  "use strict";
  const T = THREE, TAU = 2 * Math.PI;
  const lerp = (a,b,t) => a + (b-a)*t;
  const limit = (n,a,b) => Math.max(a,Math.min(b,n));
  function rng(seed) {
    let state = seed >>> 0;
    return () => { state=(Math.imul(1664525,state)+1013904223)>>>0; return state/4294967296; };
  }
  function terrainSampler(g) {
    return (x,z) => {
      const u=limit((x-g.x)/g.step,0,g.nx-1), v=limit((z-g.z)/g.step,0,g.nz-1);
      const i=Math.min(Math.floor(u),g.nx-2), j=Math.min(Math.floor(v),g.nz-2), k=j*g.nx+i;
      return lerp(lerp(g.values[k],g.values[k+1],u-i),lerp(g.values[k+g.nx],g.values[k+g.nx+1],u-i),v-j);
    };
  }
  function groundSampler(grid){
    const elevation=terrainSampler(grid);
    const original=(x,z)=>Math.max(1.5,elevation(x,z));
    const patch=grid.relief;
    if(!patch)return original;
    function readPatch(p,fallback){
      const {nx,nz,step}=p, values=new Float32Array(nx*nz);
      for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)values[j*nx+i]=original(p.x+i*step,p.z+j*step);
      for(const [j,i,encoded] of p.rows){
        const bytes=atob(encoded);
        for(let k=0;k<bytes.length;k+=2){
          const cm=(bytes.charCodeAt(k)|bytes.charCodeAt(k+1)<<8)<<16>>16;
          values[j*nx+i+k/2]+=cm*.01;
        }
      }
      return (x,z)=>{
        const u=(x-p.x)/step,v=(z-p.z)/step;
        if(u<0||v<0||u>nx-1||v>nz-1)return fallback(x,z);
        const i=Math.min(nx-2,Math.floor(u)),j=Math.min(nz-2,Math.floor(v)),k=j*nx+i,a=u-i,b=v-j;
        if(a+b<=1)return values[k]*(1-a-b)+values[k+1]*a+values[k+nx]*b;
        return values[k+nx+1]*(a+b-1)+values[k+1]*(1-b)+values[k+nx]*(1-a);
      };
    }
    const sampleMain=readPatch(patch,original),main=patch.inset?
      ((x,z)=>sampleMain(limit(x,patch.x,patch.x+(patch.nx-1)*patch.step),limit(z,patch.z,patch.z+(patch.nz-1)*patch.step))):sampleMain;
    const southern=patch.inset?readPatch(patch.inset,main):main;
    const north=grid.north;
    let natural=southern;
    if(north){
      const data=atob(north.cm),v=new Int16Array(north.nx*north.nz);
      for(let i=0;i<v.length;i++)v[i]=data.charCodeAt(i*2)|(data.charCodeAt(i*2+1)<<8);
      function triangle(values,nx,nz,u,w){
        u=limit(u,0,nx-1);w=limit(w,0,nz-1);
        const i=Math.min(nx-2,Math.floor(u)),j=Math.min(nz-2,Math.floor(w)),a=u-i,b=w-j,k=j*nx+i;
        if(a+b<=1)return values[k]*(1-a-b)+values[k+1]*a+values[k+nx]*b;
        return values[k+nx+1]*(a+b-1)+values[k+1]*(1-b)+values[k+nx]*(1-a);
      }
      const coarse=(x,z)=>triangle(v,north.nx,north.nz,(x-north.x)/north.step,(z-north.z)/north.step)*.01;
      // One metre divides both the 2 m southern and the 5 m northern mesh.
      // Identical edge vertices keep the wheels and terrain watertight.
      const strip=grid.join={x:north.x,z:patch.z-10,step:1,nx:(north.nx-1)*north.step+1,nz:11};
      const transition=new Float32Array(strip.nx*strip.nz);
      for(let i=0;i<strip.nx;i++){
        const x=strip.x+i,correction=southern(x,patch.z)-coarse(x,patch.z);
        for(let j=0;j<strip.nz;j++){
          const t=j/(strip.nz-1);
          transition[j*strip.nx+i]=coarse(x,strip.z+j)+t*t*(3-2*t)*correction;
        }
      }
      natural=(x,z)=>z>=patch.z?southern(x,z):z<=strip.z?coarse(x,z):triangle(transition,strip.nx,strip.nz,x-strip.x,z-strip.z);
      for(const p of [grid.west,grid.coast].filter(Boolean)){
        const bytes=atob(p.cm), values=new Int16Array(p.nx*p.nz);
        for(let i=0;i<values.length;i++)values[i]=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);
        const east=natural;
        natural=(x,z)=>x<north.x && x>=p.x && z>=p.z && z<=p.z+(p.nz-1)*p.step
          ?triangle(values,p.nx,p.nz,(x-p.x)/p.step,(z-p.z)/p.step)*.01:east(x,z);
      }
    }
    const parkGround=window.HKDetails?.parkTerrain(natural) || natural;
    const base=window.HKFrontages?.arcadeTerrain(parkGround) || parkGround;
    const tunnel=window.HKUnderpass?.create(grid.salisbury,base);
    const ground=tunnel?.ground || base;
    ground.underpass=tunnel;
    const northern=new Set(window.HKNorth?.decks||[]);
    const decks=patch.decks.map(d=>({...d, original:d, bounds:[
      Math.min(...d.p.map(q=>q[0]))-d.w,Math.min(...d.p.map(q=>q[1]))-d.w,
      Math.max(...d.p.map(q=>q[0]))+d.w,Math.max(...d.p.map(q=>q[1]))+d.w]}));
    const byId=new Map(decks.map(d=>[d.id,[d]])),localDecks=new Map();
    for(const d of decks)for(let i=Math.floor(d.bounds[0]/40);i<=Math.floor(d.bounds[2]/40);i++)
      for(let j=Math.floor(d.bounds[1]/40);j<=Math.floor(d.bounds[3]/40);j++){
        const k=i+','+j;if(!localDecks.has(k))localDecks.set(k,[]);localDecks.get(k).push(d);
      }
      // Rendering uses the same station and signed normal as the clearance test.
      ground.deckEdge=(x,z,id,sign,outer)=>{
        const d=byId.get(id)?.[0];if(!d?.edges)return outer;
        let best=Infinity,width=outer;
        for(let i=1;i<d.p.length;i++){
          const a=d.p[i-1],b=d.p[i],dx=b[0]-a[0],dz=b[1]-a[1];
          const t=limit(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
          const dist=(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2;
          if(dist<best){best=dist;const k=Number(sign>0);width=lerp(d.edges[i-1][k],d.edges[i][k],t);}
        }
        return width;
      };
    function deckHeight(x,z,layer,roadId,insideOnly=false){
      let nearest=Infinity,result;
      for(const d of (roadId!=null?byId.get(roadId):localDecks.get(Math.floor(x/40)+','+Math.floor(z/40)))||[]){
        if(d.l!==layer||(roadId!=null&&d.id!==roadId))continue;
        if(x<d.bounds[0]||z<d.bounds[1]||x>d.bounds[2]||z>d.bounds[3])continue;
        for(let i=1;i<d.p.length;i++){
          const a=d.p[i-1],b=d.p[i],dx=b[0]-a[0],dz=b[1]-a[1];
          const along=((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1);
          if(insideOnly&&((i===1&&along<0)||(i===d.p.length-1&&along>1)))continue;
          const t=limit(along,0,1);
          const gap=(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2;
          const side=Number(dx*(z-a[1])-dz*(x-a[0])>0);
          const edge=d.edges&&insideOnly?lerp(d.edges[i-1][side],d.edges[i][side],t):d.w*.5+.43;
          if(gap<nearest&&(!insideOnly||gap<=edge**2)){
            nearest=gap;result=lerp(a[2],b[2],t);
            if(d.bank&&northern.has(d.original)){
              const px=a[0]+t*dx,pz=a[1]+t*dz;
              let total=0,shift=0;
              for(const [idx,bank] of [d.p[0],d.p.at(-1)].entries()){
                if(!d.bank[idx])continue;
                const dist=Math.hypot(px-bank[0],pz-bank[1]),other=idx===0?d.p.at(-1):d.p[0];
                const span=Math.hypot(bank[0]-other[0],bank[1]-other[1]);
                const far=Math.min(1,Math.hypot(px-other[0],pz-other[1])/Math.max(.001,Math.min(24,span)));
                const w=Math.max(0,1-dist/24)**2*far;
                total+=w;shift+=w*(ground(x-px+bank[0],z-pz+bank[1])-bank[2]);
              }
              result+=shift/Math.max(1,total);
            }else if(d.bank){
              const px=a[0]+t*dx,pz=a[1]+t*dz,end=d.p.at(-1);
              const startGap=d.bank[0]?Math.hypot(px-d.p[0][0],pz-d.p[0][1]):Infinity;
              const endGap=d.bank[1]?Math.hypot(px-end[0],pz-end[1]):Infinity,from=Math.min(startGap,endGap);
              if(from<28){
                const bank=startGap<endGap?d.p[0]:end,u=from/28;
                result+=(ground(x-px+bank[0],z-pz+bank[1])-bank[2])*(1-u*u*(3-2*u));
              }
            }
            if(d.westJoin&&Math.abs(x-d.westJoin.x)<8){
              const tie=d.westJoin,sz=z-(x-tie.x)*tie.dzDx;
              const y=tie.oldLayer?deckHeight(tie.x,sz,tie.oldLayer,tie.oldId):ground(tie.x,sz);
              if(y!==undefined){
                const u=Math.min(1,Math.abs(x-tie.x)/8);
                result=lerp(y,result,u*u*(3-2*u));
              }
            }
            if(d.join&&Math.abs(z-d.join.z)<8){
              const tie=d.join,sx=x-(z-tie.z)*tie.dxDz;
              const y=tie.oldLayer?deckHeight(sx,tie.z,tie.oldLayer,tie.oldId):ground(sx,tie.z);
              if(y!==undefined){
                const blend=Math.min(1,Math.abs(z-tie.z)/8);
                result=lerp(y,result,blend*blend*(3-2*blend));
              }
            }
          }
        }
      }
      return result;
    }
    ground.surface=(x,z,layer=0,roadId)=>layer===-2&&tunnel?tunnel.floor(x,z):layer?(deckHeight(x,z,layer,roadId)??(ground(x,z)+4.4*layer)):ground(x,z);
    ground.maxLayer=Math.max(2,...patch.decks.map(d=>d.l));
    ground.overhead=(x,z,level)=>{
      if(level)return deckHeight(x,z,level,undefined,true);
      let lowest=Infinity;
      for(let layer=1;layer<=ground.maxLayer;layer++){
        const y=deckHeight(x,z,layer,undefined,true);if(y!==undefined)lowest=Math.min(lowest,y);
      }
      return Number.isFinite(lowest)?lowest:undefined;
    };
    return ground;
  }
  function canvasTexture(w,h,paint,repeat=false){
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'),w,h);
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    if(repeat)tex.wrapS=tex.wrapT=T.RepeatWrapping;return tex;
  }
  // Each texture covers eight real window bays by eight storeys. The variants
  // distinguish older concrete tenements, stone hotels and curtain-wall towers.
  const facadeStyles=[
    ['#c3b7a2','#dfd8c5','#657d7c','#476368','flat'],
    ['#c3b9a9','#ded5c3','#738b89','#546c70','balcony'],
    ['#aabbad','#d6dfd0','#638682','#405e61','flat'],
    ['#859d9c','#d6dfce','#72969b','#436571','glass'],
    ['#bbac9b','#e2cbbb','#9b9184','#5c7176','balcony'],
    ['#acaaa1','#dbd9c7','#758c90','#445f68','stone'],
    ['#8b9fa0','#bbc8bf','#82a0a5','#4b6b79','glass'],
    ['#ddd4bb','#eee6d3','#8c9b95','#526e74','stone']
  ];
  function facadeTexture(st,seed){
    return canvasTexture(512,512,(c,w,h)=>{
      c.fillStyle=st[0];c.fillRect(0,0,w,h);const rand=rng(seed);
      for(let f=0;f<8;f++)for(let b=0;b<8;b++){
        const x=b*64,y=f*64, mode=st[4], glass=mode==='glass', balcony=mode==='balcony';
        const left=glass?2:mode==='stone'?11:7, top=glass?3:10, winW=64-2*left, winH=glass?48:balcony?34:31;
        c.fillStyle='rgba(62,52,46,'+(rand()*.06)+')';c.fillRect(x,y,64,64);
        c.fillStyle=st[1];c.fillRect(x,y+1,64,glass?2:4);
        c.fillStyle='#697475';c.fillRect(x+left-1,y+top-1,winW+2,winH+3);
        const g=c.createLinearGradient(x,y,x+8,y+55);g.addColorStop(0,st[2]);g.addColorStop(.55,st[3]);g.addColorStop(1,st[2]);c.fillStyle=g;c.fillRect(x+left,y+top,winW,winH);
        if(rand()<.53){c.fillStyle=glass?'#d5edeb24':'#e1e2d288';c.fillRect(x+left+1,y+top+1,winW*.48,2+rand()*(winH*.69));}
        c.fillStyle=st[1];c.fillRect(x+31,y+top,2,winH);c.fillRect(x+left,y+top+winH,winW,2);
        if(glass){c.fillStyle=st[2];c.fillRect(x+1,y+53,62,10);c.fillStyle='#ffffff36';c.fillRect(x+2,y+7,1,40);}
        if(balcony){c.fillStyle='#7e827a';c.fillRect(x+3,y+42,58,15);c.fillStyle=st[1];c.fillRect(x+2,y+40,60,3);c.fillRect(x+2,y+54,60,5);for(let j=6;j<60;j+=7)c.fillRect(x+j,y+43,2,10);}
        else if(!glass&&rand()<.45){c.fillStyle='#787c75';c.fillRect(x+40,y+45,16,9);c.fillStyle='#d3d0be';c.fillRect(x+40,y+44,15,8);c.fillStyle='#8e968c';for(let j=0;j<3;j++)c.fillRect(x+42,y+46+j*2,10,1);}
      }
    },true);
  }
  class Batch {
    constructor(){this.p=[];this.uv=[];this.colors=[];this.idx=[];}
    vert(p,u,v,color){this.p.push(...p);this.uv.push(u,v);this.colors.push(color.r,color.g,color.b);}
    quad(a,b,c,d,col,uv=[0,0,1,1],bottom=col){
      const i=this.p.length/3;this.vert(a,uv[0],uv[1],bottom);this.vert(b,uv[2],uv[1],bottom);this.vert(c,uv[2],uv[3],col);this.vert(d,uv[0],uv[3],col);
      this.idx.push(i,i+1,i+2,i,i+2,i+3);
    }
    mesh(mat,scene,cast=false,receive=true){
      if(!this.idx.length)return;
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));g.setIndex(this.idx);g.computeVertexNormals();g.computeBoundingSphere();
      const m=new T.Mesh(g,mat);m.castShadow=cast;m.receiveShadow=receive;scene.add(m);return m;
    }
  }
  const color = c=>new T.Color(c);
  function tileBins(tile=160){
    const bins=new Map();
    return {get(x,z,k){const key=Math.floor(x/tile)+'/'+Math.floor(z/tile)+'/'+k;if(!bins.has(key))bins.set(key,{k,buf:new Batch()});return bins.get(key).buf;},
      build(mats,scene,cast=false){for(const {k,buf} of bins.values())buf.mesh(mats[k],scene,cast);bins.clear();}};
  }
  function center(poly){let x=0,z=0;for(const p of poly){x+=p[0];z+=p[1];}return [x/poly.length,z/poly.length];}
  function inside(pt,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>pt[1])!==(b[1]>pt[1])&&pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  function ringPath(c,ring){if(!ring||ring.length<3)return;c.moveTo(ring[0][0],ring[0][1]);for(let i=1;i<ring.length;i++)c.lineTo(ring[i][0],ring[i][1]);c.closePath();}
  function polygons(c,rows,style){c.fillStyle=style;for(const p of rows||[]){c.beginPath();ringPath(c,p.p);for(const h of p.holes||[])ringPath(c,h);c.fill('evenodd');}}
  // Draw all connected carriageways in a common surface so joining ways
  // share their asphalt, including where OSM splits a changing lane count.
  function groundRoadRibbons(roads){
    const approaches=new Map(),rows=[],at=p=>p[0]+','+p[1];
    for(const r of roads){if(r.l!==0||r.p.length<2)continue;
      const ends=[0,r.p.length-1].map((i,k)=>{
        const a=r.p[i],b=r.p[k?i-1:i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
        const e={x:(b[0]-a[0])/len,z:(b[1]-a[1])/len,w:r.w/2,key:at(a)};
        if(!approaches.has(e.key))approaches.set(e.key,[]);approaches.get(e.key).push(e);return e;
      });rows.push({r,ends});
    }
    function joinWidth(end){
      const neighbors=approaches.get(end.key),rank=neighbors.map(e=>({e,angle:e.x*end.x+e.z*end.z})).filter(x=>x.angle<-.38).sort((a,b)=>a.angle-b.angle);
      return rank.length?(end.w+rank[0].e.w)/2:end.w;
    }
    const ribbons=[];
    for(const {r,ends} of rows){const distances=[0];for(let i=1;i<r.p.length;i++)distances.push(distances.at(-1)+Math.hypot(r.p[i][0]-r.p[i-1][0],r.p[i][1]-r.p[i-1][1]));
      const total=distances.at(-1),w=r.w*.5,start=joinWidth(ends[0]),end=joinWidth(ends[1]),blend=Math.max(.01,Math.min(11,total*.5)),v=[];
      for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i],len=distances[i]-distances[i-1],n=Math.max(1,Math.ceil(len/4.5));
        for(let j=i===1?0:1;j<=n;j++){const t=j/n,d=distances[i-1]+t*len,ww=w+(start-w)*Math.max(0,1-d/blend)+(end-w)*Math.max(0,1-(total-d)/blend);v.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t),ww]);}
      }ribbons.push({id:r.id,v,s:r.cls==='service'?.9:r.cls==='primary'?2.55:r.cls==='residential'?1.55:2.05});
    }
    return ribbons;
  }
  // Bin the road surface into texture-pixel tiles. A junction is still painted as a
  // single union, while Canvas never has to tessellate unrelated streets together.
  function paintRoadNetwork(c,ribbons,bounds){
    const [x0,z0,x1,z1]=bounds,cw=c.canvas.width,ch=c.canvas.height;
    const tilePx=256,cols=Math.ceil(cw/tilePx),rows=Math.ceil(ch/tilePx);
    const sx=(x1-x0)/cw,sz=(z1-z0)/ch,dx=tilePx*sx,dz=tilePx*sz;
    const cells=Array.from({length:cols*rows},()=>[]);
    for(const road of ribbons){
      for(let i=1;i<road.v.length;i++){
        const a=road.v[i-1],b=road.v[i],pad=Math.max(a[2],b[2])+road.s+Math.max(sx,sz);
        const col0=Math.max(0,Math.floor((Math.min(a[0],b[0])-pad-x0)/dx));
        const col1=Math.min(cols-1,Math.floor((Math.max(a[0],b[0])+pad-x0)/dx));
        const row0=Math.max(0,Math.floor((Math.min(a[1],b[1])-pad-z0)/dz));
        const row1=Math.min(rows-1,Math.floor((Math.max(a[1],b[1])+pad-z0)/dz));
        if(col0>col1||row0>row1)continue;
        const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(!len)continue;
        const segment={a,b,side:road.s,nx:(a[1]-b[1])/len,nz:(b[0]-a[0])/len};
        for(let row=row0;row<=row1;row++)for(let col=col0;col<=col1;col++)cells[row*cols+col].push(segment);
      }
    }
    function paint(pavement,style){
      c.fillStyle=style;
      for(let i=0;i<cells.length;i++){
        if(!cells[i].length)continue;
        const px=(i%cols)*tilePx,py=Math.floor(i/cols)*tilePx;
        c.save();c.beginPath();c.rect(x0+px*sx,z0+py*sz,Math.min(tilePx,cw-px)*sx,Math.min(tilePx,ch-py)*sz);c.clip();
        c.beginPath();
        const caps=new Set();
        for(const {a,b,side,nx,nz} of cells[i]){
          const margin=pavement?side:0,aw=a[2]+margin,bw=b[2]+margin;
          for(const p of [a,b])if(!caps.has(p)){
            caps.add(p);const r=p[2]+margin;c.moveTo(p[0]+r,p[1]);c.arc(p[0],p[1],r,0,TAU);c.closePath();
          }
          c.moveTo(a[0]+nx*aw,a[1]+nz*aw);c.lineTo(a[0]-nx*aw,a[1]-nz*aw);
          c.lineTo(b[0]-nx*bw,b[1]-nz*bw);c.lineTo(b[0]+nx*bw,b[1]+nz*bw);c.closePath();
        }
        c.fill();c.restore();
      }
    }
    const t=document.createElement('canvas');t.width=t.height=96;const tc=t.getContext('2d'),r=rng(47),pix=tc.createImageData(96,96);
    for(let i=0;i<pix.data.length;i+=4){const n=(r()-.5)*10;pix.data[i]=83+n;pix.data[i+1]=89+n;pix.data[i+2]=89+n;pix.data[i+3]=255;}tc.putImageData(pix,0,0);
    const pattern=c.createPattern(t,'repeat');pattern.setTransform(new DOMMatrix().scale(.14));
    const slab=document.createElement('canvas');slab.width=slab.height=32;
    const sc=slab.getContext('2d');sc.fillStyle='#b9b2a3';sc.fillRect(0,0,32,32);
    sc.strokeStyle='#a69f92';sc.lineWidth=1;sc.strokeRect(.5,.5,31,15.5);sc.strokeRect(-15.5,16.5,32,16);sc.strokeRect(16.5,16.5,32,16);
    const paving=c.createPattern(slab,'repeat');paving.setTransform(new DOMMatrix().scale(.065));
    c.save();c.globalAlpha=.95;paint(true,paving);c.globalAlpha=.97;paint(false,pattern);c.restore();
  }
  function landMesh(map,height,scene,ribbons,stream,bake){
    let sheet=0;
    function groundTile(bounds,aerial){
    const [x0,z0,x1,z1]=bounds, w=x1-x0,h=z1-z0;
    const region=sheet++, page=window.HK_GROUND_TILES?.[region];
    const tex=page&&!bake?new T.Texture(window.HK_BASE_GROUNDS[region]):canvasTexture(aerial?aerial.width:2048,aerial?aerial.height:2048,(c,cw,ch)=>{
      c.scale(cw/w,ch/h);c.translate(-x0,-z0);polygons(c,map.land,'#c7c3ad');polygons(c,map.parks,'#92ac76');polygons(c,map.plazas,'#d8cbb5');polygons(c,map.piers,'#bebcb1');
      c.strokeStyle='#d6cfb9';c.lineCap='round';c.lineJoin='round';
      for(const path of map.paths||[]){c.beginPath();c.lineWidth=path.w||2;c.moveTo(...path.p[0]);for(const pt of path.p.slice(1))c.lineTo(...pt);c.stroke();}
      if(aerial){c.globalCompositeOperation='source-atop';c.globalAlpha=.68;c.drawImage(aerial,x0,z0,w,h);c.globalAlpha=1;c.globalCompositeOperation='source-over';}
      for(const path of window.HKMongKokPlaces?.walks||[]){c.strokeStyle='#bcb4a3';c.lineWidth=path.w;c.beginPath();c.moveTo(...path.p[0]);for(const pt of path.p.slice(1))c.lineTo(...pt);c.stroke();}
      window.HKHarbourPlaces?.paint(c);
      window.HKFrontages?.paintPavement(c);
      paintRoadNetwork(c,ribbons,bounds);
      height.underpass?.cutTerrain(c);window.HKNorthWorks?.cutTerrain(c);
      c.save();c.globalCompositeOperation='destination-out';polygons(c,window.HKMongKokPlaces?.mouths,'#fff');c.restore();
    });
    if(bake){bake(region,bounds,tex.image);tex.dispose();return;}
    tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;tex.anisotropy=4;
    const mat=new T.MeshLambertMaterial({map:tex,alphaTest:.3}),materials=new Map();
    function groundMaterial(x,z){
      if(!page)return mat;
      const ix=Math.floor((x-x0)/320),iz=Math.floor((z-z0)/320),k=ix+','+iz;
      if(!materials.has(k)){
        const m=mat.clone();materials.set(k,m);
        stream.putTerrain(m,page.tiles[k],x0+(ix+.5)*320,z0+(iz+.5)*320);
      }
      return materials.get(k);
    }
    function tile(ax,az,bx,bz,step){
      const dx=bx-ax,dz=bz-az;
      const geo=new T.PlaneGeometry(dx,dz,Math.ceil(dx/step),Math.ceil(dz/step));geo.rotateX(-Math.PI/2);geo.translate((ax+bx)/2,0,(az+bz)/2);
      const pos=geo.attributes.position,uv=geo.attributes.uv;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,height(x,z));uv.setXY(i,(x-x0)/w,1-(z-z0)/h);
      }
      geo.computeVertexNormals();const ground=new T.Mesh(geo,groundMaterial((ax+bx)/2,(az+bz)/2));ground.receiveShadow=true;ground.name='Terrain';scene.add(ground);
    }
    function tiled(ax,az,bx,bz,step){
      const span=step*80;
      for(let z=az;z<bz;){
        const endZ=Math.min(z+span,bz,z0+(Math.floor((z-z0)/320)+1)*320);
        for(let x=ax;x<bx;){
          const endX=Math.min(x+span,bx,x0+(Math.floor((x-x0)/320)+1)*320);
          tile(x,z,endX,endZ,step);x=endX;
        }
        z=endZ;
      }
    }
    function partition(ax,az,bx,bz,step,p){
      if(!p){tiled(ax,az,bx,bz,step);return;}
      const east=p.x+(p.nx-1)*p.step,south=p.z+(p.nz-1)*p.step;
      tiled(ax,az,bx,p.z,step);tiled(ax,south,bx,bz,step);
      tiled(ax,p.z,p.x,south,step);tiled(east,p.z,bx,south,step);
      partition(p.x,p.z,east,south,p.step,p.inset);
    }
    if(region>=3)tiled(x0,z0,x1,z1,map.terrain.west.step);
    else if(z0===map.terrain.relief.z)partition(x0,z0,x1,z1,5,map.terrain.relief);
    else if(z1<=window.HKNorth.photoBounds?.[1]) tiled(x0,z0,x1,z1,map.terrain.north.step);
    else {
      const join=map.terrain.join;
      tiled(x0,z0,x1,join.z,map.terrain.north.step);
      tiled(x0,join.z,x1,z1,join.step);
    }
    }
    const south=map.southBounds||map.bounds;
    groundTile(south,window.HK_AERIAL);
    if(map.terrain.north){
      const mid=window.HKNorth.photoBounds||[map.bounds[0],map.bounds[1],map.bounds[2],south[1]];
      groundTile(mid,window.HK_NORTH_AERIAL);
      if(mid[1]>map.bounds[1])groundTile([mid[0],map.bounds[1],mid[2],mid[1]],window.HK_MK_AERIAL);
      if(map.terrain.west)groundTile(HKTaiKokTsui.bounds,window.HK_WEST_AERIAL);
      if(map.terrain.coast)groundTile(HKWestKowloon.bounds,window.HK_COAST_AERIAL);
    }
  }
  function seaWall(map,height,scene){
    const batch=new Batch(),light=color('#afa99b'),dark=color('#788986');
    for(const area of [...map.land,...map.piers]){for(const ring of [area.p,...(area.holes||[])])for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/7));
      if(map.extensionEdge?.(a,b)||map.bounds.some((v,k)=>Math.abs(a[k%2]-v)<.1&&Math.abs(b[k%2]-v)<.1))continue;
      for(let k=0;k<n;k++){const p=[lerp(a[0],b[0],k/n),lerp(a[1],b[1],k/n)],q=[lerp(a[0],b[0],(k+1)/n),lerp(a[1],b[1],(k+1)/n)];
        batch.quad([p[0],-1,p[1]],[q[0],-1,q[1]],[q[0],height(...q)-.08,q[1]],[p[0],height(...p)-.08,p[1]],light,[0,0,1,1],dark);}
    }}batch.mesh(flatBatch(),scene,false);
  }
  function sea(scene,tunnel){
    const tex=canvasTexture(512,512,(c,w,h)=>{
      c.fillStyle='#568e90';c.fillRect(0,0,w,h);const rand=rng(217);
      for(let i=0;i<11500;i++){const x=rand()*w,y=rand()*h,len=1+rand()**3*28;c.strokeStyle=rand()>.46?'rgba(212,232,209,'+(rand()*.38)+')':'rgba(22,76,86,'+(rand()*.34)+')';c.lineWidth=.6+rand()*.9;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+len*.6,y-1,x+len,y-1+rand()*1.2);c.stroke();}
    },true);tex.repeat.set(90,90);
    let plane;
    if(tunnel){
      const boundary=new T.Shape();boundary.moveTo(-3250,-3250);boundary.lineTo(3250,-3250);
      boundary.lineTo(3250,3250);boundary.lineTo(-3250,3250);boundary.closePath();
      const hole=new T.Path();for(const [i,[x,z]] of tunnel.waterHole.entries()){if(i)hole.lineTo(x,-z);else hole.moveTo(x,-z);}
      hole.closePath();boundary.holes.push(hole);
      for(const poly of window.HKNorthWorks?.water||[]){
        const cut=new T.Path(poly.p.map(([x,z])=>new T.Vector2(x,-z)));cut.closePath();boundary.holes.push(cut);
      }
      plane=new T.ShapeGeometry(boundary);
      const p=plane.attributes.position,uv=plane.attributes.uv;
      for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)/6500,.5+p.getY(i)/6500);
    }else plane=new T.PlaneGeometry(6500,6500);
    const m=new T.Mesh(plane,new T.MeshLambertMaterial({map:tex,color:0xeefbfb}));m.rotation.x=-Math.PI/2;m.position.y=-.65;scene.add(m);return tex;
  }
  function flatBatch(){return new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});}
  let instanceKit;
  function instances(scene){
    const dict=new Map(),dummy=new T.Object3D(), planeMat=instanceKit?.material||flatBatch();planeMat.vertexColors=false;
    const geometries=instanceKit?.geometries||{box:new T.BoxGeometry(1,1,1),leaf:new T.IcosahedronGeometry(1,0),crown:new T.IcosahedronGeometry(1,1),pole:new T.CylinderGeometry(1,1,1,7),tank:new T.CylinderGeometry(.9,1,1,10),dome:new T.SphereGeometry(1,36,14,0,Math.PI*2,0,Math.PI/2),ring:new T.CylinderGeometry(1,1,1,36,1,true)};
    if(!instanceKit){instanceKit={material:planeMat,geometries};for(const g of Object.values(geometries))g.userData.shared=true;}
    const add=(key,x,y,z,w,h,d,shade,angle=0)=>{
      const groupKey=Math.floor(x/180)+'/'+Math.floor(z/180)+'/'+key;
      if(!dict.has(groupKey))dict.set(groupKey,{key,rows:[]});dict.get(groupKey).rows.push([x,y,z,w,h,d,shade,angle]);};
    const flush=()=>{for(const {key,rows} of dict.values()){const m=new T.InstancedMesh(geometries[key],planeMat,rows.length);rows.forEach(([x,y,z,w,h,d,col,a],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,a,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,color(col));});m.castShadow=true;m.receiveShadow=true;m.computeBoundingSphere();scene.add(m);}dict.clear();};return {add,flush};
  }
  function wallMaterials(occlude){
    const facades=facadeStyles.map((s,i)=>occlude(new T.MeshLambertMaterial({map:facadeTexture(s,1520+i),vertexColors:true,side:T.DoubleSide})));
    function roofMat(i){
      const mat=occlude(flatBatch()),tex=new T.Texture(window.HK_BASE_GROUNDS[i]);
      tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;tex.needsUpdate=true;mat.map=tex;
      mat.userData.load=()=>{
        if(mat.userData.loading)return;
        mat.userData.loading=true;
        const uri=[window.HK_PHOTO_URI,window.HK_NORTH_PHOTO_URI,window.HK_MK_PHOTO_URI,window.HK_WEST_PHOTO_URI,window.HK_COAST_PHOTO_URI][i];
        new T.TextureLoader().load(uri||['ground.jpg','north.jpg','mong-kok.jpg','tai-kok-tsui.jpg','west-kowloon.jpg'][i],t=>{
          t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;mat.map=t;tex.dispose();
        },undefined,()=>{mat.userData.loading=false;});
      };
      return mat;
    }
    const mallGlass=occlude(new T.MeshLambertMaterial({map:facadeTexture(['#768f99','#bdc8cd','#61909e','#3e6978','glass'],554),vertexColors:true,side:T.DoubleSide}));
    return [...facades,roofMat(0),occlude(flatBatch()),roofMat(1),roofMat(2),mallGlass,...(window.HKTaiKokTsui?[roofMat(3)]:[]),...(window.HKWestKowloon?[roofMat(4)]:[])];
  }
  function buildingGeometry(map,buildings,height,scene,props,mats,frontages){
    const bins=tileBins(),south=map.southBounds||map.bounds;

    const roofWhite=color('#e3dfce');
    function unclose(p){return p.length>2&&p[0][0]===p.at(-1)[0]&&p[0][1]===p.at(-1)[1]?p.slice(0,-1):p;}
    for(const b of buildings){
      if(!b.p||b.p.length<3||HKModels.isReplacedBuilding(b)||window.HKCoastModels?.replaces(b)||window.HKTaiModels?.replaces(b))continue;
      const ring=unclose(b.p), holes=(b.holes||[]).map(unclose), rings=[ring,...holes];
      const rand=rng(7417+Math.imul(Number(b.id)||0,2654435761));
      const [cx,cz]=center(ring),r=rand(),h=Math.max(1.2,b.h||8),buildingHeight=b.sourceH||h;
      const low=b.basePD??b.modelBasePD??(height(cx,cz)+(b.base||0));
      const top=Number.isFinite(b.top)?b.top:low+h;
      const raised=(b.base||0)>2;
      const special=window.HKMongKokStreets,style=window.HKCoastModels?.style(b)??window.HKTaiModels?.style(b)??special?.style(special.ids[b.id])??(b.foundation?5:buildingHeight>67?(r<.42?3:r<.67?6:r<.85?7:5):buildingHeight<8?5:Math.floor(r*8));
      const mid=window.HKNorth?.photoBounds||[south[0],map.bounds[1],south[2],south[1]];
      const district=map.terrain.west && cx<mid[0]?(map.terrain.coast&&cz>=HKWestKowloon.bounds[1]?4:3):cz<mid[1]?2:cz<south[1]?1:0;
      const [x0,z0,x1,z1]=district===4?HKWestKowloon.bounds:district===3?HKTaiKokTsui.bounds:district===2?[mid[0],map.bounds[1],mid[2],mid[1]]:district===1?mid:south;
      const roofIndex=[8,10,11,13,14][district];mats[roofIndex].userData.load();
      const walls=bins.get(cx,cz,style),roof=bins.get(cx,cz,roofIndex);
      const tint=color('#ffffff').multiplyScalar(.83+rand()*.24),base=tint.clone().multiplyScalar(.75);
      rand(); // Preserve the original seeded roof palette draw before the window offset.
      const uvOffset=rand();
      let longest=0,rot=0;
      for(const p of rings)for(let j=0;j<p.length;j++){
        const a=p[j],e=p[(j+1)%p.length],dx=e[0]-a[0],dz=e[1]-a[1],len=Math.hypot(dx,dz);if(len<.06)continue;
        if(len>longest&&p===ring){longest=len;rot=-Math.atan2(dz,dx);}
        // Sample each facade down to the local slope, including valleys between its corners.
        const count=raised?1:Math.max(1,Math.ceil(len/4));
        const foot=t=>{const x=lerp(a[0],e[0],t),z=lerp(a[1],e[1],t);return [x,raised?low:Math.min(height(x,z)-.55,low),z];};
        const u=len/(8*(style===3||style===6||style===12?2.1:3.05)),v=(top-low)/(8*(style===3||style===6||style===12?3.65:3.1));
        const cuts=p===ring?frontages.cuts.get(b)?.get(j):null;
        const breaks=Array.from({length:count+1},(_,k)=>k/count);
        if(cuts){
          for(const [left,right] of cuts)breaks.push(limit(left/len,0,1),limit(right/len,0,1));
          breaks.sort((x,y)=>x-y);
        }
        for(let k=1;k<breaks.length;k++){
          const t0=breaks[k-1],t1=breaks[k];if(t1-t0<1e-7)continue;
          const start=foot(t0),end=foot(t1),mid=len*(t0+t1)*.5;
          let bottom=0;
          if(cuts){
            const cap=cuts.reduce((y,[a,b,index])=>mid>=a&&mid<=b?Math.max(y,frontages.head(index)):y,-Infinity);
            if(cap>=top)continue;
            if(cap>Math.min(start[1],end[1])){
              const low=(start[1]+end[1])/2;
              bottom=v*(cap-low)/Math.max(.01,top-low);
              start[1]=Math.max(start[1],cap);end[1]=Math.max(end[1],cap);
            }
          }
          walls.quad(start,end,[end[0],top,end[2]],[start[0],top,start[2]],tint,[uvOffset+u*t0,bottom,uvOffset+u*t1,v],base);
        }
        if(h>5&&!b.slice&&!b.foundation)roof.quad([a[0],top-.35,a[1]],[e[0],top-.35,e[1]],[e[0],top+.23,e[1]],[a[0],top+.23,a[1]],roofWhite,[(a[0]-x0)/(x1-x0),1-(a[1]-z0)/(z1-z0),(e[0]-x0)/(x1-x0),1-(e[1]-z0)/(z1-z0)]);
      }
      const contour=ring.map(p=>new T.Vector2(...p)), holeVectors=holes.map(p=>p.map(q=>new T.Vector2(...q))), faces=T.ShapeUtils.triangulateShape(contour,holeVectors);
      const index=roof.p.length/3;for(const p of [contour,...holeVectors].flat())roof.vert([p.x,top,p.y],(p.x-x0)/(x1-x0),1-(p.y-z0)/(z1-z0),roofWhite);
      for(const f of faces)roof.idx.push(index+f[2],index+f[1],index+f[0]);
      if(raised){
        const underside=bins.get(cx,cz,9),i=underside.p.length/3,soffit=color('#a19e93');
        for(const p of [contour,...holeVectors].flat())underside.vert([p.x,low,p.y],0,0,soffit);
        for(const f of faces)underside.idx.push(i+f[0],i+f[1],i+f[2]);
      }
      if(b.slice||b.foundation||h<6||longest<7||!inside([cx,cz],ring)||holes.some(p=>inside([cx,cz],p)))continue;
      // Place equipment only where its corners fit the actual surveyed roof.
      function roofBox(x,z,w,d,hh,col){
        const ct=Math.cos(rot),st=Math.sin(rot);
        for(const u of [-w*.53,w*.53])for(const v of [-d*.53,d*.53]){const p=[x+ct*u+st*v,z-st*u+ct*v];if(!inside(p,ring)||holes.some(hole=>inside(p,hole)))return;}
        props.add('box',x,top+hh/2,z,w,hh,d,col,rot);
        props.add('box',x,top+hh+.07,z,w+.18,.14,d+.18,'#ddd8c9',rot);
        if(w>4)props.add('box',x,top+hh+.22,z,w*.54,.25,d*.54,'#8f9a96',rot);
      }
      roofBox(cx,cz,limit(longest*.22,2.4,13),limit(longest*.15,1.8,8),limit(h*.032,1.2,3.7),'#abae9f');
      for(let j=0;j<Math.min(6,Math.floor(longest/9));j++){const a=ring[Math.floor(rand()*ring.length)],u=.2+rand()*.52;roofBox(lerp(cx,a[0],u),lerp(cz,a[1],u),1.25+rand()*2,1.15+rand(),.68+rand()*.6,'#899a95');}
    }
    bins.build(mats,scene,true);
  }
  function roadsAndFurniture(map,height,scene,props,hasSpace,ribbons,signals) {
    const crosswalks=HKCrosswalks.prepare(map,ribbons);
    const bins=tileBins(150),mat=flatBatch(),roadCol=color('#52595b'),minorCol=color('#626665'),curb=color('#c5beb0'),mark=color('#e5e2cf'),yellow=color('#e0b862');
    const pointsByKey=new Map(), key=p=>p[0]+','+p[1];
    for(const r of map.roads)for(let i=1;i<r.p.length;i++)for(const p of [r.p[i-1],r.p[i]])pointsByKey.set(key(p),(pointsByKey.get(key(p))||0)+1);
    let currentRoad;
    const roadY=(x,z,layer)=>(height.surface?.(x,z,layer,currentRoad?.id)??(height(x,z)+4.4*(layer||0)));
    const roadSearch=new Map(), cell=p=>Math.floor(p/44);
    for(const r of map.roads){
      if(r.l<0)continue;
      for(let i=1;i<r.p.length;i++){
        const a=r.p[i-1],b=r.p[i],minx=cell(Math.min(a[0],b[0])-8),maxx=cell(Math.max(a[0],b[0])+8),minz=cell(Math.min(a[1],b[1])-8),maxz=cell(Math.max(a[1],b[1])+8);
        for(let ix=minx;ix<=maxx;ix++)for(let iz=minz;iz<=maxz;iz++){let k=ix+'/'+iz;if(!roadSearch.has(k))roadSearch.set(k,[]);roadSearch.get(k).push({a,b,r});}
      }
    }
    function nearest(x,z){
      let found=null,dist=Infinity;
      for(const s of roadSearch.get(cell(x)+'/'+cell(z))||[]){
        const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],den=dx*dx+dz*dz;if(den<.02)continue;
        const t=limit(((x-s.a[0])*dx+(z-s.a[1])*dz)/den,0,1),px=s.a[0]+t*dx,pz=s.a[1]+t*dz,d=Math.hypot(x-px,z-pz);
        if(d<dist){dist=d;const len=Math.sqrt(den);found={x:px,z:pz,dx:dx/len,dz:dz/len,r:s.r,dist:d};}
      }return found;
    }
    function sharedRoad(x,z,owner,y){
      for(const {a,b,r} of roadSearch.get(cell(x)+'/'+cell(z))||[]){
        if(r===owner)continue;
        const dx=b[0]-a[0],dz=b[1]-a[1],t=limit(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
        if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)>r.w/2+1.25)continue;
        if(Math.abs(height.surface(x,z,r.l,r.id)-y)<1.2)return true;
      }
      return false;
    }
    // Clip paint to the same terrain triangles as the asphalt. A long marking
    // across a ramp or a kerb must not form a chord floating above the surface.
    function groundMark(points,shade,uvAt,lift=uvAt?.031:.025){
      const clip=(list,distance)=>{
        const result=[];let p=list.at(-1),a=distance(p);
        for(const q of list){const b=distance(q);
          if((a<0)!==(b<0)){const t=a/(a-b);result.push([lerp(p[0],q[0],t),lerp(p[1],q[1],t)]);}
          if(b>=0)result.push(q);p=q;a=b;
        }return result;
      };
      const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),cx=xs.reduce((a,b)=>a+b)/xs.length,cz=zs.reduce((a,b)=>a+b)/zs.length;
      const relief=map.terrain.relief,inner=relief?.inset;
      const grid=map.terrain.north&&cz<relief.z?(cz>=map.terrain.join.z?map.terrain.join:map.terrain.north):inner&&cx>=inner.x&&cx<=inner.x+(inner.nx-1)*inner.step&&cz>=inner.z&&cz<=inner.z+(inner.nz-1)*inner.step?inner:relief||map.terrain;
      const step=grid.step,ix=Math.floor((Math.min(...xs)-grid.x)/step),iz=Math.floor((Math.min(...zs)-grid.z)/step);
      const batch=bins.get(cx,cz,uvAt?1:0);
      for(let x=grid.x+ix*step;x<Math.max(...xs);x+=step)for(let z=grid.z+iz*step;z<Math.max(...zs);z+=step){
        let row=points;
        for(const test of [p=>p[0]-x,p=>x+step-p[0],p=>p[1]-z,p=>z+step-p[1]]){row=clip(row,test);if(row.length<3)break;}
        if(row.length<3)continue;
        for(const sign of [1,-1]){
          const tri=clip(row,p=>(step-(p[0]-x)-(p[1]-z))*sign);if(tri.length<3)continue;
          for(const visible of height.underpass?.surfacePaint(tri)||[tri]){
            if(window.HKNorthWorks?.excavated(visible.reduce((v,p)=>v+p[0],0)/visible.length,visible.reduce((v,p)=>v+p[1],0)/visible.length))continue;
            const start=batch.p.length/3;
            for(const p of visible){
              const uv=uvAt?uvAt(...p):[0,0];
              batch.vert([p[0],height(...p)+lift,p[1]],uv[0],uv[1],shade);
            }
            for(let q=1;q<visible.length-1;q++)batch.idx.push(start,start+q,start+q+1);
          }
        }
      }
    }
    // Ribbons share mitred vertices on curves. Short subdivisions follow the DEM.
    function ribbon(a,b,na,nb,left,right,lift,shade,layer=0){
      if(layer===0&&lift<.13&&!currentRoad?.taxiLane)return;
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(length/4));
      const batch=bins.get((a[0]+b[0])/2,(a[1]+b[1])/2,0);
      let lastA,lastB;
      for(let i=0;i<=n;i++){
        const t=i/n,x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t),nx=lerp(na[0],nb[0],t),nz=lerp(na[1],nb[1],t);
        const outer=(currentRoad?.w||0)/2+.43;
        const fit=off=>layer>0?off*(height.deckEdge?.(x,z,currentRoad.id,off,outer)??outer)/outer:off;
        const l=fit(left),r=fit(right),ax=x+nx*l,az=z+nz*l,bx=x+nx*r,bz=z+nz*r;
        const offset=layer?(lift<.02?-.010:lift<.13?.004:.019):lift;
        const pa=[ax,roadY(ax,az,layer)+offset,az],pb=[bx,roadY(bx,bz,layer)+offset,bz];
        if(i){
          if(layer===0)groundMark([lastA,lastB,pb,pa].map(p=>[p[0],p[2]]),shade,undefined,lift<.02?.008:lift<.13?.016:.025);
          else batch.quad(lastA,lastB,pb,pa,shade);
        }lastA=pa;lastB=pb;
      }
    }
    function rect(x,z,dx,dz,halfLength,halfWidth,off,col,l=0,lift=.14){
      const n=[-dz,dx];ribbon([x-dx*halfLength,z-dz*halfLength],[x+dx*halfLength,z+dz*halfLength],n,n,off-halfWidth,off+halfWidth,lift,col,l);
    }
    const random=rng(273),lampCol='#687673',lampHead='#b6b9aa';
    for(const r of map.roads){
      if(r.l<0&&!r.bore)continue;
      currentRoad=r;
      const p=r.p,w=r.w*.5,lanes=r.lanes||Math.max(1,Math.round(r.w/3.45));
      const normals=p.map((a,i)=>{
        const pre=p[Math.max(0,i-1)],post=p[Math.min(p.length-1,i+1)],n0=new T.Vector2(-(a[1]-pre[1]),a[0]-pre[0]).normalize(),n1=new T.Vector2(-(post[1]-a[1]),post[0]-a[0]).normalize();
        const mid=n0.clone().add(n1).normalize(),scale=1/Math.max(.65,Math.abs(mid.dot(i===0?n1:n0)));return [mid.x*scale,mid.y*scale];
      });
      let offset=0;
      for(let i=1;i<p.length;i++){
        const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.08)continue;
        const ux=dx/len,uz=dz/len,na=normals[i-1],nb=normals[i],j0=pointsByKey.get(key(a))>=3,j1=pointsByKey.get(key(b))>=3;
        const side=r.l>0?.43:r.cls==='service'?.5:1.45;
        ribbon(a,b,na,nb,-w-side,w+side,.01,curb,r.l);
        ribbon(a,b,na,nb,-w,w,.084,r.cls==='service'?minorCol:roadCol,r.l);
        if(r.l>0&&map.terrain.relief?.decks.some(d=>d.id===r.id)){
          const edge=w+side,batch=bins.get((a[0]+b[0])/2,(a[1]+b[1])/2,0),count=Math.ceil(len/3);
          const slab=color('#848b89'),girder=color('#707977'), parapet=color('#aeb3af');
          let prev=null;
          for(let q=0;q<=count;q++){
            const t=q/count,x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t),nx=lerp(na[0],nb[0],t),nz=lerp(na[1],nb[1],t);
            const row=[-1,1].map(s=>{
              const rim=height.deckEdge?.(x,z,r.id,s,edge)??edge,xx=x+s*nx*rim,zz=z+s*nz*rim,top=roadY(xx,zz,r.l)-.011;
              const thick=.72,inner=(rim-.42)*s,lip=(rim+.04)*s;
              return {low:[xx,top-thick,zz],top:[xx,top,zz],rail:[xx,top+.88,zz],
                inner:[x+nx*inner,top+.88,z+nz*inner],toe:[x+nx*inner,top+.03,z+nz*inner],
                beam:[x+nx*inner,top-thick-.36,z+nz*inner],lip:[x+nx*lip,top-thick-.22,z+nz*lip]};
            });
            if(prev){
              batch.quad(prev[0].low,prev[1].low,row[1].low,row[0].low,slab);
              for(const k of [0,1]){
                const mid=prev[k].top.map((v,i)=>(v+row[k].top[i])*.5);
                if(sharedRoad(mid[0],mid[2],r,mid[1]))continue;
                batch.quad(prev[k].top,row[k].top,row[k].low,prev[k].low,girder);
                batch.quad(prev[k].rail,row[k].rail,row[k].top,prev[k].top,parapet);
                batch.quad(prev[k].inner,row[k].inner,row[k].rail,prev[k].rail,curb);
                batch.quad(prev[k].toe,row[k].toe,row[k].inner,prev[k].inner,parapet);
                if(q%3===1){
                  const u=k===0?1:-1,px=mid[0]+nx*.428*u,pz=mid[2]+nz*.428*u;
                  props.add('box',px,mid[1]+.67,pz,.24,.095,.025,'#dfc379',-Math.atan2(uz,ux));
                }
                batch.quad(prev[k].low,row[k].low,row[k].lip,prev[k].lip,girder);
                batch.quad(prev[k].lip,row[k].lip,row[k].beam,prev[k].beam,slab);
              }
            }
            prev=row;
          }
        }
        // Round road ends fill the joining wedges at intersections.
        if(r.l>0&&(j0||j1)){
          for(const end of [j0?a:null,j1?b:null])if(end){const batch=bins.get(...end,0),idx=batch.p.length/3;batch.vert([end[0],roadY(...end,r.l)+.006,end[1]],0,0,roadCol);
            for(let q=0;q<=12;q++){const t=q/12*TAU,x=end[0]+Math.cos(t)*w,z=end[1]+Math.sin(t)*w;batch.vert([x,roadY(x,z,r.l)+.006,z],0,0,roadCol);if(q)batch.idx.push(idx,idx+q+1,idx+q);}
          }
        }
        const skipStart=j0?Math.max(4,w*.9):0,skipEnd=j1?Math.max(4,w*.9):0;
        if(lanes>=2){
          for(let d=1.35+((8.4-offset%8.4)%8.4);d<len-.5;d+=8.4){if(d<skipStart||d>len-skipEnd)continue;
            for(let k=1;k<lanes;k++){
              const off=-w+r.w*k/lanes,px=a[0]+ux*d-uz*off,pz=a[1]+uz*d+ux*off;
              if(r.l||!crosswalks.overlaps(px,pz,1.38))rect(px,pz,ux,uz,Math.min(1.38,d,len-d),.075,0,mark,r.l);
            }
          }
        }
        if(r.cls!=='service'&&(!r.l||len>2.8)){
          const s=Math.min(len,skipStart),e=Math.max(0,len-skipEnd);
          if(e-s>(r.l?1.5:.08)){
            const pa=[a[0]+ux*s,a[1]+uz*s],pb=[a[0]+ux*e,a[1]+uz*e];
            const normalAt=t=>r.l?[-uz,ux]:[lerp(na[0],nb[0],t),lerp(na[1],nb[1],t)];
            const start=normalAt(s/len),end=normalAt(e/len);
            for(const side of [-1,1]){
              const off=side*(w-.29);
              ribbon(pa,pb,start,end,off-.057,off+.057,.138,yellow,r.l);
              if(lanes>=2&&r.cls!=='residential')ribbon(pa,pb,start,end,off-side*.21-.05,off-side*.21+.05,.138,yellow,r.l);
            }
          }
        }
        if(lanes>=2&&len>26&&r.cls!=='service'){
          const direction=r.one===-1?-1:1,nn=[-uz,ux],off=(r.one?direction*(r.w/lanes*.5-w):-w*.52),d=len*.50;
          const x=a[0]+ux*d+nn[0]*off,z=a[1]+uz*d+nn[1]*off,bb=bins.get(x,z,0);
          function xy(u,v){const xx=x+ux*u*direction+nn[0]*v,zz=z+uz*u*direction+nn[1]*v;return [xx,roadY(xx,zz,r.l)+.024,zz];}
          const shaft=[xy(-1.9,-.12),xy(-1.9,.12),xy(.18,.12),xy(.18,-.12)],tip=[xy(1.65,0),xy(-.08,-.62),xy(-.08,.62)];
          if(!r.l){if(!crosswalks.overlaps(x,z,2))for(const face of [shaft,tip])groundMark(face.map(p=>[p[0],p[2]]),mark);}
          else{bb.quad(...shaft,mark);const index=bb.p.length/3;for(const q of tip)bb.vert(q,0,0,mark);bb.idx.push(index,index+1,index+2);}
        }
        if(r.w>7&&r.l===0&&len>27){
          for(let d=19+random()*11;d<len-6;d+=32){
            const preferred=r.one===-1?-1:1;
            const side=[preferred,-preferred].find(s=>{
              const x=a[0]+ux*d-uz*(w+1.2)*s,z=a[1]+uz*d+ux*(w+1.2)*s;
              if(!hasSpace(x,z))return false;
              const top=height(x,z)+8.2;
              return [0,1.5].every(reach=>(height.overhead?.(x+uz*reach*s,z-ux*reach*s)??Infinity)>top);
            });
            if(!side)continue;
            const x=a[0]+ux*d-uz*(w+1.2)*side,z=a[1]+uz*d+ux*(w+1.2)*side,y=height(x,z);
            props.add('pole',x,y+3.8,z,.078,7.6,.078,lampCol);props.add('box',x+uz*.52*side,y+7.55,z-ux*.52*side,.12,.13,1.4,lampCol,Math.atan2(-uz,ux));props.add('box',x+uz*1.15*side,y+7.50,z-ux*1.15*side,.45,.15,1.05,lampHead,Math.atan2(ux,uz));
          }
        }
        offset+=len;
      }
    }
    for(const [x,z,deck,angle,width] of map.terrain.relief?.piers||[]){
      const bottom=height(x,z)-.18,top=deck-.78,shaft=top-bottom-.48;
      if(shaft<1.1)continue;
      props.add('box',x,bottom+shaft/2,z,1.16,shaft,1.5,'#90958e',angle);
      props.add('box',x,top-.24,z,1.38,.48,width,'#92978e',angle);
      for(const side of [-1,1]){
        const across=side*width*.29;
        props.add('box',x+Math.sin(angle)*across,top+.055,z+Math.cos(angle)*across,.82,.12,.64,'#4e5753',angle);
      }
    }
    const white=color('#f2eee1');
    HKCrosswalks.draw(crosswalks,groundMark,{amber:color('#ffcb32'),white,stud:color('#e3e6e0'),refuge:curb},props,height);
    for(const h of signals.heads)rect(h.x,h.z,h.dx,h.dz,.10,Math.max(.55,h.width/2-.24),0,white);
    const letters=new T.MeshLambertMaterial({map:canvasTexture(1024,512,HKCrosswalks.stencil),alphaTest:.32,side:T.DoubleSide});
    bins.build([mat,letters],scene);return nearest;
  }
  function greenery(map,height,nearest,props,hasSpace){
    const rand=rng(489), greens=['#698451','#6e8c58','#577951','#839759','#78935e','#66865e'], tall=['#8c9f6c','#86a16d','#779b66'];
    const trees=[];
    function tree(x,z,scale,planted=false){
      if(!planted){const r=nearest(x,z);if(r&&r.dist<r.r.w*.53+.9)return;}
      const y=height(x,z),h=scale*(5+rand()*3.1),shade=greens[Math.floor(rand()*greens.length)];
      if(!hasSpace(x,z)||window.HKDetails?.clearPlanting(x,z))return;
      if([[-1,0],[1,0],[0,1],[0,-1],[0,0]].some(([a,b])=>(height.overhead(x+a*h*.33,z+b*h*.33)??Infinity)<y+h*1.12))return;
      props.add('pole',x,y+h*.33,z,.13*scale,h*.65,.13*scale,'#807761');props.add('crown',x,y+h*.70,z,h*.32,h*.36,h*.31,shade,rand()*TAU);
      props.add('leaf',x+h*.11,y+h*.85,z+h*.04,h*.22,h*.23,h*.23,tall[Math.floor(rand()*tall.length)],rand()*4);trees.push([x,z]);
    }
    for(const [x,z] of map.nodes?.trees||[])tree(x,z,.83+rand()*.35);
    for(const park of map.parks){
      const p=park.p,xx=p.map(v=>v[0]),zz=p.map(v=>v[1]),x0=Math.min(...xx),x1=Math.max(...xx),z0=Math.min(...zz),z1=Math.max(...zz);
      const woodland=park.kind==='wood'||park.kind==='forest', count=Math.min(1700,Math.ceil((x1-x0)*(z1-z0)/(woodland?113:410)));
      for(let i=0;i<count;i++){const x=lerp(x0,x1,rand()),z=lerp(z0,z1,rand());if(inside([x,z],p)&&!(park.holes||[]).some(h=>inside([x,z],h)))tree(x,z,.8+rand()*.45);}
    }
  }
  // Check the full painted junction, including the blended approach widths.
  function pedestrianSpace(map,ribbons,height){
    const cell=(x,z)=>Math.floor(x/32)+'/'+Math.floor(z/32), grid=new Map();
    const radius=.45;
    for(const {v,s:walkWidth} of ribbons)for(let i=1;i<v.length;i++){
      const [ax,az,aw]=v[i-1],[bx,bz,bw]=v[i],dx=bx-ax,dz=bz-az;
      const half=Math.max(aw,bw),reach=half+walkWidth+radius;
      const item={ax,az,dx,dz,lengthSq:dx*dx+dz*dz,limitSq:(half+radius)**2,walkSq:(half+walkWidth-.16)**2};
      for(let ix=Math.floor((Math.min(ax,bx)-reach)/32);ix<=Math.floor((Math.max(ax,bx)+reach)/32);ix++){
        for(let iz=Math.floor((Math.min(az,bz)-reach)/32);iz<=Math.floor((Math.max(az,bz)+reach)/32);iz++){
          const key=ix+'/'+iz;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(item);
        }
      }
    }
    const land=[...map.land,...map.piers];
    const buildings=new Map();
    for(const b of map.buildings){
      const xs=b.p.map(p=>p[0]),zs=b.p.map(p=>p[1]);
      const item={b,minX:Math.min(...xs)-radius,maxX:Math.max(...xs)+radius,minZ:Math.min(...zs)-radius,maxZ:Math.max(...zs)+radius};
      for(let ix=Math.floor(item.minX/32);ix<=Math.floor(item.maxX/32);ix++)
        for(let iz=Math.floor(item.minZ/32);iz<=Math.floor(item.maxZ/32);iz++){
          const key=ix+'/'+iz;
          if(!buildings.has(key))buildings.set(key,[]);
          buildings.get(key).push(item);
        }
    }
    const contains=(area,p)=>inside(p,area.p)&&!(area.holes||[]).some(h=>inside(p,h));
    return (x,z,walkwayOnly=false)=>{
      if(height.underpass?.blocks(x,z,0,.95))return false;
      let onWalkway=false;
      const deck=height.overhead?.(x,z);
      if(deck!==undefined&&deck<height(x,z)+2.3)return false;
      for(const s of grid.get(cell(x,z))||[]){
        const t=limit(((x-s.ax)*s.dx+(z-s.az)*s.dz)/(s.lengthSq||1),0,1);
        const gap=(x-s.ax-t*s.dx)**2+(z-s.az-t*s.dz)**2;
        if(gap<=s.limitSq)return false;
        if(gap<=s.walkSq)onWalkway=true;
      }
      if(walkwayOnly&&!onWalkway)return false;
      if(!land.some(a=>contains(a,[x,z])))return false;
      for(const {b,minX,maxX,minZ,maxZ} of buildings.get(cell(x,z))||[]){
        if(x<minX||x>maxX||z<minZ||z>maxZ)continue;
        if(b.base>2&&b.basePD>height(x,z)+2)continue;
        if([[x,z],[x-radius,z-radius],[x+radius,z-radius],[x-radius,z+radius],[x+radius,z+radius]].some(p=>contains(b,p)))return false;
      }
      return true;
    };
  }
  function streetDetails(map,height,nearest,scene,props,hasSpace,frontages){
    const rnd=rng(593), mats=new Map(), signMeshes=new Map();
    // Painted bilingual signs use the name of the nearest mapped street.
    function signMaterial(text,sub,mode){
      const key=[text,sub,mode].join('|');if(mats.has(key))return mats.get(key);
      const tex=canvasTexture(512,128,c=>{
        c.fillStyle=mode==='road'?'#ebeee5':mode==='stop'?'#f1ead7':'#225450';c.fillRect(0,0,512,128);
        c.fillStyle=mode==='stop'?'#ac493d':mode==='road'?'#314340':'#f6eedc';
        if(mode==='road'){c.fillRect(0,0,512,7);c.fillRect(0,121,512,7);}
        if(mode==='stop')c.fillRect(0,0,22,128);
        c.textAlign='center';c.font='bold 49px "PingFang HK",sans-serif';c.fillText(text,256,58,475);
        c.font='600 33px Arial,sans-serif';c.fillText(sub,256,104,470);
      });
      const mat=new T.MeshLambertMaterial({map:tex,side:T.DoubleSide});mats.set(key,mat);return mat;
    }
    function sign(x,y,z,ux,uz,w,h,mat){
      if(!signMeshes.has(mat))signMeshes.set(mat,new Batch());const buf=signMeshes.get(mat),white=color('#ffffff');
      const a=[x-ux*w*.5,y-h*.5,z-uz*w*.5],b=[x+ux*w*.5,y-h*.5,z+uz*w*.5];
      buf.quad(a,b,[b[0],y+h*.5,b[2]],[a[0],y+h*.5,a[2]],white);
    }
    const coats=['#50788b','#e8c3a8','#486b65','#bb796a','#637b93','#e1dec8','#b2a668','#7792a6'];
    function walker(x,z,a,ux,uz,side){
      // A shift along the kerb often finds a place beyond the junction mouth.
      const spot=[[0,0],[-1.8,0],[1.8,0],[0,.85],[-3,.85],[3,.85]].map(([along,out])=>
        [x+ux*along-uz*out*side,z+uz*along+ux*out*side]).find(([px,pz])=>hasSpace(px,pz,true));
      if(!spot)return;
      [x,z]=spot;
      const y=height(x,z),h=.92+rnd()*.16,sx=Math.cos(a)*.095,sz=-Math.sin(a)*.095;
      for(const side of [-1,1])props.add('box',x+side*sx,y+.40*h,z+side*sz,.145,.80*h,.21,'#424d51',a);
      props.add('box',x,y+1.07*h,z,.42,.70*h,.25,coats[Math.floor(rnd()*coats.length)],a);
      props.add('crown',x,y+1.56*h,z,.135,.172,.14,'#c99979',a);props.add('leaf',x,y+1.66*h,z,.14,.11,.145,'#44433a',a);
    }
    const placed=[], flags=HKDetails.atlas(.5), flagMesh=HKDetails.signBatch();
    const stopGroup=new T.Group();stopGroup.name='巴士站牌';stopGroup.userData.stops=[];
    const stops=[...HK_DETAIL_DATA.stops,...(window.HK_STOPS||[]),...(window.HKMongKokPlaces?.stops||[])];
    function stopFace(entry,x,y,z,ux,uz,w,h){
      for(const side of [-1,1]){
        const point=(u,v)=>[x+ux*u*side-uz*.080*side,y+v,z+uz*u*side+ux*.080*side];
        flagMesh.quad(entry,[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)]);
      }
    }
    for(const [x,z,name,en,routes,stopId] of stops){
      const s=nearest(x,z);if(!s||s.r.l!==0||s.dist>19||s.r.w<4)continue;
      const side=(x-s.x)*(-s.dz)+(z-s.z)*s.dx<0?-1:1,off=(s.r.w*.5+1.15)*side;
      const px=s.x-s.dz*off,pz=s.z+s.dx*off,ux=s.dx,uz=s.dz,angle=-Math.atan2(uz,ux),y=height(px,pz);
      if(![-.48,0,.48].every(d=>hasSpace(px+ux*d,pz+uz*d))||placed.some(p=>Math.hypot(p[0]-px,p[1]-pz)<(stopId?3.3:12)))continue;
      const overhead=height.overhead?.(px,pz);if(overhead!==undefined&&overhead-y<3.4)continue;
      placed.push([px,pz]);stopGroup.userData.stops.push({x:px,z:pz,name,en,routes,stopId});
      const tint=routes?'#b63338':'#3b6964';
      props.add('pole',px,y+1.51,pz,.059,3.02,.059,'#b5b8ab');
      const flag=flags.add((c,w,h)=>{
        c.fillStyle=tint;c.beginPath();c.ellipse(w/2,h/2,w*.49,h*.48,0,0,TAU);c.fill();
        c.fillStyle='#f6f2df';c.beginPath();c.ellipse(w/2,h*.54,w*.418,h*.365,0,0,TAU);c.fill();
        c.scale(w/h,1);HKDetails.lettering(c,routes?'KMB':'BUS',h/2,57,'bold 33px',tint,99);
        HKDetails.lettering(c,routes?'九龍巴士':'巴士站',h/2,84,'bold 14px',tint,90);
      });
      const info=flags.add((c,w,h)=>{
        c.fillStyle='#f0eedd';c.fillRect(0,0,w,h);c.fillStyle=tint;c.fillRect(0,0,w,65);
        c.scale(w/166,1);HKDetails.lettering(c,name||'巴士站',83,23,'bold 24px','#fff8e8',153);
        HKDetails.lettering(c,en||'BUS STOP',83,51,'bold 13px','#f8ebdf',154);
        HKDetails.lettering(c,routes?routes.slice(0,5).join('  '):'巴 士 站',83,94,'bold 26px','#283938',155);
      });
      stopFace(flag,px,y+2.90,pz,ux,uz,.64,.66);stopFace(info,px,y+1.99,pz,ux,uz,.83,.63);
      if(rnd()<.62&&[.35,1.8,3,4.3,5.65].every(d=>[-.87,.87].every(o=>hasSpace(px+ux*d-uz*o,pz+uz*d+ux*o)))){
        const xx=px+ux*3,zz=pz+uz*3;
        for(const n of [-2.0,2.0])for(const l of [-.47,.47]){const fx=xx+ux*n-uz*l,fz=zz+uz*n+ux*l;props.add('pole',fx,height(fx,fz)+1.19,fz,.055,2.38,.055,'#818f88');}
        props.add('box',xx,y+2.46,zz,5.2,.16,1.72,'#bbc7bd',angle);
        props.add('box',xx+uz*.77*side,y+2.39,zz-ux*.77*side,5.1,.11,.10,routes?'#a43a3a':'#51776b',angle);
        props.add('box',xx,y+.49,zz,3.3,.12,.46,'#85948c',angle);
        for(const u of [-1.35,-.45,.45,1.35])props.add('box',xx+ux*u,y+.57,zz+uz*u,.05,.24,.41,'#bbc3b8',angle);
        for(const u of [-1.26,1.26])props.add('box',xx+ux*u,y+.23,zz+uz*u,.16,.46,.34,'#626e6d',angle);
        const back=.50*side;
        props.add('box',xx-uz*back,y+1.04,zz+ux*back,3.3,.07,.07,'#b2beb4',angle);
      }
      for(let i=0;i<1+Math.floor(rnd()*4);i++){const d=1+rnd()*6.5,o=(rnd()-.4)*1.15;walker(px+ux*d-uz*o,pz+uz*d+ux*o,angle+rnd()*.7,ux,uz,side);}
    }
    flagMesh.finish(stopGroup);scene.add(stopGroup);
    const boardPositions=[];
    for(const [x,z] of map.nodes.crossings||[]){
      const s=nearest(x,z);if(!s||s.r.l!==0||s.r.w<6||s.dist>10)continue;
      const side=(x-s.x)*(-s.dz)+(z-s.z)*s.dx<0?-1:1,w=s.r.w*.5+1.1,ux=s.dx,uz=s.dz,angle=-Math.atan2(uz,ux),px=s.x-uz*w*side,pz=s.z+ux*w*side,y=height(px,pz);
      if(boardPositions.some(p=>Math.hypot(p[0]-px,p[1]-pz)<11))continue;boardPositions.push([px,pz]);
      if(s.r.n&&rnd()<.4&&[-1,0,1].every(d=>hasSpace(px+ux*d,pz+uz*d))){props.add('pole',px,y+1.28,pz,.058,2.56,.058,'#888e84');sign(px,y+2.17,pz,ux,uz,2.0,.49,signMaterial(s.r.n,s.r.en||'','road'));}
      if(rnd()<.78)walker(px+ux*.9,pz+uz*.9,angle,ux,uz,side);
      for(const direction of [-1,1]){const n=3+Math.floor(rnd()*4);
        for(let j=0;j<n;j++){const d=direction*(3.5+j*1.55),xx=px+ux*d,zz=pz+uz*d,yy=height(xx,zz),near=nearest(xx,zz);if(!near||![0,.52,1.04,1.55].every(q=>hasSpace(xx+ux*q*direction,zz+uz*q*direction)))break;
          props.add('pole',xx,yy+.47,zz,.041,.94,.041,'#919b92');if(j+1<n)for(const level of [.50,.90])props.add('box',xx+ux*.775*direction,yy+level,zz+uz*.775*direction,1.55,.055,.055,'#a5ada2',angle);
        }
      }
    }
    const shops=['茶餐廳','冰室','鐘錶','藥房','找換','海味','餅家','眼鏡','書店'],eng=['CAFE','CAFE','WATCHES','PHARMACY','EXCHANGE','SEAFOOD','BAKERY','OPTICAL','BOOKS'];
    const shopMats=shops.map((name,i)=>signMaterial(name,eng[i],'shop'));
    for(const b of map.buildings){
      if(window.HKMongKokStreets?.owners.has(b.id))continue;
      if(b.foundation||b.slice||(b.base||0)>2||(b.h||0)<7||HKModels.isReplacedBuilding(b)||rnd()>.48)continue;
      const ring=b.p;let chosen=null;
      for(let i=0;i<ring.length;i++){
        const p=ring[i],q=ring[(i+1)%ring.length],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);
        if(len<5||len>38)continue;
        const x=(p[0]+q[0])/2,z=(p[1]+q[1])/2,s=nearest(x,z);
        if(!s||s.dist<s.r.w*.45||s.dist>s.r.w*.5+6||s.r.l!==0||s.r.w>18)continue;
        if(!chosen||s.dist<chosen.s.dist)chosen={x,z,s,dx:dx/len,dz:dz/len,len};
      }
      if(!chosen)continue;const {x,z,s,dx,dz,len}=chosen;
      const d=Math.hypot(s.x-x,s.z-z)||1,nx=(s.x-x)/d,nz=(s.z-z)/d,y=height(x,z),angle=-Math.atan2(dz,dx),width=Math.min(len*.77,5.7),i=Math.floor(rnd()*shops.length);
      const extra=rnd()<.35;
      if(frontages.owners.has(b.id))continue;
      props.add('box',x+nx*.32,y+3.4,z+nz*.32,width,.36,.95,'#737c73',angle);
      sign(x+nx*.9,y+3.36,z+nz*.9,dx,dz,width,.84,shopMats[i]);
      if(extra){props.add('box',x+nx*.52,y+5.15,z+nz*.52,.13,1.52,1.05,'#aa6553',angle);}
    }
    for(const [mat,buf] of signMeshes)buf.mesh(mat,scene,false);
  }
  function ferry(scene,x,z,rotation){
    const group=new T.Group(),mat=c=>new T.MeshLambertMaterial({color:c});
    function box(w,h,d,c,xx,y,zz){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(xx,y,zz);group.add(m);}
    function deck(w,length,y,depth,c){
      const s=new T.Shape();s.moveTo(-w/2,-length*.32);s.quadraticCurveTo(-w/2,-length*.47,0,-length/2);s.quadraticCurveTo(w/2,-length*.47,w/2,-length*.32);s.lineTo(w/2,length*.32);s.quadraticCurveTo(w/2,length*.47,0,length/2);s.quadraticCurveTo(-w/2,length*.47,-w/2,length*.32);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:5});geo.rotateX(-Math.PI/2);const mesh=new T.Mesh(geo,mat(c));mesh.position.y=y;group.add(mesh);
    }
    deck(8.5,31,-1,1.8,'#285b50');deck(8.7,31,.82,.3,'#c3b797');box(6.3,1.75,21,'#305e53',0,1.95,0);deck(8.3,28,2.85,.26,'#e1dcc7');box(6,1.5,19.4,'#456a68',0,3.85,0);
    for(const side of [-1,1])for(let i=-5;i<=5;i++)box(.13,1.65,.16,'#e6e2cf',side*3.08,3.85,i*1.75);
    deck(7.4,25,4.68,.35,'#eeead8');box(4.2,1.38,4.3,'#d3d4bd',0,5.68,-4);box(3.85,.61,.1,'#45656b',0,5.81,-6.18);box(1,1.45,1.4,'#7d785e',0,5.55,1);
    group.position.set(x,0,z);group.rotation.y=rotation;scene.add(group);return group;
  }
  function trafficLamps(system,scene,height,props,hasSpace){
    const black='#303a37',pole='#687772',faces=system.heads,positions=new T.Object3D();
    const bulbs=new T.InstancedMesh(new T.SphereGeometry(.116,10,6),new T.MeshBasicMaterial(),faces.length*3);
    const on=[color('#ff554a'),color('#ffd14f'),color('#50ee95')],off=[color('#603b38'),color('#58513d'),color('#304e42')];
    const cache=new Array(faces.length);
    faces.forEach((h,i)=>{
      const dx=Math.sin(h.yaw),dz=-Math.cos(h.yaw);
      let x=h.poleX,z=h.poleZ;
      if(!hasSpace(x,z)){
        const dir=Math.atan2(z-h.z,x-h.x);
        search:for(let r=.65;r<24;r+=.7)for(const turn of [0,.45,-.45,1,-1,1.57,-1.57,2.3,-2.3,Math.PI]){
          const xx=x+Math.cos(dir+turn)*r,zz=z+Math.sin(dir+turn)*r;
          if(hasSpace(xx,zz)){x=xx;z=zz;break search;}
        }
      }
      const y=height(x,z);
      props.add('pole',x,y+1.60,z,.084,3.2,.084,pole);
      props.add('box',x,y+3.30,z,.48,1.21,.28,black,-h.yaw);
      for(let j=0;j<3;j++){
        const cy=y+3.70-j*.39;props.add('box',x-dx*.1,cy+.155,z-dz*.1,.36,.07,.40,black,-h.yaw);
        positions.position.set(x-dx*.151,cy,z-dz*.151);positions.updateMatrix();bulbs.setMatrixAt(i*3+j,positions.matrix);bulbs.setColorAt(i*3+j,off[j]);
      }
    });bulbs.computeBoundingSphere();scene.add(bulbs);
    const lineMat=new T.MeshBasicMaterial({color:0xff7366,side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false});
    const lineGeometry=new T.BufferGeometry();
    lineGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(18),3));
    lineGeometry.setIndex([0,1,2,0,2,3,0,4,5,0,5,1]);
    const line=new T.Mesh(lineGeometry,lineMat);line.frustumCulled=false;line.visible=false;scene.add(line);
    let age=1;
    return (dt,approach)=>{
      age+=dt;
      if(age>.13){age=0;let changed=false;faces.forEach((h,i)=>{
        const phase=system.phaseFor(h);if(cache[i]===phase)return;cache[i]=phase;changed=true;
        const lit=[phase==='red'||phase==='redAmber',phase==='amber'||phase==='redAmber',phase==='green'];
        for(let j=0;j<3;j++)bulbs.setColorAt(i*3+j,lit[j]?on[j]:off[j]);
      });if(changed)bulbs.instanceColor.needsUpdate=true;}
      line.visible=!!approach;
      if(approach){const {head:h,phase}=approach;
        const points=lineGeometry.attributes.position,half=Math.max(.8,(h.width-.42)/2);
        const dx=Math.sin(h.yaw),dz=-Math.cos(h.yaw);
        for(let i=0;i<4;i++){
          const across=(i===0||i===3)?-half:half,along=i<2?-.21:.21;
          const x=h.x-dz*across+dx*along,z=h.z+dx*across+dz*along;
          const y=height(x,z)+.10;points.setXYZ(i,x,y,z);
          if(i<2)points.setXYZ(i+4,x,y+.10,z);
        }
        points.needsUpdate=true;
        lineMat.color.set(phase==='red'?0xff7467:phase==='green'?0x6cdca2:0xffcd59);
      }
    };
  }
  function addSky(scene){
    const material=new T.ShaderMaterial({
      side:T.BackSide,depthTest:false,depthWrite:false,
      uniforms:{horizon:{value:color('#d5dfdc')},zenith:{value:color('#82adc3')}},
      vertexShader:`varying vec3 skyDirection;
        void main(){skyDirection=position; vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);gl_Position=p.xyww;}`,
      fragmentShader:`uniform vec3 horizon;uniform vec3 zenith;varying vec3 skyDirection;
        void main(){float t=clamp(normalize(skyDirection).y,0.0,1.0);
          gl_FragColor=vec4(mix(horizon,zenith,pow(t,.54)),1.0);
          #include <colorspace_fragment>
        }`
    });
    const sky=new T.Mesh(new T.SphereGeometry(1,24,14),material);
    sky.frustumCulled=false;sky.renderOrder=-1000;scene.add(sky);
  }
  function create(canvas,map,sim,signals,height=groundSampler(map.terrain)){
    const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));renderer.setClearColor(0xc3d6cf);
    const scene=new T.Scene();scene.fog=new T.FogExp2(0xd3dbd1,.00121);
    const cam=new T.PerspectiveCamera(65,1,.08,3100);addSky(scene);
    scene.add(new T.HemisphereLight(0xf4f6ee,0xa8aea3,1.60));
    const sun=new T.DirectionalLight(0xfff1db,2.12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-205,right:205,top:205,bottom:-205,near:1,far:740});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00026;sun.shadow.normalBias=.20;scene.add(sun,sun.target);
    const pivot={value:new T.Vector3()}, params={value:new T.Vector2(1,1)}, depth={value:150}, vanish={value:60};
    // A feathered, screen-space cutaway reveals the taxi only on faces between
    // the camera and its roof. Distant streets keep their full building height.
    function occlude(mat){
      const original=mat.onBeforeCompile;
      mat.onBeforeCompile=(shader,renderer)=>{original.call(mat,shader,renderer);
        Object.assign(shader.uniforms,{uFocus: pivot,uResolution:params,uFocusDepth:depth,uRadius:vanish});
        shader.vertexShader='varying float vSightDepth;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvSightDepth=-mvPosition.z;');
        shader.fragmentShader='varying float vSightDepth; uniform vec3 uFocus; uniform vec2 uResolution; uniform float uFocusDepth; uniform float uRadius;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
          if (vSightDepth < uFocusDepth-2.8) {
            vec2 d=gl_FragCoord.xy-uFocus.xy; d.y*=1.03;
            float fade=smoothstep(uRadius*.68,uRadius,length(d));
            if(fade<.999){float tile=mod(2.0*mod(gl_FragCoord.x,2.0)+3.0*mod(gl_FragCoord.y,2.0),4.0)*.25;
              if(fade<tile+.17)discard;}
          }`);};mat.needsUpdate=true;return mat;
    }
    window.HKDetails?.prepare(map.buildings);
    const ribbons=groundRoadRibbons(map.roads);
    const frontages=HKFrontages.context(map,height);
    const hasSpace=pedestrianSpace(map,ribbons,height);
    const mats=wallMaterials(occlude),street=window.HKMongKokStreets;
    const skyMat=occlude(flatBatch());
    const stream=HKScenery.create(scene,c=>{
      const g=new T.Group(),props=instances(g),signs=HKDetails.signBatch();
      for(const row of c.props)props.add(...row);
      buildingGeometry(map,c.buildings,height,g,props,mats,frontages);
      if(street){
        for(const b of c.buildings){
          street.building(b,props,signs,height);
          window.HKTaiModels?.building(b,props,signs,height,g);
          window.HKCoastModels?.building(b,props,signs,height,g);
        }
        for(const r of c.facades)street.storefront(r,props,signs,height);
        for(const r of c.stalls)street.stall(r,props,height,signs,hasSpace);
        for(const [x,z,ref] of c.entrances){
          if(!hasSpace(x,z))continue;
          const y=height(x,z);
          const station=window.HKWestExits?.[Math.round(x*10)+','+Math.round(z*10)];
          if(station&&window.HKCoastModels){HKCoastModels.entrance(props,signs,x,y,z,ref,station);continue;}
          props.add('box',x,y+1.70,z,.19,3.4,.19,'#7f8d90');
          props.add('box',x,y+3.05,z,.94,.85,.21,'#a52a39');
          street.entrance(signs,x,y+3.05,z,ref);
        }
      }
      signs.finish(g);props.flush();return g;
    },buildings=>{
      const batch=new Batch();
      for(const b of buildings){
        if(HKModels.isReplacedBuilding(b)||b.h<6||b.foundation)continue;
        const p=b.p,[cx,cz]=center(p),top=b.top??(height(cx,cz)+b.h),base=(b.base||0)>2?b.basePD:Math.min(height(cx,cz)-1,b.basePD??Infinity);
        if(window.HKCoastModels?.distant(b,batch))continue;
        const shade=color(b.h>60?'#80969a':'#aea999');
        for(let i=0;i<p.length;i++){
          const [x,z]=p[i],[u,v]=p[(i+1)%p.length];
          batch.quad([x,base,z],[u,base,v],[u,top,v],[x,top,z],shade);
        }
        const loops=[p,...(b.holes||[])].map(r=>r.map(q=>new T.Vector2(...q))),index=batch.p.length/3;
        for(const q of loops.flat())batch.vert([q.x,top,q.y],0,0,shade);
        for(const [a,b,c] of T.ShapeUtils.triangulateShape(loops[0],loops.slice(1)))batch.idx.push(index+c,index+b,index+a);
      }
      const group=new T.Group();return batch.mesh(skyMat,group)?group:null;
    });
    for(const b of map.buildings){if(b.p?.length>=3)stream.bucket(...center(b.p)).buildings.push(b);}
    for(const type of ['facades','stalls','entrances'])for(const row of street?.data[type]||[])stream.bucket(row[0],row[1])[type].push(row);
    const water=sea(scene,height.underpass);height.underpass?.draw(scene);window.HKNorthWorks?.tunnels(scene,height);
    landMesh(map,height,scene,ribbons,stream);seaWall(map,height,scene);
    const props=instances(scene),nearest=roadsAndFurniture(map,height,scene,props,hasSpace,ribbons,signals);
    const localProps={add(...row){stream.bucket(row[1],row[3]).props.push(row);}};
    window.HKCoastModels?.landscape(localProps,height,hasSpace);
    greenery(map,height,nearest,localProps,hasSpace);streetDetails(map,height,nearest,scene,localProps,hasSpace,frontages);
    stream.initialize();
    street?.bridges(scene,height,{Batch,flatBatch,color},props);
    const updateDropBay=HKTaxiStands.draw(scene,sim.taxiStands,height,props);
    const drawLamps=trafficLamps(signals,scene,height,props,hasSpace);props.flush();
    HKFrontages.draw(frontages,scene,height,{tileBins,flatBatch,color});
    const landmarks=HKModels.addLandmarks(scene,height,map.buildings);
    const handled=new Set();for(const item of landmarks||[])item.mesh?.traverse(o=>{if(!o.isMesh)return;for(const mat of [].concat(o.material))if(!handled.has(mat)){handled.add(mat);occlude(mat);}});
    const playerTaxi=HKModels.createPlayerTaxi(),car=playerTaxi.car;scene.add(car);
    // Keep moving shadows attached to the wheels; the large static city shadow
    // map is refreshed only when its footprint moves.
    const contactTex=canvasTexture(96,192,c=>{
      c.shadowColor='#151e1b';c.shadowBlur=7;c.fillStyle='#1b231e';c.beginPath();c.roundRect(12,16,72,160,13);c.fill();
    });
    const contactMat=new T.MeshBasicMaterial({map:contactTex,transparent:true,opacity:.38,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    function addContact(group,bus){
      group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
      const blob=new T.Mesh(new T.PlaneGeometry(bus?3.23:2.38,bus?13.75:5.64),contactMat);
      blob.rotation.x=-Math.PI/2;blob.position.set(.09,.012,.065);group.add(blob);
    }
    addContact(car,false);
    const driver=HKCockpit.create(renderer,scene);
    const focusRing=new T.Mesh(new T.RingGeometry(3.05,3.30,64),new T.MeshBasicMaterial({color:0xffcc55,side:T.DoubleSide,transparent:true,opacity:.88,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4}));focusRing.rotation.x=-Math.PI/2;scene.add(focusRing);
    const pointer=new T.Shape();pointer.moveTo(0,-.95);pointer.lineTo(.74,.55);pointer.lineTo(0,.27);pointer.lineTo(-.74,.55);pointer.closePath();
    const pointerGeo=new T.ShapeGeometry(pointer);pointerGeo.rotateX(Math.PI/2);
    const tip=new T.Mesh(pointerGeo,new T.MeshBasicMaterial({color:0xffcf62,side:T.DoubleSide}));scene.add(tip);
    const vessels=[ferry(scene,-300,410,.72),ferry(scene,-520,280,1.48)];
    const focus=new T.Vector3(sim.state.x,0,sim.state.z),look=new T.Vector3(),v=new T.Vector3(),size=new T.Vector2(),sunFocus=new T.Vector2(1e8,1e8);
    const presets=[{name:'第一身駕駛席'},{name:'近距離跟車',chase:true},{name:'斜俯跟車',height:78,dist:57,bearing:-1.39},{name:'垂直俯視',height:94,dist:0.6,bearing:0},{name:'街區鳥瞰',height:195,dist:155,bearing:-1.31}];
    let mode=0,chaseAngle=.58,zoom=1,driverZoom=1,clock=0,routeObj=null,lastPath=null,shadowTime=0,traffic=null,trafficMeshes=[];
    if(window.HKTraffic){traffic=HKTraffic.create(map,sim,signals);trafficMeshes=traffic.vehicles.map(v=>{const mesh=HKModels.createVehicle(v.kind,v.color);addContact(mesh,v.kind==='bus');scene.add(mesh);return mesh;});}
    function roadway(x,z,level){
      return height.surface?.(x,z,level)??(height(x,z)+4.4*level);
    }
    function groundCar(mesh,c,player=false){
      const x=c.x,z=c.z,yaw=c.yaw,dx=Math.sin(yaw),dz=-Math.cos(yaw);
      let level=c.layer??c.l??0;
      if(player&&c.layer==null){const r=sim.nearestRoad(x,z);level=r?.road?.l||0;}
      const along=c.kind==='bus'?2.9:1.36,across=c.kind==='bus'?.92:.76;
      const wheels=(f,s)=>roadway(x+dx*f-dz*s,z+dz*f+dx*s,level);
      const fr=wheels(along,across),fl=wheels(along,-across),rr=wheels(-along,across),rl=wheels(-along,-across);
      const y=(fr+fl+rr+rl)*.25;
      mesh.rotation.order='YXZ';mesh.position.set(x,y+.04,z);mesh.rotation.y=-yaw;
      mesh.rotation.x=Math.atan2((fr+fl-rr-rl)*.5,along*2);
      mesh.rotation.z=Math.atan2((fr+rr-fl-rl)*.5,across*2);
      if(player){focusRing.position.set(x,y+.08,z);tip.position.set(x+dx*4.25,y+.12,z+dz*4.25);tip.rotation.y=-yaw;}
    }
    function routeDraw(route){
      if(lastPath===route?.points)return;
      lastPath=route?.points;if(routeObj){scene.remove(routeObj);routeObj.geometry.dispose();routeObj.material.dispose();routeObj=null;}
      if(!route||route.arrived)return;
      const buf=new Batch(),c=color('#6edece');
      for(let i=1;i<route.points.length;i++){
        const a=route.points[i-1],b=route.points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.1)continue;const nx=-dz/len*.32,nz=dx/len*.32;
        const level=route.layers?.[i-1]||0;
        for(let d=0;d<len;d+=6){const e=Math.min(len,d+4),p=[a[0]+dx*d/len,a[1]+dz*d/len],q=[a[0]+dx*e/len,a[1]+dz*e/len];
          const corner=(p,side)=>{const x=p[0]+side*nx,z=p[1]+side*nz;return [x,roadway(x,z,level)+.075,z];};
          buf.quad(corner(p,-1),corner(p,1),corner(q,1),corner(q,-1),c);}
      }
      routeObj=buf.mesh(new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}),scene,false,false);
    }
    function setLens(){
      const inside=mode===0;
      // Leave enough horizontal road visible in portrait orientation.
      const portraitFov=2*Math.atan(Math.tan(Math.PI/7)/cam.aspect)*180/Math.PI;
      cam.fov=inside?limit(Math.max(65,portraitFov)*driverZoom,48,98):44;
      cam.near=inside ? .08 : (presets[mode].chase ? .15 : .85);cam.updateProjectionMatrix();
      driver.cabin.visible=inside;car.visible=!inside;focusRing.visible=tip.visible=!inside&&!presets[mode].chase;
      canvas.dataset.view=inside?'driver':presets[mode].chase?'chase':'external';
    }
    function resize(){
      const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;setLens();renderer.getDrawingBufferSize(size);params.value.copy(size);
    }
    resize();window.addEventListener('resize',resize);
    let currentSignal=null,redCrossed=false,lastFront=null,forceSnap=true;
    function frame(dt,active,braking=false,glance=0){
      updateDropBay(sim.state.taxi);
      const state=sim.state,p=presets[mode];clock+=dt;
      if(mode!==0)playerTaxi.update(state,active?dt:0,braking);
      const lead=85+Math.abs(state.speed)*5;
      stream.update(state.x,state.z,Math.sin(state.yaw)*lead,-Math.cos(state.yaw)*lead,forceSnap);
      if(traffic&&active)traffic.step(dt,state);
      for(let i=0;i<trafficMeshes.length;i++){const npc=traffic.vehicles[i],m=trafficMeshes[i];m.visible=npc.active!==false&&Math.hypot(npc.x-state.x,npc.z-state.z)<380;if(m.visible)groundCar(m,npc);}
      groundCar(car,state,true);
      const fx=state.x+2.27*Math.sin(state.yaw),fz=state.z-2.27*Math.cos(state.yaw);
      redCrossed=false;
      if(currentSignal&&lastFront){
        const h=currentSignal.head,delta=Math.hypot(fx-lastFront[0],fz-lastFront[1]),phase=signals.phaseFor(h);
        const before=(lastFront[0]-h.x)*h.dx+(lastFront[1]-h.z)*h.dz,after=(fx-h.x)*h.dx+(fz-h.z)*h.dz;
        redCrossed=mode===0&&active&&delta<5&&state.speed>0&&before<0&&after>=0&&(phase==='red'||phase==='redAmber');
      }
      lastFront=[fx,fz];
      currentSignal=state.layer!==0?null:signals.approach(fx,fz,state.yaw,76);
      drawLamps(dt,mode===0?currentSignal:null);
      const k=forceSnap?1:1-Math.exp(-dt*8);focus.x=lerp(focus.x,state.x+Math.sin(state.yaw)*state.speed*.26,k);focus.z=lerp(focus.z,state.z-Math.cos(state.yaw)*state.speed*.26,k);
      focus.y=lerp(focus.y,car.position.y,k);const aspectPad=cam.aspect<.84?1.18:1;
      if(mode===0){
        depth.value=-1; // Street-level geometry must remain solid.
        driver.update(car,state,cam,dt,glance,forceSnap);
      }else if(p.chase){
        const a=chaseAngle-state.yaw,range=6.8*zoom*aspectPad;
        look.set(car.position.x,car.position.y+.86,car.position.z);
        cam.position.set(look.x+Math.sin(a)*range,look.y+1.15*zoom,look.z+Math.cos(a)*range);
        cam.lookAt(look);cam.updateMatrixWorld();
        v.set(car.position.x,car.position.y+.9,car.position.z).project(cam);
        pivot.value.set((v.x+1)*.5*size.x,(v.y+1)*.5*size.y,0);
        depth.value=-v.copy(car.position).applyMatrix4(cam.matrixWorldInverse).z;
        vanish.value=size.y*.36;
      }else{
        look.set(focus.x,focus.y+.5,focus.z);
        cam.position.set(look.x+Math.sin(p.bearing)*p.dist*zoom*aspectPad,look.y+p.height*zoom*aspectPad,look.z+Math.cos(p.bearing)*p.dist*zoom*aspectPad);
        cam.lookAt(look);cam.updateMatrixWorld();
        v.set(car.position.x,car.position.y+1,car.position.z).project(cam);
        pivot.value.set((v.x+1)*.5*size.x,(v.y+1)*.5*size.y,0);
        depth.value=-v.copy(car.position).applyMatrix4(cam.matrixWorldInverse).z;
        vanish.value=Math.max(32,size.y*.10/Math.sqrt(zoom));
      }
      if(forceSnap||sunFocus.distanceTo(v.set(focus.x,focus.z,0))>28||shadowTime>4){sunFocus.set(focus.x,focus.z);sun.target.position.copy(focus);sun.position.set(focus.x-205,focus.y+315,focus.z+108);renderer.shadowMap.needsUpdate=true;shadowTime=0;}
      shadowTime+=dt;forceSnap=false;water.offset.x=clock*.0008;water.offset.y=clock*.00022;
      vessels[0].position.x=-305+Math.sin(clock*.012)*56;vessels[0].position.z=405+Math.sin(clock*.012)*45;
      routeDraw(sim.route);renderer.render(scene,cam);
    }
    return {frame,stream,get redCrossed(){return redCrossed;},get currentSignal(){return mode===0?currentSignal:null;},resetCamera(){forceSnap=true;},orbitCar(delta){if(presets[mode].chase)chaseAngle-=delta;},cameraMode(){mode=(mode+1)%presets.length;setLens();forceSnap=true;return presets[mode].name;},zoomBy(n){
      if(mode===0){driverZoom=limit(driverZoom*n,.78,1.18);setLens();}else zoom=limit(zoom*n,.48,1.8);
    },get stats(){return renderer.info.render;},height};
  }
  return {create,terrainSampler,groundSampler,bakeGround(map,emit){landMesh(map,groundSampler(map.terrain),null,groundRoadRibbons(map.roads),null,emit);}};
})();
