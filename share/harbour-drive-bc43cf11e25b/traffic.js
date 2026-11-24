/* Ambient left-hand traffic, generated on the same directed OSM network as the taxi. */
(function (global) {
  "use strict";
  const colours = ["#557a88", "#d2c8ae", "#f1efe0", "#31464e", "#738579", "#51667a"];
  const count = 26;
  const key = p => p[0] + "/" + p[1];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

  function create(map, sim, signals) {
    const rules = sim.rules;
    const edges = [], junctions = new Map(), vehicles = [], tracks = [];
    let rng = 18277633;
    function random() {
      rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
      return rng / 4294967296;
    }
    for (const road of map.roads) {
      if ((road.l < 0 && !road.underpass) || road.cls === "service") continue;
      const lanes = Math.max(1, Number(road.lanes) || (road.one ? 1 : 2));
      const half = road.w / 2;
      const laneWidth = road.w / lanes, laneCount = road.one ? lanes : Math.max(1, Math.floor(lanes / 2));
      for (let i = 1; i < road.p.length; i++) {
        if (Number(road.one) !== -1) add(road.p[i - 1], road.p[i], i);
        if (Number(road.one) !== 1) add(road.p[i], road.p[i - 1], -i);
      }
      function add(a, b, index) {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 0.08) return;
        const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
        const edge = { a, b, len, dx, dz, road, half, laneWidth, laneCount, token: rules.token(road, index) };
        const start = key(a);
        if (!junctions.has(start)) junctions.set(start, []);
        junctions.get(start).push(edge); edges.push(edge);
      }
    }
    function viableNetwork(minWidth, mode) {
      const live = new Set(edges.filter(e => e.road.w >= minWidth && !(rules.access(e.road) & mode)));
      let changed = true;
      while (changed) {
        changed = false;
        for (const e of live) {
          const next = junctions.get(key(e.b)) || [];
          if (!next.some(n => live.has(n) && rules.advance(rules.advance(0, e.token, mode), n.token, mode) >= 0 && e.dx * n.dx + e.dz * n.dz > -0.74)) {
            live.delete(e); changed = true;
          }
        }
      }
      return live;
    }
    const fleets = { taxi: viableNetwork(0, 1), sedan: viableNetwork(0, 4), bus: viableNetwork(5.8, 2) };
    const mode = { taxi: 1, bus: 2, sedan: 4 };
    function lane(edge, along, vehicle) {
      const index = Math.min(edge.laneCount - 1, Math.floor(vehicle.laneChoice * edge.laneCount));
      const side = edge.half - edge.laneWidth * (index + 0.5);
      return { x: edge.a[0] + edge.dx * along + edge.dz * side,
        z: edge.a[1] + edge.dz * along - edge.dx * side, edge };
    }
    function chooseNext(edge, vehicle, state) {
      const candidates = [];
      let sum = 0;
      for (const next of junctions.get(key(edge.b)) || []) {
        const dot = edge.dx * next.dx + edge.dz * next.dz;
        if (rules.advance(state, next.token, mode[vehicle.kind]) < 0) continue;
        if (dot < -0.74 || !fleets[vehicle.kind].has(next)) continue;
        const bending = Math.max(0.06, (dot + 1) / 2);
        const continuous = edge.road.id === next.road.id || (edge.road.en && edge.road.en === next.road.en);
        const weight = (continuous ? 4 : 1) * (0.21 + bending * bending) * (next.road.cls.endsWith("_link") ? 0.55 : 1);
        sum += weight; candidates.push({ next, sum });
      }
      const ticket = random() * sum;
      return candidates.find(c => c.sum >= ticket)?.next;
    }
    function append(track, p) {
      p.turnState ??= track.turnState;
      if (distance(track.points.at(-1), p) > 0.045) track.points.push(p);
    }
    function extend(track, vehicle) {
      if (track.atEnd || track.points.length - track.index > 23) return;
      if (track.index > 0) { track.points.splice(0, track.index); track.index = 0; }
      // Cut back both approaches and join lane tangents across each OSM node.
      // Limiting trim to 38% leaves space on very short junction links.
      for (let run = 0; run < 18 && track.points.length < 44; run++) {
        const edge = track.edge, next = chooseNext(edge, vehicle, track.turnState);
        if (!next) { append(track, lane(edge, edge.len, vehicle)); track.atEnd = true; return; }
        const dot = Math.max(-1, Math.min(1, edge.dx * next.dx + edge.dz * next.dz));
        const trim = (vehicle.kind === "bus" ? 10 : 6.8) * (0.26 + 0.74 * Math.sqrt((1 - dot) / 2));
        const tail = Math.min(trim, edge.len * 0.38, edge.len - track.along);
        const head = Math.min(trim, next.len * 0.38);
        const nextTurn = rules.advance(track.turnState, next.token, mode[vehicle.kind]);
        const a = lane(edge, edge.len - tail, vehicle), b = lane(next, head, vehicle);
        append(track, a);
        const span = distance(a, b), handle = span * 0.39;
        const c = { x: a.x + edge.dx * handle, z: a.z + edge.dz * handle };
        const d = { x: b.x - next.dx * handle, z: b.z - next.dz * handle };
        const samples = Math.max(2, Math.ceil(span / 1.1));
        for (let j = 1; j <= samples; j++) {
          const t = j / samples, u = 1 - t;
          append(track, { x: u*u*u*a.x + 3*u*u*t*c.x + 3*u*t*t*d.x + t*t*t*b.x,
            z: u*u*u*a.z + 3*u*u*t*c.z + 3*u*t*t*d.z + t*t*t*b.z, turnState: t < 0.5 ? track.turnState : nextTurn, edge: t < 0.5 ? edge : next });
        }
        track.turnState = nextTurn;
        track.edge = next; track.along = head;
      }
    }
    function sample(track, forward) {
      let index = track.index, offset = track.offset + forward;
      while (index + 1 < track.points.length) {
        const a = track.points[index], b = track.points[index + 1], len = distance(a, b);
        if (offset < len) return { x: a.x + (b.x - a.x) * offset / len, z: a.z + (b.z - a.z) * offset / len,
          yaw: Math.atan2(b.x - a.x, a.z - b.z), index, offset, turnState: a.turnState, edge: a.edge };
        offset -= len; index++;
      }
      return null;
    }
    // The map is small enough to sample all directed edges when a car enters
    // the district. While driving, only its short forward path is evaluated.
    function spawn(vehicle, player, near, far) {
      const eligible = [];
      let sum = 0;
      for (const edge of fleets[vehicle.kind]) {
        if (edge.len < (vehicle.kind === "bus" ? 15 : 7) || (vehicle.kind === "bus" && edge.road.w < 7)) continue;
        const mid = lane(edge, edge.len / 2, vehicle), radius = distance(mid, player);
        if (radius < near || radius > far) continue;
        sum += Math.min(edge.len, 75);
        eligible.push({ edge, sum });
      }
      if (!eligible.length) return false;
      for (let trial = 0; trial < 60; trial++) {
        const ticket = random() * sum, edge = eligible.find(e => e.sum >= ticket).edge;
        const along = (0.2 + random() * 0.4) * edge.len, pos = lane(edge, along, vehicle);
        const yaw = Math.atan2(edge.dx, -edge.dz);
        if (distance(pos, player) < 14 || vehicles.some(v => v !== vehicle && distance(v, pos) < 14)
          || !sim.canOccupy(pos.x, pos.z, yaw, edge.road.l)) continue;
        Object.assign(vehicle, { x: pos.x, z: pos.z, yaw, layer: edge.road.l, speed: 3.5 + 2.6 * random(), waitingForSignal: null });
        const track = { turnState: rules.advance(0, edge.token, mode[vehicle.kind]), edge, along, points: [pos], offset: 0, index: 0, atEnd: false, stopped: 0 };
        pos.turnState = track.turnState;
        tracks[vehicle.id] = track;
        extend(track, vehicle);
        return true;
      }
      return false;
    }
    const player = sim.state;
    for (let i = 0; i < count; i++) {
      const kind = i % 8 === 0 ? "bus" : i % 4 === 1 ? "taxi" : "sedan";
      const vehicle = { id: i, kind, laneChoice: kind === "bus" ? 0.12 : random(), color: kind === "sedan" ? colours[i % colours.length] : undefined,
        halfLength: kind === "bus" ? 5.92 : 2.32, halfWidth: kind === "bus" ? 1.29 : 0.89,
        cruise: kind === "bus" ? 7.4 + random() * 1.8 : 8.2 + random() * 3.3 };
      const da = i < 7 ? [22, 94] : i < 16 ? [84, 204] : [160, 350];
      if (spawn(vehicle, player, ...da) || spawn(vehicle, player, 15, 500)) vehicles.push(vehicle);
    }
    sim.setTraffic(vehicles);
    let lastX = player.x, lastZ = player.z, recycleTimer = 0;

    function collide(p, vehicle, player, margin = 0) {
      const level=p.edge.road.l;
      const body={layer:level,x:p.x,z:p.z,yaw:p.yaw,kind:vehicle.kind,halfLength:vehicle.halfLength+margin,halfWidth:vehicle.halfWidth};
      if(sim.trafficOverlap(player.x,player.z,player.yaw,player.layer||0,body))return true;
      return vehicles.some(other => other !== vehicle && sim.trafficOverlap(p.x,p.z,p.yaw,level,other,
        vehicle.halfLength+margin,vehicle.halfWidth,vehicle.kind==='bus'?4.45:1.75));
    }
    function tryLaneChange(v, track, player) {
      // Scan early enough to move one lane before a stationary queue.
      const edge = sample(track, 0)?.edge;
      if (!edge || edge.laneCount < 2) return;
      let blocked = false;
      for (let d = 8; d < 29; d += 4) {
        const p = sample(track, d);
        if (p && collide(p, v, player, 0.3)) { blocked = true; break; }
      }
      if (!blocked) return;
      const current = Math.min(edge.laneCount - 1, Math.floor(v.laneChoice * edge.laneCount));
      const along = Math.max(0, Math.min(edge.len, (v.x - edge.a[0]) * edge.dx + (v.z - edge.a[1]) * edge.dz));
      for (const index of [current + 1, current - 1]) {
        if (index < 0 || index >= edge.laneCount) continue;
        const vehicle = { ...v, laneChoice: (index + 0.5) / edge.laneCount };
        const anchor = lane(edge, along, vehicle);
        const next = { turnState: sample(track, 0)?.turnState ?? rules.advance(0, edge.token, mode[vehicle.kind]), edge, along, points: [anchor], offset: 0, index: 0, atEnd: false, stopped: 0 };
        anchor.turnState = next.turnState;
        extend(next, vehicle);
        const points = [{ x: v.x, z: v.z, edge, turnState: anchor.turnState }];
        let end;
        for (let d = 2; d <= 22; d += 2) {
          const pose = sample(next, d);
          if (!pose) break;
          const t = Math.min(1, d / 15), blend = 1 - t * t * (3 - 2 * t);
          pose.x += (v.x - anchor.x) * blend; pose.z += (v.z - anchor.z) * blend;
          const prev = points.at(-1);
          pose.yaw = Math.atan2(pose.x - prev.x, prev.z - pose.z);
          if (collide(pose, v, player, 0.45) || !sim.canOccupy(pose.x, pose.z, pose.yaw, pose.edge.road.l)) break;
          points.push(pose); end = pose;
        }
        if (points.length !== 12) continue;
        next.points = points.concat(next.points.slice(end.index + 1));
        v.laneChoice = vehicle.laneChoice; tracks[v.id] = next;
        return;
      }
    }
    function step(dt, player = sim.state) {
      dt = Math.min(0.15, Math.max(0, dt));
      if (!dt) return;
      const teleport = Math.hypot(player.x - lastX, player.z - lastZ) > 35;
      lastX = player.x; lastZ = player.z;
      recycleTimer -= dt;
      const recycle = recycleTimer <= 0;
      if (recycle) recycleTimer = 0.8;
      for (const v of vehicles) {
        let track = tracks[v.id];
        const radius = distance(v, player);
        if (teleport && (radius > 175 || radius < 12)) {
          spawn(v, player, v.id < 7 ? 22 : 90, v.id < 7 ? 100 : 330);
          track = tracks[v.id];
        } else if (recycle && (radius > 470 || (track.stopped > 19 && radius > 130 && v.waitingForSignal == null))) {
          spawn(v, player, 145, 320); track = tracks[v.id];
        }
        extend(track, v);
        const frontX = v.x + Math.sin(v.yaw) * v.halfLength;
        const frontZ = v.z - Math.cos(v.yaw) * v.halfLength;
        const signal = v.layer !== 0 ? null : signals?.approach(frontX, frontZ, v.yaw, 47);
        if (recycle && (!signal || signal.distance > 21)) { tryLaneChange(v, track, player); track = tracks[v.id]; }
        const speed = v.speed;
        let desired = v.cruise;
        const tangent = sample(track, Math.max(v.halfLength, speed * 1.3));
        if (tangent) {
          const bend = Math.abs(Math.atan2(Math.sin(tangent.yaw - v.yaw), Math.cos(tangent.yaw - v.yaw)));
          desired *= 1 / (1 + bend * 0.72);
        }
        const gap = 2.0 + speed * 0.35;
        const lookahead = Math.max(9, gap + speed * speed / 6);
        for (let ahead = 1; ahead <= lookahead + 2.5; ahead += 2.5) {
          const p = sample(track, ahead);
          if (!p || collide(p, v, player, 0.14)) {
            desired = Math.min(desired, Math.sqrt(6 * Math.max(0, ahead - 1.25 - gap))); break;
          }
        }
        if (desired < 0.2 && track.stopped > 3.5 && v.id % 3 === 0) desired = 0.55;
        let stopRoom = Infinity;
        v.waitingForSignal = null;
        if (signal) {
          if (v.amberDecision?.id !== signal.head.id || signal.phase !== "amber") v.amberDecision = null;
          if (signal.phase === "amber" && !v.amberDecision) {
            // Once a front bumper has committed, continue during amber only
            // when the driver could not bring the vehicle to a safe stop.
            v.amberDecision = { id: signal.head.id, stop: signal.distance > speed * speed / 8 + 1.05 };
          }
          if (signal.phase === "red" || signal.phase === "redAmber" || v.amberDecision?.stop) {
            stopRoom = Math.max(0, signal.distance - 0.95);
            desired = Math.min(desired, Math.sqrt(5.8 * stopRoom));
            v.waitingForSignal = signal.head.id;
          }
        } else { v.amberDecision = null; }
        const rate = desired < speed ? 4.3 : v.kind === "bus" ? 1.1 : 1.6;
        v.speed += Math.max(-rate * dt, Math.min(rate * dt, desired - speed));
        if (stopRoom < .045) v.speed = 0;
        const pose = sample(track, Math.min(stopRoom, v.speed * dt));
        if (pose && !collide(pose, v, player) && sim.canOccupy(pose.x, pose.z, pose.yaw, pose.edge.road.l)) {
          v.x = pose.x; v.z = pose.z; v.yaw = pose.yaw; v.layer = pose.edge.road.l;
          track.index = pose.index; track.offset = pose.offset;
        } else { v.speed = 0; }
        track.stopped = v.speed < 0.3 ? track.stopped + dt : 0;
      }
    }
    return { vehicles, step };
  }
  global.HKTraffic = { create };
})(typeof window === "object" ? window : globalThis);
