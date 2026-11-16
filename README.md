# Sirah in Light and Sound

An interactive 3D Sirah: the life of the Prophet Muhammad ﷺ told through the places where it happened, in **two worlds**, **Makkah** and **Madinah**. Choose a city, explore its 3D relief map, and enter any station. All 24 stations are photoreal 3D worlds. Each opens with a short film and is a different kind of game: a platformer, a stealth game, a rail flyer, a rhythm game, a farming game, a train to drive. A guide narrates every station in **English or Arabic**, and every story carries its **sources, graded for authenticity**.

Serve the folder (`python3 -m http.server`) and open it in a modern browser, choose **Makkah** or **Madinah**, and use headphones. Double-clicking `index.html` also works, with simpler procedural visuals.

## The two worlds

On the start screen, choose a city. Each opens a 3D relief model of the city with its stations pinned where they happened: drag to turn it, scroll or pinch to zoom, right-drag to pan, and use the arrow keys or the station list to move between pins. Select a pin to see its date, its sources, and **Enter the station**. The **Map** button returns to the map from any station. Visited stations are marked on the map and remembered on the device.

### Makkah al-Mukarramah · c. 605 – 632 CE

| # | Station | Kind of game | You… |
|---|---------|--------------|------|
| I | **The Ka‘bah Rebuilt** · c. 605 | block stacking, then balance | lay the stone courses from the scaffold, then carry the Black Stone level on a cloak with every clan |
| II | **The Cave of Hira** · 610 | first-person parkour | jump, sprint and climb up Jabal an-Nur, lighting lanterns, to the cave of the first revelation |
| III | **The Call from as-Safa** · c. 613 | 2.5D side-scrolling platformer | run and jump across the rooftops at dawn to the rock of as-Safa |
| IV | **The Boycott in the Ravine** · c. 616–619 | stealth | carry food by night through moon-shadow, past the torches, to the shelters |
| V | **The Night Journey** · c. 620 | rail flyer | steer a light through rings toward al-Aqsa and up through the heavens (light alone, nothing depicted) |
| VI | **The Pledges of al-‘Aqabah** · 621–622 | follower commands | whistle a line of lanterns together and lead them unseen to the meeting place |
| VII | **The Cave of Thawr** · 622 | hide and hold your breath | stay deep in the cave and keep still while the search passes, three nights |
| VIII | **The Night Road** · 622 | endless runner | change lanes, jump and duck along the wadi behind the guide's lamp |
| IX | **The Return to Makkah** · 630 | first-person aiming | aim at the standing stones round the House and strike them down |
| X | **The Farewell Sermon** · 632 | call and response | listen to each phrase on four lamps and sing it back to those further off |

### al-Madinah al-Munawwarah · 622 CE – today

| # | Station | Kind of game | You… |
|---|---------|--------------|------|
| I | **Quba, the First Stones** | push-block puzzles | push the foundation stones onto their chalk marks |
| II | **The Full Moon Rises** | rhythm highway | strike the lamps in time as the city comes out to welcome him |
| III | **The Mosque of Palm Trunks** | construction | set the trunks, pillars, bricks and frond roof on the plan |
| IV | **The Two Qiblas** | perspective rotation | turn the world until broken paths join, as the qiblah turned |
| V | **The Mountain That Loves Us** | viewpoint alignment | hold old sketches up against Uhud and find where each was drawn |
| VI | **The Trench** | maze tower defence | dig the trench cell by cell and set lamp-watches before dark |
| VII | **The Well of Rumah** | flow puzzle | lay channel pieces while the bucket rises, and bring water to every garden |
| VIII | **The Palm Groves** | farming | pollinate, water, guard and harvest through the seasons of a palm garden |
| IX | **The Blessed Valley** | be the wind | sweep low over Wadi al-‘Aqiq and open its flowers |
| X | **The Lanes of Old Madinah** | maze with lamp oil | steer a lantern through the lanes and light every lamp before the oil runs low |
| XI | **The Hejaz Railway** · 1908 | train driving | work the regulator, brake, fire and whistle and bring the train into Madinah |
| XII | **The Sky Beneath the Domes** | light and mirrors | roll a dome open and turn mirrors to carry sunlight to the lamps |
| XIII | **A Garden of Paradise** | brush drawing | draw the patterns of the Rawdah's columns with a brush of light |
| XIV | **The City of Light** | time management | open umbrellas, fetch water and care for the courtyard through one day |

Every station opens with a **short film** of five to seven shots: a title card, sourced subtitles in English and Arabic, and a camera that passes through different parts of the world before it hands control to you (press any key or tap to skip). Each station is a **different kind of game**, with no score and no fail screen, and each world hides five to eight **discoveries**: optional places with a short sourced fact. The art direction is written up in [`docs/DESIGN.md`](docs/DESIGN.md).

### Photoreal worlds

Outdoor scenes are lit by photographed HDRI skies, and ground, rock, plaster, brick, marble, bark and timber are photo-scanned materials. Boulders, shrubs, grass and small objects are scanned models. All of these are CC0 assets from [Poly Haven](https://polyhaven.com), stored in `assets/` and prepared by `tools/assets/fetch-polyhaven.py`.

These assets load only when the page is **served over http(s)** (for example `python3 -m http.server`, then open `http://localhost:8000`). Opened straight from disk, browsers block local images in WebGL, so the stations fall back to procedural materials and skies; everything still works. Add `?photo=0` to force the fallback, or `?q=low` for a lighter scene on slow devices.

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
- **The Farewell Sermon:** “Have I conveyed?” and “let those present tell those absent” are attributed to the sermon at Mina; the scene says so.
- **The conquest:** “Go, you are free” has a weak chain and is labelled as tradition.

There are 91 graded claims across the 24 stations.

The data lives in `js/data/sources.verified.json`. After editing it, run `node tools/build-sources.js`.

## Narration

Each station has a short spoken guide in English and Arabic, with captions. The **EN / ع / —** button (or `N`) switches language or turns it off. The recordings in `audio/narration/<lang>/<station>.mp3` are made with free, open-source models: **Kokoro-82M** for English and **Piper ar_JO-kareem** for Arabic, with automatic diacritisation. If a file is missing, the device's own voices are used.

```bash
pip install kokoro-onnx piper-tts soundfile numpy
```

```bash
node tools/tts/merge-drafts.js
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

**In a station:** each game shows its own controls in the hint at the bottom of the screen and in the activity card. Most use `W` `A` `S` `D` or the arrow keys, the mouse, `Space` and `E`; on touch screens, on-screen controls appear. Many stations also let you walk the land freely (`V` or `Q`, as the hint says).

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
js/core/world.js         first-person layer: movement, look, films, discoveries, shadows, baking
js/core/kit3d.js         procedural materials and models (valley of Makkah, Ka‘bah, palms, Green Dome…)
js/core/scape.js         landscapes: terrain, horizon, instanced scatter, birds, smoke, post-processing
js/core/photo.js         Poly Haven skies, PBR materials and scanned models
assets/                  CC0 textures, HDRI skies and models from Poly Haven
js/core/narration.js     bilingual narration script, player and captions
js/core/audio.js         Web Audio synthesiser and vocal synth
js/stages/NN-*.js        one file per station
tools/                   build-single.js, build-sources.js, tts/, assets/fetch-polyhaven.py
```

To produce a single shareable HTML file (narration audio stays in `audio/`, photo assets in `assets/`):

```bash
node tools/build-single.js dist/sirah.html
```
