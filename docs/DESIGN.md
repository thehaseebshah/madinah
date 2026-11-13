# Design guide: every station a piece of art

This guide distils what the most admired art games do, and turns it into rules for the stations of *Sirah in Light and Sound*. It is written for anyone building or polishing a station.

## What the best art games teach

- **One emotional arc, told without words.** Journey was built as a wordless story told through play, visual composition and a single musical theme that responds to the player and carries the arc. Its designers chose experiences "neither about achievements nor empowerment", and tied the emotional peak to a shared moment. ([Game Developer](https://gamedeveloper.com/audio/video-designing-a-new-emotional-experience-in-i-journey-i-), [Wikipedia](https://en.wikipedia.org/wiki/Journey_(2012_video_game)), [GDC Vault](https://gdcvault.com/play/1017700/Designing))
- **Feel comes from feedback, not from rules.** "Juice" is the non-functional aesthetic that changes the experience without changing the rules. Classic animation principles carry it: squash and stretch for weight, anticipation for readability, and follow-through so motion settles instead of stopping dead. The player's own input must answer instantly; anticipation belongs to the world, not to the player's action. ([Hackread](https://hackread.com/the-juice-factor-designing-game-feel/), [Rutgers lecture after Swink](https://sakai.rutgers.edu/access/content/group/0a4e9ee5-ee55-4b15-b778-52a05786e504/lectures/04_gamefeel.pdf), [Bugnet](https://bugnet.io/blog/animation-principles-every-game-developer-should-know))
- **Guide the eye, not the hand.** Level designers lead players with landmarks, openings, leading lines, pinch points, framing, breadcrumbs, and light and god rays. They light the critical path separately from the general scene, and they let the environment imply what happened here. ([Invisible Intuition deck](https://www.slideshare.net/slideshow/dshaverinvisibleintuitiondirectorscutpptx/258716962), [Game Developer: leading lines](https://gamedeveloper.com/design/guiding-the-player-leading-lines-in-quot-the-vanishing-of-ethan-carter-quot-), [Level Design Book: lighting](https://https-book_leveldesignbook_com.proxy.bugsmash.io/process/lighting), [Unity: level design basics](https://unity.com/blog/level-design-basics))
- **A world that listens.** Inside's audio is built on feedback loops between game and sound: sound that responds to and even conducts the player's actions, with a unique mix for each situation. Abzû's largest scene ran on only four sound effects driven by a couple of parameters. Knowing when to use silence is part of the craft. ([GDC Vault: A Game That Listens](https://gdcvault.com/play/1023731/A-Game-That-Listens-The), [Game Developer](https://gamedeveloper.com/audio/video-designing-the-audio-for-i-inside-i-a-game-that-listens), [Audiokinetic: Abzû](https://www.audiokinetic.com/fr/blog/abzu_game_audio), [PC Gamer](https://www.pcgamer.com/the-sound-of-silence/))
- **Emotion through environment.** Sky's team designs spaces for an intended feeling first, then shapes light, scale and colour to produce it. ([80.lv](https://80.lv/articles/how-to-design-emotional-game-environments-for-sky-children-of-the-light))

## Rules for every station

1. **Write the feeling first.** Before building, name the one feeling the station should leave behind, such as *trust*, *awe*, *fear turned to calm*, *gratitude* or *restraint*. Every choice of colour, sound and mechanic serves it.
2. **Four beats: arrival, engagement, revelation, stillness.**
   - **Arrival:** the cinematic entrance, an establishing shot that shows the whole place and the goal before handing over control.
   - **Engagement:** the activity.
   - **Revelation:** the turn of the story, carried by light, a quotation and a rising choir.
   - **Stillness:** let it land for a few seconds before "Continue". The quietest moment comes just before the revelation.
3. **One colour script per station.** Choose a dominant hue and one accent, and keep them throughout: night blue with ember gold, dawn rose with sand, noon white with dome green. Use the accent only for what matters: the goal, the interactive object, the moment of revelation.
4. **The mechanic is the meaning.** The verb the player performs embodies the story: *carrying* stones for a shared house, *keeping still* in the cave, *restraint* on the archers' hill, *giving* water. No two stations share a primary mechanic.
5. **Guide with light and landmarks.** The next goal is the brightest or warmest thing in view, or sits at the end of a leading line (a path, a wall, a row of lamps). Pinch and frame toward it. Use text hints as a fallback, not as the method.
6. **Every action answers three ways.** Something visible (motion with follow-through, a glow, particles), something audible (a knock, a breath, a sung note), and a change in the world that stays. Answer the player's input on the same frame; save anticipation for the world's responses.
7. **Sound that listens.** Make each station's soundscape a few layers, each driven by one parameter: proximity, progress or stillness. Let progress raise the harmony (more voices, a fuller chord). Keep silence, or near-silence, before the revelation. All melody is sung; nature does the rest.
8. **Restraint in the interface.** Keep one small activity tracker and one prompt. Cards hold the words. Nothing flashes, nothing scores, and there is no failure screen. Mistakes are answered by the world (a torch lingers, a bucket slips back), not by a red message.
9. **Scale and silhouette.** Every scene has one great shape that defines it, such as the Ka'bah, Uhud, the cleft of Hira, a moon or a dome, framed against the sky. Keep the foreground for texture, the middle ground for play and the background for awe.
10. **Respect.** No person is depicted. Presence is shown through light, sound, traces and words, and every quoted word names its source.

## Photoreal worlds

Every station is a photoreal place, not a diorama:

- **Photographed light.** Each outdoor scene is lit by a real HDRI sky from Poly Haven (dawn, morning, noon, late afternoon, sunset, dusk, moonrise, starry night). The sky is the background, it lights every surface through image-based lighting, and the sun or moon light is turned to where the photographed sun or moon actually is, so shadows agree with the sky (`PHOTO.sky`).
- **Scanned surfaces.** Ground, rock, mud plaster, mud brick, rubble stone, marble, palm bark and timber are photo-scanned PBR materials with colour, normal and roughness maps (`PHOTO.mat`, `SCAPE.terrain({ photo })`).
- **Scanned objects.** Boulders, rock sets, pebbles, shrubs, grass, dry branches, fallen trunks, a fire pit, baskets, clay vases, jugs, brass pots and lamps are scanned models, instanced by the hundred with light LODs (`SCAPE.scatter({ kind: 'model' })`, `PHOTO.place`).
- **Scale and density.** Terrain reaches the horizon; rings of far mountains in aerial perspective give distance; thousands of instances give texture underfoot; birds, smoke and drifting motes give life.
- **A camera's finish.** Bloom, sun and moon rays, a colour grade per station, vignette and fine grain (`SCAPE.post`).
- **Graceful fallback.** Opened from disk, browsers forbid local images in WebGL, so the procedural materials remain and nothing breaks.

## Entrance films

Every station opens with a short cut-scene of four to eight shots, 30 to 50 seconds long, that passes through different parts of the world before it hands the camera to the player. Each film tells a story (setting, what is at stake, a turn, arrival). It has a title card in Arabic and English, sourced subtitles, dips to black or white between shots, lens changes, and events that happen on screen. It can be skipped, and narration starts when it ends (`w.film`).

## One genre per station

Every station is a different kind of game, borrowed from a well-known one, and the verb carries the meaning:

| Station | Genre (after) | The verb |
|---|---|---|
| The Ka‘bah Rebuilt | falling-block stacking (Tetris) and balance (Super Monkey Ball) | lay the courses; carry the Stone together |
| The Cave of Hira | first-person parkour (Mirror's Edge, Celeste) | climb |
| The Call from as-Safa | 2.5D side-scrolling platformer (Limbo, Inside, Journey) | run to the hill and call |
| The Boycott | stealth (Metal Gear Solid, Mark of the Ninja) | carry food unseen |
| The Night Journey | rail flyer (Star Fox, Rez, Sky) | rise through the heavens |
| The Pledges of al-‘Aqabah | follower commands (Pikmin, Lemmings) | lead and protect |
| The Cave of Thawr | hide and breathe (Alien: Isolation) | keep still |
| The Night Road | endless runner (Temple Run, Alto's Adventure) | ride on through the night |
| The Return to Makkah | first-person aiming (shooting gallery) | strike down the idols |
| The Farewell Sermon | call and response (Simon, Patapon) | pass the words on |
| Quba | push-block puzzles (Sokoban) | set the foundation |
| The Full Moon Rises | rhythm highway (Guitar Hero, Beat Saber) | welcome |
| The Mosque of Palm Trunks | construction (Townscaper, Minecraft) | build |
| The Two Qiblas | perspective rotation (Fez, Monument Valley) | turn |
| Uhud | viewpoint alignment (Viewfinder, Pokémon Snap) | look and remember |
| The Trench | maze tower defence (Kingdom Rush) | dig and hold |
| The Well of Rumah | flow puzzle (Pipe Mania) | give water |
| The Palm Groves | farming (Stardew Valley) | tend and harvest |
| The Blessed Valley | be the wind (Flower) | carry petals |
| The Lanes of Old Madinah | maze and lamp oil (Pac-Man) | light the lanes |
| The Hejaz Railway | train driving (Train Sim World) | drive the train home |
| The Sky Beneath the Domes | light and mirrors (The Witness, Portal) | guide the sunlight |
| A Garden of Paradise | celestial brush (Okami) | draw |
| The City of Light | time management (Overcooked, Diner Dash) | keep the courtyard |

Every game is 3 to 6 minutes long in escalating phases. Each one teaches by doing, never shows a fail screen, and works with touch as well as mouse and keyboard. Each world also hides five to eight discoveries: optional places with a short sourced fact that reward exploring.
