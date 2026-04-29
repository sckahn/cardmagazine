/* AI × Series · Book Mode
 * Series 매거진 페이지에서 모든 카드를 한 권의 책처럼 좌·우 페이지로 펼쳐 보는 모드.
 * 1번 표지는 단독, 그 다음부터 2장씩 펼침.
 *  ← / → / 클릭 / 버튼으로 페이지 넘김
 *  ESC 또는 X 버튼으로 닫기
 */
(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('book-mode-style')) return;
    var css = `
.book-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  margin-top: 14px;
  border: 1px solid var(--line, rgba(15,30,56,0.18));
  background: rgba(255,255,255,0.55);
  color: var(--navy, #0f1e38);
  font-family: var(--f-mono, JetBrains Mono, monospace);
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700;
  cursor: pointer; border-radius: 4px;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.book-toggle:hover { background: var(--navy, #0f1e38); color: #fff; border-color: var(--navy, #0f1e38); }

.book-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: #0a1224;
  display: none;
  flex-direction: column;
}
.book-overlay.open { display: flex; }
.book-overlay-top {
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  color: rgba(255,228,208,0.86);
  font-family: var(--f-mono, monospace);
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.book-overlay-top .title b { color: #fff; font-weight: 800; }
.book-overlay-top .progress { color: #FFE4D0; font-weight: 700; letter-spacing: 0.2em; }
.book-overlay-top button {
  background: transparent; border: 1px solid rgba(255,228,208,0.4);
  color: #FFE4D0; padding: 6px 12px; cursor: pointer;
  font-family: inherit; font-size: 11px; letter-spacing: 0.16em; font-weight: 700;
  border-radius: 3px;
  transition: background 0.16s, color 0.16s;
}
.book-overlay-top button:hover { background: #FFE4D0; color: #0f1e38; }

.book-stage {
  flex: 1 1 auto;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  position: relative; overflow: hidden;
}
.book-spread {
  display: flex; gap: 0;
  width: 100%; height: 100%;
  max-width: min(2160px, calc((100vh - 130px) * 2));
  max-height: calc(100vh - 130px);
  aspect-ratio: 2 / 1;
  position: relative;
  filter: drop-shadow(0 30px 80px rgba(0,0,0,0.55));
}
.book-spread.single {
  max-width: min(1080px, calc(100vh - 130px));
  aspect-ratio: 1 / 1;
  margin: 0 auto;
}
.book-page {
  flex: 1 1 50%;
  background: var(--bg, #f4efe4);
  position: relative;
  overflow: hidden;
}
.book-spread.single .book-page { flex: 1 1 100%; }
.book-page iframe {
  width: 1080px; height: 1080px;
  border: 0; display: block;
  transform-origin: top left;
}
.book-page.left  { border-right: 1px solid rgba(15,30,56,0.18); }
.book-page.left::after  {
  content: ''; position: absolute; top:0; bottom:0; right:0; width: 24px;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.18));
  pointer-events: none;
}
.book-page.right::before {
  content: ''; position: absolute; top:0; bottom:0; left:0; width: 24px;
  background: linear-gradient(to left, transparent, rgba(0,0,0,0.18));
  pointer-events: none;
}
.book-page.empty { background: rgba(15,30,56,0.4); opacity: 0.4; }

.book-nav {
  position: absolute; top: 0; bottom: 0;
  width: 14%; min-width: 80px;
  background: transparent; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,228,208,0.4); font-size: 36px; font-weight: 100;
  transition: color 0.16s, background 0.16s;
  z-index: 2;
}
.book-nav:hover { color: #FFE4D0; background: rgba(255,228,208,0.04); }
.book-nav:disabled { opacity: 0.18; cursor: default; }
.book-nav.prev { left: 0; }
.book-nav.next { right: 0; }

.book-overlay-foot {
  flex: 0 0 auto;
  display: flex; gap: 6px; justify-content: center; align-items: center;
  padding: 10px 20px 16px;
  flex-wrap: wrap;
}
.book-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,228,208,0.22);
  cursor: pointer; border: 0; padding: 0;
  transition: background 0.16s, transform 0.16s;
}
.book-dot:hover { background: rgba(255,228,208,0.55); transform: scale(1.3); }
.book-dot.active { background: #FFE4D0; transform: scale(1.4); }

@media (max-width: 720px) {
  .book-stage { padding: 12px; }
  .book-spread { max-height: calc(100vh - 110px); }
  .book-overlay-top { padding: 10px 14px; font-size: 10px; }
  .book-nav { width: 18%; min-width: 50px; font-size: 28px; }
}
    `;
    var style = document.createElement('style');
    style.id = 'book-mode-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildSpreads(articles) {
    // articles: NodeList of <article data-card="...">
    // Layout: [cover single], [02-03], [04-05], ..., (마지막이 홀수면 단독)
    var srcs = Array.from(articles).map(function (a) { return a.dataset.card; });
    var spreads = [];
    if (!srcs.length) return spreads;
    spreads.push([srcs[0]]); // 표지 단독
    for (var i = 1; i < srcs.length; i += 2) {
      var pair = [srcs[i]];
      if (i + 1 < srcs.length) pair.push(srcs[i + 1]);
      spreads.push(pair);
    }
    return spreads;
  }

  function buildOverlay(spreads, title) {
    var overlay = document.createElement('div');
    overlay.className = 'book-overlay';
    overlay.innerHTML = `
      <div class="book-overlay-top">
        <div class="title">📖 <b>${title}</b></div>
        <div class="progress" id="book-progress">1 / ${spreads.length}</div>
        <button type="button" id="book-close">✕ ESC</button>
      </div>
      <div class="book-stage">
        <button type="button" class="book-nav prev" id="book-prev" aria-label="이전 페이지">‹</button>
        <div class="book-spread single" id="book-spread"></div>
        <button type="button" class="book-nav next" id="book-next" aria-label="다음 페이지">›</button>
      </div>
      <div class="book-overlay-foot" id="book-dots"></div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function fitIframe(iframe, page) {
    var rect = page.getBoundingClientRect();
    var scale = Math.min(rect.width / 1080, rect.height / 1080);
    iframe.style.transform = 'scale(' + scale + ')';
  }

  function render(spread, spreadEl, idx, total) {
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
      // 초기에 한 번
      requestAnimationFrame(function () { fitIframe(iframe, page); });
    });
    var prog = document.getElementById('book-progress');
    if (prog) prog.textContent = (idx + 1) + ' / ' + total;
    var dots = document.querySelectorAll('.book-dot');
    dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
  }

  function init() {
    injectStyles();
    var articles = document.querySelectorAll('.mag-article[data-card]');
    if (!articles.length) return;
    var seriesTitle = (document.querySelector('.mag-side h2') || {}).textContent || 'AI × Series';
    seriesTitle = seriesTitle.trim().replace(/\s+/g, ' ');

    // 책 모드 토글 버튼을 sidebar에 삽입
    var sideKicker = document.querySelector('.mag-side .side-kicker');
    if (!sideKicker) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'book-toggle';
    btn.innerHTML = '📖 책으로 보기';
    sideKicker.parentNode.insertBefore(btn, sideKicker.nextSibling.nextSibling || null);

    var overlay = null;
    var spreads = [];
    var current = 0;

    function open() {
      if (!overlay) {
        spreads = buildSpreads(articles);
        overlay = buildOverlay(spreads, seriesTitle);
        // dots
        var dotsContainer = overlay.querySelector('#book-dots');
        spreads.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'book-dot';
          dot.setAttribute('aria-label', '펼침 ' + (i + 1));
          dot.addEventListener('click', function () { goTo(i); });
          dotsContainer.appendChild(dot);
        });
        overlay.querySelector('#book-close').addEventListener('click', close);
        overlay.querySelector('#book-prev').addEventListener('click', function () { goTo(current - 1); });
        overlay.querySelector('#book-next').addEventListener('click', function () { goTo(current + 1); });
        // page click → next (오른쪽 절반 클릭)·prev (왼쪽 절반 클릭)
        overlay.querySelector('.book-stage').addEventListener('click', function (e) {
          if (e.target.closest('.book-nav') || e.target.closest('iframe')) return;
          var stage = overlay.querySelector('.book-stage');
          var rect = stage.getBoundingClientRect();
          if ((e.clientX - rect.left) > rect.width / 2) goTo(current + 1);
          else goTo(current - 1);
        });
        // 리사이즈 시 iframe 재조정
        window.addEventListener('resize', function () {
          overlay.querySelectorAll('.book-page').forEach(function (p) {
            var f = p.querySelector('iframe');
            if (f) fitIframe(f, p);
          });
        });
      }
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      goTo(0);
    }

    function close() {
      if (!overlay) return;
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function goTo(i) {
      if (!overlay) return;
      i = Math.max(0, Math.min(spreads.length - 1, i));
      current = i;
      render(spreads[i], overlay.querySelector('#book-spread'), i, spreads.length);
      overlay.querySelector('#book-prev').disabled = (i === 0);
      overlay.querySelector('#book-next').disabled = (i === spreads.length - 1);
    }

    btn.addEventListener('click', open);
    document.addEventListener('keydown', function (e) {
      if (!overlay || !overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); goTo(current + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
      else if (e.key === 'Home') goTo(0);
      else if (e.key === 'End')  goTo(spreads.length - 1);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
