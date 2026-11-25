// Survey shells retain their street setbacks, stepped podiums and courtyard voids.
window.HKHoManTinModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  const types={
    main:{wall:'#c4a891',glass:'#466771',trim:'#efe3d1',accent:'#955f4d',pitch:4.25},
    jubilee:{wall:'#e1ddd1',glass:'#607d80',trim:'#e7e5dc',accent:'#819987',pitch:4.35},
    health:{wall:'#bcc8c7',glass:'#497a82',trim:'#dde6e1',accent:'#719b99',pitch:4.5},
    twc:{wall:'#d2c6ac',glass:'#57767b',trim:'#e3dac6',accent:'#a2674a',pitch:4.15},
    annex:{wall:'#c8cbc4',glass:'#507582',trim:'#e0e3d8',accent:'#8a9b99',pitch:4.2}
  };
  // The smaller survey solids adjoining each academic tower form its podium.
  const campuses=new Map([
    [282516,['main','香港都會大學','HKMU · MAIN CAMPUS',1038,-2221]],
    [97978,['jubilee','銀禧學院','JUBILEE COLLEGE',867,-2163]],
    [303104,['jubilee','賽馬會校園','JOCKEY CLUB CAMPUS',867,-2163]],
    [275711,['health','賽馬會健康護理學院','INSTITUTE OF HEALTHCARE',1032,-2372]],
    [260753,['twc','東華學院','TUNG WAH COLLEGE',611,-1851]],
    [230376,['twc','馬錦燦紀念大樓','MA KAM CHAN MEMORIAL BUILDING',611,-1851]],
    [257163,['annex','鍾江海紀念大樓','TUNG WAH COLLEGE',294,-2435]],
    [110317,['annex','鍾秦蘭鳳大樓','TUNG WAH COLLEGE',315,-2435]],
    [224125,['annex','東華學院旺角校舍','MONG KOK CAMPUS',294,-2435]]
  ]);
  const civic=new Map([
    [72283,['何文田廣場','HOMANTIN PLAZA','#597768']],
    [73361,['愛民廣場','OI MAN PLAZA','#936c51']],
    [252993,['何文田政府合署','HO MAN TIN GOVERNMENT OFFICES','#556c75']],
    [337410,['房屋委員會總部','HOUSING AUTHORITY HEADQUARTERS','#507b74']],
    [84345,['何文田體育館','HO MAN TIN SPORTS CENTRE','#637c61']]
  ]);
  const estate=new Set([11793,11794,11798,72860,73080,73081,75580,95039,230044,230045,230069,237862,237863,238073,15866,15796,15798,15807]);
  const special=b=>!b.foundation&&campuses.has(b.id);
  function panel(draw,f,u,y,w,h,d,colour){
    draw(f.at(u-w/2,y-h/2,d),f.at(u+w/2,y-h/2,d),f.at(u+w/2,y+h/2,d),f.at(u-w/2,y+h/2,d),colour);
  }
  function entrance(fs,front){
    const eligible=fs.filter(f=>f.w>=8);
    function score(f){
      const [x,,z]=f.at(0,0,0),[nx,,nz]=f.at(0,0,1),dx=front[3]-x,dz=front[4]-z;
      return Math.hypot(dx,dz)-.65*(dx*(nx-x)+dz*(nz-z));
    }
    return eligible.sort((a,b)=>score(a)-score(b))[0];
  }
  function floors(b,type){
    const low=b.basePD+3.2, count=b.id===97978?12:Math.max(1,Math.floor((b.top-low-1)/type.pitch));
    return {low,count,pitch:(b.top-low-1)/count};
  }
  function academic(b,group,signs,ground){
    const spec=campuses.get(b.id),key=spec[0],type=types[key],mesh=shell(spec[1],group),fs=faces(b.p);
    const front=entrance(fs,spec),{low,count,pitch}=floors(b,type);
    const rings=[b.p,...(b.holes||[])];
    for(const f of fs){
      const p=f.at(0,0,0),base=(b.base||0)>2?b.basePD:Math.min(b.basePD-1,ground?ground(p[0],p[2])-1:b.basePD-1);
      panel(mesh.quad,f,0,(base+b.top)/2,f.w,b.top-base,0,type.wall);
      if(f.w<3)continue;
      const width=f.w-Math.min(1.35,f.w*.16);
      for(let j=0;j<count;j++){
        const y=low+(j+.5)*pitch,h=Math.min(pitch*.64,2.9);
        panel(mesh.quad,f,0,y,width,h,.04,type.glass);
        if(signs||key==='jubilee'){
          panel(mesh.quad,f,0,y-h/2-.12,width+.15,.23,.13,key==='main'?type.accent:type.trim);
          if(key==='jubilee'&&f.w>10)panel(mesh.quad,f,0,y+h*.28,width,.18,.17,type.trim);
        }
        if(key==='twc'&&(j===count-2||j===Math.floor(count*.42)))panel(mesh.quad,f,0,y-h/2-.38,f.w,.49,.085,type.accent);
      }
      if(signs){
        const spacing=key==='health'?2.9:key==='main'?4.4:3.65,divisions=Math.ceil(width/spacing);
        for(let k=1;k<divisions;k++){
          const u=(k/divisions-.5)*width;
          panel(mesh.quad,f,u,(low+b.top-1)/2,key==='health'?.16:.24,b.top-1-low,.09,type.trim);
        }
        if((key==='jubilee'||key==='health')&&f.w>18){
          const w=Math.min(3.3,f.w*.085);
          panel(mesh.quad,f,f.w*.36,(b.top+low)/2,w,b.top-low,.19,type.accent);
        }
      }
      panel(mesh.quad,f,0,b.top-.42,f.w,.84,.08,type.trim);
    }
    // Jubilee College has a vegetated vertical wall on one elevation and glazing on the others.
    if(b.id===97978&&front){
      const garden=fs.filter(f=>f.w>=9&&f!==front).sort((a,b)=>a.w-b.w)[0];
      if(garden){
        const w=Math.min(4.3,garden.w*.7),h=b.top-low-.6;
        panel(mesh.quad,garden,0,low+h/2,w,h,.24,'#53765e');
        for(let j=0;j<24;j++){
          const tint=['#65855d','#4e725e','#718956','#52765a'][j%4];
          panel(mesh.quad,garden,Math.sin(j*2.1)*w*.12,low+(j+.5)*h/24,w*.68,h/27,.26,tint);
        }
      }
    }
    // Inner walls and roof share all boundary vertices so roof slabs stop at the lightwell.
    for(const ring of rings.slice(1))for(const f of faces(ring))
      panel(mesh.quad,f,0,(b.top+b.basePD)/2,f.w,b.top-b.basePD,0,type.wall);
    const loops=rings.map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),vertices=rings.flat().map(([x,z])=>[x,b.top,z]);
    for(const [i,j,k] of THREE.ShapeUtils.triangulateShape(loops[0],loops.slice(1)))mesh.tri(vertices[k],vertices[j],vertices[i],'#a5aba1');
    if(front&&signs){
      const signY=b.basePD+Math.min(5.8,b.h*.55);
      panel(mesh.quad,front,0,signY-1.95,Math.min(10,front.w*.68),2.8,.13,type.glass);
      const span=Math.min(6.5,front.w*.39),y=signY-.91;
      mesh.quad(front.at(-span,y,.16),front.at(span,y,.16),front.at(span,y,1.35),front.at(-span,y,1.35),type.trim);
      mesh.quad(front.at(-span,y-.16,1.35),front.at(span,y-.16,1.35),front.at(span,y,1.35),front.at(-span,y,1.35),type.accent);
      if((b.id===282516||b.id===260753)&&front.w>10){
        badge(front,signs,b.top-2.28,.27,Math.min(11,front.w*.75),1.65,[spec[1],spec[2],key==='twc'?'#754c3e':'#346560']);
      }
      badge(front,signs,signY,.23,Math.min(16,front.w*.85),1.55,[spec[1],spec[2],key==='twc'||key==='annex'?'#88583f':'#356b65']);
    }
    mesh.finish();
  }
  function lights(b,fixtures){
    if(b.foundation)return;
    const spec=campuses.get(b.id),other=civic.get(b.id),housing=estate.has(b.id);
    if(!spec&&!other&&!housing)return;
    const fs=faces(b.p);
    if(!fs.length)return;
    const glow=(...args)=>panel((...q)=>fixtures.litQuad(...q),...args);
    if(spec){
      const type=types[spec[0]],{low,count,pitch}=floors(b,type);
      for(let i=0;i<fs.length;i++){
        const f=fs[i],width=f.w-Math.min(1.35,f.w*.16),n=Math.floor(width/3.9);
        for(let j=0;j<count;j++)for(let k=0;k<n;k++){
          const seed=(Math.imul(b.id+i*17+j*997+k*53,2654435761)>>>10)%31;
          if(seed>6)continue;
          const u=((k+.5)/n-.5)*width;
          if((spec[0]==='jubilee'||spec[0]==='health')&&f.w>18&&Math.abs(u-f.w*.36)<3.4)continue;
          glow(f,u,low+(j+.5)*pitch,Math.min(width/n*.68,2.6),Math.min(pitch*.48,2.1),.082,seed%3?'#efd2a4':'#b7d6d7');
        }
      }
      const front=entrance(fs,spec);
      if(front)glow(front,0,b.basePD+Math.min(5.8,b.h*.55)+.95,Math.min(13,front.w*.72),.15,.25,'#f4dcb4');
    }else{
      const front=fs.reduce((a,b)=>a.w>b.w?a:b);
      glow(front,0,b.basePD+Math.min(4.4,b.h*.44)+.84,Math.min(11,front.w*.64),.16,.21,'#f5ce97');
    }
  }
  function building(b,props,signs,ground,group){
    if(b.foundation)return;
    lights(b,props);
    if(special(b)){academic(b,group,signs,ground);return;}
    const entry=civic.get(b.id),housing=estate.has(b.id);
    if(!entry&&!housing)return;
    const fs=faces(b.p);if(!fs.length)return;
    const f=fs.reduce((a,b)=>a.w>b.w?a:b);
    badge(f,signs,b.basePD+Math.min(4.4,b.h*.44),.20,Math.min(housing?7:13,f.w*.72),housing?.9:1.3,entry||[b.n,b.en||'','#617c76']);
  }
  return {replaces:special,building,lights,style:b=>civic.has(b.id)?5:estate.has(b.id)?2:undefined,
    distant(b,batch,group){if(!special(b))return false;academic(b,group);return true;}};
})();
