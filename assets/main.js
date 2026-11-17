(function(){
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* preloader: once per session */
  var pre = document.querySelector('.preloader');
  if (pre){
    var seen = false; try { seen = sessionStorage.getItem('th-pre') === '1'; sessionStorage.setItem('th-pre','1'); } catch(e){}
    if (seen || reduce){ pre.remove(); }
    else {
      setTimeout(function(){ pre.querySelector('.mark').classList.add('filled'); }, 1150);
      setTimeout(function(){ pre.classList.add('done'); }, 1500);
      setTimeout(function(){ pre.remove(); }, 2700);
    }
  }

  /* scroll progress bar + ring button */
  var bar = document.querySelector('.scroll-prog i');
  var ptop = document.querySelector('.prog-top');
  var ring = ptop && ptop.querySelector('.fg');
  function prog(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    if (ring) ring.style.strokeDashoffset = (163.4 * (1 - p)).toFixed(1);
    if (ptop) ptop.classList.toggle('show', window.scrollY > 600);
  }
  /* safety net: anything animated in that is on screen gets shown, even if an observer misses it */
  function revealCheck(){
    var vh = window.innerHeight;
    document.querySelectorAll('[data-curtain]:not(.is-in), [data-reveal]:not(.is-in), [data-split]:not(.is-in), .collage:not(.is-in), .map:not(.is-in)').forEach(function(el){
      if (!el.offsetParent && el.getClientRects().length === 0) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) el.classList.add('is-in');
    });
  }
  window.THX_reveal = revealCheck;
  window.addEventListener('scroll', function(){ requestAnimationFrame(revealCheck); }, { passive:true });
  window.addEventListener('resize', revealCheck);
  window.addEventListener('load', revealCheck);
  window.addEventListener('scroll', prog, { passive:true });
  if (ptop) ptop.addEventListener('click', function(){ window.scrollTo({ top:0, behavior: reduce ? 'auto' : 'smooth' }); });

  var heroTimer = null;
  window.THX = function(root){
    prog();

    /* hero slideshow */
    clearInterval(heroTimer);
    var hx = root.querySelector('.hx');
    if (hx){
      var slides = hx.querySelectorAll('.slide'), dots = hx.querySelectorAll('.hx-dots button'), cur = 0;
      function show(i){
        cur = (i + slides.length) % slides.length;
        slides.forEach(function(s, k){ s.classList.toggle('on', k === cur); });
        dots.forEach(function(d, k){ d.classList.remove('on'); void d.offsetWidth; if (k === cur) d.classList.add('on'); });
      }
      dots.forEach(function(d, k){ d.onclick = function(){ show(k); restart(); }; });
      function restart(){ clearInterval(heroTimer); if (!reduce) heroTimer = setInterval(function(){ show(cur + 1); }, 7000); }
      show(0); restart();
    }

    /* curtain reveals on feature images (scroll-position based, no observer) */
    root.querySelectorAll('.split-media:not([data-reveal]), .ss-duo figure, .tcard .pic, .lead-img, .bab-big').forEach(function(el){
      if (el.hasAttribute('data-curtain')) return;
      el.setAttribute('data-curtain', '');
      if (el.getAttribute('data-reveal')) el.removeAttribute('data-reveal');
      if (reduce) el.classList.add('is-in');
    });
    revealCheck();
    setTimeout(revealCheck, 400);

    /* tilt + glare on cards */
    if (fine && !reduce){
      root.querySelectorAll('.pcard, .svc-card, .post-card, .bab-card, .cbox').forEach(function(c){
        if (c.dataset.tilt) return; c.dataset.tilt = 1; c.classList.add('tilt');
        var g = document.createElement('span'); g.className = 'glare'; c.appendChild(g);
        c.addEventListener('mousemove', function(e){
          var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          c.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
          c.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
          c.style.setProperty('--gx', (x * 100) + '%'); c.style.setProperty('--gy', (y * 100) + '%');
        });
        c.addEventListener('mouseleave', function(){ c.style.setProperty('--rx','0deg'); c.style.setProperty('--ry','0deg'); });
      });
      /* magnetic buttons */
      root.querySelectorAll('.hx .btn, .cta-band .btn, .nav-cta .btn, .bab-stat .btn').forEach(function(b){
        if (b.dataset.mag) return; b.dataset.mag = 1;
        b.addEventListener('mousemove', function(e){ var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + 'px)'; });
        b.addEventListener('mouseleave', function(){ b.style.transform = ''; });
      });
    }

    /* remodel planner */
    root.querySelectorAll('.planner').forEach(function(pl){
      if (pl.dataset.bound) return; pl.dataset.bound = 1;
      var T = window.TH_PLAN;
      function val(n){ var c = pl.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : ''; }
      function upd(){
        var room = val('pl-room'), size = val('pl-size'), scope = val('pl-scope');
        pl.querySelector('.pl-size').hidden = room === 'kitchen';
        pl.querySelectorAll('.pl-scope label').forEach(function(l){ l.hidden = (room === 'kitchen' && l.dataset.bath === '1'); });
        if (room === 'kitchen' && scope === 'convert'){ pl.querySelector('input[name="pl-scope"][value="full"]').checked = true; scope = 'full'; }
        var key = room === 'kitchen' ? 'kitchen-' + scope : 'bath-' + scope + '-' + size;
        var d = T[key];
        var out = pl.querySelector('.pl-out .in');
        out.classList.remove('flip'); void out.offsetWidth; out.classList.add('flip');
        out.querySelector('.days').innerHTML = d.days + '<small>' + d.unit + '</small>';
        out.querySelector('.what').textContent = d.what;
        out.querySelector('ul').innerHTML = d.list.map(function(x){ return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.3l3 3 6-6.3"/></svg>' + x + '</li>'; }).join('');
        var im = pl.querySelector('.pl-out .bgimg img'), want = TH_IMG_FOR(d.img);
        if (want && im.getAttribute('src') !== want){ im.style.opacity = 0; setTimeout(function(){ im.src = want; im.style.opacity = 1; }, 250); }
      }
      pl.addEventListener('change', upd); upd();
    });
  };
  window.TH_IMG_FOR = function(name){ return (window.TH_IMG && TH_IMG[name]) ? TH_IMG[name] : 'images/' + name + '.jpg'; };
})();

(function(){
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.burger');

  /* ---------- menu ---------- */
  function closeMenu(){ header.classList.remove('menu-open'); burger.setAttribute('aria-expanded','false'); burger.setAttribute('aria-label','Open menu'); }
  burger.addEventListener('click', function(){
    var open = header.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenu(); });
  document.querySelectorAll('.mobile-panel a').forEach(function(a){ a.addEventListener('click', closeMenu); });

  /* ---------- header: transparent over dark hero, solid after scroll ---------- */
  var current = document;
  function setSolid(){
    var dark = current.querySelector('.hx, .banner');
    doc.classList.toggle('hdr-solid', !dark || window.scrollY > 40);
  }
  window.addEventListener('scroll', setSolid, { passive:true });
  var toTop = document.querySelector('.to-top');
  if (toTop) toTop.addEventListener('click', function(){ window.scrollTo({ top:0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- reveal ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold:.12, rootMargin:'0px 0px -6% 0px' }) : null;

  function splitWords(el){
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map(function(w, i){
      return '<span class="w" aria-hidden="true" style="transition-delay:' + (0.08 + i * 0.045).toFixed(3) + 's">' + w + '</span>';
    }).join(' ');
  }

  /* ---------- counters ---------- */
  function counter(el){
    var end = parseFloat(el.dataset.count), t0 = null;
    if (reduce){ el.textContent = end; return; }
    el.textContent = '0';
    function step(ts){ if (!t0) t0 = ts; var p = Math.min((ts - t0) / 1600, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var cio = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ counter(e.target); cio.unobserve(e.target); } });
  }, { threshold:.6 }) : null;

  /* ---------- statement highlight (words light up on scroll) ---------- */
  var statements = [];
  function prepStatement(el){
    if (el.dataset.done) return; el.dataset.done = '1';
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function(w){ return '<span class="dim">' + w + '</span>'; }).join(' ');
    statements.push(el);
  }
  function updateStatements(){
    statements.forEach(function(el){
      if (!el.offsetParent) return;
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(Math.max((vh * .85 - r.top) / (r.height + vh * .35), 0), 1);
      var words = el.children, lit = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].style.color = i < lit ? 'var(--text)' : '';
    });
  }

  /* ---------- parallax ---------- */
  var para = [];
  function updatePara(){
    if (reduce) return;
    para.forEach(function(el){
      if (!el.offsetParent) return;
      var r = el.getBoundingClientRect();
      var c = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.translate = '0 ' + (c * parseFloat(el.dataset.speed)).toFixed(1) + 'px';
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(function(){ updatePara(); updateStatements(); ticking = false; }); } }, { passive:true });

  /* ---------- lightbox ---------- */
  var lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label','Photo viewer');
  lb.innerHTML = '<button class="x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><button class="pv" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><img alt=""><button class="nx" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button><p class="cap"></p>';
  document.body.appendChild(lb);
  var lbList = [], lbIdx = 0, lbLast = null;
  function lbShow(i){ lbIdx = (i + lbList.length) % lbList.length; var f = lbList[lbIdx], im = f.querySelector('img'); lb.querySelector('img').src = im.currentSrc || im.src; lb.querySelector('img').alt = im.alt; lb.querySelector('.cap').textContent = im.alt; }
  function lbOpen(list, i){ lbList = list; lbLast = document.activeElement; lb.classList.add('is-open'); lbShow(i); lb.querySelector('.x').focus(); }
  function lbClose(){ lb.classList.remove('is-open'); if (lbLast) lbLast.focus(); }
  lb.querySelector('.x').onclick = lbClose;
  lb.querySelector('.pv').onclick = function(){ lbShow(lbIdx - 1); };
  lb.querySelector('.nx').onclick = function(){ lbShow(lbIdx + 1); };
  lb.addEventListener('click', function(e){ if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', function(e){
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowLeft') lbShow(lbIdx - 1); if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
  });

  /* ---------- per-page init ---------- */
  function init(root){
    root.querySelectorAll('[data-split]').forEach(function(el){ splitWords(el); });
    root.querySelectorAll('[data-statement]').forEach(prepStatement);
    root.querySelectorAll('[data-reveal],[data-split],.collage,.map').forEach(function(el){
      if (io && !reduce) io.observe(el); else el.classList.add('is-in');
    });
    root.querySelectorAll('[data-count]').forEach(function(el){ if (cio) cio.observe(el); });
    root.querySelectorAll('[data-speed]').forEach(function(el){ if (para.indexOf(el) < 0) para.push(el); });

    root.querySelectorAll('.ba').forEach(function(ba){
      var r = ba.querySelector('input');
      if (r.dataset.bound) return; r.dataset.bound = 1;
      r.addEventListener('input', function(){ ba.style.setProperty('--pos', r.value + '%'); });
    });

    root.querySelectorAll('.tl-wrap').forEach(function(w){
      var tl = w.querySelector('.tl'); if (tl.dataset.bound) return; tl.dataset.bound = 1;
      var bar = w.querySelector('.tl-progress i');
      function upd(){ var m = tl.scrollWidth - tl.clientWidth; bar.style.width = (m ? tl.scrollLeft / m * 100 : 0) + '%'; }
      tl.addEventListener('scroll', upd, { passive:true }); upd();
      var step = function(){ var c = tl.querySelector('.tl-card'); return c ? c.offsetWidth + 20 : 300; };
      w.querySelector('.tl-prev').onclick = function(){ tl.scrollBy({ left:-step() }); };
      w.querySelector('.tl-next').onclick = function(){ tl.scrollBy({ left:step() }); };
      var down = false, sx = 0, sl = 0, moved = false;
      tl.addEventListener('pointerdown', function(e){ if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = tl.scrollLeft; tl.classList.add('dragging'); });
      window.addEventListener('pointermove', function(e){ if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; tl.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', function(){ if (!down) return; down = false; tl.classList.remove('dragging'); });
      tl.addEventListener('click', function(e){ if (moved){ e.preventDefault(); e.stopPropagation(); } }, true);
    });

    // service-area map: size each label card to fit its text (re-run when fonts load or the layout changes)
    root.querySelectorAll('.map').forEach(function(map){
      if (map.dataset.chips) return; map.dataset.chips = 1;
      function size(){
        map.querySelectorAll('.chip').forEach(function(c){
          var r = c.querySelector('rect'), x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
          c.querySelectorAll('text').forEach(function(t){
            var b = t.getBBox(); x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height);
          });
          if (!r || !isFinite(x1)) return;
          r.setAttribute('x', x1 - 10); r.setAttribute('y', y1 - 6); r.setAttribute('width', x2 - x1 + 20); r.setAttribute('height', y2 - y1 + 12); r.setAttribute('rx', 10);
        });
        map.classList.add('chips-ready');
      }
      size();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
      var t; window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(size, 150); });
    });

    // service-area explorer: pick a city (dropdown or pin) to zoom the map and update the info card
    root.querySelectorAll('.explorer').forEach(function(ex){
      if (ex.dataset.bound) return; ex.dataset.bound = 1;
      var map = ex.querySelector('.map'), svg = map.querySelector('svg'), sel = ex.querySelector('#ex-city');
      var reset = ex.querySelector('.ex-reset'), field = function(k){ return ex.querySelector('[data-ex="' + k + '"]'); };
      var HOME = [0, -110, 560, 820], ZOOM = 2.1, cur = HOME.slice(), anim;
      // labels, pins and shields keep their on-screen size while the map zooms
      var keep = [];
      map.querySelectorAll('.pz').forEach(function(g){ keep.push([g, +g.dataset.x, +g.dataset.y]); });
      map.querySelectorAll('.shield').forEach(function(g){ var r = g.querySelector('rect'); keep.push([g, +r.getAttribute('x') + r.getAttribute('width') / 2, +r.getAttribute('y') + 9]); });
      map.querySelectorAll('.clbl').forEach(function(t){ keep.push([t, +t.getAttribute('x'), +t.getAttribute('y')]); });
      function draw(vb){
        cur = vb; svg.setAttribute('viewBox', vb.join(' '));
        var k = vb[2] / HOME[2];
        keep.forEach(function(e){ e[0].setAttribute('transform', k === 1 ? '' : 'translate(' + e[1] + ' ' + e[2] + ') scale(' + k + ') translate(' + (-e[1]) + ' ' + (-e[2]) + ')'); });
      }
      function fly(to){
        cancelAnimationFrame(anim);
        if (reduce){ draw(to); return; }
        var from = cur.slice(), t0 = performance.now(), dur = 900;
        (function step(now){
          var p = Math.min(1, (now - t0) / dur), e = p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
          draw(from.map(function(v, i){ return v + (to[i] - v) * e; }));
          if (p < 1) anim = requestAnimationFrame(step);
        })(t0);
      }
      function pick(href){
        var opt = sel.querySelector('option[value="' + href + '"]') || sel.options[0];
        sel.value = opt.value;
        ['kicker','name','meta','text'].forEach(function(k){ field(k).textContent = opt.dataset[k]; });
        field('cta').href = opt.dataset.href; field('ctatext').textContent = opt.dataset.cta;
        field('view').textContent = opt.value === 'all' ? 'Full service area' : opt.dataset.name;
        map.querySelectorAll('.pin').forEach(function(p){ p.classList.toggle('sel', p.dataset.href === opt.value); });
        map.classList.toggle('has-sel', opt.value !== 'all'); reset.hidden = opt.value === 'all';
        var pz = map.querySelector('.pin[data-href="' + opt.value + '"] .pz');
        if (!pz) { fly(HOME); return; }
        var w = HOME[2] / ZOOM, h = HOME[3] / ZOOM;
        fly([+pz.dataset.x - w / 2, +pz.dataset.y - h / 2, w, h]);
      }
      sel.addEventListener('change', function(){ pick(sel.value); });
      reset.addEventListener('click', function(){ pick('all'); sel.focus(); });
      map.querySelectorAll('a.pin').forEach(function(p){
        p.addEventListener('click', function(e){ if (!p.dataset.href) return; e.preventDefault(); pick(p.dataset.href); });
      });
      // hovering a city chip lights up its pin
      ex.parentNode.querySelectorAll('.ex-chips a').forEach(function(a){
        var pin = map.querySelector('.pin[data-href="' + a.getAttribute('href') + '"]'); if (!pin) return;
        a.addEventListener('mouseenter', function(){ pin.classList.add('on'); }); a.addEventListener('mouseleave', function(){ pin.classList.remove('on'); });
        a.addEventListener('focus', function(){ pin.classList.add('on'); }); a.addEventListener('blur', function(){ pin.classList.remove('on'); });
      });
    });

    // service-area map: hovering or focusing a city link highlights its pin
    root.querySelectorAll('.areas').forEach(function(a){
      var map = a.querySelector('.map'); if (!map || a.dataset.bound) return; a.dataset.bound = 1;
      a.querySelectorAll('.city-list a').forEach(function(link){
        var pin = map.querySelector('.pin[data-href="' + link.getAttribute('href') + '"]'); if (!pin) return;
        var on = function(){ pin.classList.add('on'); }, off = function(){ pin.classList.remove('on'); };
        link.addEventListener('mouseenter', on); link.addEventListener('mouseleave', off);
        link.addEventListener('focus', on); link.addEventListener('blur', off);
      });
    });

    root.querySelectorAll('.gallery').forEach(function(g){
      if (g.dataset.bound) return; g.dataset.bound = 1;
      var figs = Array.prototype.slice.call(g.querySelectorAll('figure'));
      figs.forEach(function(f, i){
        f.tabIndex = 0; f.setAttribute('role','button'); f.setAttribute('aria-label','Open photo: ' + (f.querySelector('img').alt || ''));
        f.addEventListener('click', function(){ lbOpen(figs, i); });
        f.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); lbOpen(figs, i); } });
      });
    });

    root.querySelectorAll('.filters').forEach(function(f){
      if (f.dataset.bound) return; f.dataset.bound = 1;
      var cards = root.querySelectorAll('.post-card[data-cat], .pcard[data-cat]');
      var empty = root.querySelector('.filter-empty');
      f.querySelectorAll('button').forEach(function(b){
        b.addEventListener('click', function(){
          f.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
          var shown = 0;
          cards.forEach(function(c){ var hide = b.dataset.cat !== 'all' && c.dataset.cat !== b.dataset.cat; c.classList.toggle('is-hidden', hide); if (!hide){ shown++; c.classList.add('is-in'); } });
          if (empty) empty.hidden = shown > 0;
        });
      });
    });

    var hx = root.querySelector('.hx, .banner');
    if (hx) requestAnimationFrame(function(){ requestAnimationFrame(function(){ hx.classList.add('is-ready'); hx.classList.add('is-in'); }); });

    root.querySelectorAll('.play').forEach(function(p){
      if (p.dataset.bound) return; p.dataset.bound = 1;
      p.addEventListener('click', function(){ p.lastChild.textContent = 'Owner video coming soon'; });
    });

    root.querySelectorAll('form.lead').forEach(function(form){
      if (form.dataset.bound) return; form.dataset.bound = 1;
      var msg = form.querySelector('.form-msg');
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var req = form.querySelectorAll('[required]'), missing = [];
        req.forEach(function(f){ var bad = !f.value.trim(); f.setAttribute('aria-invalid', bad); if (bad) missing.push(f); });
        if (missing.length){ msg.textContent = 'Add your name, phone, city, and project so we can reach you.'; missing[0].focus(); return; }
        msg.textContent = 'Thanks, ' + form.querySelector('[name=first_name]').value.trim() + '. Your request is in, and we’ll reach out within one business day.';
        form.reset();
      });
    });

    current = root === document ? document : root;
    setSolid();
    if (window.THX) window.THX(root);
    updatePara(); updateStatements();
  }

  /* ---------- preview router (single-file preview only) ---------- */
  var pages = document.querySelectorAll('[data-page]');
  if (pages.length > 1){
    var titles = {};
    pages.forEach(function(p){ titles[p.dataset.page] = p.dataset.title; });
    function route(){
      var slug = (location.hash || '#home').slice(1);
      if (!titles[slug]) slug = 'home';
      pages.forEach(function(p){ var on = p.dataset.page === slug; p.hidden = !on; if (on){ p.classList.remove('page'); void p.offsetWidth; p.classList.add('page'); } });
      document.title = titles[slug];
      var grp = document.querySelector('[data-page="' + slug + '"]').dataset.group;
      document.querySelectorAll('.menu > li').forEach(function(li){ li.classList.toggle('is-active', li.dataset.group === grp); });
      window.scrollTo(0, 0);
      closeMenu();
      init(document.querySelector('[data-page="' + slug + '"]'));
    }
    window.addEventListener('hashchange', route);
    route();
  } else {
    init(document);
  }
})();
