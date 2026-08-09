# Detail Page Layout Generator (커스텀 Figma 플러그인)

무료 클로드(웹) 계정만 있는 학생을 위한 트랙 A 도구. 클로드가 만들어준 JSON 텍스트를 붙여넣으면 Figma 레이아웃이 자동으로 생성된다. Figma MCP나 유료 플랜이 필요 없다 — Figma 무료(Starter) 계정에서도 100% 동작한다.

## 파일 구성
- `manifest.json` — 플러그인 정의
- `code.js` — JSON을 파싱해 실제 Figma 노드(프레임/텍스트/버튼/이미지 영역)를 생성하는 로직
- `ui.html` — JSON 붙여넣기 창
- `sample-input.json` — 테스트용 예시 JSON (탁상용 미니 가습기 상세페이지 2섹션)

## 설치 방법 (학생 1회 설정)
1. Figma **데스크톱 앱**을 연다 (플러그인 개발/임포트는 데스크톱 앱에서만 가능, 웹 브라우저 불가).
2. 메뉴 → Plugins → Development → **"Import plugin from manifest…"**
3. 이 폴더의 `manifest.json`을 선택한다.
4. 아무 Figma 파일이나 열고 Plugins → Development → "Detail Page Layout Generator" 실행.

## 사용 순서
1. 클로드(무료 웹 버전)에게 아래처럼 요청한다.
   > "네이버 스마트스토어 상세페이지용 JSON을 만들어줘. 형식은 이렇게: {sections: [{type: SECTION, name, width, background, children: [{type: TEXT, name, content, fontSize, fontWeight, color, textAlign} | {type: IMAGE_AREA, name, width, height, background, prompt} | {type: BUTTON, name, text, background, color, width, height}]}]}. 상품은 [학생이 정한 상품]이고 2~3개 섹션(Hook, Trust/CTA)으로 만들어줘."
2. 클로드가 준 JSON 텍스트를 통째로 복사한다.
3. 플러그인 창의 텍스트 상자에 붙여넣고 **생성** 클릭.
4. `IMAGE_AREA`는 회색 placeholder 사각형으로 생성된다 — 실제 이미지는 ComfyUI/미드저니/Gemini/GPT 중 하나로 만든 뒤 그 사각형 위에 직접 드래그해서 교체한다 (사각형에 저장된 `prompt`를 이미지 생성 프롬프트로 그대로 재사용).

## 지원하는 JSON 타입
| type | 필수 필드 | 생성 결과 |
|---|---|---|
| `SECTION` | `children` | Auto Layout 세로 프레임, 자식들을 순서대로 쌓음 |
| `TEXT` | `content` | 텍스트 노드 (`fontSize`/`fontWeight`/`color`/`textAlign` 반영) |
| `BUTTON` | `text` | 배경색 프레임 + 텍스트 라벨 조합 |
| `IMAGE_AREA` | `width`, `height` | 회색 placeholder 사각형, `prompt`를 노드 데이터로 보관 |

## 안전 참고
`manifest.json`의 `networkAccess.allowedDomains`가 `"*"`로 열려 있다 — 향후 이미지 URL을 자동으로 fetch해서 삽입하는 기능을 넣을 때를 대비한 것. 특정 이미지 생성 서비스 하나만 쓸 계획이면 해당 도메인으로 좁혀서 배포하는 걸 권장한다.
