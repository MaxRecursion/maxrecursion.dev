# Desert hero artwork

The homepage desert is built from `public/images/desert-sky.webp`, an original landscape generated and edited with the built-in ImageGen tool and converted to WebP with Sharp. It is 1672 × 941 pixels and approximately 43 KB. The sun is rendered separately in CSS so its position, warmth, brightness and eclipse can react to the clock and theme. The original `public/images/desert-eclipse.webp` is retained as the earlier design source. PNG sources are retained locally in the ignored `.reanimate/dune-home/` evidence folder.

## Generation prompt

Use case: stylized-concept

Asset type: original cinematic website hero landscape, 16:9 widescreen bitmap.

Primary request: an immense silent desert at dusk inspired by the mood of the Dune movies, restrained and photographic, with wind-sculpted dunes occupying only the lower 40 percent of the composition. A dark eclipsed sun with a very thin muted amber crescent/ring sits in the upper-right third, centered approximately 76 percent across and 34 percent down, modest in size. Enormous dark empty sky on the left half provides quiet negative space for cream website typography added later.

Style/medium: premium cinematic landscape photography, natural dune forms, realistic subtle sand texture, very fine film grain.

Lighting/mood: contemplative dusk, deep shadows, distant low-contrast horizon, subtle atmospheric haze, stillness.

Color palette: charcoal black and muted bronze/ochre, low saturation and restrained luminosity, dark warm sky; no bright orange poster treatment.

Constraints: landscape only, no people, no spaceships, no buildings or architecture, no text, no lettering, no logos, no UI, no watermark. Keep left half very dark and uncluttered. Do not include any typography. Wide 16:9 composition.

## Sky separation edit prompt

Edit the provided desert hero landscape only to remove the baked-in dark sun/eclipse and its nearby bright circular sky glow. Fill that exact region with seamless subtly hazy dark dusk sky matching the surrounding bronze-charcoal sky. Preserve the existing dunes, every dune ridge and sand texture, horizon position, low horizon warmth, fine film grain, scene composition, image dimensions, and overall colors and exposure. This is an asset preparation edit for a website: the sky must contain no sun or eclipse because an independent animated sun will be rendered later in code. Retain the dark empty sky on the left half and the existing subtle warm light near the distant right horizon. No sun, moon, stars, disks, rings, text, people, new objects, buildings, or logos. Do not redesign, reframe, brighten, or otherwise change the landscape.

## Cloud layer

`scripts/derive-desert-clouds.mjs` splits the sky of `desert-sky.webp` into two aligned 1672 × 941 layers with Sharp (resolved through Next.js, so it is not a separate dependency):

- `desert-sky-clear.webp` is the artwork with the sky's small-scale cloud detail softened. A Gaussian blur (σ 24 px) samples sky rows only, so the mountains and dunes never bleed upward, and a sky mask blends it in from y = 540 up to y = 480. Everything below the horizon is unchanged.
- `desert-clouds.webp` keeps the original colours with an alpha that holds only that detail (its local difference from the clear sky), fading out towards the horizon and over 140 px at the left and right edges.

Drawn at offset 0, the clouds over the clear sky reproduce the artwork (mean error 0.77 of 255). The hero slides two copies with the wind on a 60-second cross-fade, about 9 CSS px per second at 1920 px wide, so the wisps move against the still horizon and pass in front of the sun. Run `node scripts/derive-desert-clouds.mjs` to regenerate both files; the output is deterministic.

## Dune contours

The spice lanes and the sandworm lanes in `lib/dune-geometry.ts` are traced from the same artwork. Bright crest lines were detected column by column, linked into ridges and hand-curated; the lanes on the dune faces follow the crests above them. Canvas layers map them onto the hero with the artwork's own `object-fit: cover` placement, so the grains and worms stay on the sand at every screen size.
