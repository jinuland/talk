import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export type AgendaInput = {
  hostName: string;
  guestName: string;
  guestNativeLanguage?: string | null;
  durationMinutes: number;
  themeTitle?: string | null;
  themeBullets?: string | null;
  customTopic?: string | null;
  level?: string | null;
};

const SYSTEM_PROMPT = `당신은 한국어 회화 튜터를 위한 세션 플래너입니다.
주어진 정보를 바탕으로 정확히 한 번의 마크다운 아젠다를 작성합니다.
규칙:
- 한국어로 작성, 학습자 모국어로 짧은 보조 설명을 괄호로 병기.
- 5~7개 섹션. 각 섹션마다 분 단위 시간 배분(합계는 전체 시간과 일치).
- 각 섹션에 (1) 목적, (2) 한국어 핵심 표현 3~5개, (3) 학습자에게 던질 질문 2~3개.
- 마지막 섹션은 "복습 & 숙제".
- "총 ${"{duration}"}분" 헤더로 시작.
- 자기소개 한마디 / 한국 식문화 / 비즈니스 만남 등 자연스러운 흐름.`;

function userPrompt(input: AgendaInput) {
  const lines = [
    `호스트(한국인): ${input.hostName}`,
    `학습자(외국인): ${input.guestName} (${input.guestNativeLanguage ?? "Unknown"})`,
    `세션 길이: ${input.durationMinutes}분`,
    input.themeTitle ? `테마: ${input.themeTitle}` : null,
    input.themeBullets ? `테마 가이드:\n${input.themeBullets}` : null,
    input.customTopic ? `사용자 요청 토픽: ${input.customTopic}` : null,
    input.level ? `난이도: ${input.level}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function generateAgenda(input: AgendaInput): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockAgenda(input);
  }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(input) }],
    });
    const text = resp.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    return text || mockAgenda(input);
  } catch (err) {
    console.warn("[llm] Anthropic call failed, falling back to mock:", err);
    return mockAgenda(input);
  }
}

function mockAgenda(input: AgendaInput): string {
  const topic = input.customTopic ?? input.themeTitle ?? "일상 회화";
  const dur = input.durationMinutes;
  const split = Math.max(5, Math.floor(dur / 5));
  return `# 총 ${dur}분 — ${topic}

> ⚙️ Mock 아젠다 (ANTHROPIC_API_KEY 가 .env 에 설정되면 Claude 가 실제 맞춤형 아젠다를 생성합니다)

## 1. 가벼운 인사 (${split}분)
- 목적: 어색함을 풀고 한국어 모드로 전환
- 핵심 표현:
  - "안녕하세요, 만나서 반갑습니다."
  - "오늘 기분 어떠세요?"
  - "한국어 공부한 지 얼마나 되셨어요?"
- 질문:
  - 이번 주는 어땠어요?
  - 어떤 한국 콘텐츠를 즐겨 봐요?

## 2. ${topic} 도입 (${split}분)
- 목적: 핵심 어휘 워밍업
- 핵심 표현: 상황별 동사 3~5개를 짚어 봅니다
- 질문:
  - ${topic}에 대해 들어본 적 있어요?
  - 본인 나라에서는 어떻게 표현해요?

## 3. 핵심 표현 연습 (${split}분)
- 목적: 자주 쓰는 패턴 반복 연습
- 핵심 표현: "-아/어 보세요", "-(으)ㄴ 적이 있어요", "-는 게 좋아요"
- 질문:
  - 방금 표현으로 본인 경험을 말해 볼래요?

## 4. 롤플레이 (${split}분)
- 목적: 실전 상황 시뮬레이션
- 핵심 표현: 상황 도입어 ("저기요", "혹시", "괜찮으시면")
- 질문: 역할을 바꿔서 다시 해볼까요?

## 5. 자유 대화 (${dur - split * 4 - split}분)
- 목적: 학습자가 자연스럽게 길게 말하기
- 호스트는 듣기 위주, 부드러운 교정만

## 6. 복습 & 숙제
- 오늘 새로 익힌 표현 3개 다시 말해 보기
- 숙제: 표현 3개로 짧은 일기 한 문단 써오기
`;
}
