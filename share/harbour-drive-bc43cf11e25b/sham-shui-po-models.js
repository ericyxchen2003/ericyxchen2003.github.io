// Street-facing façades on surveyed building solids. Detail and lighting share the same frames.
window.HKShamShuiPoModels=(()=>{
  const {faces,shell,badge}=HKCoastModels.geometry;
  // Preferred façade faces a named street or public forecourt.
  const specs=new Map();
  function register(ids,kind,tc,en,wall,trim,x,z){
    for(const id of ids)specs.set(id,{kind,tc,en,wall,trim,x,z});
  }
  register([4227771],'computer','黃金電腦商場','GOLDEN COMPUTER ARCADE','#dbbf97','#954b34',-834,-3972);
  register([4223894,4264423,4900001],'dragon','西九龍中心','DRAGON CENTRE','#c5bfae','#396b82',-1023,-3859);
  register([4061207],'hostel','美荷樓','MEI HO HOUSE','#e2c78e','#a48255',-684,-4193);
  register([4093846],'bakery','嘉頓','GARDEN','#ece1c8','#a13833',-778,-4175);
  register([4239010],'court','北九龍裁判法院','NORTH KOWLOON MAGISTRACY','#cfbea1','#83735c',-763,-4362);
  register([175775],'police','深水埗警署','SHAM SHUI PO POLICE STATION','#eee2c5','#657b6e',-1150,-3756);
  register([61303],'clinic','深水埗公立醫局','PUBLIC DISPENSARY','#a56350','#e3c9a7',-851,-3410);
  register([52862],'pawn','南昌押','NAM CHEONG PAWN SHOP','#c5bba1','#74684e',-727,-3652);
  register([50214,50154,51130,51136],'tenement','','','#c5c4ae','#9a9685',-710,-3646);
  register([52989,178615],'tenement','','','#b79278','#99715e',-924,-3783);
  register([144359],'temple','天后古廟','TIN HAU TEMPLE','#b28c72','#5d806a',-1061,-3584);
  register([175997],'twins','三太子廟','SAM TAI TZE TEMPLE','#b18973','#697d65',-786,-3678);
  register([158933],'temple','武帝廟','KWAN TAI TEMPLE','#aa826d','#4e745e',-890,-3360);
  register([49952],'market','北河街市政大廈','PEI HO STREET MUNICIPAL SERVICES BUILDING','#cba891','#89756e',-909,-3706);
  register([332152,332153,332154,332155,332157,332158,332159],'jade','通州街玉石市場','JADE MARKET','#bfc4ac','#466d61',-1179,-3518);
  const replaces=b=>specs.has(b.id)&&!b.foundation;
  function rect(f,u,y,w,h,d){return [f.at(u-w/2,y-h/2,d),f.at(u+w/2,y-h/2,d),f.at(u+w/2,y+h/2,d),f.at(u-w/2,y+h/2,d)];}
  function cap(m,p,holes,y,col){
    const rings=[p,...holes].map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),vs=rings.flat();
    for(const t of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)))m.tri(...t.map(i=>[vs[i].x,y,vs[i].y]),col);
  }
  function front(fs,x,z){
    // Penalise a back-facing wall, even if a concave return is closer.
    const score=f=>{const [a,,b]=f.at(0,0,0),[c,,e]=f.at(0,0,1);
      const distance=Math.hypot(a-x,b-z),facing=((x-a)*(c-a)+(z-b)*(e-b))/Math.max(.01,distance);
      return distance+(1-facing)*16+Math.max(0,4-f.w)*3;};
    return fs.reduce((best,f)=>score(f)<score(best)?f:best);
  }
  function render(b,m,lit,signs,detail){
    const spec=specs.get(b.id),{kind,wall,trim}=spec;
    const p=b.p,lo=b.basePD,hi=b.top,h=hi-lo,fs=faces(p);
    const minFront=b.id===4264423?14:kind==='twins'?8:0;
    const broad=minFront?fs.filter(f=>f.w>minFront):[];
    const main=front(broad.length?broad:fs,spec.x,spec.z);
    const paint=(f,u,y,w,hh,d,col)=>m?.quad(...rect(f,u,y,w,hh,d),col);
    const glow=(f,u,y,w,hh,d,col)=>lit?.litPanel(f.at,u,y,d,w,hh,col);
    function plaque(f,u,y,w,tc,en,bg){
      const fr={at:(a,b,d)=>f.at(a+u,b,d)};
      if(signs)badge(fr,signs,y,.35,w,Math.min(w*.24,1.45),[tc,en,bg]);
      glow(f,u,y-.81,w*.82,.09,.38,'#ffd9a3');
    }
    if(m){cap(m,p,b.holes||[],hi,'#b9b6a7');for(const hole of b.holes||[])for(const f of faces(hole))paint(f,0,lo+h/2,f.w,h,0,wall);}
    if(b.id===4900001){
      if(m)cap(m,p,b.holes||[],lo,'#aeb2ab');
      for(const f of fs){paint(f,0,lo+h/2,f.w,h,0,wall);if(f.w>6)glow(f,0,lo+.04,Math.min(4,f.w*.6),.12,.04,'#ffedc5');}
      return;
    }
    if(kind==='jade'){
      // The survey splits the market into parallel canopy strips. Leave the aisles open.
      const long=fs.reduce((best,f)=>f.w>best.w?f:best);
      for(const f of fs){
        paint(f,0,hi-.18,f.w,.36,.02,'#54756c');
        const bays=Math.max(1,Math.round(f.w/4.5)),width=f.w/bays;
        for(let j=0;j<=bays;j++)paint(f,(j/bays-.5)*(f.w-.15),lo+h/2,.16,h,.015,'#829187');
        if(f.w<long.w*.85)continue;
        for(let j=0;j<bays;j++){
          const u=(j+.5-bays*.5)*width;
          paint(f,u,lo+.67,width*.82,1.02,-.16,'#7e755c');
          m?.quad(f.at(u-width*.42,lo+1.19,-.75),f.at(u+width*.42,lo+1.19,-.75),
            f.at(u+width*.42,lo+1.19,-.08),f.at(u-width*.42,lo+1.19,-.08),'#a9916a');
          glow(f,u,hi-.35,width*.43,.1,-.10,'#f2d9a6');
          if(detail)for(let k=-2;k<=2;k++){
            const mid=u+k*width*.15;
            for(let n=0;n<8;n++){
              const v=(a,r)=>f.at(mid+Math.cos(a)*r,lo+1.21,-.41+Math.sin(a)*r);
              const a=n*Math.PI/4,b=(n+1)*Math.PI/4;
              m?.quad(v(a,.07),v(b,.07),v(b,.14),v(a,.14),k%2?'#a2bda0':'#6ca085');
            }
          }
        }
      }
      if(b.id===332154&&main.w>8)plaque(main,0,hi-.75,5.4,spec.tc,spec.en,'#466d61');
      return;
    }
    const temple=kind==='temple'||kind==='twins';
    const historic=['police','clinic','pawn','tenement','court','hostel'].includes(kind);
    for(const f of fs){
      paint(f,0,lo+h/2,f.w,h,0,wall);
      const rows=Math.max(1,Math.round(h/(kind==='dragon'?5.1:kind==='hostel'?2.9:3.55))),rise=h/rows;
      const bays=Math.max(1,Math.round(f.w/(kind==='court'?4.3:kind==='dragon'?6.4:3.35))),pitch=f.w/bays;
      if(temple){
        paint(f,0,lo+.62,f.w,1.24,.025,'#787772');
        paint(f,0,hi-.62,f.w,.40,.03,'#814b3e');
        paint(f,0,hi-.22,f.w,.33,.10,'#56635a');
        continue;
      }
      for(let i=0;i<rows;i++){
        const y=lo+(i+.55)*rise;
        if(kind==='computer'||kind==='dragon'||kind==='market'||kind==='bakery'||kind==='hostel'){
          paint(f,0,y,f.w,Math.min(2.15,rise*.65),.035,kind==='dragon'?'#72939c':kind==='hostel'?'#856e50':'#667a7a');
          paint(f,0,y-rise*.29,f.w,kind==='bakery'?.34:.23,.14,kind==='bakery'?trim:wall);
        }
        for(let j=0;j<bays;j++){
          const u=pitch*(j+.5-bays/2),w=pitch*(historic?.64:.73),wh=Math.min(rise*.54,2.1);
          if(detail||historic||temple){
            paint(f,u,y,w,wh,.055,kind==='jade'?'#486b59':historic?'#576a61':'#617e80');
            if(detail&&historic){
              paint(f,u,y,.11,wh,.09,wall);
              paint(f,u,y-wh/2,w+.16,.16,.16,trim);
              if(kind==='clinic'||kind==='police'){
                // A shallow segmental arch above each veranda opening.
                const r=w/2,yy=y+wh/2;
                for(let k=0;k<8;k++){const a=k*Math.PI/8,c=(k+1)*Math.PI/8;
                  const v=(t,s)=>f.at(u+Math.cos(t)*(r+s),yy+Math.sin(t)*(.44+s),.10);
                  m?.quad(v(a,0),v(c,0),v(c,.14),v(a,.14),trim);}
              }
              if(kind==='hostel'||kind==='pawn'||kind==='tenement')paint(f,u,y-wh*.36,w,.48,.14,wall);
            }
          }
          if((i*3+j*7+b.id)%9<3)glow(f,u-w*.17,y+.13,w*.48,wh*.6,.19,historic?'#e5c399':'#d2e1cc');
        }
      }
      if(f.w>1.4)paint(f,0,hi-.24,f.w,.45,.12,trim);
    }
    if(temple){
      // Tile roof over each adjoining temple bay, with raised ridge ends.
      const [cx,,cz]=main.at(0,0,0),[nx,,nz]=main.at(0,0,1);
      const depth=p.map(([x,z])=>(cx-x)*(nx-cx)+(cz-z)*(nz-cz));
      const back=Math.max(2,Math.max(...depth)),parts=kind==='twins'?2:1;
      for(let k=0;k<parts;k++){
        const width=main.w/parts,mid=-main.w/2+(k+.5)*width,a=mid-width*.49,c=mid+width*.49;
        const peak=hi+1.75,e=hi-.28;
        if(m){m.quad(main.at(a,e,0),main.at(c,e,0),main.at(c,peak,-back*.50),main.at(a,peak,-back*.50),trim);
          m.quad(main.at(a,peak,-back*.50),main.at(c,peak,-back*.50),main.at(c,e,-back),main.at(a,e,-back),'#72816c');
          for(const end of [a,c])m.tri(main.at(end,e,0),main.at(end,peak+.32,-back*.5),main.at(end,e,-back),wall);
          const ridge=(u,y,d)=>main.at(u,y,-back*.5+d);
          m.quad(ridge(a,peak,-.14),ridge(c,peak,-.14),ridge(c,peak+.26,.14),ridge(a,peak+.26,.14),'#baa780');
          for(const [end,sign] of [[a,1],[c,-1]]){
            m.tri(ridge(end,peak,0),ridge(end,peak+.72,0),ridge(end+sign*1.22,peak+.18,0),'#bfa576');
          }
          if(detail)for(let u=a+.22;u<c;u+=.48){
            m.quad(main.at(u-.035,e+.03,0),main.at(u+.035,e+.03,0),ridge(u+.035,peak+.025,0),ridge(u-.035,peak+.025,0),'#8c9a7f');
          }
          const porch=lo+Math.min(4.1,h*.8);
          m.quad(main.at(a,porch,.44),main.at(c,porch,.44),main.at(c,porch+.65,-.75),main.at(a,porch+.65,-.75),'#506f60');
          for(let u=a+.30;u<c;u+=.60)paint(main,u,porch-.07,.23,.14,.44,'#b49f73');
        }
        paint(main,mid,lo+1.50,width*.49,3,.12,'#492f29');
        for(const side of [-1,1]){
          paint(main,mid+side*width*.13,lo+1.44,width*.22,2.70,.14,'#773b31');
          paint(main,mid+side*width*.27,lo+1.52,.2,2.75,.18,'#a7513a');
        }
        for(const side of [-1,1]){const v=mid+side*width*.36;paint(main,v,lo+2.05,.4,3.9,.14,'#935341');paint(main,v,lo+3.55,.46,.50,.22,'#c27b4c');glow(main,v,lo+3.55,.40,.43,.24,'#ffb458');}
        plaque(main,mid,lo+3.26,Math.min(4,width*.67),k?'北帝廟':spec.tc,k?'PAK TAI TEMPLE':spec.en,'#804b36');
      }
      return;
    }
    if(kind==='bakery'){
      const r=Math.min(2,main.w*.22),y=hi-3;
      const towerW=2.8*r,bottom=lo+h*.36;
      paint(main,0,(hi+bottom)/2,towerW,hi-bottom,.17,trim);
      for(const side of [-1,1])paint(main,side*towerW*.49,(hi+bottom)/2,.13,hi-bottom,.18,'#ddbea6');
      plaque(main,0,y-2.25*r,towerW*.92,'嘉頓','GARDEN','#98372e');
      for(let k=0;k<32;k++){
        const a=k*Math.PI/16,c=(k+1)*Math.PI/16;
        const dial=t=>main.at(r*Math.cos(t),y+r*Math.sin(t),.22);
        m?.tri(main.at(0,y,.22),dial(a),dial(c),'#efe6c8');
        const ring=(t,q)=>main.at(r*q*Math.cos(t),y+r*q*Math.sin(t),.235);
        lit?.litQuad(ring(a,.94),ring(c,.94),ring(c,1),ring(a,1),'#f2daab');
      }
      for(let k=0;k<12;k++){
        const a=k*Math.PI/6,s=Math.sin(a),c=Math.cos(a);
        const tick=(d,t)=>main.at(r*d*c-t*s,y+r*d*s+t*c,.25);
        m?.quad(tick(.77,-.044),tick(.94,-.044),tick(.94,.044),tick(.77,.044),'#62564a');
      }
      paint(main,0,y+.40*r,.09,.8*r,.26,'#4d483e');paint(main,.25*r,y,.5*r,.10,.26,'#4d483e');
      glow(main,0,y-1.25*r,r*1.8,.13,.24,'#edcf94');
    }
    if(kind==='court'){
      for(let i=0;i<4;i++)paint(main,(i-1.5)*main.w*.17,lo+h*.54,.70,h*.77,.27,'#e0d1b9');
      paint(main,0,hi-1.3,main.w*.79,.7,.35,trim);
    }
    if(kind==='pawn'){
      const flank=front(fs,-751,-3648);
      for(const f of [main,flank])if(f.w>3){
        paint(f,0,lo+1.8,f.w*.83,3.44,.10,'#79705d');
        paint(f,0,lo+.85,f.w*.76,1.56,.14,'#74644e');
        plaque(f,0,lo+3.72,Math.min(f.w*.8,6),'南昌押','NAM CHEONG PAWN SHOP','#6c5845');
      }
      return;
    }
    if(kind==='computer'){
      const upper=front(fs,-865,-4029);
      for(const [f,y,zh,en,c] of [[main,lo+3.4,spec.tc,spec.en,'#987231'],[upper,lo+5.5,'高登電腦中心','GOLDEN COMPUTER CENTRE','#a84c34']]){
        if(detail&&f.w>8)for(let u=-f.w*.45;u<f.w*.43;u+=4){
          paint(f,u,lo+1.46,3.72,2.75,.12,'#35464a');
          paint(f,u,lo+1.52,3.35,2.02,.14,'#738b8a');
          for(let j=-1;j<2;j++)paint(f,u+j*.9,lo+1.39,.70,.49,.16,j?'#40515b':'#8eaaa8');
          paint(f,u,lo+2.97,3.6,.44,.17,'#9d8161');
        }
        paint(f,0,lo+1.48,Math.min(6,f.w*.73),2.9,.18,'#35494f');
        for(const side of [-1,1])paint(f,side*.58,lo+1.50,.08,2.70,.21,'#acbab2');
        plaque(f,0,y,Math.min(16,f.w*.92),zh,en,c);
      }return;
    }
    if(kind==='dragon'&&b.id===4264423&&h>20&&Math.max(...fs.map(f=>f.w))>20){
      // The short outer faces trace the bowed glass atrium on Yen Chow Street.
      for(const f of fs){
        const [x,,z]=f.at(0,0,0);
        if(x< -1042||x> -1025||z< -3886||z> -3866)continue;
        paint(f,0,lo+h/2,f.w,h,.20,'#577d83');
        paint(f,0,hi-.5,f.w,.85,.24,'#56877c');
        paint(f,-f.w*.48,lo+h/2,.12,h,.23,'#9baf9b');
        for(let y=lo+2;y<hi-.8;y+=2.62){
          paint(f,0,y,f.w,.10,.24,'#a5afa4');
          if((Math.round(y)+Math.round(x))%4===0)glow(f,0,y+.65,f.w*.74,.32,.26,'#c9e3ca');
        }
      }
      const centre=front(fs,-1022,-3860),cy=hi-8,radius=4;
      for(let k=0;k<36;k++){
        const disc=(n,r,d)=>centre.at(Math.cos(n)*r,cy+Math.sin(n)*r,d);
        const a=k*Math.PI/18,b=(k+1)*Math.PI/18;
        m?.tri(centre.at(0,cy,.30),disc(a,radius,.30),disc(b,radius,.30),'#a3473c');
        lit?.litQuad(disc(a,radius-.12,.32),disc(b,radius-.12,.32),disc(b,radius,.32),disc(a,radius,.32),'#ffdab1');
      }
      plaque(centre,0,cy,7.1,'西九龍中心','DRAGON CENTRE','#a3473c');
      // Curved glass barrel light over the atrium with transverse metal ribs.
      const cx=-1053,cz=-3886,c=.769,s=.639;
      const pt=(u,v,a)=>[cx+c*u-s*v*Math.cos(a),hi+3.2*Math.sin(a),cz+s*u+c*v*Math.cos(a)];
      for(let j=0;j<12;j++){
        const a=Math.PI*j/12,k=Math.PI*(j+1)/12;m?.quad(pt(-20,5,a),pt(20,5,a),pt(20,5,k),pt(-20,5,k),'#81a3a9');
        for(let u=-20;u<=20;u+=5)m?.quad(pt(u,5.06,a),pt(u+.18,5.06,a),pt(u+.18,5.06,k),pt(u,5.06,k),'#d4d4c3');
      }
    }
    if(kind==='market'){
      // The market survey's low shell carries the setback upper sports floors.
      const upper=window.HKShamShuiPoParks.municipalUpper,top=lo+29;
      if(m)cap(m,upper,[],top,'#a4a9a0');
      for(const f of faces(upper)){
        paint(f,0,(hi+top)/2,f.w,top-hi,0,'#c6a896');
        for(let y=hi+1.6;y<top-1;y+=3.7){
          paint(f,0,y,f.w*.94,1.68,.05,'#667876');paint(f,0,y-1.07,f.w,.39,.12,'#d8c2ad');
          if(f.w>4)glow(f,0,y,f.w*.48,.48,.085,'#deccac');
        }
      }
    }
    if(spec.tc&&main.w>3&&(kind!=='dragon'||b.id===4264423)&&(!['dragon','jade'].includes(kind)||main.w>12)){
      plaque(main,0,lo+Math.min(h*.65,kind==='bakery'?10:4.6),Math.min(main.w*.84,18),spec.tc,spec.en,trim);
    }
  }
  function model(b,g,signs,detail){const m=shell(specs.get(b.id).tc||'騎樓',g);render(b,m,null,signs,detail);m.finish();}
  return {replaces,
    building(b,props,signs,height,g){if(replaces(b)){model(b,g,signs,true);render(b,null,props,null,true);}},
    distant(b,batch,g){if(!replaces(b))return false;model(b,g,null,false);return true;},
    lights(b,lit){if(replaces(b))render(b,null,lit,null,false);}
  };
})();
