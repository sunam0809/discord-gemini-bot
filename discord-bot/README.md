# Discord Gemini Bot 🤖

Gemini AI를 활용한 Discord 챗봇입니다.

## 슬래시 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/대화시작 채널아이디:[ID]` | 봇이 응답할 채널 설정 |
| `/대화중지` | 대화 채널 해제 |
| `/대화초기화` | 대화 기록 초기화 |
| `/상태` | 현재 설정 확인 |

## 환경변수

| 변수 | 설명 |
|------|------|
| `DISCORD_BOT_TOKEN` | Discord Developer Portal에서 발급 |
| `DISCORD_CLIENT_ID` | Discord Developer Portal → General Information → Application ID |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → Get API key |

## Discord 봇 설정

1. [Discord Developer Portal](https://discord.com/developers/applications) 에서 봇 생성
2. Bot 탭 → Token 복사 → `DISCORD_BOT_TOKEN`에 저장
3. General Information → Application ID → `DISCORD_CLIENT_ID`에 저장
4. Bot 탭 → **Message Content Intent** 활성화 ✅
5. OAuth2 → URL Generator → `bot` + `applications.commands` 체크 → 서버 초대

## Render 배포

1. 이 레포를 Render에 연결
2. Environment Variables에 위 3개 변수 입력
3. 자동 배포 완료 ✅
