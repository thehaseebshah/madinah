# Madinah — Fourteen Stations

An immersive, interactive journey through **al-Madinah al-Munawwarah**, the Illuminated City, in fourteen stations. Ten are hand-drawn interactive scenes. Four are walkable 3D worlds that you explore in first person with **WASD** and the **E** key. Every image and every sound is generated live in the browser: there are no image, video or audio files.

Open `index.html` in a modern browser (double-clicking it works), press **Begin the journey**, and use headphones.

## The stations

| # | Station | You… | Made with |
|---|---------|------|-----------|
| I | **The Night Road** · the Hijrah, 622 CE | press and hold to walk 450 km from the Cave of Thawr to Yathrib while night turns to dawn | parallax dunes, a procedural Milky Way, footprints, a route map |
| II | **Quba, the First Stones** | tap or hold to lay basalt stones, course by course | falling-stone masonry on a chalk elevation |
| III | **The Full Moon Rises** · *Tala‘a al-Badru* | drag the moon up; windows light and the song of welcome is written into the sky | layered rooftops, a textured moon, Arabic verse revealed line by line |
| IV | **The Mosque of Palm Trunks** · 1 AH · **3D walk** | walk the first mosque in late sun; find the weeping trunk, the minbar, the Suffah and the frond roof (look up and it rains) | Three.js, dappled sunlight through an alpha-cut frond roof, mud-brick and bark textures |
| V | **The Two Qiblas** | drag the qibla from Jerusalem (332°) to Makkah (176°) | two sung tones beat against each other until the direction is true |
| VI | **The Mountain That Loves Us** · Uhud | move the sun; tap the mountain and a call echoes ridge to ridge | fractal granite ridges with sun-facing light |
| VII | **The Trench** · 5 AH · **3D walk** | walk the trench line at a winter dusk, hold E to dig three unfinished sections, strike the great rock three times | terrain you can walk down into, campfires, sparks, wind |
| VIII | **The Well of Rumah** | touch and stir the water in a basalt shaft | a real-time wave-equation simulation |
| IX | **The Palm Groves** · Ajwa | sweep as the wind; tap laden palms and gather seven dates | articulated fronds on springs |
| X | **The Blessed Valley** · Wadi al-‘Aqiq · **3D walk** | wade a moonlit stream, skip stones across it, rest under the acacia, follow the water to the lights of the city | a custom water shader with live ripples, basalt boulders, frogs and crickets |
| XI | **The Lanes of Old Madinah** · around 1900 · **3D walk** | light the lanterns of a narrow lane, knock at a door, drink at the sabil, walk until the lane opens on the Green Dome | Hijazi houses with glowing wooden *roshan* lattices |
| XII | **The Sky Beneath the Domes** | reshape the star ceiling; roll any of the 27 domes open to the sky | a WebGL star-and-cross shader |
| XIII | **A Garden of Paradise** · ar-Rawdah | draw and a gilded arabesque grows, curls and blossoms | generative vine growth |
| XIV | **The City of Light** · Madinah today | open the courtyard umbrellas at dawn, watch them fold at sunset, raise the doves | a 3D-projected courtyard, the Green Dome, moving points of light |

## Sound: voices, not instruments

`js/core/audio.js` is a small synthesiser built on the Web Audio API. Everything melodic is **sung**: a formant synthesiser passes a glottal buzz and a little breath through the resonances of the human vocal tract, so chimes become soft "ooh" and "mm" notes and swells become a slow "aah" choir. There are no instruments. Natural sound (wind, birdsong, doves, water, stone, fire, frogs, crickets) is sculpted from noise. Each station plays through its own mix bus with a generated reverb.

The voices are wordless. To use recorded nasheed or recitation instead, route your own audio files through `SND.bus` in a station.

## Controls

**Everywhere:** mouse, touch or pen. `[` / `]` (or Page Up/Down, or the arrow keys in the 2D stations) move between stations. `M` mutes, `F` toggles fullscreen. Link straight to a station with `#station-1` … `#station-14`.

**Walkable 3D stations (IV, VII, X, XI):**

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` or arrow keys | walk (left and right arrows turn) |
| `Shift` | run |
| mouse | click once to capture the mouse and look around, `Esc` to release it; or drag to look |
| `E` | interact (some actions, like digging, are held) |
| touch | left thumb walks, right thumb looks, an **E** button appears when something is in reach |

## Project layout

```
index.html              page shell, HUD, intro and finale
css/style.css           type, layout, HUD and 3D overlay styling
js/vendor/three.min.js  Three.js r128 (MIT), for the walkable stations
js/core/audio.js        Web Audio synthesiser, including the vocal synth
js/core/util.js         noise, easing and colour helpers
js/core/engine.js       stations, frame loop, input, transitions
js/core/world.js        first-person layer: movement, collision, look, E interactions, geometry baking
js/core/kit3d.js        procedural textures and models (mud brick, basalt, palms, roshan, Green Dome…)
js/stages/NN-*.js       one file per station
js/main.js              intro sky and start-up
tools/build-single.js   bundles everything into one HTML file
```

No build step is needed. To produce a single shareable file:

```bash
node tools/build-single.js dist/madinah.html
```

## Sources and care

Narrative text follows the standard accounts of the Sirah. Quoted hadith are attributed to their collections (Sahih al-Bukhari, Sahih Muslim, Jami‘ at-Tirmidhi, Musnad Ahmad, Sunan an-Nasa’i), and the Qur’anic verses to their surah and ayah. Bearings for the two qiblas are computed from Madinah’s coordinates. No people are depicted: the Prophet ﷺ and his companions are present only through places, light, sound and words.
