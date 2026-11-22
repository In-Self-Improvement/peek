# Peek

웹 페이지에서 요소를 클릭하고 바꿀 내용을 적으면, AI 코딩 에이전트(Claude Code, Cursor, Codex)에 붙여넣을 프롬프트를 만들어 주는 Chrome 확장입니다.

## 사용법

1. `Alt+Shift+P` 또는 툴바의 peek 아이콘으로 켜기
2. 요소 클릭 → 메모 입력 → Enter (여러 개 가능, 번호 핀 표시)
3. 하단 툴바 `전체 복사` → 에이전트에 붙여넣기
4. `Esc`로 메모창 닫기, 한 번 더 `Esc`로 끄기

복사되는 마크다운: 페이지 URL, 화면 크기, 고유 CSS selector, 요소 HTML, React 컴포넌트 이름, 위치, 현재 스타일.

## 구조

- `extension/manifest.json`: MV3, 권한은 `activeTab`·`scripting`·`storage` (아이콘/단축키를 누른 탭에만 주입, 메모는 로컬 저장)
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

Peek은 메모와 복사 히스토리를 Chrome 확장 로컬 저장소에 보관합니다. 외부 서버로 전송하지 않으며, 복사 버튼을 누르면 클립보드에 기록합니다.

개발자 모드에서 로드한 확장의 코드나 권한을 업데이트한 뒤에는 `chrome://extensions`에서 Peek을 다시 로드하고 사용 중인 페이지를 새로고침하세요. 저장소 권한이 적용되기 전에는 메모를 임시로 작성하고 복사할 수 있습니다. 페이지를 새로고침하기 전에 임시 메모를 복사해 두세요.

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
