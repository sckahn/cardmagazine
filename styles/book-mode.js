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

/* iframe wrapper (sized to scaled visual dimensions for correct scroll area) */
.book-page-inner {
  position: relative;
  overflow: hidden;
  flex: 0 0 auto;
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

/* LEFT page — quote / preface */
.book-spread.cover-spread .book-page.left {
  background: linear-gradient(170deg, #0e1a32 0%, #060c1e 100%);
  padding: 14% 10%;
  justify-content: center;
}
.cover-quote-eyebrow {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px; letter-spacing: 0.34em; text-transform: uppercase;
  color: rgba(255,228,208,0.45);
  margin-bottom: 36px;
}
.cover-quote {
  font-family: 'Noto Serif KR', serif;
  font-size: clamp(28px, 3.4vw, 44px);
  font-weight: 700;
  line-height: 1.45;
  color: #FFE4D0;
  letter-spacing: -0.015em;
  margin: 0;
}
.cover-quote em {
  font-style: italic; color: #E35205; font-weight: 800;
}
.cover-quote-cite {
  margin-top: 32px;
  font-family: var(--f-mono, monospace);
  font-size: 11px; letter-spacing: 0.18em;
  color: rgba(255,228,208,0.5);
}

/* single-page (mobile) cover */
.book-spread.cover-spread.single .book-page {
  padding: 10% 8%;
  justify-content: flex-start;
  background: linear-gradient(170deg, #15213a 0%, #0c1428 100%);
}
.book-spread.cover-spread.single .cover-masthead { font-size: clamp(44px, 13vw, 80px); }

/* dedicated TOC spread */
.book-spread.toc-spread .book-page {
  background: linear-gradient(165deg, #fbf6ee 0%, #f1e7d2 100%);
  color: #1a2440;
  display: flex; flex-direction: column;
  padding: 6% 6.5% 5%;
  text-align: left;
  position: relative;
  overflow: hidden;
}
.book-spread.toc-spread .book-page iframe { display: none; }
.book-spread.toc-spread .book-page::before { display: none; }
.book-spread.toc-spread .book-page::after  { display: none; }
.toc-eyebrow {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px; letter-spacing: 0.34em; text-transform: uppercase;
  color: #b14406;
  font-weight: 700;
}
.toc-eyebrow-right { color: rgba(26,36,64,0.4); }
.toc-title {
  font-family: 'Noto Serif KR', serif;
  font-size: clamp(28px, 3.6vw, 42px);
  font-weight: 900;
  margin: 8px 0 0;
  color: #1a2440;
  letter-spacing: -0.018em;
}
.toc-title-sub {
  font-size: 0.45em;
  color: rgba(26,36,64,0.45);
  font-weight: 500;
  font-family: var(--f-mono, monospace);
  letter-spacing: 0.18em;
  margin-left: 10px;
  vertical-align: middle;
}
.toc-rule {
  width: 56px; height: 2px;
  background: #E35205;
  margin: 14px 0 18px;
}
.toc-list {
  display: flex; flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
}
.toc-row {
  all: unset;
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: baseline;
  gap: 12px;
  padding: 8px 6px 8px 0;
  border-bottom: 1px dashed rgba(26,36,64,0.13);
  cursor: pointer;
  transition: background 0.12s, padding 0.12s;
  font-family: 'Noto Serif KR', serif;
}
.toc-row:hover {
  background: rgba(227,82,5,0.06);
  padding-left: 6px;
}
.toc-row:focus-visible {
  outline: 2px solid #E35205;
  outline-offset: -2px;
  border-radius: 3px;
}
.toc-num {
  font-family: var(--f-mono, monospace);
  font-size: 11.5px; font-weight: 800;
  color: #E35205;
  letter-spacing: 0.06em;
}
.toc-body {
  display: flex; flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.toc-name {
  font-size: clamp(13px, 1.35vw, 16px);
  font-weight: 800;
  color: #1a2440;
  letter-spacing: -0.005em;
}
.toc-sub {
  font-size: clamp(10.5px, 1.05vw, 12.5px);
  color: rgba(26,36,64,0.55);
  font-weight: 500;
  line-height: 1.4;
  font-family: var(--f-sans, sans-serif);
}
.toc-page {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px;
  color: rgba(26,36,64,0.4);
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.toc-foot {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(26,36,64,0.1);
  font-family: var(--f-mono, monospace);
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(26,36,64,0.45);
}
.book-spread.toc-spread.single .toc-list { gap: 2px; }

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

/* slider scrubber over progress bar */
.book-scrub {
  position: relative;
  flex: 1 1 auto; max-width: 480px;
  display: flex; align-items: center;
  height: 22px;
}
.book-scrub .book-progress-bar {
  position: absolute; left: 0; right: 0; top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.book-slider {
  -webkit-appearance: none; appearance: none;
  position: relative; z-index: 1;
  width: 100%;
  height: 22px;
  background: transparent;
  cursor: pointer;
  margin: 0;
}
.book-slider::-webkit-slider-runnable-track {
  height: 22px; background: transparent; border: 0;
}
.book-slider::-moz-range-track {
  height: 22px; background: transparent; border: 0;
}
.book-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px;
  background: #FFE4D0;
  border: 2px solid #E35205;
  border-radius: 50%;
  margin-top: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  cursor: grab;
  transition: transform 0.12s;
}
.book-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.2); }
.book-slider::-moz-range-thumb {
  width: 14px; height: 14px;
  background: #FFE4D0;
  border: 2px solid #E35205;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  cursor: grab;
}
.book-scrub-tip {
  position: absolute;
  bottom: 30px; left: 50%; transform: translateX(-50%);
  background: rgba(20,28,52,0.95);
  color: #FFE4D0;
  padding: 4px 9px;
  font-size: 10.5px; letter-spacing: 0.18em;
  border-radius: 3px;
  border: 1px solid rgba(255,228,208,0.18);
  pointer-events: none;
  opacity: 0; transition: opacity 0.14s;
  white-space: nowrap;
  font-family: var(--f-mono, monospace);
}
.book-scrub.scrubbing .book-scrub-tip { opacity: 1; }

/* zoom controls */
.book-zoom {
  display: flex; align-items: center; gap: 4px;
  border: 1px solid rgba(255,228,208,0.18);
  border-radius: 4px;
  padding: 2px;
}
.book-zoom-btn {
  background: transparent; border: 0;
  color: rgba(255,228,208,0.75);
  font: inherit;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.14s, color 0.14s;
}
.book-zoom-btn:hover { background: rgba(255,228,208,0.12); color: #FFE4D0; }
.book-zoom-btn:disabled { opacity: 0.3; cursor: default; }
.book-zoom-val {
  font-family: var(--f-mono, monospace);
  font-size: 10px;
  color: rgba(255,228,208,0.55);
  min-width: 36px; text-align: center;
  letter-spacing: 0.1em;
}

/* iframe overflow when zoomed in */
.book-page { overflow: hidden; }
.book-page.zoomed { overflow: auto; }
.book-page.zoomed::-webkit-scrollbar { width: 6px; height: 6px; }
.book-page.zoomed::-webkit-scrollbar-thumb {
  background: rgba(255,228,208,0.25); border-radius: 3px;
}

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
    if (options.tocPage && options.tocMeta) {
      spreads.push({ type: 'toc', meta: options.tocMeta });
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
        <button type="button" class="book-jump" id="book-toc">≡ 목차</button>
        <button type="button" class="book-jump" id="book-first">↞ 처음</button>
        <div class="book-scrub">
          <div class="book-progress-bar"><div class="fill" id="book-fill"></div></div>
          <input type="range" id="book-slider" class="book-slider" min="0" value="0" step="1" aria-label="페이지 슬라이더" />
          <div class="book-scrub-tip" id="book-scrub-tip"></div>
        </div>
        <button type="button" class="book-jump" id="book-last">끝 ↠</button>
        <div class="book-zoom" role="group" aria-label="글씨 크기">
          <button type="button" class="book-zoom-btn" id="book-zoom-out" aria-label="글씨 작게">A−</button>
          <span class="book-zoom-val" id="book-zoom-val">100%</span>
          <button type="button" class="book-zoom-btn" id="book-zoom-in" aria-label="글씨 크게">A+</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function fitIframe(iframe, page, zoom) {
    zoom = zoom || 1;
    var rect = page.getBoundingClientRect();
    var baseScale = Math.min(rect.width / 1080, rect.height / 1080);
    var scale = baseScale * zoom;
    iframe.style.transform = 'scale(' + scale + ')';
    // 줌 시 transform이 레이아웃을 안 바꾸므로 부모 wrapper에 명시적 크기 부여
    var wrapper = iframe.parentElement;
    if (wrapper && wrapper.classList.contains('book-page-inner')) {
      wrapper.style.width = (1080 * scale) + 'px';
      wrapper.style.height = (1080 * scale) + 'px';
    }
    page.classList.toggle('zoomed', zoom > 1.001);
  }

  function renderCover(spreadEl, meta, wide) {
    spreadEl.innerHTML = '';
    spreadEl.classList.remove('toc-spread');
    spreadEl.classList.add('cover-spread');
    spreadEl.classList.toggle('single', !wide);

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
      leftPage.className = 'book-page left cover-quote-page';
      leftPage.innerHTML = `
        <div class="cover-quote-eyebrow">Preface</div>
        <blockquote class="cover-quote">
          오래된 질문들이<br />
          <em>AI</em> 앞에서<br />
          다시 낯설어집니다.
        </blockquote>
        <div class="cover-quote-cite">— Card News Magazine</div>
      `;
      var rightPage = document.createElement('div');
      rightPage.className = 'book-page right';
      rightPage.innerHTML = rightInner;
      spreadEl.appendChild(leftPage);
      spreadEl.appendChild(rightPage);
    } else {
      var page = document.createElement('div');
      page.className = 'book-page right';
      page.innerHTML = rightInner;
      spreadEl.appendChild(page);
    }
  }

  function renderToc(spreadEl, meta, wide, go, state) {
    spreadEl.innerHTML = '';
    spreadEl.classList.remove('cover-spread');
    spreadEl.classList.add('toc-spread');
    spreadEl.classList.toggle('single', !wide);

    var entries = meta.entries || [];
    function resolveStartSpread(firstSrc) {
      if (!firstSrc || !state) return 0;
      return spreadIndexOfSrc(state.spreads, firstSrc);
    }
    function row(t) {
      var num = String(t.n).padStart(2, '0');
      var startSpread = resolveStartSpread(t.firstSrc);
      return '<button type="button" class="toc-row" data-spread="' + startSpread + '">'
        + '<span class="toc-num">' + num + '</span>'
        + '<span class="toc-body">'
          + '<span class="toc-name">' + t.name + '</span>'
          + (t.subtitle ? '<span class="toc-sub">' + t.subtitle + '</span>' : '')
        + '</span>'
        + '<span class="toc-page">p.' + (t.page || '') + '</span>'
        + '</button>';
    }

    function attachJump(pageEl) {
      pageEl.querySelectorAll('.toc-row').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-spread'), 10);
          if (!isNaN(idx)) go(idx);
        });
      });
    }

    if (wide) {
      var half = Math.ceil(entries.length / 2);
      var leftEntries = entries.slice(0, half);
      var rightEntries = entries.slice(half);

      var leftPage = document.createElement('div');
      leftPage.className = 'book-page left toc-page';
      leftPage.innerHTML = `
        <div class="toc-eyebrow">Table of Contents</div>
        <h2 class="toc-title">목차 <span class="toc-title-sub">${entries.length} Issues</span></h2>
        <div class="toc-rule"></div>
        <div class="toc-list">${leftEntries.map(row).join('')}</div>
      `;
      var rightPage = document.createElement('div');
      rightPage.className = 'book-page right toc-page';
      rightPage.innerHTML = `
        <div class="toc-eyebrow toc-eyebrow-right">Continued</div>
        <div class="toc-rule"></div>
        <div class="toc-list">${rightEntries.map(row).join('')}</div>
        <div class="toc-foot">눌러서 해당 호로 바로 이동 →</div>
      `;
      spreadEl.appendChild(leftPage);
      spreadEl.appendChild(rightPage);
      attachJump(leftPage);
      attachJump(rightPage);
    } else {
      var page = document.createElement('div');
      page.className = 'book-page toc-page';
      page.innerHTML = `
        <div class="toc-eyebrow">Table of Contents</div>
        <h2 class="toc-title">목차 <span class="toc-title-sub">${entries.length} Issues</span></h2>
        <div class="toc-rule"></div>
        <div class="toc-list">${entries.map(row).join('')}</div>
        <div class="toc-foot">눌러서 해당 호로 바로 이동 →</div>
      `;
      spreadEl.appendChild(page);
      attachJump(page);
    }
  }

  function renderSpread(spread, spreadEl) {
    spreadEl.classList.remove('cover-spread');
    spreadEl.classList.remove('toc-spread');
    spreadEl.innerHTML = '';
    spreadEl.classList.toggle('single', spread.length === 1);
    var zoom = parseFloat(spreadEl.dataset.zoom || '1') || 1;
    spread.forEach(function (src, i) {
      var page = document.createElement('div');
      page.className = 'book-page ' + (spread.length === 1 ? 'single' : (i === 0 ? 'left' : 'right'));
      var inner = document.createElement('div');
      inner.className = 'book-page-inner';
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.loading = 'eager';
      inner.appendChild(iframe);
      page.appendChild(inner);
      spreadEl.appendChild(page);
      iframe.addEventListener('load', function () { fitIframe(iframe, page, zoom); });
      requestAnimationFrame(function () { fitIframe(iframe, page, zoom); });
    });
  }

  function attachOverlayLogic(overlay, state) {
    var spreadEl = overlay.querySelector('#book-spread');
    var prog = overlay.querySelector('#book-progress');
    var fill = overlay.querySelector('#book-fill');
    var slider = overlay.querySelector('#book-slider');
    var scrubTip = overlay.querySelector('#book-scrub-tip');
    var scrubWrap = overlay.querySelector('.book-scrub');
    var tocBtn = overlay.querySelector('#book-toc');

    function findTocIndex() {
      for (var i = 0; i < state.spreads.length; i++) {
        var s = state.spreads[i];
        if (s && s.type === 'toc') return i;
      }
      return -1;
    }

    function syncSlider() {
      if (!slider) return;
      slider.max = String(state.spreads.length - 1);
      slider.value = String(state.current);
    }

    function go(i) {
      i = Math.max(0, Math.min(state.spreads.length - 1, i));
      state.current = i;
      spreadEl.classList.add('flipping');
      setTimeout(function () {
        var s = state.spreads[i];
        if (s && s.type === 'cover') renderCover(spreadEl, s.meta, state.wide);
        else if (s && s.type === 'toc') renderToc(spreadEl, s.meta, state.wide, go, state);
        else renderSpread(s, spreadEl);
        spreadEl.classList.remove('flipping');
        if (prog) prog.textContent = (i + 1) + ' / ' + state.spreads.length;
        if (fill) fill.style.width = (((i + 1) / state.spreads.length) * 100) + '%';
        overlay.querySelector('#book-prev').disabled = (i === 0);
        overlay.querySelector('#book-next').disabled = (i === state.spreads.length - 1);
        syncSlider();
        var tocIdx = findTocIndex();
        if (tocBtn) tocBtn.style.display = (tocIdx === -1 || tocIdx === i) ? 'none' : '';
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
    if (tocBtn) {
      tocBtn.addEventListener('click', function () {
        var idx = findTocIndex();
        if (idx !== -1) go(idx);
      });
    }

    /* slider scrubbing */
    if (slider) {
      slider.max = String(state.spreads.length - 1);
      function updateTip(val) {
        if (!scrubTip) return;
        scrubTip.textContent = (parseInt(val, 10) + 1) + ' / ' + state.spreads.length;
        var pct = state.spreads.length > 1 ? (parseInt(val, 10) / (state.spreads.length - 1)) * 100 : 0;
        scrubTip.style.left = pct + '%';
      }
      var scrubStartActive = false;
      function start() { scrubStartActive = true; if (scrubWrap) scrubWrap.classList.add('scrubbing'); updateTip(slider.value); }
      function end() { scrubStartActive = false; if (scrubWrap) scrubWrap.classList.remove('scrubbing'); }
      slider.addEventListener('input', function () {
        if (!scrubStartActive) start();
        updateTip(slider.value);
        if (fill) fill.style.width = (((parseInt(slider.value, 10) + 1) / state.spreads.length) * 100) + '%';
      });
      slider.addEventListener('change', function () {
        end();
        go(parseInt(slider.value, 10));
      });
      slider.addEventListener('pointerdown', start);
      slider.addEventListener('pointerup', end);
      slider.addEventListener('pointercancel', end);
      slider.addEventListener('mouseleave', function () { if (scrubStartActive) end(); });
    }

    /* touch swipe on stage */
    var stage = overlay.querySelector('.book-stage');
    var touchX = null, touchY = null, touchT = 0;
    stage.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      touchT = Date.now();
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (touchX == null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - touchX;
      var dy = t.clientY - touchY;
      var dt = Date.now() - touchT;
      touchX = touchY = null;
      if (Math.abs(dx) < 40) return;
      if (Math.abs(dy) > Math.abs(dx)) return;  // 세로 스크롤이면 무시
      if (dt > 800) return;
      state._swallowClick = true;  // 직후 발생하는 click 무시
      if (dx < 0) go(state.current + 1);
      else go(state.current - 1);
    }, { passive: true });
    overlay.querySelector('.book-stage').addEventListener('click', function (e) {
      if (state._swallowClick) { state._swallowClick = false; return; }
      if (e.target.closest('.book-nav') || e.target.closest('iframe') || e.target.closest('.book-cover-title')) return;
      if (e.target.closest('.toc-row')) return;
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
      var z = state.zoom || 1;
      overlay.querySelectorAll('.book-page iframe').forEach(function (f) {
        var p = f.parentElement;
        if (p) fitIframe(f, p, z);
      });
    });

    /* zoom controls */
    var ZOOM_STEPS = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];
    if (state.zoom == null) state.zoom = 1.0;
    var zoomVal = overlay.querySelector('#book-zoom-val');
    var zoomIn = overlay.querySelector('#book-zoom-in');
    var zoomOut = overlay.querySelector('#book-zoom-out');
    function applyZoom() {
      spreadEl.dataset.zoom = String(state.zoom);
      overlay.querySelectorAll('.book-page iframe').forEach(function (f) {
        var p = f.parentElement;
        if (p) fitIframe(f, p, state.zoom);
      });
      if (zoomVal) zoomVal.textContent = Math.round(state.zoom * 100) + '%';
      if (zoomIn) zoomIn.disabled = state.zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1];
      if (zoomOut) zoomOut.disabled = state.zoom <= ZOOM_STEPS[0];
    }
    function stepZoom(delta) {
      var idx = ZOOM_STEPS.indexOf(state.zoom);
      if (idx === -1) idx = 0;
      idx = Math.max(0, Math.min(ZOOM_STEPS.length - 1, idx + delta));
      state.zoom = ZOOM_STEPS[idx];
      applyZoom();
    }
    if (zoomIn) zoomIn.addEventListener('click', function () { stepZoom(1); });
    if (zoomOut) zoomOut.addEventListener('click', function () { stepZoom(-1); });
    applyZoom();

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
          var tocEntries = [];
          data.forEach(function (s) {
            var firstSrcIdx = srcs.length;
            s.slides.forEach(function (slide) {
              var stem = slide.replace(/\.png$/, '');
              srcs.push(s.n + '-cards-' + s.slug + '/' + stem + '.html');
              totalCards++;
            });
            tocEntries.push({
              n: s.n,
              name: s.name,
              subtitle: s.subtitle,
              firstSrc: srcs[firstSrcIdx],
              page: firstSrcIdx + 1  // 표시용 페이지 번호 (카드 기준)
            });
          });
          var coverOptions = {
            coverPage: true,
            coverMeta: {
              masthead: 'AI × <em>Series</em>',
              tagline: '오래된 질문, 새로운 거울.',
              sub: data.length + '개 이슈 · ' + totalCards + '장의 카드.',
              issueLabel: 'Collected Edition',
              hanja: '誌'
            },
            tocPage: true,
            tocMeta: {
              entries: tocEntries
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
