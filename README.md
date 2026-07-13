# GROOVE — Music Card Magazine

음악을 한 장씩 넘겨 읽는 카드뉴스 매거진. 바이닐·재즈·샘플링·K-pop — 한 호에 한 주제, 카드 한 장에 한 장면.

## 구성

| # | Slug | Title | Cards |
|---|---|---|---|
| 01 | vinyl | GROOVE × Vinyl — 다시 도는 검은 원반 | 7 |
| 02 | jazz | GROOVE × Jazz — 즉흥이라는 설계 | 7 |
| 03 | sampling | GROOVE × Sampling — 훔친 소리, 새로운 예술 | 7 |
| 04 | kpop | GROOVE × K-pop — 3분의 설계학 | 7 |

총 **4호 · 28장**.

## 프로젝트 구조

```
{N}-cards-{slug}/     # 카드 HTML 소스 (1080×1080)
{N}-outputs-{slug}/   # 캡처 PNG (SNS 업로드용)
style.css             # 카드 공용 디자인 시스템
capture.py            # Playwright 기반 PNG 캡처
index.html            # 포털 홈 (레코드 크레이트)
series/{slug}.html    # 이슈별 스크롤 reader
styles/site.css       # 사이트 셸 스타일
styles/magazine.css   # reader 스타일
```

## 로컬 빌드

```bash
# 의존성 설치 (최초 1회)
pip3 install --break-system-packages playwright
python3 -m playwright install chromium   # 또는 CHROMIUM_PATH로 로컬 크로뮴 지정

# 전체 PNG 재생성
python3 capture.py --all

# 특정 이슈만
python3 capture.py vinyl

# 단일 슬라이드
python3 capture.py vinyl 02-goldmark
```

로컬에서 사이트를 보려면 정적 서버가 필요합니다 (reader가 카드 HTML을 fetch로 불러오기 때문):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## 디자인 시스템

모든 호가 동일한 카드 그리드(1080×1080)와 타이포그래피를 공유하되, 호별 색조로 구분됩니다.

- **공통 폰트** · Pretendard 가변 + Playfair Display(serif accent) + JetBrains Mono
- **기본 톤** · 뮤직 프레스 — `#C8102E` 크림슨 / `#141419` 바이닐 블랙 / `#f6f1e6` 크림
- **호별 액센트** · vinyl `#C8102E` 크림슨 · jazz `#B08336` 브라스 · sampling `#3E7C6E` 딥 틸 · kpop `#C05398` 마젠타

음악 전용 컴포넌트: 트랙리스트(라이너 노트), 바이닐 디스크 장식, 웨이브폼, 스탯 칩.
전반적으로 절제된 에디토리얼 톤 — 과장 없는 정보 밀도와 sans/serif 대비.
