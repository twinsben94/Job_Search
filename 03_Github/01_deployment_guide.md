# GitHub Pages Deployment Guide

## 공개 URL

```text
https://twinsben94.github.io/Job_Search/
```

## 앱 목표

현재 앱은 실시간 크롤러가 아니라 공식 채용 링크를 빠르게 여는 수동 확인 허브입니다.

정적 GitHub Pages에는 백엔드 서버가 없고, 대부분의 채용 사이트는 JavaScript 렌더링, 검색 UI, 로그인, CORS 제한을 사용합니다. 따라서 공개 웹 앱에서 접속 즉시 공식 사이트를 안정적으로 자동 크롤링하는 방식은 유지보수성이 낮습니다.

대신 앱은 다음을 제공합니다.

- 타겟 기업 우선순위
- 기업 로고/트랙/직무 적합도
- 공식 채용 사이트 버튼
- 웹 검색 버튼
- 지원 전략 카드
- 공식 채용 링크 목록

## Pages Source

권장 설정:

- Source: `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/root`
- Custom domain: 비워둠

현재 `main/root`로 설정되어 있어도 루트 `index.html`이 `03_Github/02_pages_site`로 이동시킵니다.

## Build

```powershell
cd "C:\Users\twins\OneDrive\바탕 화면\Ryoungseob\결혼 및 취준\02_Career\02_Web_App"
npm run build:static
```

빌드 결과는 다음 폴더에 생성됩니다.

```text
03_Github/02_pages_site
```
