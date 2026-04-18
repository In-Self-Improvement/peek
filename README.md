# Peek

웹 페이지에서 요소를 가리키면 테스트나 디버깅에 쓸 만한 식별자를 빠르게 보여주는 Chrome 확장 실험판입니다.

## 현재 상태

- 확장 기본 토글 동작 구현
- hover 대상 하이라이트
- 복사 가능한 식별자 후보 표시
- 숫자 키 `1`-`5` 빠른 복사

아직 브라우저 스토어 배포용 패키징, 아이콘 세트, 고급 selector 랭킹은 정리되지 않았습니다.

## 개발 서버

```bash
pnpm install
pnpm dev
```

## 프로덕션 빌드

```bash
pnpm lint
pnpm build
```

## 확장 로드 방법

1. Chrome에서 `chrome://extensions` 열기
2. `개발자 모드` 활성화
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. `extension/` 디렉터리 선택

## 디렉터리

- `app/`: 소개용 웹 페이지
- `extension/manifest.json`: Chrome 확장 manifest
- `extension/content.js`: 페이지 내 식별자 추출 UI
- `extension/background.js`: 액션 버튼 토글
