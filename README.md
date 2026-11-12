# Sirah in Light and Sound

An interactive 3D Sirah: the life of the Prophet Muhammad ﷺ told through the places where it happened, in **two worlds**, **Makkah** and **Madinah**. Choose a city, explore its 3D relief map, and enter any station. Ten stations are walkable 3D scenes (WASD and E); the others are hand-drawn interactive scenes. A guide narrates every station in **English or Arabic**, and every story carries its **sources, graded for authenticity**.

Open `index.html` in a modern browser (double-clicking it works), choose **Makkah** or **Madinah**, and use headphones.

## The two worlds

On the start screen, choose a city. Each opens a 3D relief model of the city with its stations pinned where they happened: drag to turn it, scroll or pinch to zoom, right-drag to pan, and use the arrow keys or the station list to move between pins. Select a pin to see its date, its sources, and **Enter the station**. The **Map** button returns to the map from any station. Visited stations are marked on the map and remembered on the device.

### Makkah al-Mukarramah · c. 605 – 622 CE

| # | Station | You… |
|---|---------|------|
| I | **The Ka‘bah Rebuilt** · c. 605 · 3D | carry stones for the rising walls; when the clans quarrel over the Black Stone, walk through the gate of Banu Shaybah, and the stone is raised on a cloak by every clan together |
| II | **The Cave of Hira** · 610 · 3D | climb Jabal an-Nur on a Ramadan night; at the cave the first verses of Surat al-‘Alaq are written in light over the valley |
| III | **The Call from as-Safa** · c. 613 · 3D | raise the morning call from the rock of as-Safa and watch the lights of Quraysh gather below |
| IV | **The Cave of Thawr** · 622 · 3D | hide in the cave as the search party passes its mouth |
| V | **The Night Road** · 622 · 2D | walk the Hijrah route north as night turns to dawn |

### al-Madinah al-Munawwarah · 622 CE – today

| # | Station | You… |
|---|---------|------|
| I | **Quba, the First Stones** · 2D | lay the stones of the first mosque |
| II | **The Full Moon Rises** · 2D | raise the moon over Yathrib as the city welcomes him |
| III | **The Mosque of Palm Trunks** · 3D | walk the first Prophet’s Mosque: the weeping trunk, the minbar, the Suffah, the frond roof |
| IV | **The Two Qiblas** · 2D | turn the qibla from Jerusalem to Makkah |
| V | **The Mountain That Loves Us** · 2D | move the sun over Uhud and call to the mountain |
| VI | **The Trench** · 3D | dig out the trench and strike the great rock |
| VII | **The Well of Rumah** · 2D | stir the water of ‘Uthman’s endowment |
| VIII | **The Palm Groves** · 2D | gather seven Ajwa dates |
| IX | **The Blessed Valley** · 3D | wade Wadi al-‘Aqiq and follow it to the city lights |
| X | **The Lanes of Old Madinah** · 3D | light the lanterns of the old city |
| XI | **The Hejaz Railway** · 3D | meet the train from Damascus, 1908 |
| XII | **The Sky Beneath the Domes** · 2D | roll open the domes of the Prophet’s Mosque |
| XIII | **A Garden of Paradise** · 2D | grow a garden in ar-Rawdah |
| XIV | **The City of Light** · 3D | open the courtyard umbrellas at dawn and stay until the lamps are lit |

## Sources and authenticity

Every station has a **Sources and authenticity** panel (in the story panel). Each claim behind the station's story, narration and in-scene text is listed with its reference, a link, a note, and a grade:

| Grade | Meaning |
|-------|---------|
| Qur’an | stated in the Qur’an (surah:ayah) |
| Sahih | in Sahih al-Bukhari or Sahih Muslim, or graded sahih by recognised scholars |
| Hasan | graded hasan by recognised hadith scholars (named in the note) |
| Sirah report | in the classical biographies (Ibn Ishaq / Ibn Hisham, Ibn Sa‘d, al-Waqidi, al-Tabari) without a strong chain |
| Weak / disputed | a weak or disputed report, kept and labelled as tradition |
| Historical record | a modern historical fact with a reliable reference |

Hadith numbers follow sunnah.com numbering. Each was checked against the text and grading on a mirror with the same numbering, since sunnah.com refuses automated requests. Where the verification changed the story, the text was corrected. For example:

- **Tala‘a al-Badru:** the welcome itself is sahih (al-Bukhari), but the song's chain is broken, and some scholars place it at the return from Tabuk. It is presented as a loved tradition with a weak report.
- **Masjid al-Qiblatayn:** the sahih reports do not name the mosque. The Banu Salimah attribution is marked as later tradition.
- **The three strikes at the Trench:** the rock itself is sahih (al-Bukhari). The three-strike visions survive in two versions with disputed chains, and both are named.
- **The spider and the doves at Thawr:** the report is weak and is presented as tradition.

The data lives in `js/data/sources.verified.json`. After editing it, run `node tools/build-sources.js`.

## Narration

Each station has a short spoken guide in English and Arabic, with captions. The **EN / ع / —** button (or `N`) switches language or turns it off. The recordings in `audio/narration/<lang>/<station>.mp3` are made with free, open-source models: **Kokoro-82M** for English and **Piper ar_JO-kareem** for Arabic, with automatic diacritisation. If a file is missing, the device's own voices are used.

```bash
pip install kokoro-onnx piper-tts soundfile numpy
```

```bash
node tools/tts/export-script.js
```

```bash
python tools/tts/generate.py --engine local --models /path/to/models
```

```bash
ELEVENLABS_API_KEY=your-key python tools/tts/generate.py --engine elevenlabs --en-voice <voice_id> --ar-voice <voice_id>
```

Add `--only kabah,hira` for some stations or `--lang ar` for one language. Replacing the audio files needs no code changes.

## Sound

Everything melodic is sung by a formant voice synthesiser (wordless "ooh", "mm" and "aah" choirs); there are no instruments. Natural sound (wind, birds, doves, water, stone, fire, steam, crickets) is sculpted from noise. Crowds are suggested by murmured, wordless voices.

## Care in depiction

No person is depicted. The Prophet ﷺ, his family and his companions are present only through places, light, sound and quoted words; crowds appear as lights, banners and murmurs. In the walkable scenes you are a witness, never a figure from the Sirah.

## Controls

**Everywhere:** mouse, touch or pen. `[` / `]` change station within a world, `M` mutes, `N` changes narration, `F` toggles fullscreen. Deep links: `#makkah`, `#madinah`, `#<station-id>` (for example `#hira`).

**Walkable 3D stations:** `W` `A` `S` `D` or arrow keys walk, `Shift` runs, the mouse looks (click to capture it, `Esc` to release, or drag), `E` interacts (some actions are held). On touch screens the left thumb walks, the right thumb looks, and an **E** button appears when something is in reach.

## Project layout

```
index.html               start screen, atlas, HUD, sources dialog, finale
css/style.css            all styling
audio/narration/         narration recordings (en/, ar/) and script.json
js/data/stations.js      the two worlds, station coordinates, dates and map text
js/data/sources.*        verified sources (JSON, generated embed, and the dialog)
js/vendor/three.min.js   Three.js r128 (MIT)
js/core/atlas.js         3D relief maps of Makkah and Madinah
js/core/engine.js        stations, worlds, frame loop, input, transitions
js/core/world.js         first-person layer: movement, look, E interactions, shadows, baking
js/core/kit3d.js         procedural materials and models (valley of Makkah, Ka‘bah, palms, Green Dome…)
js/core/narration.js     bilingual narration script, player and captions
js/core/audio.js         Web Audio synthesiser and vocal synth
js/stages/NN-*.js        one file per station
tools/                   build-single.js, build-sources.js, tts/
```

To produce a single shareable HTML file (narration audio stays in `audio/`):

```bash
node tools/build-single.js dist/sirah.html
```
