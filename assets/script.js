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

// ===== Projets =====
async function chargerProjets() {
  const conteneur = document.querySelector('#liste-projets');

  try {
    const reponse = await fetch('data/projets.json');
    if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
    const projets = await reponse.json();

    projets.forEach((projet) => {
      conteneur.appendChild(creerCarte(projet));
    });
  } catch (erreur) {
    // Le message va dans un <li> : un <ul> ne doit contenir que des <li>
    const message = document.createElement('li');
    message.textContent = 'Impossible de charger les projets.';
    conteneur.replaceChildren(message);
    console.error(erreur);
  }
}

function creerCarte(projet) {
  const carte = document.createElement('li');
  carte.className = 'carte-projet';

  // === visuel ===
  const visuel = document.createElement('div');
  visuel.className = 'projet-visuel';

  const img = document.createElement('img');
  img.src = projet.image;
  img.alt = projet.titre;
  img.loading = 'lazy';
  visuel.append(img);

  // === corps ===
  const corps = document.createElement('div');
  corps.className = 'projet-corps';

  const titre = document.createElement('h2');
  titre.className = 'projet-titre';
  titre.textContent = projet.titre;

  const description = document.createElement('p');
  description.className = 'projet-description';
  description.textContent = projet.description;

  // === Pied ===
  const piedProjet = document.createElement('div');
  piedProjet.className = 'pied-projet';

  const meta = document.createElement('span');
  meta.className = 'projet-meta';
  meta.textContent = projet.categorie + " · " + projet.annee;

  const technos = document.createElement('ul');
  technos.className = 'pastilles';
  projet.technos.forEach((techno) => {
    const li = document.createElement('li');
    li.textContent = techno;
    technos.append(li);
  });

  const liens = document.createElement('div');
  liens.className = 'liens';

  if (projet.lien) {
    const lien = document.createElement('a');
    lien.href = projet.lien;
    lien.textContent = "Visiter le projet";
    lien.target = '_blank';
    liens.append(lien);
  }

  if (projet.code) {
    const github = document.createElement('a');
    github.href = projet.code;
    github.textContent = "Voir le code";
    github.target = '_blank';
    liens.append(github);
  }

  piedProjet.append(meta, technos, liens);

  corps.append(titre, description, piedProjet);

  carte.append(visuel, corps);
  return carte;
}

chargerProjets();
