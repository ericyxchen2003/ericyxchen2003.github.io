/* Extend the northern survey before constructing the common routing and physics indices. */
(() => {
  const old=window.HKNorth, district=window.HKMongKok;
  if (!district) return;
  const prev=old.terrain, next=district.terrain;
  const seam=prev.z;
  if(next.x!==prev.x||next.nx!==prev.nx||next.step!==prev.step||
     next.z+(next.nz-1)*next.step!==seam) throw Error('Discontinuous survey grid');
  const fresh=new Set(district.seamBuildingIds);
  old.buildings=old.buildings.filter(b=>!fresh.has(b.id)).concat(district.buildings);
  old.photoBounds=[prev.x,prev.z,prev.x+(prev.nx-1)*prev.step,prev.z+(prev.nz-1)*prev.step];
  old.bounds=district.bounds;
  old.land=district.land;
  for(const layer of ['roads','parks','paths','decks','piers','excavations','barriers','water','marks','diagonals'])
    old[layer]=old[layer].concat(district[layer]);
  for(const k of Object.keys(old.nodes)) old.nodes[k].push(...district.nodes[k]);
  old.terrain={...next,nz:next.nz+prev.nz-1,cm:btoa(atob(next.cm).slice(0,-2*next.nx)+atob(prev.cm))};
})();
