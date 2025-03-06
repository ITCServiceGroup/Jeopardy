export const formatScore = (score) => {
  return score >= 1000 ? `${score / 1000}gb` : `${score}mb`;
};

export const convertToMB = (score) => {
  if (typeof score !== 'number') return 0;
  return score >= 1000 ? score * 1000 : score;
};

export const convertScoreForDisplay = (score) => {
  if (typeof score !== 'number') return { value: 0, unit: 'mb' };
  return score >= 1000 
    ? { value: score / 1000, unit: 'gb' }
    : { value: score, unit: 'mb' };
};
