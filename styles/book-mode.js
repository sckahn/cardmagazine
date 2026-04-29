/* AI × Series · Book Mode (ebook style)
 *
 * 두 가지 모드를 자동 판별:
 *   - 시리즈 페이지 (mag-article 존재): 그 시리즈 1번~끝번을 한 권으로
 *   - 홈/그 외: series/_data.json을 읽어 1호 1번 ~ 마지막 호 끝번까지를 한 권으로
 *
 * 디자인 — 진짜 책처럼:
 *   - 어두운 책상 배경 + 가죽 표지(첫 펼침)
 *   - 종이 톤 페이지 + 책등 그림자 + 페이지 가장자리 stack
 *   - 페이지 넘김 fade
 *   - 키보드 ←/→/Space, 좌우 클릭, 점, ESC
 */
(function () {
  'use strict';

  /* ---------- styles ---------- */
  function injectStyles() {
    if (document.getElementById('book-mode-style')) return;
    var css = `
.book-toggle {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 18px;
  border: 1px solid var(--navy, #0f1e38);
  background: var(--navy, #0f1e38); color: #FFE4D0;
  font-family: var(--f-mono, JetBrains Mono, monospace);
  font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700;
  cursor: pointer; border-radius: 4px;
  transition: background 0.18s, color 0.18s, transform 0.12s;
  box-shadow: 0 8px 22px -10px rgba(15,30,56,0.5);
}
.book-toggle:hover { background: #FFE4D0; color: var(--navy, #0f1e38); transform: translateY(-1px); }
.book-toggle.compact {
  padding: 8px 12px; font-size: 11px; letter-spacing: 0.16em;
  background: transparent; color: var(--navy, #0f1e38);
  border-color: rgba(15,30,56,0.25);
  margin-top: 14px; box-shadow: none;
}
.book-toggle.compact:hover { background: var(--navy, #0f1e38); color: #fff; }

/* desk overlay */
.book-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background:
    radial-gradient(ellipse at 50% 30%, #2a1f15 0%, #18110a 70%, #0a0703 100%);
  display: none; flex-direction: column;
}
.book-overlay.open { display: flex; }
.book-overlay::before {
  /* desk wood grain noise */
  content: ''; position: absolute; inset: 0;
  background-image:
    repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 4px),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 6px);
  pointer-events: none;
}

/* top bar */
.book-overlay-top {
  position: relative; z-index: 2;
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 22px;
  color: rgba(255,228,208,0.78);
  font-family: var(--f-mono, monospace);
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  border-bottom: 1px solid rgba(255,228,208,0.08);
  backdrop-filter: blur(6px);
  background: linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.0));
}
.book-overlay-top .title b { color: #FFE4D0; font-weight: 800; letter-spacing: 0.08em; }
.book-overlay-top .progress { color: #FFE4D0; font-weight: 700; letter-spacing: 0.22em; }
.book-overlay-top button {
  background: transparent; border: 1px solid rgba(255,228,208,0.32);
  color: #FFE4D0; padding: 6px 12px; cursor: pointer;
  font: inherit; font-weight: 700; border-radius: 3px;
  transition: background 0.16s, color 0.16s;
}
.book-overlay-top button:hover { background: #FFE4D0; color: #2a1f15; }

/* stage where the book sits */
.book-stage {
  position: relative; z-index: 1;
  flex: 1 1 auto;
  display: flex; align-items: center; justify-content: center;
  padding: 28px;
  perspective: 2200px;
}

/* the open book */
.book-spread {
  position: relative;
  width: 100%; height: 100%;
  max-width: min(2160px, calc((100vh - 150px) * 2));
  max-height: calc(100vh - 150px);
  aspect-ratio: 2 / 1;
  display: flex;
  border-radius: 4px;
  filter: drop-shadow(0 50px 90px rgba(0,0,0,0.7))
          drop-shadow(0 18px 36px rgba(0,0,0,0.5));
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.book-spread.flipping { opacity: 0; transform: translateY(4px) scale(0.992); }
.book-spread.single {
  max-width: min(1080px, calc(100vh - 150px));
  aspect-ratio: 1 / 1;
}

/* outer page edge (book thickness) */
.book-spread::before, .book-spread::after {
  content: ''; position: absolute; top: 8px; bottom: 8px; width: 6px;
  background: repeating-linear-gradient(to bottom,
    #f1e5cd 0, #f1e5cd 1px,
    #d5c69c 1px, #d5c69c 2px,
    #f1e5cd 2px, #f1e5cd 3px);
  border-radius: 2px;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.18);
}
.book-spread::before { left: -6px; }
.book-spread::after  { right: -6px; }
.book-spread.single::before, .book-spread.single::after {
  background: repeating-linear-gradient(to bottom,
    #f1e5cd 0, #f1e5cd 1px,
    #d5c69c 1px, #d5c69c 2px);
}

/* a page */
.book-page {
  flex: 1 1 50%;
  background: #f5efe1;
  position: relative;
  overflow: hidden;
}
.book-spread.single .book-page { flex: 1 1 100%; border-radius: 4px; }
.book-page.left  { border-radius: 4px 0 0 4px; }
.book-page.right { border-radius: 0 4px 4px 0; }

/* paper grain */
.book-page::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image:
    radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04));
  background-size: 4px 4px, 100% 100%;
  mix-blend-mode: multiply;
  z-index: 1;
}

/* book spine shadow at center */
.book-page.left::after  {
  content: ''; position: absolute; top: 0; bottom: 0; right: 0; width: 36px;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.28));
  pointer-events: none; z-index: 2;
}
.book-page.right::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 36px;
  background: linear-gradient(to left, transparent, rgba(0,0,0,0.28));
  pointer-events: none; z-index: 2;
}

/* iframe inside page */
.book-page iframe {
  width: 1080px; height: 1080px;
  border: 0; display: block;
  transform-origin: top left;
  position: relative; z-index: 0;
}

/* leather cover (first spread of full book or series cover) */
.book-spread.cover-spread .book-page {
  background:
    radial-gradient(ellipse at 30% 25%, rgba(255,228,208,0.08), transparent 60%),
    linear-gradient(155deg, #2a1f15, #18110a 60%, #0e0905);
  color: #FFE4D0;
  display: flex; align-items: center; justify-content: center;
  flex-direction: column; padding: 6%; text-align: center;
}
.book-spread.cover-spread .book-page iframe { display: none; }
.book-spread.cover-spread .book-page::before { display: none; }
.book-spread.cover-spread .book-page::after  { display: none; }
.book-spread.cover-spread .book-page.left {
  background: linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.2));
  border-right: 1px solid rgba(255,228,208,0.06);
}
.book-cover-eyebrow {
  font-family: var(--f-mono, monospace);
  font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;
  color: rgba(255,228,208,0.55);
}
.book-cover-title {
  font-family: 'Noto Serif KR', 'Playfair Display', serif;
  font-size: clamp(28px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.18;
  margin-top: 14px;
  color: #FFE4D0;
  letter-spacing: -0.01em;
}
.book-cover-title em {
  color: #E35205;
  font-style: normal;
  background: linear-gradient(120deg, #ff7a3a, #E35205);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.book-cover-sub {
  font-family: var(--f-sans, sans-serif);
  font-size: clamp(13px, 1.5vw, 16px);
  color: rgba(255,228,208,0.7);
  margin-top: 22px; line-height: 1.7;
  max-width: 420px;
}
.book-cover-rule {
  width: 60px; height: 2px;
  background: linear-gradient(90deg, transparent, #E35205, transparent);
  margin: 28px 0 0;
}
.book-cover-meta {
  position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%);
  font-family: var(--f-mono, monospace);
  font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
  color: rgba(255,228,208,0.4);
}

/* nav buttons */
.book-nav {
  position: absolute; top: 0; bottom: 0;
  width: 12%; min-width: 70px;
  background: transparent; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,228,208,0.32); font-size: 42px; font-weight: 100;
  transition: color 0.16s, background 0.16s;
  z-index: 2;
}
.book-nav:hover { color: #FFE4D0; background: rgba(255,228,208,0.04); }
.book-nav:disabled { opacity: 0.14; cursor: default; }
.book-nav.prev { left: 0; }
.book-nav.next { right: 0; }

/* footer with progress + jump */
.book-overlay-foot {
  position: relative; z-index: 2;
  flex: 0 0 auto;
  display: flex; gap: 14px; justify-content: center; align-items: center;
  padding: 10px 20px 16px;
  flex-wrap: wrap;
  color: rgba(255,228,208,0.5);
  font-family: var(--f-mono, monospace);
  font-size: 10px; letter-spacing: 0.2em;
}
.book-progress-bar {
  flex: 1 1 auto; max-width: 480px; height: 2px;
  background: rgba(255,228,208,0.12); border-radius: 2px; overflow: hidden;
}
.book-progress-bar .fill {
  height: 100%; width: 0%; background: linear-gradient(90deg, #E35205, #FFE4D0);
  transition: width 0.22s ease;
}
.book-jump {
  background: transparent; border: 1px solid rgba(255,228,208,0.24);
  color: rgba(255,228,208,0.7); padding: 5px 10px; cursor: pointer;
  font: inherit; border-radius: 3px;
  transition: background 0.16s, color 0.16s;
}
.book-jump:hover { background: rgba(255,228,208,0.12); color: #FFE4D0; }

@media (max-width: 760px) {
  .book-stage { padding: 14px; }
  .book-spread { max-height: calc(100vh - 130px); }
  .book-overlay-top { padding: 10px 14px; font-size: 10px; }
  .book-nav { width: 18%; min-width: 50px; font-size: 30px; }
  .book-page::after, .book-page.left::after, .book-page.right::after { width: 18px; }
}
    `;
    var style = document.createElement('style');
    style.id = 'book-mode-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- spread building ---------- */
  function isWideViewport() { return window.innerWidth >= 760; }

  function buildSpreads(srcs, options, wide) {
    options = options || {};
    var spreads = [];
    if (!srcs.length) return spreads;
    if (options.coverPage) {
      spreads.push({ type: 'cover', meta: options.coverMeta });
    }
    if (!wide) {
      // 모바일: 한 장씩
      srcs.forEach(function (s) { spreads.push([s]); });
      return spreads;
    }
    // PC: 1번 표지 단독 → 2-3, 4-5, ... 양면
    spreads.push([srcs[0]]);
    for (var i = 1; i < srcs.length; i += 2) {
      var pair = [srcs[i]];
      if (i + 1 < srcs.length) pair.push(srcs[i + 1]);
      spreads.push(pair);
    }
    return spreads;
  }

  // 현재 src (실제 카드)를 spreads의 어느 인덱스에 있는지 찾기
  function spreadIndexOfSrc(spreads, src) {
    for (var i = 0; i < spreads.length; i++) {
      var s = spreads[i];
      if (Array.isArray(s) && s.indexOf(src) !== -1) return i;
    }
    return 0;
  }

  /* ---------- overlay markup ---------- */
  function buildOverlay(state) {
    var overlay = document.createElement('div');
    overlay.className = 'book-overlay';
    overlay.innerHTML = `
      <div class="book-overlay-top">
        <div class="title">📖 <b>${state.title}</b></div>
        <div class="progress" id="book-progress">1 / ${state.spreads.length}</div>
        <button type="button" id="book-close">✕ ESC</button>
      </div>
      <div class="book-stage">
        <button type="button" class="book-nav prev" id="book-prev" aria-label="이전 페이지">‹</button>
        <div class="book-spread single" id="book-spread"></div>
        <button type="button" class="book-nav next" id="book-next" aria-label="다음 페이지">›</button>
      </div>
      <div class="book-overlay-foot">
        <button type="button" class="book-jump" id="book-first">↞ 처음</button>
        <div class="book-progress-bar"><div class="fill" id="book-fill"></div></div>
        <button type="button" class="book-jump" id="book-last">끝 ↠</button>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function fitIframe(iframe, page) {
    var rect = page.getBoundingClientRect();
    var scale = Math.min(rect.width / 1080, rect.height / 1080);
    iframe.style.transform = 'scale(' + scale + ')';
  }

  function renderCover(spreadEl, meta) {
    spreadEl.innerHTML = '';
    spreadEl.classList.add('cover-spread');
    spreadEl.classList.remove('single');
    var leftPage = document.createElement('div');
    leftPage.className = 'book-page left';
    var rightPage = document.createElement('div');
    rightPage.className = 'book-page right';
    rightPage.innerHTML = `
      <div class="book-cover-eyebrow">AI × Series · Card News Magazine</div>
      <h1 class="book-cover-title">${meta.title}</h1>
      <div class="book-cover-rule"></div>
      <p class="book-cover-sub">${meta.sub}</p>
      <div class="book-cover-meta">${meta.foot}</div>
    `;
    spreadEl.appendChild(leftPage);
    spreadEl.appendChild(rightPage);
  }

  function renderSpread(spread, spreadEl) {
    spreadEl.classList.remove('cover-spread');
    spreadEl.innerHTML = '';
    spreadEl.classList.toggle('single', spread.length === 1);
    spread.forEach(function (src, i) {
      var page = document.createElement('div');
      page.className = 'book-page ' + (spread.length === 1 ? 'single' : (i === 0 ? 'left' : 'right'));
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.loading = 'eager';
      page.appendChild(iframe);
      spreadEl.appendChild(page);
      iframe.addEventListener('load', function () { fitIframe(iframe, page); });
      requestAnimationFrame(function () { fitIframe(iframe, page); });
    });
  }

  function attachOverlayLogic(overlay, state) {
    var spreadEl = overlay.querySelector('#book-spread');
    var prog = overlay.querySelector('#book-progress');
    var fill = overlay.querySelector('#book-fill');

    function go(i) {
      i = Math.max(0, Math.min(state.spreads.length - 1, i));
      state.current = i;
      spreadEl.classList.add('flipping');
      setTimeout(function () {
        var s = state.spreads[i];
        if (s && s.type === 'cover') renderCover(spreadEl, s.meta);
        else renderSpread(s, spreadEl);
        spreadEl.classList.remove('flipping');
        if (prog) prog.textContent = (i + 1) + ' / ' + state.spreads.length;
        if (fill) fill.style.width = (((i + 1) / state.spreads.length) * 100) + '%';
        overlay.querySelector('#book-prev').disabled = (i === 0);
        overlay.querySelector('#book-next').disabled = (i === state.spreads.length - 1);
      }, 100);
    }

    overlay.querySelector('#book-close').addEventListener('click', function () {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
    overlay.querySelector('#book-prev').addEventListener('click', function () { go(state.current - 1); });
    overlay.querySelector('#book-next').addEventListener('click', function () { go(state.current + 1); });
    overlay.querySelector('#book-first').addEventListener('click', function () { go(0); });
    overlay.querySelector('#book-last').addEventListener('click', function () { go(state.spreads.length - 1); });
    overlay.querySelector('.book-stage').addEventListener('click', function (e) {
      if (e.target.closest('.book-nav') || e.target.closest('iframe') || e.target.closest('.book-cover-title')) return;
      var stage = overlay.querySelector('.book-stage');
      var rect = stage.getBoundingClientRect();
      if ((e.clientX - rect.left) > rect.width / 2) go(state.current + 1);
      else go(state.current - 1);
    });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { overlay.classList.remove('open'); document.body.style.overflow = ''; }
      else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(state.current + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(state.current - 1); }
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(state.spreads.length - 1);
    });
    function rebuildIfModeChanged() {
      if (!state.srcs) return;
      var wantWide = isWideViewport();
      if (wantWide === state.wide) return;
      // 현재 보고 있는 실제 src를 보존
      var cur = state.spreads[state.current];
      var anchorSrc = (cur && cur.type === 'cover') ? null : (Array.isArray(cur) ? cur[0] : null);
      state.wide = wantWide;
      state.spreads = buildSpreads(state.srcs, state.coverOptions, wantWide);
      var newIdx = anchorSrc ? spreadIndexOfSrc(state.spreads, anchorSrc) : 0;
      go(newIdx);
    }

    window.addEventListener('resize', function () {
      rebuildIfModeChanged();
      overlay.querySelectorAll('.book-page iframe').forEach(function (f) {
        var p = f.parentElement;
        if (p) fitIframe(f, p);
      });
    });

    state.go = go;
  }

  function openBook(state) {
    state.current = 0;
    if (!state.overlay) {
      state.overlay = buildOverlay(state);
      attachOverlayLogic(state.overlay, state);
    }
    state.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    state.go(0);
  }

  /* ---------- mode A: series page ---------- */
  function initSeriesMode(articles) {
    var srcs = Array.from(articles).map(function (a) { return a.dataset.card; });
    var titleEl = document.querySelector('.mag-side h2');
    var subEl = document.querySelector('.mag-side .side-sub');
    var rawTitle = titleEl ? titleEl.innerHTML.trim() : 'AI × Series';
    var sub = subEl ? subEl.textContent.trim() : '';
    var issueLabel = (document.querySelector('.mag-side .side-kicker') || {}).textContent || '';

    var coverOptions = {
      coverPage: true,
      coverMeta: {
        title: rawTitle,
        sub: sub,
        foot: issueLabel.trim() + ' · ' + srcs.length + ' Cards'
      }
    };
    var wide = isWideViewport();
    var state = {
      title: rawTitle.replace(/<\/?em>/g, ''),
      srcs: srcs,
      coverOptions: coverOptions,
      wide: wide,
      spreads: buildSpreads(srcs, coverOptions, wide),
      current: 0,
      overlay: null
    };

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'book-toggle compact';
    btn.innerHTML = '📖 책으로 보기';
    btn.addEventListener('click', function () { openBook(state); });

    var anchor = document.querySelector('.mag-side .side-sub');
    if (anchor) anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }

  /* ---------- mode B: home / full library ---------- */
  async function initFullMode() {
    var hero = document.querySelector('.hero-home');
    if (!hero) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'book-toggle';
    btn.style.marginTop = '20px';
    btn.innerHTML = '📖 전체 한 권으로 읽기';
    var byline = hero.querySelector('.byline');
    if (byline) byline.parentNode.insertBefore(btn, byline.nextSibling);
    else hero.firstElementChild && hero.firstElementChild.appendChild(btn);

    var state = null;
    btn.addEventListener('click', async function () {
      if (!state) {
        try {
          var data = await fetch('series/_data.json', { cache: 'no-cache' }).then(function (r) { return r.json(); });
          var srcs = [];
          var totalCards = 0;
          data.forEach(function (s) {
            s.slides.forEach(function (slide) {
              var stem = slide.replace(/\.png$/, '');
              srcs.push(s.n + '-cards-' + s.slug + '/' + stem + '.html');
              totalCards++;
            });
          });
          var coverOptions = {
            coverPage: true,
            coverMeta: {
              title: 'AI × <em>Series</em>',
              sub: 'AI라는 거울 앞에 다시 묻는 ' + data.length + '개 이슈, ' + totalCards + '장의 카드를 — 한 권으로 펼쳐 봅니다.',
              foot: data.length + ' Issues · ' + totalCards + ' Cards · One Book'
            }
          };
          var wide = isWideViewport();
          state = {
            title: 'AI × <em>Series</em>',
            srcs: srcs,
            coverOptions: coverOptions,
            wide: wide,
            spreads: buildSpreads(srcs, coverOptions, wide),
            current: 0,
            overlay: null
          };
        } catch (e) {
          console.error('Failed to load series data', e);
          alert('데이터를 불러오지 못했습니다.');
          return;
        }
      }
      openBook(state);
    });
  }

  /* ---------- entry ---------- */
  function init() {
    injectStyles();
    var articles = document.querySelectorAll('.mag-article[data-card]');
    if (articles.length > 0) initSeriesMode(articles);
    else if (document.querySelector('.series-grid') || document.querySelector('.hero-home')) initFullMode();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
