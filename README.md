# Peek

웹 페이지에서 요소를 클릭하고 바꿀 내용을 적으면, AI 코딩 에이전트(Claude Code, Cursor, Codex)에 붙여넣을 프롬프트를 만들어 주는 Chrome 확장입니다.

## 사용법

1. `Alt+Shift+P` 또는 툴바의 peek 아이콘으로 켜기
2. 요소 클릭 → 메모 입력 → Enter (여러 개 가능, 번호 핀 표시)
3. 하단 툴바 `전체 복사` → 에이전트에 붙여넣기
4. `Esc`로 메모창 닫기, 한 번 더 `Esc`로 끄기

복사되는 마크다운: 페이지 URL, 화면 크기, 고유 CSS selector, 요소 HTML, React 컴포넌트 이름, 위치, 현재 스타일.

## 구조

- `extension/manifest.json`: MV3, 권한은 `activeTab`·`scripting`만 (아이콘/단축키를 누른 탭에만 주입)
- `extension/background.js`: 아이콘 클릭 시 스크립트 주입 후 토글
- `extension/selector-engine.js`: 코드 검색 단서(테스트 ID, 컴포넌트명 등) 추출
- `extension/prompt.js`: 고유 selector 생성, 요소 설명, 마크다운 빌드
- `extension/content.js` + `content.css`: Shadow DOM 안의 툴바·메모창·핀 UI
- `store/`: 웹스토어 등록 정보(`LISTING.md`), 스크린샷, 프로모션 타일

## 패키징

```bash
npm test
npm run package   # peek-extension.zip 생성 → 웹스토어 대시보드에 업로드
```

## Privacy

peek은 사용자 데이터를 수집하거나 전송하지 않습니다. 메모와 요소 정보는 사용자가 `전체 복사`를 누를 때 클립보드로만 복사됩니다.

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
5. `chrome://extensions/shortcuts`에서 단축키 확인 (다른 확장과 겹치면 직접 지정)
