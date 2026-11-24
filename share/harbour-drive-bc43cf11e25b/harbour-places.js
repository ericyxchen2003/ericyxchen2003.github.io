// Exterior landmarks and public gardens in the local district. Coordinates use survey metres.
window.HKHarbourPlaces=(()=>{
  'use strict';
  const sites=[['regent','香港麗晶酒店',[310925,304609]],['rosewood','香港瑰麗酒店',[273388,271353]],
    ['xiqu','西九文化區戲曲中心',[205507]],['signalhill','訊號山花園訊號塔',[133366]],
    ['eastpodium','尖沙咀東海濱平台花園',[323620]],['stables','1881 Heritage 馬廄',[211592]]];
  const walks=[['stars','星光大道',485,330],['salisburygarden','梳士巴利花園',300,215],
    ['promenade','尖沙咀海濱花園',115,315],['eastwalk','尖沙咀東海濱花園長廊',885,-148]];
  const avenue=[[291,300.6],[301.3,309],[301.6,313.6],[331.7,338.6],[338,340.6],[484.8,329.5],[493.3,327.1],[573.2,233.2],[619.3,179],[627.5,166.2],[636.7,147.2],[651.9,105.6],[659.5,84.8],[662.7,76.1],[666,67.2],[674.2,44.9]];
  const rect=(x,z,w,d)=>[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];
  const solids=[{p:rect(441.9,-655.6,6.9,5.3),h:2.9},{p:rect(659.1,50,2.8,2.8),h:2.7},{p:rect(644.5,89.9,2.8,2.8),h:2.7}];
  const wave=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  // Local plateaus fall away on all sides before reaching any public carriageway.
  function groundLevel(x,z,y){
    let blend=0,target;
    if(x>465&&x<504&&z>-44&&z< -5){
      blend=1-wave((Math.hypot((x-483)/1.08,z+24.5)-5.4)/12);target=32.76;
    }else if(x>396&&x<464&&z>-701&&z< -638){
      const dx=Math.max(411-x,x-446,0),dz=Math.max(-688-z,z+651,0);
      blend=1-wave(Math.hypot(dx,dz)/11.3);target=32.64;
    }
    return blend?y+(target-y)*blend:y;
  }
  function clearPlanting(x,z){
    return (x>282&&x<325&&z>179&&z<237)||(x>407&&x<450&&z>-676&&z< -648)||(x>187&&x<201&&z>-320&&z< -285)||
      (x>676&&x<695&&z>-718&&z< -697);
  }
  function paint(c){
    c.save();
    const poly=(points,col)=>{c.beginPath();points.forEach(([x,z],i)=>i?c.lineTo(x,z):c.moveTo(x,z));c.closePath();c.fillStyle=col;c.fill();};
    const ellipse=(x,z,rx,rz,col)=>{c.beginPath();c.ellipse(x,z,rx,rz,0,0,Math.PI*2);c.fillStyle=col;c.fill();};
    const path=(pts,width,col)=>{c.beginPath();pts.forEach(([x,z],i)=>i?c.lineTo(x,z):c.moveTo(x,z));c.lineWidth=width;c.strokeStyle=col;c.stroke();};
    poly([[408,-675],[446,-675],[447.5,-666],[445.5,-654],[435,-646.5],[410,-652]],'#aaa797');
    ellipse(418.9,-662.3,8.6,8.85,'#879766');ellipse(439.4,-660.2,7.35,10.25,'#8b9a6a');
    poly([[638,-728],[679,-701],[690,-704.5],[701,-724],[687,-741],[661,-739]],'#c9b5a3');
    poly([[607,-776],[669,-755],[680,-745],[673,-735],[647,-739],[632,-747],[600,-757]],'#8c9a71');
    path([[639.8,-747.4],[644.6,-762.3],[645.5,-768.8]],3.7,'#c1b8a3');
    poly([[158,-318],[195,-322],[199,-286],[164,-282]],'#cec9b6');
    poly([[236,-687],[247,-688],[244,-666],[230,-655],[227,-657]],'#c6bda7');
    ellipse(484,-24.7,6.6,7.4,'#c4b9a6');path([[484,-24],[486,-16],[492,-13],[504,-15],[512,-23]],1.9,'#c7bcaa');
    // Main open lawn and promenades, with their museum-side access paths.
    poly([[274,171],[320,171],[339,193],[343,240],[324,244],[306,268],[282,265]],'#cec7b5');
    poly([[282,178],[317,178],[331,195],[332,227],[319,239],[285,237]],'#8d9f70');
    path([[273,244],[315,246],[335,240],[344,222]],3.3,'#c6c1b2');
    path([[-53,294],[-20,316],[3,323],[46,321],[106,317],[185,311],[268,306],[291,300.6]],5.1,'#c7c1b4');
    c.restore();
  }
  function build(id,{b,frame,edges,ring,low,top,shell,tile,sign,ground,nightWindows}){
    const white='#eee9da',bronze='#998570',glass='#58747a',green='#758c67',wood='#a38a65';
    const box=(f,x,y,d,w,h,v,col)=>b.box(...f.at(x,y,d),w,h,v,col,f.angle);
    const face=(f,l,r,y,h,d,col)=>tile(b,f,l,r,y,h,d,col);

    function bench(x,z,y,angle,w=2.5){
      b.box(x,y+.47,z,w,.14,.54,wood,angle);
      for(const side of [-1,1])b.box(x+Math.cos(angle)*w*.33*side,y+.22,z-Math.sin(angle)*w*.33*side,.14,.45,.40,'#65726e',angle);
      b.box(x+Math.sin(angle)*.22,y+.78,z+Math.cos(angle)*.22,w,.31,.08,wood,angle);
    }
    function beds(p,y){
      b.prism(p,y,y+.35,'#bdb8a8','#82936c');
    }
    function regent(){
      for(const key of [310925,304609]){
        const p=ring(key),lo=low(key),hi=top(key);shell(key,'#a9b4ad','#b4b8ac');
        edges(p,(a,c)=>{const f=frame(a,c),L=f.length;
          if(L<.8)return;
          const base=key===310925?lo+6.45:lo+.22,pitch=3.35;
          face(f,0,L,lo+.27,hi-.10,.04,'#415b63');
          nightWindows(b,f,base,hi-.25,3.55,pitch,.047,'hotel');
          if(key===310925){
            face(f,0,L,lo+1.0,lo+5.45,.074,'#678b89');
            nightWindows(b,f,lo+1,lo+5.45,3.4,4.45,.080,'retail');
            for(let u=.31;u<L;u+=3.40)box(f,u,lo+3.12,.095,.23,5.73,.30,'#b9bbb1');
          }
          for(let y=base;y<hi-1;y+=pitch){
            face(f,0,L,y,Math.min(hi-.25,y+.98),.09,'#d0d1c5');
            box(f,L/2,y+.18,.10,L,.15,.29,'#e1e1d4');
            if(L>3)for(let k=1;k<Math.ceil(L/3.55);k++){
              const u=k*L/Math.ceil(L/3.55);face(f,u-.045,u+.045,y+1.0,Math.min(hi-.1,y+pitch),.077,'#7c9192');
            }
          }
          box(f,L/2,hi-.2,.10,L,.32,.31,white);
        });
      }
      // Water and a stone rim on the podium terrace behind the harbour-facing wing.
      const y=top(310925),p=[[424,247],[450,245],[451,252],[426,255]];
      b.prism(p,y+.05,y+.35,'#c9c7b4','#81b5b4');
      for(let k=0;k<7;k++)b.box(426+k*3.05,y+.36,244.4-k*.18,1.04,.24,1.92,'#ddd6c3',-.09);
      const f=frame(ring(304609)[9],ring(304609)[0]);sign(f,f.length*.50,top(304609)-1.75,.15,9.6,1.13,'REGENT','HONG KONG','#566565');
    }
    function rosewood(){
      const tower=271353,base=273388;
      shell(base,'#9e9383','#9da28b');
      edges(ring(base),(a,c)=>{const f=frame(a,c),L=f.length;if(L<1)return;
        face(f,0,L,low(base)+.38,top(base)-.30,.03,'#597678');
        nightWindows(b,f,low(base)+.38,top(base)-.30,3.96,4.6,.038,'retail');
        for(let y=low(base)+4.6;y<top(base);y+=4.60)box(f,L/2,y,.10,L,.43,.49,bronze);
        for(let u=.5;u<L;u+=3.96)box(f,u,(low(base)+top(base))/2,.10,.24,top(base)-low(base),.38,'#b1a38d');
      });
      const outline=ring(tower),bottom=low(tower),crown=top(tower);
      const levels=[[bottom,1,1],[bottom+60,.99,.945],[bottom+124,.928,.895],[crown-30,.88,.82],[crown,0,0]];
      for(let k=0;k<levels.length-1;k++){
        const [lo,sx,sz]=levels[k],hi=levels[k+1][0];
        const p=outline.map(([x,z])=>[586+(x-586)*sx,110+(z-110)*sz]);
        b.prism(p,lo,hi,'#607880','#baae96');
        edges(p,(a,c,i)=>{const f=frame(a,c),L=f.length;if(L<1)return;
        const n=Math.max(1,Math.round(L/2.34));
        nightWindows(b,f,lo+.22,hi-1.8,2.34,3.77,.063,'hotel');
        for(let j=0;j<n;j++){
          const l=L*j/n,r=L*(j+1)/n;
          face(f,l+.03,r-.03,lo+.22,hi-.28,.055,['#536e77','#627e84','#6d8586'][(i+j)%3]);
          box(f,l+.07,(lo+hi)*.5,.10,.14,hi-lo-.34,.36,'#ab9781');
        }
        for(let y=lo+3.45;y<hi-.4;y+=3.77)face(f,0,L,y,y+.14,.083,'#465960');
        box(f,L/2,hi-1.8,.12,L,1.16,.44,'#9f917e');
        for(let j=0;j<Math.ceil(L/13);j++)box(f,L*j/Math.ceil(L/13)+.18,(lo+hi)*.5,.20,.34,hi-lo,.67,'#c1b39e');
        box(f,L/2,hi-.56,.07,L,1.02,.51,'#baa991');
      });
      }
    }
    function xiqu(){
      const key=205507,p=ring(key),y=low(key),h=top(key),cx=-288.7,cz=-682.5;
      const inset=(sx,sz)=>p.map(([x,z])=>[cx+(x-cx)*sx,cz+(z-cz)*sz]);
      // The auditorium hangs above the public plaza. Four curtain openings
      // share the same continuous screen, including around the rounded corners.
      // Tie the plaza to the pavement at all four entries. The edge follows the
      // terrain between survey vertices; the raised inner floor stays level.
      const inner=inset(.94,.94);
      let plaza=y+.18;
      edges(inner,(a,c)=>{
        const n=Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/3);
        for(let j=0;j<n;j++){
          const ex=a[0]+(c[0]-a[0])*j/n-cx,ez=a[1]+(c[1]-a[1])*j/n-cz;
          for(let k=0;k<=16;k++)plaza=Math.max(plaza,ground(cx+ex*k/16,cz+ez*k/16)+.035);
        }
      });
      b.prism(inner,plaza-.12,plaza,'#c4bfb1','#e4dfd3');
      edges(p,(a,c,i)=>{
        const end=(i+1)%p.length,n=Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/2);
        function edgePoint(t,outer){
          const left=outer?a:inner[i],right=outer?c:inner[end];
          const x=left[0]+t*(right[0]-left[0]),z=left[1]+t*(right[1]-left[1]);
          return [x,outer?ground(x,z)+.045:plaza,z];
        }
        for(let j=0;j<n;j++){
          const A=edgePoint(j/n,true),B=edgePoint((j+1)/n,true);
          b.quad(A,B,edgePoint((j+1)/n,false),edgePoint(j/n,false),'#d9d7cc');
          b.quad([A[0],A[1]-.55,A[2]],[B[0],B[1]-.55,B[2]],B,A,'#bdb8aa');
        }
      });
      // The side wings contain retail, stairs and galleries. Their occupied
      // ends behind each curtain give the portal a reveal and a visible back.
      const galleries=[{i:4,depth:8.2},{i:8,depth:9.0},{i:15,depth:11.5},{i:21,depth:10.7}];
      for(const {i,depth} of galleries){
        const f=frame(p[i],p[(i+1)%p.length]),L=f.length,margin=Math.min(6.0,L*.13);
        // Splay the gallery ends away from the corner axis. A visitor in the
        // doorway can see both the theatre soffit and the public stage.
        const front=-1.1,back=front-depth;
        const profile=[];
        for(let j=0;j<=8;j++){
          const t=j/8,angle=t*Math.PI/2;
          profile.push([margin+9.6*(1-Math.cos(angle)),front-depth*Math.sin(angle)]);
        }
        profile.push(...[...profile].reverse().map(([u,d])=>[L-u,d]));
        const outline=profile.map(([u,d])=>{const xyz=f.at(u,0,d);return [xyz[0],xyz[2]];});
        b.prism(outline,plaza-.11,y+26.85,'#c9c9c0','#d5d6cd');
        const faceOf=(j,t)=>{
          const a=profile[j],c=profile[j+1];
          return [a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t];
        };
        for(let j=0;j<profile.length-1;j++){
          const a=faceOf(j,0),c=faceOf(j,1),dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);
          const nx=dz/len,nz=-dx/len,at=(t,v,d)=>{const q=faceOf(j,t);return f.at(q[0]+nx*d,v,q[1]+nz*d);};
          for(const floor of [plaza,y+6.0]){
            const hi=floor+4.0,count=Math.max(1,Math.round(len/2.7));
            for(let k=0;k<count;k++){
              const l=(k+.018)/count,r=(k+.982)/count,tint=['#717c76','#887e6a','#607574','#a1947e'][(i+j+k)%4];
              b.quad(at(l,floor+.19,.03),at(r,floor+.19,.03),at(r,hi,.03),at(l,hi,.03),tint);
              if((i+j+k)%4!==0)b.lights.quad(at(l,floor+.35,.037),at(r,floor+.35,.037),at(r,hi-.12,.037),at(l,hi-.12,.037),'#c5a079');
              b.quad(at(l,hi-.66,.045),at(r,hi-.66,.045),at(r,hi-.58,.045),at(l,hi-.58,.045),'#b5b2a2');
            }
          }
          for(const floor of [y+5.7,y+11.8,y+17.7]){
            // Continuous pale balcony fronts curve around each enclosed wing.
            const d=j===8?1.3:.62;
            const landing=i===4 && j===8 && floor===y+5.7;
            const bays=landing?[[0,(21.4-2.4-a[0])/dx],[(21.4+2.4-a[0])/dx,1]]:[[0,1]];
            for(const [start,end] of bays){
              b.quad(at(start,floor-.34,d),at(end,floor-.34,d),at(end,floor+.72,d),at(start,floor+.72,d),'#e1e0d6');
              b.quad(at(start,floor+.72,d),at(end,floor+.72,d),at(end,floor+.72,0),at(start,floor+.72,0),'#eeebdf');
              b.beam(at(start,floor+.95,d),at(end,floor+.95,d),.032,'#a4aaa6');
            }
          }
        }
      }
      // Build the light stone podium from nested curved treads. The wider
      // seating steps bow into the atrium, leaving paths beside the shops.
      const podium=(rad)=>Array.from({length:64},(_,i)=>{
        const a=i*2*Math.PI/64,t=Math.cos(a),v=Math.sin(a);
        return [cx-1.5+(13.7+rad)*t+2.3*v*v,cz+.8+(9.4+rad)*v-1.8*t*v];
      });
      for(let j=0;j<5;j++){
        const bot=plaza+j*.19;
        b.prism(podium(3.0-j*.75),bot,bot+.19,'#bdbbb3',j===4?'#ebe8df':'#d8d5cb');
      }
      // Flush curved paving inlays lead from the entrance towards the stage.
      for(const radius of [4.5,6.25]){
        const a=podium(radius),c=podium(radius+.13);
        for(let j=0;j<a.length;j++){
          const k=(j+1)%a.length,pt=p=>[p[0],plaza+.018,p[1]];
          b.quad(pt(a[j]),pt(a[k]),pt(c[k]),pt(c[j]),'#b6b6ac');
        }
      }
      const south=frame(p[4],p[5]),landing=south.at(21.4,y+5.72,-10.6);
      const escalator=frame([-311,-670],[landing[0],landing[2]]),run=escalator.length,climb=landing[1]-plaza;
      box(south,21.4,landing[1]-.14,-10.2,5.6,.28,3.3,'#d4d5cb');
      for(const side of [-1,1]){
        const d=.87*side;
        for(let j=0;j<33;j++){
          const t=(j+.5)/33;
          box(escalator,t*run,plaza+climb*t+.09,d,run/33+.02,.24,1.55,'#888f88');
        }
        const underside=(u,v)=>escalator.at(u,plaza+climb*u/run-.22,v);
        b.quad(underside(0,d-.8),underside(0,d+.8),underside(run,d+.8),underside(run,d-.8),'#a6aca6');
        for(const e of [d-.8,d+.8]){
          const left=escalator.at(0,plaza+.18,e),right=escalator.at(run,plaza+climb+.18,e);
          b.quad(left,right,escalator.at(run,plaza+climb+.98,e),escalator.at(0,plaza+.98,e),'#b3c1bb');
          b.beam(escalator.at(0,plaza+1.02,e),escalator.at(run,plaza+climb+1.02,e),.055,'#5a625c');
        }
      }
      for(const [dx,dz] of [[-5,-3.0],[.5,-5.2],[5.6,-3.2]]){
        const x=cx+dx,z=cz+dz,y0=plaza+.95;
        b.box(x,y0+.18,z,1.85,.36,1.85,'#b7afa0');
        b.box(x,y0+.37,z,1.57,.06,1.57,'#807460');
        b.cylinder(x,y0+1.58,z,.10,.13,2.62,'#867762',8);
        b.dome(x,y0+2.15,z,1.28,1.23,1.23,'#809377',.2,12);
        b.dome(x+.37,y0+2.67,z-.21,1.0,.92,1.02,'#91a183',.5,12);
      }
      const north=frame(p[15],p[16]),ac=north.at(31,0,-14.7),bc=north.at(20,0,-14.7);
      const counter=frame([ac[0],ac[2]],[bc[0],bc[2]]);
      box(counter,5.5,plaza+1.17,0,10.9,2.34,2.5,'#938776');
      box(counter,5.5,plaza+2.38,0,11.3,.20,2.85,'#e3dbcb');
      box(counter,5.5,plaza+3.16,-1.06,11,1.24,.16,'#706d61');
      sign(counter,5.5,plaza+3.17,-.94,6.0,.81,'票務處','TICKETS','#605f56');
      const upper=inset(.86,.82),ceiling=y+27.05;
      b.prism(upper,ceiling,y+43.1,'#bcbdb5','#b5b4a7');
      const cap=THREE.ShapeUtils.triangulateShape(upper.map(p=>new THREE.Vector2(...p)),[]);
      for(const [a,c,e] of cap)b.tri(...[a,c,e].map(k=>[upper[k][0],ceiling,upper[k][1]]),'#b1b4ab');
      // The underside of the suspended theatre sweeps up towards the central
      // eye. Each concentric metal fin has a dark reveal seen from street level.
      const canopy=(radius,a,lip=0)=>{
        const r=radius,x=cx+1.8*(1-r)+(28.2*r)*Math.cos(a),z=cz-1.8*(1-r)+22.2*r*Math.sin(a);
        return [x,ceiling-.24-5.1*r*r+.38*r*Math.sin(a*2+.9)+lip,z];
      };
      for(let k=0;k<28;k++){
        const r=.078+k*.0325,R=r+.0325;
        for(let j=0;j<60;j++){
          const a=j*2*Math.PI/60,c=(j+1)*2*Math.PI/60;
          b.quad(canopy(r,a,-.20),canopy(r,c,-.20),canopy(R,c),canopy(R,a),'#cacdc6');
          if(k===3||k===13||k===23)b.lights.quad(canopy(r,a,-.215),canopy(r,c,-.215),canopy(r+.011,c,-.155),canopy(r+.011,a,-.155),'#c5ab81');
          b.quad(canopy(r,a,.02),canopy(r,c,.02),canopy(r,c,-.20),canopy(r,a,-.20),'#8b9591');
        }
      }
      for(let j=0;j<60;j++){
        const a=j*2*Math.PI/60,c=(j+1)*2*Math.PI/60,r=.078+28*.0325;
        const pa=canopy(r,a),pc=canopy(r,c);
        b.quad(pa,pc,[pc[0],ceiling+.02,pc[2]],[pa[0],ceiling+.02,pa[2]],'#bbbfba');
      }
      const eye=Array.from({length:60},(_,i)=>canopy(.078,i*2*Math.PI/60));
      for(let i=0;i<eye.length;i++)b.tri(eye[i],eye[(i+1)%eye.length],[cx+1.8,ceiling-.14,cz-1.8],'#e8e6d8');
      b.prism(inset(.994,.994),h-1.3,h,'#b6ad96','#b8afa1');
      const openings=[p[1],p[6],p[12],p[18]];
      const bottom=(x,z)=>plaza+.72+Math.max(...openings.map(([a,c],i)=>{
        const t=Math.min(1,Math.hypot(x-a,z-c)/(i===2?22:15.5));
        return (i===2?21:14)*(1-wave(t));
      }));
      let arc=0;
      edges(p,(a,c)=>{const f=frame(a,c),L=f.length,m=Math.ceil(L/1.45);
        if(!L)return;
        for(let j=0;j<m;j++){
          const s=L*j/m,t=L*(j+1)/m,A=f.at(s,0,0),C=f.at(t,0,0),ay=bottom(A[0],A[2]),cy=bottom(C[0],C[2]);
          const back=-2.15;
          // Solid stone sill along closed bays; the four openings are clear
          // down to the ramped plaza. Fold the aluminium back into each arch.
          if(Math.max(ay,cy)<plaza+1.25){
            const a=f.at(s,0,-.17),c=f.at(t,0,-.17);
            a[1]=Math.min(ground(a[0],a[2])-.15,plaza-.2);
            c[1]=Math.min(ground(c[0],c[2])-.15,plaza-.2);
            b.quad(a,c,f.at(t,cy,-.17),f.at(s,ay,-.17),'#ada99c');
          }
          b.quad(f.at(s,ay,.06),f.at(t,cy,.06),f.at(t,cy+.30,back),f.at(s,ay+.30,back),'#c5c4b7');
          b.quad(f.at(s,ay+.30,back),f.at(t,cy+.30,back),f.at(t,cy+.92,back),f.at(s,ay+.92,back),'#a8aca4');
          b.quad(f.at(s,ay,-.16),f.at(t,cy,-.16),f.at(t,h-.5,-.16),f.at(s,h-.5,-.16),'#797a70');
          for(let k=0;k<54;k++){
            const q=k/54,ay0=ay+(h-.52-ay)*q,cy0=cy+(h-.52-cy)*q;
            const dr=(v)=>.16+.18*Math.sin((arc+v)*.49+k*.43);
            const high=.63*(h-y)/54;
            b.quad(f.at(s,ay0,dr(s)),f.at(t,cy0,dr(t)),f.at(t,cy0+high*.62,.34),f.at(s,ay0+high*.62,.34),'#c6c2ad');
            if(k<32&&k%2===0){
              const strength=.55*(1-k/34)**2;
              b.wash(f.at(s,ay0,dr(s)+.018),f.at(t,cy0,dr(t)+.018),f.at(t,cy0+high*.62,.36),f.at(s,ay0+high*.62,.36),
                '#dec695',[strength*.62,strength*.62,strength,strength]);
            }
            b.quad(f.at(s,ay0+high*.62,.34),f.at(t,cy0+high*.62,.34),f.at(t,cy0+high,.10),f.at(s,ay0+high,.10),'#dad3bd');
          }
          // Graze the metal from the curved entry soffit up through the first fins.
          // Place the tint on the same slats so the dark gaps remain visible.
          if(Math.max(ay,cy)>plaza+1.6)
            b.lights.beam(f.at(s,ay,.08),f.at(t,cy,.08),.145,'#f2cd91');
          b.beam(f.at(s,ay,.06),f.at(t,cy,.06),.13,white);
        }
        arc+=L;
      });
      const entrance=frame(p[8],p[9]);
      sign(entrance,entrance.length*.73,plaza+3.1,-1.04,5.0,1.0,'戲曲中心','XIQU CENTRE','#777970');
    }
    function signalhill(){
      const key=133366,p=ring(key),lo=low(key),hi=top(key),cx=483.1,cz=-24.5;
      shell(key,'#a7604c','#ae7960',lo-.1,hi-1.85);
      edges(p,(a,c)=>{const f=frame(a,c),L=f.length;if(L<2.1)return;
        const u=L*.5;
        for(const y of [lo+.28,lo+5.17,lo+10.6,hi-4.2,hi-2.08])
          box(f,u,y,.13,L+.19,.27,.50,'#d0c2a7');
        for(const [y,h,w] of [[lo+.35,3.15,1.67],[lo+6.1,3.07,1.48],[lo+11.1,1.89,1.31]]){
          face(f,u-w*.58,u+w*.58,y,y+h,.10,'#d1bfa0');
          face(f,u-w*.47,u+w*.47,y+.07,y+h-.13,.145,'#524d40');
          if(y>lo+1){tile(b.lights,f,u-w*.44,u+w*.44,y+.11,y+h-.17,.15,'#b19570');box(f,u,y+h*.48,.16,.062,h-.16,.07,'#997e5f');box(f,u,y+h*.66,.16,w*.90,.068,.07,'#997e5f');}
          for(let j=0;j<5;j++)for(const side of [-1,1])box(f,u+side*w*.59,y+h*(j+.5)/5,.16,j%2?.18:.32,h/5-.019,.25,'#dbc9a9');
        }
        const by=hi-3.10;
        for(const [r,depth,col] of [[.56,.18,'#d3bfa2'],[.41,.22,'#475552']]){
          for(let j=0;j<20;j++){const a=j*Math.PI/10,c=(j+1)*Math.PI/10;
            b.tri(f.at(u,by,depth),f.at(u+Math.cos(a)*r,by+Math.sin(a)*r,depth),f.at(u+Math.cos(c)*r,by+Math.sin(c)*r,depth),col);}
        }
        for(const off of [-.16,.16])box(f,u+off,by,.24,.045,.67,.06,'#95765a');
        b.beam(f.at(u-.39,by,.24),f.at(u+.39,by,.24),.030,'#95765a');
        for(let j=0;j<12;j++){const arc=k=>f.at(u+(k/12-.5)*2.34,hi-1.91+.39*Math.sin(k*Math.PI/12),.15);
          b.beam(arc(j),arc(j+1),.125,'#d3c4a7');}
      });
      const ridge=p.map(([x,z])=>[cx+(x-cx)*.66,cz+(z-cz)*.66]);
      edges(p,(a,c,i)=>{const j=(i+1)%p.length;b.quad([a[0],hi-1.83,a[1]],[c[0],hi-1.83,c[1]],[ridge[j][0],hi-.1,ridge[j][1]],[ridge[i][0],hi-.1,ridge[i][1]],'#79978b');});
      b.prism(ridge,hi-.14,hi,'#8ba598');
      for(let j=0;j<4;j++){const a=j*Math.PI/2+.18; bench(cx+Math.cos(a)*6.0,cz+Math.sin(a)*6.0,ground(cx+Math.cos(a)*6,cz+Math.sin(a)*6),-a,1.9);}
    }
    function stables(){
      const key=211592,p=ring(key),lo=low(key),hi=top(key);shell(key,'#e3dfcc','#8b8b7a',lo,hi-1.25);
      edges(p,(a,c)=>{const f=frame(a,c),L=f.length;if(L<2)return;
        const n=Math.max(1,Math.round(L/2.8));
        for(let j=0;j<n;j++){const u=(j+.5)*L/n;
          face(f,u-.72,u+.72,lo+.12,lo+2.75,.075,'#647c75');
          face(f,u-.54,u+.54,lo+3.86,lo+5.72,.075,'#485c58');
          if(j%3!==1)tile(b.lights,f,u-.49,u+.49,lo+3.93,lo+5.67,.080,'#bca881');
          for(let k=0;k<5;k++)face(f,u-.52,u+.52,lo+4.02+k*.30,lo+4.08+k*.30,.09,'#8c9988');
        }
        box(f,L/2,hi-1.32,.05,L+.15,.19,.32,'#e1d9bf');
      });
      const f=frame(p[1],p[2]),w=f.length,bal=lo+3.37;
      box(f,w/2,bal,.24,w,.23,1.03,'#c7c3a5');
      for(let k=0;k<=44;k++)box(f,k*w/44,bal+.53,.71,.035,.88,.043,'#889383');
      for(let k=0;k<5;k++)box(f,k*w/4,bal+1.49,.66,.095,2.91,.11,'#c7c1a9');
      box(f,w/2,bal+.99,.71,w,.075,.10,'#8f9b89');
      for(const side of [-1,1])b.quad(f.at(0,hi-1.22,-3.0+side*3.44),f.at(w,hi-1.22,-3.0+side*3.44),f.at(w,hi,-3),f.at(0,hi,-3),side<0?'#717468':'#898a7b');
    }
    function eastpodium(){
      const key=323620,y=top(key),lo=low(key),p=ring(key);
      // The roof garden is carried by the interchange; leave the vehicle bays open below it.
      b.prism(p,y-1.07,y,'#b8b9af','#c9c8bd');
      const inset=p.map(([x,z])=>[601+(x-601)*.59,-43+(z+43)*.78]);
      b.prism(inset,lo,y-.95,'#596365','#88908a');
      edges(p,(a,c)=>{const f=frame(a,c),L=f.length;if(L<.3)return;
        const n=Math.ceil(L/6.2);
        for(let j=0;j<n;j++){
          const u=(j+.35)*L/n;
          box(f,u,(lo+y-1)/2,-.43,.53,y-lo-1,.74,'#c4c6b9');
          box(f,u,y+.50,-.18,.055,.98,.07,'#899694');
        }
        const openings=[[559.7,17],[625.9,-15.2]];
        for(let i=0;i<Math.ceil(L/1.1);i++){
          const u=L*i/Math.ceil(L/1.1),v=L*(i+1)/Math.ceil(L/1.1),q=f.at((u+v)/2,0);
          if(openings.some(([x,z])=>Math.hypot(q[0]-x,q[2]-z)<3.3))continue;
          box(f,(u+v)/2,y+1,-.17,v-u,.10,.10,'#aeb8b2');
          face(f,u,v,y+.12,y+.84,-.18,'#899e94');
        }
      });
      // The two public bridges meet the garden at podium level. The eastern
      // staircase descends only after it reaches the waterfront pavement.
      function footbridge(a,c,ya,yc,width){
        const f=frame(a,c),L=f.length,h=width/2,n=Math.ceil(L/2.45);
        b.quad(f.at(0,ya,-h),f.at(0,ya,h),f.at(L,yc,h),f.at(L,yc,-h),'#bcb6a6');
        b.quad(f.at(0,ya-.68,-h),f.at(L,yc-.68,-h),f.at(L,yc-.68,h),f.at(0,ya-.68,h),'#adaea6');
        for(const d of [h,-h]){
          b.quad(f.at(0,ya-.68,d),f.at(0,ya,d),f.at(L,yc,d),f.at(L,yc-.68,d),'#b1b2a8');
          b.beam(f.at(0,ya+1.18,d),f.at(L,yc+1.18,d),.075,'#acb9b6');
          for(let j=0;j<n;j++){
            const u=j*L/n,v=(j+1)*L/n,h0=ya+(yc-ya)*j/n,h1=ya+(yc-ya)*(j+1)/n;
            b.quad(f.at(u+.06,h0+.16,d),f.at(v-.06,h1+.16,d),f.at(v-.06,h1+.94,d),f.at(u+.06,h0+.94,d),'#829a94');
            b.beam(f.at(u,h0,d),f.at(u+.39,h0+1.16,d),.071,'#abafa3');
          }
        }
      }
      footbridge([521,45],[563,16],14.63,y+.04,5.3);
      footbridge([624,-16.5],[667.8,18.4],y+.035,y+.035,5.65);
      const stairs=frame([667.8,18.4],[682.4,29.2]),finish=ground(682.4,29.2);
      const steps=Math.ceil((y-finish)/.17);
      for(let j=0;j<steps;j++){
        const u=j*stairs.length/steps,w=stairs.length/steps,h=y+.03+(finish-y)*j/steps;
        box(stairs,u+w/2,h-.16,0,w+.016,.32,4.35,'#b8b3a5');
      }
      for(const d of [-2.14,2.14]){
        b.beam(stairs.at(0,y+.91,d),stairs.at(stairs.length,finish+.91,d),.058,'#a4b2ae');
        b.quad(stairs.at(0,y-.56,d),stairs.at(0,y+.64,d),stairs.at(stairs.length,finish+.64,d),stairs.at(stairs.length,finish-.56,d),'#a6aea6');
      }
      for(const x of [-2.24,2.24]){const post=stairs.at(.2,0,x),bot=ground(post[0],post[2]);box(stairs,.2,(bot+y+2.89)/2,x,.32,y+2.89-bot,.32,'#a9aea6');}
      box(stairs,1,y+2.95,0,4.85,.22,5.46,'#9ca8a0');
      for(const [x,z,w,d] of [[599,-91,20,9],[594,-71,19,13],[587,-45,9,24],[581,-18,5,13],[600,-15,6,8],[628,-47,6,8]]){
        beds(rect(x,z,w,d),y);
        for(const side of [-1,1])b.dome(x+side*w*.24,y+.33,z,w*.21,.58,d*.35,'#76915f',0,8);
      }
      for(const [x,z,h] of [[593,-94,4.8],[602,-94,5.0],[587,-71,4.4],[594,-69,4.15],[586,-47,4.3],[580,-21,3.7],[626,-46,3.55]]){
        b.cylinder(x,y+h*.36,z,.12,.18,h*.68,'#897e68',8);
        for(let k=0;k<3;k++){
          const a=k*2.1+x,hx=x+.86*Math.cos(a),hz=z+.86*Math.sin(a);
          b.beam([x,y+h*.48,z],[hx,y+h*.82,hz],.08,'#928672');
          b.dome(hx,y+h*.68,hz,1.36,1.48,1.3,k%2?'#789367':'#6c885e',0,9);
        }
      }
      const terrace=frame([601,-62],[618,-47]),len=terrace.length;
      for(let j=0;j<3;j++){
        const v=-j*.70,h=.34+.30*j;
        box(terrace,len*.5,y+h*.5,v,len,h,.78,'#b5b6a7');
        box(terrace,len*.5,y+h+.025,v,len-.09,.045,.68,'#a2bbaf');
      }
      for(let k=0;k<4;k++){
        const u=2.2+k*5.05;
        box(terrace,u,y+1.07,-2.15,4.85,.37,.94,'#dad8c8');
        box(terrace,u,y+1.36,-2.15,4.64,.31,.79,k%2?'#85966b':'#788c60');
        const q=terrace.at(u,0,1.4);bench(q[0],q[2],y,terrace.angle,2.8);
      }
      // High and low corners give the tensioned shade sails their saddle profile.
      function sail(x,z,a,w,d){
        const f=frame([x,z],[x+Math.cos(a),z+Math.sin(a)]);
        const at=(u,v)=>f.at(u*w,y+4.0+4.2*u*v+.58*(u*u+v*v),v*d);
        for(let i=0;i<8;i++)for(let j=0;j<7;j++){
          const u=i/8-.5,v=j/7-.5,t=u+1/8,q=v+1/7;
          b.quad(at(u,v),at(u,q),at(t,q),at(t,v),'#f1ecdc');
        }
        for(const u of [-.5,.5])for(const v of [-.5,.5]){
          const outer=f.at(u*w*1.08,at(u,v)[1]+.35,v*d*1.08);
          b.beam(f.at(u*w*1.14,y,v*d*1.14),outer,.108,'#c7c9bf');b.beam(outer,at(u,v),.033,'#8e9b94');
        }
      }
      sail(615,-37,.72,12,7.4);sail(602,-51,.72,11.6,7.0);
      for(let j=0;j<5;j++){const x=593+j*5,z=-30-j*4.6;
        b.cylinder(x,y+1.47,z,.097,.12,2.94,'#c0c6bc',8);
        b.cylinder(x,y+3.11,z,.11,.11,.34,'#ebeedb',8);
        b.lights.cylinder(x,y+3.11,z,.116,.116,.32,'#f4deb0',8);
      }
    }
    function railWalk(path,wooden){
      // Miter bends once so the rail, edges and promenading surface meet on the same joints.
      const normals=path.slice(1).map(([x,z],i)=>{const dx=x-path[i][0],dz=z-path[i][1],l=Math.hypot(dx,dz);return [-dz/l,dx/l];});
      const knots=path.map(([x,z],i)=>{
        const a=normals[Math.max(0,i-1)],c=normals[Math.min(normals.length-1,i)],dot=1+a[0]*c[0]+a[1]*c[1];
        return {x,z,nx:(a[0]+c[0])/dot,nz:(a[1]+c[1])/dot,y:Math.max(4.2,ground(x,z)+.09)};
      });
      const at=(k,d,h)=>[k.x+k.nx*d,k.y+h,k.z+k.nz*d];
      const edge=wooden?4.35:1.95,inner=wooden?-10.6:-2.0;
      for(let i=1;i<knots.length;i++){
        const a=knots[i-1],c=knots[i],length=Math.hypot(c.x-a.x,c.z-a.z);
        const interp=(d,t,h)=>{const A=at(a,d,h),B=at(c,d,h);return A.map((v,j)=>v+(B[j]-v)*t);};
        b.quad(at(a,inner,0),at(a,edge+.29,0),at(c,edge+.29,0),at(c,inner,0),'#c5bbaa');
        b.quad(at(a,edge+.29,0),at(a,edge+.29,-.52),at(c,edge+.29,-.52),at(c,edge+.29,0),'#9a9d91');
        for(const h of [.39,.68])b.beam(at(a,edge,h),at(c,edge,h),.031,'#a6b2aa');
        if(wooden){
          const l=edge-.24,r=edge+.13;
          b.quad(at(a,l,1.04),at(c,l,1.04),at(c,r,1.13),at(a,r,1.13),'#ae825a');
          b.quad(at(a,l,.96),at(c,l,.96),at(c,l,1.04),at(a,l,1.04),'#856747');
        }else b.beam(at(a,edge,1.06),at(c,edge,1.06),.071,'#a9b4ab');
        const n=Math.ceil(length/2.45);
        for(let j=0;j<n;j++)b.beam(interp(edge,j/n,.01),interp(edge,j/n,1.05),.043,'#81918a');
        const lamps=Math.max(1,Math.round(length/14));
        for(let j=0;j<lamps;j++){
          const t=(j+.5)/lamps,span=Math.min(.32/length,.08);
          b.lights.beam(interp(edge-.055,t-span,.91),interp(edge-.055,t+span,.91),.048,'#dab783');
        }
        if(!wooden)continue;
        // The western deck crosses a real tidal pocket in front of the Regent.
        // Close both fascias and carry the suspended walkway on pairs of piers.
        b.quad(at(a,inner,0),at(c,inner,0),at(c,inner,-.62),at(a,inner,-.62),'#a5a492');
        b.quad(at(a,inner,-.54),at(c,inner,-.54),at(c,edge,-.54),at(a,edge,-.54),'#878d80');
        const spans=Math.max(1,Math.ceil(length/15));
        for(let j=0;j<spans;j++){
          const t=(j+.5)/spans;
          for(const d of [inner+1.3,edge-1.2]){const q=interp(d,t,-.36);b.cylinder(q[0],(q[1]-.9)/2,q[2],.48,.58,q[1]+.9,'#92968b',8);}
          b.beam(interp(inner+.55,t,-.55),interp(edge-.45,t,-.55),.28,'#9a9e91');
        }
        if(i<=8){
          for(const h of [.39,.69,1.04])b.beam(at(a,inner+.13,h),at(c,inner+.13,h),h>1?.065:.027,'#a5aea3');
          for(let j=0;j<n;j++)b.beam(interp(inner+.13,j/n,0),interp(inner+.13,j/n,1.04),.044,'#89988a');
        }
        // Contrasting stone pavers form staggered fine bands across the deck.
        for(let j=1;j<Math.floor(length/2.6);j++){
          const t=j*2.6/length;
          b.quad(interp(inner+.1,t,.016),interp(edge+.08,t,.016),interp(edge+.08,t+.06/length,.016),interp(inner+.1,t+.06/length,.016),'#b4b0a0');
        }
        const plates=Math.floor(length/4.25);
        for(let j=0;j<plates;j++){
          const center=(j+.53)/plates;
          const ink=(u,v)=>interp(edge-.15+v,center+u/length,1.067+v*.245);
          b.quad(ink(-.123,0),ink(.123,0),ink(.123,.190),ink(-.123,.190),'#bea273');
          b.quad(ink(-.049,.042),ink(.049,.042),ink(.047,.099),ink(-.044,.105),'#786247');
          for(let k=0;k<5;k++){const u=-.058+k*.023,v=.124+.018*Math.sin(k*.8);
            b.quad(ink(u,.087),ink(u+.015,.087),ink(u+.019,v),ink(u+.003,v+.007),'#786247');}
        }
      }
    }
    function arbour(x,z,y,angle,scale=1){
      // Cantilevered ribs open into a fan above a low planter on the landward side.
      const f=frame([x,z],[x+Math.cos(angle),z+Math.sin(angle)]),h=6*scale;
      const pos=(rib,t)=>{
        const a=rib*.98,w=(1.27+6.7*t**1.5)*scale;
        return f.at(Math.sin(a)*w,y+h*(1-(1-t)**2.65)+.14*scale*Math.cos(a),
          -1.9*scale+(1.13+6.5*t*t)*Math.cos(a)*scale);
      };
      for(const rib of [-.56,.56])for(let j=5;j<9;j++){
        const a=pos(rib,j/9),c=pos(rib,(j+1)/9);a[1]-=.08;c[1]-=.08;
        b.lights.beam(a,c,.048*scale,'#c7a779');
      }
      const bed=Array.from({length:20},(_,k)=>{const a=k*Math.PI/10,q=f.at(Math.cos(a)*2.5*scale,0,(-1.1+1.2*Math.sin(a))*scale);return [q[0],q[2]];});
      b.prism(bed,y-.03,y+.51*scale,'#cbc7b3','#768454');
      for(let k=0;k<=8;k++){const rib=(k-4)/4;
        for(let j=0;j<9;j++)b.beam(pos(rib,j/9),pos(rib,(j+1)/9),.083*scale,'#a29c83');
      }
      for(let j=2;j<=12;j++){
        const t=j/12;
        for(let k=0;k<10;k++){const r=k/5-1,next=r+.2;
          b.quad(pos(r,t-.022),pos(next,t-.022),pos(next,t),pos(r,t),'#c7c3ab');}
      }
      for(let j=0;j<8;j++){const q=pos((j-3.5)/4,.16+(j%3)*.065);b.dome(...q,.56*scale,.52*scale,.46*scale,j%2?'#7f8a5b':'#788559',0,7);}
    }
    function sculpture(x,z,kind){
      const y=ground(x,z),f=frame([x-1,z],[x+1,z]),c='#786b52',dark='#665d4c';
      const pt=(u,h,v=0)=>f.at(u+1,y+.42+h,v);
      if(kind!=='award'){
        const p=kind==='lee'?[[662.1,45.7],[658.8,56.7],[655.4,52.7]]:[[640.8,90.1],[647.2,87.7],[644.7,94.0]];
        b.prism(p,y+.025,y+.19,'#969888','#85a7a0');
      }
      b.cylinder(x,y+.22,z,1.40,1.65,.42,'#a8a295',12);
      const limb=(a,d,r)=>b.beam(pt(...a),pt(...d),r,c);
      if(kind==='lee'){
        for(const [u,side] of [[-.87,-1],[.88,1]]){
          limb([u,.14,.1],[side*.68,.61,-.02],.15);limb([side*.68,.61,-.02],[side*.15,1.04,0],.17);
          b.box(...pt(u,.09,.110),.26,.16,.39,dark,.31*side);
        }
        b.cylinder(...pt(0,1.30,0),.28,.22,.58,c,9);
        limb([-.23,1.55,0],[-.67,1.48,.08],.095);limb([-.67,1.48,.08],[-1.03,1.52,.14],.07);
        limb([.23,1.56,0],[.50,1.77,.05],.10);limb([.50,1.77,.05],[.55,2.02,.13],.071);
        b.box(...pt(.55,2.04,.13),.13,.2,.09,c,-.16);
        b.cylinder(...pt(.02,1.81,0),.16,.14,.32,c,12);b.dome(...pt(.01,1.94,0),.18,.105,.17,dark,0,12);
      }else if(kind==='mui'){
        b.cylinder(...pt(0,.57),.17,.59,1.14,c,12);b.cylinder(...pt(.02,1.28),.25,.17,.44,c,10);
        b.cylinder(...pt(.03,1.69),.147,.138,.27,c,12);b.dome(...pt(.015,1.78,-.03),.183,.16,.18,dark,0,12);
        limb([-.18,1.46,0],[-.37,1.11,.11],.074);limb([-.37,1.11,.11],[-.29,1.05,.27],.062);
        limb([.18,1.45,0],[.30,1.26,.21],.075);limb([.30,1.26,.21],[.13,1.54,.27],.059);
        limb([.16,1.47,.3],[.05,1.66,.16],.045);
        for(let j=0;j<8;j++){const a=j*Math.PI/4;b.beam(pt(.56*Math.cos(a),.04,.56*Math.sin(a)),pt(.14*Math.cos(a),1.08,.14*Math.sin(a)),.025,'#8c7c60');}
      }else{
        b.cylinder(...pt(0,.82),.20,.42,1.64,'#af9965',10);
        limb([-.17,1.62,0],[-.39,2.03,0],.094);limb([.17,1.62,0],[.39,2.03,0],.094);
        b.cylinder(...pt(0,1.71),.135,.14,.24,c,10);
        const star=[];for(let k=0;k<10;k++){const a=k*Math.PI/5,r=k%2?.21:.47;star.push(pt(r*Math.sin(a),2.23+r*Math.cos(a),0));}
        for(let k=0;k<10;k++)b.tri(pt(0,2.23,.10),star[k],star[(k+1)%10],'#b4a273');
      }
      sign(f,1,y+.21,1.53,1.14,.27,kind==='lee'?'李小龍':kind==='mui'?'梅艷芳':'香港電影金像獎',kind==='lee'?'BRUCE LEE':kind==='mui'?'ANITA MUI':'HONG KONG FILM AWARDS','#605b50');
    }
    function stars(){
      railWalk(avenue,true);
      sculpture(659.1,50,'lee');sculpture(644.5,89.9,'mui');sculpture(281.9,302,'award');
      for(const [i,t] of [[3,.34],[5,.22],[5,.57],[5,.90],[7,.42],[8,.42],[10,.44]]){
        const f=frame(avenue[i-1],avenue[i]),q=f.at(f.length*t,0,-2.7);
        const y=Math.max(4.2,ground(...avenue[i-1])+.09)*(1-t)+Math.max(4.2,ground(...avenue[i])+.09)*t;
        bench(q[0],q[2],y,f.angle,3.6);
      }
      for(const [x,z,a,i] of [[309.7,314.3,.67,3],[366.6,333.9,-.075,5],[414.4,330.1,-.075,5],[461.9,326.4,-.075,5]]){
        const f=frame(avenue[i-1],avenue[i]),start=avenue[i-1],t=Math.max(0,Math.min(1,((x-start[0])*Math.cos(a)+(z-start[1])*Math.sin(a))/f.length));
        const y=Math.max(4.2,ground(...start)+.09)*(1-t)+Math.max(4.2,ground(...avenue[i])+.09)*t;
        arbour(x,z-2.4,y,a);
      }
    }
    function promenade(){
      const path=[[-57,291],[-43,300],[-20,315],[3,322],[46,319],[106,316],[185,310],[268,304],[291,300.6]];
      railWalk(path,false);
      for(let i=2;i<path.length-1;i++){const [x,z]=path[i];bench(x,z-4,ground(x,z-4),.065,3.45);}
    }
    function eastwalk(){
      const path=[[674.2,44.9],[694,24],[716,-5],[742,-31],[850,-127],[958,-223],[1065,-319],[1082,-333]];
      railWalk(path,false);
      for(let i=2;i<path.length;i++){
        const f=frame(path[i-1],path[i]),n=Math.ceil(f.length/24);
        for(let j=0;j<n;j++){const q=f.at((j+.5)*f.length/n,0,-3.35);bench(q[0],q[2],ground(q[0],q[2]),f.angle,2.8);}
      }
    }
    function salisburygarden(){
      arbour(298,270,ground(298,270),2.87,1.38);
      const walls=[[[283,180],[283,197]],[[284,209],[284,233]],[[302,179],[317,179]],[[322,184],[328,194]],[[326,232],[317,238]]];
      for(const [a,c] of walls){const f=frame(a,c),L=f.length,n=Math.ceil(L/2.2);
        for(let i=0;i<n;i++){const u=(i+.5)*L/n,q=f.at(u,0,0),y=ground(q[0],q[2]);
          box(f,u,y+.32,0,L/n+.012,.67,1.23,'#b5a991');
          box(f,u,y+.72,0,L/n,.18,1.07,i%2?'#748757':'#849469');
        }
      }
      for(const [x,z] of [[286,238],[297,241],[312,241],[323,236],[326,229],[281,207]]){
        const y=ground(x,z);bench(x,z,y,.05,2.65);
      }
      const y=ground(304,248),outline=rect(304,248,12.7,3.8);
      b.prism(outline,y-.12,y+.12,'#b5afa0','#adaea4');
      for(let j=0;j<5;j++){const x=299.5+j*2.21;
        b.cylinder(x,y+.132,248,.23,.23,.026,'#777d74',12);
        const h=.39+(2-Math.abs(2-j))*.24;
        b.cylinder(x,y+.14+h/2,248,.018,.065,h,'#c3d9d4',7);}
    }
    const builders={regent,rosewood,xiqu,signalhill,stables,eastpodium,stars,salisburygarden,promenade,eastwalk};
    builders[id]();
  }
  return {sites,walks,solids,paint,groundLevel,clearPlanting,build};
})();
