// Keep the driver's money and the game time it was settled through in one record.
window.HKWallet = (() => {
  'use strict';
  const openingCents = 50000, dailyCents = 5000, morning = 360, day = 1440;
  const empty = () => ({balance: openingCents, minute: null});
  const money = new Intl.NumberFormat('en-HK', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const format = cents => 'HK$ ' + money.format(cents / 100);
  const formatRange = (low, high) => format(low) + '～' + money.format(high / 100);

  function departure(previous, shift) {
    if (previous === null) return shift ?? HKDayCycle.defaultStart;
    if (shift === null || shift === undefined || Math.floor(previous % day) === shift) return previous;
    const next = Math.floor(previous / day) * day + shift;
    return next < previous ? next + day : next;
  }
  function feeBetween(previous, next) {
    if (previous === null) return 0;
    const mornings = Math.floor((next - morning) / day) - Math.floor((previous - morning) / day);
    return dailyCents * Math.max(0, mornings);
  }
  function connect() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('harbour-drive-career', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('driver');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function open() {
    let db, state = empty();
    try { db = await connect(); } catch { /* The browser may disable site storage. */ }
    // Concurrent tabs must settle against the latest committed balance, even
    // when their game clocks cross the same morning independently.
    function write(change, requireCommit = false) {
      function inMemory() {
        const result = change(state);
        state = result.record;
        return result;
      }
      if (!db) return Promise.resolve(inMemory());
      return new Promise((resolve, reject) => {
        let tx, result;
        function unavailable(error) {
          if (requireCommit) { reject(error); return; }
          db?.close(); db = null;
          resolve(inMemory());
        }
        try {
          tx = db.transaction('driver', 'readwrite');
          const store = tx.objectStore('driver'), read = store.get('wallet');
          read.onsuccess = () => {
            result = change(read.result ?? empty());
            store.put(result.record, 'wallet');
          };
        } catch (error) { unavailable(error); return; }
        tx.oncomplete = () => { state = result.record; resolve(result); };
        tx.onabort = () => unavailable(tx.error);
      });
    }
    await write(record => ({record}));
    function settle(requestedMinute, fare = 0, fine = 0) {
      const generation = state.generation ?? 0;
      return write(record => {
        // A drive from before a reset cannot restore its clock or collect fares.
        if ((record.generation ?? 0) !== generation) return {record, resetElsewhere: true};
        const minute = Math.max(record.minute ?? 0, requestedMinute ?? record.minute ?? HKDayCycle.defaultStart);
        const fee = feeBetween(record.minute, minute);
        return {record: {...record, balance: record.balance + fare - fine - fee, minute}, fee};
      });
    }
    async function reset() {
      if (!db) {
        try { db = await connect(); } catch { /* This session only has an in-memory wallet. */ }
      }
      return write(record => ({record: {...empty(), generation: (record.generation ?? 0) + 1}}), true);
    }
    return {
      get balance() { return state.balance; },
      get minute() { return state.minute; },
      get persistent() { return Boolean(db); },
      // Use the departure the driver saw on the map. Another tab passing
      // that time while the map is open must not roll this choice to tomorrow.
      start(shift, shownMinute = state.minute) { return settle(departure(shownMinute, shift)); },
      settle, reset
    };
  }
  return {open, departure, feeBetween, format, formatRange};
})();
