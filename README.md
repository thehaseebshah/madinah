# Sirah in Light and Sound

An interactive 3D Sirah: the life of the Prophet Muhammad ﷺ told through the places where it happened, in **two worlds**, **Makkah** and **Madinah**. Choose a city, explore its 3D relief map, and enter any station. All 24 stations are walkable 3D scenes (WASD and E), each with a cinematic entrance and its own game-like activity. A guide narrates every station in **English or Arabic**, and every story carries its **sources, graded for authenticity**.

Open `index.html` in a modern browser (double-clicking it works), choose **Makkah** or **Madinah**, and use headphones.

## The two worlds

On the start screen, choose a city. Each opens a 3D relief model of the city with its stations pinned where they happened: drag to turn it, scroll or pinch to zoom, right-drag to pan, and use the arrow keys or the station list to move between pins. Select a pin to see its date, its sources, and **Enter the station**. The **Map** button returns to the map from any station. Visited stations are marked on the map and remembered on the device.

### Makkah al-Mukarramah · c. 605 – 632 CE

| # | Station | You… | Entrance |
|---|---------|------|----------|
| I | **The Ka‘bah Rebuilt** · c. 605 | carry stones for the rising walls, then lift the Black Stone on a cloak with every clan | crane down over the valley |
| II | **The Cave of Hira** · 610 | climb Jabal an-Nur with provisions; the first verses of Surat al-‘Alaq are written in light | rising up the night mountain face |
| III | **The Call from as-Safa** · c. 613 | raise the morning call and watch the lights of Quraysh gather | dawn glide across the roofs |
| IV | **The Boycott in the Ravine** · c. 616–619 | stealth: carry food by night past sweeping torchlight | down from the rim into the ravine |
| V | **The Night Journey** · c. 620 | fly through seven turning rings of light (an abstract meditation) | from the turning stars down to the courtyard |
| VI | **The Pledges of al-‘Aqabah** · 621–622 | escort a line of lanterns through shadow to the meeting place | over the sleeping camps of Mina |
| VII | **The Cave of Thawr** · 622 | find the cave, then keep perfectly still while the search passes | pushing in through the cave mouth |
| VIII | **The Night Road** · 622 | navigate north by the stars from cairn to cairn | from the Milky Way to the guide's footprints |
| IX | **The Return to Makkah** · 630 | go round the Ka‘bah and topple the 36 stelae of the idols | from the northern heights, circling the House |
| X | **The Farewell Sermon** · 632 | courier: carry each line of the sermon to those absent | across the golden plain of Arafat |

### al-Madinah al-Munawwarah · 622 CE – today

| # | Station | You… | Entrance |
|---|---------|------|----------|
| I | **Quba, the First Stones** | shape-matching: fit stones into the foundation | down through the palm crowns |
| II | **The Full Moon Rises** | rhythm (2D overlay): the welcome, line by line | from the rising moon over the roofs |
| III | **The Mosque of Palm Trunks** | explore the first mosque and find four places | down through the frond roof |
| IV | **The Two Qiblas** | tune a dial by ear until two voices become one | top-down above the rows, then into the hall |
| V | **The Mountain That Loves Us** | restraint: hold the archers' hill, then call to the mountain | along the red ridges of Uhud |
| VI | **The Trench** | hold to dig, then strike the great rock | along the trench line at dusk |
| VII | **The Well of Rumah** | haul the bucket hand over hand, then give water | up out of the well shaft |
| VIII | **The Palm Groves** | shake laden palms and catch seven Ajwa dates | down through backlit fronds |
| IX | **The Blessed Valley** | skip stones on Wadi al-‘Aqiq, then follow it to the lights | low over the moonlit water |
| X | **The Lanes of Old Madinah** | light the lanterns of the lane | backward down the lane from the Green Dome |
| XI | **The Hejaz Railway** · 1908 | ring the bell and meet the train from Damascus | along the rails |
| XII | **The Sky Beneath the Domes** | light puzzle: roll the domes open to complete a golden star | from the roof through an opening dome |
| XIII | **A Garden of Paradise** | trace the arabesque (2D drawing) at six named columns | down a gilded column to the green carpet |
| XIV | **The City of Light** | open the umbrellas and live through a day in the courtyard | from above the minarets |

Every station opens with its own cinematic shot (press any key or tap to skip) and has one activity: no score, no failure, and a quiet moment when it is complete. The art direction behind them is written up in [`docs/DESIGN.md`](docs/DESIGN.md).

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
