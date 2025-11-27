import { cpf as cpfValidator } from 'https://cdn.jsdelivr.net/npm/cpf-cnpj-validator@1.0.3/dist/cpf-cnpj-validator.es.js';

const form = document.getElementById('volante-form');
const grid = document.getElementById('numbers-grid');
const selectionHint = document.getElementById('selection-hint');
const feedback = document.getElementById('feedback');
const statsSummary = document.getElementById('stats-summary');
const statsBody = document.getElementById('stats-body');
const cpfInput = document.getElementById('cpf');

const selectedNumbers = new Set();

function renderGrid() {
  for (let n = 1; n <= 60; n += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'number';
    button.textContent = n.toString().padStart(2, '0');
    button.dataset.value = String(n);

    button.addEventListener('click', () => toggleNumber(n, button));
    grid.appendChild(button);
  }
}

function toggleNumber(number, element) {
  if (selectedNumbers.has(number)) {
    selectedNumbers.delete(number);
    element.classList.remove('selected');
  } else {
    if (selectedNumbers.size >= 10) {
      showFeedback('Selecione no máximo 10 números.', true);
      return;
    }
    selectedNumbers.add(number);
    element.classList.add('selected');
  }
  updateSelectionHint();
}

function updateSelectionHint() {
  selectionHint.textContent = `${selectedNumbers.size} números selecionados`;
}

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.className = isError ? 'error' : 'success';
}

function resetSelection() {
  selectedNumbers.clear();
  document.querySelectorAll('.number.selected').forEach((btn) => btn.classList.remove('selected'));
  updateSelectionHint();
}

function sanitizeCpf(value) {
  return value.replace(/\D/g, '');
}

function handleCpfInput() {
  const sanitized = sanitizeCpf(cpfInput.value);
  cpfInput.value = sanitized;

  if (!sanitized.length) {
    cpfInput.setCustomValidity('');
    return;
  }

  if (sanitized.length !== 11) {
    cpfInput.setCustomValidity('CPF deve ter 11 dígitos.');
    return;
  }

  cpfInput.setCustomValidity(
    cpfValidator.isValid(sanitized) ? '' : 'CPF inválido.',
  );
}

async function submitVolante(event) {
  event.preventDefault();

  const name = form.nome.value.trim();
  const cpf = sanitizeCpf(form.cpf.value);
  const numbers = Array.from(selectedNumbers.values()).sort((a, b) => a - b);

  if (!cpfValidator.isValid(cpf)) {
    showFeedback('CPF inválido.', true);
    cpfInput.focus();
    return;
  }

  if (numbers.length < 6 || numbers.length > 10) {
    showFeedback('Selecione entre 6 e 10 números.', true);
    return;
  }

  showFeedback('Enviando...', false);
  form.querySelector('button[type="submit"]').disabled = true;

  try {
    const response = await fetch('/api/volantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cpf, numbers }),
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await response.json();
      if (!response.ok) {
        throw new Error((data && data.error) || 'Falha ao registrar volante.');
      }
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || 'Falha ao registrar volante.');
      }
      data = { message: text };
    }

    showFeedback(data.message || 'Volante registrado!', false);
    form.reset();
    resetSelection();
    await loadStats();
  } catch (error) {
    showFeedback(error.message, true);
  } finally {
    form.querySelector('button[type="submit"]').disabled = false;
  }
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats/top-numbers');
    const contentType = response.headers.get('content-type') || '';

    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'Falha ao carregar estatísticas.');
    }
    const { totalVolantes, topNumbers } = data;

    statsSummary.textContent = totalVolantes
      ? `${totalVolantes} volante(s) registrado(s).`
      : 'Nenhum volante registrado ainda.';

    statsBody.innerHTML = '';
    if (!topNumbers || !topNumbers.length) {
      statsBody.innerHTML = '<tr><td colspan="2">Sem dados suficientes.</td></tr>';
      return;
    }

    topNumbers.forEach(({ number, count }) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${number.toString().padStart(2, '0')}</td><td>${count}</td>`;
      statsBody.appendChild(row);
    });
  } catch (error) {
    statsSummary.textContent = 'Erro ao carregar estatísticas.';
    console.error(error);
  }
}

renderGrid();
updateSelectionHint();
form.addEventListener('submit', submitVolante);
cpfInput.addEventListener('input', handleCpfInput);
loadStats();

