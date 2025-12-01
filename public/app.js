import { cpf as cpfValidator } from 'https://cdn.jsdelivr.net/npm/cpf-cnpj-validator@1.0.3/dist/cpf-cnpj-validator.es.js';

const form = document.getElementById('volante-form');
const grid = document.getElementById('numbers-grid');
const selectionHint = document.getElementById('selection-hint');
const feedback = document.getElementById('feedback');
const cpfInput = document.getElementById('cpf');

const selectedNumbers = new Set();

// Acessibilidade - Controle de tamanho de fonte
let currentFontSize = 100;
const minFontSize = 75;
const maxFontSize = 150;

function updateFontSize(size) {
  // Clamp to min/max
  let target = Math.max(minFontSize, Math.min(maxFontSize, size));

  // If crossing 100% from below or above, snap to 100% instead of jumping over
  if (currentFontSize < 100 && target > 100) target = 100;
  if (currentFontSize > 100 && target < 100) target = 100;

  currentFontSize = target;
  document.body.style.fontSize = (currentFontSize / 100) * 16 + 'px';
  document.getElementById('font-size-display').textContent = currentFontSize + '%';
  localStorage.setItem('megasena-font-size', currentFontSize);
}

function loadSavedFontSize() {
  const saved = localStorage.getItem('megasena-font-size');
  if (saved) {
    updateFontSize(parseInt(saved));
  }
}

// Acessibilidade - Modo Alto Contraste
function toggleHighContrast() {
  const isActive = document.body.classList.toggle('high-contrast');
  localStorage.setItem('megasena-high-contrast', isActive);
  
  const btn = document.getElementById('high-contrast-toggle');
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

function loadHighContrastPreference() {
  const saved = localStorage.getItem('megasena-high-contrast') === 'true';
  if (saved) {
    document.body.classList.add('high-contrast');
    const btn = document.getElementById('high-contrast-toggle');
    if (btn) {
      btn.classList.add('active');
    }
  }
}

const FONT_STEP = 10;

function attachAccessibilityListeners() {
  if (window._megasenaAccessibilityInitialized) return;
  window._megasenaAccessibilityInitialized = true;

  const decBtn = document.getElementById('decrease-font');
  const incBtn = document.getElementById('increase-font');
  const hcBtn = document.getElementById('high-contrast-toggle');

  decBtn?.addEventListener('click', () => {
    updateFontSize(currentFontSize - FONT_STEP);
  });

  incBtn?.addEventListener('click', () => {
    updateFontSize(currentFontSize + FONT_STEP);
  });

  hcBtn?.addEventListener('click', toggleHighContrast);
}

loadSavedFontSize();
loadHighContrastPreference();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachAccessibilityListeners);
} else {
  attachAccessibilityListeners();
}

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

function showSuccessPopup(message) {
  const popup = document.createElement('div');
  popup.className = 'success-popup';
  popup.textContent = message;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 300);
  }, 3000);
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
        // Se status 403, mostrar mensagem especial
        if (response.status === 403) {
          throw new Error('🚫 O sistema não está aceitando novas sugestões no momento. Por favor, tente novamente mais tarde.');
        }
        throw new Error((data && data.error) || 'Falha ao registrar volante.');
      }
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || 'Falha ao registrar volante.');
      }
      data = { message: text };
    }

    showSuccessPopup('✅ Volante registrado com sucesso!');
    form.reset();
    resetSelection();
  } catch (error) {
    showFeedback(error.message, true);
  } finally {
    form.querySelector('button[type="submit"]').disabled = false;
  }
}

renderGrid();
updateSelectionHint();
form.addEventListener('submit', submitVolante);
cpfInput.addEventListener('input', handleCpfInput);

