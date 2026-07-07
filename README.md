<div align="center">

# Career Radar

공식 채용 사이트를 빠르게 열고, 타겟 기업 우선순위와 지원 전략을 한 화면에서 확인하는 취업 준비 앱

[![Deploy Career Job Tracker](https://github.com/twinsben94/Job_Search/actions/workflows/pages.yml/badge.svg)](https://github.com/twinsben94/Job_Search/actions/workflows/pages.yml)

<a href="https://twinsben94.github.io/Job_Search/"><b>Open Web App</b></a>
&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="https://twinsben94.github.io/Job_Search/#strategy"><b>Strategy View</b></a>
&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="https://twinsben94.github.io/Job_Search/#links"><b>Official Links</b></a>

<br><br>

<a href="https://twinsben94.github.io/Job_Search/">
  <img src="./02_Web_App/public/assets/dashboard-preview.svg" alt="Career Radar dashboard preview" width="920">
</a>

</div>

## App Goal

Career Radar는 자동 크롤러가 아니라 **수동 채용 확인 허브**입니다.

공식 채용 사이트는 로그인, 검색 UI, JavaScript 렌더링, CORS 제한 때문에 정적 GitHub Pages에서 안정적으로 실시간 크롤링하기 어렵습니다. 그래서 앱의 목표를 다음처럼 바꿨습니다.

- 타겟 기업을 현재 폴더 기준 순서로 보여주기
- 기업 로고, 직무 적합도, 우선순위, 추천 직무 표시
- 공식 채용 사이트와 웹 검색 버튼을 기업 카드마다 제공
- Strategy를 텍스트 문서가 아니라 트랙별 카드로 보여주기
- Official Links 탭에서 모든 채용 링크를 빠르게 열기

공개 URL:

```text
https://twinsben94.github.io/Job_Search/
```

## Repository Map

| Folder | Purpose |
| --- | --- |
| `00_Strategy` | 타겟 기업, 지원 전략, 공식 채용 링크 원문 문서 |
| `01_Target_Companies` | 트랙별 기업 폴더와 기업별 지원 정보 |
| `02_Web_App` | Career Radar 웹 앱 소스 코드와 데이터 |
| `03_Github` | GitHub Pages 산출물, 배포 안내, 저장소 운영 문서 |
| `.github/workflows` | GitHub Actions 워크플로우. GitHub 규칙상 루트에 유지 |

## Local Run

```powershell
cd "C:\Users\twins\OneDrive\바탕 화면\Ryoungseob\결혼 및 취준\02_Career\02_Web_App"
npm start
```

브라우저에서 엽니다.

```text
http://127.0.0.1:4173
```

## Build

```powershell
cd "C:\Users\twins\OneDrive\바탕 화면\Ryoungseob\결혼 및 취준\02_Career\02_Web_App"
npm run build:static
```

정적 배포 산출물:

```text
03_Github/02_pages_site
```
