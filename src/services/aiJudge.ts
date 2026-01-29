// AI 판결 서비스
// 실제 서비스에서는 Claude API 또는 OpenAI API 연동

export interface AIVerdict {
  verdict: 'guilty' | 'not_guilty' | 'ambiguous';
  ratio: string; // "6:4 원고 과실"
  analysis: string;
  keyPoints: string[];
}

// 임시 로컬 AI 판결 (데모용)
export async function getAIVerdict(
  title: string,
  content: string,
  category: string
): Promise<AIVerdict> {
  // 실제로는 API 호출
  // const response = await fetch('YOUR_AI_API_ENDPOINT', { ... });

  // 데모용 랜덤 판결
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 딜레이

  const verdicts: AIVerdict['verdict'][] = ['guilty', 'not_guilty', 'ambiguous'];
  const randomVerdict = verdicts[Math.floor(Math.random() * verdicts.length)];

  const ratios = [
    '7:3 작성자 과실',
    '6:4 상대방 과실',
    '5:5 쌍방과실',
    '8:2 작성자 과실',
    '4:6 상대방 과실',
  ];
  const randomRatio = ratios[Math.floor(Math.random() * ratios.length)];

  const analysisTemplates = {
    guilty: `제출된 사건을 검토한 결과, 작성자에게 일부 책임이 있는 것으로 판단됩니다.

【사실관계】
${content.slice(0, 100)}...

【법리적 판단】
본 건은 ${category} 분쟁으로, 상호 간의 신뢰 관계에서 발생한 문제입니다.
작성자의 행위가 사회 통념상 기대되는 수준을 벗어났다고 볼 여지가 있습니다.

【결론】
종합적으로 검토했을 때, ${randomRatio}로 판단됩니다.`,

    not_guilty: `제출된 사건을 검토한 결과, 작성자의 주장에 타당성이 인정됩니다.

【사실관계】
${content.slice(0, 100)}...

【법리적 판단】
본 건은 ${category} 관련 분쟁으로, 작성자의 행위는 합리적인 범위 내에 있습니다.
상대방의 요구가 과도하거나 부당한 측면이 있습니다.

【결론】
종합적으로 검토했을 때, ${randomRatio}로 판단됩니다.`,

    ambiguous: `제출된 사건은 명확한 판단이 어려운 사안입니다.

【사실관계】
${content.slice(0, 100)}...

【법리적 판단】
본 건은 ${category} 관련 분쟁으로, 양측 모두 일정 부분 책임이 있습니다.
추가 정보 없이는 일방의 책임을 단정짓기 어렵습니다.

【결론】
쌍방 간 충분한 대화가 필요한 사안으로, ${randomRatio}입니다.`,
  };

  return {
    verdict: randomVerdict,
    ratio: randomRatio,
    analysis: analysisTemplates[randomVerdict],
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
