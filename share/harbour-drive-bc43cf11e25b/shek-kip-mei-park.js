// Court long axes follow the surveyed outlines rather than the terrain texture.
for(const park of [window.HKShekKipMeiParks,window.HKLaiChiKokParks,window.HKLokFuSites,window.HKSanPoKongSites].filter(Boolean)){
  const courts=park.courts.map(([sport,[a,b,d,e]])=>{
    const ab=Math.hypot(b[0]-a[0],b[1]-a[1]),ae=Math.hypot(e[0]-a[0],e[1]-a[1]);
    const end=ab>=ae?b:e,length=Math.max(ab,ae),width=Math.min(ab,ae);
    return {sport,length,width,x:(a[0]+d[0])/2,z:(a[1]+d[1])/2,dx:(end[0]-a[0])/length,dz:(end[1]-a[1])/length};
  });
  const corners=park.courts.flatMap(([,ring])=>ring),bounds=corners.length?[Math.min(...corners.map(p=>p[0]))-4,Math.min(...corners.map(p=>p[1]))-4,Math.max(...corners.map(p=>p[0]))+4,Math.max(...corners.map(p=>p[1]))+4]:null;
  park.onCourt=(x,z)=>{
    if(!bounds||x<bounds[0]||x>bounds[2]||z<bounds[1]||z>bounds[3])return false;
    return courts.some(c=>Math.abs((x-c.x)*c.dx+(z-c.z)*c.dz)<c.length/2+3&&Math.abs((z-c.z)*c.dx-(x-c.x)*c.dz)<c.width/2+3);
  };
  park.furnish=(height,props,heads)=>{
    for(const c of courts){
      const {sport,length,width,dx,dz}=c,l=length/2,w=width/2,angle=Math.atan2(dx,dz);
      const at=(u,v)=>[c.x+u*dx-v*dz,c.z+u*dz+v*dx];
      const upright=(u,v,h,r,shade)=>{
        const [x,z]=at(u,v),y=height(x,z);
        props.add('pole',x,y+h/2,z,r,h,r,shade);
        return y+h;
      };
      if(sport==='soccer'){
        const goal=length>80?7.32:5,bar=length>80?2.44:2;
        for(const side of [-1,1]){
          const [x,z]=at(side*(l-.25),0);
          const left=upright(side*(l-.25),-goal/2,bar,.07,'#deded3'),right=upright(side*(l-.25),goal/2,bar,.07,'#deded3');
          props.add('box',x,(left+right)/2,z,goal,.13,.13,'#deded3',angle);
        }
        if(length<80)continue;
        for(const u of [-l*.8,l*.8])for(const v of [-w-2,w+2]){
          const [x,z]=at(u,v),y=upright(u,v,16,.19,'#747b76');
          props.add('box',x,y,z,2.6,.52,.65,'#82918e',angle);
          heads.push({x,z,y:y-.29,base:y-16,angle,road:null,layer:0,flood:true,aimX:(c.x-x)*.38,aimZ:(c.z-z)*.38});
        }
      }else if(sport==='beachvolleyball'){
        const y1=upright(0,-w-.65,2.43,.06,'#637477'),y2=upright(0,w+.65,2.43,.06,'#637477');
        for(const drop of [0,.25,.5,.85])props.add('box',c.x,(y1+y2)/2-drop,c.z,width+1.3,.05,.05,'#c8c9bc',angle);
      }else if(sport==='tennis'){
        const y1=upright(0,-w-.35,1.07,.046,'#52665a'),y2=upright(0,w+.35,1.07,.046,'#52665a');
        props.add('box',c.x,(y1+y2)/2-.05,c.z,width+.7,.08,.055,'#d7dace',angle);
        for(const drop of [.28,.53,.78])props.add('box',c.x,(y1+y2)/2-drop,c.z,width+.7,.045,.045,'#64736c',angle);
      }
    }
  };
  park.paintCourts=function(c){
  for(const {sport,length,width,dx,dz,x,z} of courts){
    c.save();c.translate(x,z);c.rotate(Math.atan2(dz,dx));
    c.fillStyle=sport==='soccer'?(length>80?'#698454':'#a57e65'):sport==='tennis'?'#5e817f':sport==='beachvolleyball'?'#d6c9a7':'#ad7c68';
    c.fillRect(-length/2,-width/2,length,width);
    c.strokeStyle='#eee9d0';c.lineWidth=.20;
    const line=(x,y,xx,yy)=>{c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
    const ring=(r)=>{c.beginPath();c.arc(0,0,r,0,2*Math.PI);c.stroke();};
    const l=length/2-.22,w=width/2-.22;
    c.strokeRect(-l,-w,2*l,2*w);line(0,-w,0,w);
    if(sport==='tennis'){
      for(const side of [-1,1])line(-l,side*w*.76,l,side*w*.76);
      c.strokeRect(-l*.55,-w*.76,l*1.1,w*1.52);line(-l*.55,0,l*.55,0);
    }else if(sport!=='beachvolleyball'){
      ring(sport==='basketball'?1.8:Math.min(9.15,l*.18));
      for(const side of [-1,1]){
        const depth=sport==='soccer'?l*.32:4.9,half=sport==='soccer'?w*.56:2.45;
        c.strokeRect(side*l,-half,-side*depth,2*half);
        if(sport==='basketball'){c.beginPath();c.arc(side*(l-1.575),0,6.25,side>0?Math.PI/2:-Math.PI/2,side>0?1.5*Math.PI:Math.PI/2);c.stroke();}
      }
    }
    c.restore();
  }
};
}
