# Madinah — Sixteen Stations

An immersive, interactive journey through **al-Madinah al-Munawwarah**, the Illuminated City, in sixteen stations. Nine are hand-drawn interactive scenes with depth parallax. Seven are walkable 3D worlds that you explore in first person with **WASD** and **E**. A guide narrates every station in **English or Arabic**. Apart from the narration, every image and sound is generated live in the browser.

Open `index.html` in a modern browser (double-clicking it works), press **Begin the journey**, and use headphones.

## The stations

| # | Station | You… |
|---|---------|------|
| I | **The Cave of Thawr** · 622 · **3D** | crouch in a granite cave above moonlit mountains, find the web and the nest at the entrance, and hear the search party pass the mouth of the cave |
| II | **The Night Road** · the Hijrah | press and hold to walk 450 km while night turns to dawn |
| III | **Quba, the First Stones** | lay basalt stones course by course |
| IV | **The Full Moon Rises** · *Tala‘a al-Badru* | drag the moon up; windows light and the song is written in the sky |
| V | **The Mosque of Palm Trunks** · 1 AH · **3D** | walk the first mosque in dappled sun; the weeping trunk, the minbar, the Suffah, the frond roof |
| VI | **The Two Qiblas** | turn the qibla from Jerusalem to Makkah until two voices become one |
| VII | **The Mountain That Loves Us** · Uhud | move the sun; tap the mountain and a call echoes ridge to ridge |
| VIII | **The Trench** · 5 AH · **3D** | dig out the unfinished sections and strike the great rock three times |
| IX | **The Well of Rumah** | stir the water at the bottom of a basalt shaft |
| X | **The Palm Groves** · Ajwa | be the wind in the palms and gather seven dates |
| XI | **The Blessed Valley** · Wadi al-‘Aqiq · **3D** | wade a moonlit stream, skip stones, follow the water to the city lights |
| XII | **The Lanes of Old Madinah** · c. 1900 · **3D** | light the lanterns, knock at a door, drink at the sabil, reach the Green Dome |
| XIII | **The Hejaz Railway** · 1908 · **3D** | ring the station bell and meet the train from Damascus |
| XIV | **The Sky Beneath the Domes** | reshape the star ceiling and roll the domes open |
| XV | **A Garden of Paradise** · ar-Rawdah | draw and a gilded arabesque grows and blossoms |
| XVI | **The City of Light** · today · **3D** | open the courtyard's giant umbrellas at dawn, walk among the doves, stay until the lamps are lit |

## Narration

Each station has a short spoken guide in English and Arabic, with captions. The **EN / ع / —** button in the top bar (or `N`) switches language or turns it off; the story panel folds away while the guide speaks.

The voices are recorded files in `audio/narration/<lang>/<station>.mp3`. If a file is missing, the tour falls back to the device's own speech voices, and to captions alone if the device has no voice for that language.

The current recordings are made with free, open-source models running locally:

- English: **Kokoro-82M** (Apache-2.0), voice `bm_george`
- Arabic: **Piper** `ar_JO-kareem` (MIT), with automatic diacritisation

To regenerate them, or to replace them with ElevenLabs voices:

```bash
pip install kokoro-onnx piper-tts soundfile numpy
```

```bash
python tools/tts/generate.py --engine local --models /path/to/models
```

```bash
ELEVENLABS_API_KEY=your-key python tools/tts/generate.py --engine elevenlabs --en-voice <voice_id> --ar-voice <voice_id>
```

Add `--only thawr,hijrah` to redo some stations or `--lang ar` for one language. The script text lives in `js/core/narration.js`; after editing it, run `node tools/tts/export-script.js` before generating. No code changes are needed when the audio files are replaced.

## Sound

Everything melodic is sung by a formant voice synthesiser (wordless "ooh", "mm" and "aah" choirs); there are no instruments. Wind, birds, doves, water, stone, fire, steam and crickets are sculpted from noise.

## Controls

**Everywhere:** mouse, touch or pen. `[` / `]` (or Page Up/Down) change station. `M` mutes, `N` changes narration, `F` toggles fullscreen. Link to a station with `#station-1` … `#station-16`. In the 2D stations, moving the pointer tilts the layers in depth.

**Walkable 3D stations:**

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` or arrow keys | walk (left and right arrows turn) |
| `Shift` | run |
| mouse | click to capture the mouse and look around, `Esc` to release; or drag to look |
| `E` | interact (some actions, like digging, are held) |
| touch | left thumb walks, right thumb looks, an **E** button appears when something is in reach |

## Project layout

```
index.html              page shell, HUD, intro and finale
css/style.css           type, layout, HUD, captions and 3D overlay styling
audio/narration/        recorded narration (en/, ar/) and script.json
js/vendor/three.min.js  Three.js r128 (MIT)
js/core/audio.js        Web Audio synthesiser, including the vocal synth
js/core/narration.js    bilingual narration script, player and captions
js/core/engine.js       stations, frame loop, input, transitions, parallax
js/core/world.js        first-person layer: movement, collision, look, E interactions,
                        player-following shadows, geometry baking
js/core/kit3d.js        procedural textures with relief, and models (palms, roshan, Green Dome…)
js/stages/NN-*.js       one file per station
tools/tts/generate.py   narration generator (open-source or ElevenLabs)
tools/build-single.js   bundles the page into one HTML file
```

To produce a single shareable HTML file (narration audio stays in `audio/`):

```bash
node tools/build-single.js dist/madinah.html
```

## Sources and care

Narrative text follows the standard accounts of the Sirah. Quoted hadith are attributed to their collections (Sahih al-Bukhari, Sahih Muslim, Jami‘ at-Tirmidhi, Musnad Ahmad, Sunan an-Nasa’i), and Qur’anic verses to their surah and ayah. Traditions with weaker chains, such as the spider's web at Thawr, are presented as tradition. No people are depicted: the Prophet ﷺ and his companions are present only through places, light, sound and words.
