const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildHistoricalFrequency,
  loadRecentDrawFrequencies,
} = require('../lib/lotteryStatistics');
const { generateSuggestedGames } = require('../public/lotterySuggestions');

test('calcula frequência dos concursos oficiais e inclui dezenas sem ocorrência', () => {
  const stats = buildHistoricalFrequency([
    { numero: 101, listaDezenas: ['1', '2', '3', '4', '5', '6'] },
    { numero: 100, listaDezenas: ['1', '2', '7', '8', '9', '10'] },
  ]);

  assert.equal(stats.drawCount, 2);
  assert.equal(stats.firstContest, 100);
  assert.equal(stats.lastContest, 101);
  assert.deepEqual(stats.frequencies.slice(0, 2), [
    { number: 1, count: 2 },
    { number: 2, count: 2 },
  ]);
  assert.equal(stats.frequencies.find(({ number }) => number === 60).count, 0);
});

test('rejeita resultados de concurso incompletos ou inválidos', () => {
  assert.throws(() => buildHistoricalFrequency([]), /histórico de concursos está vazio/);
  assert.throws(
    () => buildHistoricalFrequency([{ numero: 1, listaDezenas: ['1', '2', '3', '4', '5', '5'] }]),
    /dezenas inválidas/,
  );
});

test('carrega e agrega exatamente os 100 concursos mais recentes em lotes limitados', async () => {
  const requestedContests = [];
  const latestDraw = { numero: 200, listaDezenas: ['1', '2', '3', '4', '5', '6'] };
  const stats = await loadRecentDrawFrequencies(async (url) => {
    const contest = Number(url.split('/').pop());
    requestedContests.push(contest);
    return { numero: contest, listaDezenas: ['1', '2', '3', '4', '5', '6'] };
  }, latestDraw);

  assert.equal(requestedContests.length, 99);
  assert.equal(Math.max(...requestedContests), 199);
  assert.equal(Math.min(...requestedContests), 101);
  assert.equal(stats.drawCount, 100);
  assert.equal(stats.firstContest, 101);
  assert.equal(stats.lastContest, 200);
  assert.equal(stats.frequencies.find(({ number }) => number === 1).count, 100);
});

test('gera jogos ponderados com dezenas distintas e sem sequências de quatro números', () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const frequencies = Array.from({ length: 60 }, (_value, index) => ({
    number: index + 1,
    count: (index % 10) + 1,
  }));

  const games = generateSuggestedGames(frequencies, [6, 8, 10], random);

  assert.deepEqual(games.map((game) => game.length), [6, 8, 10]);
  assert.equal(new Set(games.map((game) => game.join(','))).size, 3);
  games.forEach((game) => {
    assert.equal(new Set(game).size, game.length);
    assert.ok(game.every((number) => number >= 1 && number <= 60));
    for (let index = 3; index < game.length; index += 1) {
      assert.notEqual(game[index], game[index - 3] + 3);
    }
  });
});
