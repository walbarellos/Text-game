// 📁 src/ui/dicas.js

/**
 * Ativa o sistema de dicas interativas (tooltips com clique).
 */
export function ativarDicas() {
  document.addEventListener('click', (e) => {
    const alvo = e.target.closest('[data-dica]');
    if (!alvo) return;

    const textoDica = alvo.getAttribute('data-dica');
    if (textoDica) {
      mostrarDicaModal(textoDica);
    }
  });
}

/**
 * Cria e exibe um modal com a dica fornecida.
 * @param {string} texto - Conteúdo da dica.
 */
function mostrarDicaModal(texto) {
  const modal = document.createElement('div');
  modal.className = 'modal-dica';

  modal.innerHTML = `
  <div class="dica-conteudo">
  <p>${texto}</p>
  <button class="fechar-dica" aria-label="Fechar dica">✖</button>
  </div>
  `;

  document.body.appendChild(modal);

  // Fecha ao clicar no botão ou fora da dica
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-dica') || e.target.classList.contains('fechar-dica')) {
      modal.remove();
    }
  });
}
