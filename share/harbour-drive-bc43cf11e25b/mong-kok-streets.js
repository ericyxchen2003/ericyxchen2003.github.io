/* Original street elevations, displays and bridge sections, in local survey metres. */
window.HKMongKokStreets=(()=>{
  const data=window.HKMongKokPlaces;
  const catalogs={
    sspPC:[['電腦硬件','PC HARDWARE'],['主機板・記憶體','COMPONENTS']],
    sspParts:[['音響維修','HI-FI REPAIR'],['電子零件','RADIO PARTS'],['二手唱片','RECORDS']],
    sspCafe:[['手沖咖啡','COFFEE ROASTERS'],['版畫小室','PRINT STUDIO'],['生活選物','DESIGN GOODS']],
    sspFood:[['豬潤麵','NOODLE SHOP'],['豆腐花','TOFU PUDDING'],['咖央多士','KAYA TOAST'],['蝦籽撈麵','SHRIMP ROE NOODLES']],
    fabric:[['成衣批發','GARMENT WHOLESALE'],['針織時裝','KNITWEAR'],['服裝陳列室','FASHION SHOWROOM'],['布辦行','FABRIC SAMPLES']],
    sspFabric:[['布辦・花邊','FABRIC & LACE'],['鈕扣行','BUTTONS'],['皮革材料','LEATHER GOODS']],
    thai:[['泰式船麵','ก๋วยเตี๋ยวเรือ'],['泰國雜貨','THAI GROCERIES'],['泰式甜品','THAI DESSERTS'],['泰式燒烤','THAI GRILL']],
    kcFood:[['潮州打冷','CHIU CHOW KITCHEN'],['越式河粉','PHỞ'],['清真咖喱','HALAL CURRY'],['糖水舖','DESSERTS'],['泰國菜館','THAI KITCHEN']],
    food:[['港式茶餐廳','CHA CHAAN TENG'],['韓式小館','KOREAN KITCHEN'],['台式小食','TAIWANESE SNACKS'],['日式食堂','JAPANESE KITCHEN'],['燒味飯店','ROAST MEATS'],['街坊漢堡','BURGER CAFE']],
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
  function face(signs,at,entry,y,w,h,v,u=0,hours){
    signs.quad(entry,[at(u-w/2,y-h/2,v),at(u+w/2,y-h/2,v),at(u+w/2,y+h/2,v),at(u-w/2,y+h/2,v)],hours);
  }
  const interiorKinds={
    sspPC:'tech',sspParts:['tech','tech','books'],sspCafe:['cafe','books','market'],sspFood:'cafe',
    fabric:'fashion',sspFabric:'tailor',thai:['cafe','market','bakery','cafe'],kcFood:'cafe',food:'cafe',
    sport:'shoes',electronics:['tech','tech','fashion','cafe'],ladies:'fashion',
    local:['cafe','market','bakery'],nathan:['jewels','watch','cafe','books']
  };
  function storefront(r,props,signs,height,interiors){
    const [x,z,a,width,kind,id]=r,at=axes(x,z,a),y=height(x,z),w=Math.min(width,10);
    const seed=Math.abs(Math.round(x*17+z*31)),brand=catalogs[kind][seed%catalogs[kind].length],tint=palette[seed%palette.length];
    const put=(u,h,v,ww,hh,d,col)=>props.add('box',...at(u,y+h,v),ww,hh,d,col,-a);
    put(0,1.56,.06,w,3.12,.14,'#263a3f');
    put(-w*.2,1.32,.15,w*.55,2.38,.12,kind==='fish'?'#428d89':'#526e70');
    const hours=HKShopLights.hours(x,z);
    const kinds=interiorKinds[kind],trade=Array.isArray(kinds)?kinds[seed%catalogs[kind].length]:kinds;
    if(trade){
      const tag={mat:interiors.material,uv:interiors.uv[trade+(seed%2)]};
      face(signs,at,tag,y+1.38,w*.53,2.16,.216,-w*.2,hours);
    }else props.shopPanel(at,-w*.2,y+1.38,.218,w*.53,2.16,kind==='fish'?'#749fa4':'#cbb89a',hours);
    for(const side of [-1,1])put(side*(w*.5-.07),1.52,.16,.11,3.04,.22,'#b2aca2');
    put(w*.28,1.32,.17,w*.30,2.58,.12,'#273c40');
    put(w*.30,1.22,.25,.05,.45,.055,'#cbbda2');
    if(seed%4===0){
      put(0,2.87,.51,w,.16,.91,tint);
      for(let i=0;i<5;i++)put((i-2)*w/5,2.74,.91,w*.095,.18,.07,'#e5cdb0');
    }
    put(0,2.99,.27,w,.12,.57,'#c1b6a4');put(0,3.52,.13,w,1.03,.25,tint);
    face(signs,at,HKDetails.shopBoard(...brand,tint,'#fff4d9',w*.97,.95,trade),y+3.54,w*.97,.95,.29,0,hours);
    props.shopShutter(at,0,y+1.34,.48,w-.18,2.70,hours);
    if(kind==='food'||kind==='thai'||kind==='kcFood'||kind==='sspFood'||kind==='sspCafe'){
      put(-w*.20,1.02,.27,w*.52,.13,.4,'#c0b5a3');
      for(let i=0;i<3;i++)put(w*(-.37+i*.16),1.84,.25,w*.13,.44,.035,i%2?'#b99571':'#e2cf99');
      put(w*.34,1.61,.25,.31,.5,.04,'#e3c891');
    }else if(kind==='sport'){
      for(let row=0;row<3;row++){
        put(-w*.20,.68+row*.54,.24,w*.51,.055,.22,'#e0d7c1');
        for(let i=0;i<3;i++){
          const u=w*(-.37+i*.15),h=.79+row*.54;
          put(u,h,.28,.38,.13,.15,palette[(seed+i+row)%7]);put(u-.04,h-.07,.30,.49,.045,.17,'#eee6da');
        }
      }
    }else if(kind==='electronics'||kind==='sspPC'||kind==='sspParts'){
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
      const tag=HKDetails.shopBoard(...brand,tint,'#fff4d9',.88,1.19,trade);
      face(signs,blade,tag,bx[1],.88,1.19,.09,0,hours);
      face(signs,(u,y,v)=>blade(-u,y,v),tag,bx[1],.88,1.19,-.09,0,hours);
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
    const hours=HKShopLights.hours(x,z);
    props.shopPanel(at,0,y+2.03,.56,.86,.085,'#ffe3ac',hours);
    if(i%3===0)for(let j=-2;j<=2;j++)put(j*.55,2.31,0,.17,.025,1.58,'#e5d6b9');
    if(i%4===0){
      const sign=label(r[4]==='parts'?['二手影音','AUDIO & RADIO']:i%8===0?['手袋・皮具','HANDBAGS']:['時裝・精品','FASHION'],cloth);
      face(signs,at,sign,y+1.94,1.3,.40,.79,0,hours);
    }put(0,2.06,.76,2.82,.34,.055,cloth);
    put(0,.83,0,2.54,.11,1.18,'#b39b7b');put(0,.44,-.04,2.45,.66,1.01,'#655d52');
    for(let j=0;j<5;j++){
      const u=-1.02+j*.50,c=palette[(i+j)%7];
      if(r[4]==='parts'){put(u,1.08,.09,.39,.36,.28,'#434d4c');put(u,1.10,.24,.26,.14,.035,j%2?'#7a958b':'#aab1a4');put(u+.12,1.01,.25,.05,.05,.04,'#dbcda9');}
      else if(i%2){put(u,1.48,-.44,.35,.56,.10,c);put(u,1.65,-.44,.47,.14,.12,c);put(u,1.84,-.44,.15,.12,.07,'#ccb58c');}
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
        if(i%3!==0){
          const skylight=(u,across,offset)=>at(u,y+.149+offset,across);
          props.litPanel(skylight,x,0,0,1.66,12.7,'#a4bdb3');
        }
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
        const y=top+capH*Math.sin(phi)-.15;
        props.add('ring',cx,y,cz,xx,.44,zz,'#d4dfda');
        if(band===2||band===4)for(let k=0;k<36;k++){
          const a=k*Math.PI/18,c=(k+1)*Math.PI/18;
          const at=(u,h,v)=>[cx+(xx+.065)*((1-u)*Math.sin(a)+u*Math.sin(c)),h,cz+(zz+.065)*((1-u)*Math.cos(a)+u*Math.cos(c))];
          props.litPanel(at,.5,y,0,1,.25,'#c5d9cb');
        }
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
    props.litPanel(f.at,0,y-.84,.55,w*.95,.085,'#f1c38b');
    if(kind==='moko'&&w>7){
      props.add('box',...f.at(0,y-1.32,.61),w,.20,1.31,'#cbd1cb',-f.a);
      for(let u=-w*.42;u<w*.49;u+=2.3)props.add('box',...f.at(u,y-1.18,.51),.13,.13,1.28,'#9faead',-f.a);
    }
    if(kind==='computer'){props.add('box',...f.at(0,y+1.84,.22),Math.min(w,5.5),1.5,.33,'#202b38',-f.a);face(signs,f.at,label(['數碼廣場','DIGITAL • IT'],'#315882'),y+1.84,Math.min(w*.95,5.2),1.2,.40);}
  }
  function bridges(scene,height,kit,props){
    const {Batch,flatBatch,color}=kit;
    const slab=color('#b8bab0'),soffit=color('#8e9690'),roof=color('#81a398'),rail=color('#8aaba9'),edge=color('#cdd6c9');
    const podium=window.HKWestKowloon?.elements;
    const integratedPaths=new Set(podium?.integratedPaths),deckBridges=new Set(podium?.deckBridges);
    const roadById=new Map(HKMAP.roads.map(r=>[r.id,r]));
    const fit=window.HKFootbridgeFit;
    const walks=data.bridges.filter(b=>!integratedPaths.has(String(b.id))).map(b=>({...b,...fit?.ways[b.id]}));
    const owners=new Set(walks.map(b=>String(b.id)));
    for(const access of fit?.access||[])if(owners.has(access.id.split(':')[0]))walks.push(access);
    // Join cross-sections in 3D. Stacked concourses can share plan coordinates.
    const joints=new Map();
    const direction=(a,b)=>{
      const x=b[0]-a[0],z=b[1]-a[1],len=Math.hypot(x,z)||1;
      return [x/len,z/len];
    };
    const jointKey=(p,y)=>p[0].toFixed(2)+','+p[1].toFixed(2)+','+Math.round(y*10);
    for(const b of walks){
      const deck=deckBridges.has(String(b.id))?HKMAP.elementsDeck.top:undefined;
      b.tops=b.levels||b.p.map((p,i)=>(deck??(height(...p)+b.h[i]))+.18);
      b.flush=new Set(b.flushSegments);
      b.keys=b.p.map((pt,i)=>jointKey(pt,b.tops[i]));
      for(let i=0;i<b.p.length;i++){
        const key=b.keys[i],links=joints.get(key)||[];
        if(i>0&&!b.flush.has(i))links.push({b,i,axis:direction(b.p[i],b.p[i-1])});
        if(i+1<b.p.length&&!b.flush.has(i+1))links.push({b,i,axis:direction(b.p[i],b.p[i+1])});
        joints.set(key,links);
      }
    }
    // A single shared normal on both sides of a bend closes the deck, fascia
    // and roof seams. Limit the miter at switchbacks to keep it on the landing.
    function crossSection(b,i,forward){
      const links=joints.get(b.keys[i]),sign=forward?1:-1;
      const a=b.p[i],axis=direction(a,b.p[i+sign]);
      let mate=null,dot=1;
      for(const link of links){
        const d=axis[0]*link.axis[0]+axis[1]*link.axis[1];
        if(d<dot){dot=d;mate=link;}
      }
      const n=[-axis[1]*sign,axis[0]*sign];
      if(!mate||dot>.72)return n;
      const mx=(mate.axis[1]-axis[1])*sign,mz=(axis[0]-mate.axis[0])*sign;
      const div=Math.max(Math.hypot(mx,mz)*.71,mx*n[0]+mz*n[1]);
      const taper=links.length===2?Math.min(b.w,mate.b.w)/b.w:1;
      return [mx/div*taper,mz/div*taper];
    }
    function drawWalk(b,q,props){
      const p=b.p,w=b.w,flush=b.flush;let run=0;
      const pierAt=new Map();
      for(const [x,z] of b.posts){
        let owner=-1,best=Infinity,along=0;
        for(let i=1;i<p.length;i++){
          if(flush.has(i))continue;
          const a=p[i-1],dx=p[i][0]-a[0],dz=p[i][1]-a[1],ll=dx*dx+dz*dz;
          if(ll<.0025)continue;
          const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/ll));
          const d=Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
          if(d<best){owner=i;best=d;along=t;}
        }
        if(owner<0||best>w*.55)continue;
        if(!pierAt.has(owner))pierAt.set(owner,[]);
        pierAt.get(owner).push([x,z,along]);
      }
      for(let i=1;i<p.length;i++){
        const a=p[i-1],e=p[i],dx=e[0]-a[0],dz=e[1]-a[1],len=Math.hypot(dx,dz);if(len<.05)continue;
        if(flush.has(i)){
          const road=roadById.get(b.crossingPaint?.[i]?.[1]);
          if(road){
            const nx=-dz/len,nz=dx/len,half=Math.min(2,w*.42);
            const point=(d,u)=>{
              const x=a[0]+dx*d/len+nx*u,z=a[1]+dz*d/len+nz*u;
              let gap=Infinity,px=x,pz=z;
              for(let k=1;k<road.p.length;k++){
                const start=road.p[k-1],sx=road.p[k][0]-start[0],sz=road.p[k][1]-start[1];
                const t=Math.max(0,Math.min(1,((x-start[0])*sx+(z-start[1])*sz)/(sx*sx+sz*sz||1)));
                const cx=start[0]+t*sx,cz=start[1]+t*sz,dist=Math.hypot(x-cx,z-cz);
                if(dist<gap){gap=dist;px=cx;pz=cz;}
              }
              return gap<=road.w/2+.08?[x,height.surface(px,pz,road.l,road.id)+.05,z]:null;
            };
            for(let d=(1.12-run%1.12)%1.12;d+.42<=len;d+=1.12){
              const stripe=[point(d,-half),point(d,half),point(d+.42,half),point(d+.42,-half)];
              if(stripe.every(Boolean))q(...stripe,color('#dfa83b'));
            }
          }
          run+=len;continue;
        }
        const h0=b.tops[i-1],h1=b.tops[i],start=crossSection(b,i-1,true),finish=crossSection(b,i,false);
        const pt=(t,u,h)=>[a[0]+dx*t+(start[0]+(finish[0]-start[0])*t)*u,h0+(h1-h0)*t+h,a[1]+dz*t+(start[1]+(finish[1]-start[1])*t)*u];
        const bands=(l,r,y0,y1,c,low=0,high=1)=>q(pt(low,l,y0),pt(high,l,y0),pt(high,r,y1),pt(low,r,y1),c);
        if(b.steps&&Math.abs(h1-h0)>.035){
          const n=Math.max(1,Math.ceil(Math.abs(h1-h0)/.175)),rise=(h1-h0)/n;
          for(let j=0;j<n;j++){
            const t=j/n,v=(j+1)/n,lift=Math.max(0,rise);
            q(pt(t,-w/2,lift),pt(t,w/2,lift),pt(v,w/2,lift-rise),pt(v,-w/2,lift-rise),slab);
            const u=rise>0?t:v;
            q(pt(u,-w/2,0),pt(u,w/2,0),pt(u,w/2,Math.abs(rise)),pt(u,-w/2,Math.abs(rise)),soffit);
          }
        }else bands(-w/2,w/2,0,0,slab);
        bands(w/2,-w/2,-.41,-.41,soffit);
        const openStart=joints.get(b.keys[i-1]).length>2,openEnd=joints.get(b.keys[i]).length>2;
        const from=openStart?Math.min(1,w*.51/len):0,to=openEnd?Math.max(0,1-w*.51/len):1;
        for(const side of [-1,1]){
          const u=side*w/2;
          bands(u,u,-.41,.12,edge);
          if(from<to){
            bands(u,u,.17,.91,rail,from,to);bands(u,u,1,1.07,edge,from,to);
          }
          if(b.cover){bands(u,0,2.95,3.46,roof);bands(u,u,2.80,2.95,edge);}
        }
        const upright=t=>{
          for(const side of [-1,1]){
            const h=b.cover?2.88:1.07,v=pt(t,side*(w/2-.05),h/2);
            props.add('box',...v,.095,h,.095,'#a5ada6');
          }
        };
        for(let d=(3.2-run%3.2)%3.2;d<len-.02;d+=3.2)if(d/len>=from&&d/len<=to)upright(d/len);
        if(i===p.length-1&&to===1&&((run+len)%3.2)>.18)upright(1);
        for(const [idx,t] of [[i-1,0],[i,1]]){
          if(idx!==0&&idx!==p.length-1)continue;
          q(pt(t,-w/2,-.41),pt(t,w/2,-.41),pt(t,w/2,0),pt(t,-w/2,0),edge);
          if(b.endRails?.includes(idx)){
            q(pt(t,-w/2,.17),pt(t,w/2,.17),pt(t,w/2,.91),pt(t,-w/2,.91),rail);
            q(pt(t,-w/2,1),pt(t,w/2,1),pt(t,w/2,1.07),pt(t,-w/2,1.07),edge);
          }
          if(b.lifts?.includes(idx)){
            const [x,y,z]=pt(t,0,0),base=height(x,z)-.25,high=y+2.75-base,angle=-Math.atan2(dz,dx);
            props.add('box',x,base+high/2,z,2.2,high,2.5,'#899d9a',angle);
            props.add('box',x,y+2.82,z,2.45,.2,2.72,'#bdc7bd',angle);
            const offset=t===0?1.115:-1.115;
            for(const floor of [base+.25,y])props.add('box',x+dx/len*offset,floor+1.05,z+dz/len*offset,.04,2.1,1.35,'#556764',angle);
          }
        }
        for(const [x,z,t] of pierAt.get(i)||[]){
          // Bury the entire foot of the pier on sloping ground. The underside
          // of the deck is the bearing elevation, including at the last node.
          const base=Math.min(height(x-.61,z-.61),height(x-.61,z+.61),height(x+.61,z-.61),height(x+.61,z+.61))-.12;
          const h=h0+(h1-h0)*t-.39-base;
          if(h>.48){
            props.add('box',x,base+h/2,z,.84,h,.88,'#b6b9ac',-Math.atan2(dz,dx));
            props.add('box',x,base+h-.19,z,1.08,.40,Math.min(2.5,w*.74),'#a5aba0',-Math.atan2(dz,dx));
          }
        }
        run+=len;
      }
    }
    function drawSubway(tunnel,q){
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
    const material=flatBatch();
    function finish(buf,parent){
      const mesh=buf.mesh(material,parent,true);if(mesh)mesh.name='行人天橋及樓梯';
    }
    // Keep each complete walkway and its supports together when a tile is unloaded.
    const tiles=new Map(),groups=new Map();
    function register(way,draw){
      const p=way.p,cell=Math.floor(p[0][0]/180)+'/'+Math.floor(p[0][1]/180);
      if(!tiles.has(cell))tiles.set(cell,{bounds:[Infinity,Infinity,-Infinity,-Infinity],ways:[]});
      const tile=tiles.get(cell),b=tile.bounds;
      for(const [x,z] of p){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],z);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],z);}
      tile.ways.push([way,draw]);
    }
    for(const way of walks)register(way,drawWalk);
    for(const way of data.subways)register(way,drawSubway);
    if(!kit.instances||!window.HKScenery){
      for(const tile of tiles.values()){
        const buf=new Batch(),q=buf.quad.bind(buf);
        for(const [way,draw] of tile.ways)draw(way,q,props);
        finish(buf,scene);
      }
      return;
    }
    return HKRoadTiles.stream([...tiles.values()],function* build(tile,index){
      const parent=new THREE.Group(),buf=new Batch(),q=buf.quad.bind(buf),supports=kit.instances(parent);
      for(const [way,draw] of tile.ways){draw(way,q,supports);yield;}
      finish(buf,parent);supports.flush();groups.set(index,parent);scene.add(parent);
    },{radius:HKScenery.compact?700:2100,firstRadius:HKScenery.compact?170:320,release(index){HKScenery.removeGroup(groups.get(index));groups.delete(index);}});
  }
  function entrance(signs,x,y,z,ref){
    const entry=label(['港鐵 '+ref,'MTR'],'#9f2637');
    for(const a of [0,Math.PI])face(signs,axes(x,z,a),entry,y,.93,.78,.12);
  }
  return {owners:new Set(data.facades.map(r=>r[5])),entrance,data,bridges,building,storefront,stall,ids,style};
})();
