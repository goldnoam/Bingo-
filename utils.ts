
export const generateBingoCard = (gridSize: number, maxNumber: number): number[][] => {
  const card: number[][] = [];
  
  // Calculate range per column
  const rangeSize = Math.floor(maxNumber / gridSize);
  
  const columns: number[][] = Array.from({ length: gridSize }, (_, c) => {
    const min = c * rangeSize + 1;
    const max = (c === gridSize - 1) ? maxNumber : (c + 1) * rangeSize;
    
    const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, gridSize);
  });

  // Transpose to rows
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      row.push(columns[c][r]);
    }
    card.push(row);
  }
  
  return card;
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};
