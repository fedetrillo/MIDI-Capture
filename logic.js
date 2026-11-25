// MIDI Capture: the pure part. Incoming MIDI events become takes (a take ends after a silence or
// when the transport starts or stops), notes are paired from note-on/off with the sustain pedal
// optionally folded into their lengths, and a take is laid out in ticks for a clip.
// No LUNA calls here.

(function (root) {
  // One event: { t: ms (LUNA's MIDI clock), st: status, d1, d2, play: transport rolling?, tick: tick
  // at that moment when rolling, else null }.
  function makeTaker({ gapMs = 10000, keepMs = 15 * 60 * 1000, maxTakes = 50 } = {}) {
    const takes = [];
    let cur = null, seq = 0;
    const held = new Map();   // "ch:pitch" -> note being held
    let pedal = new Map();    // ch -> down?
    function close() {
      if (!cur) return;
      // Notes still held when the take closes end at its last event.
      for (const n of cur.notes) if (n.t1 === null) { n.t1 = cur.endT; n.tick1 = n.tick0 !== null ? cur.lastTick : null; }
      held.clear();
      if (cur.notes.length) takes.unshift(cur);
      cur = null;
      prune();
    }
    function prune(now = null) {
      const ref = now ?? (takes[0]?.endT ?? 0);
      while (takes.length > maxTakes) takes.pop();
      for (let i = takes.length - 1; i >= 0; i--) if (ref - takes[i].endT > keepMs) takes.splice(i, 1);
    }
    function push(e) {
      const type = e.st & 0xf0, ch = e.st & 0x0f;
      const isOn = type === 0x90 && e.d2 > 0, isOff = type === 0x80 || (type === 0x90 && e.d2 === 0);
      const isPedal = type === 0xb0 && e.d1 === 64;
      if (!isOn && !isOff && !isPedal) return null;
      // A new take after a silence, or when the transport changed between rolling and stopped.
      const silent = cur && !held.size && ![...pedal.values()].some(Boolean) && e.t - cur.endT > gapMs;
      if (cur && (silent || (isOn && cur.play !== e.play && !held.size))) close();
      if (!cur) {
        if (!isOn) return null;   // offs and pedal with nothing playing start nothing
        cur = { id: `k${Date.now().toString(36)}${seq++}`, startT: e.t, endT: e.t, play: e.play, notes: [], pedals: [], chans: new Set(), lastTick: e.tick };
      }
      cur.endT = Math.max(cur.endT, e.t);
      if (e.tick !== null && e.tick !== undefined) cur.lastTick = e.tick;
      cur.chans.add(ch);
      const key = `${ch}:${e.d1}`;
      if (isOn) {
        const prev = held.get(key);
        if (prev) { prev.t1 = e.t; prev.tick1 = e.tick ?? null; }
        const n = { ch, pitch: e.d1, vel: e.d2, t0: e.t, t1: null, tick0: e.tick ?? null, tick1: null };
        cur.notes.push(n); held.set(key, n);
      } else if (isOff) {
        const n = held.get(key);
        if (n) { n.t1 = e.t; n.tick1 = e.tick ?? null; held.delete(key); }
      } else {
        const down = e.d2 >= 64;
        if (down !== !!pedal.get(ch)) cur.pedals.push({ ch, down, t: e.t, tick: e.tick ?? null });
        pedal.set(ch, down);
      }
      return cur;
    }
    // Close the open take if it has been silent long enough (called on a timer).
    function tick(now) {
      if (cur && !held.size && ![...pedal.values()].some(Boolean) && now - cur.endT > gapMs) close();
      prune(now);
    }
    return { takes, push, tick, close, get current() { return cur; }, clear() { takes.length = 0; cur = null; held.clear(); pedal = new Map(); }, set gap(ms) { gapMs = ms; } };
  }

  // A take's notes with the sustain pedal folded in: a note released while the pedal is down
  // lasts until the pedal comes up (or the next same note starts).
  function withPedal(take) {
    const notes = take.notes.map((n) => ({ ...n }));
    if (!take.pedals.length) return notes;
    for (const n of notes) {
      const ups = take.pedals.filter((p) => p.ch === n.ch);
      // Pedal state at the note's release.
      let down = false, upAt = null;
      for (const p of ups) { if (p.t <= n.t1) down = p.down; else if (down && !p.down) { upAt = p; break; } }
      if (!down) continue;
      const end = upAt ?? { t: take.endT, tick: take.lastTick };
      const next = notes.find((m) => m !== n && m.ch === n.ch && m.pitch === n.pitch && m.t0 > n.t0 && m.t0 < end.t);
      const stop = next ? { t: next.t0, tick: next.tick0 } : end;
      n.t1 = stop.t; n.tick1 = stop.tick ?? n.tick1;
    }
    return notes;
  }

  // Lay a take out in ticks. `place`: 'played' uses the ticks it was played at (rolling takes);
  // 'cursor' starts it at `cursorTick` keeping its timing in seconds. `toTick(seconds)` maps
  // seconds from the cursor to ticks with the session's tempo map.
  function layout(take, { place, cursorTick, toTick, pedal = true, minTicks = 1 }) {
    const notes = pedal ? withPedal(take) : take.notes.map((n) => ({ ...n }));
    const usePlayed = place === 'played' && take.play && notes.every((n) => n.tick0 !== null);
    const out = [];
    for (const n of notes) {
      let a, b;
      if (usePlayed) { a = n.tick0; b = n.tick1 ?? n.tick0; }
      else { a = toTick((n.t0 - take.startT) / 1000); b = toTick(((n.t1 ?? n.t0) - take.startT) / 1000); }
      a = Math.round(a); b = Math.round(Math.max(b, a + minTicks));
      out.push({ pitch: n.pitch, startTick: a, stopTick: b, velocity: Math.max(1, Math.min(127, n.vel)) });
    }
    return out;
  }

  // Short summaries for the list.
  const range = (notes) => notes.reduce((r, n) => [Math.min(r[0], n.pitch), Math.max(r[1], n.pitch)], [127, 0]);
  const durMs = (take) => Math.max(0, take.endT - take.startT);

  root.CaptureLogic = { makeTaker, withPedal, layout, range, durMs };
})(typeof window !== 'undefined' ? window : globalThis);
