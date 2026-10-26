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



// ===== Navigation =====
const pages = document.querySelectorAll('main section[data-route]');
const liensNav = document.querySelectorAll('nav a');

function afficherPage() {
  const route = location.hash.slice(1) || '/';
  const pageCible = [...pages].find((page) => page.dataset.route === route) || document.querySelector('section[data-route="/"]');

  pages.forEach((page) => {
    page.classList.toggle('active', page === pageCible);
  });

  liensNav.forEach((lien) => {
    if (lien.getAttribute('href') === '#' + route) {
      lien.setAttribute('aria-current', 'page');
    } else {
      lien.removeAttribute('aria-current');
    }
  });

  document.title = `${pageCible.dataset.title} – Antoine Degeorges`;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', afficherPage);
afficherPage();