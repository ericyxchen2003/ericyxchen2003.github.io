// Survey coordinates and absolute levels in metres. See the photographic sources in DATA.md.
window.HKHeritage=(()=>{
  'use strict';
  const sites=[
    ['mosque','九龍清真寺暨伊斯蘭中心',[253039]],
    ['stmarys','嘉諾撒聖瑪利書院',[118001,161506,325445,252782]],
    ['observatory','香港天文台總部',[118299,250000,252588]],
    ['rosary','玫瑰堂',[161508]],
    ['church','聖安德烈堂',[148720,22046]]
  ];
  const cream='#efe6ce',white='#f6f0df',shadow='#49554e',ochre='#bcaa86',wood='#78533b';
  // This small repeat is drawn in metres so the masonry bond follows each gable and tower.
  function brickMaterial(){
    const cv=document.createElement('canvas');cv.width=384;cv.height=192;
    const c=cv.getContext('2d');c.fillStyle='#c1a389';c.fillRect(0,0,384,192);
    const tones=['#ac674c','#bb795a','#a6604a','#b97353','#b27158','#b87c61','#aa6954'];
    for(let j=0;j<12;j++)for(let k=-1;k<9;k++){
      const x=(k+(j%2)*.5)*48,y=j*16;
      c.fillStyle=tones[Math.abs((k*17+j*13+k*j*3))%tones.length];c.fillRect(x+1,y+1,46.5,14.7);
      c.fillStyle='#ffffff14';c.fillRect(x+2,y+2,45,1);
    }
    const tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
    tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
    return new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide});
  }
  function build(id,{b,group,frame,edges,ring,low,top,shell,sign,tile,ground}){
    const point2=p=>[p[0],p[2]];
    const section=(f,u0,v0,u1,v1)=>frame(point2(f.at(u0,0,v0)),point2(f.at(u1,0,v1)));
    const panel=(f,l,r,y0,y1,d,c)=>tile(b,f,l,r,y0,y1,d,c);
    const box=(f,u,y,d,w,h,depth,c)=>b.box(...f.at(u,y,d),w,h,depth,c,f.angle);
    const line=(f,x,y,xx,yy,d,r,c)=>b.beam(f.at(x,y,d),f.at(xx,yy,d),r,c);
    const foundation=(key,h,c)=>shell(key,c,c,low(key),h);
    function cross(f,u,y,d,h,colour){
      box(f,u,y,d,h*.105,h,h*.115,colour);box(f,u,y+h*.12,d,h*.58,h*.105,h*.115,colour);
    }
    function curve(f,u,spring,w,h,d,pointed=true){
      const r=w/2,offset=pointed?r*.75:0,top=Math.acos(offset/(r+offset)),result=[];
      for(let i=0;i<=20;i++){
        const t=top*(i<=10?i:20-i)/10;
        const x=(offset-(r+offset)*Math.cos(t))*(i<=10?1:-1);
        result.push(f.at(u+x,spring+h*Math.sin(t)/Math.sin(top),d));
      }
      return result;
    }
    // The reveal has a curved soffit with a separate back plane for glazing or timber.
    function arch(f,u,base,w,leg,rise,d,trim,fill,opts={}){
      const t=opts.trim??.18,depth=opts.depth??.20,pointed=opts.pointed!==false, spring=base+leg;
      const a=curve(f,u,spring,w,rise,d,pointed),back=curve(f,u,spring,w,rise,d-depth,pointed);
      const outer=curve(f,u,spring,w+2*t,rise+t,d,pointed);
      for(let k=1;k<a.length;k++){
        b.quad(a[k-1],a[k],outer[k],outer[k-1],trim);
        b.quad(a[k],a[k-1],back[k-1],back[k],opts.reveal||trim);
        if(fill)b.tri(f.at(u,spring,d-depth),back[k-1],back[k],fill);
      }
      if(fill)panel(f,u-w/2,u+w/2,base,spring+.005,d-depth,fill);
      for(const s of [-1,1]){
        const x=u+s*w/2;panel(f,Math.min(x,x+s*t),Math.max(x,x+s*t),base,spring,d,trim);
        b.quad(f.at(x,base,d),f.at(x,spring,d),f.at(x,spring,d-depth),f.at(x,base,d-depth),opts.reveal||trim);
      }
      return d-depth+.012;
    }
    function sash(f,u,y,w,h,d,frameColour,glass){
      panel(f,u-w/2-.10,u+w/2+.10,y-.10,y+h+.10,d,frameColour);
      panel(f,u-w/2,u+w/2,y,y+h,d+.014,glass);
      const [x,,z]=f.at(u,y,d);
      if(Math.abs(Math.round(x*1.3+z*.8+y*2))%5<2)
        tile(b.lights,f,u-w*.47,u+w*.47,y+.08,y+h-.08,d+.023,id==='school'?'#9a9983':'#bbad88');
      for(const x of [u-w*.19,u+w*.19])panel(f,x-.023,x+.023,y,y+h,d+.034,frameColour);
      panel(f,u-w/2,u+w/2,y+h*.73,y+h*.73+.047,d+.038,frameColour);
    }
    function gableRoof(f,u,v0,v1,w,eave,ridge,clay,edge){
      for(const s of [-1,1]){
        const e=u+s*w/2;
        b.quad(f.at(e,eave,v0),f.at(e,eave,v1),f.at(u,ridge,v1),f.at(u,ridge,v0),clay[s===1?0:1]);
        line(f,e,eave,u,ridge,v0,.095,edge);line(f,e,eave,u,ridge,v1,.095,edge);
        b.beam(f.at(e,eave,v0),f.at(e,eave,v1),.090,edge);
        for(let k=1;k<9;k++){
          const t=k/9,x=e+(u-e)*t,y=eave+(ridge-eave)*t;
          b.beam(f.at(x,y+.015,v0),f.at(x,y+.015,v1),.028,clay[2]);
        }
      }
      b.beam(f.at(u,ridge+.025,v0),f.at(u,ridge+.025,v1),.095,edge);
    }
    const brickPos=[],brickUV=[];
    function brick(f,shape,d){
      for(let i=1;i<shape.length-1;i++)for(const [x,y] of [shape[0],shape[i],shape[i+1]]){
        brickPos.push(...f.at(x,y,d));brickUV.push(x/2.08,y/.98);
      }
    }
    const masonry=(f,l,r,y,h,d)=>brick(f,[[l,y],[r,y],[r,h],[l,h]],d);
    function stained(f,u,y,w,leg,rise,d,n){
      const base=arch(f,u,y,w,leg,rise,d,cream,'#435357',{trim:w*.055,depth:.11});
      const pitch=w/n,colours=['#7a9191','#9a866c','#6d8992','#8f9375','#927978'];
      for(let i=0;i<n;i++){
        const x=u-w/2+(i+.5)*pitch,cap=leg+(1-Math.abs(i+.5-n/2)/(n/2))*rise*.44;
        arch(f,x,y+.055,pitch*.85,cap-.32,.28,base+.036,'#b8ad92',colours[i%5],{trim:.045,depth:.017});
        tile(b.lights,f,x-pitch*.40,x+pitch*.40,y+.10,y+cap-.29,base+.024,
          ['#7a9099','#bc9667','#658793','#a2a480','#a57476'][i%5]);
        for(let j=0;j<6;j++){
          const yy=y+.18+(cap-.48)*j/6;
          panel(f,x-pitch*.39,x+pitch*.39,yy,yy+.026,base+.047,'#51534e');
        }
        for(const xx of [x-pitch*.16,x+pitch*.16])line(f,xx,y+.10,xx,y+cap-.22,base+.05,.014,'#555853');
      }
      const cy=y+leg+rise*.60,rr=w*.10;
      for(const [a,h,rad] of [[0,rr*.52,rr],[-rr*.92,-rr*.45,rr*.7],[rr*.92,-rr*.45,rr*.7]]){
        let last;
        for(let j=0;j<=16;j++){const t=2*Math.PI*j/16,p=f.at(u+a+Math.cos(t)*rad,cy+h+Math.sin(t)*rad,base+.072);
          if(last)b.beam(last,p,.036,cream);last=p;}
      }
    }
    function pointedDoor(f,u,y,w,leg,rise,d){
      const v=arch(f,u,y,w,leg,rise,d,cream,'#453c32',{trim:.28,depth:.20,reveal:'#b4a084'});
      for(let k=0;k<10;k++){
        const x=u-w/2+(k+.12)*w/10;
        panel(f,x,x+w*.076,y,y+leg-.09,v+.011,k%3?wood:'#82583d');
      }
      for(const s of [-1,1])box(f,u+s*.13,y+leg*.43,v+.06,.035,.27,.07,'#c3a566');
    }
    function mosque(){
      const key=253039,y=low(key),f=frame([189.05,-303.05],[188.992,-304.048]);
      const terrace=y+5.85, prayerRoof=top(key)-6.75;
      foundation(key,terrace,'#e9e5d6');
      const main=section(f,-14.55,0,14.55,0);
      function marbleWall(face,base,high,n,entrance){
        const L=face.length,p=L/n;
        for(let j=0;j<n;j++){
          const u=p*(j+.5),door=entrance&&j>=n/2-1.5&&j<=n/2+.5,w=p*.77;
          const sill=base+(door?.13:.97),leg=high-sill-1.55;
          const d=arch(face,u,sill,w,leg,.98,.11,'#efeddc',door?'#614936':'#556562',{depth:.065,trim:.19});
          if(door){
            for(const x of [-.22,.22])box(face,u+x,sill+1.07,d+.025,.035,.43,.05,'#d4bb8c');
            panel(face,u-.031,u+.031,sill,sill+leg+.62,d+.018,'#9f8562');
          }else{
            if(j%3!==1)tile(b.lights,face,u-w*.47,u+w*.47,sill+.07,sill+leg-.035,d+.004,'#bead88');
            for(let k=-3;k<=3;k++){
              const xx=u+k*w*.106,hh=.81*(1-Math.abs(k)/4);
              line(face,xx,sill+.03,xx,sill+leg+hh,d+.018,.027,'#d7d8c8');
            }
            for(let k=0;k<5;k++)panel(face,u-w*.49,u+w*.49,sill+k*leg/5,sill+k*leg/5+.06,d+.027,'#e2dfcf');
          }
          box(face,j*p+.12,(base+high)/2,.045,.18,high-base,.20,'#dedacc');
        }
        box(face,L/2,high-.08,.07,L,.21,.43,'#faf5e5');
      }
      edges(ring(key),(a,c,i)=>marbleWall(frame(a,c),y+.40,terrace-.44,9,i===0));
      for(const [dy,thick,col] of [[-.46,.24,'#bdbcb2'],[-.15,.30,white],[.34,.66,'#ece9dc']])
        for(const [u,v,w,d] of [[0,-.15,29.2,.33],[0,-28.95,29,.33],[-14.48,-14.5,.33,28.85],[14.48,-14.5,.33,28.85]])
          box(f,u,terrace+dy,v,w,thick,d,col);
      // Upper prayer hall sits inside an open terrace with four slender corner minarets.
      const upper=[[-10.35,-4.6],[10.35,-4.6],[10.35,-25],[-10.35,-25]];
      b.prism(upper.map(([u,v])=>point2(f.at(u,0,v))),terrace,prayerRoof,'#e9e5d6','#d3d3c9');
      for(let i=0;i<4;i++){const a=upper[i],c=upper[(i+1)%4];marbleWall(section(f,...a,...c),terrace+.12,prayerRoof-.19,7,false);}
      for(const u of [-13.22,13.22])for(const v of [-1.5,-27.7]){
        const [x,,z]=f.at(u,0,v),base=terrace;
        b.cylinder(x,base+.45,z,.67,.85,.9,white,12);
        b.cylinder(x,base+4.11,z,.40,.58,7.10,'#eeeade',16);
        b.cylinder(x,base+7.57,z,.94,.53,.48,white,16);
        b.cylinder(x,base+7.97,z,.93,.93,.38,'#d3d4c8',16);
        b.cylinder(x,base+8.47,z,.53,.58,.85,'#56615c',10);
        b.lights.cylinder(x,base+8.47,z,.536,.586,.81,'#c6b58a',10);
        for(let k=0;k<8;k++){
          const a=k*Math.PI/4;b.cylinder(x+Math.cos(a)*.56,base+8.54,z+Math.sin(a)*.56,.075,.09,1.06,white,8);
        }
        b.dome(x,base+9.08,z,.77,1.05,.77,white,0,16);
        b.cylinder(x,base+10.32,z,.024,.10,.52,'#9d8864',8);
      }
      const [cx,,cz]=f.at(0,0,-14.8),R=6.05;
      b.cylinder(cx,prayerRoof+.45,cz,R,R+.22,.94,'#e6e5db',44);
      b.dome(cx,prayerRoof+.87,cz,R,5.6,R,'#f5f0e3',0,48);
      // Soft light reflected by the drum and lower dome, with a falloff towards the crescent.
      const skin=(az,el)=>[cx+(R+.04)*Math.cos(el)*Math.cos(az),prayerRoof+.89+5.63*Math.sin(el),cz+(R+.04)*Math.cos(el)*Math.sin(az)];
      const wash=(az,el)=>(.24+.48*(.5+.5*Math.cos(az*4)))*Math.cos(el)**2+.035;
      for(let j=0;j<14;j++)for(let i=0;i<48;i++){
        const a=i*Math.PI/24,c=(i+1)*Math.PI/24,lo=j*Math.PI/28,hi=(j+1)*Math.PI/28;
        b.wash(skin(a,lo),skin(c,lo),skin(c,hi),skin(a,hi),'#c8cebf',[wash(a,lo),wash(c,lo),wash(c,hi),wash(a,hi)]);
      }
      b.cylinder(cx,prayerRoof+6.82,cz,.04,.12,.79,'#aa926b',10);
      let prev;
      for(let k=0;k<=22;k++){const t=.48+k*5.15/22,p=f.at(Math.sin(t)*.32,prayerRoof+7.50-Math.cos(t)*.35,-14.8);
        if(prev)b.beam(prev,p,.045,'#af986e');prev=p;}
      sign(main,main.length/2,terrace-.72,.157,9.4,.75,'九龍清真寺','KOWLOON MASJID','#e8e6d7','#615d46');
      // Steps rise to the recessed central doors from the Nathan Road forecourt.
      for(let j=0;j<6;j++){const v=.22+j*.34,P=f.at(0,0,v);const lowStep=ground(P[0],P[2])-.16;
        const tread=Math.max(lowStep+.12,y+.57-j*.12);
        box(f,0,(lowStep+tread)/2,v,9.0,tread-lowStep,.37,'#d8d4c7');}
    }
    function rosary(){
      const key=161508,y=low(key),f=frame([679.85,-709.65],[680.255,-710.564]);
      const peach='#c9928a',pink='#cc9393',pale='#efe6cf',shadowPink='#b5827d';
      const roofs=['#c89092','#b37c82','#daa5a2'];
      foundation(key,y+.33,'#d6cdb8');
      function nave(u,v0,v1,w,eave,ridge){
        box(f,u,(y+eave)/2,(v0+v1)/2,w,eave-y,v0-v1,pale);
        for(const v of [v0,v1])b.tri(f.at(u-w/2,eave,v),f.at(u+w/2,eave,v),f.at(u,ridge,v),pale);
        gableRoof(f,u,v0+.15,v1-.14,w+.35,eave,ridge,roofs,pink);
      }
      nave(0,-12.6,-36,11.65,y+9.12,y+12.1);
      // Lower lean-to aisles, a separately roofed entrance porch and polygonal apse.
      for(const s of [-1,1]){
        const u=s*7.17;box(f,u,y+2.65,-23.8,3.5,5.30,22.0,pale);
        b.quad(f.at(s*5.57,y+7.1,-12.65),f.at(s*5.57,y+7.1,-35),f.at(s*9,y+5.32,-35),f.at(s*9,y+5.32,-12.65),roofs[s===1?0:1]);
        for(const v of [-12.7,-18.2,-23.7,-29.2,-34.7]){
          box(f,s*8.82,y+2.97,v,.42,5.94,.60,pale);
          box(f,s*8.82,y+5.88,v,.62,.20,.80,peach);
          b.cylinder(...f.at(s*8.82,y+6.30,v),0,.44,.76,pink,4,0,f.angle+Math.PI/4);
          // Flying buttress rises from aisle pier to clerestory with an open interval below.
          const A=f.at(s*8.78,y+5.9,v),B=f.at(s*5.74,y+7.75,v);
          for(const dv of [-.16,.16])b.quad(f.at(s*8.78,y+5.68,v+dv),f.at(s*5.74,y+7.47,v+dv),f.at(s*5.74,y+7.75,v+dv),f.at(s*8.78,y+6.12,v+dv),pale);
          b.beam(A,B,.13,peach);
        }
        const side=s===1?section(f,8.95,-12.8,8.95,-34.8):section(f,-8.95,-34.8,-8.95,-12.8);
        const upper=s===1?section(f,5.83,-12.8,5.83,-34.8):section(f,-5.83,-34.8,-5.83,-12.8);
        for(let j=0;j<4;j++){
          const u=(j+.5)*5.5;stained(side,u,y+1.05,1.55,1.8,.96,.17,2);
          const c=upper.at(u,y+7.96,.075);
          for(let k=0;k<16;k++){
            const a=k*Math.PI/8,t=(k+1)*Math.PI/8;
            const dot=(a,r)=>upper.at(u+Math.cos(a)*r,y+7.96+Math.sin(a)*r,.08);
            b.tri(c,dot(a,.49),dot(t,.49),'#69858a');b.beam(dot(a,.51),dot(t,.51),.055,peach);
            if(k%4===0)b.beam(c,dot(a,.46),.025,white);
          }
        }
      }
      const apse=[[-5.75,-34.4],[-5.0,-38.8],[-2.0,-41.35],[1,-41.35],[3.25,-38.78],[5.76,-36],[5.76,-34.4]];
      b.prism(apse.map(([u,v])=>point2(f.at(u,0,v))),y+.18,y+7.2,pale);
      for(let i=0;i<apse.length-1;i++){
        const a=apse[i],c=apse[i+1];b.tri(f.at(a[0],y+7.2,a[1]),f.at(c[0],y+7.2,c[1]),f.at(0,y+9.2,-35.2),pink);
      }
      nave(0,.16,-12.75,9.55,y+6.04,y+8.32);
      const porch=section(f,-4.77,.17,4.77,.17);
      pointedDoor(porch,porch.length/2,y+.08,2.25,2.40,1.18,.24);
      for(const u of [.26,porch.length-.26,porch.length/2-1.60,porch.length/2+1.60]){
        box(porch,u,y+2.94,.10,.41,5.82,.47,pale);
        for(const level of [.45,2.28,4.05,5.67])box(porch,u,y+level,.12,.47,.26,.52,peach);
      }
      for(const x of [1.84,porch.length-1.84])stained(porch,x,y+1.68,.85,1.81,.65,.21,1);
      arch(porch,porch.length/2,y+4.28,.72,.58,.43,.16,peach,'#545f60',{trim:.14,depth:.05});
      for(let s of [-1,1]){
        const side=s===1?section(f,4.80,0,4.80,-12.65):section(f,-4.80,-12.65,-4.80,0);
        for(const u of [2.35,6.55,10.45]){
          if(u===6.55)pointedDoor(side,u,y+.15,1.9,2.25,1.0,.17);
          else stained(side,u,y+1.38,1.38,1.65,.85,.14,2);
          box(side,u-1.56,y+2.85,.05,.50,5.60,.41,pale);
          for(const level of [1.85,3.4,5.25])box(side,u-1.56,y+level,.08,.52,.42,.42,peach);
        }
      }
      // Three lancets above the low entrance roof, between the two front turrets.
      const front=section(f,-5.82,-12.58,5.82,-12.58);
      for(const s of [-1,0,1])arch(front,front.length/2+s*1.22,y+8.15,.82,s===0?1.52:1.12,.57,.15,peach,'#4a676e',{trim:.11,depth:.08});
      for(const v of [-11,-34])for(const s of [-1,1]){
        const u=s*(v===-11?5.89:6.15),[x,,z]=f.at(u,0,v),base=y+(v===-11?8.28:7.4);
        b.cylinder(x,(y+base)/2,z,1.04,1.12,base-y,pale,8,0,f.angle);
        b.cylinder(x,base+.12,z,1.19,1.24,.28,peach,8,0,f.angle);
        b.cylinder(x,base+1.15,z,.93,1.05,2.02,pale,8,0,f.angle);
        for(let k=0;k<4;k++){const a=k*Math.PI/2;
          const g=frame([x+Math.sin(a)*.94-Math.cos(a)*.49,z+Math.cos(a)*.94+Math.sin(a)*.49],
                        [x+Math.sin(a)*.94+Math.cos(a)*.49,z+Math.cos(a)*.94-Math.sin(a)*.49]);
          arch(g,.49,base+.56,.27,.56,.31,.018,peach,shadow,{trim:.06,depth:.012});
        }
        b.cylinder(x,base+2.23,z,1.10,1.17,.24,pink,8,0,f.angle);
        b.cylinder(x,base+4.06,z,.035,1.12,3.55,roofs[1],8,0,f.angle);
        cross(f,u,base+6.18,v,.72,ochre);
      }
      cross(f,0,y+8.56,.16,.74,ochre);
    }
    function school(){
      const main=118001,old=161506,y=low(main),mainP=ring(main);
      // Street-side masses follow the original survey, including the angled extensions.
      // Move the courtyard wall back through the round portico so its giant columns stand free.
      const p=mainP.filter((_,i)=>i<12||i>14);
      b.prism(p,y-.27,y+15.0,'#e4ddc9','#bcb8a9');
      edges(p,(a,c)=>{const f=frame(a,c),L=f.length;if(L<3.1)return;
        const n=Math.max(1,Math.round(L/3.7));
        for(let j=0;j<n;j++){
          const u=(j+.5)*L/n,w=Math.min(2.03,L/n*.68);
          arch(f,u,y+.28,w,2.12,.90,.10,'#f1ead7','#6e6a5c',{pointed:false,trim:.21,depth:.065});
          for(const level of [5.07,9.53])sash(f,u,y+level,w*.78,2.34,.08,cream,j%3?'#576965':'#677a73');
          box(f,u,y+4.18,.12,w+.45,.38,.32,'#d1c9b2');
          for(const level of [0,4.48,8.88])box(f,j*L/n+.12,y+level+2.12,.065,.27,4.10,.26,white);
        }
        for(const level of [4.45,8.88,13.52,15])box(f,L/2,y+level,.10,L,.23,.45,white);
      });
      // Along Austin Road the exposed northern elevation has a lower, two-storey
      // base and an open upper colonnade. Set it out along the long surveyed wall.
      const austin=frame(mainP[19],mainP[20]);
      for(let u=2.5;u<austin.length-.9;u+=3.75){
        const pos=austin.at(u,y+13.05,.35);
        b.cylinder(...pos,.17,.22,3.14,white,12);
        box(austin,u,y+14.62,.35,.54,.20,.50,white);
        for(let k=0;k<7;k++)box(austin,u-1.55+k*.47,y+11.83,.31,.11,.55,.13,cream);
      }
      box(austin,austin.length/2,y+12.05,.32,austin.length,.14,.31,white);
      // The courtyard entrance is identifiable in plan by its semicircular nose.
      const f=frame([644.7,-773.2],[645.616,-772.8]),r=4.79;
      const fan=(rad,v=0.64)=>Array.from({length:25},(_,i)=>point2(f.at(.2+rad*Math.cos(i*Math.PI/24),0,v+rad*Math.sin(i*Math.PI/24))));
      for(const [yy,rad,h,tint] of [[y+.18,5.10,.38,'#c4bba4'],[y+9.1,r,.40,cream],[y+13.57,r+.26,.55,white],[y+14.04,r+.05,.44,'#e1d8c5']]){
        b.prism(fan(rad),yy-h/2,yy+h/2,tint);
      }
      for(let k=0;k<6;k++){
        const a=k*Math.PI/5,u=.2+r*.91*Math.cos(a),v=.64+r*.91*Math.sin(a),[x,,z]=f.at(u,0,v);
        box(f,u,y+.48,v,.92,.74,.92,'#d6cbb2');
        b.cylinder(x,y+4.77,z,.33,.45,8.07,'#e6dfc8',16);
        b.cylinder(x,y+8.83,z,.50,.39,.32,white,16);
        for(const side of [-1,1])b.dome(...f.at(u+side*.33,y+8.87,v+.18),.22,.21,.2,cream,0,10);
        b.cylinder(x,y+11.35,z,.21,.26,4.15,white,12);
      }
      for(let j=0;j<35;j++){
        const a=(j+.5)*Math.PI/35,u=.2+r*Math.cos(a),v=.64+r*Math.sin(a);
        b.cylinder(...f.at(u,y+9.60,v),.11,.075,.65,cream,7);
        if(j<34){const aa=(j+1.5)*Math.PI/35;b.beam(f.at(u,y+9.96,v),f.at(.2+r*Math.cos(aa),y+9.96,.64+r*Math.sin(aa)),.11,white);}
      }
      sign(f,.2,y+3.61,1.18,4.72,.45,"ST. MARY’S","CANOSSIAN COLLEGE",'#d4cbb7','#695c45');
      for(let k=0;k<7;k++)box(f,.2,y+.05-k*.135,5.43+k*.40,10.2,.37,.44,'#bdb6a7');
      // Set the two open verandahs behind the survey edge on Chatham Road.
      const op=ring(old),base=low(old),face=frame(op[9],op[10]),L=face.length;
      const back=op.map((v,i)=>[9,10].includes(i)?point2(face.at(i===9?0:L,0,-1.62)):v);
      b.prism(back,base-.35,base+12.18,'#e7dfc9','#b4aa91');const n=8,pitch=L/n;
      for(const h of [0,4.1,8.18,12.23])box(face,L/2,base+h,.02,L,.27,3.45,cream);
      for(let j=0;j<n;j++){
        const u=(j+.5)*pitch;
        for(let row=0;row<2;row++){
          const yy=base+row*4.08;
          sash(face,u,yy+.54,pitch*.49,2.24,-1.55,white,'#4f625a');
          arch(face,u,yy+.13,pitch*.79,2.30,1.09,.045,cream,null,{pointed:false,trim:.24,depth:.37});
          box(face,j*pitch+.13,yy+1.70,.02,.46,3.54,.50,'#e8dfc8');
          box(face,u,yy+3.95,.01,pitch,.50,.43,cream);
          for(let k=0;k<7;k++)b.cylinder(...face.at(u+(k-3)*pitch/8,yy+.65,.11),.085,.11,.74,cream,7);
          box(face,u,yy+1.04,.1,pitch,.13,.23,white);
          box(face,u,yy+3.57,.15,.30,.34,.27,white);
        }
        sash(face,u,base+9.15,pitch*.53,2.16,-.06,cream,'#586a60');
        box(face,j*pitch+.16,base+10.3,.04,.29,3.85,.30,white);
      }
      const centre=section(face,0,0,0,-1);
      gableRoof(centre,4.65,L+.16,-.16,10.1,base+12.34,base+13.35,['#bd7971','#aa746c','#c18b7d'],'#c69889');
      // The long hall and adjoining contemporary wing close the south side of the courtyard.
      for(const id of [325445,252782]){
        const lo=low(id),hi=top(id);shell(id,'#e1ddcf','#b5b7ac');
        edges(ring(id),(a,c)=>{const f=frame(a,c),L=f.length;if(L<4)return;
          const n=Math.max(2,Math.round(L/3.25));
          for(let j=0;j<n;j++)for(let yy=lo+1.1;yy<hi-2.15;yy+=3.58)
            sash(f,(j+.5)*L/n,yy,Math.min(2.20,L/n*.70),1.78,.08,white,j%3?'#769598':'#92a7a3');
          box(f,L/2,hi-.38,.08,L,.41,.38,white);
        });
      }
    }
    function andrew(){
      const key=148720,y=low(key),f=frame([241.7,-676.15],[241.775,-675.153]);
      const brickRed='#ab6650',slate=['#647668','#53695e','#79877a'];
      foundation(key,y+.26,'#a59c86');
      // Front faces west into the lawn. The bell tower is on the viewer's right.
      function brickVolume(u,v0,v1,w,base,h){
        box(f,u,(base+h)/2,(v0+v1)/2,w,h-base,v0-v1,brickRed);
        const corners=[[u-w/2,v0],[u+w/2,v0],[u+w/2,v1],[u-w/2,v1]];
        const walls=corners.map(([x,z],i)=>section(f,x,z,...corners[(i+1)%4]));
        for(const g of walls)masonry(g,0,g.length,base,h,.012);
        return walls;
      }
      const w=8.25, gable=y+8.62, ridge=y+12.38;
      const [front,right,end,left]=brickVolume(0,-.17,-28.15,w,y+.16,gable);
      for(const wall of [front,end]){
        brick(wall,[[0,gable],[w,gable],[w/2,ridge]],.02);
        for(let s of [-1,1])line(wall,w/2+s*w/2,gable,w/2,ridge,.12,.11,cream);
        for(let i=0;i<2;i++){
          const yy=gable+1.14+i*.82,span=w*.5*(ridge-yy)/(ridge-gable);
          panel(wall,w/2-span,w/2+span,yy,yy+.12,.13,cream);
        }
        stained(wall,w/2,y+2.25,4.50,3.52,2.32,.25,4);
        box(wall,w/2,y+2.18,.15,5.05,.17,.38,cream);
      }
      gableRoof(f,0,-.16,-28.35,w+.12,gable+.05,ridge+.04,slate,cream);
      cross(f,0,ridge+.38,-.17,.83,cream);
      for(const s of [-1,1]){
        const vv=-4.20,back=-27.9,outer=s*(s>0?7.68:7.15),inner=s*3.93;
        // Aisles under lean-to roofs, separated from the higher nave.
        const width=Math.abs(outer-inner),u=(outer+inner)/2,eave=y+5.02;
        const walls=brickVolume(u,vv,back,width,y+.17,eave);
        b.quad(f.at(outer,eave+.08,vv),f.at(outer,eave+.08,back),f.at(inner,y+7.42,back),f.at(inner,y+7.42,vv),slate[s===1?0:1]);
        const side=walls[s>0?1:3];
        for(let i=0;i<6;i++){
          const u=(i+.5)*side.length/6;
          stained(side,u,y+1.10,1.37,1.65,.93,.19,2);
          box(side,i*side.length/6+.19,y+2.29,.12,.39,4.35,.46,brickRed);
          box(side,i*side.length/6+.19,y+1.05,.13,.45,.12,.50,cream);
        }
        box(side,side.length/2,y+.70,.10,side.length,.21,.33,cream);
        // Projecting transept has its own gable crossing the longitudinal roof.
        const u0=s*(s>0?9.76:8.78),tv=-20.40,depth=Math.abs(u0)-3.8;
        const tx=section(f,u0,tv+s*2.88,u0,tv-s*2.88);
        box(tx,tx.length/2,y+3.11,-depth/2,tx.length,6.12,depth,brickRed);
        masonry(tx,0,tx.length,y+.16,y+6.16,.03);
        brick(tx,[[0,y+6.15],[tx.length,y+6.15],[tx.length/2,y+8.84]],.03);
        gableRoof(tx,tx.length/2,.06,-depth,tx.length+.11,y+6.14,y+8.84,slate,cream);
        stained(tx,tx.length/2,y+1.65,2.32,2.12,1.37,.27,3);
      }
      // Low west porch with a stepped parapet and open timber door.
      const [porch]=brickVolume(-5.72,.24,-4.30,3.52,y+.14,y+5.47);
      pointedDoor(porch,porch.length/2,y+.16,1.69,2.53,.91,.27);
      for(const yy of [4.20,5.42])box(porch,porch.length/2,y+yy,.09,porch.length+.06,.16,.29,white);
      brick(porch,[[1.10,y+5.46],[2.44,y+5.46],[1.77,y+6.12]],.04);
      line(porch,1.08,y+5.47,1.77,y+6.12,.12,.061,cream);line(porch,1.77,y+6.12,2.45,y+5.47,.12,.061,cream);
      const tower=brickVolume(6.30,1.23,-3.79,4.95,y+.12,y+13.42);
      pointedDoor(tower[0],2.48,y+.15,1.91,2.57,1.0,.30);
      stained(tower[0],2.48,y+5.46,1.58,.50,1.04,.27,2);
      for(const wall of tower){
        const L=wall.length;
        for(const level of [.55,2.82,4.70,8.30,12.98,13.42])
          if(wall!==tower[0]||level>4)box(wall,L/2,y+level,.07,L+.16,level>8?.24:.14,.27,cream);
        for(const u of [.19,L-.19]){
          box(wall,u,y+6.08,.09,.37,11.70,.33,brickRed);
          for(const level of [2.77,4.73,8.24,11.90,13.55])
            box(wall,u,y+level,.12,.46,.24,.42,white);
        }
        const inset=.73;
        for(let k=0;k<3;k++){
          const pitch=(L-2*inset)/3,u=inset+pitch*(k+.5);
          arch(wall,u,y+9.08,pitch*.80,2.25,.57,.28,white,'#484c47',{trim:.14,depth:.16});
          for(let j=0;j<6;j++)box(wall,u,y+9.25+j*.35,.19,pitch*.79,.12,.13,'#c9c7b5');
        }
        box(wall,L/2,y+12.37,.10,L-.51,.62,.23,'#ede5d3');
        for(const u of [.10,L-.10])box(wall,u,y+13.85,.00,.36,.92,.47,white);
      }
      // The green roof of the Life Centre is the foreground of the historic
      // church. Its modern entrance is at road level below that churchyard.
      const life=22046,deck=top(life)-.14,lp=ring(life);
      shell(life,'#a79880','#899272',low(life),deck);
      const lawn=lp.map(([x,z])=>[220+(x-220)*.84,-672+(z+672)*.87]);
      b.prism(lawn,deck+.015,deck+.12,'#b7b197','#86a073');
      for(const [x,z,w,d] of [[219,-684,3.6,2.0],[227,-671,2.7,2.9],[219,-654,3.0,1.6]]){
        b.box(x,deck+.22,z,w,.28,d,'#93a8a2',.17);b.box(x,deck+.38,z,w+.09,.06,.12,'#c6c9ba',.17);
      }
      const street=frame(lp[10],lp[11]),L=street.length,streetFloor=ground(...lp[11]);
      // Carry the stone facing round the returns either side of the recessed entrance.
      edges(lp,(a,c)=>{const wall=frame(a,c),len=wall.length;if(len<.30)return;
        const g0=ground(...a),g1=ground(...c),start=Math.min(g0,g1,low(life))-.15;
        let course=0;
        for(let y=start;y<deck-.05;y+=.43,course++){
          const rows=Math.max(1,Math.ceil(len/1.22)),u=len/rows;
          for(let k=course%2?-1:0;k<rows;k++){
            const l=Math.max(0,(k+.5*(course%2))*u),r=Math.min(len,(k+1+.5*(course%2))*u);
            if(r-l>.09)panel(wall,l+.014,r-.014,y+.016,Math.min(deck,y+.419),.034,
              ['#a39884','#b1a68f','#a99d88','#baad95','#b4a68f'][(course+k+rows*3)%5]);
          }
        }
      });
      for(let k=0;k<13;k++){
        const q=lawn[(k+1)%lawn.length],x=q[0]*.91+220*.09,z=q[1]*.91-672*.09;
        b.dome(x,deck+.11,z,1.01+(k%2)*.34,.61,1.03,k%2?'#6d855b':'#839266',0,8);
      }
      for(let k=0;k<10;k++){
        const u=3.4+k*2.17;sash(street,u,streetFloor+.18,2.04,3.04,.12,'#a8afa6','#607975');
      }
      cross(street,L-3.6,streetFloor+2.49,.23,3.65,'#eee8cf');
      sign(street,12.0,streetFloor+3.82,.18,10,.59,'聖安德烈堂','ST ANDREW’S CHURCH','#968d7b','#f6edd8');
      // Granite lychgate and flight of steps, on the old gateway axis.
      const gate=frame([209.15,-642.1],[209.45,-638.3]),gy=ground(209.5,-640.2),u=gate.length/2;
      for(const x of [.34,gate.length-.34]){
        box(gate,x,gy+1.3,-.14,.72,2.6,.80,'#adaea0');
        for(let k=0;k<6;k++)box(gate,x,gy+.24+k*.42,-.145,.73,.025,.81,'#8d9087');
      }
      arch(gate,u,gy+.01,2.47,2.20,1.31,.22,'#b7b7a8',null,{trim:.53,depth:.80,reveal:'#9d9e92'});
      for(let i=0;i<2;i++){
        const a=gate.at(i?gate.length+.11:-.11,gy+2.50,.18),peak=gate.at(u,gy+4.53,.18);
        b.beam(a,peak,.12,'#ceccbc');
      }
      cross(gate,u,gy+4.77,-.13,.78,white);
      for(let k=0;k<17;k++){
        const d=-.85-k*.365,topStep=gy+.07+k*.153,pt=gate.at(u,0,d);
        const floor=Math.min(ground(pt[0],pt[2])-.16,topStep-.17);
        box(gate,u,(floor+topStep)/2,d,2.97,topStep-floor,.385,'#a5a394');
      }
      for(const s of [-1,1])b.beam(gate.at(u+s*1.42,gy+.95,-.92),gate.at(u+s*1.42,gy+3.43,-6.72),.045,'#7b8176');
      sign(gate,gate.length+.94,gy+1.75,-.19,1.30,.88,'聖安德烈堂','138 NATHAN ROAD','#78564d');
    }
    function observatory(){
      const key=118299,base=low(key),roof=top(key),f=frame([413.3,-675.8],[444.2,-675.9]),L=f.length;
      foundation(key,base+.20,'#bfb7a3');
      box(f,L/2,(roof+base)/2,-6.62,L,roof-base,8.28,'#e5daaf');
      for(const [face,pitch,depth] of [[f,L/9,2.48],[section(f,L,-13.44,0,-13.44),L/9,2.44]]){
        for(const yy of [base+.20,base+4.83,roof-.26]){
          box(face,L/2,yy,-depth*.52,L+.31,.26,depth*1.15,'#e8dfc2');
        }
        for(let row=0;row<2;row++){
          const y=base+.35+row*4.60;
          for(let j=0;j<9;j++){
            const u=pitch*(j+.5);
            sash(face,u,y+.25,pitch*.47,2.48,-depth+.055,cream,'#57665c');
            for(const side of [-1,1])box(face,u+side*pitch*.28,y+1.65,-depth+.08,.23,2.52,.08,'#6b7769');
            // The shallow segmental arches are carried by square piers with foliated capitals.
            arch(face,u,y+.01,pitch-.53,3.37,.47,.055,'#e9dfbc',null,{pointed:false,trim:.22,depth:.56});
            box(face,u,y+4.01,-.20,pitch+.02,.40,.59,'#e6dbb9');
            for(const x of j===8?[j*pitch,L]:[j*pitch]){
              box(face,x,y+1.63,-.14,.51,3.28,.60,'#f0e5c7');box(face,x,y+.23,-.14,.67,.45,.72,cream);
              box(face,x,y+3.31,-.14,.76,.23,.78,cream);
              for(const side of [-1,0,1])line(face,x+side*.13,y+3.04,x+side*.22,y+3.32,.17,.049,'#c8b791');
            }
            if(row){
              box(face,u,y+.79,.00,pitch-.47,.14,.28,cream);
              for(let k=1;k<9;k++)b.cylinder(...face.at(j*pitch+pitch*k/9,y+.42,0),.088,.114,.65,cream,8);
            }
          }
        }
        for(let i=0;i<70;i++)box(face,(i+.5)*L/70,roof-.40,.015,.19,.21,.51,cream);
        box(face,L/2,roof-.09,-.01,L+.70,.20,.84,white);
      }
      for(const u of [-.03,L+.03]){
        const side=u>0?section(f,u,.0,u,-13.44):section(f,u,-13.44,u,0);
        panel(side,0,side.length,base+.24,roof-.14,.01,'#e5d9b1');
        for(let row=0;row<2;row++)for(const x of [3.5,7.1,10.5])sash(side,x,base+row*4.60+1.0,1.38,2.15,.072,cream,'#64756a');
      }
      b.prism(ring(key),roof-.22,roof,'#cfc4a4','#b0aa98');
      for(let k=0;k<3;k++)box(f,L/2,base+.18-k*.12,.22+k*.36,4.5,.19,.40,'#bcb6a6');
      const a=250000;shell(a,'#e8ddbe','#abac9d');
      edges(ring(a),(v,w)=>{const f=frame(v,w);for(let j=1;j<f.length/2.8;j++)sash(f,j*2.8,low(a)+1.1,1.25,2.22,.07,cream,'#63726d');});
      const cent=252588,lo=low(cent),hi=top(cent),p=ring(cent);shell(cent,'#e6dabb','#c9c6b4');
      edges(p,(a,c,i)=>{const face=frame(a,c),L=face.length;
        if(i===0){ // Broad west end seen immediately behind the 1883 veranda.
          const u=L*.86;for(let j=0;j<9;j++)panel(face,u-.66,u+.66,lo+2.4+j*3.66,lo+4.95+j*3.66,.055,'#6f827d');
        }else{
          const n=Math.round(L/2.14),w=L/n;
          for(let k=0;k<9;k++)for(let j=0;j<n;j++){
            const y=lo+2.00+k*3.78,u=(j+.5)*w;
            panel(face,u-w*.41,u+w*.41,y,y+2.43,.05,'#55706f');
            if((j*7+k*3)%11<4)tile(b.lights,face,u-w*.39,u+w*.39,y+.1,y+2.34,.060,'#b5c5ad');
            panel(face,u-w*.41,u+w*.41,y+1.79,y+1.88,.083,'#b0b5a4');
            box(face,u,y+2.53,.13,w-.16,.26,.59,'#eee1c3');
          }
          for(let j=0;j<=n;j++)box(face,j*w,(lo+hi)/2,.12,.21,hi-lo,.56,'#f0e2c5');
        }
        box(face,L/2,hi-.18,.08,L+.42,.44,.61,cream);
      });
      b.cylinder(458.8,hi+.55,-691.2,3.5,3.6,1.05,'#bdc5c0',32);
      b.dome(458.8,hi+1.0,-691.2,3.52,3.60,3.52,'#eeeee2',0,32);
      // The dedicated tropical thermometer shed and the nearby screen have distinct shapes.
      const shed=frame([438.6,-655.6],[445.2,-655.6]),ww=shed.length;
      const sy=ground(441.9,-655.6);
      for(const x of [.18,ww/2,ww-.18])for(const z of [-2.04,2.04])
        box(shed,x,sy+.95,z,.18,2.00,.18,'#ebe8d7');
      const rs=section(shed,0,0,0,-1);
      gableRoof(rs,0,ww+.4,-.38,5.40,sy+1.93,sy+3.37,['#bcb092','#a99675','#917f63'],'#9f8e72');
      for(let j=0;j<24;j++)for(const side of [-1,1]){
        const x=ww*j/23; b.beam(shed.at(x,sy+3.38,0),shed.at(x,sy+1.78,side*2.68),j%4===0?.042:.019,'#9d896a');
      }
      box(shed,ww*.49,sy+1.20,0,.64,.21,.47,'#b6b6a3');
      const sx=437.8,sz=-665.0,ss=ground(sx,sz);
      for(const x of [-.39,.39])for(const z of [-.27,.27])b.box(sx+x,ss+.58,sz+z,.064,1.18,.066,cream);
      b.box(sx,ss+1.47,sz,1.02,.70,.77,'#afb7ad');
      for(let k=0;k<8;k++)b.box(sx,ss+1.14+k*.091,sz,1.05,.042,.80,white);
      b.box(sx,ss+1.89,sz,1.16,.10,.91,cream);
      for(const [x,z] of [[421,-661],[423,-655],[418.2,-653.5],[436,-652.8]]){
        const h=ground(x,z);b.cylinder(x,h+.39,z,.17,.185,.76,'#bdc6bc',12);
        b.cylinder(x,h+.83,z,.23,.19,.11,white,14);
      }
    }
    ({church:andrew,mosque,stmarys:school,rosary,observatory})[id]();
    if(brickPos.length){
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(brickPos,3));
      geo.setAttribute('uv',new THREE.Float32BufferAttribute(brickUV,2));geo.computeVertexNormals();
      const wall=new THREE.Mesh(geo,brickMaterial());wall.name='紅磚砌面';wall.castShadow=true;wall.receiveShadow=true;group.add(wall);
    }
  }
  return {sites,build};
})();
