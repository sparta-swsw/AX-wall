# 웹게임파트 AX 담벼락

파트 내 AX 관련 링크를 공유하고, 댓글·좋아요·스티커로 소통하는 내부 게시판입니다.

## 기술 스택

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL, Storage, Realtime)
- **Tailwind CSS**
- **Vercel** 배포
- `jose` · `bcryptjs` · `cheerio` · `@dnd-kit` · `Microlink API`

---

## 주요 기능

### 인증
- **구성원 등록**: 파트 공용 비밀번호로 계정 생성
- **로그인/로그아웃**: 이름 + 비밀번호
- **비밀번호 변경**: 로그인 후 본인 프로필에서 개인 비밀번호로 변경 가능
- **JWT 인증**: httpOnly 쿠키 기반, 30일 유지

### 프로필
- **아바타 이미지**: Supabase Storage에 업로드, 이름 클릭 드롭다운에서 변경
- **카드 색상**: 내 카드 상단 강조선 색상을 OS 기본 색상 피커로 자유롭게 선택

### 담벼락 (링크 카드)
- **링크 등록**: 제목 + URL + 설명(선택) + 사용법 링크(선택)
- **웹페이지 미리보기**: Microlink API로 실제 페이지 스크린샷 자동 생성
- **작성자별 섹션**: 구성원별로 카드 그룹핑, 본인 섹션 항상 최상단
- **섹션 접기/펼치기**: 섹션 헤더 클릭으로 토글
- **드래그앤드롭 정렬**: 본인 카드만 드래그로 순서 변경, DB에 저장
- **카드 수정/삭제**: 상세 모달 우측 상단 `···` 메뉴
- **균일한 카드 크기**: 모든 카드 동일 높이 유지

### 상세 모달
- **웹페이지 스크린샷**: 카드 클릭 시 큰 이미지로 표시
- **설명 및 사용법 링크** 표시
- **좋아요**: 토글 방식, 카운트 표시
- **댓글 + 대댓글**: 댓글에 "답글" 버튼으로 스레드 형식 답글 가능
- **공지 배너**: 작성자가 카드에 공지 설정 시 카드 상단 + 전체 페이지 상단 배너에 동시 표시

### 검색 및 탐색
- **통합 검색**: 헤더 검색창에서 이름·제목 실시간 필터링
- **사이드바 필터**: 좌측 사이드바에서 구성원 이름 클릭으로 해당 구성원 카드만 표시

### 방명록
- 우측 하단 💬 버튼으로 채팅 형식 패널 열기
- **@태그**: 메시지 작성 중 `@` 입력 시 구성원 자동완성 팝업
- 태그된 이름은 파란색 하이라이트로 표시
- 본인 메시지 `···` 메뉴로 삭제 가능

### 이모지 스티커
- 우측 하단 ⭐ 버튼으로 이모지 팔레트(24종) 열기
- 화면 어디든 붙이기 가능, 드래그로 위치 이동
- **Supabase Realtime**: 스티커 추가/이동/삭제가 다른 구성원 화면에 즉시 반영
- 마우스 오버 시 ✕로 삭제 (본인 스티커만)

### 알림
- 헤더 🔔 벨 아이콘, 읽지 않은 수 빨간 배지
- 알림 발생 조건: 내 카드에 좋아요 / 내 카드·댓글에 댓글·대댓글 / 방명록 @태그
- 알림 클릭: 해당 카드 모달 즉시 오픈 (태그 알림은 방명록 패널 오픈)
- 개별 삭제 및 전체 읽음 처리

---

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local
# .env.local에 Supabase 환경변수 입력
npm run dev
```

## 환경변수

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## Supabase 설정

- **Storage**: `avatars` 버킷 생성 (Public)
- **Realtime**: stickers 테이블 활성화
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE stickers;
  ```
- **스키마**: `schema.sql` 파일 전체를 SQL Editor에서 실행

## DB 테이블

| 테이블 | 설명 |
|---|---|
| `members` | 구성원 (avatar_url, color 포함) |
| `links` | 링크 카드 (notice, sort_order, memo, usage_url 포함) |
| `comments` | 댓글 + 대댓글 (parent_id 포함) |
| `likes` | 좋아요 |
| `guestbook` | 방명록 메시지 |
| `stickers` | 이모지 스티커 (x, y 위치) |
| `notifications` | 알림 |
