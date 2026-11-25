// Survey outlines and roof datums remain the collision footprints of each building.
window.HKToKwaWanModels=(()=>{
  const {faces,shell,cap,plate,badge}=HKCoastModels.geometry;
  const market=59596,offices=247151,ferry=285984;
  const depot=new Set(HKCattleDepot),major=new Set([market,offices,159674,ferry]);
  const towers=new Set([157549,159337,160579,162644,163912,255519,255520,255522,255523,255524,255718]);
  const isCivic=b=>b.id===market||b.id===offices;
  const special=b=>!b.foundation&&(isCivic(b)||depot.has(b.id));
  const signsById=new Map([
    [market,['土瓜灣街市','TO KWA WAN MARKET','#126944']],
    [offices,['土瓜灣市政大廈暨政府合署','MARKET AND GOVERNMENT OFFICES','#4d584e']],
    [159674,['馬頭角道政府合署','MA TAU KOK ROAD GOVERNMENT OFFICES','#556768']],
    [ferry,['九龍城渡輪碼頭','KOWLOON CITY FERRY PIER','#284c54']]
  ]);
  function panel(mesh,f,u,y,w,h,d,color){
    const p=(a,b)=>f.at(u+a*w/2,y+b*h/2,d);
    mesh.quad(p(-1,-1),p(1,-1),p(1,1),p(-1,1),color);
  }
  function disc(mesh,f,u,y,r,d,color){
    const c=f.at(u,y,d);
    for(let i=0;i<18;i++){
      const a=i*Math.PI/9,b=(i+1)*Math.PI/9;
      mesh.tri(c,f.at(u+r*Math.cos(a),y+r*Math.sin(a),d),f.at(u+r*Math.cos(b),y+r*Math.sin(b),d),color);
    }
  }
  function apple(mesh,f,u,y,r){
    const outline=[[-.02,.69],[-.37,.81],[-.72,.72],[-.93,.39],[-.96,.04],[-.77,-.50],[-.49,-.80],[-.17,-.89],[.08,-.81],[.34,-.88],[.58,-.73],[.83,-.39],[.96,.12],[.87,.51],[.64,.76],[.35,.82]];
    let prev=outline.at(-1);
    for(const v of outline){mesh.tri(f.at(u,y,.22),f.at(u+r*prev[0],y+r*prev[1],.22),f.at(u+r*v[0],y+r*v[1],.22),'#d93836');prev=v;}
    mesh.quad(f.at(u,y+r*.71,.23),f.at(u+.1*r,y+r*1.14,.23),f.at(u+.48*r,y+r*1.29,.23),f.at(u+.31*r,y+r*.92,.23),'#539156');
  }
  function civic(b,group,near,signs){
    const hall=b.id===market,mesh=shell(hall?'土瓜灣街市 · 綠色圓窗與紅蘋果':'土瓜灣政府合署 · 辦公塔樓',group);
    const fs=faces(b.p),y=b.basePD,top=b.top;
    const front=fs[hall?1:6];
    for(const f of fs){
      panel(mesh,f,0,(top+y-2)/2,f.w,top-y+2,0,hall?'#dfdbcc':'#d9d9ce');
      if(hall){
        panel(mesh,f,0,top-2.2,f.w,4.4,.055,'#3d916e');
        const count=Math.floor(f.w/4.7);
        for(let i=0;i<count;i++){
          const u=f.w*((i+.5)/count-.5);
          if((f===front||f===fs[0])&&i===0){apple(mesh,f,u,top-2.3,1.38);continue;}
          disc(mesh,f,u,top-2.12,1.12,.09,'#214c43');
          if(near)panel(mesh,f,u,top-2.12,.09,2.1,.12,'#8ca895');
        }
        for(let u=-f.w/2+2.5;u<f.w/2-1.5;u+=5.2){
          panel(mesh,f,u,y+2.1,3.6,3.5,.06,'#38564f');
          if(near)for(let k=0;k<3;k++)panel(mesh,f,u,y+4.1+k*.34,3.8,.18,.13,'#387b5c');
        }
      }else if(f.w>12){
        const n=Math.max(2,Math.floor(f.w/2.95));
        for(let row=0;row<10;row++)for(let k=0;k<n;k++){
          const u=(.5+k-n/2)*f.w/n;
          if(k===0&&f.w>28)disc(mesh,f,u,y+4.9+row*3.66,.75,.07,'#566569');
          else panel(mesh,f,u,y+4.9+row*3.66,Math.min(1.72,f.w/n*.63),1.69,.07,'#4f6266');
        }
      }else if(f.w>4&&f!==front){
        panel(mesh,f,0,y+b.h*.51,Math.min(2.1,f.w*.36),b.h*.87,.04,'#627a79');
      }
    }
    cap(mesh,b.p.map(([x,z])=>[x,top,z]),hall?'#a9aba1':'#c3c4b8');
    if(!hall)apple(mesh,front,0,y+3.3,1.75);
    if(near){
      const door=hall?fs[0]:fs[9];
      badge(door,signs,y+4.5,.21,Math.min(door.w*.74,16),1.08,signsById.get(b.id));
    }
    mesh.finish();
  }
  function heritage(b,group,near){
    const mesh=shell('牛棚藝術村 · 紅磚瓦頂',group),fs=faces(b.p),y=b.basePD;
    const eave=b.top-Math.min(1.8,b.h*.28),ends=b.p.map(([x,z])=>[x,eave,z]);
    for(const f of fs){
      panel(mesh,f,0,(eave+y-1.6)/2,f.w,eave-y+1.6,0,'#995845');
      for(let u=-f.w/2+2;u<=f.w/2-1.65;u+=4.1){
        panel(mesh,f,u,y+1.65,1.7,2,.05,'#365b4e');
        if(near)panel(mesh,f,u,y+2.77,1.93,.18,.08,'#c18b6c');
      }
    }
    const roof=HKDepotRoofs[b.id];
    if(roof&&roof.length){for(const tri of roof)mesh.tri(...tri.map(([x,z,t])=>[x,eave+t*(b.top-eave),z]),'#635c54');}
    else cap(mesh,ends,'#68645d');
    mesh.finish();
  }
  function lights(b,lit){
    if(b.foundation||(!major.has(b.id)&&!depot.has(b.id)&&!towers.has(b.id)))return;
    const y=b.basePD,fs=faces(b.p);
    function glow(f,u,h,w,ht,col,d=.16){
      lit.litQuad(f.at(u-w/2,h-ht/2,d),f.at(u+w/2,h-ht/2,d),f.at(u+w/2,h+ht/2,d),f.at(u-w/2,h+ht/2,d),col);
    }
    if(b.id===market){
      for(const f of fs)if(f!==fs[2])for(let u=-f.w/2+2.5;u<f.w/2-1.5;u+=5.2)glow(f,u,y+2.6,3.25,1.65,'#f1c58c');
    }else if(b.id===offices){
      for(const f of fs.filter(f=>f.w>12)){
        const n=Math.max(2,Math.floor(f.w/2.95));
        for(let j=0;j<10;j++)for(let k=1;k<n;k++)if((j*7+k*3+b.id)%11<3)
          glow(f,(.5+k-n/2)*f.w/n,y+4.9+j*3.66,Math.min(1.61,f.w/n*.6),1.57,'#dedbc0');
      }
      glow(fs[6],0,y+5.66,3.2,.14,'#e7cd97');
    }else{
      const f=fs.reduce((a,b)=>a.w>b.w?a:b);
      if(depot.has(b.id)){
        for(const side of fs.filter(side=>side.w>=f.w*.60))
          for(let u=-side.w/2+2;u<=side.w/2-1.65;u+=8.2)glow(side,u,y+1.9,1.44,.85,'#e7ba87');
      }else if(towers.has(b.id)){
        for(const side of fs.filter(side=>side.w>10))glow(side,0,b.top-1.2,side.w*.8,.22,'#a8c1bd');
      }else glow(f,0,y+Math.min(3.9,b.h*.7),Math.min(11,f.w*.75),.26,'#eed6a6');
    }
  }
  function building(b,props,signs,height,group){
    if(b.foundation)return;
    lights(b,props);
    if(isCivic(b))civic(b,group,true,signs);
    else if(depot.has(b.id))heritage(b,group,true);
    else if(major.has(b.id)||towers.has(b.id)){
      const fs=faces(b.p).filter(f=>f.w>6);
      if(!fs.length)return;
      const f=fs.reduce((a,b)=>a.w>b.w?a:b);
      if(signsById.has(b.id))badge(f,signs,b.basePD+Math.min(4.8,b.h*.5),.2,Math.min(13,f.w*.7),1.15,signsById.get(b.id));
      if(towers.has(b.id))for(const side of fs.filter(f=>f.w>10))for(const u of [-1,1])
        plate(side,props,u*side.w*.42,b.basePD+b.h*.51,.08,.37,b.h*.94,.18,'#bcbeb0');
    }
  }
  return {building,lights,replaces:special,style:b=>towers.has(b.id)?6:major.has(b.id)?5:undefined,
    distant(b,batch,group){if(!special(b))return false;if(isCivic(b))civic(b,group,false);else heritage(b,group,false);return true;}};
})();
