(function exposeLotterySuggestions(root, factory) {
  const suggestions = factory();
  root.LotterySuggestions = suggestions;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = suggestions;
  }
}(globalThis, function createLotterySuggestions() {
  function hasLongConsecutiveRun(numbers) {
    let consecutive = 1;
    for (let index = 1; index < numbers.length; index += 1) {
      consecutive = numbers[index] === numbers[index - 1] + 1 ? consecutive + 1 : 1;
      if (consecutive >= 4) return true;
    }
    return false;
  }

  function drawWeightedNumbers(frequencies, count, random) {
    const available = frequencies.map(({ number, count: frequency }) => ({
      number,
      weight: frequency + 1,
    }));
    const selected = [];

    while (selected.length < count) {
      const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
      const target = random() * totalWeight;
      let cumulativeWeight = 0;
      const selectedIndex = available.findIndex((item) => {
        cumulativeWeight += item.weight;
        return target < cumulativeWeight;
      });
      const [picked] = available.splice(selectedIndex < 0 ? available.length - 1 : selectedIndex, 1);
      selected.push(picked.number);
    }

    return selected.sort((a, b) => a - b);
  }

  function generateSuggestedGames(frequencies, quantitiesPerGame, random = Math.random) {
    if (
      !Array.isArray(frequencies)
      || frequencies.length !== 60
      || frequencies.some(({ number, count }) => (
        !Number.isInteger(number)
        || number < 1
        || number > 60
        || !Number.isInteger(count)
        || count < 0
      ))
      || new Set(frequencies.map(({ number }) => number)).size !== 60
    ) {
      throw new Error('Frequências históricas inválidas.');
    }

    if (
      !Array.isArray(quantitiesPerGame)
      || quantitiesPerGame.length < 1
      || quantitiesPerGame.length > 20
      || quantitiesPerGame.some((count) => !Number.isInteger(count) || count < 6 || count > 20)
    ) {
      throw new Error('Defina entre 1 e 20 jogos, com 6 a 20 dezenas em cada um.');
    }

    const games = [];
    const seen = new Set();

    quantitiesPerGame.forEach((numberCount) => {
      let game;
      let attempts = 0;
      do {
        game = drawWeightedNumbers(frequencies, numberCount, random);
        attempts += 1;
      } while (
        (hasLongConsecutiveRun(game) || seen.has(game.join(',')))
        && attempts < 1000
      );

      if (hasLongConsecutiveRun(game) || seen.has(game.join(','))) {
        throw new Error('Não foi possível gerar jogos distintos com esses parâmetros.');
      }

      seen.add(game.join(','));
      games.push(game);
    });

    return games;
  }

  return { generateSuggestedGames };
}));
