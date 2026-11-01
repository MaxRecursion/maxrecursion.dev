/**
 * Dune contours traced from `public/images/desert-sky.webp`, in that image's
 * pixel space (1672 × 941). Bright crest lines were detected column by column
 * and linked into ridges, then hand-curated; see `docs/desert-artwork.md`.
 * Canvas layers map them onto the hero with the same `object-fit: cover`
 * geometry as the artwork, so motion stays on the dunes at every size.
 */
export type Point = readonly [number, number];

export const DESERT_IMAGE = { width: 1672, height: 941 } as const;

/** `object-position` of the artwork: 72% on wide screens, 67% on phones. */
export const DESERT_FOCUS = { wide: 0.72, compact: 0.67 } as const;
export const COMPACT_QUERY = "(max-width: 767px)";

export type Cover = { scale: number; x: number; y: number };

/** CSS `object-fit: cover` placement of the artwork inside a width × height box. */
export function coverTransform(width: number, height: number, focusX: number, focusY = 0.5): Cover {
  const scale = Math.max(width / DESERT_IMAGE.width, height / DESERT_IMAGE.height);
  return {
    scale,
    x: (width - DESERT_IMAGE.width * scale) * focusX,
    y: (height - DESERT_IMAGE.height * scale) * focusY,
  };
}

export function toScreen(cover: Cover, x: number, y: number): [number, number] {
  return [cover.x + x * cover.scale, cover.y + y * cover.scale];
}

export function toImage(cover: Cover, x: number, y: number): [number, number] {
  return [(x - cover.x) / cover.scale, (y - cover.y) / cover.scale];
}

export type PathSample = {
  x: number;
  y: number;
  /** Unit tangent in the direction of travel. */
  tx: number;
  ty: number;
};

/** A smoothed polyline resampled at a fixed arc-length step. */
export type DunePath = {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly step: number;
  readonly length: number;
};

/**
 * Uniform Catmull–Rom through the control points, resampled about every
 * `step` pixels so `samplePath` is a constant-time lookup.
 */
export function createPath(points: readonly Point[], step = 2): DunePath {
  if (points.length < 2) throw new RangeError("A dune path needs at least two points.");
  if (!(step > 0)) throw new RangeError("A dune path step must be positive.");

  const dense: [number, number][] = [];
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    const pieces = Math.max(4, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let j = 0; j < pieces; j++) {
      const t = j / pieces;
      const t2 = t * t;
      const t3 = t2 * t;
      dense.push([
        0.5 * (2 * x1 + (-x0 + x2) * t + (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 + (-x0 + 3 * x1 - 3 * x2 + x3) * t3),
        0.5 * (2 * y1 + (-y0 + y2) * t + (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 + (-y0 + 3 * y1 - 3 * y2 + y3) * t3),
      ]);
    }
  }
  dense.push([points[points.length - 1][0], points[points.length - 1][1]]);

  const cumulative = [0];
  for (let i = 1; i < dense.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  }
  const length = cumulative[cumulative.length - 1];
  // Round the step so the last sample lands exactly on the final control point.
  const count = Math.max(2, Math.ceil(length / step) + 1);
  const spacing = length / (count - 1);
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  let k = 0;
  for (let i = 0; i < count; i++) {
    const s = Math.min(i * spacing, length);
    while (k < cumulative.length - 2 && cumulative[k + 1] < s) k++;
    const span = cumulative[k + 1] - cumulative[k] || 1;
    const f = (s - cumulative[k]) / span;
    xs[i] = dense[k][0] + (dense[k + 1][0] - dense[k][0]) * f;
    ys[i] = dense[k][1] + (dense[k + 1][1] - dense[k][1]) * f;
  }
  return { xs, ys, step: spacing, length };
}

/** Position and tangent at arc length `s`; beyond either end it extends straight on. */
export function samplePath(path: DunePath, s: number, out: PathSample = { x: 0, y: 0, tx: 1, ty: 0 }): PathSample {
  const last = path.xs.length - 1;
  const clamped = Math.max(0, Math.min(path.length, s));
  const position = clamped / path.step;
  const i = Math.min(last - 1, Math.floor(position));
  const f = Math.min(1, position - i);
  const dx = path.xs[i + 1] - path.xs[i];
  const dy = path.ys[i + 1] - path.ys[i];
  const norm = Math.hypot(dx, dy) || 1;
  out.tx = dx / norm;
  out.ty = dy / norm;
  out.x = path.xs[i] + dx * f + out.tx * (s - clamped);
  out.y = path.ys[i] + dy * f + out.ty * (s - clamped);
  return out;
}

/** Arc length at which a path first reaches the vertical line `x` (or its far end). */
export function arcLengthAtX(path: DunePath, x: number): number {
  const sign = path.xs[path.xs.length - 1] >= path.xs[0] ? 1 : -1;
  if (sign * (path.xs[0] - x) >= 0) return 0;
  for (let i = 1; i < path.xs.length; i++) {
    if (sign * (path.xs[i] - x) >= 0) {
      const f = (x - path.xs[i - 1]) / (path.xs[i] - path.xs[i - 1] || 1);
      return (i - 1 + f) * path.step;
    }
  }
  return path.length;
}

export type SpiceLane = {
  id: string;
  /** Control points in image pixels, ordered with the wind (left to right). */
  points: readonly Point[];
  /** How far below the contour (image px) grains may ride, densest at the line. */
  spread: number;
  /** Relative share of grains. */
  weight: number;
  /** Image x of crests where the wind lifts grains off the sand. */
  liftoff?: readonly number[];
};

/**
 * Wind-driven spice paths over the sand: crest lines first, then contours down
 * the faces below them. Lanes far to the left sit under the text shade.
 */
export const SPICE_LANES: readonly SpiceLane[] = [
  {
    id: "ridge",
    points: [[180, 822], [330, 805], [430, 792], [526, 778], [622, 765], [722, 749], [820, 734], [916, 710], [1012, 683], [1056, 674], [1084, 669], [1110, 674], [1156, 685], [1228, 696], [1300, 712], [1372, 723], [1446, 732], [1520, 743], [1594, 754], [1672, 765], [1730, 773]],
    spread: 18,
    weight: 0.2,
    liftoff: [1084],
  },
  {
    id: "ridge-face-upper",
    points: [[700, 790], [820, 772], [916, 748], [1012, 721], [1084, 707], [1156, 723], [1228, 734], [1300, 750], [1372, 761], [1446, 770], [1520, 781], [1594, 792], [1672, 803], [1730, 811]],
    spread: 26,
    weight: 0.1,
  },
  {
    id: "ridge-face-middle",
    points: [[760, 850], [880, 820], [1000, 790], [1084, 770], [1170, 785], [1260, 800], [1360, 815], [1460, 828], [1560, 842], [1672, 858], [1730, 866]],
    spread: 32,
    weight: 0.08,
  },
  {
    id: "ridge-face-lower",
    points: [[820, 925], [960, 885], [1084, 850], [1200, 865], [1340, 885], [1480, 905], [1620, 925], [1730, 940]],
    spread: 36,
    weight: 0.06,
  },
  {
    id: "back-crest",
    points: [[1000, 604], [1062, 601], [1100, 602], [1172, 602], [1220, 597], [1246, 594], [1270, 599], [1318, 600], [1366, 598], [1390, 592], [1414, 585], [1438, 579], [1462, 576], [1486, 579], [1504, 587], [1528, 597], [1552, 607], [1576, 617], [1600, 627], [1624, 635], [1648, 642], [1672, 647], [1730, 658]],
    spread: 12,
    weight: 0.14,
    liftoff: [1246, 1462],
  },
  {
    id: "crescent",
    points: [[1250, 686], [1286, 677], [1310, 676], [1334, 672], [1358, 669], [1382, 663], [1406, 658], [1430, 652], [1454, 644], [1478, 635], [1502, 620], [1516, 606], [1526, 594]],
    spread: 9,
    weight: 0.07,
    liftoff: [1520],
  },
  {
    id: "windward",
    points: [[1090, 668], [1128, 658], [1152, 656], [1176, 651], [1200, 646], [1224, 641], [1248, 634], [1272, 628], [1296, 621]],
    spread: 8,
    weight: 0.05,
  },
  {
    id: "back-face",
    points: [[1262, 694], [1320, 697], [1380, 694], [1440, 689], [1500, 682], [1560, 684], [1620, 692], [1672, 700], [1730, 708]],
    spread: 18,
    weight: 0.06,
  },
  {
    id: "mid-dune",
    points: [[790, 636], [836, 643], [884, 649], [932, 648], [976, 645], [1016, 641], [1050, 640]],
    spread: 10,
    weight: 0.04,
  },
  {
    id: "mid-left",
    points: [[440, 726], [514, 725], [610, 724], [688, 723], [764, 721], [842, 721], [880, 722]],
    spread: 14,
    weight: 0.04,
  },
  {
    id: "foreground",
    points: [[200, 890], [264, 894], [366, 902], [462, 910], [532, 916], [606, 922], [702, 930], [780, 938], [830, 944]],
    spread: 12,
    weight: 0.03,
  },
];

export type WormLaneId = "ridge" | "peak" | "horizon";

/**
 * Crest lines the sandworms swim along, in travel direction. The sand surface
 * is the line itself: whatever a worm keeps below it is hidden in the dune.
 */
export const WORM_LANES: Readonly<Record<WormLaneId, readonly Point[]>> = {
  // The foreground ridge, from its apex down to the right edge and beyond.
  ridge: [[1100, 672], [1132, 679], [1156, 685], [1180, 688], [1204, 692], [1228, 696], [1252, 701], [1276, 707], [1300, 712], [1324, 718], [1348, 721], [1372, 723], [1396, 726], [1420, 729], [1446, 732], [1472, 736], [1496, 739], [1520, 743], [1546, 747], [1570, 752], [1594, 754], [1618, 757], [1642, 760], [1666, 764], [1700, 769], [1780, 781]],
  // Over the tall back dune's peak, silhouetted against the horizon haze.
  peak: [[1384, 594], [1414, 585], [1438, 579], [1462, 576], [1486, 579], [1504, 587], [1528, 597], [1552, 607], [1576, 617], [1600, 627], [1624, 635], [1648, 642], [1672, 647], [1700, 652], [1780, 668]],
  // Westward along the low dunes on the horizon, ending well short of the text.
  horizon: [[1368, 598], [1342, 601], [1318, 600], [1294, 598], [1270, 599], [1246, 594], [1220, 597], [1196, 602], [1172, 602], [1144, 601], [1120, 602], [1096, 602], [1062, 601], [1020, 602], [960, 604]],
};
