# AI × Series — Card News Magazine

AI와 철학·예술·언어·음악·꿈·편향·진화를 엮은 카드뉴스 시리즈.

**Live**: https://sckahn.github.io/cardmagazine/

## Issues

| # | Slug | Title | Cards |
|---|---|---|---|
| 01 | philosophy | AI × Philosophy — AI가 처음 만난 철학자들 | 15 |
| 02 | taste | AI × Taste — AI는 왜 맛을 모르는가 | 6 |
| 03 | vibe | AI × Vibe — 호모 루덴스와 바이브 코딩 | 9 |
| 04 | loop | AI × Loop — 사람이 AI의 고리에 들어가는 법 | 7 |
| 05 | canvas | AI × Canvas — 예술의 매체 혁명 | 7 |
| 06 | aura | AI × Aura — 벤야민·소쉬르·불쾌한 골짜기 | 8 |
| 07 | rhythm | AI × Rhythm — AI 음악은 왜 그루브가 없는가 | 8 |
| 08 | dream | AI × Dream — 기계는 꿈을 꾸는가 | 9 |
| 09 | lingua | AI × Lingua — 의미인가 문법인가 | 9 |
| 10 | bias | AI × Bias — AI는 우리의 거울이다 | 8 |
| 11 | drive | AI × Drive — 거짓말은 진화, AI는 따라한다 | 9 |

총 **11 이슈 · 95장**.

## 프로젝트 구조

```
{N}-cards-{slug}/       # HTML 소스 카드 (1080×1080)
{N}-outputs-{slug}/     # 캡처된 PNG
images/                 # 공용 이미지 (Wikimedia Commons 출처)
style.css               # 카드 전용 스타일
capture.py              # Playwright 기반 PNG 캡처
fix_face_crop.py        # OpenCV로 인물 얼굴 중앙 자동 정렬
index.html              # 매거진 홈
series/{slug}.html      # 시리즈 상세 페이지
styles/site.css         # 매거진 사이트 전용 스타일
```

## 로컬 빌드

```bash
# 의존성 설치 (최초 1회)
pip3 install --break-system-packages playwright opencv-python
python3 -m playwright install chromium

# 전체 PNG 재생성
python3 capture.py --all

# 특정 시리즈만
python3 capture.py dream

# 단일 슬라이드
python3 capture.py dream 02-dick

# 인물 사진 얼굴 중앙 자동 정렬
python3 fix_face_crop.py
```

## 톤 & 디자인

- Pretendard 가변 폰트 + Playfair Display (serif accent) + JetBrains Mono
- Mirae Asset inspired — 절제되고 단단한, 과장 없는 신뢰감
- 브랜드: `#E35205` (주황), `#0f1e38` (네이비), `#f4efe4` (베이지)

## 출처

이미지: Wikimedia Commons 퍼블릭 도메인 · Creative Commons. 각 카드 하단 참조.
