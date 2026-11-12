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

## Cinematic entrances

Every station opens with its own shot, so arriving in each place is a small ceremony:

| Station | Entrance |
|---|---|
| The Ka‘bah Rebuilt | high crane over the valley, spiralling down to the scaffolding |
| The Cave of Hira | rising from the night valley up the mountain face to the cleft |
| The Call from as-Safa | low dawn glide from the Ka‘bah across the roofs to the hill |
| The Boycott | down from the rim into the dark ravine, past the patrol torches |
| The Night Journey | looking straight up at the turning stars, then down to the courtyard |
| The Pledges of al-‘Aqabah | over the sleeping camps of Mina toward the ravine |
| The Cave of Thawr | from the mountainside, pushing in through the mouth of the cave |
| The Night Road | from the Milky Way down to the guide's footprints |
| The Return to Makkah | from the northern heights with the banners, circling the Ka‘bah |
| The Farewell Sermon | across the whole plain of Arafat in golden haze to the Mount of Mercy |
| Quba | crane down through the palm crowns to the chalk foundation |
| The Full Moon Rises | from the rising moon back across the rooftops |
| The Mosque of Palm Trunks | down through the gaps in the frond roof |
| The Two Qiblas | straight down from above the rows (the original top-down view), then into the hall |
| Uhud | a lateral track along the red ridges to the archers' hill |
| The Trench | along the trench line at dusk |
| The Well of Rumah | up out of the well shaft into the garden |
| The Palm Groves | down through the backlit fronds |
| The Blessed Valley | low over the moonlit water, rising to the bank |
| The Lanes of Old Madinah | from the Green Dome, backward down the lane |
| The Hejaz Railway | along the rails from the train's approach |
| The Sky Beneath the Domes | from the roof, down through an opening dome |
| A Garden of Paradise | from a gilded capital down the column to the green carpet |
| The City of Light | from the sky above the minarets down between the furled umbrellas |

## Mechanics: one verb per station

| Station | Mechanic | Kind |
|---|---|---|
| The Ka‘bah Rebuilt | carry and place, then a shared lift | 3D |
| The Cave of Hira | climb and gather provisions | 3D |
| The Call from as-Safa | ascend and call, then watch the response | 3D |
| The Boycott | stealth: carry food unseen past sweeping torchlight | 3D |
| The Night Journey | flight through rotating openings | 3D |
| The Pledges of al-‘Aqabah | escort a trailing line of lights through shadow | 3D |
| The Cave of Thawr | discover, then keep perfectly still | 3D |
| The Night Road | navigate by the stars to cairns | 3D |
| The Return to Makkah | clear the idols around the House | 3D |
| The Farewell Sermon | courier: carry each line to those absent | 3D |
| Quba | shape-matching: fit stones to their places | 3D puzzle |
| The Full Moon Rises | rhythm: the welcome, line by line | 2D overlay |
| The Mosque of Palm Trunks | exploration: find four stories | 3D |
| The Two Qiblas | tune a dial by ear until two voices become one | audio puzzle |
| Uhud | restraint: hold the hill | 3D |
| The Trench | hold to dig, then strike | 3D |
| The Well of Rumah | haul hand over hand, then give water | 2D gauge + 3D |
| The Palm Groves | catch falling dates | 3D physics |
| The Blessed Valley | skip stones | 3D physics |
| The Lanes of Old Madinah | light the lamps of the lane | 3D |
| The Hejaz Railway | ring the bell, meet the train | 3D event |
| The Sky Beneath the Domes | light puzzle: open the domes that complete the star | 3D logic |
| A Garden of Paradise | trace the arabesque | 2D drawing |
| The City of Light | open the umbrellas, live through the day | 3D time-lapse |
