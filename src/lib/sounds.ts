"use client";
let audioContext: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) { try { audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; } }
  return audioContext;
}
function playTone(f: number, d: number, t: OscillatorType = "sine", v: number = 0.3) {
  const ctx = getAudioContext(); if (!ctx) return;
  try { if (ctx.state === "suspended") ctx.resume(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = t; o.frequency.setValueAtTime(f, ctx.currentTime); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d); o.start(ctx.currentTime); o.stop(ctx.currentTime + d); } catch {}
}
export function playNewRequestSound() { playTone(800, 0.15); setTimeout(() => playTone(1200, 0.2), 150); setTimeout(() => playTone(1600, 0.3), 350); }
export function playDriverArrivedSound() { playTone(523, 0.2); setTimeout(() => playTone(659, 0.2), 200); setTimeout(() => playTone(784, 0.4), 400); }
export function playRideAcceptedSound() { playTone(659, 0.15); setTimeout(() => playTone(880, 0.3), 150); }
export function playMessageSound() { playTone(1000, 0.1, "sine", 0.2); }
export function playTripCompletedSound() { playTone(523, 0.15); setTimeout(() => playTone(659, 0.15), 150); setTimeout(() => playTone(784, 0.15), 300); setTimeout(() => playTone(1047, 0.3), 450); }
export function initAudio() { const ctx = getAudioContext(); if (ctx && ctx.state === "suspended") ctx.resume(); }
export function safePlaySound(fn: () => void) { try { const e = localStorage.getItem("uber_sound"); if (e !== "false") fn(); } catch {} }
