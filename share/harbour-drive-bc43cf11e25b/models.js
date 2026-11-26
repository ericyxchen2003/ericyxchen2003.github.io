/* Tsim Sha Tsui landmark and vehicle meshes. Local metres, east along X, south along Z.
   Footprint coordinates and height checks: Hong Kong Lands Department CSDI Building,
   with plan orientation cross-checked against LCSD's Hong Kong Cultural Centre site map.
   All decorative geometry and vehicle liveries are original approximations. */
(function () {
  'use strict';
  const T = THREE;
  const TAU = Math.PI * 2;
  const geometries = new Map();
  const colors = new Map();
  const material = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
  // A single dimmer drives the baked window and fixture surfaces across the district.
  const nightMaterial=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,
    blending:T.AdditiveBlending,depthWrite:false,opacity:0});
  nightMaterial.visible=false;nightMaterial.forceSinglePass=true;
  // Only shared materials are registered. Tiles can unload without retaining their meshes.
  const signMaterials=new Map(),emissiveMaterials=new Map();
  let nightAmount=0,roomTexture;
  function dimmable(material,mask,strength){
    material.emissive.setHex(0xffffff);
    material.emissiveMap=mask;material.emissiveIntensity=nightAmount*strength;
    emissiveMaterials.set(material,strength);return material;
  }
  // Sixteen storeys and bays per repeat. UV (0,0) is reserved for unlit surfaces.
  function roomMask(){
    if(roomTexture)return roomTexture;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,256,256);
    let seed=52319;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const tones=['#9eaaa4','#ddc091','#8fa1a6','#c1c8ae','#c0a180'];
    for(let y=0;y<256;y+=16)for(let x=0;x<256;x+=16){
      if(random()>.44)continue;
      ctx.fillStyle=tones[Math.floor(random()*tones.length)];
      ctx.fillRect(x+2,y+3,5,8);if(random()>.18)ctx.fillRect(x+8,y+3,6,8);
    }
    ctx.fillStyle='#e0d5b5';ctx.fillRect(244,244,7,7);
    roomTexture=new T.CanvasTexture(canvas);roomTexture.wrapS=roomTexture.wrapT=T.RepeatWrapping;
    roomTexture.colorSpace=T.SRGBColorSpace;return roomTexture;
  }
  function backlitSign(source){
    if(!signMaterials.has(source))signMaterials.set(source,source.clone());
    return signMaterials.get(source);
  }
  function setNightLighting(amount){
    nightAmount=amount;
    for(const [mat,strength] of emissiveMaterials)mat.emissiveIntensity=strength*amount;
    nightMaterial.visible=amount>.002;nightMaterial.opacity=amount*.83;
    for(const mat of signMaterials.values())mat.color.setRGB(1+.65*amount,1+.51*amount,1+.30*amount);
  }
  const vehicleMaterial = material.clone();
  const unitBox = new T.BoxGeometry(1, 1, 1);
  const rotation = new T.Euler();
  const quaternion = new T.Quaternion();
  const v = new T.Vector3(), n = new T.Vector3(), size = new T.Vector3();
  const matrix = new T.Matrix4(), normalMatrix = new T.Matrix3();
  const color = (value) => {
    if (!colors.has(value)) colors.set(value, new T.Color(value));
    return colors.get(value);
  };

  // Bake individual parts into a single static, vertex-coloured draw per model.
  class Parts {
    constructor() { this.p = []; this.n = []; this.c = []; }
    get lights(){return this.nightParts??=new Parts();}
    shopWindow(f,l,r,lo,hi,depth,tint,hours){
      if(r<=l||hi<=lo)return;
      if(!this.shopParts){this.shopParts=new Parts();this.shopParts.hours=[];}
      const [x,,z]=f.at((l+r)/2,0);
      hours??=HKShopLights.hours(x,z);
      tile(this.shopParts,f,l,r,lo,hi,depth,tint);
      for(let i=0;i<6;i++)this.shopParts.hours.push(...hours);
    }
    put(x,y,z,nx,ny,nz,col) {
      this.p.push(x,y,z); this.n.push(nx,ny,nz); this.c.push(col.r,col.g,col.b);
    }
    mesh(geo,tint,x,y,z,w=1,h=1,d=1,rx=0,ry=0,rz=0) {
      const pos=geo.attributes.position, norm=geo.attributes.normal, idx=geo.index;
      quaternion.setFromEuler(rotation.set(rx,ry,rz));
      matrix.compose(v.set(x,y,z),quaternion,size.set(w,h,d));
      normalMatrix.getNormalMatrix(matrix);
      const col=color(tint), count=idx ? idx.count : pos.count;
      for(let j=0;j<count;j++){
        const i=idx ? idx.getX(j) : j;
        v.fromBufferAttribute(pos,i).applyMatrix4(matrix);
        n.fromBufferAttribute(norm,i).applyNormalMatrix(normalMatrix);
        this.put(v.x,v.y,v.z,n.x,n.y,n.z,col);
      }
    }
    box(x,y,z,w,h,d,c,ry=0,rz=0,rx=0) { this.mesh(unitBox,c,x,y,z,w,h,d,rx,ry,rz); }
    cylinder(x,y,z,top,bottom,h,c,count=16,rx=0,ry=0,rz=0) {
      const key=['c',top,bottom,h,count].join('/');
      if (!geometries.has(key)) geometries.set(key,new T.CylinderGeometry(top,bottom,h,count));
      this.mesh(geometries.get(key),c,x,y,z,1,1,1,rx,ry,rz);
    }
    dome(x,y,z,w,h,d,c,ry=0,count=36) {
      const key='d'+count;
      if (!geometries.has(key)) geometries.set(key,new T.SphereGeometry(1,count,14,0,TAU,0,Math.PI/2));
      this.mesh(geometries.get(key),c,x,y,z,w,h,d,0,ry,0);
    }
    tri(a,b,d,c) {
      const normal = new T.Triangle(new T.Vector3(...a),new T.Vector3(...b),new T.Vector3(...d)).getNormal(n);
      const col = color(c);
      for (const p of [a,b,d]) this.put(...p,normal.x,normal.y,normal.z,col);
    }
    // Vertex intensities bake a soft architectural wash onto the receiving surface.
    wash(a,b,c,d,tint,levels){
      const shade=color(tint),points=[a,b,c,d],lights=this.lights;
      for(const i of [0,1,2,0,2,3]){
        const level=levels[i];lights.p.push(...points[i]);lights.n.push(0,1,0);
        lights.c.push(shade.r*level,shade.g*level,shade.b*level);
      }
    }
    quad(a,b,c,d,tint) { this.tri(a,b,c,tint);this.tri(a,c,d,tint); }
    // A horizontal polygon, possibly concave, between two heights.
    prism(ring,low,high,tint,roof=tint) {
      const order=T.ShapeUtils.triangulateShape(ring.map(p=>new T.Vector2(...p)),[]);
      const at=(pt,y)=>[pt[0],y,pt[1]];
      for(const [a,b,c] of order) this.tri(at(ring[c],high),at(ring[b],high),at(ring[a],high),roof);
      for(let j=0;j<ring.length;j++){
        const a=ring[j], b=ring[(j+1)%ring.length];
        this.quad(at(a,low),at(b,low),at(b,high),at(a,high),tint);
      }
    }
    beam(a,b,thick,tint) {
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
      const len=Math.hypot(dx,dy,dz);
      if(len<0.001)return;
      const key='beam';
      if(!geometries.has(key))geometries.set(key,new T.CylinderGeometry(1,1,1,5));
      const axis=new T.Vector3(dx,dy,dz).normalize();
      const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis);
      const e=new T.Euler().setFromQuaternion(q);
      this.mesh(geometries.get(key),tint,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,thick,len,thick,e.x,e.y,e.z);
    }
    finish(name) {
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
      geometry.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));
      geometry.setAttribute('color',new T.Float32BufferAttribute(this.c,3));
      geometry.computeBoundingSphere();
      const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;
      if(this.shopParts){
        const display=this.shopParts.finish(name+' · 商舖');
        display.geometry.setAttribute('shopHours',new T.Float32BufferAttribute(this.shopParts.hours,2));
        display.material=HKShopLights.display;display.castShadow=display.receiveShadow=false;mesh.add(display);
      }
      if(this.nightParts?.p.length){
        const lights=this.nightParts.finish(name+' · 夜間照明');lights.material=nightMaterial;
        lights.castShadow=lights.receiveShadow=false;lights.renderOrder=-1;mesh.add(lights);
      }
      return mesh;
    }
  }

  const dark='#232f34', rubber='#232729', glass='#314c57', blueGlass='#526d75', aluminium='#b9c4bf';
  function wheel(b,side,z,radius) {
    const x = side * (radius>.45 ? 1.15 : .78);
    b.cylinder(x,radius,z,radius,radius,.24,rubber,14,0,0,Math.PI/2);
    b.cylinder(x+side*.125,radius,z,radius*.64,radius*.64,.025,'#bfc1b2',12,0,0,Math.PI/2);
    b.cylinder(x+side*.142,radius,z,radius*.31,radius*.31,.027,'#606664',10,0,0,Math.PI/2);
  }
  function cabinRing(y,halfWidth,front,rear,cut=.14) {
    return [[-halfWidth+cut,y,front],[halfWidth-cut,y,front],[halfWidth,y,front+cut],
      [halfWidth,y,rear-cut],[halfWidth-cut,y,rear],[-halfWidth+cut,y,rear],
      [-halfWidth,y,rear-cut],[-halfWidth,y,front+cut]];
  }
  function loft(b,layers,stripTints,roofTint) {
    for(let q=0;q<layers.length-1;q++){
      const a=layers[q],d=layers[q+1];
      for(let j=0;j<a.length;j++){const k=(j+1)%a.length;b.quad(a[j],a[k],d[k],d[j],stripTints[q]);}
    }
    const top=layers[layers.length-1];
    for(let i=1;i<top.length-1;i++)b.tri(top[0],top[i+1],top[i],roofTint);
  }
  const alphabet = {
    T:['111','010','010','010','010'], A:['010','101','111','101','101'],
    X:['101','101','010','101','101'], I:['111','010','010','010','111'],
    '1':['010','110','010','010','111']
  };
  function signText(b,text,x,y,z,pixel,tint) {
    let cursor=x-(text.length*4-1)*pixel/2;
    for(const ch of text){
      const lines=alphabet[ch];
      for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(lines[row][col]==='1')
        b.box(cursor+(col+.5)*pixel,y+(2-row)*pixel,z,pixel*.94,pixel*.94,.012,tint);
      cursor+=pixel*4;
    }
  }
  function saloon(b,isTaxi,paint) {
    const bright=isTaxi?'#c62c30':paint;
    loft(b,[cabinRing(.31,.79,-2.20,2.25),cabinRing(.51,.85,-2.27,2.31),
      cabinRing(.87,.86,-2.20,2.27),cabinRing(.96,.81,-1.90,1.94)],
      [dark,bright,bright],bright);
    loft(b,[cabinRing(.92,.805,-1.05,1.61),cabinRing(1.43,.685,-.49,1.10),cabinRing(1.49,.66,-.44,1.04)],
      [glass,isTaxi?'#cad0c7':bright],isTaxi?'#e2e4d8':bright);
    for(const side of [-1,1]){
      for(const frontRear of [-1.37,1.42])wheel(b,side,frontRear,.319);
      b.box(side*.85,.61,.02,.042,.055,3.56,'#d5d5ca');
      b.box(side*.78,1.17,.35,.042,.49,.083,dark,0,side*.21);
      b.box(side*.82,.86,.17,.052,.045,.105,aluminium);
      b.box(side*.82,.86,1.12,.052,.045,.105,aluminium);
      b.box(side*.93,1.005,-.78,.23,.13,.18,bright);
      b.box(side*.55,.75,-2.21,.41,.17,.065,'#fff0be');
      b.box(side*.77,.72,-2.18,.11,.13,.07,'#e7a341');
      b.box(side*.58,.74,2.28,.42,.18,.07,'#ad2725');
      b.box(side*.39,.74,2.29,.075,.13,.06,'#edb65d');
    }
    b.box(0,.69,-2.222,.52,.19,.071,dark);
    for(let q=-2;q<=2;q++)b.box(q*.09,.72,-2.265,.025,.12,.018,'#a3a9a4');
    b.box(0,.48,-2.277,.39,.125,.025,'#e2dfd3');
    b.box(0,.59,2.31,.42,.13,.025,'#ffcd56');
    if(isTaxi){
      b.box(0,1.515,.21,.57,.05,.21,'#494e4d');
      b.box(0,1.61,.21,.58,.165,.21,'#ffe7ad');
      signText(b,'TAXI',0,1.61,.095,.024,'#b9362e');
    }
  }
  function doubleDecker(b,paint,city) {
    const roof=city?'#f4c532':'#e6d9ba',body=paint||(city?'#f3bd24':'#b73b36');
    loft(b,[cabinRing(.39,1.18,-5.81,5.77,.29),cabinRing(.62,1.24,-5.89,5.85,.27),
      cabinRing(3.96,1.24,-5.84,5.8,.26),cabinRing(4.28,1.19,-5.69,5.65,.35),cabinRing(4.35,1.13,-5.60,5.56,.39)],
      [dark,body,city?'#213d67':roof,roof],roof);
    for(const side of [-1,1]){
      for(const axle of [-3.96,2.65,4.30])wheel(b,side,axle,.51);
      b.box(side*1.245,2.50,0,.045,.12,11.03,city?'#ffe175':'#e7c784');
      for(let j=0;j<8;j++){
        const z=-4.86+j*1.38;
        b.box(side*1.246,3.35,z,.046,.9,1.27, j%3===1?blueGlass:glass);
      }
      for(let j=0;j<8;j++){
        const z=-4.84+j*1.38;
        if(side===-1&&(j===0||j===4)){
          b.box(side*1.25,1.45,z,.05,1.87,1.20,dark);
          for(const k of [-.29,.29]) b.box(side*1.28,1.74,z+k,.032,1.04,.48,blueGlass);
        }else{
          b.box(side*1.246,1.78,z,.047,.85,1.23,j%3===0?blueGlass:glass);
        }
      }
      b.box(side*.91,.77,-5.85,.39,.16,.08,'#ffedbd');
      b.box(side*.95,.82,5.81,.22,.21,.07,'#b82224');
      for(let j=0;j<4;j++)b.box(side*1.249,1.03,4.93,.047,.045,.85,dark);
      if(city){
        const p=(z,y)=>[side*1.272,y,z];
        b.quad(p(-5.43,.72),p(5.45,.72),p(5.45,2.86),p(2.98,1.03),'#193c70');
        b.quad(p(2.31,1.03),p(2.98,1.03),p(5.45,2.86),p(5.45,3.33),'#c92937');
        b.box(side*1.24,3.98,0,.048,.14,10.77,'#253b62');
      }
    }
    for(const end of [-1,1]){
      const z=end*(end<0?5.84:5.8);
      b.box(0,3.35,z,1.94,1.04,.053,glass);
      b.box(0,1.73,z,1.94,.86,.06,blueGlass);
      b.box(0,1.73,z+.035*end,.062,.85,.04,dark);
    }
    b.box(0,2.52,-5.855,1.76,.40,.071,dark);
    if(!city){
      signText(b,'1A',.53,2.52,-5.903,.057,'#ffc65e');
      for(const q of [-.65,-.38,-.11])b.box(q,2.51,-5.9,.16,.063,.03,'#ffbb4e');
    }
    b.box(0,4.39,3.64,1.82,.13,2.15,'#c9bd9e');
    for(let j=0;j<9;j++)b.box(0,4.465,2.79+j*.20,1.35,.028,.042,'#a19d8e');
  }
  function citybusLettering(group){
    function panel(w,h,paint){
      const c=document.createElement('canvas');c.width=512;c.height=112;
      paint(c.getContext('2d'));
      const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
      return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,toneMapped:false}));
    }
    const brand=panel(2.48,.46,c=>{
      c.fillStyle='#efbd2d';c.fillRect(0,0,512,112);
      c.fillStyle='#19396a';c.font='italic bold 65px Arial,"PingFang HK",sans-serif';
      c.textAlign='center';c.fillText('城巴 Citybus',256,77);
      c.fillStyle='#c42e3b';c.fillRect(63,88,385,5);
    });
    for(const side of [-1,1]){
      const m=brand.clone();m.position.set(side*1.278,2.54,-1.95);m.rotation.y=side*Math.PI/2;group.add(m);
    }
    const front=panel(1.79,.40,c=>{
      c.fillStyle='#172320';c.fillRect(0,0,512,112);
      c.fillStyle='#ffbc54';c.font='bold 79px "PingFang HK",sans-serif';c.fillText('啟德',8,83);
      c.font='bold 100px Arial';c.textAlign='right';c.fillText('20A',502,94);
    });
    front.position.set(0,2.52,-5.905);front.rotation.y=Math.PI;group.add(front);
  }
  const vehicleTemplates=new Map();
  function createVehicle(kind='taxi',paint,operator) {
    if(!['bus','taxi','sedan'].includes(kind))kind='sedan';
    const city=kind==='bus'&&operator==='citybus';
    const key=kind+String(paint||'')+(city?'citybus':'');
    if(!vehicleTemplates.has(key)){
      const b=new Parts();
      if(kind==='bus')doubleDecker(b,paint,city);
      else saloon(b,kind==='taxi',paint||'#70899b');
      const mesh=b.finish(kind);mesh.material=vehicleMaterial;
      if(city)citybusLettering(mesh);
      vehicleTemplates.set(key,mesh);
    }
    const group=new T.Group();
    group.name=kind;group.add(vehicleTemplates.get(key).clone());
    if(kind==='bus')group.userData.operator=city?'citybus':'kmb';
    return group;
  }

  function faceStrip(b,a,c,y,h,depth,tint,offset=0) {
    const dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);
    if(len<.02)return;
    b.box((a[0]+c[0])/2+dz/len*offset,y,(a[1]+c[1])/2-dx/len*offset,len,h,depth,tint,-Math.atan2(dz,dx));
  }
  function eachEdge(ring,fn) {
    for(let j=0;j<ring.length;j++)fn(ring[j],ring[(j+1)%ring.length],j);
  }
  function lerp2(a,b,t) { return [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]; }
  const at=(p,y)=>[p[0],y,p[1]];

  function clockTower(b) {
    const brick='#a95643', stone='#e0d7bb', shadow='#523d35', ivory='#fbebcc';
    b.box(0,1,0,7.5,2,7.5,stone);
    b.box(0,16.5,0,7,29.5,7,brick);
    for (const s of [-1,1])for(const t of [-1,1]){
      b.lights.box(s*3.13,26.2,t*3.13,.86,8.8,.86,'#846b47');
      b.box(s*3.13,16.2,t*3.13,.85,28.4,.85,stone);
      for(let y=3;y<29;y+=1.5)b.box(s*3.14,y,t*3.14,.87,.081,.87,'#b4aa93');
    }
    for(let j=0;j<4;j++){
      const angle=j*Math.PI/2, si=Math.sin(angle),co=Math.cos(angle);
      const fac=(u,y,dist,w,h,d,shade)=>b.box(si*dist+co*u,y,co*dist-si*u,w,h,d,shade,angle);
      for(const y of [8.0,15.4,22.3]){
        fac(0,y,3.506,1.75,3.58,.11,stone);
        fac(0,y+.02,3.58,1.34,3.07,.12,shadow);
        fac(0,y+.02,3.66,.13,3.07,.045,stone);
        fac(0,y+1,3.66,1.34,.12,.045,stone);
      }
      const clockY=27.55;
      for(const [r,d,col] of [[1.87,3.51,stone],[1.70,3.56,'#374346'],[1.53,3.60,ivory]]){
        const center=[si*d,clockY,co*d];
        const geo=new T.CylinderGeometry(r,r,.075,32);
        geo.rotateX(Math.PI/2);b.mesh(geo,col,...center,1,1,1,0,angle,0);
      }
      const hand=(a,r,d,width,col,inner=0)=> {
        const point=t=>[si*d+co*Math.sin(a)*t,clockY+Math.cos(a)*t,co*d-si*Math.sin(a)*t];
        b.beam(point(inner),point(r),width,col);
      };
      for(let k=0;k<12;k++)hand(k*TAU/12,1.41,3.67,.052,'#404443',1.19);
      for(const u of [-1.48,0,1.48])fac(u,31.05,3.51,1.05,1.80,.14,shadow);
    }
    for(const [y,w,h] of [[2.42,7.35,.48],[5.4,7.2,.35],[24.4,7.22,.30],[29.93,7.45,.54],[32.5,7.82,.72]]){
      b.box(0,y,0,w,h,w,stone);
    }
    b.cylinder(0,33.55,0,3.45,3.45,1.47,brick,8,0,Math.PI/8);
    b.cylinder(0,34.49,0,3.64,3.64,.50,stone,8,0,Math.PI/8);
    b.cylinder(0,36.7,0,2.35,2.35,4.25,shadow,8,0,Math.PI/8);
    for(let i=0;i<8;i++){
      const a=(i+.5)*TAU/8;
      b.cylinder(2.95*Math.sin(a),36.73,2.95*Math.cos(a),.29,.31,4.31,stone,8);
    }
    b.cylinder(0,39.15,0,3.47,3.68,.88,stone,8,0,Math.PI/8);
    b.dome(0,39.52,0,3.36,4.16,3.36,'#b6bbb0',Math.PI/8,16);
    b.cylinder(0,44.04,0,.24,.46,1,'#9b9384',8);
    b.cylinder(0,47.72,0,.055,.135,6.56,'#525a58',8);
  }

  function spaceMuseum(b,records) {
    // 23 m is the inner projection screen. The outer shell follows the mapped 42 × 52 m footprint.
    const east=records(251661),west=records(252454),eggshell='#efecdb';
    b.prism(west,0,8.64,'#dbceaf','#c7bdab');
    eachEdge(west,(a,c)=>{
      faceStrip(b,a,c,6.35,.77,.27,'#797367');
      faceStrip(b.lights,a,c,6.45,.14,.29,'#d5b88d');
    });
    b.prism(east,0,1.9,'#8f9687','#c9c6ad');
    const centre=[0,0];
    function shellPoint(p,latitude) {
      return [centre[0]+(p[0]-centre[0])*Math.cos(latitude),1.8+23.2*Math.sin(latitude),
        centre[1]+(p[1]-centre[1])*Math.cos(latitude)];
    }
    const rings=18;
    for(let j=0;j<rings;j++){
      const lo=j*Math.PI/(2*rings),hi=(j+1)*Math.PI/(2*rings);
      eachEdge(east,(a,c,k)=>{
        b.quad(shellPoint(a,lo),shellPoint(a,hi),shellPoint(c,hi),shellPoint(c,lo),
          ['#efeada','#f4f0e2','#e8e4d6'][(k*7+j*5)%19===0?2:(j%4===0?1:0)]);
        const flood=(p,t)=>{
          const bearing=Math.atan2(p[1],p[0]);
          return (.15+.70*(.5+.5*Math.cos(8*bearing))**2)*Math.cos(t)**2+.045;
        };
        const surface=(p,t)=>{const v=shellPoint(p,t);return [v[0]*1.002,v[1]+.034,v[2]*1.002];};
        b.wash(surface(a,lo),surface(c,lo),surface(c,hi),surface(a,hi),'#b3c6cd',
          [flood(a,lo),flood(c,lo),flood(c,hi),flood(a,hi)]);
        // Concentric ceramic courses and staggered radial joints are subtle at driving distance.
        if(j%2===0&&j>0)b.beam(shellPoint(a,lo),shellPoint(c,lo),.046,'#c6c3b6');
        if(k%4===j%3&&j<15)b.beam(shellPoint(a,lo),shellPoint(a,hi),.052,'#c7c4b7');
      });
    }
    const skirt=east.map(p=>[p[0]*1.025,p[1]*1.025]);
    eachEdge(skirt,(a,c)=>b.beam(at(a,1.6),at(c,1.6),.14,eggshell));
  }

  function culturalCentre(b) {
    // Two suspended roofs meet at the shared diagonal foyer seam. Each section follows
    // the curving seaward edge of its auditorium and rises toward the outer fly tower.
    const seamBack=[47.75,-27.85],seamFront=[-10.75,21.4];
    const wings=[
      {back:[seamBack,[38.5,-38.9],[-68.7,-30.2]],
        front:[seamFront,[-14.7,18.2],[-19.9,15.2],[-25.5,12.7],[-34.5,9.8],[-66.2,1.7]],rise:23},
      {back:[seamBack,[57,-16.8],[64.2,73.2]],
        front:[seamFront,[-6.8,24.6],[-2.7,29.2],[2,35.8],[22.5,76.8]],rise:31}
    ];
    function pointAlong(path,t) {
      const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));
      let remaining=t*lengths.reduce((a,c)=>a+c,0);
      for(let i=0;i<lengths.length;i++){
        if(remaining<=lengths[i]||i===lengths.length-1)return lerp2(path[i],path[i+1],remaining/lengths[i]);
        remaining-=lengths[i];
      }
    }
    for(const wing of wings){
      function section(t){
        const back=pointAlong(wing.back,t);
        const front=pointAlong(wing.front,t);
        const height=24.7+wing.rise*t*t;
        return {a:at(front,height),b:at(back,height+.8),baseA:at(front,0),baseB:at(back,0)};
      }
      const slices=28;
      for(let j=0;j<slices;j++){
        const a=section(j/slices),c=section((j+1)/slices);
        b.quad(a.a,a.b,c.b,c.a,j%5===3?'#bf9d8d':'#c3a193');
        b.quad(a.baseA,a.a,c.a,c.baseA,j%3===1?'#d9af9c':'#d6ad99');
        b.quad(a.baseB,c.baseB,c.b,a.b,'#c8a18f');
        // Warm, overlapping uplights fade into the tiled wall. Keep the roof matte.
        for(const [start,end,insideA,insideC] of [[a.a,c.a,a.b,c.b],[a.b,c.b,a.a,c.a]]){
          const out=(p,inside,y)=>{const dx=p[0]-inside[0],dz=p[2]-inside[2],len=Math.hypot(dx,dz)||1;
            return [p[0]+dx*.045/len,y,p[2]+dz*.045/len];};
          const taper=k=>.23+.59*(.5+.5*Math.cos(k*Math.PI/3))**2;
          b.wash(out(start,insideA,.3),out(end,insideC,.3),out(end,insideC,end[1]-.3),out(start,insideA,start[1]-.3),
            '#c68e64',[taper(j),taper(j+1),.045,.045]);
        }
        b.beam(a.a,c.a,.085,'#ead1ba');
        b.lights.beam(a.a,c.a,.094,'#c9a586');
        b.beam(a.b,c.b,.081,'#cfbaa6');
        if(j%2===0)b.beam(a.a,a.b,.076,'#a58e83');
        if(j%2===1)b.beam(a.baseA,a.a,.069,'#c19b8d');
      }
      const end=section(1);
      b.quad(end.baseA,end.baseB,end.b,end.a,'#cfaa98');
      const before=section(.99),outside=(p,ref,y)=>{const dx=p[0]-ref[0],dz=p[2]-ref[2],len=Math.hypot(dx,dz)||1;return [p[0]+.055*dx/len,y,p[2]+.055*dz/len];};
      b.wash(outside(end.a,before.a,.12),outside(end.b,before.b,.12),outside(end.b,before.b,end.b[1]-.2),outside(end.a,before.a,end.a[1]-.2),
        '#bb8767',[.54,.40,.04,.07]);
      if(wing.rise>25){
        // A restrained transverse maintenance strip on the gallery roof.
        for(const t of [.69,.705,.72]){
          const s=section(t),p=lerp2([s.a[0],s.a[2]],[s.b[0],s.b[2]],.30),
            q=lerp2([s.a[0],s.a[2]],[s.b[0],s.b[2]],.68);
          b.beam(at(p,s.a[1]+.5),at(q,s.a[1]+.75),.21,'#777c79');
        }
      }
    }
    b.beam(at(seamFront,24.8),at(seamBack,25.6),.67,'#8e827b');
  }

  function museumOfArt(b,records) {
    const ring=records(193263),upper=records(173675),wall='#d7d9d2',edge='#eff0df';
    b.prism(ring,0,26.7,wall,'#aab0a8');
    eachEdge(ring,(a,c)=>{
      const len=Math.hypot(c[0]-a[0],c[1]-a[1]);
      faceStrip(b,a,c,4.4,2.95,.24,blueGlass);
      if(len<8)return;
      nightWindows(b,facadeFrame(a,c),2.96,5.83,3.45,2.87,.126,'office');
      const count=Math.ceil(len/3.45);
      // Edge normals may point either way. Symmetrical relief sits proud of the substrate.
      for(let k=0;k<count;k++){
        const p=lerp2(a,c,k/count),q=lerp2(a,c,(k+1)/count);
        const dx=(q[0]-p[0]),dz=(q[1]-p[1]),s=Math.hypot(dx,dz);
        for(let row=0;row<4;row++){
          const bottom=7+4.6*row,top=bottom+4.47;
          const mid=lerp2(p,q,.45),relief=row%2===0?.58:-.58;
          const peak=[mid[0]-dz/s*relief,(bottom+top)/2,mid[1]+dx/s*relief];
          const corners=[at(p,bottom),at(q,bottom),at(q,top),at(p,top)];
          for(let t=0;t<4;t++) b.tri(corners[t],corners[(t+1)%4],peak,
            ['#d6dad4','#e5e7df','#c0c7c3','#eff0e6'][t]);
        }
      }
      faceStrip(b,a,c,26.8,.62,.6,edge);
    });
    b.prism(upper,26.8,32.6,'#64838b','#b5c1b8');
    eachEdge(upper,(a,c)=>{
      faceStrip(b,a,c,27.15,.55,.47,edge);faceStrip(b,a,c,32.7,.50,.55,edge);
      nightWindows(b,facadeFrame(a,c),27.45,32.38,2.9,4.93,.014,'retail');
      const count=Math.floor(Math.hypot(c[0]-a[0],c[1]-a[1])/2.9);
      for(let i=1;i<=count;i++){
        const p=lerp2(a,c,i/(count+1));b.box(p[0],29.9,p[1],.22,5.4,.22,'#d5e0d9');
      }
    });
  }

  // X is measured along the facade, D toward the pavement. CSDI ring order
  // keeps the exterior on the positive-depth side of each facade.
  function facadeFrame(a,c) {
    const dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len;
    return {length:len,angle:-Math.atan2(uz,ux),
      at:(s,y,d=0)=>[a[0]+ux*s-uz*d,y,a[1]+uz*s+ux*d]};
  }
  function tile(b,f,s0,s1,y0,y1,depth,tint) {
    b.quad(f.at(s0,y0,depth),f.at(s1,y0,depth),f.at(s1,y1,depth),f.at(s0,y1,depth),tint);
  }
  const lampPalettes={
    hotel:['#f4ba7d','#c58a5d','#ffdfa0','#b49c7c','#dac3a0'],
    retail:['#edc384','#ffe3b2','#b9cbbf','#d7a66f','#e3c7a2'],
    office:['#b1c5bb','#d4cbab','#829d9f','#e0c99e','#a5af9e']
  };
  const lowerGlow=new T.Color(),upperGlow=new T.Color();
  function litPane(b,f,l,r,y0,y1,depth,tint,lower,upper){
    lowerGlow.copy(color(tint)).multiplyScalar(lower);
    upperGlow.copy(color(tint)).multiplyScalar(upper);
    const a=f.at(l,y0,depth),c=f.at(r,y0,depth),d=f.at(r,y1,depth),e=f.at(l,y1,depth);
    const nx=Math.sin(f.angle),nz=Math.cos(f.angle),lights=b.lights;
    lights.put(...a,nx,0,nz,lowerGlow);lights.put(...c,nx,0,nz,lowerGlow);lights.put(...d,nx,0,nz,upperGlow);
    lights.put(...a,nx,0,nz,lowerGlow);lights.put(...d,nx,0,nz,upperGlow);lights.put(...e,nx,0,nz,upperGlow);
  }
  function nightWindows(b,f,lo,hi,pitch,storey,depth,type,streetShops=false){
    if(f.length<1.25||hi-lo<.8)return;
    const columns=Math.max(1,Math.round(f.length/pitch)),w=f.length/columns;
    const [x,,z]=f.at(0,0),seed=Math.imul(Math.round(x*13),73856093)^Math.imul(Math.round(z*13),19349663);
    const tones=lampPalettes[type];
    for(let row=0,y=lo;y<hi-.8;row++,y+=storey){
      const height=Math.min(storey,hi-y);
      const litPercent=type==='retail'?(row===0?78:61):type==='hotel'?49:33;
      for(let j=0;j<columns;j++){
        let hash=seed^Math.imul(j+19,1597334677)^Math.imul(row+7,3812015801);
        hash=Math.imul(hash^(hash>>>16),0x45d9f3b);hash=(hash^(hash>>>16))>>>0;
        if(!(streetShops&&row===0)&&hash%100>=litPercent)continue;
        const left=(j+.10)*w,right=(j+.90)*w,mid=(left+right)/2;
        const sill=y+height*.25,head=y+height*.86,tint=tones[(hash>>>12)%tones.length];
        const strength=.42+((hash>>>20)%57)/100;
        if(streetShops&&row===0){
          b.shopWindow(f,left,right,sill,head,depth,tint);continue;
        }
        litPane(b,f,left,mid-.035,sill,head,depth,tint,strength*.41,strength);
        if((hash>>>8)%5!==0)litPane(b,f,mid+.035,right,sill,head,depth,tint,strength*.33,strength*.86);
      }
    }
  }
  function stoneWindow(b,f,s,y,w,h,variant,historic) {
    const left=s-w*.5,right=s+w*.5,low=y-h*.5,high=y+h*.5;
    tile(b,f,left-.09,right+.09,low-.10,high+.12,.098,'#7e7d71');
    tile(b,f,left,right,low,high,.113,['#556b69','#687976','#788985','#536565'][variant%4]);
    tile(b,f,left,right,y+.12,high,.12,['#99b1ad','#b9b9a3','#a8bdbc','#91a8aa'][variant%4]);
    if([0,2,3,6,9,10].includes(variant)){
      const glow=lampPalettes.hotel[variant%5],curtain=variant%3===0?w*.18:w*.03;
      litPane(b,f,left+curtain,right-.04,low+.05,high-.04,.123,glow,.48,.95);
    }
    if(variant%3===0) b.tri(f.at(left,high,.125),f.at(left+w*.47,high,.125),f.at(left,y-.47,.125),'#c9cbb8');
    tile(b,f,s-.055,s+.055,low,high,.14,'#e4e0ce');
    tile(b,f,left,right,y+.12,y+.205,.14,'#d7d8c7');
    if(historic) {
      // Light-coloured inner reveal and projecting cut-stone sill.
      tile(b,f,left-.12,left+.022,low,high,.17,'#e3dfcc');
      tile(b,f,right-.022,right+.12,low,high,.17,'#e9e2d0');
      b.box(...f.at(s,low-.08,.16),w+.38,.15,.4,'#eee4cf',f.angle);
      b.box(...f.at(s,high+.14,.13),w+.36,.16,.31,'#e6ddc7',f.angle);
    }
  }
  function entranceArch(b,f,s,w,awn) {
    const r=w/2,spring=3.46;
    tile(b,f,s-r,s+r,.12,spring,.09,'#354b49');
    tile(b,f,s-r+.30,s-.13,.30,2.8,.105,'#597270');
    tile(b,f,s+.12,s+r-.28,.30,2.8,.105,'#647d77');
    if(w>1.2){
      tile(b.lights,f,s-r+.31,s-.14,.34,2.74,.109,'#d9a466');
      tile(b.lights,f,s+.13,s+r-.29,.34,2.74,.109,'#e8b779');
    }
    for(let j=0;j<12;j++){
      const t=j*Math.PI/12,u=(j+1)*Math.PI/12;
      const p=(a,rad,d)=>f.at(s+Math.cos(a)*rad,spring+Math.sin(a)*rad,d);
      b.tri(f.at(s,spring,.09),p(t,r,.09),p(u,r,.09),'#657c75');
      b.quad(p(t,r,.17),p(t,r+.29,.17),p(u,r+.29,.17),p(u,r,.17),j%3===0?'#e3d7bd':'#f2e9d3');
      b.lights.quad(p(t,r+.025,.175),p(t,r+.22,.175),p(u,r+.22,.175),p(u,r+.025,.175),'#c49c65');
    }
    for(const k of [-1,1]){
      b.box(...f.at(s+k*(r+.14),spring/2,.12),.29,spring,.31,'#e8deca',f.angle);
      b.box(...f.at(s+k*(r+.15),spring,.17),.48,.22,.42,'#f5ebd5',f.angle);
    }
    if(awn){
      const a=s-r-.08,c=s+r+.08;
      b.quad(f.at(a,3.4,.19),f.at(c,3.4,.19),f.at(c,2.94,1.58),f.at(a,2.94,1.58),'#386451');
      b.quad(f.at(a,2.94,1.58),f.at(c,2.94,1.58),f.at(c,2.71,1.58),f.at(a,2.71,1.58),'#2a513f');
    }
  }
  function hotelForecourt(b,frame) {
    // The rear edge of the open courtyard is the mapped segment selected
    // by its endpoints, between the two projecting historic wings. The local
    // depth axis follows the entrance out toward Salisbury Road.
    const s=frame.length/2,F=(u,y,d)=>frame.at(s+u,y,d),angle=frame.angle;
    const drive=[[-17.25,.2],[17.25,.2],[17.4,23.5],[15.6,25.6],[-16.2,25.6],[-17.4,23.7]].map(
      ([u,d])=>{const p=F(u,.15,d);return [p[0],p[2]];});
    b.prism(drive,.04,.20,'#b3a690','#a49c8d');
    for(const x of [-16.55,16.55]){
      const u=F(x,.23,1),v=F(x,.23,21.5);b.beam(u,v,.13,'#d2c4a9');
    }
    for(let row=0;row<8;row++){
      const u=F(-16.9,.216,1.8+row*3.0),v=F(16.9,.216,1.8+row*3.0);
      b.beam(u,v,.027,'#918d81');
    }
    // Covered drop-off with low terrace balustrade, double columns and lamps.
    b.box(...F(0,5.68,5.10),17.6,.48,9.6,'#4c584a',angle);
    b.box(...F(0,6.05,5.10),18.0,.36,9.9,'#e9dfc6',angle);
    b.box(...F(0,6.3,5.10),17.40,.15,9.38,'#a79779',angle);
    for(const along of [-7.45,7.45])for(const d of [1.1,8.8]){
      for(const shift of [-.44,.44]){
        const p=F(along+shift,2.89,d);
        b.cylinder(...p,.24,.28,5.37,'#e1d6ba',10);
        b.box(...F(along+shift,.51,d),.74,.57,.73,'#ece1c9',angle);
        b.box(...F(along+shift,5.34,d),.74,.40,.72,'#ece1c9',angle);
      }
    }
    for(let j=0;j<23;j++) {
      const x=-8.4+j*16.8/22;
      b.cylinder(...F(x,6.76,9.86),.105,.13,.75,'#ece4ce',7);
    }
    for(const y of [6.4,7.22])b.box(...F(0,y,9.86),17.54,.16,.31,'#f6e9cd',angle);
    for(const x of [-8.3,8.3]){
      for(let j=0;j<10;j++)b.cylinder(...F(x,6.76,1+j*.91),.097,.12,.75,'#e6dbc6',7);
      b.box(...F(x,7.2,5.1),.26,.18,9.25,'#efe6cc',angle);
    }
    for(const u of [-5.3,5.3]){
      b.cylinder(...F(u,4.15,6.9),.28,.23,.4,'#e5d6a7',10);
      b.lights.cylinder(...F(u,4.15,6.9),.283,.233,.40,'#ffe6a8',10);
      b.cylinder(...F(u,4.8,6.9),.027,.027,.86,'#675f50',8);
    }
    // Fountain island and recirculating front drive, visible from the street.
    const pool=(r,h,y,col)=>b.cylinder(...F(0,y,19.7),r,r,h,col,44);
    pool(3.15,.34,.34,'#d3c5a8');pool(2.8,.16,.50,'#8caea3');
    pool(.56,.75,.89,'#d6c7a5');pool(1.10,.18,1.30,'#ddd0b4');
    pool(.20,.48,1.62,'#d4c8ae');
    for(let j=0;j<8;j++){
      const a=j*TAU/8;
      const base=F(1.65*Math.cos(a),.6,19.7+1.65*Math.sin(a));
      const crest=F(1.12*Math.cos(a),1.35,19.7+1.12*Math.sin(a));
      const top=F(.30*Math.cos(a),1.46,19.7+.30*Math.sin(a));
      b.beam(base,crest,.035,'#bad4cc');b.beam(crest,top,.035,'#d4e5dd');
    }
    for(const u of [-13.6,13.6])for(const d of [4.6,12.8]){
      b.cylinder(...F(u,.58,d),.70,.59,.72,'#c2b69c',12);
      b.dome(...F(u,.93,d),.87,1.01,.87,'#577652',0,14);
    }
    // Flags are small at scale but cast distinct silhouettes over the porte-cochère.
    for(const [j,u] of [-7.3,0,7.3].entries()){
      const start=F(u,6.65,9.3),top=F(u,11.66,10.7);
      b.beam(start,top,.055,'#a9aa91');
      const q=F(u+2.05,11.35,11.05),r=F(u+2.03,10.40,11.05),p=F(u,10.7,10.44);
      const cloth=j===1?'#c64037':j===0?'#f0e5d0':'#44684e';
      b.quad(top,q,r,p,cloth);
    }
  }

  function peninsula(b,records) {
    const podium=records(270451),tower=records(266121);
    const sandstone='#d8d3c0', limestone='#f0e8cf';
    b.prism(podium,0,36.1,sandstone,'#9b998c');
    eachEdge(podium,(a,c,j)=>{
      const f=facadeFrame(a,c);
      litPane(b,f,0,f.length,.48,12.4,.016,'#b69b76',.31,0);
      for(const [y,h,d] of [[.7,.21,.49],[5.97,.22,.51],[8.82,.46,.80],
        [10.1,.16,.51],[29.01,.26,.56],[34.7,.30,.74],[35.4,.69,.95]])
        faceStrip(b,a,c,y,h,d,limestone);
      for(const [y,depth] of [[8.70,.405],[35.53,.480]])
        tile(b.lights,f,0,f.length,y,y+.13,depth,'#d9b57d');
      const bays=Math.max(1,Math.round(f.length/3.86)),pitch=f.length/bays;
      for(let k=0;k<bays;k++){
        const at=(k+.5)*pitch;
        entranceArch(b,f,at,pitch*.66,j>=1&&j<=5&&k%2===0);
        for(let q=0;q<6;q++)stoneWindow(b,f,at,8.1+q*4.70,
          pitch*.59,q===0?2.04:2.59,(k+q*7+j+Math.floor(k/3))%13,true);
        if(k%3===0&&f.length>14){
          b.box(...f.at(k*pitch,18.35,.11),.33,23.55,.38,'#e6ddc8',f.angle);
          b.box(...f.at(k*pitch,30.16,.13),.52,.25,.44,limestone,f.angle);
        }
      }
      // The middle of the U opens onto the forecourt from this south-facing edge.
      if(j===3)hotelForecourt(b,f);
    });
    b.prism(tower,36.1,112.8,'#d8d2bb','#b0b2a3');
    eachEdge(tower,(a,c,j)=>{
      const f=facadeFrame(a,c);
      if(f.length<2)return;
      const bays=Math.max(1,Math.round(f.length/3.05)),width=f.length/bays;
      for(let k=0;k<bays;k++)for(let q=0;q<21;q++){
        const dist=(k+.5)*width;
        stoneWindow(b,f,dist,38.45+q*3.43,width*.73,2.38,(k*3+q+j)%11,false);
      }
      for(const y of [40.0,79.3,108.5,112.4])faceStrip(b,a,c,y,.68,.63,limestone);
    });
    const roof=[[ -26,-14 ],[25,-18],[26,1],[-25,5]];
    b.prism(roof,112.9,115.45,'#d0c6ab','#b9b3a0');
    for(const [x,z] of [[-12,-5.5],[12,-7.6]]){
      b.cylinder(x,115.58,z,7.75,7.75,.22,'#387b64',40);
      for(let j=0;j<40;j++){
        const p=j*TAU/40,q=(j+1)*TAU/40;
        b.beam([x+6.1*Math.cos(p),115.74,z+6.1*Math.sin(p)],[x+6.1*Math.cos(q),115.74,z+6.1*Math.sin(q)],.13,'#eadf92');
      }
      for(const u of [-1.36,1.36])b.box(x+u,115.79,z,.54,.09,4.2,'#fff0bf');
      b.box(x,115.79,z,2.72,.09,.54,'#fff0bf');
    }
  }

  function marineHeadquarters(b,records) {
    const ring=records(224804), cream='#ece3cf';
    b.prism(ring,0,10.45,'#e3d7bb','#c6b49c');
    eachEdge(ring,(a,c)=>{
      const len=Math.hypot(c[0]-a[0],c[1]-a[1]);
      if(len<4)return;
      const bays=Math.floor(len/3.55);
      for(let j=0;j<bays;j++){
        const p=lerp2(a,c,(j+.19)/bays),q=lerp2(a,c,(j+.81)/bays);
        for(const y of [2.04,6.15]){
          faceStrip(b,p,q,y,2.5,.23,'#5f746a');
          if((j+Math.round(y))%3!==0)faceStrip(b.lights,p,q,y+.12,1.94,.245,'#b59a70');
        }
      }
      for(const y of [4.0,8.48,10.4])faceStrip(b,a,c,y,.38,.55,cream);
    });
    // Tiled hip roofs over the centre and perpendicular front and rear wings.
    function hip(x,z,w,d,eaves,ridge,angle) {
      const co=Math.cos(angle),si=Math.sin(angle);
      const pt=(u,y,v)=>[x+u*co+v*si,y,z-u*si+v*co];
      const a=pt(-w/2,eaves,-d/2),c=pt(w/2,eaves,-d/2),e=pt(w/2,eaves,d/2),f=pt(-w/2,eaves,d/2);
      const p=pt(-w/2+d*.38,ridge,0),q=pt(w/2-d*.38,ridge,0);
      b.quad(a,p,q,c,'#997258');b.quad(f,e,q,p,'#ad7b60');b.tri(a,f,p,'#94664f');b.tri(c,q,e,'#ad8263');
      b.beam(p,q,.19,'#c4a186');
    }
    hip(0,-16,44,11.7,10.35,13.8,.09);
    hip(-15.1,-.2,38.5,12.6,10.38,13.85,Math.PI/2+.09);
    hip(13.9,-2.8,38.2,12.5,10.38,13.85,Math.PI/2+.09);
    hip(1.8,16.4,47.9,12.7,10.38,13.9,.09);
    const a=[-21.4,25.50],c=[25.1,21.1];
    for(let j=0;j<11;j++){
      const p=lerp2(a,c,j/10);
      b.cylinder(p[0],5,p[1],.33,.40,9.9,cream,8);
      if(j<10){
        const q=lerp2(a,c,(j+1)/10);
        for(const y of [2.2,6.8]){
          const f=step=>{
            const theta=Math.PI*step/14;
            const pt=lerp2(p,q,(1-Math.cos(theta))/2);
            return at(pt,y+1.56*Math.sin(theta));
          };
          for(let k=0;k<14;k++)b.beam(f(k),f(k+1),.22,cream);
        }
      }
    }
    for(const y of [4.65,9.9])faceStrip(b,a,c,y,.53,.7,cream);
  }
  function timeBall(b) {
    b.cylinder(0,3.24,0,2.98,3.12,6.48,'#e6ddc9',24);
    b.cylinder(0,6.45,0,3.32,3.32,.42,'#f2e6d3',24);
    b.dome(0,6.66,0,3.16,2.05,3.16,'#b7b1a2',0,28);
    b.cylinder(0,11.56,0,.073,.15,7.03,'#7c7770',10);
    b.mesh(new T.SphereGeometry(.82,18,12),'#655449',0,12.25,0);
    for(const a of [-1.45,1.39,Math.PI]){
      const f=facadeFrame([-Math.cos(a)*.72+2.99*Math.sin(a),Math.sin(a)*.72+2.99*Math.cos(a)],[Math.cos(a)*.72+2.99*Math.sin(a),-Math.sin(a)*.72+2.99*Math.cos(a)]);
      tile(b,f,0,1.44,1.22,3.23,.035,'#beaf94');tile(b,f,.12,1.32,1.35,3.11,.055,'#526958');
      tile(b.lights,f,.15,1.29,1.39,3.07,.059,'#92794f');
      for(let k=0;k<8;k++)tile(b,f,.14,1.30,1.43+k*.196,1.49+k*.196,.065,'#89947c');
    }
    b.box(0,1.58,3.03,1.19,2.66,.10,'#6e8077');
  }
  function palm(b,x,z,h,angle) {
    b.cylinder(x,h*.49,z,.15,.23,h,'#9b876d',7);
    for(let i=0;i<9;i++){
      const a=angle+i*TAU/9,dx=Math.cos(a),dz=Math.sin(a),reach=2.55+(i%3)*.46;
      const root=[x,h-.25,z],mid=[x+dx*reach*.55,h+.95,z+dz*reach*.55],tip=[x+dx*reach,h-.97,z+dz*reach];
      const l=[mid[0]-dz*.43,mid[1]-.13,mid[2]+dx*.43],r=[mid[0]+dz*.43,mid[1]-.13,mid[2]-dx*.43];
      b.tri(root,l,mid,'#56745a');b.tri(root,mid,r,'#687f5a');b.tri(l,tip,mid,'#456d55');b.tri(mid,tip,r,'#527455');
    }
  }
  function pools(b) {
    const a=[[-11,293],[10,312],[5,317],[-16,299]];
    const c=[[-17,289],[-21,294],[-42,276],[-38,270]];
    for(const p of [a,c]){
      const centre=p.reduce((sum,q)=>[sum[0]+q[0]/4,sum[1]+q[1]/4],[0,0]);
      const outline=p.map(q=>[centre[0]+(q[0]-centre[0])*1.075,centre[1]+(q[1]-centre[1])*1.11]);
      b.prism(outline,.04,.33,'#d7cdb8');
      b.prism(p,.331,.36,'#74aaa1');
    }
    for(let j=0;j<8;j++){
      const t=j/7;
      palm(b,-36+t*52,267+t*46,8.6+.4*Math.cos(j),j*.8);
    }
  }

  function ferryPier(b,records) {
    const ring=records(209714),sideEntrance=records(209715);
    const white='#dcded1',green='#3e6a58',iron='#466358',wood='#756d5d';
    // CSDI measures the upper level over the water and both finger piers as
    // a single concave outline. The space between those fingers stays open.
    b.prism(ring,-.18,.12,'#868574','#a79f8d');
    b.prism(ring,3.12,3.45,white,'#b6a897');
    b.prism(ring,6.77,7.13,'#b7c4ad','#a6aa98');
    b.prism(sideEntrance,2.95,3.38,white,'#879c80');
    eachEdge(sideEntrance,(a,c)=>{
      faceStrip(b,a,c,3.39,.20,.29,green);
      b.box(a[0],1.52,a[1],.26,3.04,.26,white);
    });
    eachEdge(ring,(a,c,j)=>{
      const f=facadeFrame(a,c);
      if(f.length<.8)return;
      const count=Math.max(1,Math.round(f.length/3.25));
      const berth=(j>=11&&j<=19)||(j>=24&&j<=31);
      const landside=j<=11||j>=32;
      faceStrip(b,a,c,6.91,.16,.44,green);
      faceStrip(b,a,c,.37,.58,.38,green);
      faceStrip(b,a,c,3.24,.43,.46,white);
      if(berth){
        faceStrip(b,a,c,-1.91,.47,.7,'#5e554a');
        faceStrip(b,a,c,-.95,.37,.7,'#5e554a');
        faceStrip(b,a,c,4.47,.10,.13,iron);
        faceStrip(b,a,c,3.83,.065,.09,iron);
      }
      for(let i=0;i<count;i++){
        const s=i*f.length/count;
        b.box(...f.at(s,3.50),.31,6.75,.41,white,f.angle);
        b.box(...f.at(s,.63),.37,1.08,.44,green,f.angle);
        if(i%2===0&&f.length>5)b.lights.box(...f.at(s+f.length/count*.5,6.70),1.45,.11,.15,'#f5dbaa',f.angle);
        if(berth){
          b.box(...f.at(s,-2.18,.20),.49,4.64,.57,wood,f.angle);
          const pitch=f.length/count;
          for(let t=1;t<4;t++)b.box(...f.at(s+t*pitch/4,3.97),.044,1.1,.09,iron,f.angle);
        }else if(landside&&f.length>7){
          const start=s+.25,stop=s+f.length/count-.20;
          tile(b,f,start,stop,3.63,6.38,.035,i%3===1?'#83928a':'#678077');
          tile(b,f,start,stop,5.5,6.38,.043,i%2===1?'#a0b0a6':'#9aaba3');
          if(i%3!==1)tile(b.lights,f,start+.06,stop-.06,3.76,6.26,.048,'#b8b995');
          b.box(...f.at((start+stop)*.5,5.02,.043),.083,2.74,.09,white,f.angle);
        }
      }
    });
    // Independent pitched sheet panels and flat, white rooftop mechanism rooms
    // reproduce the two open-sided landing galleries visible in the official photos.
    function gallery(a,c,width) {
      const f=facadeFrame(a,c),L=f.length;
      const P=(s,y,v)=>f.at(s,y,v);
      const tint='#80917e';
      for(const v of [-1,1]){
        b.quad(P(0,7.15,v*width),P(L,7.15,v*width),P(L,7.52,0),P(0,7.52,0),tint);
        for(let i=1;i<Math.floor(L/3.3);i++){
          const s=L*i/Math.floor(L/3.3);
          b.beam(P(s,7.195,v*width),P(s,7.56,0),.041,'#a5af99');
        }
        b.box(...P(L*.50,7.6,v*(width-.35)),L-.9,.082,.09,iron,f.angle);
        for(let i=0;i<=8;i++)b.box(...P(.45+(L-.9)*i/8,7.38,v*(width-.35)),.06,.4,.08,iron,f.angle);
      }
      const cabin=L*.72;
      b.box(...P(cabin,8.78,0),6.8,2.70,width*1.38,'#e0dfcf',f.angle);
      b.box(...P(cabin,10.22,0),7.3,.19,width*1.49,'#64765f',f.angle);
      for(const v of [-1,1])for(let i=0;i<3;i++)b.box(...P(cabin-1.95+1.95*i,8.84,v*(width*.69)),1.30,1.04,.12,'#70877d',f.angle);
      // Sloping boarding link visible through the lower gallery.
      for(const v of [-1,1]){
        for(const h of [.68,1.15])b.beam(P(1,1.98+h,v*1.73),P(L*.52,.36+h,v*1.73),.061,iron);
      }
      b.quad(P(1,1.98,-1.8),P(1,1.98,1.8),P(L*.52,.36,1.8),P(L*.52,.36,-1.8),'#946f59');
    }
    const local=(x,z)=>[x+133,z-247];
    gallery(local(-169.7,224.9),local(-210.1,276.2),5.46);
    gallery(local(-120.5,282),local(-157.7,330.1),5.45);
    const entrance=facadeFrame(local(-162.3,218.0),local(-119.4,266.8));
    const E=(u,y,v)=>entrance.at(u,y,v);
    const L=entrance.length;
    b.quad(E(2,3.8,-1.2),E(L-2,3.8,-1.2),E(L-2,3.57,-3.5),E(2,3.57,-3.5),'#8ba48c');
    b.quad(E(2,3.57,-3.5),E(L-2,3.57,-3.5),E(L-2,3.35,-3.5),E(2,3.35,-3.5),green);
    for(let i=0;i<12;i++){
      const u=2+i*(L-4)/11;
      b.box(...E(u,1.71,-3.1),.19,3.40,.22,green,entrance.angle);
    }
    // Facing the bus concourse: separate green entrance headers for each route.
    for(const u of [L*.24,L*.71]){
      b.box(...E(u,3.02,-3.44),8.8,.59,.24,'#29523e',entrance.angle);
      for(const k of [-2.85,0,2.85]){
        b.box(...E(u+k,1.02,-.65),.35,1.05,.88,'#8b9b89',entrance.angle);
        b.box(...E(u+k,1.61,-.65),.47,.15,.92,'#dee1cf',entrance.angle);
      }
    }
  }

  function stationEntrance(b,ring,roof){
    const trim='#c2c8c6', frame='#79858a';
    b.prism(ring,roof-.22,roof,trim,'#a7b5b7');
    const [backA,frontA,frontB,backB]=ring;
    for(const [a,c] of [[backA,frontA],[frontB,backB],[backB,backA]]){
      const f=facadeFrame(a,c),panes=Math.ceil(f.length/1.55);
      tile(b,f,0,f.length,-.20,.65,0,'#a7aca7');
      for(let i=0;i<panes;i++){
        const u=f.length*i/panes,end=f.length*(i+1)/panes;
        tile(b,f,u,end,.65,roof-.22,0,i%2?'#648083':'#739194');
        tile(b,f,u,u+.065,.63,roof-.22,.015,frame);
      }
      faceStrip(b,a,c,1.1,.07,.085,trim);
    }
    const portal=facadeFrame(frontA,frontB);
    tile(b,portal,.08,portal.length-.08,.02,roof-.68,-.18,'#344449');
    tile(b.lights,portal,.13,portal.length-.13,roof-.85,roof-.74,-.15,'#d7e7cf');
    tile(b,portal,0,portal.length,roof-.72,roof-.20,0,'#234252');
    for(const side of [.07,portal.length-.07])b.box(...portal.at(side,(roof-.69)/2),.095,roof-.69,.12,trim,portal.angle);
  }

  function landmarkSigns(mesh,land,records) {
    if(typeof document==='undefined')return;
    const textPlane=(phrase,x,y,z,width,height,angle,color,font)=>{
      const cv=document.createElement('canvas');cv.width=1024;cv.height=96;
      const ctx=cv.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=font;
      ctx.fillText(phrase,512,50,980);
      const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
      const label=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({
        map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false}));
      label.rotation.y=angle;label.position.set(x,y,z);mesh.add(label);return label;
    };
    if(land.id==='clock'){
      const cv=document.createElement('canvas');cv.width=cv.height=384;
      const c=cv.getContext('2d');c.translate(192,192);
      const rim=(r,w,color)=>{c.beginPath();c.arc(0,0,r,0,TAU);c.strokeStyle=color;c.lineWidth=w;c.stroke();};
      c.beginPath();c.arc(0,0,186,0,TAU);c.fillStyle='#f3eedc';c.fill();rim(178,11,'#424640');rim(116,4,'#505650');
      const hours=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
      c.strokeStyle='#4f554f';c.fillStyle='#393d39';c.lineWidth=3;c.font='bold 31px Georgia,serif';c.textAlign='center';c.textBaseline='middle';
      for(let k=0;k<60;k++){
        c.save();c.rotate(k*TAU/60);c.beginPath();c.moveTo(0,-171);c.lineTo(0,k%5===0?-160:-166);c.stroke();
        if(k%5===0){c.fillText(hours[k/5],0,-143,65);c.rotate(TAU/24);c.beginPath();c.moveTo(0,-116);c.lineTo(0,-170);c.stroke();}
        c.restore();
      }
      rim(14,5,'#53574e');
      const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
      const mat=new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.1}),geo=new T.PlaneGeometry(3.24,3.24);
      for(let k=0;k<4;k++){const a=k*TAU/4,face=new T.Mesh(geo,mat);face.position.set(Math.sin(a)*3.705,27.55,Math.cos(a)*3.705);face.rotation.y=a;mesh.add(face);}
      const hands=new T.InstancedMesh(unitBox,new T.MeshBasicMaterial({color:0x343733}),8);
      hands.position.y=27.55;hands.boundingSphere=new T.Sphere(new T.Vector3(),4.3);mesh.add(hands);
      const hand=new T.Object3D();let displayed=-1;
      return minutes=>{
        const m=Math.floor(minutes);if(m===displayed)return;displayed=m;
        for(let face=0;face<4;face++){
          const a=face*TAU/4;
          for(let i=0;i<2;i++){
            const angle=i?m*TAU/60:m*TAU/720,length=i?1.15:.82,offset=length*.40;
            const horizontal=Math.sin(angle)*offset,depth=i?3.77:3.74;
            hand.position.set(Math.sin(a)*depth+Math.cos(a)*horizontal,Math.cos(angle)*offset,Math.cos(a)*depth-Math.sin(a)*horizontal);
            hand.rotation.set(0,a,-angle,'YXZ');hand.scale.set(i?.075:.11,length,.024);
            hand.updateMatrix();hands.setMatrixAt(face*2+i,hand.matrix);
          }
        }
        hands.instanceMatrix.needsUpdate=true;
      };
    }else if(land.id==='peninsula'){
      const p=records(270451),f=facadeFrame(p[3],p[4]),s=f.length/2;
      const letters=textPlane('T H E   P E N I N S U L A',...f.at(s,9.16,.42),16.4,1.3,f.angle,'#ffffff','bold 84px Georgia, serif');
      const brass=color('#58462a'),gold=color('#ffe0a4');
      return (_minutes,lamps)=>letters.material.color.copy(brass).lerp(gold,lamps);
    }else if(['d1','d2','n5'].includes(land.id)){
      const p=records(land.ids[0]),front=land.id==='n5'?facadeFrame(p[2],p[3]):facadeFrame(p[1],p[2]),roof=land.id==='n5'?4.6:land.id==='d1'?3.7:4.2;
      textPlane((land.id==='n5'?'尖東   ':'尖沙咀   ')+land.id.toUpperCase(),...front.at(front.length/2,roof-.46,.025),front.length*.88,.39,front.angle,'#fcf8ea','bold 85px system-ui, sans-serif');
    }else if(land.id==='pier'){
      const f=facadeFrame([-29.3,-29],[13.6,19.8]);
      for(const [s,label] of [[f.length*.24,'往中環    CENTRAL'],[f.length*.71,'往灣仔    WAN CHAI']]){
        textPlane(label,...f.at(s,3.02,-3.58),8.2,.54,f.angle+Math.PI,'#f0ecd7','bold 80px system-ui, sans-serif');
      }
    }
  }

  const landmarks=[
    {id:'n5',n:'尖東站 N5',en:'East Tsim Sha Tsui Station N5',x:278.2,z:-114.45,ids:[212530],build:(b,r)=>{const p=r(212530);stationEntrance(b,[p[1],p[2],p[3],p[0]],4.6);}},
    {id:'d1',n:'尖沙咀站 D1',en:'Tsim Sha Tsui Station D1',x:248.2,z:-182.1,ids:[272214],build:(b,r)=>stationEntrance(b,r(272214),3.7)},
    {id:'d2',n:'尖沙咀站 D2',en:'Tsim Sha Tsui Station D2',x:274,z:-183.7,ids:[34555],build:(b,r)=>stationEntrance(b,r(34555),4.2)},
    {id:'pier',n:'尖沙咀天星碼頭',en:'Tsim Sha Tsui Star Ferry Pier',x:-133,z:247,ids:[209714,209715],build:ferryPier},
    {id:'clock',n:'尖沙咀鐘樓',en:'Tsim Sha Tsui Clock Tower',x:-47.6,z:266.6,angle:-.71,ids:[250931],build:clockTower},
    {id:'culture',n:'香港文化中心',en:'Hong Kong Cultural Centre',x:24,z:233,ids:[211378],build:culturalCentre},
    {id:'space',n:'香港太空館',en:'Hong Kong Space Museum',x:209.2,z:193,ids:[251661,252454],build:spaceMuseum},
    {id:'art',n:'香港藝術館',en:'Hong Kong Museum of Art',x:205,z:276,ids:[193263,173675],build:museumOfArt},
    {id:'peninsula',n:'香港半島酒店',en:'The Peninsula Hong Kong',x:181,z:73,ids:[270451,266121],build:peninsula},
    {id:'marine',n:'前水警總部',en:'Former Marine Police Headquarters',x:-2,z:47,ids:[224804],build:marineHeadquarters,raised:true},
    {id:'timeball',n:'前水警總部報時塔',en:'Former Marine Police Time Ball Tower',x:-22.2,z:137.1,ids:[207805],build:timeBall,raised:true}
  ];
  const replaced = new Set(landmarks.flatMap(l=>l.ids));
  function isReplacedBuilding(record) { return window.HKDetails?.replaces(record) || (!record.foundation && replaced.has(Number(record.id))); }
  function addLandmarks(scene,groundHeight=()=>0,footprints) {
    const source=footprints?.length ? footprints : window.HKMAP.buildings;
    const records=new Map(source.filter(b=>!b.foundation).map(b=>[Number(b.id),b]));
    const placed=[];
    for(const land of landmarks){
      if(!land.ids.every(id=>records.has(id)) || window.HKDetails?.replaces(records.get(land.ids[0])))continue;
      const parts=new Parts();
      const localRing=id=>records.get(id).p.map(p=>[p[0]-land.x,p[1]-land.z]);
      land.build(parts,localRing);
      const mesh=parts.finish(land.en),record=records.get(land.ids[0]);
      mesh.position.set(land.x,groundHeight(land.x,land.z)+(land.raised?(record.base||0):0),land.z);
      mesh.rotation.y=land.angle||0;
      const setTime=landmarkSigns(mesh,land,localRing);
      mesh.userData.landmark=land.id;scene.add(mesh);
      placed.push({id:land.id,n:land.n,name:land.n,en:land.en,x:land.x,z:land.z,mesh,setTime});
    }
    const park=new Parts();pools(park);
    const gardens=park.finish('Clock Tower reflecting pools and palms');
    gardens.position.y=groundHeight(-14,292);scene.add(gardens);
    return placed.concat(window.HKDetails?.build(scene,groundHeight,{Parts,facadeFrame,tile,nightWindows,backlitSign,eachEdge,lerp2}) || []);
  }
  window.HKModels={createVehicle,createPlayerTaxi:id=>(id==='hybrid'?HKComfortHybrid:HKCrownComfort).create(Parts),addLandmarks,isReplacedBuilding,setNightLighting,dimmable,roomMask,nightMaterial};
}());
