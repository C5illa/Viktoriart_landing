/* ViktóriArt Fotó – mintakép-mappa
   A belépő oldal adatai kétféleképpen érkezhetnek:
   1) a cím utáni paraméterekkel (Google Sheets / Apps Script link-generálás):
   index.html?nev=Minta%20Anna&intezmeny=Napsugár%20Óvoda&csoport=Katica&link=https://drive.google.com/...
      Rövid alias: n, i, cs, l. A paraméterek a belső linkeken is megmaradnak.
   2) a HTML-be behelyettesített {{GYEREK_NEV}}, {{INTEZMENY_NEV}}, {{CSOPORT_NEV}}, {{CEL_LINK}}
      helyőrzőkkel (a script a kiküldés előtt írja át a szöveget).
   Ha egyik sem érkezik meg, a helyőrzők helyén általános szöveg jelenik meg. */
(function () {
  'use strict';

  var KEYS = { nev: ['nev', 'n', 'name'], intezmeny: ['intezmeny', 'i'], csoport: ['csoport', 'cs', 'c'], link: ['link', 'l', 'url'] };
  var STORE = 'viktoriart.mappa';

  function query() {
    var raw = window.location.search || (window.location.hash.indexOf('?') > -1 ? window.location.hash.slice(window.location.hash.indexOf('?')) : '');
    return new URLSearchParams(raw);
  }

  function readData() {
    var p = query(), data = {}, found = false;
    Object.keys(KEYS).forEach(function (field) {
      for (var i = 0; i < KEYS[field].length; i++) {
        var v = p.get(KEYS[field][i]);
        if (v) { data[field] = v.trim(); found = true; break; }
      }
    });
    if (found) {
      try { sessionStorage.setItem(STORE, JSON.stringify({ data: data, search: p.toString() })); } catch (e) {}
      return { data: data, search: p.toString() };
    }
    try {
      var saved = JSON.parse(sessionStorage.getItem(STORE) || 'null');
      if (saved && saved.data) return saved;
    } catch (e) {}
    return { data: window.MAPPA_ADATOK || {}, search: '' };
  }

  var ctx = readData();

  /* a paraméterek ne veszítsenek el oldalváltáskor */
  if (ctx.search) {
    document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
      if (a.getAttribute('href').indexOf('?') === -1) a.setAttribute('href', a.getAttribute('href') + '?' + ctx.search);
    });
  }

  /* belépő oldal */
  var nameEl = document.getElementById('child-name');
  if (nameEl) {
    var d = ctx.data;
    var placeEl = document.getElementById('child-place');
    var btn = document.getElementById('folder-button');
    var token = function (el, attr) {
      var v = attr ? el.getAttribute(attr) : el.textContent;
      return (v || '').indexOf('{{') > -1 ? '' : (v || '').trim();
    };

    /* 1) URL-paraméter, 2) HTML-be behelyettesített helyőrző, 3) általános szöveg */
    nameEl.textContent = d.nev || token(nameEl) || 'a gyermek';
    var place = [d.intezmeny, d.csoport].filter(Boolean).join(' – ');
    if (placeEl) placeEl.textContent = place || token(placeEl) || 'intézmény – csoport';
    if (!d.link) d.link = token(btn, 'data-link');

    var box = document.getElementById('consent-checkbox');
    var modal = document.getElementById('consent-modal');
    var modalOk = document.getElementById('consent-modal-ok');
    var status = document.getElementById('status-message');

    function closeModal() { modal.hidden = true; }

    btn.addEventListener('click', function () {
      if (!box.checked) { modal.hidden = false; modalOk.focus(); return; }
      if (d.link) { window.location.href = d.link; return; }
      status.hidden = false;
      status.textContent = 'A mappa linkje nem érkezett meg. Kérjük, az e-mailben kapott címet nyissa meg újra.';
    });

    modalOk.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  }

  /* GYIK: egyszerre csak egy kérdés legyen nyitva */
  var items = document.querySelectorAll('details');
  if (items.length) {
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }
})();
