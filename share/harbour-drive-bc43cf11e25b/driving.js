/* X is east, Z is south. Yaw is clockwise from geographic north. */
(function (global) {
  "use strict";
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const magnitude = Math.hypot;
  const key = (x, z) => x + "/" + z;
  const CELL = 25;
  const L = 2.27;
  const W = 0.88;
  const corners = [[L, W], [L, -W], [-L, W], [-L, -W], [L, 0], [-L, 0], [0, W], [0, -W], [0, 0]];
  const locations = [
    ["salisbury", "半島酒店", "The Peninsula", 114.17156, 22.29474, "Salisbury Road"],
    ["ferry", "天星碼頭", "Star Ferry Pier", 114.169194, 22.294144, "Salisbury Road"],
    ["harbour", "海港城", "Harbour City", 114.16877, 22.29831, "Canton Road"],
    ["park", "九龍公園", "Kowloon Park", 114.17041, 22.29806, "Haiphong Road"],
    ["nathan", "彌敦道", "Nathan Road", 114.17227, 22.29821, "Nathan Road"],
    ["mody", "麼地道", "Mody Road", 114.17641, 22.29764, "Mody Road"],
    ["science", "香港科學館", "Science Museum", 114.178691, 22.301191, "Science Museum Road"]
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

  function create(map, groundHeight) {
    const segments = [], nodes = [], nodeIDs = new Map();
    const ground = [...(map.land || []), ...(map.piers || [])];
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
      if (!(road.p && road.p.length > 1) || Number(road.l) < 0) continue;
      const half = Math.max(1.6, Number(road.w || 6) / 2);
      for (let i = 1; i < road.p.length; i++) {
        const a = road.p[i - 1], b = road.p[i];
        const vx = b[0] - a[0], vz = b[1] - a[1], len = magnitude(vx, vz);
        if (len < 0.04) continue;
        const start = nodeFor(a), end = nodeFor(b), one = Number(road.one || 0);
        const layer = Math.max(0, Number(road.l) || 0), bit = 1 << layer;
        const s = { a, b, start, end, len, half, dx: vx / len, dz: vz / len, road, one, layer, bit };
        for (const node of [nodes[start], nodes[end]]) {
          node.levels |= bit; node.half = Math.max(node.half, half);
        }
        if (one !== -1) nodes[start].edges.push({ id: end, length: len });
        if (one !== 1) nodes[end].edges.push({ id: start, length: len });
        segments.push(s);
        const pad = half + 3;
        roadsGrid.insert(s, Math.min(a[0], b[0]) - pad, Math.min(a[1], b[1]) - pad,
          Math.max(a[0], b[0]) + pad, Math.max(a[1], b[1]) + pad);
      }
    }
    if (!segments.length) throw Error("Map contains no drivable roads.");
    for (const n of nodes) {
      if ((n.levels & (n.levels - 1)) === 0) continue;
      const [x, z] = n.point, reach = n.half + L + 2;
      const incident=roadsGrid.at(x,z).filter(s=>(s.a[0]===x&&s.a[1]===z)||(s.b[0]===x&&s.b[1]===z));
      transitions.insert({ x, z, reach, mask: n.levels, incident }, x - reach, z - reach, x + reach, z + reach);
    }
    const detail=map===globalThis.HKMAP?globalThis.HKDetails:null;
    const structures=[...(map.buildings||[]),...(detail?.parkSolids || [])];
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
      const base = 1 << layer;
      let mask = base;
      for (const n of transitions.at(x, z)) {
        if ((n.mask & base) && (x - n.x) ** 2 + (z - n.z) ** 2 <= n.reach ** 2) mask |= n.mask;
      }
      return mask;
    }
    function roadAtLevel(x, z, mask) {
      let best = null;
      for (const s of roadsGrid.at(x, z)) {
        if (!(mask & s.bit)) continue;
        const hit = project(s, x, z);
        if (!best || hit.distance < best.distance) best = hit;
      }
      return best;
    }
    function pavementAt(x, z, mask) {
      for (const s of roadsGrid.at(x, z)) {
        if (!(mask & s.bit)) continue;
        const along = clamp((x - s.a[0]) * s.dx + (z - s.a[1]) * s.dz, 0, s.len);
        const ex = x - s.a[0] - along * s.dx, ez = z - s.a[1] - along * s.dz;
        if (ex * ex + ez * ez <= (s.half + 0.28) ** 2) return true;
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
    function obstructed(x, z, yaw, layer = 0, levels = 1 << layer, keepToRoad = layer > 0) {
      const fx = Math.sin(yaw), fz = -Math.cos(yaw);
      for (const [longitudinal, lateral] of corners) {
        const cx = x + fx * longitudinal - fz * lateral;
        const cz = z + fz * longitudinal + fx * lateral;
        if (map.bounds && (cx < map.bounds[0] || cz < map.bounds[1] ||
            cx > map.bounds[2] || cz > map.bounds[3])) return "boundary";
        if (keepToRoad) {
          if (!pavementAt(cx, cz, levels)) return "deck";
        } else if (!supportedGround(cx, cz) && !((levels & ~1) && pavementAt(cx, cz, levels & ~1))) {
          return "water";
        }
        if(groundHeight?.overhead){
          for(let upper=layer+1;upper<=2;upper++){
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
        if ((base > 2 && bottom >= floor + 2) || top < floor) continue;
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
      const x = (lng - 114.17) * 103060, z = (22.296 - lat) * 111100;
      const snap = nearestRoad(x, z, s => (s.road.en || s.road.n || "").toLowerCase().includes(street.toLowerCase())) || nearestRoad(x, z);
      places.push({ id, name, en, x: snap.x, z: snap.z });
      snaps.set(id, snap);
    }

    let route = null, routeLengths = [], routeProgress = 0, rerouteTime = 0;
    let collisionTime = 0, reverseDelay = 0, streetTimer = 0;
    function updateStreet() {
      const hit = roadAtLevel(state.x, state.z, 1 << state.layer);
      state.roadName = hit?.road.n || hit?.road.en || "無名道路";
      state.roadEn = hit?.road.en || "";
    }

    function reset(id = "salisbury") {
      const anchor = snaps.get(id) || snaps.get("salisbury");
      const s = anchor.segment, direction = s.one || (s.dx >= 0 ? 1 : -1);
      const fx = s.dx * direction, fz = s.dz * direction, yaw = Math.atan2(fx, -fz);
      const lanes = Math.max(1, Number(s.road.lanes) || (s.one ? 1 : 2));
      const offset = Math.max(0, Math.min(s.half - 1.15, s.half * (1 - 1 / lanes)));
      let position;
      for (const delta of [0, 3, -3, 8, -8, 15, -15]) {
        const along = clamp(anchor.along + delta, 0, s.len);
        for (const side of [offset, offset * 0.65, 0]) {
          const x = s.a[0] + along * s.dx + side * fz, z = s.a[1] + along * s.dz - side * fx;
          if (!obstructed(x, z, yaw, s.layer)) { position = [x, z]; break; }
        }
        if (position) break;
      }
      position ||= [anchor.x, anchor.z];
      Object.assign(state, { x: position[0], z: position[1], yaw, speed: 0, steer: 0,
        gear: "D", odometer: 0, collision: false, collisionKind: "", layer: s.layer });
      route = null; collisionTime = 0; reverseDelay = 0; streetTimer = 0;
      updateStreet();
      return state;
    }

    function findPath(from, to) {
      const s = from.segment, t = to.segment;
      const dist = new Float64Array(nodes.length).fill(Infinity);
      const prev = new Int32Array(nodes.length).fill(-1), queue = new Queue();
      // Extra endpoints let a trip start and finish halfway along directed edges.
      const starts = [], ends = [];
      if (s.one !== 1) starts.push([s.start, from.along]);
      if (s.one !== -1) starts.push([s.end, s.len - from.along]);
      if (t.one !== -1) ends.push([t.start, to.along]);
      if (t.one !== 1) ends.push([t.end, t.len - to.along]);
      for (const [id, cost] of starts) { dist[id] = cost; queue.push(id, cost); }
      let minCost = Infinity, finalNode = -1, direct = false;
      if (s === t && (Math.abs(to.along - from.along) < 0.1 || (to.along >= from.along ? s.one !== -1 : s.one !== 1))) {
        minCost = Math.abs(to.along - from.along); direct = true;
      }
      while (queue.list.length) {
        const [id, cost] = queue.pop();
        if (cost > minCost) break;
        if (cost > dist[id]) continue;
        for (const [goal, remainder] of ends) {
          if (id === goal && cost + remainder < minCost) {
            minCost = cost + remainder; finalNode = id; direct = false;
          }
        }
        for (const edge of nodes[id].edges) {
          const next = cost + edge.length;
          if (next < dist[edge.id]) {
            dist[edge.id] = next; prev[edge.id] = id; queue.push(edge.id, next);
          }
        }
      }
      if (!direct && finalNode < 0) return null;
      const points = [];
      if (!direct) for (let id = finalNode; id >= 0; id = prev[id]) points.push(nodes[id].point);
      points.reverse();
      points.unshift([from.x, from.z]); points.push([to.x, to.z]);
      return points.filter((p, i) => !i || magnitude(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 0.05);
    }

    function navigate(id) {
      const target = places.find(place => place.id === id), destination = snaps.get(id);
      if (!target) return null;
      const origin = roadAtLevel(state.x, state.z, 1 << state.layer) ||
        nearestRoad(state.x, state.z, s => s.layer === state.layer) || nearestRoad(state.x, state.z);
      const points = findPath(origin, destination);
      if (!points) { route = null; return null; }
      routeProgress = 0; rerouteTime = 0; routeLengths = [0];
      for (let i = 1; i < points.length; i++) {
        routeLengths.push(routeLengths[i - 1] + magnitude(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
      }
      const total = routeLengths.at(-1);
      const layers=points.slice(1).map((b,i)=>{
        const a=points[i],x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
        const s=roadsGrid.at(x,z).find(s=>project(s,...a).distance<.05&&project(s,...b).distance<.05);
        return s?.layer??0;
      });
      route = { target, points, layers, total, remaining: total, arrived: false, progress: 0, nextTurn: "straight", turnDistance: total };
      updateRoute(0);
      return route;
    }

    function updateRoute(dt) {
      if (!route || route.arrived) return;
      const { points, target } = route;
      let nearest = Infinity, progress = 0, score = Infinity, index = 0;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], len = routeLengths[i] - routeLengths[i - 1];
        const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
        const t = clamp((state.x - a[0]) * dx + (state.z - a[1]) * dz, 0, len);
        const distance = magnitude(a[0] + dx * t - state.x, a[1] + dz * t - state.z);
        const along = routeLengths[i - 1] + t;
        const continuityPenalty = Math.max(0, Math.abs(along - routeProgress) - 22) * 0.13;
        if (distance + continuityPenalty < score) {
          nearest = distance; progress = along; score = distance + continuityPenalty; index = i;
        }
      }
      routeProgress = progress;
      route.remaining = Math.max(0, route.total - progress);
      route.progress = route.total ? progress / route.total : 1;
      if (magnitude(state.x - target.x, state.z - target.z) < 9 && route.remaining < 16) {
        route.arrived = true; route.remaining = 0; route.progress = 1; route.nextTurn = "arrive"; route.turnDistance = 0;
        return;
      }
      route.nextTurn = "arrive"; route.turnDistance = route.remaining;
      for (let i = Math.max(1, index); i < points.length - 1; i++) {
        const a = points[i - 1], b = points[i], c = points[i + 1];
        const u = Math.atan2(b[0] - a[0], a[1] - b[1]), v = Math.atan2(c[0] - b[0], b[1] - c[1]);
        const turn = Math.atan2(Math.sin(v - u), Math.cos(v - u));
        if (Math.abs(turn) > 0.62 && routeLengths[i] >= progress + 1) {
          route.nextTurn = Math.abs(turn) > 2.6 ? "u-turn" : turn > 0 ? "right" : "left";
          route.turnDistance = routeLengths[i] - progress;
          break;
        }
      }
      rerouteTime = nearest > 23 ? rerouteTime + dt : 0;
      if (rerouteTime > 1.2) navigate(target.id);
    }

    function trafficOverlap(x,z,yaw,layer,other,halfLength=L,halfWidth=W){
      if(!intersects(x,z,yaw,halfLength,halfWidth,other))return false;
      const otherLayer=other.layer||0;
      if(layer===otherLayer)return true;
      if(!groundHeight?.surface)return false;
      const playerY=groundHeight.surface(x,z,layer),otherY=groundHeight.surface(other.x,other.z,otherLayer);
      return playerY<otherY+(other.kind==='bus'?4.45:1.75)&&otherY<playerY+1.75;
    }
    function substep(dt, inputs) {
      const throttle = clamp(Number(inputs.throttle || 0), 0, 1), brake = clamp(Number(inputs.brake || 0), 0, 1);
      const steerInput = clamp(Number(inputs.right || 0) - Number(inputs.left || 0), -1, 1);
      const handbrake = Boolean(inputs.handbrake);
      const speed = Math.abs(state.speed);
      const desired = steerInput * (0.62 / (1 + speed * 0.09));
      const steeringRate = steerInput ? 1.24 / (1 + Math.min(0.30, speed * 0.017)) : 2.6;
      state.steer += clamp(desired - state.steer, -steeringRate * dt, steeringRate * dt);
      let v = state.speed;
      if (handbrake) v -= Math.sign(v) * Math.min(Math.abs(v), 12.5 * dt);
      else if (throttle && !brake) {
        reverseDelay = 0;
        const acceleration = v < 0 ? 7.5 : 4.7 / (1 + Math.max(0, v) * 0.048);
        v += throttle * acceleration * dt;
      } else if (brake) {
        if (v > 0.02) {
          v = Math.max(0, v - 8.6 * brake * dt); reverseDelay = 0.30;
        } else if (reverseDelay <= 0) v -= 2.8 * brake * dt;
        else { v = 0; reverseDelay -= dt; }
      } else { reverseDelay = 0; }
      const resistance = 0.34 + 0.0021 * v * v;
      v -= Math.sign(v) * Math.min(Math.abs(v), resistance * dt);
      v = clamp(v, -4.5, 19.45);
      if (v === 0) { state.speed = 0; return; }
      const yawRate = v / 2.68 * Math.tan(state.steer);
      const newYaw = state.yaw + clamp(yawRate, -1.72, 1.72) * dt;
      const middle = (state.yaw + newYaw) / 2;
      const x = state.x + Math.sin(middle) * v * dt, z = state.z - Math.cos(middle) * v * dt;
      const levels = levelsAt(x, z, state.layer);
      let layer = state.layer;
      if (levels !== (1 << layer)) {
        const road = roadAtLevel(x, z, levels);
        if (road && road.distance <= road.segment.half + .28 && road.segment.layer!==layer &&
            transitions.at(x,z).some(n=>(n.mask&(1<<layer))&&n.incident.includes(road.segment)&&
              (x-n.x)**2+(z-n.z)**2<=n.reach**2)) layer = road.segment.layer;
      }
      const obstacle = obstructed(x, z, newYaw, layer, levels)
        || (traffic.some(other=>trafficOverlap(x,z,newYaw,layer,other)) ? "traffic" : "");
      if (obstacle) {
        state.speed = 0;
        if (Math.abs(v) > 0.35 || !collisionTime) { collisionTime = 0.65; state.collisionKind = obstacle; }
        return;
      }
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
    return { state, places, step, reset, nearestRoad, navigate, trafficOverlap,
      // Ambient traffic still follows the carriageway through bends and junctions.
      canOccupy(x, z, yaw) { return !obstructed(x, z, yaw, 0, 1, true); },
      setTraffic(vehicles) { traffic = vehicles; }, cancelRoute() { route = null; }, get route() { return route; } };
  }
  global.HKDriving = { create, intersects };
})(typeof window === "object" ? window : globalThis);
