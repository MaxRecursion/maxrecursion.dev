export type SolarPhase = "dawn" | "day" | "dusk" | "night";

export type SolarCycle = {
  phase: SolarPhase;
  /** Pune wall-clock minutes since midnight, including fractional minutes. */
  minutes: number;
  /** Stylized daylight elevation: 0 at night, 1 at noon. */
  elevation: number;
  /** Position in percent, confined to the right-hand side of the hero. */
  x: number;
  y: number;
  /** Normalized styling values; warmth is strongest near the horizon. */
  warmth: number;
  glow: number;
  brightness: number;
};

const MINUTES_PER_DAY = 24 * 60;
const puneTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function smoothstep(from: number, to: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/**
 * A decorative daily rhythm, not an astronomical sunrise/sunset calculation.
 * The sun rises at 06:00, peaks at 12:00 and sets at 18:00. At night a dim
 * eclipse returns through the lower sky. All styling values remain continuous
 * at the horizon and midnight; only the descriptive phase label changes.
 */
export function getSolarCycleAtMinutes(value: number): SolarCycle {
  if (!Number.isFinite(value)) throw new RangeError("Solar-cycle minutes must be finite.");

  const minutes = ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const angle = ((minutes - 6 * 60) / MINUTES_PER_DAY) * Math.PI * 2;
  const altitude = Math.sin(angle);
  const elevation = minutes > 6 * 60 && minutes < 18 * 60 ? Math.max(0, altitude) : 0;
  const light = smoothstep(-0.12, 0.2, altitude);

  const phase: SolarPhase = minutes >= 5 * 60 && minutes < 8 * 60
    ? "dawn"
    : minutes >= 8 * 60 && minutes < 17 * 60
      ? "day"
      : minutes >= 17 * 60 && minutes < 20 * 60
        ? "dusk"
        : "night";

  return {
    phase,
    minutes,
    elevation,
    x: 77 - 9 * Math.cos(angle),
    // Squaring the altitude keeps the position smooth at the horizon. The
    // night arc reaches 42%, so the eclipse never vanishes below the hero.
    y: 60 - (altitude >= 0 ? 40 : 18) * altitude * altitude,
    warmth: 1 - 0.65 * elevation,
    glow: 0.08 + 0.68 * light + 0.24 * elevation,
    brightness: 0.16 + 0.84 * light,
  };
}

/** Always uses Pune time, regardless of the visitor's or server's time zone. */
export function getSolarCycle(date: Date): SolarCycle {
  if (!Number.isFinite(date.getTime())) throw new RangeError("Solar-cycle date must be valid.");

  const parts = puneTime.formatToParts(date);
  const part = (type: "hour" | "minute" | "second") => Number(parts.find((entry) => entry.type === type)?.value);
  const minutes = part("hour") * 60 + part("minute") + part("second") / 60 + date.getUTCMilliseconds() / 60_000;
  return getSolarCycleAtMinutes(minutes);
}
