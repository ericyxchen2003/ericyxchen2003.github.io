/* Player-only Hong Kong Crown Comfort. Metres, nose along -Z.
   The 4-passenger livery, trim and instrument artwork are drawn locally. */
window.HKCrownComfort=(()=>{
  'use strict';
  const T=THREE, axles=[-1.395,1.390], tire=.305;
  const paint='#c82436',shadowRed='#9c2130',silver='#cbd1d0',rubber='#22272a',polished='#bdc5c6';
  // A small lettered livery atlas avoids a material for each emblem or lamp lens.
  function markings(){
    const cv=document.createElement('canvas');cv.width=1024;cv.height=512;
    const c=cv.getContext('2d'),tiles={},pos=[],uv=[];
    function tile(name,x,y,w,h,draw){c.save();c.translate(x,y);c.beginPath();c.rect(0,0,w,h);c.clip();draw(w,h);c.restore();tiles[name]=[x,y,w,h];}
    function rect(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
    function word(str,x,y,px,col,font='Arial'){c.fillStyle=col;c.font='bold '+px+'px '+font;c.textAlign='center';c.textBaseline='middle';c.fillText(str,x,y);}
    tile('doors',0,0,250,185,()=>{word('的 士',125,48,81,'#fffaf0','sans-serif');word('TAXI',125,133,82,'#fffaf0');});
    tile('roof',255,0,250,90,()=>{rect(0,0,250,90,'#b92036');word('T A X I',125,46,63,'#fff9ee');});
    tile('seats',515,0,156,110,()=>{
      c.beginPath();c.moveTo(4,105);c.bezierCurveTo(6,-18,149,-18,152,105);c.closePath();c.fillStyle='#116d51';c.fill();c.lineWidth=5;c.strokeStyle='white';c.stroke();
      word('TAXI',78,28,21,'white');word('4',78,59,45,'white');word('S E A T S',78,91,16,'white');});
    tile('frontPlate',0,192,335,78,()=>{rect(0,0,335,78,'#e9ebdf');word('HD 1995',167,41,66,'#202327');});
    tile('rearPlate',342,191,145,116,()=>{rect(0,0,145,116,'#ffd05d');word('HD',72,29,52,'#212425');word('1995',72,85,49,'#212425');});
    tile('model',505,195,326,47,()=>word('C R O W N   C O M F O R T',163,24,22,'#eeeee8'));
    tile('lamp',0,325,350,150,()=>{
      const glow=c.createLinearGradient(0,0,0,150);glow.addColorStop(0,'#c0cbd0');glow.addColorStop(.31,'#edf0e5');glow.addColorStop(.50,'#a5b0ac');glow.addColorStop(.57,'#f4f5e9');glow.addColorStop(1,'#a9b9bc');
      c.fillStyle=glow;c.fillRect(0,0,350,150);
      for(let i=0;i<3;i++){
        const x=i*112+14;c.fillStyle='rgba(104,122,123,.26)';c.fillRect(x,23,2,102);c.fillStyle='rgba(255,255,244,.65)';c.fillRect(x+4,26,3,94);
        c.beginPath();c.moveTo(x+6,105);c.quadraticCurveTo(x+46,66,x+88,89);c.lineWidth=4;c.strokeStyle='rgba(251,251,234,.72)';c.stroke();
      }
      for(let x=2;x<350;x+=8)rect(x,0,2,150,'rgba(75,92,97,.20)');
      for(let y=10;y<150;y+=19)rect(0,y,350,1,'rgba(255,255,248,.53)');
    });
    const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    function place(name,x,y,z,w,h,ry=0){
      const [tx,ty,tw,th]=tiles[name],cs=Math.cos(ry),sn=Math.sin(ry);
      for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
        pos.push(x+(u-.5)*w*cs,y+(v-.5)*h,z-(u-.5)*w*sn);
        uv.push((tx+1+u*(tw-2))/cv.width,1-(ty+1+(1-v)*(th-2))/cv.height);
      }
    }
    function finish(){
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      return new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,alphaTest:.40,polygonOffset:true,polygonOffsetFactor:-1}));
    }
    return {place,finish};
  }
  function create(Parts){
    const car=new T.Group();car.name='Crown Comfort · 市區四座的士';
    const shell=new Parts(),trim=new Parts(),glazing=new Parts(),brakeParts=new Parts(),marks=markings();
    const front=-2.3475,rear=2.3475;
    const profile=[ // z, half-width, shoulder height, roof of boot or bonnet
      [front,.742,.694,.767],[-2.27,.802,.775,.823],[-2.07,.836,.813,.862],
      [-1.33,.8475,.857,.898],[-1.02,.8475,.875,.921],[.44,.8475,.87,.909],
      [1.42,.844,.884,.925],[2.04,.833,.862,.905],[2.26,.805,.843,.875],[rear,.755,.780,.842]];
    function section(z){
      let i=1;while(i<profile.length-1&&profile[i][0]<z)i++;
      const a=profile[i-1],b=profile[i],t=(z-a[0])/(b[0]-a[0]);
      return [1,2,3].map(k=>a[k]+(b[k]-a[k])*t);
    }
    const stations=new Set(profile.map(p=>p[0]));
    for(const z of axles)for(let i=0;i<=20;i++)stations.add(z+.355*Math.cos(i*Math.PI/20));
    const zs=[...stations].sort((a,b)=>a-b);
    function sideProfile(z,side){
      const [w,h,top]=section(z),d=Math.min(...axles.map(a=>Math.abs(a-z)));
      const low=tire+(d<.355?Math.sqrt(Math.max(0,.355**2-d*d)):0);
      return [[side*(w-.04),low,z],[side*(w-.009),Math.max(.42,low+.018),z],
        [side*w,Math.max(.66,low+.038),z],[side*(w-.009),h,z],[side*(w-.06),top,z]];
    }
    for(const side of [-1,1])for(let i=1;i<zs.length;i++){
      const a=sideProfile(zs[i-1],side),b=sideProfile(zs[i],side);
      for(let j=0;j<4;j++)shell.quad(a[j],b[j],b[j+1],a[j+1],j===0?shadowRed:paint);
      // Return at the sill and along each wheel arch, leaving a genuine wheel opening.
      const inset=p=>[p[0]-side*.12,p[1]-.018,p[2]];
      trim.quad(a[0],inset(a[0]),inset(b[0]),b[0],rubber);
      if(zs[i]<=-1.02||zs[i-1]>=1.42){
        const pt=(z,u)=>{const [w,,h]=section(z);return [u*(w-.06),h+.021*(1-Math.abs(u)),z];};
        for(const [l,r] of [[-1,-.78],[-.78,.78],[.78,1]])shell.quad(pt(zs[i-1],l),pt(zs[i],l),pt(zs[i],r),pt(zs[i-1],r),paint);
      }
    }
    for(const z of [front,rear]){
      const [w,,top]=section(z);
      shell.quad([-w,.325,z],[w,.325,z],[w,top,z],[-w,top,z],paint);
      trim.box(0,.485,z+(z<0?.021:-.021),w*2+.035,.117,.066,rubber);
      for(const s of [-1,1])trim.box(s*(w+.033),.492,z+(z<0?.095:-.095),.074,.105,.19,rubber);
    }
    trim.box(0,.345,0,1.38,.075,4.45,'#323537');
    for(const side of [-1,1]){
      const hood=[];for(const z of [-2.255,-2.13,-1.74,-1.32,-1.10]){
        const [w,,h]=section(z),x=(w-.06)*.85;
        hood.push([side*x,h+.005,z]);
      }
      rail(hood,.0036,'#9a2931');
      rail([[side*.668,.906,1.53],[side*.673,.912,1.95],[side*.654,.892,2.19],[side*.626,.875,2.25]],.0028,'#9b2831');
    }
    function rail(points,r,c){for(let i=1;i<points.length;i++)trim.beam(points[i-1],points[i],r,c);}
    const paddedMirror=new T.SphereGeometry(1,16,9);
    for(const s of [-1,1]){
      const sidep=(x,y,z)=>[s*x,y,z],A=sidep(.784,.921,-1.065),B=sidep(.637,1.463,-.496),C=sidep(.628,1.466,.884),D=sidep(.782,.931,1.479);
      // Separate four side panes with substantial silver A and C posts.
      const a=sidep(.779,.939,-.938),b=sidep(.652,1.435,-.443),c=sidep(.647,1.436,.792),d=sidep(.777,.944,1.207);
      shell.quad(A,B,b,a,silver);shell.quad(B,C,c,b,silver);shell.quad(c,C,D,d,silver);
      rail([a,b,c,d,a],.011,'#242a2d');
      const b1=sidep(.776,.939,.164),b2=sidep(.649,1.437,.132);
      glazing.quad(a,b,b2,b1,'#8299a3');glazing.quad(b1,b2,c,d,'#8299a3');
      rail([b1,b2],.025,'#22272a');rail([sidep(.776,.94,.993),sidep(.650,1.436,.772)],.009,'#495458');
      rail([A,D],.012,polished);rail([a,d],.010,rubber);
      // Recesses and seams follow the curvature of each door skin.
      for(const seam of [[[-.98,.88],[-1.00,.67],[-.96,.38]],[[.17,.884],[.17,.68],[.12,.372]],[[1.24,.89],[1.22,.77],[.99,.70],[.91,.49],[.88,.385]]]){
        rail(seam.map(([z,y])=>sidep(y>.8?.840:.846,y,z)),.0048,'#85202b');
      }
      trim.box(s*.848,.524,0,.019,.057,2.065,rubber);
      for(const z of [-.02,1.00]){
        trim.box(s*.844,.790,z,.010,.047,.156,'#4a3537');
        trim.box(s*.853,.801,z,.012,.019,.119,polished);
      }
      marks.place('doors',s*.85,.685,.555,.293,.221,s*Math.PI/2);
      trim.box(s*.843,.736,-1.19,.012,.039,.082,'#dfc79c');
      trim.beam(sidep(.767,.958,-.877),sidep(.867,.99,-.842),.025,rubber);
      trim.mesh(paddedMirror,'#292e32',s*.903,1.006,-.842,.078,.047,.067);
      trim.box(s*.904,1.006,-.774,.119,.061,.009,'#a8bdc1');
    }
    // Crown the silver roof gently across and along its length.
    const roof=[[-.515,.61,1.467],[-.432,.641,1.484],[-.23,.649,1.5],[.65,.646,1.5],[.852,.635,1.487],[.946,.611,1.468]];
    const row=(r,u)=>[r[1]*u,r[2]+.015*(1-u*u),r[0]];
    for(let i=1;i<roof.length;i++)for(const [a,b] of [[-1,-.8],[-.8,0],[0,.8],[.8,1]])shell.quad(row(roof[i-1],a),row(roof[i],a),row(roof[i],b),row(roof[i-1],b),silver);
    for(const side of [-1,1])rail([[side*.637,1.463,-.496],[side*.628,1.466,.884]],.021,silver);
    const wf=[[-.785,.925,-1.072],[.785,.925,-1.072],[.637,1.468,-.505],[-.637,1.468,-.505]];
    const wr=[[-.777,.935,1.48],[.777,.935,1.48],[.624,1.473,.925],[-.624,1.473,.925]];
    for(const pts of [wf,wr]){glazing.quad(...pts,'#98aeb3');rail([...pts,pts[0]],.014,'#31383b');}
    for(let i=1;i<8;i++){const t=i/9,y=.936+t*.534,z=1.482-t*.555,w=.773-t*.149;trim.beam([-w,y,z],[w,y,z],.0016,'#82776b');}
    for(const x of [-.43,.28]){rail([[x+.10,.935,-1.062],[x-.01,.948,-1.046],[x-.23,.950,-1.053]],.005,rubber);}
    // Seats visible through the glass; one front passenger and a three-place rear bench.
    const oval=new T.SphereGeometry(1,18,12);
    function cushion(x,y,z,w,h,d,tint,tilt=0){
      // Squared upholstery with radiused corners, rather than ellipsoidal seats.
      trim.mesh(padded,tint,x,y,z,w/2,h/2,d/2,tilt);
    }
    const padded=oval.clone(),pp=padded.attributes.position;
    for(let i=0;i<pp.count;i++){
      const radius=n=>Math.sign(n)*Math.pow(Math.abs(n),.30);
      pp.setXYZ(i,radius(pp.getX(i)),radius(pp.getY(i)),radius(pp.getZ(i)));
    }
    padded.computeVertexNormals();
    cushion(0,.539,.87,1.39,.188,.66,'#434e55');
    for(const x of [-.38,.38]){
      cushion(x,.819,.32,.54,.46,.165,'#58646a',.12);
      for(const dx of [-.074,.074])trim.beam([x+dx,1.014,.35],[x+dx,1.093,.35],.007,polished);
      cushion(x,1.125,.353,.251,.141,.128,'#4f5b61',.10);
      cushion(x,.57,.025,.53,.135,.54,'#59646b');
      for(const side of [-1,1])rail([[x+side*.196,.683,.22],[x+side*.195,.938,.255],[x+side*.153,.996,.265]],.003,'#414d54');
    }
    cushion(0,.78,1.17,1.40,.39,.20,'#59636a',.16);
    for(const x of [-.43,.43])cushion(x,1.025,1.18,.255,.131,.146,'#526068');
    // Seated driver silhouette for the external camera.
    trim.mesh(oval,'#515e67',.36,.85,.15,.17,.216,.108,.10);
    trim.mesh(oval,'#a98065',.36,1.126,.132,.096,.119,.091);
    trim.dome(.36,1.150,.141,.098,.107,.094,'#3b3736',0,20);
    for(const side of [-1,1]){
      trim.beam([.36+side*.134,.936,.12],[.36+side*.189,.802,-.12],.048,'#505f68');
      trim.beam([.36+side*.189,.802,-.12],[.36+side*.134,.862,-.491],.031,'#af896e');
      trim.mesh(oval,'#b58b71',.36+side*.13,.864,-.492,.034,.032,.042);
    }
    trim.box(0,.84,-.79,1.47,.14,.37,'#3c474a');
    const hoop=new T.TorusGeometry(.17,.014,8,32);trim.mesh(hoop,'#252b2c',.36,.865,-.52,1,1,1,-.38);
    trim.box(.36,.862,-.52,.19,.065,.026,'#424d4e');
    trim.box(-.02,.898,-.701,.24,.092,.084,'#303637');
    // Rectangular headlamps, horizontal egg-crate grille and lower bumper openings.
    trim.box(0,.691,front-.005,.841,.197,.028,'#bbc3c0');
    trim.box(0,.692,front-.021,.803,.159,.012,'#2b3032');
    for(let j=0;j<6;j++)trim.box(0,.631+j*.024,front-.031,.791,.007,.010,'#bdc2ba');
    for(let j=-5;j<=5;j++)trim.box(j*.065,.693,front-.027,.006,.140,.008,'#929a99');
    function badge(x,y,z,scale){
      const ring=new T.TorusGeometry(1,.1,6,24);
      trim.mesh(ring,polished,x,y,z,.047*scale,.032*scale,.02);
      trim.mesh(ring,polished,x,y+.003*scale,z,.013*scale,.026*scale,.02);
      trim.mesh(ring,polished,x,y+.009*scale,z,.032*scale,.011*scale,.02);
    }
    badge(0,.707,front-.043,.9);badge(0,.79,rear+.008,.85);
    for(const s of [-1,1]){
      trim.box(s*.588,.687,front-.012,.327,.179,.032,'#939e9e');marks.place('lamp',s*.588,.687,front-.032,.310,.158,Math.PI);
      trim.box(s*.757,.686,front+.016,.081,.151,.103,'#e1ded0');trim.box(s*.766,.677,front-.039,.041,.053,.013,'#d99354');
      trim.box(s*.554,.374,front-.004,.237,.071,.018,'#5e3338');trim.box(s*.558,.378,front-.017,.125,.051,.016,'#deded2');
      trim.box(s*.653,.699,rear+.005,.209,.253,.023,'#443a3a');
      for(const [y,h,col] of [[.621,.087,'#a32032'],[.697,.043,'#e3ddd1'],[.765,.078,'#ce8034']]){
        trim.box(s*.652,y,rear+.020,.193,h,.017,col);
        trim.box(s*.769,y,rear-.046,.072,h,.145,col);
      }
      brakeParts.box(s*.652,.621,rear+.032,.185,.075,.01,'#ff423c');
      for(let j=0;j<4;j++)trim.box(s*.65,.608+j*.009,rear+.031,.184,.002,.004,'#c03944');
    }
    trim.box(0,.54,front-.024,.467,.131,.018,rubber);marks.place('frontPlate',0,.54,front-.036,.446,.112,Math.PI);
    trim.box(0,.672,rear+.015,.319,.179,.014,'#3c3938');marks.place('rearPlate',0,.670,rear+.024,.287,.158);
    trim.box(0,.775,rear+.021,.333,.026,.034,polished);
    marks.place('seats',.239,.685,front-.045,.231,.164,Math.PI);
    marks.place('seats',-.396,.66,rear+.027,.185,.135);marks.place('model',.36,.755,rear+.020,.31,.047);
    trim.box(0,.966,1.131,.24,.024,.05,'#9c2c35');brakeParts.box(0,.971,1.16,.21,.019,.01,'#ff443e');
    trim.beam([-.43,.924,1.71],[-.44,1.205,1.78],.0035,rubber);
    // Red/white roof lantern with a flared silver foot and curved upper corners.
    trim.box(0,1.52,.06,.476,.025,.223,'#585e62');
    const sign=[[-.231,1.528],[-.22,1.63],[-.193,1.658],[.193,1.658],[.22,1.63],[.231,1.528]];
    for(let i=0;i<sign.length;i++){
      const p=sign[i],q=sign[(i+1)%sign.length];trim.quad([...p,-.036],[...q,-.036],[...q,.155],[...p,.155],'#efece1');
      if(i>0&&i<sign.length-1)for(const z of [-.036,.155])trim.tri([...sign[0],z],[...p,z],[...q,z],'#c32b3b');
    }
    marks.place('roof',0,1.59,-.037,.41,.118,Math.PI);marks.place('roof',0,1.59,.156,.41,.118);
    const body=shell.finish('鈑金及銀頂');body.material=new T.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.20,side:T.DoubleSide});
    const glass=glazing.finish('玻璃');
    const glassColors=glass.geometry.attributes.color,glassPos=glass.geometry.attributes.position;
    for(let i=0;i<glassColors.count;i++){
      const t=T.MathUtils.clamp((glassPos.getY(i)-.93)/.54,0,1);
      glassColors.setXYZ(i,.30+.16*t,.37+.24*t,.42+.30*t);
    }
    glass.material=new T.MeshPhongMaterial({vertexColors:true,transparent:true,opacity:.32,specular:0xa8bdce,shininess:90,depthWrite:false,side:T.DoubleSide});glass.renderOrder=1;
    const brakes=brakeParts.finish('煞車燈');brakes.material=new T.MeshBasicMaterial({vertexColors:true});brakes.visible=false;
    car.add(body,trim.finish('車身裝飾與座椅'),glass,marks.finish(),brakes);
    const wheel=new Parts(),axis=Math.PI/2;
    wheel.cylinder(0,0,0,tire,tire,.175,'#292d30',36,0,0,axis);
    wheel.cylinder(.090,0,0,.222,.226,.017,'#262d32',36,0,0,axis);
    wheel.cylinder(.101,0,0,.213,.221,.014,'#bcc0bc',36,0,0,axis);
    const sidewall=new T.TorusGeometry(.248,.0025,6,36);wheel.mesh(sidewall,'#3b3e40',.092,0,0,1,1,1,0,Math.PI/2);
    wheel.mesh(new T.TorusGeometry(.209,.005,8,36),polished,.113,0,0,1,1,1,0,Math.PI/2);
    wheel.cylinder(.112,0,0,.080,.093,.019,'#9ca6a7',20,0,0,axis);
    for(let j=0;j<7;j++){const a=j*Math.PI*2/7,cs=Math.cos(a),sn=Math.sin(a);
      const pt=(r,t)=>[.110,cs*r-sn*t,sn*r+cs*t];
      wheel.quad(pt(.12,-.023),pt(.176,-.033),pt(.184,.027),pt(.129,.031),'#485155');
    }
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5;wheel.cylinder(.121,.066*Math.cos(a),.066*Math.sin(a),.012,.012,.010,'#61686b',8,0,0,axis);}
    const wheelMesh=wheel.finish('輪圈');const wheels=[];
    for(const z of axles)for(const s of [-1,1]){
      const pivot=new T.Group();pivot.position.set(s*.726,tire,z);const disc=wheelMesh.clone();disc.rotation.y=s<0?Math.PI:0;
      const spin=new T.Group();spin.add(disc);pivot.add(spin);car.add(pivot);wheels.push({pivot,spin,front:z===axles[0]});
    }
    const rider=new Parts();
    rider.mesh(oval,'#4e7874',-.35,.92,.83,.168,.212,.103,.07);
    rider.mesh(oval,'#b98b71',-.35,1.188,.81,.096,.12,.091);
    rider.mesh(oval,'#373331',-.35,1.246,.827,.10,.077,.092);
    for(const side of [-1,1]){
      rider.beam([-.35+side*.135,1.011,.815],[-.35+side*.142,.816,.727],.045,'#4e7874');
      rider.beam([-.35+side*.142,.816,.727],[-.35+side*.075,.744,.613],.032,'#b98b71');
    }
    const passenger=rider.finish('後座乘客');passenger.visible=false;car.add(passenger);
    function update(state,dt,braking){
      passenger.visible=state.taxi?.phase==='hired';
      brakes.visible=braking;
      for(const w of wheels){if(w.front)w.pivot.rotation.y=-state.steer;w.spin.rotation.x=(w.spin.rotation.x-state.speed*dt/tire)%(2*Math.PI);}
    }
    return {car,update};
  }
  return {create};
})();
