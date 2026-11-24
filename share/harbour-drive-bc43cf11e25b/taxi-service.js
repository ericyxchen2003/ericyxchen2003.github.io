/* Stand detection, automatic dispatch and the two-rate Hong Kong urban taximeter. */
window.HKTaxiService=(()=>{
  'use strict';
  const stopped=.12;
  const earliestPickup=10; // Real seconds continuously stopped in the bay.
  const daytime={mean:20,max:60},overnight={mean:40,max:120};
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
    for(const [id,title,alias,en,,,roadId,layout] of HKTaxiRankRows){
      const road=map.roads.find(r=>r.id===roadId);
      if(!road||!layout)continue;
      const [index,along,side,offset]=layout,a=road.p[index-1],b=road.p[index];
      if(!a||!b)continue;
      const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const anchor=sim.nearestRoad(a[0]+(b[0]-a[0])*along/len,a[1]+(b[1]-a[1])*along/len,
        s=>s.road===road&&(s.forward||s.reverse));
      if(!anchor)continue;
      const s=anchor.segment,dir=s.one||side,yaw=Math.atan2(s.dx*dir,-s.dz*dir);
      const x=anchor.x+s.dz*side*offset,z=anchor.z-s.dx*side*offset;
      stands.push({id:'rank-'+id,name:title+'的士站',alias,en:en+' · Taxi Stand',x,z,anchor,yaw,side,offset,
        layer:s.layer,parking:{x,z,yaw,layer:s.layer}});
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
    const vacant={phase:'vacant',origin:null,target:null,wait:0,expectedWaitSeconds:0,fare:0,referenceFare:0,fine:0,metres:0,slow:0,fast:0};
    const state={...vacant};
    let arrivalFactor=0,lastOdo=0,lastTarget=null,retry=0,receiptAge=0;
    function dispatch(rank){
      const start=Math.min(buildings.length-1,Math.floor(random()*buildings.length));
      for(let i=0;i<buildings.length;i++){
        const b=buildings[(i+start)%buildings.length];
        if(b===lastTarget||Math.hypot(b.p[0][0]-car.x,b.p[0][1]-car.z)<180)continue;
        const p=frontage(b);
        if(!p)continue;
        const metres=sim.shortestRoadDistance(rank.anchor,p.anchor);
        if(metres===null||!sim.navigate(p,rank.anchor))continue;
        // At the 40/70 km/h limits the meter bills distance on every road.
        // With no waiting, the shortest legal route therefore minimizes the fare.
        state.referenceFare=Math.round(fareCents(metres,0)*1.5);
        state.target=p;lastTarget=b;return true;
      }
      return false;
    }
    function withinBay(bay){
      if(car.layer!==bay.layer)return false;
      const dx=car.x-bay.x,dz=car.z-bay.z,s=bay.anchor.segment;
      const lateral=(dx*s.dz-dz*s.dx)*bay.side,angle=car.yaw-bay.yaw;
      const through=s.road.w/2-s.road.w/(2*(s.road.lanes||1));
      const body=.94*Math.abs(Math.cos(angle))+2.4*Math.abs(Math.sin(angle));
      return Math.abs(dx*s.dx+dz*s.dz)<=2.2&&Math.abs(lateral)<=.45&&Math.abs(Math.cos(angle))>.95&&
        bay.offset+lateral-through>=body+1.29+.2;
    }
    function clear(){
      Object.assign(state,vacant);
    }
    function nearDrop(){
      const p=state.target;if(!p||car.layer!==p.layer)return false;
      const s=p.anchor.segment,dx=car.x-p.x,dz=car.z-p.z;
      return Math.abs(dx*s.dx+dz*s.dz)<=11&&Math.abs(dx*s.dz-dz*s.dx)<=2.8;
    }
    function step(seconds,gameMinutes=12*60){
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
          if(state.fare>state.referenceFare&&random()<.5)state.fine=20000;
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
        // One Rayleigh draw per visit. Its mean is one before scaling to
        // real seconds, so a change of shift can reuse the same draw.
        arrivalFactor=2/Math.sqrt(Math.PI)*Math.sqrt(-Math.log1p(-random()));
        state.phase='waiting';
      }
      const period=gameMinutes<6*60?overnight:daytime;
      state.expectedWaitSeconds=period.mean;
      const due=Math.min(period.max,earliestPickup+(period.mean-earliestPickup)*arrivalFactor);
      state.wait+=seconds;
      if(state.wait>=due){
        if(!dispatch(rank)){clear();return;}
        state.phase='hired';state.fare=2900;lastOdo=car.odometer;retry=3;
        return 'pickup';
      }
    }
    return {state,stands,step,nearDrop,clear};
  }
  return {create,fareCents,maxWaitSeconds:daytime.max,meanWaitSeconds:daytime.mean};
})();
