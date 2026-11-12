/* SOURCES — the evidence behind every station's story and narration.
   Each claim carries a grade so that the strength of a report is visible:
     quran    stated in the Qur'an
     sahih    an authentic hadith (al-Bukhari, Muslim, or graded sahih)
     hasan    a sound hadith, graded hasan by recognised scholars
     sirah    reported in the classical biographies without a strong hadith chain
     weak     a weak or disputed report, kept and labelled as tradition
     history  a modern historical record
   The data is filled from js/data/sources.verified.json (see tools/build-sources.js). */
(function () {
  'use strict';
  const S = { data: {} };
  const LABEL = { quran: 'Qur’an', sahih: 'Sahih', hasan: 'Hasan', sirah: 'Sirah report', weak: 'Weak / disputed', history: 'Historical record', wrong: 'Corrected' };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // A compact line of grade chips for the map card.
  S.summary = function (id) {
    const list = S.data[id]; if (!list || !list.length) return '';
    const counts = {};
    list.forEach(c => { counts[c.grade] = (counts[c.grade] || 0) + 1; });
    return Object.keys(LABEL).filter(g => counts[g]).map(g => `<span class="g g-${g}">${LABEL[g]}${counts[g] > 1 ? ' ×' + counts[g] : ''}</span>`).join('');
  };

  S.open = function (id, title) {
    const list = S.data[id] || [];
    document.getElementById('src-title').textContent = title || id;
    document.getElementById('src-list').innerHTML = list.length ? list.map(c => `
      <li class="src-item">
        <span class="g g-${esc(c.grade)}">${LABEL[c.grade] || esc(c.grade)}</span>
        <p class="src-claim">${esc(c.claim)}</p>
        <p class="src-ref">${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.ref)}</a>` : esc(c.ref)}</p>
        ${c.note ? `<p class="src-note">${esc(c.note)}</p>` : ''}
      </li>`).join('') : '<li class="src-item"><p class="src-claim">The sources for this station are being compiled.</p></li>';
    const d = document.getElementById('sources');
    d.hidden = false;
    document.getElementById('src-close').focus();
    S.isOpen = true;
  };
  S.close = function () { document.getElementById('sources').hidden = true; S.isOpen = false; };

  document.addEventListener('DOMContentLoaded', () => {
    const d = document.getElementById('sources'); if (!d) return;
    document.getElementById('src-close').addEventListener('click', S.close);
    d.addEventListener('click', e => { if (e.target === d) S.close(); });
    addEventListener('keydown', e => { if (S.isOpen && e.key === 'Escape') S.close(); });
  });

  window.SOURCES = S;
})();
