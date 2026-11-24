/* Stand detection, automatic dispatch and the two-rate Hong Kong urban taximeter. */
window.HKTaxiService=(()=>{
  'use strict';
  const stopped=.12, maxWaitSeconds=120;
  function fareCents(fastMetres,slowSeconds){
    // Distance starts its next band just beyond the included distance. A minute
    // of low-speed operation contributes one increment, including in the flagfall.
    const excess=Math.max(0,fastMetres-2000);
    const units=slowSeconds/60+excess/200;
    const ticks=excess>0?Math.ceil(units-1e-9):Math.floor(units+1e-9);
    return 2900+210*Math.min(35,ticks)+140*Math.max(0,ticks-35);
  }
  function create(map,sim,random=Math.random){
    const car=sim.state,stands=[],buildings=[],seen=new Set();
    for(const [id,title,alias,en,rawX,rawZ,roadId] of HKTaxiRankRows){
      const anchor=sim.nearestRoad(rawX,rawZ,s=>s.road.id===roadId&&(s.forward||s.reverse));
      if(!anchor)continue;
      const s=anchor.segment,side=((rawX-anchor.x)*s.dz-(rawZ-anchor.z)*s.dx)>=0?1:-1;
      const dir=s.one||side, yaw=Math.atan2(s.dx*dir,-s.dz*dir);
      // In a one-way street the boarding kerb may be on either side.
      const edge=Math.max(0,s.half-1.3);
      let offset=null;
      for(const distance of [edge,edge*.6,0]){
        if(sim.canOccupy(anchor.x+s.dz*side*distance,anchor.z-s.dx*side*distance,yaw,s.layer)){offset=distance;break;}
      }
      if(offset===null)continue;
      const x=anchor.x+s.dz*side*offset,z=anchor.z-s.dx*side*offset;
      stands.push({id:'rank-'+id,name:title+'的士站',alias,en:en+' · Taxi Stand',x,z,anchor,yaw,side,layer:s.layer,parking:{x,z,yaw,layer:s.layer}});
    }
    for(const b of map.buildings){
      const name=(b.n||b.en||'').trim();
      if(b.foundation||!b.p?.length||!name||seen.has(name)||/^(第?[\dA-Z]+[座號]?|BLOCK\s+[A-Z\d]+)$/i.test(name))continue;
      seen.add(name);buildings.push(b);
    }
    // Resolve frontage lazily. Footprint edge midpoints pick the side of the
    // building adjoining a street. Parking and routing use the same road anchor.
    const frontages=new Map();
    function frontage(b){
      if(frontages.has(b))return frontages.get(b);
      const edges=b.p.map((a,i)=>{const e=b.p[(i+1)%b.p.length];return {x:(a[0]+e[0])/2,z:(a[1]+e[1])/2,len:Math.hypot(a[0]-e[0],a[1]-e[1])};});
      const options=[];
      for(const edge of edges.sort((a,b)=>b.len-a.len).slice(0,4)){
        const p=sim.mapPoint(edge.x,edge.z,b.n||b.en,b.en||'');
        if(!p||p.anchor.distance>40||/(_link|motorway|trunk)/.test(p.anchor.road.cls)||p.anchor.road.bore)continue;
        const a=p.anchor,s=a.segment,side=(edge.x-a.x)*s.dz-(edge.z-a.z)*s.dx>=0?1:-1;
        // Separated carriageways were already selected by the footprint. For
        // two-way streets choose the direction with this kerb on the left.
        const dir=s.one||side,yaw=Math.atan2(s.dx*dir,-s.dz*dir);
        for(const offset of [Math.max(0,s.half-1.4),s.half*.3,0]){
          const x=a.x+s.dz*side*offset,z=a.z-s.dx*side*offset;
          if(!sim.canOccupy(x,z,yaw,s.layer))continue;
          options.push({...p,x,z,buildingId:b.id,yaw,layer:s.layer,score:Math.hypot(x-edge.x,z-edge.z)});break;
        }
      }
      const best=options.sort((a,b)=>a.score-b.score)[0]||null;
      frontages.set(b,best);return best;
    }
    const state={phase:'vacant',origin:null,target:null,wait:0,fare:0,metres:0,slow:0,fast:0};
    let due=0,lastOdo=0,lastTarget=null,retry=0,receiptAge=0;
    function targetFromHere(){
      const start=Math.min(buildings.length-1,Math.floor(random()*buildings.length));
      for(let i=0;i<buildings.length;i++){
        const b=buildings[(i+start)%buildings.length];
        if(b===lastTarget||Math.hypot(b.p[0][0]-car.x,b.p[0][1]-car.z)<180)continue;
        const p=frontage(b);
        if(p&&sim.previewRoute(p)){lastTarget=b;return p;}
      }
      return null;
    }
    function withinBay(bay){
      if(car.layer!==bay.layer)return false;
      const dx=car.x-bay.x,dz=car.z-bay.z,s=bay.anchor.segment;
      return Math.abs(dx*s.dx+dz*s.dz)<=9&&Math.abs(dx*s.dz-dz*s.dx)<=2.15;
    }
    function clear(){
      Object.assign(state,{phase:'vacant',origin:null,target:null,wait:0,fare:0,metres:0,slow:0,fast:0});
    }
    function nearDrop(){
      const p=state.target;if(!p||car.layer!==p.layer)return false;
      const s=p.anchor.segment,dx=car.x-p.x,dz=car.z-p.z;
      return Math.abs(dx*s.dx+dz*s.dz)<=11&&Math.abs(dx*s.dz-dz*s.dx)<=2.8;
    }
    function step(seconds){
      if(state.phase==='receipt'){
        receiptAge+=seconds;if(receiptAge<8)return;
        clear();
      }
      if(state.phase==='hired'){
        const delta=Math.max(0,car.odometer-lastOdo);lastOdo=car.odometer;
        state.metres+=delta;
        if(Math.abs(car.speed)*3.6<12)state.slow+=seconds;
        else state.fast+=delta;
        state.fare=fareCents(state.fast,state.slow);
        if(nearDrop()&&Math.abs(car.speed)<=stopped){
          state.phase='receipt';receiptAge=0;sim.cancelRoute();return 'complete';
        }
        retry-=seconds;
        if(retry<=0&&(!sim.route||(sim.route.arrived&&!nearDrop()))){sim.navigate(state.target);retry=3;}
        return;
      }
      const rank=Math.abs(car.speed)<=stopped&&stands.find(withinBay);
      if(!rank){if(state.phase==='waiting')clear();return;}
      if(state.phase!=='waiting'||rank!==state.origin){
        clear();state.origin=rank;
        state.target=targetFromHere();if(!state.target){clear();return;}
        // Rayleigh arrivals give an increasing conditional chance per second.
        due=Math.min(maxWaitSeconds,Math.max(1,38*Math.sqrt(-Math.log1p(-random()))));
        state.phase='waiting';
      }
      state.wait=Math.min(maxWaitSeconds,state.wait+seconds);
      if(state.wait>=due){
        if(!sim.navigate(state.target)){state.target=targetFromHere();if(!state.target||!sim.navigate(state.target))return;}
        state.phase='hired';state.fare=2900;lastOdo=car.odometer;retry=3;
        return 'pickup';
      }
    }
    return {state,stands,step,nearDrop,clear};
  }
  return {create,fareCents,maxWaitSeconds};
})();
