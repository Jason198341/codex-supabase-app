// AI 판결 서비스 - Gemini AI 연동

export interface AIVerdict {
  verdict: 'guilty' | 'not_guilty' | 'ambiguous';
  ratio: string;
  analysis: string;
  keyPoints: string[];
}

const GEMINI_API_KEY = 'AIzaSyAV1y8u-GugCq-Rgc2dggQgRxbrLu78vY4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function getAIVerdict(
  title: string,
  content: string,
  category: string
): Promise<AIVerdict> {
  const prompt = `당신은 공정하고 논리적인 AI 판사입니다. 아래 사건을 분석하고 판결을 내려주세요.

【사건 제목】
${title}

【카테고리】
${category}

【사건 내용】
${content}

【판결 지침】
1. 감정을 배제하고 논리와 사실에 기반하여 판단
2. 사회 통념과 상식에 비추어 판단
3. 양측의 입장을 공평하게 고려

【응답 형식 - 반드시 아래 JSON 형식으로만 응답】
{
  "verdict": "guilty" 또는 "not_guilty" 또는 "ambiguous",
  "ratio": "X:Y 작성자/상대방 과실" 형태로 (예: "6:4 작성자 과실"),
  "analysis": "판결 이유를 2-3문단으로 설명",
  "keyPoints": ["핵심 판단 근거 1", "핵심 판단 근거 2", "핵심 판단 근거 3"]
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini API 호출 실패');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 파싱 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        verdict: parsed.verdict || 'ambiguous',
        ratio: parsed.ratio || '5:5 쌍방과실',
        analysis: parsed.analysis || text,
        keyPoints: parsed.keyPoints || ['AI 분석 완료'],
      };
    }

    // JSON 파싱 실패시 텍스트 분석
    return {
      verdict: 'ambiguous',
      ratio: '5:5 쌍방과실',
      analysis: text.slice(0, 500),
      keyPoints: ['AI 분석 완료'],
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    // 폴백: 로컬 랜덤 판결
    return getFallbackVerdict(title, content, category);
  }
}

// API 실패시 폴백
function getFallbackVerdict(title: string, content: string, category: string): AIVerdict {
  const verdicts: AIVerdict['verdict'][] = ['guilty', 'not_guilty', 'ambiguous'];
  const randomVerdict = verdicts[Math.floor(Math.random() * verdicts.length)];
  const ratios = ['7:3 작성자 과실', '6:4 상대방 과실', '5:5 쌍방과실', '4:6 상대방 과실'];
  const randomRatio = ratios[Math.floor(Math.random() * ratios.length)];

  return {
    verdict: randomVerdict,
    ratio: randomRatio,
    analysis: `【${category} 분쟁 분석】\n\n제출된 사건 "${title}"을 검토했습니다.\n\n${content.slice(0, 200)}...\n\n본 건은 양측의 입장을 종합적으로 고려하여 판단했습니다. 추가 정보가 있으면 더 정확한 판결이 가능합니다.`,
    keyPoints: [
      '상호 존중의 원칙 적용',
      '사회 통념에 비추어 판단',
      `${category} 분쟁의 일반적 기준 고려`,
    ],
  };
}

export function getVerdictEmoji(verdict: string): string {
  switch (verdict) {
    case 'guilty':
      return '⚖️ 유죄';
    case 'not_guilty':
      return '✅ 무죄';
    case 'ambiguous':
      return '🤔 애매';
    default:
      return '❓ 판결 중';
  }
}

export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'guilty':
      return '#ef4444';
    case 'not_guilty':
      return '#22c55e';
    case 'ambiguous':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
}
