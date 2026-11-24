/* Original street elevations, displays and bridge sections, in local survey metres. */
window.HKMongKokStreets=(()=>{
  const data=window.HKMongKokPlaces;
  const catalogs={
    sport:[['跑步專門','RUNNING'],['街場波鞋','COURT SHOES'],['運動用品','SPORTS CLUB']],
    electronics:[['影音專門','HI-FI AUDIO'],['數碼相機','CAMERA SHOP'],['潮流服飾','STREET WEAR'],['街頭小食','SNACK BAR']],
    ladies:[['時裝小店','FASHION'],['手袋飾物','ACCESSORIES'],['布藝精品','MARKET GOODS']],
    fish:[['熱帶魚','TROPICAL FISH'],['水族世界','AQUARIUM'],['水草專門','AQUASCAPE']],
    flower:[['鮮花花藝','FLORIST'],['四季花舍','FLOWER SHOP'],['園藝盆栽','PLANT SHOP']],
    local:[['涼茶','HERBAL TEA'],['士多','PROVISIONS'],['麵包西餅','BAKERY']],
    nathan:[['金銀珠寶','JEWELLERY'],['鐘錶行','WATCHES'],['冰室','BING SUTT'],['書報雜誌','BOOKS']]
  };
  const palette=['#b84636','#19675d','#305778','#946039','#706188','#303b46','#a85161'];
  const ids={83539:'langhamTower',79195:'langhamMall',224041:'langhamBase',62095:'cordis',266496:'moko',263749:'mokoTower',263750:'mokoTower',225903:'computer',166495:'sino',251328:'sinoTower',228870:'pioneer',208493:'pioneerTower',174821:'allied'};
  const names={langhamMall:['朗豪坊','LANGHAM PLACE'],langhamBase:['朗豪坊','LANGHAM PLACE'],cordis:['康得思酒店','CORDIS'],moko:['新世紀廣場','MOKO'],computer:['旺角電腦中心','MONG KOK COMPUTER CENTRE'],sino:['信和中心','SINO CENTRE'],pioneer:['始創中心','PIONEER CENTRE'],allied:['聯合廣場','ALLIED PLAZA']};
  const axes=(x,z,a)=>(u,y,v)=>[x+Math.cos(a)*u-Math.sin(a)*v,y,z+Math.sin(a)*u+Math.cos(a)*v];
  let atlas,labels;
  function label(pair,bg){
    if(!atlas){atlas=HKDetails.atlas();labels=new Map();}
    const key=pair[0]+bg;
    if(!labels.has(key))labels.set(key,atlas.add((c,w,h)=>{
      c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle='#f4d699';c.fillRect(6,h-8,w-12,3);
      HKDetails.lettering(c,pair[0],w/2,51,'bold 50px','#fff4d9',w-22);
      HKDetails.lettering(c,pair[1],w/2,94,'bold 25px','#f2e7d7',w-23);
    }));
    return labels.get(key);
  }
  function face(signs,at,entry,y,w,h,v,u=0){
    signs.quad(entry,[at(u-w/2,y-h/2,v),at(u+w/2,y-h/2,v),at(u+w/2,y+h/2,v),at(u-w/2,y+h/2,v)]);
  }
  function storefront(r,props,signs,height){
    const [x,z,a,width,kind,id]=r,at=axes(x,z,a),y=height(x,z),w=Math.min(width,10);
    const seed=Math.abs(Math.round(x*17+z*31)),brand=catalogs[kind][seed%catalogs[kind].length],tint=palette[seed%palette.length];
    const put=(u,h,v,ww,hh,d,col)=>props.add('box',...at(u,y+h,v),ww,hh,d,col,-a);
    put(0,1.56,.06,w,3.12,.14,'#263a3f');
    put(-w*.2,1.32,.15,w*.55,2.38,.12,kind==='fish'?'#428d89':'#526e70');
    for(const side of [-1,1])put(side*(w*.5-.07),1.52,.16,.11,3.04,.22,'#b2aca2');
    put(w*.28,1.32,.17,w*.30,2.58,.12,'#273c40');
    put(w*.30,1.22,.25,.05,.45,.055,'#cbbda2');
    if(seed%4===0){
      put(0,2.87,.51,w,.16,.91,tint);
      for(let i=0;i<5;i++)put((i-2)*w/5,2.74,.91,w*.095,.18,.07,'#e5cdb0');
    }
    put(0,2.99,.27,w,.12,.57,'#c1b6a4');put(0,3.52,.13,w,1.03,.25,tint);
    face(signs,at,label(brand,tint),y+3.54,w*.97,.95,.29);
    if(kind==='sport'){
      for(let row=0;row<3;row++){
        put(-w*.20,.68+row*.54,.24,w*.51,.055,.22,'#e0d7c1');
        for(let i=0;i<3;i++){
          const u=w*(-.37+i*.15),h=.79+row*.54;
          put(u,h,.28,.38,.13,.15,palette[(seed+i+row)%7]);put(u-.04,h-.07,.30,.49,.045,.17,'#eee6da');
        }
      }
    }else if(kind==='electronics'){
      for(let i=0;i<3;i++){put(w*(-.34+.15*i),1.38,.23,w*.13,.69,.09,'#172c35');put(w*(-.34+.15*i),1.4,.285,w*.115,.56,.025,i===1?'#6d9db3':'#86a6a1');}
    }else if(kind==='fish'){
      for(let row=0;row<2;row++)for(let i=0;i<3;i++){
        put(w*(-.36+i*.16),.9+row*.65,.27,w*.145,.53,.2,'#427e8b');
        put(w*(-.36+i*.16),.99+row*.65,.39,.11,.06,.04,'#f2ac55');
        put(w*(-.36+i*.16),1.17+row*.65,.31,w*.15,.035,.25,'#cbd4ca');
      }
    }else if(kind==='flower'){
      for(let i=0;i<4;i++){
        const u=w*(-.4+i*.15);put(u,.40,.27,.34,.47,.32,'#a16e4c');
        props.add('leaf',...at(u,y+.81,.30),.29,.44,.30,'#60865a');
        props.add('crown',...at(u+.04,y+1.04,.32),.19,.18,.19,['#e7c27c','#d98d92','#e1c5da'][i%3]);
      }
    }
    if(seed%9===1&&w>3.5&&!names[ids[id]]){
      const bx=at(-w*.37,y+5.25,.56);
      put(-w*.37,5.94,.50,.09,.10,1,'#5b605c');
      props.add('box',...bx,.16,1.25,.92,tint,-a);
      const blade=axes(bx[0],bx[2],a+Math.PI/2);
      face(signs,blade,label(brand,tint),bx[1],.88,.95,.09);
      face(signs,blade,label(brand,tint),bx[1],.88,.95,-.09);
    }
  }
  function stall(r,props,height,signs,hasSpace){
    const [x,z,a,i]=r,at=axes(x,z,a),y=height(x,z);
    const put=(u,h,v,w,hh,d,c)=>props.add('box',...at(u,y+h,v),w,hh,d,c,-a);
    if(i%4===1){
      const [px,,pz]=at(i%3*.23,0,-1.1);
      if(hasSpace(px,pz,true)){
        const base=height(px,pz),turn=-a+(i%3-1)*.23;
        for(const side of [-1,1])props.add('box',px+side*.095*Math.cos(turn),base+.42,pz-side*.095*Math.sin(turn),.145,.79,.19,'#44464b',turn);
        props.add('box',px,base+1.08,pz,.40,.64,.26,palette[i%7],turn);
        props.add('crown',px,base+1.58,pz,.15,.19,.15,i%3?'#c19473':'#ab7c60',turn);
        props.add('leaf',px,base+1.70,pz,.145,.095,.145,'#443a36',turn);
        props.add('box',px+.20*Math.cos(turn),base+.85,pz-.20*Math.sin(turn),.13,.31,.23,'#a78965',turn);
      }
    }
    const cloth=['#a84640','#447e79','#4c6d9a','#ae8057','#67806a'][i%5];
    for(const u of [-1.28,1.28])for(const v of [-.66,.66])put(u,1.11,v,.046,2.22,.046,'#a6a79a');
    put(0,2.24,0,2.85,.12,1.61,cloth);
    if(i%3===0)for(let j=-2;j<=2;j++)put(j*.55,2.31,0,.17,.025,1.58,'#e5d6b9');
    if(i%4===0){
      const sign=label(i%8===0?['手袋・皮具','HANDBAGS']:['時裝・精品','FASHION'],cloth);
      face(signs,at,sign,y+1.94,1.3,.40,.79);
    }put(0,2.06,.76,2.82,.34,.055,cloth);
    put(0,.83,0,2.54,.11,1.18,'#b39b7b');put(0,.44,-.04,2.45,.66,1.01,'#655d52');
    for(let j=0;j<5;j++){
      const u=-1.02+j*.50,c=palette[(i+j)%7];
      if(i%2){put(u,1.48,-.44,.35,.56,.10,c);put(u,1.65,-.44,.47,.14,.12,c);put(u,1.84,-.44,.15,.12,.07,'#ccb58c');}
      else {put(u,1.03,.17,.36,.27,.28,c);put(u,1.22,.17,.15,.09,.07,'#ab9878');}
    }
  }
  const style=k=>k==='moko'?12:k==='langhamMall'?5:['langhamTower','mokoTower','cordis','pioneerTower'].includes(k)?6:k==='sinoTower'?7:undefined;
  function building(b,props,signs,height){
    const kind=ids[b.id];if(!kind||b.foundation)return;
    const poly=b.p,xx=poly.map(p=>p[0]),zz=poly.map(p=>p[1]),cx=(Math.min(...xx)+Math.max(...xx))/2,cz=(Math.min(...zz)+Math.max(...zz))/2;
    const area=Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-p[1]*q[0];},0)/2);
    if(area<45)return;
    const low=b.basePD,top=b.top;
    const edges=poly.map((p,i)=>{const q=poly[(i+1)%poly.length],dx=q[0]-p[0],dz=q[1]-p[1],x=(p[0]+q[0])/2,z=(p[1]+q[1])/2;let a=Math.atan2(dz,dx);
      if(-Math.sin(a)*(x-cx)+Math.cos(a)*(z-cz)<0)a+=Math.PI;
      return {x,z,a,len:Math.hypot(dx,dz),at:axes(x,z,a)};
    });
    for(const f of edges){
      if(f.len<2.1)continue;
      const put=(u,y,v,w,h,d,c)=>props.add('box',...f.at(u,y,v),w,h,d,c,-f.a);
      if(kind==='langhamTower'||kind==='mokoTower'||kind==='cordis'){
        const h=Math.min(top-low,kind==='langhamTower'?122:48);
        for(let u=-f.len*.5+1.8;u<f.len*.5;u+=4.1)put(u,top-h/2,.10,.15,h,.22,'#bdc7c1');
        for(let y=top-1;y>top-h;y-=kind==='langhamTower'?18:8.2)put(0,y,.14,f.len,.27,.33,'#b5c5c6');
      }else if(kind==='moko'||kind==='langhamMall'){
        for(let y=low+6.4;y<top;y+=6.3)put(0,y,.14,f.len,.37,.32,kind==='moko'?'#c3c0ad':'#b8c7c8');
      }else if(kind==='sino'||kind==='computer'){
        put(0,low+4.65,.18,f.len,.42,.42,kind==='sino'?'#c8ae86':'#7a939d');
      }
    }
    if(kind==='langhamMall'&&area>1800){
      // Translucent barrel-vault ribs over the atrium, set inside the surveyed roof.
      const edge=edges.slice().sort((a,b)=>b.len-a.len)[0],at=axes(cx,cz,edge.a);
      for(let i=0;i<13;i++){
        const x=-12+i*2,y=top+.42+4.7*Math.sqrt(Math.max(0,1-x*x/169));
        props.add('box',...at(x,y,0),1.92,.28,13,'#8eafb4',-edge.a);
        props.add('box',...at(x,y+.18,0),.13,.19,13.4,'#d5d8cc',-edge.a);
      }
    }
    if(kind==='langhamTower'&&area>500){
      // The measured roof is the shoulder of the crown. Its architectural
      // top is around 255 m above street level (HK Institution of Engineers).
      const rx=Math.min(21,(Math.max(...xx)-Math.min(...xx))*.39),rz=Math.min(22,(Math.max(...zz)-Math.min(...zz))*.34);
      const capH=Math.max(12,low+255-top);
      props.add('dome',cx,top-.15,cz,rx,capH,rz,'#83aebb');
      for(let band=1;band<6;band++){
        const phi=band*Math.PI/12,xx=rx*Math.cos(phi),zz=rz*Math.cos(phi);
        props.add('ring',cx,top+capH*Math.sin(phi)-.15,cz,xx,.44,zz,'#d4dfda');
      }
    }
    if(kind==='moko'&&area>5000){
      // External garden terraces are visible from the flyover and footbridge.
      const west=edges.filter(f=>Math.sin(f.a)>.70&&f.len>14).sort((a,b)=>b.len-a.len).slice(0,4);
      for(const f of west){
        for(let j=-f.len*.44;j<f.len*.46;j+=3.2){
          const v=f.at(j,top-.1,-1.9);
          props.add('box',...v,2.8,.65,1.65,'#a2907c',-f.a);
          props.add('leaf',v[0],top+.52,v[2],1.44,.74,.83,'#74905d',-f.a);
        }
        props.add('box',...f.at(0,low+11.8,.12),f.len,.85,.32,'#938176',-f.a);
      }
    }
    if(!names[kind])return;
    const target={computer:[110,-2497],sino:[-10,-2234],moko:[195,-2913],langhamBase:[-155,-2468],langhamMall:[-145,-2465],pioneer:[-134,-3050],allied:[-170,-3100]}[kind]||[cx,cz+90];
    const f=edges.filter(e=>e.len>3.4).sort((a,b)=>Math.hypot(a.x-target[0],a.z-target[1])-Math.hypot(b.x-target[0],b.z-target[1]))[0];
    if(!f)return;
    const y=kind==='moko'?height(f.x,f.z)+12:Math.max(height(f.x,f.z)+4.8,low+3.1),w=Math.min(f.len-.25,kind==='moko'?20:13);
    const panel=kind==='computer'?'#283d5c':kind==='sino'?'#864838':kind==='moko'?'#343c39':'#3d5361';
    props.add('box',...f.at(0,y,.28),w,1.75,.52,panel,-f.a);
    face(signs,f.at,label(names[kind],panel),y,w*.98,1.66,.56);
    if(kind==='moko'&&w>7){
      props.add('box',...f.at(0,y-1.32,.61),w,.20,1.31,'#cbd1cb',-f.a);
      for(let u=-w*.42;u<w*.49;u+=2.3)props.add('box',...f.at(u,y-1.18,.51),.13,.13,1.28,'#9faead',-f.a);
    }
    if(kind==='computer'){props.add('box',...f.at(0,y+1.84,.22),Math.min(w,5.5),1.5,.33,'#202b38',-f.a);face(signs,f.at,label(['數碼廣場','DIGITAL • IT'],'#315882'),y+1.84,Math.min(w*.95,5.2),1.2,.40);}
  }
  function bridges(scene,height,kit,props){
    const {Batch,flatBatch,color}=kit,buf=new Batch();
    const slab=color('#b8bab0'),soffit=color('#8e9690'),roof=color('#81a398'),rail=color('#8aaba9'),edge=color('#cdd6c9');
    const q=(a,b,c,d,shade)=>buf.quad(a,b,c,d,shade);
    const podium=window.HKWestKowloon?.elements;
    const integratedPaths=new Set(podium?.integratedPaths),deckBridges=new Set(podium?.deckBridges);
    for(const b of data.bridges){
      if(integratedPaths.has(String(b.id)))continue;
      const deck=deckBridges.has(String(b.id))?HKMAP.elementsDeck.top:undefined;
      const p=b.p,w=b.w;let run=0;
      for(let i=1;i<p.length;i++){
        const a=p[i-1],e=p[i],dx=e[0]-a[0],dz=e[1]-a[1],len=Math.hypot(dx,dz);if(len<.05)continue;
        const nx=-dz/len,nz=dx/len,h0=(deck??(height(...a)+b.h[i-1]))+.18,h1=(deck??(height(...e)+b.h[i]))+.18;
        const pt=(t,u,h)=>[a[0]+dx*t+nx*u,h0+(h1-h0)*t+h,a[1]+dz*t+nz*u];
        const bands=(l,r,y0,y1,c)=>q(pt(0,l,y0),pt(1,l,y0),pt(1,r,y1),pt(0,r,y1),c);
        bands(-w/2,w/2,0,0,slab);bands(w/2,-w/2,-.41,-.41,soffit);
        for(const side of [-1,1]){
          const u=side*w/2;
          bands(u,u,-.41,.12,edge);bands(u,u,.17,.91,rail);bands(u,u,1.00,1.07,edge);
          if(b.cover){bands(u,side*.14,2.95,3.46,roof);bands(u,u,2.80,2.95,edge);}
        }
        for(let d=(3.2-run%3.2)%3.2;d<len;d+=3.2)for(const side of [-1,1]){
          const h=b.cover?2.91:1.07,v=pt(d/len,side*(w/2-.07),h/2);
          props.add('box',...v,.095,h,.095,'#a5ada6');
        }
        if(b.steps&&Math.abs(h1-h0)>.12){
          const n=Math.max(1,Math.ceil(Math.abs(h1-h0)/.17));
          for(let j=0;j<n;j++){const t=j/n,end=(j+1)/n,dy=(h1-h0)/n; q(pt(t,-w/2,.025),pt(t,w/2,.025),pt(end,w/2,.025-dy),pt(end,-w/2,.025-dy),slab);}
        }
        for(const [x,z] of b.posts){
          const t=((x-a[0])*dx+(z-a[1])*dz)/(len*len);
          if(t<0||t>=1||Math.abs((x-a[0])*nx+(z-a[1])*nz)>w*.55)continue;
          const base=deck??height(x,z),h=h0+(h1-h0)*t-.41-base;
          if(h>1){props.add('box',x,base+h/2,z,.84,h,.88,'#b6b9ac',-Math.atan2(dz,dx));
            props.add('box',x,base+h-.24,z,1.08,.48,Math.min(3.2,w*.76),'#a5aba0',-Math.atan2(dz,dx));}
        }
        run+=len;
      }
    }
    for(const tunnel of data.subways){
      const p=tunnel.p,dist=[0];for(let i=1;i<p.length;i++)dist.push(dist[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));
      const len=dist.at(-1),w=tunnel.w*.5;
      for(let i=1;i<p.length;i++){
        const a=p[i-1],e=p[i],dx=e[0]-a[0],dz=e[1]-a[1],l=dist[i]-dist[i-1];if(l<.04)continue;
        const point=(t,u,h)=>{
          const x=a[0]+dx*t-dz/l*u,z=a[1]+dz*t+dx/l*u,k=(dist[i-1]+l*t)/len;
          return [x,height(x,z)+tunnel.ends[0]*(1-k)+tunnel.ends[1]*k+h,z];
        };
        q(point(0,-w,0),point(1,-w,0),point(1,w,0),point(0,w,0),slab);
        for(const side of [-1,1]){
          const u=side*w,high=tunnel.covered?2.7:1.06;
          q(point(0,u,0),point(1,u,0),point(1,u,high),point(0,u,high),soffit);
          if(!tunnel.covered){
            const A=point(0,u,0),B=point(1,u,0);
            q(A,B,[B[0],height(B[0],B[2])+.58,B[2]],[A[0],height(A[0],A[2])+.58,A[2]],edge);
          }
        }
        if(tunnel.covered)q(point(0,-w,2.7),point(0,w,2.7),point(1,w,2.7),point(1,-w,2.7),soffit);
        else {
          const n=Math.max(1,Math.ceil(l/.33));
          for(let j=0;j<n;j++){
            const a=point(j/n,-w,.035),b=point(j/n,w,.035),c=point((j+1)/n,w,.035),d=point((j+1)/n,-w,.035);
            c[1]=b[1];d[1]=a[1];q(a,b,c,d,slab);
          }
        }
      }
    }
    const mesh=buf.mesh(flatBatch(),scene,true);if(mesh)mesh.name='旺角行人天橋及樓梯';
  }
  function entrance(signs,x,y,z,ref){
    const entry=label(['港鐵 '+ref,'MTR'],'#9f2637');
    for(const a of [0,Math.PI])face(signs,axes(x,z,a),entry,y,.93,.78,.12);
  }
  return {owners:new Set(data.facades.map(r=>r[5])),entrance,data,bridges,building,storefront,stall,ids,style};
})();
