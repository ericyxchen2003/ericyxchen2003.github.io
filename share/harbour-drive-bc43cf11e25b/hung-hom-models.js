// The large silhouettes use the survey outline. Small facade elements stream with their street block.
window.HKHungModels=(()=>{
  const {faces,plate,badge,shell,cap}=HKCoastModels.geometry;
  const arena=270002, temple=91216, ship=144725, kerry=164696, innovation=72209;
  const custom=new Set([arena,temple,ship,kerry,innovation]);
  const labels=new Map([
    [arena,['香港體育館','HONG KONG COLISEUM','#944735']],[temple,['紅磡觀音廟','KWUN YUM TEMPLE','#9a3b28']],
    [ship,['黃埔號','THE WHAMPOA','#243c50']],[kerry,['香港嘉里酒店','KERRY HOTEL','#535b51']],
    [innovation,['賽馬會創新樓','JOCKEY CLUB INNOVATION TOWER','#586a72']],
    [82161,['九龍城政府合署','KOWLOON CITY GOVERNMENT OFFICES','#495a5c']],
    [240460,['置富都會','FORTUNE METROPOLIS','#545c69']],[258964,['都會海逸酒店','HARBOUR PLAZA METROPOLIS','#635846']],
    [145527,['九龍海逸君綽酒店','HARBOUR GRAND KOWLOON','#4f665f']],
    [82592,['香港理工大學紅磡灣校園','HUNG HOM BAY CAMPUS','#82433d']],
    [252024,['世界殯儀館','WORLD FUNERAL PARLOUR','#535a57']],[252025,['萬國殯儀館','INTERNATIONAL FUNERAL PARLOUR','#5d615b']],
    [36088,['寰宇殯儀館','UNIVERSAL FUNERAL PARLOUR','#5a605b']],
    [268393,['凱旋工商中心','KAISER ESTATE','#66707a']]
  ]);
  const funeral=new Set([252024,252025,36088]);
  const area=p=>Math.abs(p.reduce((a,v,i)=>{const q=p[(i+1)%p.length];return a+v[0]*q[1]-q[0]*v[1];},0))/2;
  const owner=new Map();
  for(const b of HKMAP.buildings)if(labels.has(b.id)&&!b.foundation&&(!owner.has(b.id)||area(owner.get(b.id).p)<area(b.p)))owner.set(b.id,b);
  const campus=b=>b.n?.startsWith('香港理工大學')&&b.p[0][0]<1150&&b.p[0][1]>-1200&&b.h>14;
  function style(b){
    if(funeral.has(b.id)||b.id===82161)return 5;
    if([240460,258964,145527,82592,266051,268393,82477,85343,264320].includes(b.id))return [145527,82592].includes(b.id)?12:6;
    if(campus(b))return 1;
  }
  function centre(p){
    let x=0,z=0,w=0;
    p.forEach((a,i)=>{const b=p[(i+1)%p.length],v=a[0]*b[1]-b[0]*a[1];x+=(a[0]+b[0])*v;z+=(a[1]+b[1])*v;w+=3*v;});
    return [x/w,z/w];
  }
  function ring(p,c,y,s=1,shift=0){return p.map(([x,z])=>[c[0]+(x-c[0])*s+shift,y,c[1]+(z-c[1])*s]);}
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  // The close-up and skyline meshes use identical positions for these fixtures.
  // All quads go into the block's existing night pass and follow the simulation clock.
  function rim(lit,lo,hi,tint){
    for(let i=0;i<lo.length;i++){
      const j=(i+1)%lo.length;lit.litQuad(lo[i],lo[j],hi[j],hi[i],tint);
    }
  }
  function templeFrame(b){
    const [x,z]=centre(b.p),a=Math.atan2(.565,.825),c=Math.cos(a),s=Math.sin(a);
    return (u,y,v)=>[x+c*u-s*v,y,z+s*u+c*v];
  }
  function lanternRings(at,u,y,scale){
    return [[-.49,.15],[-.36,.35],[-.18,.47],[.18,.47],[.36,.35],[.49,.15]].map(([dy,r])=>
      Array.from({length:12},(_,i)=>at(u+scale*r*Math.cos(i*Math.PI/6),y+3.28+dy*scale,8.02+scale*r*Math.sin(i*Math.PI/6))));
  }
  const entrances=new WeakMap();
  function streetFace(b){
    if(entrances.has(b))return entrances.get(b);
    const fs=faces(b.p).filter(f=>f.w>4);
    const xs=b.p.map(p=>p[0]),zs=b.p.map(p=>p[1]);
    const left=Math.min(...xs)-65,right=Math.max(...xs)+65,top=Math.min(...zs)-65,bottom=Math.max(...zs)+65;
    const streets=[];
    for(const r of HKMAP.roads){
      if(r.l<0||r.cls==='motorway'||r.cls==='trunk')continue;
      for(let i=1;i<r.p.length;i++){
        const [ax,az]=r.p[i-1],[bx,bz]=r.p[i];
        if(Math.min(ax,bx)<=right&&Math.max(ax,bx)>=left&&Math.min(az,bz)<=bottom&&Math.max(az,bz)>=top)
          streets.push({ax,az,dx:bx-ax,dz:bz-az,half:r.w*.5});
      }
    }
    let face=fs.reduce((a,f)=>!a||f.w>a.w?f:a,null),score=Infinity;
    for(const f of fs){
      const [x,,z]=f.at(0,0,0),[nx,,nz]=f.at(0,0,1);
      for(const {ax,az,dx,dz,half} of streets){
        const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));
        const u=ax+t*dx-x,v=az+t*dz-z,d=Math.hypot(u,v);
        if(d>65||d<half||u*(nx-x)+v*(nz-z)<d*.65)continue;
        const cost=d-half+30/Math.min(f.w,20);
        if(cost<score){score=cost;face=f;}
      }
    }
    entrances.set(b,face);return face;
  }
  function lights(b,lit){
    if(b.foundation||(b.id===innovation&&owner.get(b.id)!==b))return;
    const y=b.basePD,h=b.h;
    if(b.terminalSoffit){
      // Transverse ceiling battens sit directly above the mapped taxi lanes.
      const inside=(x,z)=>b.p.reduce((odd,[ax,az],i)=>{
        const [bx,bz]=b.p[(i+1)%b.p.length];
        return (az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax?!odd:odd;
      },false);
      for(const r of HKHungHom.roads.filter(r=>r.en==='Hung Luen Road taxi access')){
        let dist=0,next=3;
        for(let i=1;i<r.p.length;i++){
          const [ax,az]=r.p[i-1],[bx,bz]=r.p[i],len=Math.hypot(bx-ax,bz-az);
          if(!len)continue;
          const dx=(bx-ax)/len,dz=(bz-az)/len;
          for(;next<dist+len;next+=8.5){
            const x=ax+(next-dist)*dx,z=az+(next-dist)*dz;
            const corner=(u,v)=>[x+dx*u+dz*v,y-.055,z+dz*u-dx*v];
            const p=[corner(-.16,-1.3),corner(-.16,1.3),corner(.16,1.3),corner(.16,-1.3)];
            if(p.every(([x,,z])=>inside(x,z)))lit.litQuad(...p,'#d6ddd0');
          }
          dist+=len;
        }
      }
      return;
    }
    if(b.id===arena){
      const c=centre(b.p),base=ring(b.p,c,y,.692),eave=ring(b.p,c,b.top-1.8,1.003);
      // Amber uplights fan out over the inclined ribs. Keep the roof dark.
      for(let i=0;i<base.length;i++){
        const j=(i+1)%base.length;
        const at=(u,v)=>mix(mix(base[i],base[j],u),mix(eave[i],eave[j],u),v);
        for(let k=0;k<10;k++){
          const u=(k+.5)/10;
          lit.wallWash(at(u-.021,.045),at(u+.021,.045),at(u+.051,.94),at(u-.051,.94),'#d7ad81');
        }
      }
      rim(lit,ring(b.p,c,b.top-.98,1.0015),ring(b.p,c,b.top-.72,1.0015),'#c9ad8c');
      return;
    }
    if(b.id===temple){
      const at=templeFrame(b);
      for(const u of [-3.2,3.2]){
        const rings=lanternRings(at,u,y,1.014);
        const tints=['#ab3524','#d04d28','#e46833','#d04d28','#ab3524'];
        for(let i=1;i<rings.length;i++)rim(lit,rings[i-1],rings[i],tints[i-1]);
      }
      for(const u of [-5.45,5.45]){
        lit.wallWash(at(u-.90,y+.40,6.48),at(u+.90,y+.40,6.48),at(u+2.25,y+4.38,6.48),at(u-2.25,y+4.38,6.48),'#be895f');
      }
      lit.litPanel(at,0,y+4.55,6.85,4.6,.09,'#c19a65');return;
    }
    if(b.id===innovation){innovationLights(lit);return;}
    if(b.id===ship||b.id===kerry){
      const p=b.p,c=centre(p);
      const band=(t,s,width,tint)=>{
        rim(lit,ring(p,c,y+t*h,s),ring(p,c,y+t*h+width,s),tint);
      };
      if(b.id===ship){band(.32,1.003,.20,'#ddbe8e');band(.62,.794,.14,'#9cbfc8');}
      if(b.id===kerry){band(.209,.988,.19,'#d1b890');band(.748,.981,.13,'#9fada8');}
      return;
    }
    if(owner.get(b.id)!==b)return;
    const f=streetFace(b);
    if(!f)return;
    const hotel=b.id===258964||b.id===145527,quiet=funeral.has(b.id);
    const w=Math.min(f.w*.68,quiet?5.0:hotel?12:8.0),door=Math.min(3.4,h*.43);
    const tint=quiet?'#929995':hotel?'#d1b187':'#b5bcae';
    for(const side of [-1,1]){
      const u=side*w*.46;
      lit.wallWash(f.at(u-.26,y+.35,.39),f.at(u+.26,y+.35,.39),
        f.at(u+.64,y+door,.39),f.at(u-.64,y+door,.39),tint);
    }
    lit.litPanel(f.at,0,y+door+.12,.40,w,.15,tint);
  }
  function jacket(mesh,a,b,col,glass=false){
    for(let i=0;i<a.length;i++){
      const k=(i+1)%a.length,span=Math.hypot(a[i][0]-a[k][0],a[i][2]-a[k][2]);
      mesh.quad(a[i],a[k],b[k],b[i],col,glass?[i/16,a[i][1]/54,i/16+span/35,b[i][1]/54]:undefined);
    }
  }
  function arenaShell(b,group,near,props,signs,height){
    const c=centre(b.p),y=b.basePD,body=shell('香港體育館 · 倒金字塔看台',group),r=(h,s)=>ring(b.p,c,h,s);
    const foot=r(y,.69),fascia=r(b.top-1.8,1),top=r(b.top,1);
    jacket(body,r(Math.min(y-1,height?.(...c)??y)-.65,.68),foot,'#b8aea0');
    jacket(body,foot,fascia,'#a8866b');jacket(body,fascia,top,'#ceb19a');cap(body,top,'#b9ae9d');
    if(near){
      for(let i=0;i<4;i++){
        const j=(i+1)%4;
        for(let k=0;k<32;k++){
          const t=k/32;
          body.quad(mix(foot[i],foot[j],t),mix(foot[i],foot[j],t+.009),mix(fascia[i],fascia[j],t+.009),mix(fascia[i],fascia[j],t),'#e0c5a6');
        }
        for(const t of [.12,.54,.91]){
          const a=foot.map((p,k)=>mix(p,fascia[k],t)),d=foot.map((p,k)=>mix(p,fascia[k],t+.014));
          body.quad(a[i],a[j],d[j],d[i],'#785e51');
        }
      }
      const fs=faces(foot.map(p=>[p[0],p[2]]));
      for(const f of fs){
        for(const u of [-.31,-.11,.11,.31]){plate(f,props,u*f.w,y+1.75,.1,8.5,3.5,.32,'#37494b');props.litPanel(f.at,u*f.w,y+3.27,.28,8,.19,'#e5cf9e');}
      }
      badge(fs[0],signs,y+4.7,.16,16,1.75,labels.get(arena));
    }
    body.finish();
  }
  function templeHall(b,group,near,props,signs,height){
    const c=centre(b.p),angle=Math.atan2(.565,.825),at=templeFrame(b);
    const mesh=shell('觀音廟 · 兩進殿堂與陶塑屋脊',group),y=b.basePD;
    function block(u,h,v,w,d,t,color){const loop=(yy)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,k])=>at(u+a*w/2,yy,v+k*d/2));const top=loop(h+t);jacket(mesh,loop(h),top,color);cap(mesh,top,color);}
    block(0,Math.min(y,height?.(...c)??y)-.6,0,16.6,17.5,1.05,'#a79c8d');
    for(const [v,peak] of [[-4.6,8.8],[4.7,7.5]]){
      const entrance=v>0;
      block(0,y,entrance?v-.8:v,16.25,entrance?5.1:6.7,4.65,'#aca69b');
      for(const side of [-1,1]){
        for(let i=0;i<12;i++){
          const u=-8.7+i*17.4/12,uu=u+17.4/12;
          const section=x=>{const rise=(Math.abs(x)/8.7)**5;return [at(x,y+peak+rise*.5,v),at(x,y+5.25+rise*.5,v+side*2.8),at(x,y+4.82+rise*1.05,v+side*4.05)];};
          const p=section(u),q=section(uu);
          for(let j=0;j<2;j++)mesh.quad(p[j],q[j],q[j+1],p[j+1],i%3?'#516b5b':'#5c7162');
          if(near)for(let row=0;row<2;row++)for(let k=1;k<=4;k++){
            const t=k/5,edge=(a,n)=>mix(a[row],a[row+1],n).map((h,axis)=>axis===1?h+.025:h);
            mesh.quad(edge(p,t),edge(q,t),edge(q,t+.023),edge(p,t+.023),'#627c6b');
          }
        }
      }
      if(near){
        props.add('box',...at(0,y+peak+.08,v),17.2,.39,.36,'#785e4f',-angle);
        for(const u of [-8,-6.7,0,6.7,8])props.add('crown',...at(u,y+peak+.36+(Math.abs(u)/8)**4*.29,v),.29,.32,.22,u?'#6a866d':'#ae7555',-angle);
      }
    }
    for(const u of [-6.7,6.7])block(u,y,0,2.75,3.3,4.15,'#a59e91');
    const eaves=[[-5.6,-2.05],[5.6,-2.05],[5.6,2.05],[-5.6,2.05]].map(([u,v])=>at(u,y+4.32,v));
    const left=at(-3.85,y+5.85,0),right=at(3.85,y+5.85,0);
    mesh.quad(eaves[0],eaves[1],right,left,'#687d68');mesh.quad(eaves[3],left,right,eaves[2],'#5d725f');
    mesh.tri(eaves[0],left,eaves[3],'#667a65');mesh.tri(eaves[1],eaves[2],right,'#617662');
    for(const u of [-3.2,3.2]){
      const rings=lanternRings(at,u,y,1);
      for(let i=1;i<rings.length;i++)jacket(mesh,rings[i-1],rings[i],i===3?'#bd4330':'#a63828');
      cap(mesh,rings.at(-1),'#825f41');cap(mesh,rings[0],'#825f41');
      if(near){
        props.add('pole',...at(u,y+4.15,8.02),.024,.80,.024,'#745d42');
        props.add('pole',...at(u,y+2.64,8.02),.055,.30,.055,'#a34733');
      }
    }
    if(near){
      // Open terraces and stone columns sit in front of the recessed door.
      for(const u of [-5.6,5.6])block(u,y,7.3,4.6,2.65,.5,'#aba69b');
      for(const u of [-6.4,-3.1,3.1,6.4]){
        props.add('pole',...at(u,y+2.37,7.8),.29,4.24,.29,'#aaa79c');
        props.add('box',...at(u,y+.32,7.8),.62,.64,.62,'#939185',-angle);
        for(const [v,w] of [[4.36,.58],[4.57,.92]])props.add('box',...at(u,y+v,7.8),w,.24,.49,'#7e5343',-angle);
      }
      block(0,y,6.54,4.55,.30,3.58,'#67463e');
      block(0,y+.08,6.72,3.68,.12,2.92,'#493d37');
      for(const u of [-2.38,2.38])block(u,y,6.55,.38,.45,3.58,'#b8b3a4');
      block(0,y+3.48,6.57,5.16,.46,.28,'#c5baa1');
      for(const u of [-5.6,5.6])for(let k=0;k<6;k++)block(u-1.45+k*.58,y+.54,8.56,.14,.16,.58,'#aaa79c');
      for(const u of [-5.6,5.6])block(u,y+1.08,8.56,3.27,.21,.12,'#bcb6a7');
      badge({at},signs,y+4.05,6.84,4.9,.85,labels.get(temple));
    }
    mesh.finish();
  }
  // The survey polygon includes the low southern podium. The two roof outlines
  // below follow the Lands Department orthophoto in the map's east/south frame.
  const innovationWings=[
    {plan:[[1012,-1066],[1007,-1067],[992,-1062],[968,-1052],[954,-1046],[941,-1032],
           [937,-1025],[938,-1019],[941,-1018],[955,-1025],[972,-1034],[987,-1042],[998,-1048],[1005,-1058]],
     west:937,run:75,roofStart:60.6,rise:15.3,
     roofLights:[[[970,-1051],[1006,-1064],[996,-1052],[984,-1044],[976,-1040]],
                 [[943,-1029],[948,-1024],[945,-1022],[941,-1026]]]},
    {plan:[[995,-1043],[988,-1040],[974,-1032],[959,-1023],[944,-1016],[938,-1011],
           [935,-1002],[936,-999],[942,-998],[954,-1001],[963,-1005],[971,-1012],[979,-1022],[986,-1033]],
     west:935,run:60,roofStart:42.2,rise:18.5,
     roofLights:[[[960,-1019],[974,-1026],[978,-1026],[974,-1021],[970,-1018]]]}
  ].map(wing=>{
    const curve=new THREE.CatmullRomCurve3(wing.plan.map(([x,z])=>new THREE.Vector3(x,0,z)),true);
    const outline=curve.getSpacedPoints(64).slice(0,-1).map(v=>[v.x,v.z]);
    return {...wing,outline,center:centre(outline)};
  });
  function innovationRoof(wing,x){
    return wing.roofStart+wing.rise*(x-wing.west)/wing.run;
  }
  function innovationRing(wing,plan,level,projection=0,fascia=false){
    const [cx,cz]=wing.center;
    return plan.map(([x,z])=>{
      const top=innovationRoof(wing,x);
      // The louvres sweep up at the ends and widen over the spandrels.
      const bow=Math.sin((x-wing.west)/wing.run*Math.PI);
      const lift=.55*bow*Math.sin((z-x)*.075);
      const y=Math.min(level+lift+(fascia?.45*bow:0),top-2.3);
      const t=Math.max(0,Math.min(1,(y-16)/(top-2.3-16)));
      const foot=Math.max(0,1-t/.24);
      const dx=x-cx,dz=z-cz,length=Math.hypot(dx,dz)||1;
      return [x-dx*.17*foot-2.4*(1-t)+dx/length*projection,y,
              z-dz*.17*foot+2.0*(1-t)+dz/length*projection];
    });
  }
  function innovationLights(lit){
    for(const wing of innovationWings){
      for(const level of [28.8,44.8,56.8]){
        const lo=innovationRing(wing,wing.outline,level,.49);
        const hi=innovationRing(wing,wing.outline,level+.16,.49);
        for(let i=0;i<lo.length;i++){
          const j=(i+1)%lo.length;
          if(i%16<10&&hi[i][1]>lo[i][1]&&hi[j][1]>lo[j][1])
            lit.litQuad(lo[i],lo[j],hi[j],hi[i],'#b8cbd0');
        }
      }
    }
  }
  function innovationTower(b,group,near){
    const mesh=shell(labels.get(innovation)[0],group,'rooms'),y=b.basePD;
    const podium=HKHungInnovation,c=centre(podium),deck=ring(podium,c,y+2.9,.99);
    jacket(mesh,ring(podium,c,y-.08,.975),deck,'#c9cac4');cap(mesh,deck,'#dcddd8');

    // Recessed glazing joins the blades beneath the diagonal slot in the roof.
    const spine=[[938,-1015],[993,-1048],[994,-1042],[941,-1009]];
    const atriumTop=spine.map(([x,z])=>[x,innovationRoof(innovationWings[1],x)-3,z]);
    jacket(mesh,spine.map(([x,z])=>[x,y+2.8,z]),atriumTop,'#425960',true);
    cap(mesh,atriumTop,'#657b82');
    for(const wing of innovationWings){
      const plan=near?wing.outline:wing.outline.filter((_,i)=>i%2===0);
      const r=(level,out=0,fascia=false)=>innovationRing(wing,plan,level,out,fascia);
      let prev=r(y+2);
      const glass=['#637c86','#738b93','#627c87','#728991'];
      for(let floor=0;floor<16;floor++){
        const level=y+3.9+4*floor;
        const glassTop=r(level),lip=r(level,.46),bandTop=r(level+.82,.46,true),recess=r(level+.82,0,true);
        for(let i=0;i<plan.length;i++){
          const j=(i+1)%plan.length;
          if(prev[i][1]===recess[i][1]&&prev[j][1]===recess[j][1])continue;
          const step=64/plan.length;
          const uv=[i*step*.14,prev[i][1]/53,(i+1)*step*.14,glassTop[i][1]/53];
          const brushed=floor<2;
          let sill=prev[i],head=glassTop[i];
          if(near&&!brushed){
            sill=mix(prev[i],prev[j],.045);head=mix(glassTop[i],glassTop[j],.045);
            mesh.quad(prev[i],sill,head,glassTop[i],'#a5b1b3');
          }
          mesh.quad(sill,prev[j],glassTop[j],head,brushed?'#bcc3c3':glass[Math.floor(i*step/4)%4],brushed?undefined:uv);
          mesh.quad(glassTop[i],glassTop[j],lip[j],lip[i],'#a5afb0');
          mesh.quad(lip[i],lip[j],bandTop[j],bandTop[i],'#e5e7e3');
          mesh.quad(bandTop[i],bandTop[j],recess[j],recess[i],'#c4ccca');
        }
        prev=recess;
      }
      const roof=r(Infinity),edge=plan.map(([x,z])=>[x,innovationRoof(wing,x),z]);
      jacket(mesh,roof,edge,'#dde2df');cap(mesh,edge,'#e8e9e4');
      for(const skylight of wing.roofLights){
        cap(mesh,skylight.map(([x,z])=>[x,innovationRoof(wing,x)+.53,z]),'#587078');
      }
    }
    mesh.finish();
  }
  function modern(b,group,near,props,signs){
    const isShip=b.id===ship;
    const p=b.p,c=centre(p),mesh=shell(labels.get(b.id)[0],group,'rooms');
    const y=b.basePD,h=b.h;
    const profile=isShip?[[0,.79],[.32,1],[.38,.99],[.39,.80],[.61,.79],[.63,.68],[.82,.65],[.84,.48],[.96,.46]]:
      [[0,.99],[.13,1],[.21,.985],[.74,.978],[.75,.94],[.9,.94],[.91,.86],[1,.854]];
    const r=(t,s)=>ring(p,c,y+t*h,s);
    for(let j=1;j<profile.length;j++){
      const [t,s]=profile[j],[t0,s0]=profile[j-1],glass=isShip?[4,6,8].includes(j):(t-t0)>.04;
      const lo=r(t0,s0),hi=r(t,s);
      if(near&&glass){
        for(let i=0;i<p.length;i++){
          const j=(i+1)%p.length,w=Math.hypot(p[i][0]-p[j][0],p[i][1]-p[j][1]),n=Math.max(1,Math.round(w/2.65));
          for(let k=0;k<n;k++){
            const u=k/n,v=(k+1)/n,m=u+.055/n;
            const uv=[i*.13+k*.06,lo[i][1]/54,i*.13+(k+1)*.06,hi[i][1]/54];
            mesh.quad(mix(lo[i],lo[j],u),mix(lo[i],lo[j],m),mix(hi[i],hi[j],m),mix(hi[i],hi[j],u),'#a8b8b5');
            const tint=(i*3+k)%7;
            mesh.quad(mix(lo[i],lo[j],m),mix(lo[i],lo[j],v),mix(hi[i],hi[j],v),mix(hi[i],hi[j],m),
                isShip?'#567482':['#879f9e','#708d90','#839d9d'][tint%3],uv);
          }
        }
      }else jacket(mesh,lo,hi,isShip?(j===1?'#253a4b':glass?'#6c8992':'#eadfca'):'#799b9f',glass);
      if(near&&glass){
        const count=Math.max(1,Math.round((t-t0)*h/3.2));
        for(let k=1;k<=count;k++){
          const u=k/count,q=t0+(t-t0)*u,v=s0+(s-s0)*u;
          jacket(mesh,r(q-.009,v+.0018),r(q,v+.0018),isShip?'#e1d7c2':'#c4c6b4');
        }
      }
    }
    const [tt,ss]=profile.at(-1);cap(mesh,r(tt,ss),isShip?'#d5c9b0':'#aeb4a6');
    mesh.finish();
    if(!near)return;
    const signScale=isShip?.79+(.24/.32)*.21:.99+(.1/.13)*.01;
    const front=faces(ring(p,c,0,signScale).map(([x,,z])=>[x,z])).sort((a,b)=>b.w-a.w)[0];
    if(isShip){const [[x,z],[u,v]]=p;const yaw=-Math.atan2(v-z,u-x);
      props.add('tank',c[0],y+h+1.2,c[1],2,3.3,1.6,'#b86a49',yaw);
      props.add('pole',c[0],y+h+4.7,c[1]+5,.12,7.5,.12,'#c4b9a5');
    }
    if(b.id===kerry){
      // Planting sits inside the actual setbacks of the harbour-facing podium.
      for(const f of faces(p).filter(f=>f.w>12)){
        const q=f.at(0,b.top+.24,-1.15);props.add('box',c[0]+(q[0]-c[0])*.84,q[1],c[1]+(q[2]-c[1])*.84,f.w*.6,.46,.68,'#637d59',f.angle);
      }
    }
    badge(front,signs,y+h*(isShip?.24:.10),.11,Math.min(front.w*.68,13),1.2,labels.get(b.id));
  }
  function buildShell(b,group,near,props,signs,height){
    if(b.id===innovation&&owner.get(b.id)!==b)return;
    if(b.id===arena)arenaShell(b,group,near,props,signs,height);
    else if(b.id===temple)templeHall(b,group,near,props,signs,height);
    else if(b.id===innovation)innovationTower(b,group,near);
    else modern(b,group,near,props,signs);
  }
  function photoRoof(p,y,group,mat,bounds){
    const [x0,z0,x1,z1]=bounds,geom=new THREE.BufferGeometry();
    const flat=p.map(([x,z])=>new THREE.Vector2(x,z)),tris=THREE.ShapeUtils.triangulateShape(flat,[]);
    geom.setAttribute('position',new THREE.Float32BufferAttribute(p.flatMap(([x,z])=>[x,y,z]),3));
    geom.setAttribute('uv',new THREE.Float32BufferAttribute(p.flatMap(([x,z])=>[(x-x0)/(x1-x0),1-(z-z0)/(z1-z0)]),2));
    geom.setAttribute('color',new THREE.Float32BufferAttribute(p.flatMap(()=>[1,1,1]),3));
    geom.setIndex(tris.flatMap(([a,b,c])=>[c,b,a]));geom.computeVertexNormals();
    mat.userData.load();const roof=new THREE.Mesh(geom,mat);roof.receiveShadow=true;group.add(roof);
  }
  function building(b,props,signs,height,group,mats){
    if(b.foundation)return;
    lights(b,props);
    if(custom.has(b.id)){
      buildShell(b,group,true,props,signs,height);
      if(b.id===arena)photoRoof(b.p,b.top+.045,group,mats[8],HKMAP.southBounds);
      return;
    }
    if(b.terminalSoffit){
      // Building roofs normally face upwards only; the underside of a covered
      // boarding lane needs its own continuous concrete ceiling.
      const m=shell('紅鸞道交匯處 · 車道頂板',group);
      cap(m,b.p.map(([x,z])=>[x,b.basePD,z]),'#a8a99f');m.finish();return;
    }
    if(style(b)===undefined)return;
    const campusBlock=campus(b),plain=funeral.has(b.id),y=b.basePD??height(...centre(b.p)),h=b.h;
    const facades=faces(b.p).filter(f=>f.w>6);
    if(!facades.length)return;
    const major=facades.reduce((a,f)=>a.w>f.w?a:f);
    for(const f of facades){
      const w=f.w;
      if(campusBlock){
        if(w<11||h<15)continue;
        for(let u=-w/2+3;u<w/2-1;u+=6.8)plate(f,props,u,y+h/2,.07,.57,h,.15,'#9e523e');
        for(let v=4;v<h-.5;v+=3.7)plate(f,props,0,y+v,.09,w,.29,.2,'#ab654d');
      }else if(plain){
        for(let u=-w/2+.8;u<w/2;u+=3.3)plate(f,props,u,y+h*.55,.08,.34,h*.82,.16,'#c5c0ae');
        plate(f,props,0,y+4.5,.18,w*.92,.33,.40,'#bab8a9');
      }else if(b.id===82161||b.id===82592||b.id===268393){
        for(let v=4;v<h-.6;v+=b.id===82592?3.2:3.9)plate(f,props,0,y+v,.10,w,.31,.21,b.id===82592?'#c8d1ce':'#b2af9b');
        if(w>13)for(let u=-w*.4;u<w*.45;u+=w/4.5)plate(f,props,u,y+h*.53,.13,.38,h*.89,.26,b.id===82592?'#597f83':'#aaa38d');
      }else if(w>9){
        for(let v=3.6;v<h-.9;v+=4.4)plate(f,props,0,y+v,.12,w,.34,.26,b.id===145527?'#c5c6ae':'#c1b5a3');
      }
    }
    if(labels.has(b.id)&&owner.get(b.id)===b){
      const badgeY=y+Math.min(h*.4,6.3);
      const door=streetFace(b)||major;
      badge(door,signs,badgeY,.42,Math.min(door.w*.84,plain?9:17),plain?1.05:1.45,labels.get(b.id));
    }
  }
  function landscape(props,height,hasSpace,pavilion){
    const rails=HKHungShore.rails;
    for(const [a,b] of rails){
      const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/3.7),yaw=-Math.atan2(dz,dx);
      for(let i=0;i<n;i++){
        const t=(i+.5)/n,x=a[0]+t*dx,z=a[1]+t*dz;
        if(!hasSpace(x,z))continue;
        const y=height(x,z);
        for(const up of [.53,1.08])props.add('box',x,y+up,z,len/n+.05,.07,.08,'#a6b7b3',yaw);
        props.add('pole',x-dx/(2*n),y+.55,z-dz/(2*n),.065,1.1,.065,'#7f918c');
      }
    }
    for(const [x,z,kind,angle=0] of HKHungShore.furniture){
      if(!hasSpace(x,z))continue;
      const y=height(x,z),at=(u,h,v)=>[x+Math.cos(angle)*u-Math.sin(angle)*v,y+h,z+Math.sin(angle)*u+Math.cos(angle)*v];
      if(kind==='shelter'||kind==='pavilion'){
        if(![-1.8,1.8].every(u=>[-1.5,1.5].every(v=>{const p=at(u,0,v);return hasSpace(p[0],p[2]);})))continue;
        for(const u of [-1.5,1.5])for(const v of [-1.2,1.2])pavilion.add('pole',...at(u,1.45,v),.14,2.9,.14,'#bba58a');
        pavilion.add('box',...at(0,2.93,0),3.8,.23,3.2,'#769084',-angle);
        pavilion.litQuad(at(-.40,2.80,-.14),at(.40,2.80,-.14),at(.40,2.80,.14),at(-.40,2.80,.14),'#cbba98');
        if(kind==='pavilion'){props.add('pole',...at(0,.49,0),.58,.55,.58,'#a99c88');props.add('box',...at(0,.81,0),1.05,.08,1.05,'#d9c8a9',-angle);}
      }else{
        props.add('box',...at(0,.48,0),1.9,.13,.51,'#a68762',-angle);
        props.add('box',...at(0,.78,.22),1.9,.37,.09,'#ac906b',-angle);
        for(const u of [-.65,.65])props.add('box',...at(u,.21,0),.14,.41,.42,'#747f79',-angle);
      }
    }
  }
  return {style,building,lights,landscape,replaces:b=>!b.foundation&&custom.has(b.id),
    distant(b,batch,group){if(!custom.has(b.id)||b.foundation)return false;buildShell(b,group,false);return true;}};
})();
