/* Hong Kong NTP10R. Axle centres and overall length follow the 2025 catalogue. */
window.HKComfortHybrid=(()=>{
  'use strict';
  const red='#bd2536',roof='#d7dbdc',bumper='#35393c',seal='#191e22',chrome='#bdc6c9';
  const lerp=(a,b,t)=>a+(b-a)*t;
  const axles=[-1.34,1.40];
  // Curved ends pull the bumpers, glazing and lamps back around the corners.
  const bow=x=>.115*(Math.abs(x)/.84)**3;
  const front=(x,y,offset=0)=>[x,y,-2.20+bow(x)+.045*Math.max(0,(.48-y)/.22)+offset];
  const rear=(x,y,offset=0)=>[x,y,2.20-bow(x)-.032*Math.max(0,(.47-y)/.21)+offset];
  function lampPoints(side,tail=false,lit=false){
    const points=tail?[[.586,.913],[.755,.922],[.755,1.037],[.586,1.013]]:
      [[.486,.747],[.758,.753],[.783,.869],[.506,.849]];
    return points.map(([x,y])=>(tail?rear:front)(side*x,y,tail?(lit?.022:.013):(lit?-.037:-.017)));
  }
  const stations=[[-2.20,.784,.863],[-2.14,.812,.893],[-2.02,.825,.914],[-1.68,.84,.944],[-1.21,.84,.991],[-.88,.847,1.004],[1.52,.847,1.028],[1.95,.835,1.038],[2.20,.775,1.038]];
  function section(z){
    let i=1;while(i<stations.length-1&&stations[i][0]<z)i++;
    const a=stations[i-1],b=stations[i],t=(z-a[0])/(b[0]-a[0]);
    return [lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
  }
  const warp=(z,x)=>z+bow(x)*(Math.max(0,(-z-1.68)/.52)-Math.max(0,(z-1.70)/.50));
  const us=[-1,-.88,-.72,-.50,0,.50,.72,.88,1];
  const hood=(u,z)=>{
    const [w,y]=section(z),x=u*(w-.018);
    return [x,y+.034*(1-u*u)+.018*Math.exp(-((Math.abs(u)-.70)**2)/.009),warp(z,x)];
  };
  function createBonnet(){
    const zs=[-2.20,-2.02,-1.68,-1.36,-1.18],positions=[],indices=[];
    for(const z of zs)for(const u of us)positions.push(...hood(u,z));
    for(let i=1;i<zs.length;i++)for(let j=1;j<us.length;j++){
      const a=(i-1)*us.length+j-1,b=a+us.length;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const bonnet=new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({color:red,specular:0x444448,shininess:58}));
    bonnet.name='引擎蓋';return bonnet;
  }
  function createFenderMirror(side){
    const T=THREE,root=new T.Group();
    // The foot sits on the wing shoulder just ahead of the front axle.
    const base=hood(side*.963,-1.72);
    root.position.set(...base);
    root.name=side<0?'左翼子板後視鏡':'右翼子板後視鏡';
    const black=new T.MeshStandardMaterial({color:seal,roughness:.65});
    const silver=new T.MeshStandardMaterial({color:chrome,roughness:.31,metalness:.42});
    const joint=new T.Vector3(side*.070,.088,-.053);
    const foot=new T.Mesh(new T.SphereGeometry(1,16,10),black);
    foot.scale.set(.037,.019,.052);root.add(foot);
    const stalk=new T.Mesh(new T.CylinderGeometry(.025,.031,joint.length(),12),black);
    stalk.position.copy(joint).multiplyScalar(.5);
    stalk.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),joint.clone().normalize());
    root.add(stalk);
    const head=new T.Group();head.position.set(side*.083,.125,-.010);
    head.rotation.y=side<0?.09:.058;head.rotation.x=-.044;root.add(head);
    // Open-backed shell with a flat rear rim. The glass has no shell surface in front of it.
    const lens=new T.Shape();
    lens.moveTo(-.074,-.043);lens.quadraticCurveTo(-.096,-.041,-.097,-.019);
    lens.lineTo(-.097,.018);lens.quadraticCurveTo(-.095,.046,-.065,.048);
    lens.quadraticCurveTo(0,.054,.065,.048);lens.quadraticCurveTo(.095,.046,.097,.018);
    lens.lineTo(.097,-.019);lens.quadraticCurveTo(.096,-.041,.074,-.043);
    lens.quadraticCurveTo(0,-.051,-.074,-.043);
    const contour=lens.getPoints(8),rings=[[-.081,.24],[-.072,.60],[-.055,.87],[-.026,1],[.009,1],[.014,.93]];
    const positions=[],indices=[],colors=[];
    const light=new T.Color(chrome),dark=new T.Color(seal);
    for(let i=1;i<rings.length;i++){
      const [za,sa]=rings[i-1],[zb,sb]=rings[i];
      for(let j=1;j<contour.length;j++){
        const a=contour[j-1],b=contour[j],start=positions.length/3;
        const color=(a.y+b.y>-.012 && i<5)?light:dark;
        for(const [p,scale,z] of [[a,sa,za],[b,sa,za],[b,sb,zb],[a,sb,zb]]){
          positions.push(p.x*scale,p.y*scale,z);colors.push(color.r,color.g,color.b);
        }
        indices.push(start,start+1,start+2,start,start+2,start+3);
      }
    }
    const shell=new T.BufferGeometry();
    shell.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    shell.setAttribute('color',new T.Float32BufferAttribute(colors,3));shell.setIndex(indices);shell.computeVertexNormals();
    head.add(new T.Mesh(shell,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.42,metalness:.24})));
    const pane=new T.ShapeGeometry(lens),uv=pane.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/.194+.5,uv.getY(i)/.106+.48);
    const cap=new T.Mesh(pane,silver);cap.scale.set(.24,.24,1);cap.position.z=-.081;cap.rotation.y=Math.PI;head.add(cap);
    const face=new T.Mesh(pane,new T.MeshBasicMaterial({color:0xaababf,toneMapped:false}));
    face.scale.set(.945,.945,1);face.position.z=.012;face.name='外後視鏡鏡面';head.add(face);
    return {root,face};
  }
  function create(Parts){
    const car=new THREE.Group(),body=new Parts(),trim=new Parts(),glass=new Parts(),stops=new Parts();
    car.name='Comfort Hybrid · 市區混能的士';
    const marks=HKCrownComfort.markings(true);
    const sphere=new THREE.SphereGeometry(1,20,14);
    function grid(parts,us,vs,point,tint){
      for(let i=1;i<us.length;i++)for(let j=1;j<vs.length;j++){
        const u=us[i-1],v=vs[j-1],u1=us[i],v1=vs[j];
        parts.quad(point(u,v),point(u1,v),point(u1,v1),point(u,v1),tint);
      }
    }
    function outline(parts,points,radius,col,closed=true){
      for(let i=1;i<points.length;i++)parts.beam(points[i-1],points[i],radius,col);
      if(closed)parts.beam(points.at(-1),points[0],radius,col);
    }
    function surfaceFan(parts,uv,surface,col){
      const center=[0,1].map(k=>uv.reduce((sum,p)=>sum+p[k],0)/uv.length);
      const p0=surface(...center);
      uv.forEach((p,i)=>parts.tri(p0,surface(...p),surface(...uv[(i+1)%uv.length]),col));
    }
    function fan(parts,points,col){
      const center=[0,1,2].map(i=>points.reduce((sum,p)=>sum+p[i],0)/points.length);
      points.forEach((p,i)=>parts.tri(center,p,points[(i+1)%points.length],col));
    }
    // Rounded corners sampled in window space. Matching inner/outer contours
    // leave real openings through which the cabin and opposite glazing show.
    function loop(left,right,bottom,top,ru,rv){
      const result=[];
      for(const [u,v,start] of [[right-ru,bottom+rv,-90],[right-ru,top-rv,0],[left+ru,top-rv,90],[left+ru,bottom+rv,180]]){
        for(let i=0;i<=5;i++){
          const a=(start+i*18)*Math.PI/180;
          result.push([u+ru*Math.cos(a),v+rv*Math.sin(a)]);
        }
      }
      return result.flatMap((p,i)=>{
        const q=result[(i+1)%result.length],steps=i%6===5?10:1;
        return Array.from({length:steps},(_,j)=>[lerp(p[0],q[0],j/steps),lerp(p[1],q[1],j/steps)]);
      });
    }
    function windowInPanel(surface,bounds,inset,corner){
      const [l,r,b,t]=bounds,[il,ir,ib,it]=inset;
      const border=loop(l,r,b,t,0,0),rim=loop(l+il,r-ir,b+ib,t-it,...corner);
      for(let i=0;i<rim.length;i++){
        const j=(i+1)%rim.length;
        body.quad(surface(...border[i]),surface(...border[j]),surface(...rim[j]),surface(...rim[i]),roof);
      }
      const gasket=rim.map(p=>surface(...p));
      outline(trim,gasket,.010,seal);surfaceFan(glass,rim,surface,'#637e8b');
      return gasket;
    }
    const zs=new Set(stations.map(s=>s[0]));
    for(const axle of axles)for(let i=0;i<=22;i++)zs.add(axle+.355*Math.cos(Math.PI*i/22));
    const slices=[...zs].sort((a,b)=>a-b);
    function sidePoint(sign,z,row){
      const [w,top]=section(z),d=Math.min(...axles.map(ax=>Math.abs(z-ax)));
      const sill=.275+(d<.355?Math.sqrt(.355**2-d**2)+.027:0);
      const wrap=z<0?Math.min(1,Math.max(0,(-z-1.55)/.25)):Math.min(1,Math.max(0,(z-1.60)/.24));
      const cap=z<0?.74:.75;
      const shoulder=Math.max(sill+.023,lerp(sill+.024,cap,wrap));
      const widths=[w-.048,w-.017,w,w-.002,w-.014,w-.018];
      const ys=[sill,lerp(sill,shoulder,.43),shoulder,Math.max(shoulder+.023,top-.13),top-.05,top];
      return [sign*widths[row],ys[row],warp(z,w)];
    }
    for(const sign of [-1,1]){
      for(let i=1;i<slices.length;i++){
        const a=slices[i-1],b=slices[i],mid=(a+b)/2;
        for(let j=0;j<5;j++){
          const wrap=(mid<-1.55||mid>1.60)&&j<2;
          body.quad(sidePoint(sign,a,j),sidePoint(sign,b,j),sidePoint(sign,b,j+1),sidePoint(sign,a,j+1),wrap?bumper:j===0?'#862334':red);
        }
        const pa=sidePoint(sign,a,0),pb=sidePoint(sign,b,0);
        trim.quad(pa,pb,[pb[0]-sign*.12,pb[1],pb[2]],[pa[0]-sign*.12,pa[1],pa[2]],seal);
      }
      const crease=z=>{
        const [w,y]=section(z);
        return [sign*(w-.004),y-.112,warp(z,w)];
      };
      outline(trim,[-1.47,-1.21,-.88,.1,1.28,1.52,1.85].map(crease),.0045,'#9b2633',false);
      for(const axle of axles){
        const points=Array.from({length:23},(_,i)=>sidePoint(sign,axle+.355*Math.cos(Math.PI*i/22),0));
        outline(trim,points,.009,'#482a2d',false);
      }
      // The window bottoms follow the belt, while the roof pillars taper inboard.
      function side(u,v){
        const z=lerp(lerp(-1.18,2.103,u),lerp(-.52,1.92,u),v);
        const width=lerp(.827,.709,v)-.029*(Math.abs(2*u-1)**4);
        return [sign*width,lerp(1.00+.037*u,1.704+.026*Math.sin(Math.PI*u),v),z];
      }
      const panes=[[0,.39,.021,.015,.032,.079],[.39,.745,.022,.025,.043,.062],[.745,1,.022,.036,.085,.153]];
      for(const [l,r,il,ir,ib,it] of panes){
        windowInPanel(side,[l,r,0,1],[il,ir,ib,it],[.021,.074]);
        if(l<.7){
          const visor=(u,v)=>{const p=side(u,v);p[0]+=sign*.018;return p;};
          grid(trim,[l+il+.009,(l+r)/2,r-ir-.009],[.84,1-it],visor,'#2a303a');
        }
      }
      for(const [u,z] of [[.015,-1.11],[.39,.094],[.745,1.28]]){
        const p=side(u,0);
        outline(trim,[p,[sign*.847,.84,z],[sign*.847,.67,z],[sign*.833,z>1?.68:.37,z+.035]],.004,'#722331',false);
      }
      for(const z of [-.017,sign<0?.24:1.10]){
        trim.mesh(sphere,'#63232d',sign*.842,.919,z,.009,.03,.105);
        trim.mesh(sphere,chrome,sign*.852,.923,z,.018,.015,.090);
      }
      if(sign<0)trim.box(-.846,.81,1.61,.012,.017,.64,seal);
      marks.place('doors',sign*.85,.739,.56,.34,.25,sign*Math.PI/2);
      car.add(createFenderMirror(sign).root);
    }
    for(const u of [-.86,.86])outline(trim,[-2.18,-2.02,-1.7,-1.35,-1.18].map(z=>hood(u,z)),.0035,'#762632',false);
    function top(u,v){
      const w=.705-.024*(Math.abs(v*2-1)**3);
      return [u*w,1.704+.026*Math.sin(Math.PI*v)+.048*(1-u*u),lerp(-.52,1.92,v)-.049*(1-u*u)*(1-2*v)];
    }
    grid(body,us,[0,.08,.26,.5,.74,.92,1],top,roof);
    for(const u of [-.94,.94])outline(trim,[.04,.15,.4,.6,.85,.96].map(v=>top(u,v)),.006,'#8e969a',false);
    function screen(end){
      const wind=(u,v)=>{
        const upper=top(u,end);
        const lower=end?[u*.798,1.037,2.174-.071*u*u]:[u*.798,1.001,-1.26+.08*u*u];
        return lower.map((a,k)=>lerp(a,upper[k],v));
      };
      windowInPanel(wind,[-1,1,0,1],[end?.14:.052,end?.14:.052,end?.035:.031,end?.14:.070],[.066,.07]);
      return wind;
    }
    const wind=screen(0),hatch=screen(1);
    grid(body,us,[0,1],(u,v)=>v?wind(u,0):hood(u,-1.18),red);
    grid(body,us,[0,1],(u,v)=>v?hatch(u,0):rear(u*.775,1.038),red);
    for(const s of [-1,1])grid(body,[0,1],[0,.08,.26,.5,.74,.92,1],(u,v)=>{
      const p=top(s,v),w=.709-.029*Math.abs(2*v-1)**4;
      return [lerp(p[0],s*w,u),lerp(p[1],1.704+.026*Math.sin(Math.PI*v),u),p[2]];
    },roof);
    for(const start of [-.66,.19])outline(trim,[wind(start,.05),wind(start+.33,.084),wind(start+.53,.08)],.008,seal,false);
    for(const v of [.22,.34,.46,.58,.70])outline(trim,[-.72,0,.72].map(u=>hatch(u,v)),.0025,'#9b7467',false);
    outline(trim,[hatch(-.16,.86),hatch(.03,.61),hatch(.53,.61)],.010,seal,false);
    const stopAt=hatch(0,.84);trim.box(0,stopAt[1],stopAt[2]+.003,.23,.028,.017,'#7c242b');
    stops.box(0,stopAt[1],stopAt[2]+.013,.21,.017,.006,'#ff4040');
    const xs=us.map(u=>u*.784);
    grid(body,xs,[.275,.34,.48,.64,.74],front,bumper);
    grid(body,xs,[.74,.80,.865],front,red);
    grid(body,us,[0,1],(u,v)=>v?hood(u,-2.20):front(u*.784,.865),red);
    grid(body,xs,[.275,.34,.45,.56],rear,bumper);
    grid(body,xs,[.56,.65,.80,.91,1.038],rear,red);
    function fascia(surface,polygon,tint,depth=0){
      const points=polygon.map(([x,y])=>surface(x,y,depth));
      fan(trim,points,tint);return points;
    }
    const grille=fascia(front,[[-.49,.819],[-.46,.87],[.46,.87],[.49,.819],[.405,.486],[-.405,.486]],seal,-.012);
    grid(trim,[-1,-.65,-.3,0,.3,.65,1],[.51,.58,.65,.74,.82,.85],
      (u,y)=>front(u*(.40+.08*(y-.51)/.34),y,-.017),seal);
    outline(trim,grille,.013,chrome);
    for(let i=0;i<7;i++){
      const y=.524+i*.046,w=.403+i*.007;
      outline(trim,[-w,-w*.55,0,w*.55,w].map(x=>front(x,y,-.027)),i>1?.009:.005,i>1?'#acb8bb':'#575e60',false);
    }
    const badge=new THREE.TorusGeometry(1,.083,7,32);
    function emblem(z,y,scale){
      for(const [w,h,dy] of [[.062,.043,0],[.020,.04,0],[.053,.016,.016]])
        trim.mesh(badge,chrome,0,y+dy*scale,z,w*scale,h*scale,.035*scale);
    }
    emblem(-2.234,.745,1);emblem(2.215,.931,.83);
    for(const sign of [-1,1]){
      const lens=(poly,col,depth,face=front)=>fascia(face,poly.map(([x,y])=>[sign*x,y]),col,depth);
      const head=lens([[.493,.714],[.785,.731],[.795,.864],[.51,.872]],'#586268',-.010);outline(trim,head,.011,chrome);
      const lensCorners=lampPoints(sign);
      fan(trim,lensCorners,'#cbd9dc');
      const reflectors=(sign<0?lensCorners:[lensCorners[1],lensCorners[0],lensCorners[3],lensCorners[2]]).map(([x,y,z])=>[x,y,z-.003]);
      marks.placeQuad('lamp',reflectors);
      for(const x of [.555,.656,.735]){
        const [px,py,pz]=front(sign*x,.798,-.021);
        trim.mesh(sphere,'#b2c0c3',px,py,pz,.024,.028,.009);
        trim.mesh(sphere,'#eff1de',px,py,pz-.009,.013,.018,.006);
      }
      lens([[.741,.727],[.78,.732],[.782,.773],[.747,.769]],'#cb8443',-.022);
      const sideLens=[[sign*.771,.749,front(sign*.771,.749)[2]],[sign*.813,.758,-2.014],[sign*.808,.86,-2.02],[sign*.78,.863,front(sign*.78,.863)[2]]];
      fan(trim,sideLens,'#b6b8ad');
      outline(trim,[sideLens[2],sideLens[3]],.008,chrome,false);
      lens([[.599,.415],[.712,.428],[.716,.486],[.606,.483]],seal,-.008);
      lens([[.568,.737],[.771,.753],[.771,1.037],[.58,1.015]],'#782e34',.007,rear);
      fan(trim,lampPoints(sign,true),'#ba4241');
      lens([[.587,.767],[.753,.781],[.753,.867],[.587,.855]],'#d6d2b8',.014,rear);
      for(const y of [.786,.808,.832,.943,.966,.989])
        outline(trim,[.60,.68,.748].map(x=>rear(sign*x,y,.016)),.003,'#bd9791',false);
      fan(stops,lampPoints(sign,true,true),'#ff4e49');
      outline(trim,[[sign*.562,1.025],[sign*.542,.816],[sign*.49,.569],[sign*.24,.56],[0,.56]].map(([x,y])=>rear(x,y,.006)),.005,'#782a33',false);
    }
    // Lower air intake and the moulded shoulder around each bumper corner.
    const intake=[[-.35,.313],[.35,.313],[.407,.388],[-.407,.388]];
    fascia(front,intake,'#202629',-.010);
    for(const y of [.333,.357,.381])outline(trim,[-.335,-.18,0,.18,.335].map(x=>front(x,y,-.017)),.004,'#535b5d',false);
    for(const sign of [-1,1]){
      const side=[[sign*.43,.466],[sign*.56,.449],[sign*.72,.454],[sign*.761,.48]];
      outline(trim,side.map(([x,y])=>front(x,y,-.012)),.008,'#54595b',false);
    }
    marks.place('frontPlate',0,.452,-2.215,.298,.134,Math.PI);
    marks.place('rearPlate',0,.694,2.212,.282,.159);
    marks.place('seats',-.415,.684,2.199,.135,.103);marks.place('model',.40,.623,2.199,.202,.033);
    trim.box(0,.817,2.207,.49,.026,.028,chrome);
    // Painted roof lamp with eased shoulders.
    trim.mesh(sphere,seal,0,1.765,-.09,.241,.023,.113);
    trim.mesh(sphere,'#f2eee3',0,1.795,-.09,.225,.085,.105);
    for(const s of [-1,1])marks.place('roof',0,1.813,-.09+s*.109,.32,.073,s<0?Math.PI:0);
    for(const s of [-1,1]){
      trim.box(s*.79,.791,.37,.045,.323,2.83,'#3e4041');
      trim.box(s*.76,.77,.43,.058,.047,.26,'#515253');
      trim.box(s*.757,.847,.47,.02,.024,.124,chrome);
    }
    trim.box(0,.37,.08,1.48,.15,3.97,seal);
    trim.box(0,.88,-.96,1.52,.17,.43,'#393d40');
    for(const x of [-.36,.36]){
      trim.mesh(sphere,'#414347',x,.60,.05,.264,.082,.286);
      trim.mesh(sphere,'#3c3d40',x,.86,.24,.262,.31,.093,-.11);
      trim.mesh(sphere,'#4b4b50',x,1.175,.26,.118,.105,.073);
    }
    trim.box(0,.59,1.18,1.36,.12,.46,'#393b3e');
    trim.box(0,.83,1.425,1.35,.43,.12,'#414448',0,0,-.10);
    for(const x of [-.48,0,.48])trim.mesh(sphere,'#414348',x,1.115,1.46,.13,.105,.08);
    for(const s of [-1,1])outline(trim,[[s*.68,1.59,.68],[s*.66,1.45,.71],[s*.66,1.44,.83],[s*.68,1.59,.86]],.014,'#ca9d47',false);
    trim.mesh(sphere,'#52606a',.36,.93,.09,.17,.22,.11);
    trim.mesh(sphere,'#ad826a',.36,1.23,.066,.096,.12,.091);
    trim.dome(.36,1.257,.072,.10,.083,.093,'#383434');
    const glazing=glass.finish('獨立側窗及尾窗');
    const gc=glazing.geometry.attributes.color,gp=glazing.geometry.attributes.position;
    for(let i=0;i<gc.count;i++){
      const t=Math.max(0,Math.min(1,(gp.getY(i)-1.0)/.70));
      gc.setXYZ(i,.14+.21*t,.20+.24*t,.24+.28*t);
    }
    glazing.material=new THREE.MeshPhongMaterial({vertexColors:true,color:0xd4e0e5,transparent:true,opacity:.52,specular:0x94adba,shininess:72,depthWrite:false,side:THREE.DoubleSide});
    glazing.renderOrder=1;
    const brakes=stops.finish('煞車燈');brakes.visible=false;brakes.material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
    const shell=body.finish('金豐高頂滑門車身');
    shell.material=new THREE.MeshPhongMaterial({vertexColors:true,side:THREE.DoubleSide,specular:0x444448,shininess:58});
    car.add(shell,createBonnet(),trim.finish('防撞桿、燈組及內裝'),marks.finish(),glazing,brakes);
    return HKCrownComfort.fitRunningGear(Parts,car,brakes,axles,true);
  }
  return {create,lampPoints,createBonnet,createFenderMirror};
})();
