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

/* clean cover — minimal & calm */
.book-spread.cover-spread .book-page {
  background: linear-gradient(170deg, #15213a 0%, #0c1428 100%);
  color: #FFE4D0;
  display: flex; flex-direction: column;
  text-align: left;
  position: relative;
  overflow: hidden;
}
.book-spread.cover-spread .book-page iframe { display: none; }
.book-spread.cover-spread .book-page::before { display: none; }
.book-spread.cover-spread .book-page::after  { display: none; }

/* RIGHT page — masthead 한 면 */
.book-spread.cover-spread .book-page.right {
  padding: 11% 9%;
  justify-content: space-between;
  border-right: 1px solid rgba(255,228,208,0.05);
}
.cover-issue-band {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px; letter-spacing: 0.32em; text-transform: uppercase;
  color: rgba(255,228,208,0.55);
  display: flex; align-items: center; gap: 10px;
}
.cover-issue-band .pip { width: 6px; height: 6px; background: #E35205; border-radius: 50%; }
.cover-masthead {
  font-family: 'Noto Serif KR', serif;
  font-weight: 900;
  font-size: clamp(56px, 8.5vw, 108px);
  line-height: 0.96;
  letter-spacing: -0.03em;
  color: #FFE4D0;
  margin-top: 22px;
}
.cover-masthead em { color: #E35205; font-style: italic; font-weight: 900; }
.cover-rule {
  width: 64px; height: 2px;
  background: #E35205;
  margin: 28px 0 18px;
}
.cover-tagline {
  font-family: 'Noto Serif KR', serif;
  font-size: clamp(17px, 2vw, 22px);
  font-weight: 600;
  color: #FFE4D0;
  line-height: 1.5;
}
.cover-sub {
  font-family: var(--f-sans, sans-serif);
  font-size: clamp(12px, 1.3vw, 14px);
  color: rgba(255,228,208,0.55);
  margin-top: 12px;
  letter-spacing: 0.04em;
}
.cover-hanja-watermark {
  position: absolute;
  right: -4%; bottom: -6%;
  font-family: 'Noto Serif KR', serif;
  font-size: clamp(220px, 32vw, 420px);
  font-weight: 900;
  color: rgba(227,82,5,0.07);
  line-height: 1; pointer-events: none;
  user-select: none;
}

/* LEFT page — TOC list (전체 30호, 1번부터) */
.book-spread.cover-spread .book-page.left {
  background: linear-gradient(170deg, #0e1a32 0%, #060c1e 100%);
  padding: 9% 8% 8%;
  justify-content: flex-start;
}
.cover-toc-eyebrow {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px; letter-spacing: 0.34em; text-transform: uppercase;
  color: rgba(255,228,208,0.5);
}
.cover-toc-title {
  font-family: 'Noto Serif KR', serif;
  font-size: clamp(22px, 2.6vw, 28px);
  font-weight: 800;
  margin-top: 10px;
  color: #FFE4D0;
  letter-spacing: -0.01em;
}
.cover-toc-rule {
  width: 40px; height: 2px;
  background: #E35205;
  margin: 14px 0 22px;
}
.cover-toc {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 22px;
  row-gap: 7px;
}
.cover-toc-row {
  display: flex; align-items: baseline; gap: 9px;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(255,228,208,0.07);
}
.cover-toc-row .num {
  font-family: var(--f-mono, monospace);
  font-size: 10px; color: #E35205;
  font-weight: 700; min-width: 22px;
  letter-spacing: 0.06em;
}
.cover-toc-row .name {
  font-family: 'Noto Serif KR', serif;
  font-size: clamp(11.5px, 1.15vw, 13.5px);
  font-weight: 600;
  color: #FFE4D0;
  letter-spacing: -0.005em;
}

/* single-page (mobile) cover */
.book-spread.cover-spread.single .book-page {
  padding: 10% 8%;
  justify-content: flex-start;
  background: linear-gradient(170deg, #15213a 0%, #0c1428 100%);
}
.book-spread.cover-spread.single .cover-masthead { font-size: clamp(44px, 13vw, 80px); }
.book-spread.cover-spread.single .cover-toc {
  grid-template-columns: 1fr;
  row-gap: 4px;
  margin-top: 10px;
}
.book-spread.cover-spread.single .cover-toc-row .name { font-size: 12.5px; }

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

  function renderCover(spreadEl, meta, wide) {
    spreadEl.innerHTML = '';
    spreadEl.classList.add('cover-spread');
    spreadEl.classList.toggle('single', !wide);

    var toc = meta.toc || [];
    var tocHtml = toc.map(function (t) {
      var num = String(t.n).padStart(2, '0');
      return '<div class="cover-toc-row"><span class="num">' + num + '</span><span class="name">' + t.name + '</span></div>';
    }).join('');

    var rightInner = `
      <div>
        <div class="cover-issue-band">
          <span class="pip"></span>
          <span>${meta.issueLabel || 'Collected Edition'}</span>
        </div>
        <div class="cover-masthead">${meta.masthead}</div>
        <div class="cover-rule"></div>
        <div class="cover-tagline">${meta.tagline || ''}</div>
        ${meta.sub ? '<div class="cover-sub">' + meta.sub + '</div>' : ''}
      </div>
      ${meta.hanja ? '<div class="cover-hanja-watermark">' + meta.hanja + '</div>' : ''}
    `;

    if (wide) {
      var leftPage = document.createElement('div');
      leftPage.className = 'book-page left';
      leftPage.innerHTML = `
        <div class="cover-toc-eyebrow">Table of Contents</div>
        <div class="cover-toc-title">전체 ${toc.length}호 · 한 권의 시리즈</div>
        <div class="cover-toc-rule"></div>
        <div class="cover-toc">${tocHtml}</div>
      `;
      var rightPage = document.createElement('div');
      rightPage.className = 'book-page right';
      rightPage.innerHTML = rightInner;
      spreadEl.appendChild(leftPage);
      spreadEl.appendChild(rightPage);
    } else {
      var page = document.createElement('div');
      page.className = 'book-page right';
      page.innerHTML = `
        <div>
          <div class="cover-issue-band">
            <span class="pip"></span><span>${meta.issueLabel || 'Collected Edition'}</span>
          </div>
          <div class="cover-masthead">${meta.masthead}</div>
          <div class="cover-rule"></div>
          <div class="cover-tagline">${meta.tagline || ''}</div>
          ${meta.sub ? '<div class="cover-sub">' + meta.sub + '</div>' : ''}
        </div>
        <div style="margin-top:32px;">
          <div class="cover-toc-eyebrow">Table of Contents</div>
          <div class="cover-toc-rule"></div>
          <div class="cover-toc">${tocHtml}</div>
        </div>
        ${meta.hanja ? '<div class="cover-hanja-watermark">' + meta.hanja + '</div>' : ''}
      `;
      spreadEl.appendChild(page);
    }
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
        if (s && s.type === 'cover') renderCover(spreadEl, s.meta, state.wide);
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
    var issueLabel = ((document.querySelector('.mag-side .side-kicker') || {}).textContent || '').trim();
    // 시리즈 한자 — first card의 hanja 또는 이슈명에서 추정 (옵션)
    var hanja = '';
    // TOC 항목에서 헤드라인 추출 (표지 제외)
    var headlines = Array.from(document.querySelectorAll('#toc li a')).slice(1).map(function (a) {
      var t = a.textContent.trim().replace(/^\d+\s*/, '');
      return t;
    }).filter(function (t) { return t && t !== 'Outro'; }).slice(0, 7);
    // 메인 헤드라인(부제) 분리
    var mainTitleParts = sub.split('—');
    var mainTitle = (mainTitleParts[0] || sub).trim();

    var coverOptions = {
      coverPage: true,
      coverMeta: {
        masthead: rawTitle,
        title: mainTitle,
        sub: mainTitleParts.length > 1 ? mainTitleParts.slice(1).join('—').trim() : '',
        issueLabel: issueLabel || 'Card News Magazine',
        dateLabel: 'Vol. ' + (issueLabel.match(/\d+/) || ['?'])[0],
        overline: 'COVER STORY',
        scope: 'Issue',
        headlines: headlines,
        hanja: hanja,
        foot: srcs.length + ' Cards'
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
          var data = window.SERIES_DATA;
          if (!data) {
            // fallback: try fetch (works on http(s):// origins)
            try {
              data = await fetch('series/_data.json', { cache: 'no-cache' }).then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
              });
            } catch (fetchErr) {
              throw new Error('series 데이터(window.SERIES_DATA)가 로드되지 않았습니다. series/_data.js 스크립트가 페이지에 포함되었는지 확인해 주세요.');
            }
          }
          var srcs = [];
          var totalCards = 0;
          data.forEach(function (s) {
            s.slides.forEach(function (slide) {
              var stem = slide.replace(/\.png$/, '');
              srcs.push(s.n + '-cards-' + s.slug + '/' + stem + '.html');
              totalCards++;
            });
          });
          // 표지 좌측: 1호부터 순서대로 전체 목차
          var toc = data.map(function (s) {
            return { n: s.n, name: s.name, subtitle: s.subtitle };
          });
          var coverOptions = {
            coverPage: true,
            coverMeta: {
              masthead: 'AI × <em>Series</em>',
              tagline: '오래된 질문, 새로운 거울.',
              sub: data.length + '개 이슈 · ' + totalCards + '장의 카드.',
              issueLabel: 'Collected Edition',
              toc: toc,
              hanja: '誌'
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
          alert('데이터를 불러오지 못했습니다.\n\n' + (e && e.message ? e.message : ''));
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
