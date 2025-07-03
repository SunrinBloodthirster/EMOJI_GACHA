import emojiData from './emojiData.json';

export const drawEmoji = () => {
  const rand = Math.random();
  let cumulativeProbability = 0;

  for (const rarity in emojiData.rarityProbabilities) {
    cumulativeProbability += emojiData.rarityProbabilities[rarity];
    if (rand < cumulativeProbability) {
      const emojisOfRarity = emojiData.emojis.filter(e => e.rarity === rarity);
      if (emojisOfRarity.length > 0) {
        const randomEmoji = emojisOfRarity[Math.floor(Math.random() * emojisOfRarity.length)];
        return randomEmoji;
      }
    }
  }
  // Fallback: 만약 모든 확률 계산 후에도 이모지가 선택되지 않은 경우
  // 또는 특정 등급의 이모지 배열이 비어있는 경우를 대비한 폴백
  if (emojiData.emojis.length > 0) {
    const fallbackEmoji = emojiData.emojis[Math.floor(Math.random() * emojiData.emojis.length)];
    return fallbackEmoji;
  }
  return null; // 이모지가 전혀 없는 경우
};
