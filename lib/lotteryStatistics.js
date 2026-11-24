function buildHistoricalFrequency(draws) {
  if (!Array.isArray(draws) || draws.length === 0) {
    throw new Error('O histórico de concursos está vazio.');
  }

  const counts = Array.from({ length: 60 }, (_value, index) => ({
    number: index + 1,
    count: 0,
  }));
  const contestNumbers = [];

  draws.forEach((draw) => {
    if (
      !draw
      || !Number.isInteger(draw.numero)
      || !Array.isArray(draw.listaDezenas)
      || draw.listaDezenas.length !== 6
    ) {
      throw new Error('A API de resultados retornou um concurso inválido.');
    }

    const numbers = draw.listaDezenas.map(Number);
    if (
      numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 60)
      || new Set(numbers).size !== 6
    ) {
      throw new Error('A API de resultados retornou dezenas inválidas.');
    }

    contestNumbers.push(draw.numero);
    numbers.forEach((number) => {
      counts[number - 1].count += 1;
    });
  });

  return {
    drawCount: draws.length,
    firstContest: Math.min(...contestNumbers),
    lastContest: Math.max(...contestNumbers),
    frequencies: counts.sort((a, b) => b.count - a.count || a.number - b.number),
  };
}

async function loadRecentDrawFrequencies(fetchJson, latestDraw, drawCount = 100, concurrency = 5) {
  if (
    typeof fetchJson !== 'function'
    || !Number.isInteger(drawCount)
    || drawCount < 1
    || !Number.isInteger(concurrency)
    || concurrency < 1
    || !latestDraw
    || !Number.isInteger(latestDraw.numero)
  ) {
    throw new Error('Parâmetros inválidos para carregar o histórico de concursos.');
  }

  const contestNumbers = Array.from(
    { length: drawCount - 1 },
    (_value, index) => latestDraw.numero - index - 1,
  );
  const draws = [latestDraw];

  for (let index = 0; index < contestNumbers.length; index += concurrency) {
    const batch = contestNumbers.slice(index, index + concurrency);
    const results = await Promise.all(batch.map(async (contest) => {
      const draw = await fetchJson(`https://api.guidi.dev.br/loteria/megasena/${contest}`);
      if (!draw || draw.numero !== contest) {
        throw new Error(`A API de resultados retornou um concurso inesperado para ${contest}.`);
      }
      return draw;
    }));
    draws.push(...results);
  }

  const stats = buildHistoricalFrequency(draws);
  const expectedFirstContest = latestDraw.numero - drawCount + 1;
  if (
    stats.drawCount !== drawCount
    || stats.firstContest !== expectedFirstContest
    || stats.lastContest !== latestDraw.numero
  ) {
    throw new Error('A API de resultados retornou um histórico incompleto.');
  }

  return stats;
}

module.exports = { buildHistoricalFrequency, loadRecentDrawFrequencies };
