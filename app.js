
(function () {
  'use strict';
 
  // ÍRD IDE a Deploy után kapott Web App URL-t (lásd a .gs fájl
  // 9. pontját az élesítés lépéseiről). Amíg ez helykitöltő marad,
  // a naplózás egyszerűen nem történik meg - a tovább­lépés attól
  // még zavartalanul működik.
  var LOG_ENDPOINT = 'IDE_ÍRD_A_WEB_APP_URL-T';
 
  var KEYS = {
    nev: ['nev', 'n', 'name'],
    link: ['link', 'l', 'url']
  };
 
  var STORE = 'viktoriart.mappa';
 
  function query() {
    var raw = window.location.search ||
      (window.location.hash.indexOf('?') > -1
        ? window.location.hash.slice(window.location.hash.indexOf('?'))
        : '');
 
    return new URLSearchParams(raw);
  }
 
  function readData() {
    var p = query();
    var data = {};
    var found = false;
 
    Object.keys(KEYS).forEach(function (field) {
      for (var i = 0; i < KEYS[field].length; i++) {
        var v = p.get(KEYS[field][i]);
 
        if (v) {
          data[field] = v.trim();
          found = true;
          break;
        }
      }
    });
 
    if (found) {
      try {
        sessionStorage.setItem(
          STORE,
          JSON.stringify({
            data: data,
            search: p.toString()
          })
        );
      } catch (e) {}
 
      return {
        data: data,
        search: p.toString()
      };
    }
 
    try {
      var saved = JSON.parse(
        sessionStorage.getItem(STORE) || 'null'
      );
 
      if (saved && saved.data) {
        return saved;
      }
    } catch (e) {}
 
    return {
      data: window.MAPPA_ADATOK || {},
      search: ''
    };
  }
 
  // Néma jelzés küldése a naplózó végpontnak. Kép-betöltéssel csináljuk,
  // nem fetch()-csel, mert ez CORS-korlátozás nélkül is működik minden
  // böngészőben - a szerver oldalon lefut a naplózás, a válasz tartalma
  // minket itt nem érdekel.
  function logOpen(link) {
    if (!LOG_ENDPOINT || LOG_ENDPOINT.indexOf('IDE_ÍRD') === 0 || !link) {
      return;
    }
 
    try {
      var img = new Image();
      img.src = LOG_ENDPOINT + '?link=' + encodeURIComponent(link) + '&t=' + Date.now();
    } catch (e) {
      // A naplózás sosem akadályozhatja a tovább­lépést - hiba esetén
      // egyszerűen nem történik semmi, a felhasználó ebből nem érzékel semmit.
    }
  }
 
  var ctx = readData();
 
  /* A paraméterek ne veszítsenek el oldalváltáskor */
  if (ctx.search) {
    document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
      if (a.getAttribute('href').indexOf('?') === -1) {
        a.setAttribute(
          'href',
          a.getAttribute('href') + '?' + ctx.search
        );
      }
    });
  }
 
  /* Belépő oldal */
  var nameEl = document.getElementById('child-name');
 
  if (nameEl) {
    var d = ctx.data;
    var btn = document.getElementById('folder-button');
 
    var token = function (el, attr) {
      var v = attr
        ? el.getAttribute(attr)
        : el.textContent;
 
      return (v || '').indexOf('{{') > -1
        ? ''
        : (v || '').trim();
    };
 
    /* 1) URL-paraméter
       2) HTML-be behelyettesített helyőrző
       3) általános szöveg */
 
    nameEl.textContent =
      d.nev ||
      token(nameEl) ||
      'a gyermek';
 
    if (!d.link) {
      d.link = token(btn, 'data-link');
    }
 
    var box = document.getElementById('consent-checkbox');
    var modal = document.getElementById('consent-modal');
    var modalOk = document.getElementById('consent-modal-ok');
    var status = document.getElementById('status-message');
 
    function closeModal() {
      modal.hidden = true;
    }
 
    btn.addEventListener('click', function () {
      if (!box.checked) {
        modal.hidden = false;
        modalOk.focus();
        return;
      }
 
      if (d.link) {
        logOpen(d.link);
        window.location.href = d.link;
        return;
      }
 
      status.hidden = false;
      status.textContent =
        'A mappa linkje nem érkezett meg. Kérjük, az e-mailben kapott címet nyissa meg újra.';
    });
 
    modalOk.addEventListener('click', closeModal);
 
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
 
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });
  }
 
  /* GYIK: egyszerre csak egy kérdés legyen nyitva */
  var items = document.querySelectorAll('details');
 
  if (items.length) {
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) {
          return;
        }
 
        items.forEach(function (other) {
          if (other !== item) {
            other.open = false;
          }
        });
      });
    });
  }
})();