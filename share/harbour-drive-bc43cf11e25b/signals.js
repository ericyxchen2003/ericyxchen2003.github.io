/* OSM locates signalised roads. Stop lines, poles and junction timing are
   reconstructed for this simulation; the timing is independent of wall time. */
(function (global) {
  "use strict";
  const idOf = p => p[0] + "/" + p[1];
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const cell = (x, z) => Math.floor(x / 28) + "/" + Math.floor(z / 28);
  const dot = (a, b) => a.dx * b.dx + a.dz * b.dz;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const reach = 120;

  function create(map) {
    const incoming = new Map(), neighbours = new Map(), edges = [], heads = [], groups = [], corridors = new Map();
    const paint = map.pedestrianCrossings;
    const crossings = paint ? paint.filter(s=>s.kind==='yellow'||s.kind==='studs')
      : (map.nodes?.crossings || []).map(([x,z])=>({x,z}));
    function register(a, b, road) {
      const len = dist(a, b);
      if (len < .05) return;
      const dx = (b[0]-a[0])/len, dz = (b[1]-a[1])/len;
      const width = road.one ? road.w : road.w / 2, side = road.one ? 0 : road.w / 4;
      const e = { a, b, road, len, dx, dz, width, side };
      edges.push(e);
      const end = idOf(b);
      if (!incoming.has(end)) incoming.set(end, []);
      incoming.get(end).push(e);
      for (const [p, other] of [[a,b],[b,a]]) {
        const k = idOf(p);
        if (!neighbours.has(k)) neighbours.set(k, new Set());
        neighbours.get(k).add(idOf(other));
      }
    }
    for (const r of map.roads) {
      if (Number(r.l || 0) !== 0) continue;
      for (let i = 1; i < r.p.length; i++) {
        if (Number(r.one) !== -1) register(r.p[i-1],r.p[i],r);
        if (Number(r.one) !== 1) register(r.p[i],r.p[i-1],r);
      }
    }
    function before(e) {
      const options = incoming.get(idOf(e.a)) || [];
      let best, score = -Infinity;
      for (const v of options) {
        const alignment = dot(v, e);
        if (alignment < .25) continue;
        const value = alignment + ((v.road.en && v.road.en === e.road.en) ? .36 : 0) + (v.road.id === e.road.id ? .15 : 0);
        if (value > score) { best = v; score = value; }
      }
      return best;
    }
    function point(e, along, side = e.side) {
      return [e.a[0] + e.dx*along + e.dz*side, e.a[1] + e.dz*along - e.dx*side];
    }
    function upstream(e, along, metres) {
      for (let guard = 0; guard < 22 && metres > along; guard++) {
        metres -= along;
        const prev = before(e);
        if (!prev) return { e, along: 0 };
        e = prev; along = e.len;
      }
      return { e, along: Math.max(0,along-metres) };
    }

    // Exact road nodes determine the entering directions; a signal mapped
    // beside a footpath alone cannot create a new vehicle-controlled junction.
    const sites = [];
    const diagonals=map.diagonalCrossings || [], centres=new Set(diagonals.map(path=>idOf(path[1])));
    const signalPoints = new Map((map.nodes?.signals || []).map(p=>[idOf(p),p]));
    for(const path of diagonals)signalPoints.set(idOf(path[1]),path[1]);
    for (const p of signalPoints.values()) {
      const ends = incoming.get(idOf(p));
      if (ends?.length) sites.push({ p, ends, central: neighbours.get(idOf(p)).size > 2 });
    }
    const components = sites.map((_,i)=>i);
    function root(i) { while (i !== components[i]) i = components[i]; return i; }
    for (let i=0;i<sites.length;i++) for(let j=i+1;j<sites.length;j++) {
      if (dist(sites[i].p, sites[j].p) < 34) components[root(j)] = root(i);
    }
    const clusters = new Map();
    sites.forEach((s,i) => {
      const k = root(i);
      if (!clusters.has(k)) clusters.set(k,[]);
      clusters.get(k).push(s);
    });
    for (const cluster of clusters.values()) {
      const group = { id: groups.length, stages: [], offset: 0, slots: 0, cycle: 0 };
      const local = [];
      // A specifically mapped approach takes precedence over an additional
      // general signal node at the centre of the same junction.
      cluster.sort((a,b) => Number(a.central)-Number(b.central));
      for (const site of cluster) for (const edge of site.ends) {
        const p = site.p;
        let setback = site.central ? Math.max(6, edge.road.w*.5+2.1) : 1.6;
        let nearestCross = Infinity;
        for (const c of crossings) {
          if(c.dx!==undefined && Math.abs(dot(c,edge))<.74)continue;
          const vx = c.x-p[0], vz = c.z-p[1];
          const longitudinal = vx*edge.dx+vz*edge.dz, lateral = Math.abs(vx*edge.dz-vz*edge.dx);
          if (lateral > 1.6 || longitudinal < -13 || longitudinal > 4 || Math.abs(longitudinal) >= nearestCross) continue;
          nearestCross = Math.abs(longitudinal);
          const kerbSkew = c.skew===undefined?0:Math.abs(c.skew)*edge.road.w*.5;
          setback = Math.max(1.35, (paint?2.98:2.55) + kerbSkew - longitudinal);
        }
        const stop = upstream(edge, edge.len, setback);
        const e = stop.e, centre = point(e,stop.along), pole = point(e,stop.along+1.5,e.side+e.width/2+.62);
        const duplicate = local.some(h => {
          const vx = centre[0]-h.x, vz = centre[1]-h.z;
          return dot(e,h) > .82 && Math.abs(vx*h.dz-vz*h.dx) < (h.width+e.width)*.29+1.7 &&
            Math.abs(vx*h.dx+vz*h.dz) < 24;
        });
        if (duplicate) continue;
        const h = { id: heads.length, group: group.id, x: centre[0], z: centre[1], dx:e.dx, dz:e.dz,
          yaw:Math.atan2(e.dx,-e.dz), width:e.width, poleX:pole[0], poleZ:pole[1],
          roadName:e.road.n || e.road.en || "", roadEn:e.road.en || "", source:p, stage:0 };
        heads.push(h); local.push(h);
        let edgeBack=e, along=stop.along, covered=0;
        const seen = new Set();
        while (edgeBack && covered < reach && !seen.has(edgeBack)) {
          seen.add(edgeBack);
          const span = Math.min(along,reach-covered);
          if (span>.06) {
            const a = point(edgeBack,along-span), b = point(edgeBack,along);
            const half=edgeBack.width/2+.65;
            const segment = { a,b,dx:edgeBack.dx,dz:edgeBack.dz,len:span,downstream:covered,half,h };
            for(let x=Math.floor((Math.min(a[0],b[0])-half-1)/28);x<=Math.floor((Math.max(a[0],b[0])+half+1)/28);x++) {
              for(let z=Math.floor((Math.min(a[1],b[1])-half-1)/28);z<=Math.floor((Math.max(a[1],b[1])+half+1)/28);z++) {
                const k=x+"/"+z;if(!corridors.has(k))corridors.set(k,[]);corridors.get(k).push(segment);
              }
            }
            covered+=span;
          }
          edgeBack=before(edgeBack); along=edgeBack?.len || 0;
        }
      }
      // Parallel opposing approaches share a phase. Cross streets never
      // receive green simultaneously. A standalone crossing retains a
      // pedestrian interval even if no second vehicle approach was mapped.
      local.sort((a,b)=>b.width-a.width);
      for (const h of local) {
        let stage = group.stages.findIndex(s => s.every(other=>Math.abs(dot(h,other))>.72));
        if (stage < 0) { stage=group.stages.length;group.stages.push([]); }
        h.stage=stage;group.stages[stage].push(h);
      }
      const scramble=cluster.some(site=>centres.has(idOf(site.p)));
      group.slots=Math.max(2,group.stages.length+(scramble?1:0));
      group.cycle=group.slots*23;
      group.offset=(Math.abs(Math.round(cluster[0].p[0]*3+cluster[0].p[1]*5)) % group.cycle);
      groups.push(group);
    }
    // Start partway into the cycle, so the departure road demonstrates a stop and release.
    let clock=25;
    function timing(h) {
      const g=groups[h.group], local=(clock+g.offset+g.cycle-h.stage*23)%g.cycle;
      if (local<1.8) return ["redAmber",1.8-local];
      if (local<17.4) return ["green",17.4-local];
      if (local<20.4) return ["amber",20.4-local];
      return ["red",g.cycle-local];
    }
    function approach(x,z,yaw,range=72) {
      const fx=Math.sin(yaw), fz=-Math.cos(yaw);
      let best=null, score=Infinity;
      for (const s of corridors.get(cell(x,z))||[]) {
        const vx=x-s.a[0], vz=z-s.a[1], heading=fx*s.dx+fz*s.dz;
        if (heading<.68) continue;
        const along=vx*s.dx+vz*s.dz, lateral=Math.abs(vx*s.dz-vz*s.dx);
        if (along<-.7 || along>s.len+.7 || lateral>s.half) continue;
        const h=s.h, distance=s.downstream+s.len-clamp(along,0,s.len);
        if (distance>range) continue;
        // With a curved approach the vehicle can be across the infinitely
        // extended line far upstream. Check the half-plane only near the line.
        if(distance<14 && (x-h.x)*h.dx+(z-h.z)*h.dz>=0) continue;
        const rank=distance+.22*lateral+2*(1-heading);
        if(rank<score){best={head:h,distance};score=rank;}
      }
      if(best){const [phase,secondsLeft]=timing(best.head);best.phase=phase;best.secondsLeft=secondsLeft;}
      return best;
    }
    return { heads,groups,approach,step(dt){if(Number.isFinite(dt)&&dt>0)clock=(clock+dt)%1104000;},
      phaseFor(h){return timing(h)[0];}, secondsLeft(h){return timing(h)[1];} };
  }
  global.HKSignals={create};
})(typeof window==="object"?window:globalThis);
