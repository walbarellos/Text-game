// src/core/storage.js

const CHAVE_PROGRESO = 'what-is-life-save';

export function salvarProgresso({ diaAtual, eventoAtual, build }) {
  const dados = {
    diaAtual,
    eventoAtual,
    build
  };
  localStorage.setItem(CHAVE_PROGRESO, JSON.stringify(dados));
}

export function carregarProgresso() {
  try {
    const dados = localStorage.getItem(CHAVE_PROGRESO);
    return dados ? JSON.parse(dados) : null;
  } catch (erro) {
    console.warn('⚠️ Erro ao carregar progresso:', erro);
    return null;
  }
}

export function apagarProgresso() {
  localStorage.removeItem(CHAVE_PROGRESO);
}

export function carregarDiaAtual() {
  const progresso = carregarProgresso();
  return progresso;
}

export function avancarDia(estado) {
  estado.diaAtual += 1;
  estado.eventoAtual = null;
  salvarProgresso(estado);
  window.location.reload(); // Simples por enquanto
}
