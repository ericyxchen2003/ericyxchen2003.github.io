// The survey supplies each floor's footprint and datum, including the open taxi level.
window.HKDiamondHillModels=(()=>{
  const sites=HKDiamondHillSites,{faces,shell}=HKCoastModels.geometry;
  const kindById=new Map(Object.entries(sites.groups).flatMap(([k,ids])=>ids.map(id=>[id,k])));
  const replaces=b=>!b.foundation&&kindById.has(b.id);
  const palette={plaza:['mall','#e3cba8','#8a5967'],galaxia:['estate','#ded6c2','#79928a'],
    'fung-tak':['estate','#ded8c1','#989a78'],'lung-poon':['estate','#d4d6cc','#74958e'],
    crematorium:['hospital','#dbd5c2','#958771'],funeral:['hospital','#e0d7c0','#8f7866'],sports:['sports','#d4d1bc','#749392']};
  function hall(b,kind,g,lights,far){
    const mesh=g&&shell(b.n,g),rect=sites.roofs[b.id],facets=faces(rect);
    const front=facets.reduce((a,c)=>c.w>a.w?c:a),hw=front.w/2,hd=Math.min(...facets.map(f=>f.w))/2;
    const at=(u,y,v)=>front.at(u,y,v-hd);
    const lo=b.basePD,h=b.top-lo,gold=kind==='pavilion',tower=kind==='pagoda',radial=gold||tower;
    const timber=gold?'#d9a642':'#77503b',eaves=gold?'#e8b83f':'#4b5251',tile=gold?'#f4cd63':'#63706b';
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
    const ring=(s,y)=>radial?Array.from({length:8},(_,i)=>{
      const theta=(i+.5)*Math.PI/4;return at(Math.cos(theta)*hw*s,y,Math.sin(theta)*hd*s);
    }):corners.map(([u,v])=>at(u*hw*s,y,v*hd*s));
    const walls=(a,c,shade)=>{for(let i=0;i<a.length;i++){const j=(i+1)%a.length;mesh?.quad(a[i],a[j],c[j],c[i],shade);}};
    if(gold){
      // A stepped stone island carries the octagonal timber hall and bridge landings.
      for(const [size,y,top] of [[1.61,lo-1.6,lo+.92],[1.5,lo+.92,lo+1.25]]){
        const base=ring(size,y),rim=ring(size,top);walls(base,rim,'#bdb098');
        for(let i=0;i<rim.length;i++)mesh?.tri(rim[i],rim[(i+1)%rim.length],at(0,top,0),'#cfbea0');
      }
    }
    const tiers=tower?4:gold||b.id===11075851?2:1;
    for(let k=0;k<tiers;k++){
      const scale=1-.58*k/tiers,base=lo+h*k/tiers;
      const height=h/tiers,lip=base+height*(k===0?.57:.28);
      const floor=ring(scale*.74,k?base-height*.21:base),beams=ring(scale*.74,lip),rim=ring(scale*1.04,lip+.13);
      walls(floor,beams,timber);walls(ring(scale*1.04,lip-.20),rim,eaves);
      for(let i=0;i<beams.length;i++){
        const j=(i+1)%beams.length,a=floor[i],c=floor[j],w=Math.hypot(a[0]-c[0],a[2]-c[2]);
        if(w<1)continue;
        const face=faces([[a[0],a[2]],[c[0],c[2]],[beams[(j+1)%beams.length][0],beams[(j+1)%beams.length][2]]])[0];
        const bays=far?1:Math.max(1,Math.round(w/3)),bay=w/bays;
        for(let n=0;n<bays;n++){
          const u=(n+.5-bays/2)*bay,low=base+.35,high=lip-.3;
          if(high<=low)continue;
          mesh?.quad(face.at(u-bay*.35,low,.06),face.at(u+bay*.35,low,.06),face.at(u+bay*.35,high,.06),face.at(u-bay*.35,high,.06),gold?'#a76525':'#53392e');
          lights?.litPanel(face.at,u,high-.17,.08,bay*.64,.15,gold?'#ffe38c':'#d9ad73');
        }
      }
      const crown=base+height,mid=ring(scale*.72,lip+(crown-lip)*.31);
      walls(rim,mid,tile);
      if(gold&&!far){
        const raised=rim.map(p=>[p[0],p[1]+.16,p[2]]);walls(rim,raised,'#ffdc7d');
        for(let i=0;i<raised.length;i++){
          const p=raised[i],q=raised[(i+1)%raised.length],f=faces([[p[0],p[2]],[q[0],q[2]],[mid[(i+2)%raised.length][0],mid[(i+2)%raised.length][2]]])[0];
          lights?.litPanel(f.at,0,lip+.13,.035,f.w*.94,.19,'#ffd06f');
        }
      }
      if(radial){
        for(let i=0;i<mid.length;i++)mesh?.tri(mid[i],mid[(i+1)%mid.length],at(0,crown,0),i%2?tile:eaves);
      }else{
        const ridge=Math.max(.24,hw-hd*.72)*scale;
        const ends=[at(-ridge,crown,0),at(ridge,crown,0)];
        mesh?.quad(mid[0],mid[1],ends[1],ends[0],tile);mesh?.tri(mid[1],mid[2],ends[1],eaves);
        mesh?.quad(mid[2],mid[3],ends[0],ends[1],tile);mesh?.tri(mid[3],mid[0],ends[0],eaves);
      }
    }
    mesh?.finish();
  }
  function terrace(b,g,height){
    if(!g)return;
    const mesh=shell('志蓮淨苑・石台基',g),rings=[b.p,...(b.holes||[])];
    const outline=rings.map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),vertices=outline.flat();
    for(const indices of THREE.ShapeUtils.triangulateShape(outline[0],outline.slice(1))){
      mesh.tri(...indices.map(i=>[vertices[i].x,b.top,vertices[i].y]),'#bdb5a4');
    }
    for(const face of rings.flatMap(faces)){
      const side=face.w/2,l=face.at(-side,b.basePD,0),r=face.at(side,b.basePD,0);
      l[1]=Math.min(l[1],height(l[0],l[2])-.1);r[1]=Math.min(r[1],height(r[0],r[2])-.1);
      mesh.quad(l,r,face.at(side,b.top,0),face.at(-side,b.top,0),'#a39786');
      mesh.quad(face.at(-side,b.top-.35,.06),face.at(side,b.top-.35,.06),face.at(side,b.top,.06),face.at(-side,b.top,.06),'#d6cab4');
    }
    mesh.finish();
  }
  function draw(b,g,signs,lights,height,far){
    const kind=kindById.get(b.id),preset=palette[kind];
    if(kind==='terrace'){terrace(b,g,height);return;}
    if(!preset){hall(b,kind,g,lights,far);return;}
    HKLokFuModels.drawBlock(b,g,signs,lights,height,far,preset[0],sites.fronts[b.id],preset.slice(1));
    if(kind==='plaza'&&b.base===3&&g){
      const mesh=shell('荷里活廣場・交匯處天花',g);
      const rings=[b.p,...b.holes||[]].map(r=>r.map(([x,z])=>new THREE.Vector2(x,z))),verts=rings.flat();
      for(const tri of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)))mesh.tri(...tri.map(i=>[verts[i].x,b.basePD,verts[i].y]),'#bbb4a2');
      mesh.finish();
    }
    if(b.id===11249529&&g){
      const mesh=shell('斧山道運動場・看台',g),field=sites.field;
      const f=faces(b.p).sort((a,c)=>c.w-a.w).slice(0,2).sort((a,c)=>{
        const dist=s=>Math.hypot(s.at(0,0,0)[0]-field[0][0],s.at(0,0,0)[2]-field[0][1]);
        return dist(a)-dist(c);
      })[0];
      for(let i=0;i<7;i++){const d=(7-i)*.72,y=b.basePD+1+i*.34,w=f.w*.87;
        mesh.quad(f.at(-w/2,y,d),f.at(w/2,y,d),f.at(w/2,y,d+.65),f.at(-w/2,y,d+.65),i%2?'#8aa7a1':'#86a49b');}
      mesh.finish();
    }
  }
  return {replaces,building(b,props,signs,height,g){if(replaces(b))draw(b,g,signs,props,height,false);},
    lights(b,props,height){if(replaces(b))draw(b,null,null,props,height,false);},
    distant(b,batch,g,height){if(!replaces(b))return false;draw(b,g,null,null,height,true);return true;}};
})();
