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

function parseHistoricalCsv(csv, drawCount = 100) {
  if (typeof csv !== 'string' || !Number.isInteger(drawCount) || drawCount < 1) {
    throw new Error('Parâmetros inválidos para interpretar o histórico de concursos.');
  }

  function parseRow(row) {
    const values = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < row.length; index += 1) {
      if (row[index] === '"') {
        if (quoted && row[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (row[index] === ',' && !quoted) {
        values.push(value);
        value = '';
      } else {
        value += row[index];
      }
    }
    values.push(value);
    return values;
  }

  const rows = csv.split(/\r?\n/).filter((row) => row.trim());
  if (rows.length < drawCount + 1) {
    throw new Error('O arquivo de resultados não contém concursos suficientes.');
  }

  const headers = parseRow(rows[0]).map((header) => header.trim());
  const columnIndexes = ['Concurso', 'Bola1', 'Bola2', 'Bola3', 'Bola4', 'Bola5', 'Bola6']
    .map((header) => headers.indexOf(header));
  if (columnIndexes.some((index) => index < 0)) {
    throw new Error('O arquivo de resultados tem formato inesperado.');
  }

  const draws = rows.slice(-drawCount).map((row) => {
    const values = parseRow(row);
    const numero = Number(values[columnIndexes[0]]);
    const listaDezenas = columnIndexes.slice(1).map((index) => values[index]);
    return { numero, listaDezenas };
  });

  for (let index = 1; index < draws.length; index += 1) {
    if (draws[index].numero !== draws[index - 1].numero + 1) {
      throw new Error('O arquivo de resultados contém lacunas ou concursos fora de ordem.');
    }
  }

  return buildHistoricalFrequency(draws);
}

module.exports = { buildHistoricalFrequency, parseHistoricalCsv };
