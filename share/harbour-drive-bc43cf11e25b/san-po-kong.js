// This infill shares the surveyed ground sheets of Kai Tak, Lok Fu and Wong Tai Sin.
(()=>{
  const data=HKSanPoKong, north=HKNorth, removed=new Set(data.seamBuildingIds);
  HKMAP.buildings=HKMAP.buildings.filter(b=>!removed.has(b.id));
  north.buildings=north.buildings.filter(b=>!removed.has(b.id)).concat(data.buildings);
  for(const k of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])north[k].push(...data[k]);
  for(const [k,rows] of Object.entries(data.nodes))north.nodes[k].push(...rows);
  const seam=data.kaiSanSeam, approach=north.roads.find(r=>r.id===seam.road);
  approach.profile=seam.profile;
  (approach.liningEnds??={})[0]=seam.lining;
  north.decks.find(d=>d.id===seam.road).p=seam.profile;
  north.land=data.land;
  HKMAP.terrain.sanPoKongGrade=data.grade;
  const names=new Map([[3310646,['Mikiki','Mikiki']],[10045510,['采頤花園商場','Rhythm Garden Shopping Centre']],[10228766,['越秀廣場','Yue Xiu Plaza']]]);
  for(const b of north.buildings)if(names.has(b.id))[b.n,b.en]=names.get(b.id);
  data.contains=(ring,x,z)=>{
    let odd=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[i],b=ring[j];
      if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])odd=!odd;
    }
    return odd;
  };
  const previous=HKMAP.outsideExtension;
  HKMAP.outsideExtension=(x,z)=>previous(x,z)&&!data.outlines.some(ring=>data.contains(ring,x,z));
})();
