/* NARRATION — a spoken guide for every station, in English and Arabic.
   Order of preference for each line:
     1. a recorded file at audio/narration/<lang>/<key>.mp3 (made by
        tools/tts, with open-source voices or ElevenLabs), if one exists;
     2. otherwise the device's own speech voices (Web Speech API), sentence by sentence.
   Captions follow the voice either way. The ambience is lowered while the guide speaks. */
(function () {
  'use strict';

  // One entry per station, in journey order, keyed by station key.
  const SCRIPT = {
    kabah: {
      en: 'Makkah, around the year 605. A flood has damaged the Ka\u2019bah, and Quraysh are rebuilding it in courses of stone and timber. Among those carrying stones is Muhammad, about thirty-five years old, whom the people of Makkah call al-Amin, the trustworthy. When the walls reach the place of the Black Stone, the clans quarrel over who will set it, and agree that the next man through the gate will decide.',
      ar: 'مكة، نحو سنة ستمئة وخمس للميلاد. أصاب السيلُ الكعبة، فأخذت قريش تعيد بناءها مداميكَ من الحجر والخشب. وكان ممن ينقل الحجارة محمدٌ، في نحو الخامسة والثلاثين من عمره، وكان أهل مكة يسمّونه الأمين. فلما بلغ البنيان موضعَ الحجر الأسود اختلفت القبائل فيمن يضعه، ثم اتفقوا على أن يحكم بينهم أولُ داخلٍ من الباب.',
    },
    hira: {
      en: 'Some five years later, he would leave Makkah for nights at a time to worship alone in a small cave on a mountain north-east of the city. There, one night in Ramadan, when he was forty, the angel came to him and said: Read. Climb to the Cave of Hira.',
      ar: 'بعد نحو خمس سنين، كان يخرج من مكة الليالي ذواتِ العدد يتعبّد وحده في غارٍ صغير بجبلٍ شمالَ شرق مكة. وهناك، في ليلةٍ من رمضان، وهو ابن أربعين سنة، جاءه الملَك فقال: اقرأ. اصعد إلى غار حراء.',
    },
    safa: {
      en: 'For about three years the call was quiet. Then came the command: warn your nearest kin. He climbed the rock of as-Safa beside the Ka\u2019bah and raised the alarm used at dawn when raiders were seen, and the clans of Quraysh gathered below.',
      ar: 'ظلّت الدعوة نحو ثلاث سنين سرًّا. ثم نزل الأمر: وأنذر عشيرتك الأقربين. فصعد على الصفا بجوار الكعبة، ونادى بالنداء الذي يُطلق عند رؤية الغارة في الصباح، فاجتمعت بطون قريش تحته.',
    },
    thawr: {
      en: 'Makkah, the year 622. The Prophet, peace be upon him, and his companion Abu Bakr have left the city by night and climbed Mount Thawr to the south. For three nights they hide in this narrow cave while search parties comb the mountains. The Qur’an remembers the moment: the second of two, when they were in the cave, and he said to his companion, do not grieve, God is with us.',
      ar: 'مكة، سنة ستمئة واثنتين وعشرين للميلاد. خرج النبي صلى الله عليه وسلم وصاحبه أبو بكر من مكة ليلًا، وصعدا جبل ثور في جنوبها. ثلاث ليالٍ اختبآ في هذا الغار الضيق، والطلب يجوب الجبال بحثًا عنهما. ويذكر القرآن تلك اللحظة: ثاني اثنين إذ هما في الغار، إذ يقول لصاحبه: لا تحزن إن الله معنا.',
    },
    hijrah: {
      en: 'After three nights, the guide Abdullah ibn Urayqit brought the camels, and they set out by an unused road toward the sea, then north. It was a journey of some four hundred and fifty kilometres, travelled mostly by night. This migration, the Hijrah, became the first year of the Islamic calendar.',
      ar: 'بعد ثلاث ليالٍ جاء الدليل عبد الله بن أريقط بالرواحل، فسلكوا طريقًا غير مطروق نحو الساحل ثم شمالًا. رحلة تقارب أربعمئة وخمسين كيلومترًا، قطعوا أكثرها ليلًا. وصارت هذه الهجرة بداية التقويم الإسلامي.',
    },
    quba: {
      en: 'Before entering the city, the Prophet stayed at Quba, on the southern edge of the oasis, for some ten nights or more. There he and his companions founded the first mosque in Islam. Many scholars hold that it is the mosque the Qur\u2019an describes as founded on piety from the first day.',
      ar: 'قبل أن يدخل المدينة نزل النبي صلى الله عليه وسلم في قباء، على طرف الواحة الجنوبي، بضع عشرة ليلة. وهناك أسّس مع أصحابه أول مسجد في الإسلام. ويرى كثير من العلماء أنه المسجد الذي وصفه القرآن بأنه أُسِّس على التقوى من أول يوم.',
    },
    badr: {
      en: 'The people of Yathrib went out every morning to the lava fields to watch the southern road, until the midday heat drove them home. When he arrived at last, the whole city came out to meet him with joy. A song of welcome is still sung in memory of that day: the full moon has risen over us. It is loved, though its report is weak. The city came to be called al-Madinah, and he named it Taybah, the good.',
      ar: 'كان أهل يثرب يخرجون كل صباح إلى الحرّة يرقبون الطريق الجنوبي حتى يردّهم حرّ الظهيرة. فلما وصل أخيرًا خرجت المدينة كلها لاستقباله فرحين. ويُنشد في ذكرى ذلك اليوم نشيد: طلع البدر علينا، وهو محبوب وإن كان سنده ضعيفًا. وصارت تُعرف بالمدينة، وسمّاها النبي صلى الله عليه وسلم طابة.',
    },
    'palm-mosque': {
      en: 'Where his camel knelt, they built his mosque: walls of sun-dried brick, palm trunks for pillars, palm fronds for a roof. Walk through it. Listen for the old palm trunk he once leaned on, and find the minbar, the shade of the Suffah, and the roof of fronds.',
      ar: 'حيث بركت ناقته بُني مسجده: جدران من اللبن، وجذوع النخل أعمدة، وجريده سقف. تجوّل فيه، وأصغِ إلى الجذع القديم الذي كان يستند إليه، وابحث عن المنبر، وظلّ الصفّة، وسقف الجريد.',
    },
    qiblatayn: {
      en: 'For the first months in Madinah, the Muslims prayed toward Jerusalem. Then, during a prayer, the command came to turn toward the Ka’bah in Makkah, and the congregation turned where they stood. From Madinah the two directions are almost opposite. Turn the qibla, and listen to the voices fall into one.',
      ar: 'في الأشهر الأولى بالمدينة كان المسلمون يصلّون نحو بيت المقدس. ثم نزل الأمر أثناء الصلاة بالتوجه إلى الكعبة في مكة، فاستدار المصلّون في أماكنهم. والجهتان من المدينة متقابلتان تقريبًا. أدِر القبلة، واستمع إلى الأصوات وهي تلتقي في صوت واحد.',
    },
    uhud: {
      en: 'Uhud rises north of the city, a long ridge of red granite. In the year 625 a battle was fought at its foot, and seventy companions fell, among them Hamzah, the Prophet’s uncle. Yet he said of this mountain: Uhud is a mountain that loves us, and we love it.',
      ar: 'يقوم جبل أحد شمال المدينة، سلسلةً طويلة من الجرانيت الأحمر. وفي سنة ستمئة وخمس وعشرين للميلاد دارت عند سفحه معركة استُشهد فيها سبعون من الصحابة، منهم حمزة عمّ النبي. ومع ذلك قال عنه: أحدٌ جبلٌ يحبّنا ونحبّه.',
    },
    trench: {
      en: 'In the winter of 627, an alliance of some ten thousand marched on Madinah. On the advice of Salman al-Farisi, the community dug a trench across the open northern plain, the Prophet among them, carrying earth in the cold. Dig out the unfinished sections, then find the rock that no pick could break.',
      ar: 'في شتاء سنة ستمئة وسبع وعشرين زحف على المدينة تحالفٌ من نحو عشرة آلاف مقاتل. وبمشورة سلمان الفارسي حفر المسلمون خندقًا عبر السهل الشمالي المكشوف، والنبي بينهم ينقل التراب في البرد. احفر الأجزاء التي لم تكتمل، ثم ابحث عن الصخرة التي عجزت عنها المعاول.',
    },
    well: {
      en: 'Sweet water was scarce in early Madinah, and the best well, Rumah, belonged to a man who sold its water. The Prophet asked who would buy it and give it to all. Uthman ibn Affan bought it and made it an endowment, its water free for everyone. The well still stands in the north-west of the city.',
      ar: 'كان الماء العذب قليلًا في المدينة أول الأمر، وكانت أطيب الآبار، بئر رومة، لرجل يبيع ماءها. فسأل النبي صلى الله عليه وسلم: من يشتريها ويجعلها للمسلمين؟ فاشتراها عثمان بن عفان وجعلها وقفًا، ماؤها لكل الناس. وما زالت البئر قائمة في شمال غرب المدينة.',
    },
    palms: {
      en: 'Madinah was an oasis long before it was a city, a spread of palm gardens fed by wells. The groves of al-Aliyah, on the higher ground to the south, are still famous for Ajwa, a small, soft, nearly black date. Be the wind in the palms, and gather seven.',
      ar: 'كانت المدينة واحةً قبل أن تكون مدينة، بساتين نخيل تسقيها الآبار. وما زالت نخيل العالية، على المرتفعات الجنوبية، مشهورةً بالعجوة، تمرٍ صغير طريّ يكاد يكون أسود. كن أنت الريح بين النخيل، واجمع سبع تمرات.',
    },
    aqiq: {
      en: 'West of the city runs Wadi al-Aqiq, dry most of the year, flowing after heavy rain. The Prophet called it a blessed valley. Tonight the stream is running under the moon. Wade in it, skip a stone across it, and follow the water to where the lights of the city appear.',
      ar: 'يجري وادي العقيق غربَ المدينة، جافًّا أكثر العام، يسيل بعد الأمطار الغزيرة. وقد سمّاه النبي صلى الله عليه وسلم واديًا مباركًا. الليلةَ يجري الماء تحت القمر. خُض فيه، وارمِ حجرًا يقفز على سطحه، واتبع الماء حتى تلوح أنوار المدينة.',
    },
    lanes: {
      en: 'For centuries the Prophet’s Mosque stood at the heart of a dense old city: narrow lanes between tall houses of stone and white plaster, with wooden windows called roshan that let in the breeze. Most of these quarters were cleared in the twentieth century. Walk one as it was, by lamplight.',
      ar: 'ظلّ المسجد النبوي قرونًا في قلب مدينة قديمة متلاصقة: أزقّة ضيقة بين بيوت عالية من الحجر والجص الأبيض، ونوافذ خشبية تُسمّى الرواشين تُدخل النسيم. وقد أُزيلت معظم هذه الأحياء في القرن العشرين. تجوّل في واحد منها كما كان، على ضوء القناديل.',
    },
    railway: {
      en: 'In 1908 the Hejaz Railway reached Madinah, linking it to Damascus and Istanbul. A journey of more than a month by caravan became a few days by train. The line ran for only a decade before war destroyed it, but the station still stands. Ring the bell, and wait for the train.',
      ar: 'في سنة ألف وتسعمئة وثمانٍ وصل خط سكة حديد الحجاز إلى المدينة، فربطها بدمشق وإسطنبول. صارت رحلةٌ تستغرق أكثر من شهر بالقوافل أيامًا معدودة بالقطار. لم يعمل الخط إلا نحو عقد قبل أن تدمّره الحرب، لكن المحطة ما زالت قائمة. اقرع الجرس، وانتظر القطار.',
    },
    domes: {
      en: 'The mosque of mud and palm has been rebuilt and enlarged many times over fourteen centuries. Today its roof holds twenty-seven domes that roll aside on rails, opening the prayer hall to the sky. Move to reshape the stars of the ceiling, and open the domes.',
      ar: 'أُعيد بناء مسجد اللبن والجريد ووُسِّع مرات كثيرة على مدى أربعة عشر قرنًا. واليوم يحمل سقفه سبعًا وعشرين قبة تنزلق على قضبان، فتكشف المصلّى للسماء. حرّك يدك لتعيد تشكيل نجوم السقف، وافتح القباب.',
    },
    rawdah: {
      en: 'Between the place where his house stood and his pulpit lies a small area with its own green carpet: ar-Rawdah, the Garden. The Prophet said: between my house and my pulpit is a garden from the gardens of Paradise. Draw, and let a garden grow.',
      ar: 'بين موضع بيته ومنبره بقعة صغيرة لها بساطها الأخضر: الروضة الشريفة. قال النبي صلى الله عليه وسلم: ما بين بيتي ومنبري روضة من رياض الجنة. ارسم، ودع الحديقة تنمو.',
    },
    city: {
      en: 'Around the mosque today, two hundred and fifty giant umbrellas shade the marble courtyards through the heat of the day, and fold away at evening. Millions come each year. Walk the courtyard, open the umbrellas to the morning, and stay until the lamps are lit. Peace be upon you.',
      ar: 'حول المسجد اليوم مئتان وخمسون مظلة عملاقة تظلّل الساحات الرخامية في حرّ النهار وتنطوي عند المساء. ويأتيها الملايين كل عام. تجوّل في الساحة، وافتح المظلات للصباح، وابقَ حتى تُضاء القناديل. والسلام عليكم.',
    },
  };

  const LANGS = ['en', 'ar', 'off'];
  const N = { lang: 'en', script: SCRIPT, token: 0, audio: null, speaking: false, voices: [] };
  try { const saved = localStorage.getItem('madinah.narration'); if (LANGS.includes(saved)) N.lang = saved; } catch (e) {}

  const synth = window.speechSynthesis || null;
  function loadVoices() { if (synth) N.voices = synth.getVoices() || []; }
  if (synth) { loadVoices(); synth.addEventListener && synth.addEventListener('voiceschanged', loadVoices); }

  // Prefer natural, high-quality voices where the platform offers them.
  const PREF = {
    en: [/natural/i, /neural/i, /premium/i, /enhanced/i, /Google UK English Male/i, /Daniel/i, /Arthur/i, /Google US English/i, /Samantha/i, /Aria/i, /Guy/i],
    ar: [/natural/i, /neural/i, /premium/i, /enhanced/i, /Majed/i, /Maged/i, /Google.*(عربي|Arab)/i, /Hamed/i, /Naayf/i, /Zariyah/i, /Tarik/i],
  };
  function pickVoice(lang) {
    const list = N.voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(lang));
    if (!list.length) return null;
    for (const re of PREF[lang]) { const v = list.find(x => re.test(x.name)); if (v) return v; }
    return list.find(v => v.localService) || list[0];
  }

  function sentences(text) {
    return text.match(/[^.!?؟۔]+[.!?؟۔]*/g).map(s => s.trim()).filter(Boolean);
  }

  /* ---------- captions ---------- */
  let capEl = null;
  function caption(text, lang) {
    if (!capEl) capEl = document.getElementById('caption');
    if (!capEl) return;
    if (!text) { capEl.classList.remove('show'); return; }
    capEl.textContent = text;
    capEl.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    capEl.setAttribute('lang', lang);
    capEl.classList.toggle('ar', lang === 'ar');
    capEl.classList.add('show');
  }

  function duck(on) {
    N.speaking = on;
    if (!window.SND || !SND.ctx || !SND.master) return;
    if (SND.muted) return;
    SND.master.gain.setTargetAtTime(on ? 0.5 : 0.9, SND.now(), 0.6);
  }

  N.stop = function () {
    N.token++;
    if (synth) synth.cancel();
    if (N.audio) { N.audio.pause(); N.audio = null; }
    caption(null); duck(false);
  };

  /* Speak a station's script (by key). Recorded files are named audio/narration/<lang>/<key>.mp3. */
  N.play = function (key, num) {
    N.stop();
    if (N.lang === 'off' || (window.SND && SND.muted)) return;
    const entry = SCRIPT[key]; if (!entry) return;
    const lang = N.lang, text = entry[lang]; if (!text) return;
    const token = N.token;
    const parts = sentences(text);
    const file = `audio/narration/${lang}/${key}.mp3`;
    const a = new Audio();
    let fellBack = false;
    const fallback = () => { if (fellBack || token !== N.token) return; fellBack = true; N.audio = null; speakParts(parts, lang, token); };
    a.preload = 'auto';
    a.addEventListener('error', fallback);
    a.addEventListener('loadedmetadata', () => {
      if (token !== N.token) return;
      // spread the captions across the recording in proportion to sentence length
      const total = parts.reduce((s, p) => s + p.length, 0);
      let at = 0; const marks = parts.map(p => { const m = at; at += p.length / total; return m; });
      const tick = () => {
        if (token !== N.token || !N.audio) return;
        const k = a.currentTime / (a.duration || 1);
        let i = 0; while (i + 1 < marks.length && k >= marks[i + 1]) i++;
        caption(parts[i], lang);
        if (!a.ended) requestAnimationFrame(tick);
      };
      a.play().then(() => { duck(true); N.audio = a; tick(); }).catch(fallback);
    });
    a.addEventListener('ended', () => { if (token === N.token) { caption(null); duck(false); N.audio = null; } });
    a.src = file;
    setTimeout(() => { if (!N.audio && !fellBack && token === N.token && a.readyState < 1) fallback(); }, 1500);
  };

  function speakParts(parts, lang, token) {
    if (!synth) { showAll(parts, lang, token); return; }
    if (!N.voices.length) loadVoices();
    const voice = pickVoice(lang);
    if (!voice && lang === 'ar') { showAll(parts, lang, token); return; }
    let i = 0;
    const next = () => {
      if (token !== N.token) return;
      if (i >= parts.length) { caption(null); duck(false); return; }
      const u = new SpeechSynthesisUtterance(parts[i]);
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-GB';
      if (voice) u.voice = voice;
      u.rate = lang === 'ar' ? 0.9 : 0.93; u.pitch = 0.96; u.volume = 1;
      caption(parts[i], lang);
      u.onend = () => { i++; setTimeout(next, 260); };
      u.onerror = () => { i++; next(); };
      synth.speak(u);
    };
    duck(true); next();
  }
  // No voice for this language on the device: show the captions at a reading pace.
  function showAll(parts, lang, token) {
    let i = 0;
    const next = () => {
      if (token !== N.token) return;
      if (i >= parts.length) { caption(null); return; }
      caption(parts[i], lang);
      setTimeout(next, 900 + parts[i].length * 60); i++;
    };
    next();
  }

  N.cycle = function () {
    N.lang = LANGS[(LANGS.indexOf(N.lang) + 1) % LANGS.length];
    try { localStorage.setItem('madinah.narration', N.lang); } catch (e) {}
    return N.lang;
  };
  N.hasVoice = lang => !!pickVoice(lang);

  window.NARRATOR = N;
})();
