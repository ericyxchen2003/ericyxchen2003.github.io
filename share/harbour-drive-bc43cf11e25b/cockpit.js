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
    const soft = finish('#292f31'), vinyl = finish('#3d4546');
    const rubber = finish('#181e20'), trim = finish('#828984',.46,.32);
    const cloth = finish('#666d69'), red = finish('#ab3236',.37,.26);
    const ink = new T.MeshBasicMaterial({color:0x161d20});
    const gaugeGlass = new T.MeshBasicMaterial({color:0xd2d7c4});
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
    for(const [z,width,y] of [[-2.19,.75,.855],[-1.94,.81,.89],[-1.18,.84,.93],[-1.04,.81,.918]]){
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
    red.vertexColors=true;mesh(bonnet,red,0,0,0);
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
    loft([[-1.13,.80,.919,.07],[-.91,.81,.923,.105],[-.72,.80,.815,.23],
      [-.49,.78,.674,.33]],vinyl);
    // Two wipers rest at the base of the windscreen.
    for(const x of [-.46,.29]){
      bar([x+.08,.932,-1.095],[x-.08,.946,-1.045],.006,rubber);
      bar([x-.27,.947,-1.057],[x+.12,.947,-1.051],.007,rubber);
    }
    for(const x of [-.63,-.13,.68]){
      box(x,.743,-.563,.185,.077,.061,rubber);
      for(let i=0;i<4;i++)box(x,.715+i*.016,-.529,.167,.005,.008,trim);
    }
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
        g.strokeStyle=major?'#e7e3cf':'#aaa999';g.lineWidth=major?4:2;
        g.beginPath();g.moveTo(cos*(major?92:99),sin*(major?92:99));g.lineTo(cos*110,sin*110);g.stroke();
        if(major){g.font='500 18px Arial';g.fillStyle='#eae9d7';g.fillText(String(n),cos*75,sin*75);}
      }
      g.fillStyle='#d9d8c9';g.font='15px Arial';g.fillText(unit,0,52);
      const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
      const ring=mesh(new T.CircleGeometry(r*1.055,48),gaugeGlass,x,.836,-.604);
      const face=mesh(new T.CircleGeometry(r,48),new T.MeshBasicMaterial({map:tex}),x,.836,ring.position.z+.001);
      const needle=new T.Group();needle.position.set(x,.836,face.position.z+.002);cabin.add(needle);
      box(r*.40,0,0,r*.83,.0026,.001,needleRed,needle);
      mesh(new T.CircleGeometry(.006,12),rubber,0,0,.0015,needle);
      return v=>{needle.rotation.z=-angle(clamp(v,0,max));};
    }
    const speedDial=gauge(.374,.084,140,20,'km/h');
    const revDial=gauge(.218,.062,6,1,'×1000');
    // The steering axis is tilted, independent of the steering-wheel rotation.
    const column=new T.Group();column.position.set(.36,.797,-.425);column.rotation.x=-.38;cabin.add(column);
    const steering=new T.Group();column.add(steering);
    mesh(new T.TorusGeometry(.185,.0165,12,72),rubber,0,0,0,steering);
    for(const side of [-1,1])bar([side*.046,.006,0],[side*.177,.032,0],.014,soft,steering);
    bar([0,-.045,0],[0,-.175,0],.018,soft,steering);
    box(0,0,.013,.133,.085,.035,soft,steering);
    box(0,.003,.032,.049,.006,.003,trim,steering);

    // A low-resolution second camera renders an actual, laterally reversed
    // view of the road behind. Only the visible cabin mirror is refreshed.
    const rear=new T.PerspectiveCamera(31,3.2,.3,1300);
    const target=new T.WebGLRenderTarget(256,80,{depthBuffer:true});
    target.texture.colorSpace=T.SRGBColorSpace;target.texture.repeat.x=-1;target.texture.offset.x=1;
    target.texture.generateMipmaps=false;
    const mx=-.065,my=1.463,mz=-.537;
    bar([mx,1.555,-.45],[mx,my+.026,mz-.017],.007,rubber);
    const mirror=new T.Group();mirror.position.set(mx,my,mz);mirror.rotation.y=.14;cabin.add(mirror);
    box(0,0,0,.233,.070,.029,rubber,mirror);
    const face=mesh(new T.PlaneGeometry(.220,.057),
      new T.MeshBasicMaterial({map:target.texture,color:0xe2e7df,toneMapped:false}),0,0,.016,mirror);
    const mirrorPos=new T.Vector3(),eye=new T.Vector3(),forward=new T.Vector3();
    const seat=new T.Vector3(.335,1.265,.186);
    let headYaw=0,mirrorAge=Infinity;

    function update(car,state,cam,dt,glance,snap) {
      cabin.position.copy(car.position);cabin.quaternion.copy(car.quaternion);cabin.updateMatrixWorld();
      const desired=clamp(glance,-1,1)*.94;
      headYaw=snap?0:T.MathUtils.lerp(headYaw,desired,1-Math.exp(-dt*12));
      eye.copy(seat);
      // In portrait, bring the driver's eyes forward so the roof lining and
      // dashboard do not consume the extra vertical space.
      eye.z-=.205*clamp((1-cam.aspect)/.6,0,1);
      eye.applyMatrix4(cabin.matrixWorld);cam.position.copy(eye);
      forward.set(-Math.sin(headYaw),-.024,-Math.cos(headYaw)).applyQuaternion(cabin.quaternion);
      cam.lookAt(forward.add(eye));cam.updateMatrixWorld();
      steering.rotation.z=-state.steer*5.2;
      speedDial(Math.abs(state.speed)*3.6);revDial(.82+(Math.abs(state.speed)*.17)%2.5);
      mirrorAge+=dt;
      mirrorPos.setFromMatrixPosition(face.matrixWorld).project(cam);
      if((snap||mirrorAge>=.135)&&Math.abs(mirrorPos.x)<1.21&&Math.abs(mirrorPos.y)<1.16){
        rear.position.set(0,1.28,1.13).applyMatrix4(cabin.matrixWorld);
        forward.set(0,.015,1).applyQuaternion(cabin.quaternion);rear.lookAt(eye.copy(rear.position).add(forward));
        // Keep the city's static shadow pass for the main camera.
        const previous=renderer.getRenderTarget(),needsShadow=renderer.shadowMap.needsUpdate;
        renderer.shadowMap.needsUpdate=false;cabin.visible=false;
        renderer.setRenderTarget(target);renderer.render(scene,rear);renderer.setRenderTarget(previous);
        renderer.shadowMap.needsUpdate=needsShadow;cabin.visible=true;mirrorAge=0;
      }
    }
    return {cabin,update};
  }
  return {create};
})();
