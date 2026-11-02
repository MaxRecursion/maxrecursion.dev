import { THUMP_INTERVAL, thumperBeats, type Summons } from "@/lib/sandworms";
import { wormClock } from "./wormTracks";

let audio: AudioContext | null = null;
let noise: AudioBuffer | null = null;
/** The latest planting; an older one finishing never silences a newer one. */
let generation = 0;

/** One second of white noise, shared by the sand of every strike and the worm's rumble. */
function getNoise(context: AudioContext) {
  if (!noise) {
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** Connects a chain of nodes one by one (older Safari's connect() returns nothing to chain on). */
function chain(...nodes: AudioNode[]) {
  for (let i = 1; i < nodes.length; i++) nodes[i - 1].connect(nodes[i]);
}

/** An envelope that rises fast to `peak` and decays exponentially. */
function envelope(gain: GainNode, at: number, peak: number, attack: number, decay: number) {
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

/**
 * A thumper's strike: a low thud that drops in pitch, a knock high enough for
 * phone and laptop speakers, and a short hiss of sand thrown up.
 */
function strike(context: AudioContext, out: AudioNode, at: number) {
  const tones: [OscillatorType, number, number, number, number][] = [
    // type, start Hz, end Hz, peak, decay s
    ["sine", 96, 42, 0.9, 0.38],
    ["triangle", 240, 150, 0.35, 0.12],
  ];
  for (const [type, from, to, peak, decay] of tones) {
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.type = type;
    tone.frequency.setValueAtTime(from, at);
    tone.frequency.exponentialRampToValueAtTime(to, at + decay * 0.5);
    envelope(gain, at, peak, 0.004, decay);
    chain(tone, gain, out);
    tone.start(at);
    tone.stop(at + decay + 0.05);
  }
  for (const [frequency, peak, decay] of [[900, 0.25, 0.1], [2200, 0.3, 0.035]]) {
    const sand = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    sand.buffer = getNoise(context);
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    envelope(gain, at, peak, 0.003, decay);
    chain(sand, filter, gain, out);
    sand.start(at, Math.random() * 0.5);
    sand.stop(at + decay + 0.05);
  }
}

/** Shai-Hulud rising: a deep swell of moving sand over a low, beating drone. */
function rumble(context: AudioContext, out: AudioNode, at: number, length: number) {
  const sand = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const sandGain = context.createGain();
  sand.buffer = getNoise(context);
  sand.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = 320;
  sandGain.gain.setValueAtTime(0.0001, at);
  sandGain.gain.exponentialRampToValueAtTime(3, at + length * 0.35);
  sandGain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  chain(sand, filter, sandGain, out);
  sand.start(at);
  sand.stop(at + length + 0.05);
  for (const frequency of [55, 110.7]) {
    const drone = context.createOscillator();
    const gain = context.createGain();
    drone.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.35, at + length * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    chain(drone, gain, out);
    drone.start(at);
    drone.stop(at + length + 0.05);
  }
  return sand;
}

/**
 * Wakes the audio, from inside the click, and returns how far ahead (seconds)
 * the thumper should be planted so its strikes are heard as they are seen:
 * the output latency, plus a little while the device is still starting up.
 */
export function prepareThumperAudio(): number {
  const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return 0;
  if (!audio || audio.state === "closed") audio = new AudioContextClass();
  // Safari can also leave a context "interrupted"; anything but running gets resumed.
  const starting = audio.state !== "running";
  if (starting) void audio.resume().catch(() => {});
  return (audio.outputLatency || 0) + (audio.baseLatency || 0) + (starting ? 0.08 : 0);
}

/** Plays a planted thumper: a strike on every beat it shows, then the rumble as Shai-Hulud answers. */
export function playThumper(summons: Summons) {
  if (!audio) return;
  const context = audio;
  const latency = (context.outputLatency || 0) + (context.baseLatency || 0);
  // Map the worm clock onto the audio clock, early by the output latency.
  const toAudio = (time: number) => Math.max(context.currentTime, context.currentTime + time - wormClock() - latency);
  const compressor = context.createDynamicsCompressor();
  const out = context.createGain();
  out.gain.value = 0.5;
  chain(out, compressor, context.destination);

  const { first, count } = thumperBeats(summons);
  for (let k = 0; k < count; k++) strike(context, out, toAudio(first + k * THUMP_INTERVAL));
  const last = rumble(context, out, toAudio(summons.rearAt - 0.6), 4);

  // Once it has all played, let go of the graph and, unless another thumper started, the device.
  const mine = ++generation;
  last.onended = () => {
    out.disconnect();
    compressor.disconnect();
    if (mine === generation) void context.suspend().catch(() => {});
  };
}
