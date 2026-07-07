# Job Search Dashboard

Ryoungseob의 최신 CV/포트폴리오 기반 타겟 기업 전략과 공식 채용공고 추적 웹 앱입니다.

## Website

GitHub Pages 배포 URL:

```text
https://twinsben94.github.io/Job_Search/
```

배포는 `.github/workflows/pages.yml`에서 관리합니다. `main` 브랜치 push, 수동 실행, 6시간 주기 스케줄마다 공식 채용 링크 스냅샷을 갱신하고 정적 사이트를 배포합니다.

## Local App

`index.html`을 더블클릭하면 브라우저 보안 정책 때문에 JSON 데이터 로딩이 막힐 수 있습니다. 로컬에서는 서버로 실행하세요.

```powershell
cd "C:\Users\twins\OneDrive\바탕 화면\Ryoungseob\결혼 및 취준\02_Career\02_Web_App"
npm start
```

브라우저에서 엽니다.

```text
http://127.0.0.1:4173
```

## Main Folders

- `00_Strategy`: 타겟 기업, 공식 채용 링크, 지원 전략 문서
- `01_Target_Companies`: 트랙별 기업 폴더와 지원 정보
- `02_Web_App`: 웹 앱 소스 코드와 데이터
- `docs`: GitHub Pages 배포용 정적 파일
