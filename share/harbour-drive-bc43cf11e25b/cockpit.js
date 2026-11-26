/* Full-size interior, in the same local coordinate system as the taxi body.
   The driver, instruments and rear-view mirror remain fixed to the vehicle. */
window.HKCockpit = (() => {
  'use strict';
  const T = THREE;
  const clamp = T.MathUtils.clamp;

  function create(renderer, scene) {
    const cabin = new T.Group();
    scene.add(cabin);
    const finish = (color, roughness=.8, metalness=0) =>
      new T.MeshStandardMaterial({color,roughness,metalness});
    const soft = finish('#30383e'), vinyl = finish('#48525a');
    const rubber = finish('#181e20'), trim = finish('#828984',.46,.32);
    const cloth = finish('#777e80'), red = finish('#bd2937',.37,.26);
    const ink = new T.MeshBasicMaterial({color:0x161d20});
    const gaugeGlass = new T.MeshBasicMaterial({color:0x929b96});
    const needleRed = new T.MeshBasicMaterial({color:0xf8884f});
    const boxGeometry = new T.BoxGeometry(1,1,1);
    function mesh(geometry,mat,x,y,z,parent=cabin) {
      const obj=new T.Mesh(geometry,mat);
      obj.position.set(x,y,z);parent.add(obj);return obj;
    }
    function box(x,y,z,w,h,d,mat,parent=cabin) {
      const obj=mesh(boxGeometry,mat,x,y,z,parent);obj.scale.set(w,h,d);return obj;
    }
    function bar(a,b,r,mat,parent=cabin) {
      const start=new T.Vector3(...a),end=new T.Vector3(...b),diff=end.clone().sub(start);
      const obj=mesh(new T.CylinderGeometry(r,r,diff.length(),10),mat,
        (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,parent);
      obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),diff.normalize());return obj;
    }
    const classic=new T.Group();classic.name='Crown Comfort · 儀表台';cabin.add(classic);
    const meterMount=new T.Group();cabin.add(meterMount);
    function groupSince(index,parent){for(const part of cabin.children.slice(index))parent.add(part);}
    // Cross sections of the dashboard, bonnet and the moulded instrument hood.
    function loft(sections,mat) {
      const positions=[],indices=[];
      for(const [z,width,y,thickness] of sections)
        positions.push(-width,y-thickness,z, width,y-thickness,z, width,y,z, -width,y,z);
      for(let i=0;i<sections.length-1;i++)for(let k=0;k<4;k++){
        const a=i*4+k,b=i*4+(k+1)%4;
        indices.push(a,b,b+4,a,b+4,a+4);
      }
      const last=positions.length/3-4;
      indices.push(0,2,1,0,3,2,last,last+1,last+2,last,last+2,last+3);
      const geom=new T.BufferGeometry();
      geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));geom.setIndex(indices);
      geom.computeVertexNormals();mat.side=T.DoubleSide;
      return mesh(geom,mat,0,0,0);
    }
    // Slight crown and stamped shoulders stop the bonnet reading as a flat plate.
    const bonnetPositions=[],bonnetColors=[],bonnetIndices=[];
    const shoulders=[-1,-.9,-.78,-.70,0,.70,.78,.9,1];
    for(const [z,width,y] of [[-2.315,.75,.81],[-1.94,.81,.875],[-1.18,.84,.916],[-1.04,.81,.918]]){
      for(const u of shoulders){
        const edge=Math.abs(u),lift=edge<.78?.018*(1-edge*edge):-.015*(edge-.78)/.22;
        bonnetPositions.push(width*u,y+lift,z);
        const light=.88+(1-edge)*.12+(edge===.78?.07:0);
        bonnetColors.push(light,light,light);
      }
    }
    for(let i=0;i<3;i++)for(let j=0;j<shoulders.length-1;j++){
      const a=i*shoulders.length+j,b=a+shoulders.length;bonnetIndices.push(a,b,a+1,a+1,b,b+1);
    }
    const bonnet=new T.BufferGeometry();
    bonnet.setAttribute('position',new T.Float32BufferAttribute(bonnetPositions,3));
    bonnet.setAttribute('color',new T.Float32BufferAttribute(bonnetColors,3));bonnet.setIndex(bonnetIndices);bonnet.computeVertexNormals();
    red.vertexColors=true;const hood=mesh(bonnet,red,0,0,0);
    for(const side of [-1,1]){
      bar([side*.802,.909,-1.125],[side*.647,1.549,-.435],.029,rubber);
      bar([side*.815,.907,-1.102],[side*.660,1.55,-.416],.028,cloth);
      bar([side*.66,1.55,-.425],[side*.71,1.555,.79],.036,cloth);
      bar([side*.79,.93,-1.11],[side*.81,.925,.56],.026,soft);
      box(side*.815,.725,-.09,.085,.34,1.57,vinyl);
    }
    loft([[-.446,.655,1.581,.034],[-.386,.674,1.592,.052],[.16,.71,1.605,.055],[1.15,.69,1.584,.055]],cloth);
    bar([-.657,1.545,-.449],[.657,1.545,-.449],.012,rubber);
    box(0,.385,-.15,1.6,.10,1.35,rubber);
    classic.add(loft([[-1.13,.80,.919,.07],[-.91,.81,.923,.105],[-.72,.80,.815,.23],
      [-.49,.78,.674,.33]],vinyl));
    // Two wipers rest at the base of the windscreen.
    for(const x of [-.46,.29]){
      bar([x+.08,.932,-1.095],[x-.08,.946,-1.045],.006,rubber);
      bar([x-.27,.947,-1.057],[x+.12,.947,-1.051],.007,rubber);
    }
    let start=cabin.children.length;
    for(const x of [-.65,.679]){
      box(x,.743,-.563,.185,.077,.061,rubber);
      for(let i=0;i<4;i++)box(x,.715+i*.016,-.529,.167,.005,.008,trim);
    }
    // The taxi equipment sits below the centre vents, left of the driver's binnacle.
    const texturePanel=(x,y,z,w,h,painter,panelWidth=512,panelHeight=192)=>{
      const cv=document.createElement('canvas');cv.width=panelWidth;cv.height=panelHeight;
      const context=cv.getContext('2d');painter(context,panelWidth,panelHeight);
      const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
      const face=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}),x,y,z);
      return {face,tex,context};
    };
    function letter(g,str,x,y,size,color,bold=false){
      g.fillStyle=color;g.font=(bold?'bold ':'')+size+'px Arial, sans-serif';g.fillText(str,x,y);
    }
    const grain=finish('#434c53',.84),edge=finish('#232c32',.77),grey=finish('#778088',.78);
    box(-.047,.795,-.662,.319,.224,.121,grain);
    texturePanel(-.047,.868,-.597,.29,.055,(g,w,h)=>{
      g.fillStyle='#272b2c';g.fillRect(0,0,w,h);
      for(const x of [4,273]){
        g.fillStyle='#767b77';g.fillRect(x,5,236,h-9);g.fillStyle='#242b2d';g.fillRect(x+4,10,228,h-19);
        for(let i=0;i<5;i++){g.fillStyle='#51595c';g.fillRect(x+8,18+i*30,215,10);}
        g.fillStyle='#959b95';g.fillRect(x+92,73,46,17);
      }
    });
    groupSince(start,classic);start=cabin.children.length;
    // A mounted meter, payment keys, radio and sprung microphone lead.
    box(-.092,.795,-.563,.228,.086,.094,edge);
    box(-.092,.841,-.568,.238,.010,.102,soft);
    const taximeter=texturePanel(-.092,.795,-.514,.219,.076,(g,w,h)=>{
      g.fillStyle='#393d3c';g.fillRect(0,0,w,h);g.fillStyle='#201f1d';g.fillRect(10,8,490,101);
      letter(g,'的 士 計 程 錶',21,42,20,'#c0b9a5',true);letter(g,'HK $',22,86,26,'#d3d0bf',true);
      letter(g,'TAXIMETER',16,130,17,'#e0d7c5');const keys=['#ad463b','#c28554','#c2bfb1','#a8aaa2','#c4c1b0'];
      keys.forEach((col,i)=>{g.fillStyle='#202727';g.fillRect(21+i*95,142,79,40);g.fillStyle=col;g.fillRect(25+i*95,145,71,26);});
    });
    let meterReading=-1;
    function meterDisplay(cents){
      if(cents===meterReading)return;meterReading=cents;
      const g=taximeter.context;g.save();g.fillStyle='#201f1d';g.fillRect(167,10,329,94);
      g.textAlign='right';g.fillStyle='#ff785e';g.font='bold 76px monospace';
      g.fillText((cents/100).toFixed(2),485,85,308);g.restore();taximeter.tex.needsUpdate=true;
    }
    groupSince(start,meterMount);start=cabin.children.length;
    const radioBody=box(-.052,.695,-.503,.253,.110,.112,edge);radioBody.rotation.x=-.16;
    const radioFace=texturePanel(-.052,.702,-.441,.240,.095,(g,w,h)=>{
      g.fillStyle='#252b2e';g.fillRect(0,0,w,h);g.fillStyle='#151d1e';g.fillRect(70,24,340,65);
      letter(g,'FM   88.1',95,73,39,'#a5b7a2');g.fillStyle='#838c8b';g.fillRect(66,113,357,7);
      for(let i=0;i<6;i++){g.fillStyle='#474e50';g.fillRect(75+i*56,138,44,36);letter(g,String(i+1),90+i*56,166,21,'#c8cac3');}
      for(const x of [29,462]){g.beginPath();g.arc(x,75,23,0,Math.PI*2);g.fillStyle='#69706e';g.fill();g.strokeStyle='#c0c2b8';g.stroke();}
    });
    radioFace.face.rotation.x=-.16;
    box(.097,.730,-.539,.043,.088,.037,edge).rotation.z=-.10;
    for(let i=0;i<5;i++)box(.098,.739+i*.008,-.517,.031,.002,.003,grey);
    const cord=[];for(let i=0;i<=48;i++){const t=i/48,a=t*Math.PI*18;cord.push(new T.Vector3(.096+.006*Math.cos(a)-t*.025,.690-t*.115,-.533+.006*Math.sin(a)));}
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cord),55,.0023,5,false),rubber,0,0,0);
    groupSince(start,classic);
    // Pivoting vacancy flag on the passenger side of the dashboard.
    box(-.373,.929,-.865,.181,.015,.079,rubber);
    const hinge=new T.Group();hinge.position.set(-.373,.935,-.863);cabin.add(hinge);
    const flagBody=box(0,.034,0,.169,.067,.018,edge,hinge);
    flagBody.rotation.x=-.10;
    const flagFace=texturePanel(-.373,.969,-.852,.163,.058,(g,w,h)=>{
      g.fillStyle='#922e32';g.fillRect(0,0,w,h);g.strokeStyle='#dcbcb0';g.lineWidth=5;g.strokeRect(8,8,w-16,h-16);
      g.textAlign='center';letter(g,'空　車',w/2,96,83,'#fff5dd',true);letter(g,'FOR HIRE',w/2,156,42,'#ffe9d2',true);
    }).face;hinge.add(flagFace);flagFace.position.set(0,.034,.011);flagFace.rotation.x=-.10;
    const sideMirrors=[];
    for(const s of [-1,1]){
      const near=s*.785;
      box(near,.695,-.105,.052,.067,.46,soft);box(s*.760,.710,-.02,.045,.039,.17,grain);
      box(near,.785,-.385,.045,.062,.145,edge);box(s*.760,.793,-.383,.014,.017,.093,trim);
      const stalk=bar([s*.77,.96,-.864],[s*.87,.99,-.842],.022,rubber);
      const mount=new T.Group();mount.position.set(s*.903,1.006,-.850);
      mount.rotation.y=s<0?.64:-.42;cabin.add(mount);
      const lens=new T.Shape();lens.moveTo(-.059,-.033);lens.quadraticCurveTo(-.068,-.030,-.068,-.019);
      lens.lineTo(-.068,.021);lens.quadraticCurveTo(-.066,.034,-.055,.034);lens.lineTo(.054,.034);
      lens.quadraticCurveTo(.067,.033,.067,.021);lens.lineTo(.065,-.021);lens.quadraticCurveTo(.064,-.033,.055,-.033);lens.closePath();
      const casing=mesh(new T.ExtrudeGeometry(lens,{depth:.053,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:3,steps:1}),soft,0,0,-.025,mount);
      casing.scale.set(1.11,1.13,1);
      const pane=new T.ShapeGeometry(lens),uv=pane.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/.136+.5,uv.getY(i)/.068+.5);
      const m=mesh(pane,new T.MeshBasicMaterial({color:0xd4dce0,toneMapped:false}),0,0,.035,mount);
      sideMirrors.push({face:m,classicFace:m,side:s,mount,stalk});
      box(s*.35,1.543,-.387,.433,.024,.114,cloth);
    }
    start=cabin.children.length;
    // The glovebox seam and passenger warning plaque run across the grey dash.
    box(-.476,.704,-.516,.389,.006,.014,edge);box(-.485,.694,-.501,.071,.015,.017,rubber);
    texturePanel(-.480,.763,-.591,.147,.048,(g,w,h)=>{
      g.fillStyle='#e3ddcb';g.fillRect(0,0,w,h);g.strokeStyle='#af554c';g.lineWidth=9;g.strokeRect(4,4,w-8,h-8);
      g.textAlign='center';letter(g,'禁止吸煙',w/2,90,62,'#783d37',true);letter(g,'NO SMOKING',w/2,151,40,'#4d4440',true);
    });

    // Instruments use printed faces and independent needles, all behind the wheel.
    const arch=[[-1,0],[-.98,.046],[-.83,.083],[-.53,.103],[0,.111],[.53,.103],[.83,.083],[.98,.046],[1,0]];
    const clusterPos=[],clusterIdx=[];
    for(const [z,y,width] of [[-.91,.843,.242],[-.82,.853,.26],[-.645,.823,.24],[-.612,.813,.231]])
      for(const [u,h] of arch)clusterPos.push(.337+u*width,y+h,z);
    for(let row=0;row<3;row++)for(let j=0;j<arch.length-1;j++){
      const a=row*arch.length+j,b=a+arch.length;clusterIdx.push(a,b,a+1,a+1,b,b+1);
    }
    const cowl=new T.BufferGeometry();cowl.setAttribute('position',new T.Float32BufferAttribute(clusterPos,3));
    cowl.setIndex(clusterIdx);cowl.computeVertexNormals();soft.side=T.DoubleSide;mesh(cowl,soft,0,0,0);
    // Recessed charcoal panel under the instrument cowl.
    const housing=new T.Shape();housing.moveTo(-.227,-.04);housing.lineTo(.227,-.04);
    for(const [u,h] of arch.slice().reverse())housing.lineTo(u*.23,h);
    housing.closePath();mesh(new T.ShapeGeometry(housing),ink,.337,.813,-.614);
    box(-.22,.694,-.51,.21,.042,.018,soft);
    box(-.22,.695,-.499,.147,.017,.003,ink);
    function gauge(x,r,max,tick,unit) {
      const cv=document.createElement('canvas');cv.width=cv.height=256;
      const g=cv.getContext('2d');g.translate(128,128);g.fillStyle='#1d2325';g.fillRect(-128,-128,256,256);
      g.textAlign='center';g.textBaseline='middle';
      const angle=value=>(139+262*value/max)*Math.PI/180;
      for(let n=0;n<=max;n+=tick/2){
        const a=angle(n),major=n%tick===0,cos=Math.cos(a),sin=Math.sin(a);
        g.strokeStyle=major?'#deded2':'#9a9e9d';g.lineWidth=major?4:2;
        g.beginPath();g.moveTo(cos*(major?92:99),sin*(major?92:99));g.lineTo(cos*110,sin*110);g.stroke();
        if(major){g.font='500 18px Arial';g.fillStyle='#eae9d7';g.fillText(String(n),cos*75,sin*75);}
      }
      g.fillStyle='#d9d8c9';g.font='15px Arial';g.fillText(unit,0,52);
      const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
      const ring=mesh(new T.CircleGeometry(r*1.026,48),gaugeGlass,x,.836,-.604);
      const face=mesh(new T.CircleGeometry(r,48),new T.MeshBasicMaterial({map:tex}),x,.836,ring.position.z+.001);
      const needle=new T.Group();needle.position.set(x,.836,face.position.z+.002);cabin.add(needle);
      box(r*.40,0,0,r*.83,.0026,.001,needleRed,needle);
      mesh(new T.CircleGeometry(.006,12),rubber,0,0,.0015,needle);
      return v=>{needle.rotation.z=-angle(clamp(v,0,max));};
    }
    const speedDial=gauge(.296,.068,180,20,'km/h');
    const revDial=gauge(.448,.061,8,1,'×1000');
    const odo=texturePanel(.308,.798,-.597,.060,.013,()=>{},192,40);
    let lastReading='';
    function tripDisplay(state){
      const reading=String(Math.floor(state.odometer/100)).padStart(6,'0');
      if(reading===lastReading)return;lastReading=reading;
      const g=odo.context;g.fillStyle='#94a18b';g.fillRect(0,0,192,40);g.textAlign='center';
      letter(g,reading.slice(0,-1)+'.'+reading.slice(-1),96,32,32,'#24352b',true);odo.tex.needsUpdate=true;
    }
    // The steering axis is tilted, independent of the steering-wheel rotation.
    const column=new T.Group();column.position.set(.36,.797,-.425);column.rotation.x=-.38;cabin.add(column);
    const steering=new T.Group();column.add(steering);
    mesh(new T.TorusGeometry(.185,.0165,12,72),rubber,0,0,0,steering);
    for(const side of [-1,1])bar([side*.046,.006,0],[side*.177,.032,0],.014,soft,steering);
    bar([0,-.045,0],[0,-.175,0],.018,soft,steering);
    const pad=new T.Shape();pad.moveTo(-.095,.035);pad.quadraticCurveTo(-.090,.062,0,.057);
    pad.quadraticCurveTo(.094,.059,.098,.030);pad.lineTo(.070,-.037);pad.quadraticCurveTo(.054,-.068,0,-.064);
    pad.quadraticCurveTo(-.055,-.063,-.071,-.037);pad.closePath();
    mesh(new T.ExtrudeGeometry(pad,{depth:.020,bevelEnabled:true,bevelSegments:3,bevelSize:.007,bevelThickness:.006,steps:1}),grain,0,0,.004,steering);
    for(const [w,h,y] of [[.021,.014,.012],[.006,.012,.012],[.016,.005,.016]]){
      const oval=mesh(new T.TorusGeometry(1,.12,6,24),trim,0,y,.036,steering);oval.scale.set(w,h,.008);
    }
    bar([.29,.77,-.48],[.205,.833,-.461],.009,rubber);
    bar([.205,.833,-.461],[.171,.872,-.48],.012,soft);
    bar([.365,.754,-.476],[.459,.805,-.473],.009,rubber);
    bar([.459,.805,-.473],[.487,.811,-.478],.012,soft);

    groupSince(start,classic);
    const hybridCabinHeight=1.095;
    let hybridCabin,hybridNose,hybridActive=false;
    function setVehicle(id){
      hybridActive=id==='hybrid';
      if(hybridActive&&!hybridCabin){
        hybridCabin=HKHybridCabin.create({mesh,box,bar,finish,texturePanel,letter});
        cabin.add(hybridCabin.root);
        hybridNose=new T.Group();hybridNose.scale.y=1/hybridCabinHeight;cabin.add(hybridNose);
        hybridNose.add(HKComfortHybrid.createBonnet());
        for(const m of sideMirrors){
          const pod=HKComfortHybrid.createFenderMirror(m.side);
          hybridNose.add(pod.root);m.hybridFace=pod.face;
          pod.face.material.color.copy(m.classicFace.material.color);
          pod.face.material.map=m.target.texture;pod.face.material.needsUpdate=true;
        }
      }
      classic.visible=!hybridActive;
      if(hybridCabin)hybridCabin.root.visible=hybridNose.visible=hybridActive;
      cabin.scale.y=hybridActive?hybridCabinHeight:1;
      hood.visible=!hybridActive;
      meterMount.position.set(hybridActive?.056:0,hybridActive?-.066:0,hybridActive?.042:0);
      for(const m of sideMirrors){
        m.stalk.visible=m.mount.visible=!hybridActive;
        m.face=hybridActive?m.hybridFace:m.classicFace;m.age=1000;
      }
    }
    // A shared budget refreshes one visible mirror at a time.
    const rear=new T.PerspectiveCamera(31,3.2,.25,HKScenery.compact?430:1050);
    const mx=-.065,my=1.463,mz=-.537;
    bar([mx,1.555,-.45],[mx,my+.026,mz-.017],.007,rubber);
    const mirror=new T.Group();mirror.position.set(mx,my,mz);mirror.rotation.y=.14;cabin.add(mirror);
    box(0,0,0,.233,.070,.029,rubber,mirror);
    const face=mesh(new T.PlaneGeometry(.220,.057),
      new T.MeshBasicMaterial({color:0xe2e7df,toneMapped:false}),0,0,.016,mirror);
    const mirrors=[{face,side:0},...sideMirrors];
    for(const m of mirrors){
      m.target=new T.WebGLRenderTarget(m.side?128:256,80,{depthBuffer:true});
      const t=m.target.texture;t.colorSpace=T.SRGBColorSpace;t.repeat.x=-1;t.offset.x=1;t.generateMipmaps=false;
      m.face.material.map=t;m.face.material.needsUpdate=true;m.age=1000;
    }
    const mirrorPos=new T.Vector3(),eye=new T.Vector3(),forward=new T.Vector3();
    const mirrorNormal=new T.Vector3(),mirrorRotation=new T.Quaternion();
    const seat=new T.Vector3(.330,1.249,.310);
    let headYaw=0,mirrorAge=Infinity;
    function resizeMirrors(ratio){
      for(const m of mirrors){
        const w=Math.round((m.side?128:256)*ratio),h=Math.round(80*ratio);
        if(m.target.width===w&&m.target.height===h)continue;
        m.target.setSize(w,h);
        m.age=1000;mirrorAge=Infinity;
      }
    }

    function update(car,state,cam,dt,glance,snap) {
      cabin.position.copy(car.position);cabin.quaternion.copy(car.quaternion);cabin.updateMatrixWorld();
      const desired=clamp(glance,-1,1)*.94;
      headYaw=snap?0:T.MathUtils.lerp(headYaw,desired,1-Math.exp(-dt*12));
      eye.copy(seat);
      if(hybridActive){eye.z+=.115;eye.y-=.017;}
      // In portrait, bring the driver's eyes forward so the roof lining and
      // dashboard do not consume the extra vertical space.
      eye.z-=.205*clamp((1-cam.aspect)/.6,0,1);
      eye.applyMatrix4(cabin.matrixWorld);cam.position.copy(eye);
      forward.set(-Math.sin(headYaw),hybridActive?-.155:-.092,-Math.cos(headYaw)).applyQuaternion(cabin.quaternion);
      cam.lookAt(forward.add(eye));cam.updateMatrixWorld();
      meterDisplay(state.taxi?.fare||0);
      const folded=state.taxi?.phase==='hired'?-1.48:0;
      hinge.rotation.x=snap?folded:T.MathUtils.lerp(hinge.rotation.x,folded,1-Math.exp(-dt*9));
      steering.rotation.z=-state.steer*5.2;
      if(hybridActive)hybridCabin.update(state);
      else{tripDisplay(state);speedDial(Math.abs(state.speed)*3.6);revDial(.82+(Math.abs(state.speed)*.17)%2.5);}
      mirrorAge+=dt;
      let next=null,best=-1;
      for(const m of mirrors){
        m.age+=dt;mirrorPos.setFromMatrixPosition(m.face.matrixWorld).project(cam);
        if(Math.abs(mirrorPos.x)>1.08||Math.abs(mirrorPos.y)>1.09||mirrorPos.z>1||mirrorPos.z< -1)continue;
        const priority=m.age/(m.side?.48:.20);
        if(priority>best){next=m;best=priority;}
      }
      if(next&&(snap||mirrorAge>=(HKScenery.compact ? .26 : .135))){
        const side=next.side;rear.aspect=side?(hybridActive?.194/.106:1.65):3.2;rear.fov=side?(hybridActive?34:42):31;rear.updateProjectionMatrix();
        if(side)rear.position.setFromMatrixPosition(next.face.matrixWorld);
        else rear.position.set(0,1.28,1.13).applyMatrix4(cabin.matrixWorld);
        if(side&&hybridActive){
          next.face.getWorldQuaternion(mirrorRotation);
          mirrorNormal.set(0,0,1).applyQuaternion(mirrorRotation);
          forward.subVectors(rear.position,eye).normalize().reflect(mirrorNormal);
        }else forward.set(side*.21,side?-.057:.015,1).applyQuaternion(cabin.quaternion);
        rear.up.set(0,1,0).applyQuaternion(cabin.quaternion);
        rear.lookAt(forward.add(rear.position));
        const previous=renderer.getRenderTarget(),needsShadow=renderer.shadowMap.needsUpdate;
        const showFlank=side&&hybridActive,wasVisible=car.visible;
        renderer.shadowMap.needsUpdate=false;cabin.visible=false;
        if(showFlank)car.visible=true;
        renderer.setRenderTarget(next.target);renderer.render(scene,rear);renderer.setRenderTarget(previous);
        car.visible=wasVisible;renderer.shadowMap.needsUpdate=needsShadow;cabin.visible=true;next.age=0;mirrorAge=0;
      }
    }
    return {cabin,update,setVehicle,resizeMirrors};
  }
  return {create};
})();
