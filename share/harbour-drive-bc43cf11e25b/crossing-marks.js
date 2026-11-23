/* Ground markings in metres. See Transport Department TPDM V3, figs 5.7.3.2 / 5.7.4.2. */
window.HKCrosswalks = (() => {
  "use strict";

  function prepare(map, ribbons) {
    const byRoad = new Map(ribbons.map(r => [r.id,r.v]));
    const sites = [], cells = new Map();
    const key = (x,z) => Math.floor(x/24)+','+Math.floor(z/24);
    function reserve(x,z,radius,contains) {
      for(let i=Math.floor((x-radius)/24);i<=Math.floor((x+radius)/24);i++)
        for(let j=Math.floor((z-radius)/24);j<=Math.floor((z+radius)/24);j++){
          const k=i+','+j;
          if(!cells.has(k))cells.set(k,[]);
          cells.get(k).push(contains);
        }
    }
    for(const row of map.pedestrianCrossings || []){
      // The asphalt narrows at some joins. Use the rendered kerbs, including
      // width transitions, rather than the nominal lane count of the OSM way.
      const points=byRoad.get(row.road);
      if(!points)continue;
      let gap=Infinity,half;
      for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
        const t=Math.max(0,Math.min(1,((row.x-a[0])*dx+(row.z-a[1])*dz)/(dx*dx+dz*dz||1)));
        const dist=Math.hypot(row.x-a[0]-dx*t,row.z-a[1]-dz*t);
        if(dist<gap){gap=dist;half=a[2]+t*(b[2]-a[2]);}
      }
      if(gap>.5||!half)continue;
      const site={...row,half};
      sites.push(site);
      if(site.kind==='plain'&&!site.words)continue;
      reserve(site.x,site.z,half*(1+Math.abs(site.skew))+7,(x,z,r)=>{
        const vx=x-site.x,vz=z-site.z,across=-vx*site.dz+vz*site.dx;
        const along=vx*site.dx+vz*site.dz-across*site.skew;
        return Math.abs(across)<half+r&&Math.abs(along)<2.2+r*(1+Math.abs(site.skew));
      });
    }
    const diagonals=map.diagonalCrossings || [];
    for(const [a,c,b] of diagonals){
      const radius=Math.max(Math.hypot(a[0]-c[0],a[1]-c[1]),Math.hypot(b[0]-c[0],b[1]-c[1]))+3;
      reserve(...c,radius+3,(x,z,r)=>Math.hypot(x-c[0],z-c[1])<radius+r);
    }
    return {sites,diagonals,overlaps(x,z,r){return cells.get(key(x,z))?.some(inside=>inside(x,z,r)) || false;}};
  }

  function stencil(c) {
    // Each half of the atlas is read by the pedestrian facing into the road.
    // RM 1135/1136 put the arrow beside both lines and on the side it points to.
    c.fillStyle='#f9f8ef';c.textAlign='center';c.textBaseline='middle';
    for(const [row,right] of [[0,true],[1,false]]){
      c.save();c.translate(0,row*256);
      const cx=right?386:638;
      c.font='bold 80px Arial, sans-serif';
      c.fillText(right?'LOOK RIGHT':'LOOK LEFT',cx,55,712);
      c.font='bold 118px "PingFang HK","Microsoft JhengHei","Noto Sans CJK TC",sans-serif';
      c.fillText(right?'望右':'望左',cx,177);
      c.translate(right?872:152,134);c.scale(right?1:-1,1);
      c.beginPath();c.moveTo(-101,-21);c.lineTo(5,-21);c.lineTo(5,-64);
      c.lineTo(107,0);c.lineTo(5,64);c.lineTo(5,21);c.lineTo(-101,21);c.closePath();c.fill();
      c.restore();
    }
  }

  function draw(layout,groundMark,colors,props,height){
    const {amber,white,stud,refuge}=colors;
    const quad=(at,l,r,b,t,col)=>groundMark([at(l,b),at(r,b),at(r,t),at(l,t)],col);
    for(const site of layout.sites){
      const {x,z,dx,dz,half,skew,kind}=site, nx=-dz,nz=dx;
      // u is measured in the driving direction. v goes from the left kerb to
      // the right. Offset u with v for a skew crossing recorded in the map.
      const at=(u,v)=>[x+dx*(u+skew*v)+nx*v,z+dz*(u+skew*v)+nz*v];
      const outer=1.88;
      if(kind==='yellow'||kind==='zebra'){
        const yellow=kind==='yellow', edge=yellow?1.12:.65;
        const count=Math.max(1,Math.round((2*half-2*edge)/(yellow?.99:.95))+1);
        for(let i=0;i<count;i++){
          const v=count===1?0:-half+edge+i*(2*half-2*edge)/(count-1), thick=yellow?.15:.255;
          quad(at,-outer+.28,outer-.28,v-thick,v+thick,yellow?amber:white);
        }
      }
      if(kind!=='plain'){
        const count=Math.max(2,Math.round((2*half-1.4)/.72)+1);
        for(let i=0;i<count;i++){
          const v=-half+.7+i*(2*half-1.4)/(count-1);
          for(const u of [-outer,outer])quad(at,u-.065,u+.065,v-.075,v+.075,stud);
        }
      }
      if(site.island){
        // A level cut-through between two refuge noses keeps the walking line clear.
        for(const u of [-2.8,2.8]){
          const outline=[];
          for(let i=0;i<16;i++){const a=i*Math.PI/8;outline.push(at(u+.94*Math.cos(a),.47*Math.sin(a)));}
          groundMark(outline,refuge);
          const [px,pz]=at(u,0);
          props.add('pole',px,height(px,pz)+.39,pz,.095,.78,.095,'#ebb745');
          props.add('pole',px,height(px,pz)+.62,pz,.099,.15,.099,'#efeee0');
        }
      }
      for(const [label,word] of Object.entries(site.words||{})){
        const side=label==='left'?-1:1, across=side*(half-1.11);
        const [cx,cz]=at(0,across);
        const rx=side*dx,rz=side*dz,fx=-side*nx,fz=-side*nz;
        const width=3.76, depth=1.02;
        const point=(a,b)=>[cx+rx*a+fx*b,cz+rz*a+fz*b];
        const poly=[point(-width/2,-depth/2),point(width/2,-depth/2),point(width/2,depth/2),point(-width/2,depth/2)];
        const uv=(px,pz)=>[(rx*(px-cx)+rz*(pz-cz))/width+.5,
          ((fx*(px-cx)+fz*(pz-cz))/depth+.5+(word==='right'?1:0))/2];
        groundMark(poly,white,uv);
      }
    }
    // Two diagonal arms share nested yellow outlines at the centre, as in the
    // TD photograph of the Carnarvon / Granville crossing.
    const groups=new Map();
    for(const path of layout.diagonals){
      const k=path[1].join(',');
      if(!groups.has(k))groups.set(k,[]);
      groups.get(k).push(path);
    }
    for(const paths of groups.values()){
      if(paths.length!==2)continue;
      const [x,z]=paths[0][1], axes=paths.map(([a,,b])=>{
        const len=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/len,(b[1]-a[1])/len];
      });
      const at=(u,v)=>[x+axes[0][0]*u+axes[1][0]*v,z+axes[0][1]*u+axes[1][1]*v];
      const w=1.42;
      for(const size of [w,.82,.26]){
        const edge=size===.26?.11:.185;
        quad(at,-size,size,-size,-size+edge,amber);quad(at,-size,size,size-edge,size,amber);
        quad(at,-size,-size+edge,-size+edge,size-edge,amber);quad(at,size-edge,size,-size+edge,size-edge,amber);
      }
      paths.forEach((path,k)=>{
        for(const side of [-1,1]){
          const end=path[side<0?0:2],length=Math.hypot(end[0]-x,end[1]-z);
          const ux=(end[0]-x)/length,uz=(end[1]-z)/length,[vx,vz]=axes[1-k];
          const arm=(d,v)=>[x+ux*d+vx*v,z+uz*d+vz*v];
          const steps=Math.max(1,Math.round((length-.7-w)/.88));
          for(let i=1;i<=steps;i++){
            const d=w+(length-.7-w)*i/steps;
            quad(arm,d-.14,d+.14,-w,w,amber);
            for(const v of [-w-.22,w+.22])quad(arm,d-.06,d+.06,v-.065,v+.065,stud);
          }
        }
      });
    }
  }
  return {prepare,stencil,draw};
})();
