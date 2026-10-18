# Chrome Web Store 등록 정보

대시보드(https://chrome.google.com/webstore/devconsole)에 그대로 붙여넣는다.

## 패키지

- 파일: `peek-extension.zip` (`npm run package`로 생성)
- 버전: `extension/manifest.json`의 `version`. 다시 올릴 때마다 올려야 한다.

## 스토어 등록정보

- 이름: peek — click UI, prompt your AI (manifest에서 읽음)
- 요약 (132자 이내, manifest `description`에서 읽음):
  Click any element on a web page, write what to change, and copy a precise prompt for Claude Code, Cursor or Codex.
- 카테고리: 개발자 도구 (Developer Tools)
- 언어: 영어 (한국어 설명은 아래를 추가 언어로)
- 아이콘: `extension/icons/icon-128.png`
- 스크린샷 (1280×800): `store/screenshot-1-note.png`, `store/screenshot-2-copy.png`
- 작은 프로모션 타일 (440×280): `store/promo-tile-440x280.png`

### 설명 (English)

Tell your AI coding agent exactly which part of the UI to change.

1. Press Alt+Shift+P (or click the peek icon) on any page.
2. Click an element and write what should change — "make this button bigger", "center this title".
3. Add as many notes as you like. Each one gets a numbered pin.
4. Click "Copy all" and paste into Claude Code, Cursor, Codex or any chat.

Each note is copied as structured markdown: page URL, viewport, a unique CSS selector, the element's HTML, React component name (when available), position and current styles. Your agent finds the right code without guessing.

- Works on any site — localhost, staging or production. Nothing to install in your project.
- Runs only when you turn it on, only on the current tab.
- No account, no tracking. Nothing leaves your browser; notes go to your clipboard only.

### 설명 (한국어)

AI 코딩 에이전트에게 "화면의 어디를 어떻게" 고칠지 정확히 전달하세요.

1. 아무 페이지에서 Alt+Shift+P (또는 peek 아이콘)를 누르세요.
2. 요소를 클릭하고 바꿀 내용을 적으세요. 예: "이 버튼 더 크게", "제목 가운데 정렬"
3. 메모는 여러 개 남길 수 있고, 각각 번호 핀이 붙어요.
4. "전체 복사"를 눌러 Claude Code, Cursor, Codex에 붙여넣으세요.

메모마다 페이지 주소, 화면 크기, 고유 CSS selector, 요소 HTML, React 컴포넌트 이름(있을 때), 위치, 현재 스타일이 마크다운으로 함께 복사돼요.

- 로컬, 스테이징, 운영 사이트 어디서나 동작해요. 프로젝트에 설치할 것이 없어요.
- 켰을 때만, 지금 보고 있는 탭에서만 동작해요.
- 계정·추적 없음. 메모는 클립보드로만 가고 어디로도 전송되지 않아요.

## 개인정보 보호 탭

- 단일 목적: Lets users click elements on the current page, attach change notes, and copy them as a structured prompt for AI coding tools.
- 권한 사유
  - `activeTab`: Access the current tab only after the user clicks the extension icon or presses the shortcut, to let them pick elements on that page.
  - `scripting`: Inject the element picker into the current tab when the user turns peek on.
- 원격 코드 사용: 아니요 (모든 코드는 패키지에 포함)
- 데이터 사용: 수집하는 사용자 데이터 없음. 모든 항목 체크 해제.
- 데이터 사용 인증 3개 항목 체크 (판매하지 않음 / 목적 외 사용 안 함 / 신용 평가에 사용 안 함)
- 개인정보처리방침 URL: 사용자 데이터를 수집·전송하지 않으므로 비워둔다. 대시보드가 요구하면 README의 Privacy 절을 공개 URL로 올린다.

## 배포 설정

- 공개 범위: 처음엔 **비공개(Unlisted)** 추천 — 링크를 아는 사람만 설치. 반응을 본 뒤 공개로 전환.
- 지역: 모든 지역
