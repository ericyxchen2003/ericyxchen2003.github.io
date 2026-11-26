/* X is east, Z is south. Yaw is clockwise from geographic north. */
(function (global) {
  "use strict";
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const magnitude = Math.hypot;
  const key = (x, z) => x + "/" + z;
  // Full-throttle acceleration in m/s² at successive road speeds (km/h).
  // Both profiles use the same integrator for pedals, drag and steering.
  const speedBands = [0, 18, 40, 65, 90, 120];
  const handling = {
    comfort: {pull:[2.60,2.85,2.35,1.87,1.42,1.05], lift:.17, drag:.00036, brake:7.5},
    hybrid:  {pull:[3.35,3.25,2.48,1.72,1.30,.94], lift:.48, drag:.00042, brake:7.8}
  };
  function tractiveAcceleration(v, profile) {
    const kmh=v*3.6;
    let i=1;
    while(i<speedBands.length-1 && kmh>speedBands[i])i++;
    const t=clamp((kmh-speedBands[i-1])/(speedBands[i]-speedBands[i-1]),0,1);
    return profile.pull[i-1]+(profile.pull[i]-profile.pull[i-1])*t;
  }
  function pedalSpeed(v, dt, throttle, brake, handbrake, reverseAllowed, profile) {
    if (handbrake) v -= Math.sign(v) * Math.min(Math.abs(v), 12.5 * dt);
    else if (throttle && !brake) v += throttle * (v < 0 ? 7.5 : tractiveAcceleration(v, profile)) * dt;
    else if (brake) {
      if (v > 0.02) v = Math.max(0, v - profile.brake * brake * dt);
      else v = reverseAllowed ? v - 2.8 * brake * dt : 0;
    }
    const lift = v > 0 && !brake ? (1-throttle)*profile.lift*Math.min(1,v/2) : 0;
    const resistance = .14 + profile.drag*v*v + lift;
    v -= Math.sign(v) * Math.min(Math.abs(v), resistance * dt);
    return clamp(v, -4.5, 120 / 3.6);
  }
  // Flat-road figures for the garage, using the driving pedals and no reversing.
  function performanceFigures(id) {
    const profile = handling[id] ?? handling.comfort, dt = 1/90;
    function run(from, to, throttle, brake) {
      let speed=from/3.6, distance=0;
      for(let tick=1;tick<=90*120;tick++){
        speed=pedalSpeed(speed,dt,throttle,brake,false,false,profile);
        distance+=speed*dt;
        if(throttle ? speed>=to/3.6 : speed<=to/3.6) return {seconds:tick*dt,distance};
      }
      return {seconds:Infinity,distance:Infinity};
    }
    return {
      accelerationSeconds:run(0,50,1,0).seconds,
      brakingMetres:run(50,0,0,1).distance,
      coastingSeconds:run(50,30,0,0).seconds
    };
  }
  const CELL = 25;
  const levelBit = layer => 1 << (layer < 0 ? 15 - layer : layer);
  const L = 2.27;
  const W = 0.88;
  const mainRoads = new Set(["motorway", "trunk", "primary"]);
  // Game road limits in m/s, shared by route planning and ambient traffic.
  const roadSpeedLimit = road => (mainRoads.has(road.cls) ? 70 : 40) / 3.6;
  const corners = [[L, W], [L, -W], [-L, W], [-L, -W], [L, 0], [-L, 0], [0, W], [0, -W], [0, 0]];
  const locations = [
    ...(window.HKHungGuide?.places||[]),
    ...(window.HKCheungShaWanGuide?.places||[]),
    ...(window.HKShekKipMeiGuide?.places||[]),
    ...(window.HKShamShuiPoGuide?.places||[]),
    ...(window.HKKaiTakGuide?.places||[]),
    ...(window.HKKowloonTongGuide?.places||[]),
    ...(window.HKKowloonCityGuide?.places||[]),
    ...(window.HKToKwaWanGuide?.places||[]),
    ...(window.HKHoManTinGuide?.places||[]),
    ["salisbury", "半島酒店", "The Peninsula", 114.17156, 22.29474, "Salisbury Road"],
    ["ferry", "天星碼頭", "Star Ferry Pier", 114.169194, 22.294144, "Salisbury Road"],
    ["harbour", "海港城", "Harbour City", 114.16877, 22.29831, "Canton Road"],
    ["park", "九龍公園", "Kowloon Park", 114.17041, 22.29806, "Haiphong Road"],
    ["nathan", "彌敦道", "Nathan Road", 114.17227, 22.29821, "Nathan Road"],
    ["mody", "麼地道", "Mody Road", 114.17641, 22.29764, "Mody Road"],
    ["science", "香港科學館", "Science Museum", 114.178691, 22.301191, "Science Museum Road"],
    ["jordan","佐敦站","Jordan Station",114.17165,22.30522,"Nathan Road"],
    ["temple","廟街近街市街","Temple Street at Market Street",114.17071,22.30900,"Temple Street"],
    ["theatre","油麻地戲院","Yau Ma Tei Theatre",114.16941,22.31225,"Waterloo Road"],
    ["ymt","油麻地站","Yau Ma Tei Station",114.17076,22.31274,"Nathan Road"],
    ["gascoigne","加士居道天橋","Gascoigne Road Flyover",114.17365,22.30823,"Gascoigne Road Flyover"],
    ["qeh","伊利沙伯醫院","Queen Elizabeth Hospital",114.1741822,22.3081725,"Queen Elizabeth Hospital Road"],
    ["nightmarket","廟街夜市牌樓","Temple Street Night Market",114.1696895,22.3053281,"Jordan Road"],
    ["lands","土地審裁處","Lands Tribunal",114.1727267,22.3079919,"Gascoigne Road"],
    ["tinhau","油麻地天后廟","Tin Hau Temple",114.1704075,22.3101772,"Public Square Street"],
    ["redbrick","油麻地紅磚屋","Red Brick Building",114.1695245,22.3123444,"Shanghai Street"],
    ...(window.HKMongKok ? [
      ["langham","朗豪坊","Langham Place",114.16855,22.31830,"Shanghai Street"],
      ["ladies","女人街（登打士街口）","Ladies’ Market",114.17142,22.31570,"Dundas Street"],
      ["sneakers","波鞋街","Sneakers Street",114.17125,22.31825,"Fa Yuen Street"],
      ["electronics","西洋菜南街","Sai Yeung Choi Street South",114.17010,22.31760,"Sai Yeung Choi Street South"],
      ["computer","旺角電腦中心","Mong Kok Computer Centre",114.17109,22.31852,"Nelson Street"],
      ["sino","信和中心","Sino Centre",114.17002,22.31613,"Nathan Road"],
      ["mkbridge","旺角道行人天橋","Mong Kok Road Footbridge",114.16997,22.32092,"Mong Kok Road"],
      ["moko","MOKO 新世紀廣場","MOKO · Mong Kok East",114.17246,22.32225,"Luen Wan Street"],
      ["prince","太子站","Prince Edward Station",114.16810,22.32449,"Nathan Road"],
      ["goldfish","金魚街","Goldfish Market",114.16971,22.32320,"Tung Choi Street"],
      ["flower","花墟","Flower Market",114.17155,22.32565,"Flower Market Road"]
    ] : []),
    ...(window.HKTaiKokTsui ? [
      ["tkt-civic","大角咀市政大廈","Tai Kok Tsui Municipal Services Building",114.163022,22.322197,"Fuk Tsun Street"],
      ["olympic","奧運站","Olympic Station",114.160717,22.317689,"Sham Mong Road"],
      ["oc1","奧海城一期","Olympian City 1",114.158149,22.318874,"Hoi Fan Road"],
      ["oc2","奧海城二期","Olympian City 2",114.162662,22.316792,"Hoi Ting Road"],
      ["oc3","奧海城三期","Olympian City 3",114.164733,22.317286,"Hoi Ting Road"],
      ["metroharbour","港灣豪庭廣場","Metro Harbour Plaza",114.160071,22.324251,"Fuk Lee Street"],
      ["longbeach","浪澄灣","The Long Beach",114.156568,22.319364,"Hoi Fai Road"],
      ["silversea","一號銀海","One SilverSea",114.156658,22.317492,"Hoi Fai Road"]
    ] : []),
    ...(window.HKWestKowloon ? [
      ["palace","香港故宮文化博物館","Hong Kong Palace Museum",114.156187,22.301395,"Museum Drive"],
      ["mplus","M+ 博物館","M+ Museum",114.158944,22.302040,"Museum Drive"],
      ["artpark","藝術公園","Art Park",114.156170,22.301199,"Museum Drive"],
      ["westk-station","香港西九龍站","Hong Kong West Kowloon Station",114.166152,22.304427,"Wui Man Road"],
      ["union-square","環球貿易廣場","International Commerce Centre",114.160543,22.303698,"Station Perimeter Road South"],
      ["elements","圓方","Elements",114.162586,22.304517,"Station Perimeter Road East"],
      ["kowloon-station","九龍站","Kowloon Station",114.160676,22.305624,"Nga Cheung Road"],
      ["austin-station","柯士甸站","Austin Station",114.166404,22.304426,"Wui Cheung Road"]
    ] : []),
    ["gunclub","槍會山軍營（柯士甸道）","Gun Club Hill, Austin Road",114.1759192,22.3034769,"Austin Road"]
  ];

  class Grid {
    constructor() { this.cells = new Map(); }
    insert(object, lowX, lowZ, highX, highZ) {
      for (let x = Math.floor(lowX / CELL); x <= Math.floor(highX / CELL); x++) {
        for (let z = Math.floor(lowZ / CELL); z <= Math.floor(highZ / CELL); z++) {
          const address = key(x, z);
          if (!this.cells.has(address)) this.cells.set(address, []);
          this.cells.get(address).push(object);
        }
      }
    }
    at(x, z) { return this.cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) || []; }
  }

  function inRing(x, z, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > z) !== (b[1] > z) && x < a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])) inside = !inside;
    }
    return inside;
  }

  function project(s, x, z) {
    const along = clamp((x - s.a[0]) * s.dx + (z - s.a[1]) * s.dz, 0, s.len);
    const px = s.a[0] + along * s.dx, pz = s.a[1] + along * s.dz;
    return { x: px, z: pz, along, distance: magnitude(px - x, pz - z), segment: s, road: s.road };
  }

  // Small Dijkstra queue. Keeping the route graph at OSM node granularity
  // preserves shared junctions, divided carriageways and one-way streets.
  class Queue {
    constructor() { this.list = []; }
    push(id, cost) {
      let i = this.list.length;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (this.list[parent][1] <= cost) break;
        this.list[i] = this.list[parent]; i = parent;
      }
      this.list[i] = [id, cost];
    }
    pop() {
      const first = this.list[0], last = this.list.pop();
      if (this.list.length) {
        let i = 0;
        while (i * 2 + 1 < this.list.length) {
          let child = i * 2 + 1;
          if (child + 1 < this.list.length && this.list[child + 1][1] < this.list[child][1]) child++;
          if (last[1] <= this.list[child][1]) break;
          this.list[i] = this.list[child]; i = child;
        }
        this.list[i] = last;
      }
      return first;
    }
  }

  // Oriented rectangle separating-axis test shared by player and traffic.
  function intersects(x, z, yaw, hl, hw, other) {
    const dx = other.x - x, dz = other.z - z, ol = other.halfLength || L, ow = other.halfWidth || W;
    const max = hl + ol + 1;
    if (dx * dx + dz * dz > max * max) return false;
    const f = Math.sin(yaw), g = -Math.cos(yaw), u = Math.sin(other.yaw), v = -Math.cos(other.yaw);
    const same = Math.abs(f * u + g * v), cross = Math.abs(g * u - f * v);
    return Math.abs(dx * f + dz * g) <= hl + ol * same + ow * cross &&
      Math.abs(dz * f - dx * g) <= hw + ol * cross + ow * same &&
      Math.abs(dx * u + dz * v) <= ol + hl * same + hw * cross &&
      Math.abs(dz * u - dx * v) <= ow + hl * cross + hw * same;
  }

  // A turn can span both halves of a divided junction. Keep the longest suffix
  // of the travelled edges that can still complete a mapped restriction.
  function turnRules(data) {
    const keys = new Map((data?.keys || []).map((k, i) => [k, i]));
    const states = [];
    function addState() {
      states.push({ next: new Map(), fail: 0, deny: 0 });
      return states.length - 1;
    }
    addState();
    for (const [mask, ...edges] of data?.bans || []) {
      let state = 0;
      for (const edge of edges) {
        if (!states[state].next.has(edge)) states[state].next.set(edge, addState());
        state = states[state].next.get(edge);
      }
      states[state].deny |= mask;
    }
    const queue = [...states[0].next.values()];
    function follow(state, token) {
      while (state && !states[state].next.has(token)) state = states[state].fail;
      return states[state].next.get(token) || 0;
    }
    for (let i = 0; i < queue.length; i++) {
      const parent = states[queue[i]];
      for (const [token, child] of parent.next) {
        const fail = follow(parent.fail, token);
        states[child].fail = fail;
        states[child].deny |= states[fail].deny;
        queue.push(child);
      }
    }
    return {
      token: (road, index) => keys.get(road.id + ':' + index),
      access: road => data?.access?.[road.id] || 0,
      advance(state, token, vehicle) {
        if (token === undefined) return 0;
        const next = follow(state, token);
        return states[next].deny & vehicle ? -1 : next;
      }
    };
  }

  function create(map, groundHeight) {
    const segments = [], nodes = [], nodeIDs = new Map();
    const edges = [], rules = turnRules(map === global.HKMAP ? global.HKTurnData : map.turnData);
    const ground = [...(map.land || []), ...(map.piers || [])];
    // These decks have independently fitted rims on the two sides of their median.
    const deckConnections = new Map(map.roads.filter(r => r.medianRail).map(r => [r.id, new Set([r.id])]));
    let traffic = [];
    const roadsGrid = new Grid(), wallsGrid = new Grid(), transitions = new Grid();
    function nodeFor(point) {
      const address = key(point[0], point[1]);
      if (!nodeIDs.has(address)) {
        nodeIDs.set(address, nodes.length);
        nodes.push({ point, edges: [], levels: 0, half: 0 });
      }
      return nodeIDs.get(address);
    }
    for (const road of map.roads) {
      if (!(road.p && road.p.length > 1) || (Number(road.l) < 0 && !road.underpass)) continue;
      const half = Math.max(1.6, Number(road.w || 6) / 2);
      const speedLimit = roadSpeedLimit(road);
      for (let i = 1; i < road.p.length; i++) {
        const a = road.p[i - 1], b = road.p[i];
        const vx = b[0] - a[0], vz = b[1] - a[1], len = magnitude(vx, vz);
        if (len < 0.04) continue;
        const start = nodeFor(a), end = nodeFor(b), one = Number(road.one || 0);
        const layer = Number(road.l) || 0, bit = levelBit(layer);
        const s = { a, b, start, end, len, half, dx: vx / len, dz: vz / len, road, one, layer, bit, speedLimit };
        for (const node of [nodes[start], nodes[end]]) {
          node.levels |= bit; node.half = Math.max(node.half, half);
        }
        function connect(from, to, index) {
          const edge = { id: edges.length, from, to, segment: s, token: rules.token(road, index) };
          edges.push(edge);
          nodes[from].edges.push(edge);
          return edge;
        }
        if (!(rules.access(road) & 1)) {
          if (one !== -1) s.forward = connect(start, end, i);
          if (one !== 1) s.reverse = connect(end, start, -i);
        }
        segments.push(s);
        const pad = half + 3;
        roadsGrid.insert(s, Math.min(a[0], b[0]) - pad, Math.min(a[1], b[1]) - pad,
          Math.max(a[0], b[0]) + pad, Math.max(a[1], b[1]) + pad);
      }
    }
    if (!segments.length) throw Error("Map contains no drivable roads.");
    for (const road of map.roads) {
      const connected = deckConnections.get(road.id);
      if (!connected) continue;
      for (const [x,z] of road.p) {
        for (const s of roadsGrid.at(x,z)) {
          if ((s.a[0]===x && s.a[1]===z) || (s.b[0]===x && s.b[1]===z)) connected.add(s.road.id);
        }
      }
    }
    for (const n of nodes) {
      if ((n.levels & (n.levels - 1)) === 0) continue;
      const [x, z] = n.point, reach = n.half + L + 2;
      const incident=roadsGrid.at(x,z).filter(s=>(s.a[0]===x&&s.a[1]===z)||(s.b[0]===x&&s.b[1]===z));
      transitions.insert({ x, z, reach, mask: n.levels, incident }, x - reach, z - reach, x + reach, z + reach);
    }
    const detail=map===globalThis.HKMAP?globalThis.HKDetails:null;
    const structures=[...(map.buildings||[]),...(detail?.parkSolids || [])];
    if(map===global.HKMAP&&global.HKMongKokPlaces){
      const rect=(x,z,a,w,d)=>[[-w,-d],[w,-d],[w,d],[-w,d]].map(([u,v])=>[x+u*Math.cos(a)-v*Math.sin(a),z+u*Math.sin(a)+v*Math.cos(a)]);
      for(const [x,z,a] of HKMongKokPlaces.stalls)structures.push({p:rect(x,z,a,1.36,.74),h:2.28});
      for(const b of HKMongKokPlaces.bridges)for(const [x,z] of b.posts)structures.push({p:rect(x,z,0,.45,.45),h:5.5});
      for(const m of HKMongKokPlaces.mouths)structures.push({...m,h:1});
    }
    for(const [x,z,deck,angle,width] of map.terrain?.relief?.piers||[]){
      if(!groundHeight)continue;
      const base=groundHeight(x,z)-.18,cap=deck-.78;
      if(cap-base-.48<1.1)continue;
      const rect=(w,d)=>[[-w,-d],[w,-d],[w,d],[-w,d]].map(([u,v])=>[x+u*Math.cos(angle)+v*Math.sin(angle),z-u*Math.sin(angle)+v*Math.cos(angle)]);
      structures.push({p:rect(.58,.75),basePD:base,top:cap-.48},{p:rect(.69,width/2),base:3,basePD:cap-.48,top:cap+.12});
    }
    for (const b of structures) {
      if (!(b.p && b.p.length >= 3)) continue;
      let xmin = Infinity, zmin = Infinity, xmax = -Infinity, zmax = -Infinity;
      for (const [x, z] of b.p) {
        xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
        zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
      }
      const reach = magnitude(L, W);
      const base=Number(b.base)||0;
      const center=b.p.reduce((sum,p)=>[sum[0]+p[0],sum[1]+p[1]],[0,0]);
      const ground=groundHeight?groundHeight(center[0]/b.p.length,center[1]/b.p.length):0;
      const bottom=(groundHeight?(b.basePD??b.modelBasePD):null)??(ground+base);
      const top=(groundHeight?b.top:null)??(bottom+(b.h||10));
      wallsGrid.insert({ b, xmin, zmin, xmax, zmax, bottom, top }, xmin - reach, zmin - reach, xmax + reach, zmax + reach);
    }
    function nearestRoad(x, z, filter) {
      const local = roadsGrid.at(x, z);
      const list = filter || !local.length ? segments : local;
      let best = null;
      for (const s of list) {
        if (filter && !filter(s)) continue;
        const hit = project(s, x, z);
        if (!best || hit.distance < best.distance) best = hit;
      }
      return best;
    }
    function levelsAt(x, z, layer) {
      const base = levelBit(layer);
      let mask = base;
      for (const n of transitions.at(x, z)) {
        if ((n.mask & base) && (x - n.x) ** 2 + (z - n.z) ** 2 <= n.reach ** 2) mask |= n.mask;
      }
      return mask;
    }
    function roadAtLevel(x, z, mask, onPavement = false) {
      let best = null;
      for (const s of roadsGrid.at(x, z)) {
        if (!(mask & s.bit)) continue;
        const hit = project(s, x, z);
        if (onPavement && hit.distance > s.half + .28) continue;
        if (!best || hit.distance < best.distance) best = hit;
      }
      return best;
    }
    function drivingLayer(x, z, levels) {
      const layer = state.layer, currentBit = levelBit(layer);
      if (levels === currentBit) return layer;
      const next = roadAtLevel(x, z, levels);
      if (!next || next.segment.layer === layer || next.distance > next.segment.half + .28) return layer;
      // At an angled fork the rear wheels can still be on the narrow
      // incoming lane after the centre has cleared its last cross-section.
      const from = roadAtLevel(state.x, state.z, currentBit, true) ??
        roadAtLevel(state.x, state.z, currentBit);
      if (!from || from.distance > from.segment.half + L) return layer;

      // Nearby ramp mouths can overlap an unrelated street in plan view.
      // The taxi must move onto the outgoing arm of its own junction.
      const target = next.segment;
      const joined = transitions.at(x,z).some(node => {
        if (!node.incident.includes(from.segment) || !node.incident.includes(target) ||
            (x-node.x)**2 + (z-node.z)**2 > node.reach**2) return false;
        const sign = target.a[0] === node.x && target.a[1] === node.z ? 1 : -1;
        return sign * ((x-state.x)*target.dx + (z-state.z)*target.dz) > 0 &&
          sign * ((x-node.x)*target.dx + (z-node.z)*target.dz) > 0;
      });
      if (!joined) return layer;
      if (groundHeight?.surface) {
        const oldY = groundHeight.surface(state.x, state.z, layer, from.road.id);
        const newY = groundHeight.surface(x, z, target.layer, target.road.id);
        // Each tick travels at most 0.38 m. Allow crossfall and small
        // differences between the two sampled surfaces at a real landing.
        if (Math.abs(newY - oldY) > 1) return layer;
      }
      return target.layer;
    }
    function pavementAt(x, z, mask, connected) {
      for (const s of roadsGrid.at(x, z)) {
        if (!(mask & s.bit)) continue;
        if (connected && !connected.has(s.road.id)) continue;
        if (s.road.fork) {
          if (inRing(x,z,s.road.fork.outline)) return true;
          continue;
        }
        const along = clamp((x - s.a[0]) * s.dx + (z - s.a[1]) * s.dz, 0, s.len);
        const ex = x - s.a[0] - along * s.dx, ez = z - s.a[1] - along * s.dz;
        const gap2 = ex * ex + ez * ez;
        if (gap2 > (s.half + .28) ** 2) continue;
        if (s.road.medianRail && groundHeight?.deckEdge) {
          const side = s.dx * ez - s.dz * ex;
          const rim = groundHeight.deckEdge(x-ex,z-ez,s.road.id,side,s.half+.43);
          if (gap2 > (rim - .42) ** 2) continue; // inner face of the concrete rail
        }
        return true;
      }
      return false;
    }
    function touchesCar(ring, x, z, fx, fz) {
      // Clip each footprint edge to the car's rectangle in vehicle coordinates.
      // This catches thin corners and pillars between the tyre contact patches.
      let ex = ring.at(-1)[0] - x, ez = ring.at(-1)[1] - z;
      let a = ex * fx + ez * fz, b = ez * fx - ex * fz;
      for (const point of ring) {
        ex = point[0] - x; ez = point[1] - z;
        const c = ex * fx + ez * fz, d = ez * fx - ex * fz;
        if (Math.max(a, c) >= -L && Math.min(a, c) <= L &&
            Math.max(b, d) >= -W && Math.min(b, d) <= W) {
          // Separating axis normal to the edge. The other two axes are the
          // longitudinal and lateral rectangle axes checked just above.
          const u = c - a, v = d - b;
          if (Math.abs(a * v - b * u) <= L * Math.abs(v) + W * Math.abs(u)) return true;
        }
        a = c; b = d;
      }
      return false;
    }
    function supportedGround(x, z) {
      if (detail?.isPond(x,z)) return false;
      if (!map.land && !map.piers) return true;
      return ground.some(area => inRing(x, z, area.p) &&
        !(area.holes || []).some(hole => inRing(x, z, hole)));
    }
    function obstructed(x, z, yaw, layer = 0, levels = levelBit(layer), keepToRoad = layer !== 0, checkDeck = true) {
      if (global.HKWestTunnels?.hitsWall(x,z,yaw,layer,groundHeight,L,W)) return "barrier";
      let connected;
      if (layer > 0 && keepToRoad && checkDeck && roadsGrid.at(x,z).some(s => s.road.medianRail)) {
        const owner = roadAtLevel(x,z,levelBit(layer));
        connected = deckConnections.get(owner?.road.id);
      }
      const fx = Math.sin(yaw), fz = -Math.cos(yaw);
      for (const [longitudinal, lateral] of corners) {
        const cx = x + fx * longitudinal - fz * lateral;
        const cz = z + fz * longitudinal + fx * lateral;
        if (map.bounds && (cx < map.bounds[0] || cz < map.bounds[1] ||
            cx > map.bounds[2] || cz > map.bounds[3] || map.outsideExtension?.(cx,cz))) return "boundary";
        if ((layer===0 && levels===1 && global.HKNorthWorks?.blocked(cx,cz)) || groundHeight?.underpass?.blocks(cx,cz,layer)) return "barrier";
        if (keepToRoad) {
          if (checkDeck && !pavementAt(cx, cz, levels, connected)) return "deck";
        } else if (!supportedGround(cx, cz) && !((levels & ~1) && pavementAt(cx, cz, levels & ~1))) {
          return "water";
        }
        if(layer>=0 && groundHeight?.overhead){
          for(let upper=layer+1;upper<=(groundHeight.maxLayer||2);upper++){
            if(levels&(1<<upper))continue;
            const overhead=groundHeight.overhead(cx,cz,upper);
            if(overhead===undefined)continue;
            const floor=groundHeight.surface(cx,cz,layer);
            if(overhead-floor<2.4&&overhead>=floor-.15&&!(levelsAt(cx,cz,layer)&(1<<upper)))return "headroom";
          }
        }
      }
      const rx = Math.abs(fx) * L + Math.abs(fz) * W, rz = Math.abs(fz) * L + Math.abs(fx) * W;
      for (const { b, xmin, zmin, xmax, zmax, bottom, top } of wallsGrid.at(x, z)) {
        if (x + rx < xmin || x - rx > xmax || z + rz < zmin || z - rz > zmax) continue;
        // The renderer extends ground-level walls down to the local terrain.
        // A raised storey is passable only when the taxi fits underneath it.
        const base = Number(b.base) || 0;
        const floor = groundHeight?.surface?.(x,z,layer) ?? (layer*4.4+(groundHeight?groundHeight(x,z):0));
        if (((base > 2 || layer < 0) && bottom >= floor + 2) || top < floor) continue;
        if (touchesCar(b.p, x, z, fx, fz) || (b.holes || []).some(h => touchesCar(h, x, z, fx, fz))
          || (inRing(x, z, b.p) && !(b.holes || []).some(h => inRing(x, z, h)))) return "building";
      }
      return "";
    }

    const state = {
      x: 0, z: 0, yaw: 0, speed: 0, steer: 0, roadName: "", roadEn: "", gear: "D",
      odometer: 0, collision: false, collisionKind: "", layer: 0
    };
    const places = [], snaps = new Map();
    for (const [id, name, en, lng, lat, street] of locations) {
      const x = (lng - 114.17) * 103055, z = (22.296 - lat) * 110741;
      const snap = nearestRoad(x, z, s => (s.forward || s.reverse) && (s.road.en || s.road.n) === street) || nearestRoad(x, z);
      places.push({ id, name, en, x: snap.x, z: snap.z });
      snaps.set(id, snap);
    }

    let route = null, routeLengths = [], routeProgress = 0, rerouteTime = 0;
    let collisionTime = 0, reverseDelay = 0, streetTimer = 0, deckBlockedTime = 0;
    function updateStreet() {
      const hit = roadAtLevel(state.x, state.z, levelBit(state.layer));
      state.roadName = hit?.road.n || hit?.road.en || "無名道路";
      state.roadEn = hit?.road.en || "";
    }

    function mapPoint(x,z,name,en,street){
      const hit=nearestRoad(x,z,s=>(s.forward||s.reverse)&&(!street||(s.road.en||s.road.n)===street)&&
        (street||(!s.layer&&!['motorway','motorway_link','trunk','trunk_link'].includes(s.road.cls))));
      if(!hit||hit.distance>(street?Infinity:180))return null;
      return {name,en,x:hit.x,z:hit.z,anchor:hit};
    }
    function reset(id = "salisbury") {
      const anchor = (typeof id === "object" ? id?.anchor || snaps.get(id?.id) : snaps.get(id)) || snaps.get("salisbury");
      const s = anchor.segment, direction = s.one || (s.dx >= 0 ? 1 : -1);
      const fx = s.dx * direction, fz = s.dz * direction, yaw = Math.atan2(fx, -fz);
      const lanes = Math.max(1, Number(s.road.lanes) || (s.one ? 1 : 2));
      const offset = Math.max(0, Math.min(s.half - 1.15, s.half * (1 - 1 / lanes)));
      const bay=typeof id==="object"&&id.parking;
      let position=bay?[bay.x,bay.z]:null;
      for (const delta of [0, 3, -3, 8, -8, 15, -15]) {
        if(position)break;
        const along = clamp(anchor.along + delta, 0, s.len);
        for (const side of [offset, offset * 0.65, 0]) {
          const x = s.a[0] + along * s.dx + side * fz, z = s.a[1] + along * s.dz - side * fx;
          if (!obstructed(x, z, yaw, s.layer)) { position = [x, z]; break; }
        }
        if (position) break;
      }
      position ||= [anchor.x, anchor.z];
      Object.assign(state, { x: position[0], z: position[1], yaw:bay?bay.yaw:yaw, speed: 0, steer: 0,
        gear: "D", odometer: 0, collision: false, collisionKind: "", layer: s.layer });
      route = null; collisionTime = 0; reverseDelay = 0; streetTimer = 0; deckBlockedTime = 0;
      updateStreet();
      return state;
    }

    const travelSeconds = (metres, segment) => metres / segment.speedLimit;
    const roadMetres = metres => metres;
    function findPath(from, to, costOf = travelSeconds) {
      const s = from.segment, t = to.segment;
      const costAt = new Map(), parent = new Map(), queue = new Queue();
      const stride = edges.length + nodes.length;
      let best = Infinity, last = -1, tail = null, direct = false;
      function offer(key, cost, prev) {
        if (cost >= (costAt.get(key) ?? Infinity)) return;
        costAt.set(key, cost); parent.set(key, prev); queue.push(key, cost);
      }
      function start(edge, metres) {
        if (edge) offer(rules.advance(0, edge.token, 1) * stride + edge.id, costOf(metres, s), -1);
      }
      if (from.along < .001) offer(edges.length + s.start, 0, -1);
      if (s.len - from.along < .001) offer(edges.length + s.end, 0, -1);
      start(s.forward, s.len - from.along); start(s.reverse, from.along);
      if (s === t && (to.along >= from.along ? s.forward : s.reverse)) {
        best = costOf(Math.abs(to.along - from.along), s); direct = true;
      }
      while (queue.list.length) {
        const [key, cost] = queue.pop();
        if (cost >= best) break;
        if (cost !== costAt.get(key)) continue;
        const id = key % stride, prev = edges[id], node = prev ? prev.to : id - edges.length;
        const state = Math.floor(key / stride), outgoing = nodes[node].edges;
        if ((node === t.start && to.along < .001) || (node === t.end && t.len - to.along < .001)) {
          best = cost; last = key; tail = null; direct = false; break;
        }
        for (const edge of outgoing) {
          // Shape vertices are not turning facilities. Allow reversal at a dead end.
          if (prev && prev.segment === edge.segment && outgoing.length > 1) continue;
          const nextState = rules.advance(state, edge.token, 1);
          if (nextState < 0) continue;
          if (edge.segment === t) {
            const final = cost + costOf(edge === t.forward ? to.along : t.len - to.along, t);
            if (final < best) { best = final; last = key; tail = edge; direct = false; }
          }
          const next = cost + costOf(edge.segment.len, edge.segment);
          if (next < best) offer(nextState * stride + edge.id, next, key);
        }
      }
      if (!Number.isFinite(best)) return null;
      const points = [[from.x, from.z]], layers = [], forkTurns = {};
      function append(point, segment) {
        const p = points.at(-1);
        if (magnitude(point[0] - p[0], point[1] - p[1]) < .001) return;
        const fork = segment.road.fork;
        if (fork) {
          const along = q => ((q[0]-segment.a[0])*segment.dx+(q[1]-segment.a[1])*segment.dz)/segment.len;
          const start = along(p), end = along(point);
          const middle = ([a,b]) => [(a[0]+b[0])/2,(a[1]+b[1])/2];
          if (start < .0001) {
            forkTurns[points.length-1] = fork.turn;
            if (points.length>1) points[points.length-1] = middle(fork.rows[0]);
          }
          for (let i=1; i<fork.rows.length-1; i++) {
            const t = i/(fork.rows.length-1);
            if (t>start && t<end) {points.push(middle(fork.rows[i])); layers.push(segment.layer);}
          }
        }
        points.push(point); layers.push(segment.layer);
      }
      if (!direct) {
        const steps = [];
        for (let key = last; key >= 0; key = parent.get(key)) {
          const edge = edges[key % stride];
          if (edge) steps.push(edge);
        }
        for (const edge of steps.reverse()) append(nodes[edge.to].point, edge.segment);
      }
      append([to.x, to.z], tail?.segment || t);
      return { points, layers, forkTurns, cost: best };
    }

    function shortestRoadDistance(from,to) {
      return findPath(from,to,roadMetres)?.cost ?? null;
    }
    function currentRoadAnchor() {
      return roadAtLevel(state.x,state.z,levelBit(state.layer)) ||
        nearestRoad(state.x,state.z,s=>s.layer===state.layer);
    }
    function previewRoute(id, startAnchor) {
      const target=typeof id==='object'?id:places.find(p=>p.id===id);
      const destination=target?.anchor||snaps.get(target?.id);
      if(!destination)return null;
      const origin=startAnchor||currentRoadAnchor()||nearestRoad(state.x,state.z);
      const path=findPath(origin,destination);
      return path?{...path,target,layer:destination.segment.layer}:null;
    }
    function navigate(id, startAnchor) {
      const path=previewRoute(id,startAnchor);
      if(!path){route=null;return null;}
      const target=path.target;
      const { points, layers } = path;
      routeProgress = 0; rerouteTime = 0; routeLengths = [0];
      for (let i = 1; i < points.length; i++) {
        routeLengths.push(routeLengths[i - 1] + magnitude(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
      }
      const total = routeLengths.at(-1);
      route = { target, destinationLayer:path.layer, points, layers, forkTurns:path.forkTurns, total, remaining: total, arrived: false, progress: 0, nextTurn: "straight", turnDistance: total };
      updateRoute(0);
      return route;
    }

    function updateRoute(dt) {
      if (!route || route.arrived) return;
      const { points, target } = route;
      let nearest = Infinity, progress = 0, score = Infinity, index = 0;
      for (let i = 1; i < points.length; i++) {
        if (route.layers[i - 1] !== state.layer) continue;
        const a = points[i - 1], b = points[i], len = routeLengths[i] - routeLengths[i - 1];
        if (len === 0) continue;
        const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
        const t = clamp((state.x - a[0]) * dx + (state.z - a[1]) * dz, 0, len);
        const distance = magnitude(a[0] + dx * t - state.x, a[1] + dz * t - state.z);
        const along = routeLengths[i - 1] + t;
        const continuityPenalty = Math.max(0, Math.abs(along - routeProgress) - 22) * 0.13;
        if (distance + continuityPenalty < score) {
          nearest = distance; progress = along; score = distance + continuityPenalty; index = i;
        }
      }
      // Keep the last measured distance while off route or between layers.
      // Projecting onto an unrelated segment can jump back to the start.
      if (route.total > 0 && nearest > 23) {
        rerouteTime += dt;
        if (rerouteTime > 1.2) navigate(target);
        return;
      }
      rerouteTime = 0;
      routeProgress = progress;
      route.remaining = Math.max(0, route.total - progress);
      route.progress = route.total ? progress / route.total : 1;
      if (magnitude(state.x - target.x, state.z - target.z) < 9 && route.remaining < 16 && state.layer === route.destinationLayer) {
        route.arrived = true; route.remaining = 0; route.progress = 1; route.nextTurn = "arrive"; route.turnDistance = 0;
        return;
      }
      route.nextTurn = "arrive"; route.turnDistance = route.remaining;
      for (let i = Math.max(1, index); i < points.length - 1; i++) {
        const a = points[i - 1], b = points[i], c = points[i + 1];
        const u = Math.atan2(b[0] - a[0], a[1] - b[1]), v = Math.atan2(c[0] - b[0], b[1] - c[1]);
        const turn = Math.atan2(Math.sin(v - u), Math.cos(v - u));
        if (routeLengths[i] >= progress + 1 && route.forkTurns[i]) {
          route.nextTurn = route.forkTurns[i]; route.turnDistance = routeLengths[i] - progress; break;
        }
        if (Math.abs(turn) > 0.62 && routeLengths[i] >= progress + 1) {
          route.nextTurn = Math.abs(turn) > 2.6 ? "u-turn" : turn > 0 ? "right" : "left";
          route.turnDistance = routeLengths[i] - progress;
          break;
        }
      }
    }

    function trafficOverlap(x,z,yaw,layer,other,halfLength=L,halfWidth=W,bodyHeight=1.75){
      if(!intersects(x,z,yaw,halfLength,halfWidth,other))return false;
      const otherLayer=other.layer||0;
      if(layer===otherLayer)return true;
      if(!groundHeight?.surface)return false;
      const playerY=groundHeight.surface(x,z,layer),otherY=groundHeight.surface(other.x,other.z,otherLayer);
      return playerY<otherY+(other.kind==='bus'?4.45:1.75)&&otherY<playerY+bodyHeight;
    }
    // If neither gear can clear an edge, straighten the taxi on this same span.
    // Check the body throughout the correction, including stationary traffic.
    function freeDeckEdge(direction) {
      const {x,z,yaw,layer} = state, bit = levelBit(layer);
      const backX=x-direction*.10*Math.sin(yaw), backZ=z+direction*.10*Math.cos(yaw);
      if (obstructed(backX,backZ,yaw,layer,levelsAt(backX,backZ,layer)) !== 'deck') return;
      const hit=roadAtLevel(x,z,bit);
      // On a fork the graph centreline can be on the other side of the nose.
      if (!hit || hit.segment.road.fork || hit.distance > hit.segment.half + W) return;
      const s=hit.segment, forward=Math.sin(yaw)*s.dx-Math.cos(yaw)*s.dz>=0?1:-1;
      const roadYaw=Math.atan2(s.dx*forward,-s.dz*forward);
      const turn=Math.atan2(Math.sin(roadYaw-yaw),Math.cos(roadYaw-yaw));
      const limit=Math.min(hit.distance,2*W+.25);
      for(let shift=0; ; shift=Math.min(shift+.20,limit)){
        const t=hit.distance?shift/hit.distance:0, dx=(hit.x-x)*t, dz=(hit.z-z)*t;
        const tx=x+dx,tz=z+dz;
        if (!obstructed(tx,tz,roadYaw,layer,bit)) {
          const steps=Math.max(1,Math.ceil((shift+L*Math.abs(turn))/.20));
          for(let i=0;i<=steps;i++){
            const u=i/steps, px=x+dx*u,pz=z+dz*u,angle=yaw+turn*u;
            if(obstructed(px,pz,angle,layer,bit,true,false) ||
              traffic.some(other=>trafficOverlap(px,pz,angle,layer,other))) return;
          }
          Object.assign(state,{x:tx,z:tz,yaw:roadYaw,steer:0});
          collisionTime=0;state.collisionKind='';
          return;
        }
        if(shift>=limit) return;
      }
    }
    function substep(dt, inputs) {
      const throttle = clamp(Number(inputs.throttle || 0), 0, 1), brake = clamp(Number(inputs.brake || 0), 0, 1);
      const steerInput = clamp(Number(inputs.right || 0) - Number(inputs.left || 0), -1, 1);
      const handbrake = Boolean(inputs.handbrake);
      const speed = Math.abs(state.speed);
      const profile = handling[state.vehicle?.id] ?? handling.comfort;
      state.driveDemand = brake && state.speed>0 ? -2*brake : throttle || (speed>1 ? -.12 : 0);
      const desired = steerInput * (0.62 / (1 + speed * 0.09));
      const steeringRate = steerInput ? 1.24 / (1 + Math.min(0.30, speed * 0.017)) : 2.6;
      state.steer += clamp(desired - state.steer, -steeringRate * dt, steeringRate * dt);
      const v = pedalSpeed(state.speed,dt,throttle,brake,handbrake,reverseDelay<=0,profile);
      if (!handbrake) {
        if (!brake) reverseDelay=0;
        else if (state.speed>0.02) reverseDelay=.30;
        else if (reverseDelay>0) reverseDelay-=dt;
      }
      if (v === 0) { state.speed = 0; deckBlockedTime=0; return; }
      const yawRate = v / 2.68 * Math.tan(state.steer);
      const newYaw = state.yaw + clamp(yawRate, -1.72, 1.72) * dt;
      const middle = (state.yaw + newYaw) / 2;
      const x = state.x + Math.sin(middle) * v * dt, z = state.z - Math.cos(middle) * v * dt;
      const levels = levelsAt(x, z, state.layer);
      const layer = drivingLayer(x, z, levels);
      const obstacle = obstructed(x, z, newYaw, layer, levels)
        || (traffic.some(other=>trafficOverlap(x,z,newYaw,layer,other)) ? "traffic" : "");
      if (obstacle) {
        state.speed = 0;
        if (Math.abs(v) > 0.35 || !collisionTime) { collisionTime = 0.65; state.collisionKind = obstacle; }
        if(obstacle==='deck' && state.layer>0 && (throttle||brake) && speed<.1){
          deckBlockedTime+=dt;
          if(deckBlockedTime>=.4){deckBlockedTime=0;freeDeckEdge(Math.sign(v));}
        }else deckBlockedTime=0;
        return;
      }
      deckBlockedTime=0;
      Object.assign(state, { x, z, yaw: Math.atan2(Math.sin(newYaw), Math.cos(newYaw)), speed: v, layer });
      state.odometer += Math.abs(v * dt);
      state.gear = v < -0.01 ? "R" : "D";
    }

    function step(dt, inputs = {}) {
      const elapsed = clamp(Number(dt) || 0, 0, 0.15);
      const count = Math.ceil(elapsed * 90);
      for (let i = 0; i < count; i++) substep(elapsed / count, inputs);
      collisionTime = Math.max(0, collisionTime - elapsed);
      state.collision = collisionTime > 0;
      if (!state.collision) state.collisionKind = "";
      streetTimer -= elapsed;
      if (streetTimer <= 0) { updateStreet(); streetTimer = 0.15; }
      updateRoute(elapsed);
      return state;
    }
    reset();
    return { state, places, step, reset, nearestRoad, currentRoadAnchor, mapPoint, shortestRoadDistance, previewRoute, navigate, trafficOverlap, rules,
      // Ambient traffic still follows the carriageway through bends and junctions.
      canOccupy(x, z, yaw, layer = 0, onCarriageway = true) { return !obstructed(x, z, yaw, layer, levelsAt(x,z,layer), onCarriageway || layer !== 0); },
      setTraffic(vehicles) { traffic = vehicles; }, cancelRoute() { route = null; }, get route() { return route; } };
  }
  global.HKDriving = { create, intersects, roadSpeedLimit, performanceFigures };
})(typeof window === "object" ? window : globalThis);
