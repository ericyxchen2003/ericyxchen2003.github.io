// Partition the canonical ways without cutting their geometry at tile edges.
// The distance from the start of a way keeps dashed lines in phase across tiles.
window.HKRoadTiles = (() => {
  const size = 150;
  function partition(roads) {
    const tiles = new Map();
    roads.forEach((road, id) => {
      if (road.l < 0 && !road.bore || road.p.length < 2) return;
      let offset = 0, previous;
      for (let i = 1; i < road.p.length; i++) {
        const a = road.p[i - 1], b = road.p[i];
        const x = road.fork ? road.p[0][0] : (a[0] + b[0]) / 2;
        const z = road.fork ? road.p[0][1] : (a[1] + b[1]) / 2;
        const key = Math.floor(x / size) + '/' + Math.floor(z / size);
        let tile = tiles.get(key);
        if (!tile) {
          tile = {bounds: [Infinity, Infinity, -Infinity, -Infinity], sections: []};
          tiles.set(key, tile);
        }
        if (tile === previous) tile.sections.at(-1)[2] = i;
        else tile.sections.push([id, i, i, offset]);
        previous = tile;
        const pad = road.w / 2 + 3, bounds = tile.bounds;
        for (const p of [a, b]) {
          bounds[0] = Math.min(bounds[0], p[0] - pad);
          bounds[1] = Math.min(bounds[1], p[1] - pad);
          bounds[2] = Math.max(bounds[2], p[0] + pad);
          bounds[3] = Math.max(bounds[3], p[1] + pad);
        }
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len >= .08) offset += len;
      }
    });
    return Array.from(tiles.values());
  }

  function stream(tiles, build) {
    const pending = tiles.map((tile, index) => ({tile, index, distance: 0, steps: null}));
    let lastX = Infinity, lastZ = Infinity;
    return function update(x, z, immediate) {
      if (!pending.length) return false;
      if (immediate || Math.hypot(x - lastX, z - lastZ) > 45) {
        lastX = x; lastZ = z;
        for (const job of pending) {
          const [west, north, east, south] = job.tile.bounds;
          job.distance = Math.hypot(Math.max(west - x, x - east, 0), Math.max(north - z, z - south, 0));
        }
        pending.sort((a, b) => b.distance - a.distance);
      }
      const start = performance.now();
      do {
        const job = pending.at(-1);
        job.steps ??= build(job.tile, job.index);
        if (job.steps.next().done) pending.pop();
      } while (pending.length && (immediate && pending.at(-1).distance <= 320 || performance.now() - start < 3));
      return true;
    };
  }
  // Packed vertices are the same float32s as the generated GPU attributes.
  // Browsers without gzip streams use the procedural deck builder instead.
  async function readDecks(encoded) {
    if (!encoded || typeof DecompressionStream !== 'function') return null;
    const compressed = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const buffer = await new Response(stream).arrayBuffer();
    let offset = 0;
    function read(Type, n) {
      const data = new Type(buffer, offset, n);
      offset += data.byteLength;
      return data;
    }
    const [count] = read(Uint32Array, 1), palette = read(Float32Array, count * 3);
    const decks = new Map();
    while (offset < buffer.byteLength) {
      const [tile, vertices, indices, lamps] = read(Uint32Array, 4);
      const position = read(Float32Array, vertices * 3);
      const shades = read(Uint8Array, Math.ceil(vertices / 4) * 4);
      const index = read(Uint32Array, indices);
      for (let i = 1; i < indices; i++) index[i] += index[i - 1];
      decks.set(tile, {position, shades, index, palette, reflectors: read(Float32Array, lamps * 4)});
    }
    return decks;
  }
  function addDeck(deck, material, scene, fixtures) {
    const {position, shades, index, palette, reflectors} = deck;
    const color = new Float32Array(position.length);
    for (let i = 0; i < position.length / 3; i++) {
      const k = 3 * shades[i];
      color[3 * i] = palette[k]; color[3 * i + 1] = palette[k + 1]; color[3 * i + 2] = palette[k + 2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('color', new THREE.BufferAttribute(color, 3));
    g.setIndex(new THREE.BufferAttribute(index, 1));
    g.computeVertexNormals(); g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, material);
    mesh.receiveShadow = true; scene.add(mesh);
    for (let i = 0; i < reflectors.length; i += 4) {
      fixtures.add('box', reflectors[i], reflectors[i + 1], reflectors[i + 2], .24, .095, .025, '#dfc379', reflectors[i + 3]);
    }
  }
  return {partition, stream, readDecks, addDeck, bakeDeck: road => road.l > 0 && (road.surveyMesh || road.fork)};
})();
