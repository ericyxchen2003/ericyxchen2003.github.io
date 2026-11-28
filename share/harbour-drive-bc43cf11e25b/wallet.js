// Keep the driver's money and the game time it was settled through in one record.
window.HKWallet = (() => {
  'use strict';
  const openingCents = 50000, morning = 360, day = 1440;
  const vehicles = [
    {id:'comfort', name:'Crown Comfort', body:'經典四門房車 · 鬆油後滑行較遠', dailyRent:5000, luggageChance:0},
    {id:'hybrid', name:'Comfort Hybrid', body:'高頂混能的士 · 起步輕快，鬆油回收減速', dailyRent:6500, luggageChance:.25}
  ];
  const vehicleFor = id => vehicles.find(v => v.id === id) ?? vehicles[0];
  const empty = () => ({balance: openingCents, minute: null, vehicle:'comfort'});
  const money = new Intl.NumberFormat('en-HK', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const format = cents => 'HK$ ' + money.format(cents / 100);
  const formatRange = (low, high) => format(low) + '～' + money.format(high / 100);

  function departure(previous, shift) {
    if (previous === null) return shift ?? HKDayCycle.defaultStart;
    if (shift === null || shift === undefined || Math.floor(previous % day) === shift) return previous;
    const next = Math.floor(previous / day) * day + shift;
    return next < previous ? next + day : next;
  }
  const rentalDay = minute => Math.floor((minute - morning) / day);
  function dayPeak(record) {
    // A higher rate than the current car's can only come from switching
    // down in the same rental day as the saved clock.
    return record.minute != null && record.lastSwitchDay === rentalDay(record.minute)
      ? record.peakRent ?? 0 : 0;
  }
  function rentBetween(previous, next, vehicleId, peakRent = 0) {
    const days = previous == null ? 0 : rentalDay(next) - rentalDay(previous);
    if (days <= 0) return null;
    const current = vehicleFor(vehicleId);
    const first = vehicles.find(v => v.dailyRent === peakRent && v.dailyRent > current.dailyRent) ?? current;
    const lines = [{vehicle:first.id, days:first === current ? days : 1, rate:first.dailyRent}];
    if (first !== current && days > 1) lines.push({vehicle:current.id, days:days-1, rate:current.dailyRent});
    return {lines, total:lines.reduce((sum, line) => sum + line.days * line.rate, 0)};
  }
  function feeBetween(previous, next, vehicleId, peakRent) {
    return rentBetween(previous, next, vehicleId, peakRent)?.total ?? 0;
  }
  function describeRent(rent) {
    return rent.lines.map(line => vehicleFor(line.vehicle).name + ' ' + format(line.rate)
      + (line.days > 1 ? ' × ' + line.days + ' 天' : '')).join(' ＋ ');
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
    function settle(requestedMinute, fare = 0, fine = 0, {nextVehicle, transferCents=0, checkpointStandId, expectedCheckpoint}={}) {
      if(!Number.isSafeInteger(transferCents)||transferCents<0)throw new RangeError('Invalid station transfer fare');
      const generation = state.generation ?? 0;
      return write(record => {
        // A drive from before a reset cannot restore its clock or collect fares.
        if ((record.generation ?? 0) !== generation) return {record, resetElsewhere: true};
        if(expectedCheckpoint!==undefined && expectedCheckpoint!==(record.checkpointStandId??null))
          return {record, checkpointChanged:true};
        const minute = Math.max(record.minute ?? 0, requestedMinute ?? record.minute ?? HKDayCycle.defaultStart);
        const current = vehicleFor(record.vehicle), period = rentalDay(minute);
        const peak = dayPeak(record);
        const rent = rentBetween(record.minute, minute, current.id, peak);
        const fee = rent?.total ?? 0;
        if(transferCents>0 && record.balance-fee<transferCents)return {record, insufficientFunds:true};
        const requestedChange = nextVehicle !== undefined && nextVehicle !== current.id;
        const switchBlocked = requestedChange && record.lastSwitchDay === period;
        const switched = requestedChange && !switchBlocked;
        const vehicle = switched ? nextVehicle : current.id;
        let peakRent = fee ? 0 : peak;
        // Only time spent after this boundary belongs to the new rental day.
        const periodStart = morning + period * day;
        if (record.minute !== null && minute > Math.max(periodStart, record.minute))
          peakRent = Math.max(peakRent, current.dailyRent);
        if (switched) peakRent = Math.max(peakRent, vehicleFor(vehicle).dailyRent);
        const lastSwitchDay = switched ? period : record.lastSwitchDay;
        const updated = {...record, balance:record.balance + fare - fine - fee - transferCents, minute, vehicle, lastSwitchDay, peakRent};
        if(checkpointStandId)updated.checkpointStandId=checkpointStandId;
        if (rent) updated.lastRent = rent;
        return {record:updated, fee, transferCents, switchBlocked};
      }, nextVehicle !== undefined || transferCents>0);
    }
    async function reset() {
      if (!db) {
        try { db = await connect(); } catch { /* This session only has an in-memory wallet. */ }
      }
      return write(record => ({record: {...empty(), generation: (record.generation ?? 0) + 1}}), true);
    }
    function setBalance(cents) {
      if (!Number.isSafeInteger(cents)) throw new RangeError('Expected whole HK cents');
      const generation = state.generation ?? 0;
      return write(record => (record.generation ?? 0) === generation
        ? {record: {...record, balance: cents}}
        : {record, resetElsewhere: true}, true);
    }
    return {
      get balance() { return state.balance; },
      get minute() { return state.minute; },
      get checkpointStandId() { return state.checkpointStandId ?? null; },
      get vehicle() { return vehicleFor(state.vehicle); },
      get peakRent() { return dayPeak(state); },
      get lastRent() { return state.lastRent; },
      canSwitch(minute) { return state.lastSwitchDay !== rentalDay(Math.max(minute, state.minute ?? 0)); },
      get persistent() { return Boolean(db); },
      // Use the departure the driver saw on the map. Another tab passing
      // that time while the map is open must not roll this choice to tomorrow.
      start(shift, shownMinute = state.minute, transferCents=0, expectedCheckpoint) {
        return settle(departure(shownMinute, shift),0,0,{transferCents,expectedCheckpoint});
      },
      selectVehicle(id, minute) {
        if (!vehicles.some(v => v.id === id)) throw new RangeError('Unknown taxi');
        return settle(minute, 0, 0, {nextVehicle:id});
      },
      settle, reset
    };
  }
  return {open, departure, feeBetween, describeRent, format, formatRange, vehicles};
})();
