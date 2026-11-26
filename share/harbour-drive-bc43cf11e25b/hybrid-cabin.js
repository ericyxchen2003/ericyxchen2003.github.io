/* Right-hand-drive NTP10R. Coordinates in the cockpit's driver-eye frame. */
window.HKHybridCabin=(()=>{
  function create({mesh,box,bar,finish,texturePanel,letter}){
    const T=THREE,root=new T.Group();
    root.name='Comfort Hybrid · 駕駛艙';
    const graphite=finish('#393e40'),dashTop=finish('#474d4e'),black=finish('#202527'),
      silver=finish('#919b9e',.41,.30),warm=finish('#565653'),leather=finish('#313538');
    const small=(x,y,z,w,h,d,mat,parent=root)=>box(x,y,z,w,h,d,mat,parent);
    const oval=new T.SphereGeometry(1,24,16);
    function ellipsoid(x,y,z,w,h,d,mat,parent=root){
      const part=mesh(oval,mat,x,y,z,parent);part.scale.set(w,h,d);return part;
    }
    // Formed fascias are bevelled extrusions, including the lip around each recess.
    function bezel(x,y,z,w,h,d,r,mat,parent=root){
      const l=-w/2,b=-h/2,a=w/2,t=h/2,shape=new T.Shape();
      shape.moveTo(l+r,b);shape.lineTo(a-r,b);shape.quadraticCurveTo(a,b,a,b+r);
      shape.lineTo(a,t-r);shape.quadraticCurveTo(a,t,a-r,t);shape.lineTo(l+r,t);
      shape.quadraticCurveTo(l,t,l,t-r);shape.lineTo(l,b+r);shape.quadraticCurveTo(l,b,l+r,b);
      const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:6});
      return mesh(geo,mat,x,y,z-d,parent);
    }
    function panel(x,y,z,w,h,paint,cw=512,ch=192){
      const obj=texturePanel(x,y,z,w,h,paint,cw,ch);root.add(obj.face);return obj;
    }
    function print(g,str,x,y,size,col,bold=false){letter(g,str,x,y,size,col,bold);}
    // A broad, lightly crowned dash top folds down into the passenger fascia.
    const sections=[[-1.16,.910],[-1.04,.938],[-.88,.935],[-.73,.908],[-.67,.861],[-.61,.788]];
    const geo=new T.BufferGeometry(),verts=[],idx=[];
    for(const [z,y] of sections)for(const u of [-1,-.72,0,.72,1])
      verts.push(.812*u,y+.014*(1-u*u),z+.045*u*u);
    for(let i=0;i<sections.length-1;i++)for(let k=0;k<4;k++){
      const a=i*5+k;idx.push(a,a+5,a+1,a+1,a+5,a+6);
    }
    geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();dashTop.side=T.DoubleSide;
    mesh(geo,dashTop,0,0,0,root);
    // A continuous kick panel closes the gap behind the steering column and vents.
    bezel(0,.588,-.604,1.61,.429,.151,.057,black);
    bezel(.385,.770,-.594,.775,.158,.098,.032,graphite);
    bezel(-.397,.736,-.551,.815,.257,.108,.033,warm);
    bezel(-.397,.622,-.537,.745,.067,.055,.018,graphite);
    small(-.403,.685,-.543,.57,.004,.005,black);
    panel(-.383,.717,-.544,.14,.039,(g,w,h)=>{
      g.fillStyle='#c6ae61';g.fillRect(0,0,w,h);
      print(g,'請扣好安全帶',18,76,49,'#373b38',true);print(g,'FASTEN SEAT BELT',18,127,31,'#383c38');
    });
    function vent(x,y,z){
      const ring=mesh(new T.TorusGeometry(.045,.007,8,32),silver,x,y,z,root);
      mesh(new T.CircleGeometry(.044,36),black,x,y,z-.003,root);
      for(let k=-2;k<=2;k++){
        const dy=k*.013,dx=Math.sqrt(.039**2-dy**2);
        bar([x-dx,y+dy,z+.001],[x+dx,y+dy,z+.006],.0028,graphite,root);
      }
      ring.rotation.x=-.045;
    }
    vent(-.71,.794,-.535);vent(.691,.802,-.536);
    bezel(.679,.69,-.522,.162,.144,.08,.016,graphite);
    panel(.679,.696,-.516,.138,.123,(g,w,h)=>{
      g.fillStyle='#292f30';g.fillRect(0,0,w,h);g.fillStyle='#b9c2a1';g.fillRect(16,8,w-32,45);
      print(g,'AUTO   24.0°',35,43,34,'#323b32',true);
      for(const [i,s] of ['▲','AUTO','▼','A/C','MODE','OFF'].entries()){
        const x=18+(i%3)*94,y=67+Math.floor(i/3)*47;
        g.fillStyle='#414749';g.fillRect(x,y,85,38);print(g,s,x+12,y+28,23,'#d4dad6',true);
      }
    },304,174);
    // Centre stack with an inset 2-DIN audio unit, separate live taxi meter and dash selector.
    // The top of the centre stack returns into the instrument brow.
    bezel(.084,.885,-.674,.566,.082,.114,.024,graphite);
    bezel(-.041,.930,-.623,.298,.041,.075,.012,graphite);
    bezel(-.041,.931,-.618,.254,.020,.009,.007,black);
    small(-.041,.927,-.611,.235,.003,.008,dashTop);
    bezel(-.036,.752,-.525,.33,.345,.116,.023,graphite);
    bezel(-.036,.855,-.508,.274,.144,.026,.011,black);
    panel(-.036,.855,-.503,.255,.119,(g,w,h)=>{
      const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#26313a');bg.addColorStop(.56,'#101b26');bg.addColorStop(1,'#223745');
      g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle='#7f9aa9';g.fillRect(68,33,610,2);
      print(g,'AUDIO',76,27,19,'#c6d1d3');print(g,'FM',92,87,30,'#9fb7c0',true);print(g,'88.1',164,126,84,'#e1eeee');print(g,'MHz',342,124,25,'#adc0c5');
      for(let i=0;i<35;i++){g.fillStyle=i===9?'#ebae6b':'#879da5';g.fillRect(87+i*16,161,i===9?4:2,i%5===0?20:10);}
      print(g,'‹',21,89,32,'#a6b3b9');print(g,'›',21,144,32,'#a6b3b9');print(g,'BT     FM     AM',91,227,23,'#afc3ce');
    },720,256);
    bezel(-.037,.583,-.45,.245,.186,.104,.019,graphite).rotation.x=-.16;
    panel(-.068,.581,-.425,.097,.114,(g,w,h)=>{
      g.fillStyle='#32383a';g.fillRect(0,0,w,h);g.fillStyle='#adb0ac';g.fillRect(35,12,40,h-23);g.fillStyle='#1a2023';g.fillRect(43,17,24,h-34);
      for(const [i,s] of ['P','R','N','D','B'].entries())print(g,s,91,28+30*i,22,['#d4d6cf','#e19b77','#80cab1','#f1f3e2','#e0e6de'][i],true);
    },145,170);
    bar([-.077,.577,-.407],[-.083,.645,-.382],.008,silver,root);
    ellipsoid(-.083,.653,-.381,.031,.026,.026,leather);
    for(let i=0;i<3;i++)bezel(.015,.61-i*.032,-.429,.046,.021,.010,.004,black);
    // The instrument brow rises out of the dash and overhangs the recessed display.
    const podPositions=[],podIndices=[],podX=.339;
    const arch=[[-.94,0],[-1,.22],[-.99,.70],[-.93,.90],[-.76,.98],[0,1.02],
      [.76,.98],[.93,.90],[.99,.70],[1,.22],[.94,0]];
    for(const [z,width,base,height] of [[-1.085,.178,.909,.028],[-1.005,.199,.909,.086],
        [-.910,.209,.907,.123],[-.833,.207,.908,.123],[-.798,.194,.915,.109]]){
      for(const [u,v] of arch)podPositions.push(podX+u*width,base+v*height,z);
    }
    for(let row=0;row<4;row++)for(let i=0;i+1<arch.length;i++){
      const a=row*arch.length+i,b=a+arch.length;podIndices.push(a,b,a+1,a+1,b,b+1);
    }
    const brow=new T.BufferGeometry();
    brow.setAttribute('position',new T.Float32BufferAttribute(podPositions,3));brow.setIndex(podIndices);brow.computeVertexNormals();
    mesh(brow,dashTop,0,0,0,root);
    bezel(podX,.966,-.800,.367,.096,.027,.027,black);
    const cluster=panel(podX,.969,-.795,.320,.073,()=>{},768,180);

    // Fixed column and stalks stop behind the full swept volume of the wheel.
    // In these local coordinates +Z faces the driver, along the shaft.
    const column=new T.Group();column.name='轉向柱';
    column.position.set(.344,.803,-.423);column.rotation.x=-.36;root.add(column);
    bezel(0,-.007,-.080,.136,.083,.167,.031,graphite,column);
    const spindle=mesh(new T.CylinderGeometry(.026,.031,.067,20),black,0,0,-.060,column);
    spindle.rotation.x=Math.PI/2;
    for(const side of [-1,1]){
      bar([side*.054,.007,-.122],[side*.120,.041,-.105],.008,black,column);
      bar([side*.120,.041,-.105],[side*.149,.045,-.104],.012,graphite,column);
    }
    const steering=new T.Group();steering.name='方向盤';column.add(steering);
    const rimRadius=.170;
    mesh(new T.TorusGeometry(rimRadius,.016,16,96),leather,0,0,0,steering);

    // A single moulding spans the hub and both grips. The switch wells sit on its
    // flat front face, so no structural member passes across either switch.
    function moulding(shape,back,front,round,material){
      const geometry=new T.ExtrudeGeometry(shape,{depth:front-back,bevelEnabled:true,
        bevelSize:round,bevelThickness:round,bevelSegments:4,curveSegments:12});
      return mesh(geometry,material,0,0,back,steering);
    }
    const crosspiece=new T.Shape();
    crosspiece.moveTo(-.170,.035);
    crosspiece.bezierCurveTo(-.136,.038,-.088,.023,-.055,.031);
    crosspiece.quadraticCurveTo(0,.047,.055,.031);
    crosspiece.bezierCurveTo(.088,.023,.136,.038,.170,.035);
    crosspiece.lineTo(.167,-.004);
    crosspiece.bezierCurveTo(.135,-.004,.124,-.037,.072,-.032);
    crosspiece.quadraticCurveTo(0,-.021,-.072,-.032);
    crosspiece.bezierCurveTo(-.124,-.037,-.135,-.004,-.167,-.004);crosspiece.closePath();
    moulding(crosspiece,-.021,-.002,.005,leather);
    const lower=new T.Shape();
    lower.moveTo(-.053,-.037);lower.quadraticCurveTo(-.043,-.088,-.028,-.154);
    lower.quadraticCurveTo(0,-.174,.028,-.154);
    lower.quadraticCurveTo(.043,-.088,.053,-.037);lower.closePath();
    moulding(lower,-.019,-.005,.005,graphite);
    const inlay=new T.Shape();
    inlay.moveTo(-.043,-.075);inlay.lineTo(-.027,-.151);inlay.quadraticCurveTo(0,-.164,.027,-.151);
    inlay.lineTo(.043,-.075);inlay.lineTo(.036,-.078);inlay.lineTo(.021,-.146);
    inlay.quadraticCurveTo(0,-.155,-.021,-.146);inlay.lineTo(-.036,-.078);inlay.closePath();
    moulding(inlay,-.001,.001,.0015,silver);
    const cushion=new T.Shape();
    cushion.moveTo(-.065,.045);cushion.bezierCurveTo(-.057,.061,.048,.065,.062,.050);
    cushion.bezierCurveTo(.077,.033,.071,-.030,.059,-.049);
    cushion.quadraticCurveTo(.045,-.070,0,-.067);cushion.quadraticCurveTo(-.045,-.070,-.059,-.049);
    cushion.bezierCurveTo(-.070,-.028,-.077,.031,-.065,.045);
    moulding(cushion,-.022,.019,.009,leather);
    for(const [w,h,dy] of [[.025,.016,.010],[.008,.014,.009],[.020,.006,.014]]){
      const badge=mesh(new T.TorusGeometry(1,.095,8,32),silver,0,dy,.030,steering);
      badge.scale.set(w,h,.012);
    }
    function switchFace(side,name,paint){
      const x=side*.111,y=.004;
      bezel(x,y,.005,.048,.055,.009,.014,black,steering);
      const face=texturePanel(0,0,0,.038,.044,paint,144,168).face;
      face.material.alphaTest=.5;
      steering.add(face);face.position.set(x,y,.010);face.name=name;
    }
    switchFace(-1,'方向盤選單鍵',(g,w,h)=>{
      g.translate(w/2,h/2);
      g.fillStyle='#43484a';g.beginPath();g.arc(0,-9,57,0,Math.PI*2);g.fill();
      g.lineWidth=3;g.strokeStyle='#889191';g.beginPath();g.arc(0,-9,39,0,Math.PI*2);g.stroke();
      g.textAlign='center';print(g,'OK',0,-1,26,'#e1e3df',true);
      g.fillStyle='#c2c7c4';
      for(let i=0;i<4;i++){g.save();g.translate(0,-9);g.rotate(i*Math.PI/2);g.beginPath();g.moveTo(0,-52);g.lineTo(6,-45);g.lineTo(-6,-45);g.fill();g.restore();}
    });
    switchFace(1,'危險警告燈鍵',(g,w,h)=>{
      g.fillStyle='#a83f36';g.beginPath();g.roundRect(20,29,w-40,h-58,18);g.fill();
      g.strokeStyle='#f9eee4';g.lineWidth=6;g.lineJoin='round';g.beginPath();
      g.moveTo(w/2,49);g.lineTo(w-36,113);g.lineTo(36,113);g.closePath();g.stroke();
    });
    let previous='';
    function update(state){
      steering.rotation.z=-state.steer*5.2;
      const speed=Math.round(Math.abs(state.speed)*3.6),trip=(state.odometer/1000).toFixed(1);
      const power=Math.round((state.driveDemand||0)*8);
      const key=[speed,state.gear,trip,power].join('/');
      if(key===previous)return;previous=key;
      const g=cluster.context;
      g.fillStyle='#0e151a';g.fillRect(0,0,768,180);
      g.textAlign='left';print(g,'READY',18,36,23,'#81da96',true);
      print(g,'HYBRID SYSTEM',114,42,19,'#b6c9cf');print(g,'CHG',111,117,15,'#84bebc');print(g,'ECO',205,117,15,'#95cc9e');print(g,'PWR',309,117,15,'#dbc397');
      for(let i=-2;i<9;i++){
        const on=power<0?i<0&&i>=power:i>=0&&i<=power;
        g.fillStyle=on?(i<0?'#67b9bc':i<6?'#83c696':'#d5ae71'):'#344044';
        g.fillRect(123+(i+2)*20,65,16,18);
      }
      g.fillStyle='#444c4d';g.fillRect(378,18,2,133);
      print(g,state.gear,409,77,42,'#b7d7c9',true);
      g.textAlign='right';print(g,String(speed),665,110,98,'#f1f4ef');print(g,'km/h',744,109,23,'#c4cccb');
      print(g,trip+' km',741,153,23,'#abb8b8');
      cluster.tex.needsUpdate=true;
    }
    return {root,update};
  }
  return {create};
})();
