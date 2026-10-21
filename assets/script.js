// ===== Menu burger =====
const header = document.querySelector('header');
const burger = document.querySelector('.burger');
const liensMenu = document.querySelectorAll('nav a');

function ouvrirMenu() {
  header.classList.add('ouvert');
  burger.setAttribute('aria-expanded', 'true');
  burger.setAttribute('aria-label', 'Fermer le menu');
}

function fermerMenu() {
  header.classList.remove('ouvert');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Ouvrir le menu');
}

// Clic sur le burger : ouvre si fermé, ferme si ouvert
burger.addEventListener('click', () => {
  if (header.classList.contains('ouvert')) {
    fermerMenu();
  } else {
    ouvrirMenu();
  }
});

// Clic sur un lien : on referme le menu pour voir la page
liensMenu.forEach((lien) => {
  lien.addEventListener('click', fermerMenu);
});

// Touche Échap : on referme et on remet le focus sur le burger
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && header.classList.contains('ouvert')) {
    fermerMenu();
    burger.focus();
  }
});

// Si l'écran repasse en grand (rotation du téléphone...), on referme
window.matchMedia('(min-width: 601px)').addEventListener('change', (event) => {
  if (event.matches) {
    fermerMenu();
  }
});
