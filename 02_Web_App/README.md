# Career Job Tracker

타겟 기업의 공식 채용 페이지, 근무지역, 지원 기간 후보, 직무 적합도를 한 화면에서 확인하는 개인 취업 준비 대시보드입니다.

## Local Run

```powershell
cd "C:\Users\twins\OneDrive\바탕 화면\Ryoungseob\결혼 및 취준\02_Career\02_Web_App"
npm start
```

브라우저에서 `http://localhost:4173`을 엽니다.

## Static Build

GitHub Pages 배포용 정적 파일은 루트의 `docs/` 폴더에 생성됩니다.

```powershell
npm run fetch:jobs
npm run build:static
```

## Data

- `data/companies.json`: 타겟 기업 순서, 공식 채용 링크, 적합도, 추천 직무, 키워드
- `public/data/jobs_snapshot.json`: 공식 채용 페이지 조회 결과 스냅샷
- `docs/`: GitHub Pages 배포 산출물

## GitHub Pages

루트의 `.github/workflows/pages.yml`이 `main` 브랜치 push, 수동 실행, 6시간 주기 스케줄에서 실행됩니다.

워크플로우는 공식 채용 링크를 다시 조회하고, 최신 스냅샷을 만든 뒤, `docs/` 정적 사이트를 GitHub Pages에 배포합니다.

예상 공개 URL:

```text
https://twinsben94.github.io/Job_Search/
```
