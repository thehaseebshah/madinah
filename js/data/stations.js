/* The atlas of the Sirah: which world each station belongs to, where it is on the ground
   (latitude, longitude), when it happened, and a one-line description for the map. */
(function () {
  'use strict';
  window.SIRAH = {
    worlds: {
      makkah: {
        name: 'Makkah al-Mukarramah', ar: 'مَكّة المُكَرَّمة',
        span: 'c. 605 – 622 CE', blurb: 'The valley of the Ka‘bah: the trustworthy young man, the first revelation, the first public call, and the night he left.',
        // map extent: [south, west, north, east]
        extent: [21.345, 39.735, 21.495, 39.995],
        landmarks: [
          ['Masjid al-Haram', 21.4225, 39.8262], ['Jabal Abu Qubays', 21.4215, 39.8305], ['Jabal an-Nur', 21.4576, 39.8617],
          ['Jabal Thawr', 21.3772, 39.8497], ['Mina', 21.4133, 39.8933], ['Muzdalifah', 21.3833, 39.9361], ['Arafat', 21.3549, 39.9841],
        ],
        routes: [{ label: 'The Hijrah: south to Thawr, then north-west toward Madinah', pts: [[21.4219, 39.8270], [21.400, 39.838], [21.3772, 39.8497], [21.392, 39.800], [21.430, 39.770], [21.480, 39.740]] }],
      },
      madinah: {
        name: 'al-Madinah al-Munawwarah', ar: 'المَدِينة المُنَوَّرة',
        span: '622 CE – today', blurb: 'The oasis between the lava fields: the first mosque, the turning of the qibla, Uhud and the Trench, and the Illuminated City.',
        extent: [24.405, 39.545, 24.535, 39.665],
        landmarks: [
          ['Masjid an-Nabawi', 24.4672, 39.6111], ['Masjid Quba', 24.4393, 39.6173], ['Jabal Uhud', 24.5150, 39.6100],
          ['Jabal Sal’', 24.4810, 39.5970], ['Wadi al-‘Aqiq', 24.4900, 39.5650], ['Harrat al-Wabrah', 24.4500, 39.5600], ['Harrat Waqim', 24.4600, 39.6500], ['Jabal ‘Ayr', 24.4120, 39.5900],
        ],
        routes: [{ label: 'The arrival: from Quba into the city', pts: [[24.4393, 39.6173], [24.452, 39.6140], [24.4672, 39.6111]] }],
      },
    },
    // in chronological order; ids match each station's id
    stations: [
      { id: 'kabah', world: 'makkah', geo: [21.4225, 39.8262], year: 'c. 605 CE', kind: '3D', blurb: 'The Ka‘bah is rebuilt and the clans quarrel over the Black Stone, until al-Amin settles it.' },
      { id: 'hira', world: 'makkah', geo: [21.4576, 39.8617], year: '610 CE', kind: '3D', blurb: 'A cave on Jabal an-Nur, and the first word of the Qur’an: Read.' },
      { id: 'safa', world: 'makkah', geo: [21.4222, 39.8274], year: 'c. 613 CE', kind: '3D', blurb: 'On the hill of as-Safa he calls the clans of Quraysh and speaks openly for the first time.' },
      { id: 'thawr', world: 'makkah', geo: [21.3772, 39.8497], year: '622 CE', kind: '3D', blurb: 'Three nights hidden in a cave on Mount Thawr: “God is with us.”' },
      { id: 'hijrah', world: 'makkah', geo: [21.430, 39.770], year: '622 CE', kind: '2D', blurb: 'The night road: some 450 km along the coast to Yathrib.' },
      { id: 'quba', world: 'madinah', geo: [24.4393, 39.6173], year: '1 AH · 622 CE', kind: '2D', blurb: 'The first mosque, laid stone by stone.' },
      { id: 'badr', world: 'madinah', geo: [24.4520, 39.6140], year: '1 AH · 622 CE', kind: '2D', blurb: 'The city comes out to meet him.' },
      { id: 'palm-mosque', world: 'madinah', geo: [24.4672, 39.6111], year: '1 AH · 622 CE', kind: '3D', blurb: 'His mosque of mud brick and palm: the weeping trunk, the minbar, the Suffah.' },
      { id: 'qiblatayn', world: 'madinah', geo: [24.4840, 39.5790], year: '2 AH · 624 CE', kind: '2D', blurb: 'The qibla turns from Jerusalem to the Ka‘bah.' },
      { id: 'uhud', world: 'madinah', geo: [24.5026, 39.6155], year: '3 AH · 625 CE', kind: '2D', blurb: 'The mountain that loves us, and the martyrs at its foot.' },
      { id: 'trench', world: 'madinah', geo: [24.4806, 39.5960], year: '5 AH · 627 CE', kind: '3D', blurb: 'The trench across the northern plain, and the rock that would not break.' },
      { id: 'well', world: 'madinah', geo: [24.5045, 39.5800], year: 'Early Madinah', kind: '2D', blurb: '‘Uthman buys the well of Rumah and gives its water to all.' },
      { id: 'palms', world: 'madinah', geo: [24.4330, 39.6330], year: 'The oasis', kind: '2D', blurb: 'The palm gardens of al-‘Aliyah and the Ajwa date.' },
      { id: 'aqiq', world: 'madinah', geo: [24.4720, 39.5680], year: 'The blessed valley', kind: '3D', blurb: 'Wadi al-‘Aqiq running under the moon.' },
      { id: 'lanes', world: 'madinah', geo: [24.4635, 39.6060], year: 'c. 1900', kind: '3D', blurb: 'The lanes of the old city by lamplight.' },
      { id: 'railway', world: 'madinah', geo: [24.4648, 39.6006], year: '1908', kind: '3D', blurb: 'The Hejaz Railway: the train from Damascus.' },
      { id: 'domes', world: 'madinah', geo: [24.4685, 39.6122], year: 'Today', kind: '2D', blurb: 'The 27 domes that open the mosque to the sky.' },
      { id: 'rawdah', world: 'madinah', geo: [24.4670, 39.6125], year: 'Today', kind: '2D', blurb: 'A garden from the gardens of Paradise.' },
      { id: 'city', world: 'madinah', geo: [24.4660, 39.6098], year: 'Today', kind: '3D', blurb: 'The umbrellas of the courtyard, from dawn to the lamps of night.' },
    ],
  };
})();
