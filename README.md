# Madinah — Ten Stations

An immersive, interactive journey through **al-Madinah al-Munawwarah**, the Illuminated City, in ten stations. Each station has its own visual technique, its own way of being touched, and its own soundscape. All of it is generated live in the browser: there are no image, video or audio files.

Open `index.html` in a modern browser (double-clicking it works), press **Begin the journey**, and use headphones.

## The stations

| # | Station | You… | Made with |
|---|---------|------|-----------|
| I | **The Night Road** · the Hijrah, 622 CE | press and hold to walk 450 km from the Cave of Thawr to Yathrib while night turns to dawn; tap the sky for shooting stars | parallax dune fields, a procedural Milky Way, footprints, a route map with waypoints |
| II | **Quba, the First Stones** | tap or hold to lay basalt stones, course by course, until the palm-frond roof closes | falling-stone masonry on a chalk elevation; each course knocks a little higher in pitch |
| III | **The Full Moon Rises** · *Tala‘a al-Badru* | drag the moon up out of the hills; windows light, lanterns rise, and the song of welcome is written into the sky | layered rooftops of old Yathrib, a textured moon, Arabic verse revealed line by line |
| IV | **The Sky Beneath the Domes** · the Prophet’s Mosque | move to reshape the star-and-cross ceiling; tap any of the 27 domes to roll it open to the sky | a WebGL fragment shader: two interlaced squares per cell, a hand-held lamp, sliding domes |
| V | **The Two Qiblas** | drag the qibla from Jerusalem (332°) to Makkah (176°); the congregation’s rows swing after you, front first | two tones beat against each other until the direction is true, then settle into one |
| VI | **The Mountain That Loves Us** · Uhud | drag the sun across the sky; tap the mountain and a call echoes back from ridge to ridge | fractal granite ridges with sun-facing light, echoes that flare each ridge as they arrive |
| VII | **The Well of Rumah** · the endowment of ‘Uthman | touch and stir the water at the bottom of a basalt shaft | a real-time wave-equation simulation reflecting the evening sky; a resonant stone throat |
| VIII | **The Palm Groves** · Ajwa of al-‘Aliyah | sweep as the wind through backlit palms; tap laden palms and gather seven dates | articulated fronds on springs, falling dates, a rustle that follows the wind you make |
| IX | **A Garden of Paradise** · ar-Rawdah | draw inside a pointed arch and a gilded arabesque grows, curls, branches and blossoms | generative vine growth on the green of the Rawdah carpet; every blossom rings |
| X | **The City of Light** · Madinah today | sweep to open the courtyard’s giant umbrellas at dawn; watch them fold at sunset as the lamps come on; tap to raise the doves | a 3D-projected courtyard of folding canopies, the Green Dome, minarets, moving points of light |

## Sound

`js/core/audio.js` is a small synthesiser built on the Web Audio API. Wind is sculpted noise, birdsong is swept sine bursts, doves are breathy five-note coos, water drops are pitch chirps, stones are filtered impulses, and a generated convolution reverb gives each station its space. Each station plays through its own bus, which fades in and out with the transitions. The soundscape is ambient and natural: there is no music track.

## Controls

- Mouse, touch or pen everywhere.
- `←` / `→` move between stations; the dots at the top jump to any station.
- `M` mutes, `F` toggles fullscreen.
- Station shortcuts: `Space` walks on the night road, opens every dome, rings an echo at Uhud, and opens every umbrella.
- Link to a station directly with `#station-1` … `#station-10`.

## Project layout

```
index.html            page shell, HUD, intro and finale
css/style.css         type, layout and HUD styling
js/core/audio.js      Web Audio synthesiser
js/core/util.js       noise, easing and colour helpers
js/core/engine.js     stations, frame loop, input, transitions
js/stages/NN-*.js     one file per station
js/main.js            intro sky and start-up
tools/build-single.js bundles everything into one HTML file
```

No build step is needed. To produce a single shareable file:

```bash
node tools/build-single.js dist/madinah.html
```

## Sources and care

Narrative text follows the standard accounts of the Sirah. Quoted hadith are attributed to their collections (Sahih al-Bukhari, Sahih Muslim, Jami‘ at-Tirmidhi), and the Qur’anic verses to their surah and ayah. Bearings for the two qiblas are computed from Madinah’s coordinates. No people are depicted: the Prophet ﷺ and his companions are present only through places, light, sound and words.
