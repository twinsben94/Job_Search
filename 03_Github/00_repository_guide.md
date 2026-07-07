# GitHub Repository Guide

이 폴더는 GitHub 저장소 운영, GitHub Pages 배포, 공개 웹 앱 산출물을 관리합니다.

## 구조

- `01_deployment_guide.md`: GitHub Pages 설정 및 배포 방식
- `02_pages_site`: GitHub Pages에서 공개되는 정적 앱 산출물

## 루트에 남겨야 하는 파일

- `.github/workflows/pages.yml`
  - GitHub Actions는 워크플로우 파일을 반드시 루트 `.github/workflows`에서만 인식합니다.
- `README.md`
  - GitHub repository 첫 화면에 표시되는 대문 페이지입니다.
- `index.html`
  - 현재 Pages source가 `main/root`일 때 앱 산출물로 이동시키는 리다이렉트 파일입니다.
