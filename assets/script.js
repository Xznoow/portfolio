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

burger.addEventListener('click', () => {
  if (header.classList.contains('ouvert')) {
    fermerMenu();
  } else {
    ouvrirMenu();
  }
});

liensMenu.forEach((lien) => {
  lien.addEventListener('click', fermerMenu);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && header.classList.contains('ouvert')) {
    fermerMenu();
    burger.focus();
  }
});

window.matchMedia('(min-width: 601px)').addEventListener('change', (event) => {
  if (event.matches) {
    fermerMenu();
  }
});

// ===== Bordure du header au défilement =====
function majBordureHeader() {
  header.classList.toggle('defile', window.scrollY > 0);
}

window.addEventListener('scroll', majBordureHeader, { passive: true });
majBordureHeader();

// ===== Navigation =====
const pages = document.querySelectorAll('main section[data-route]');
const liensNav = document.querySelectorAll('nav a, .logo');

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
const listeProjets = document.querySelector('#liste-projets');   // page Projets : tous
const apercuProjets = document.querySelector('#apercu-projets'); // accueil : les 3 premiers

async function chargerProjets() {
  try {
    const reponse = await fetch('data/projets.json');
    if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
    const projets = await reponse.json();

    projets.forEach((projet) => {
      listeProjets.append(creerCarte(projet, 'h2'));
    });

    projets.slice(0, 3).forEach((projet) => {
      apercuProjets.append(creerCarte(projet, 'h3'));
    });
  } catch (erreur) {
    afficherErreur(listeProjets);
    afficherErreur(apercuProjets);
    console.error(erreur);
  }
}

function afficherErreur(liste) {
  const message = document.createElement('li');
  message.textContent = 'Impossible de charger les projets.';
  liste.replaceChildren(message);
}

function creerCarte(projet, niveauTitre) {
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

  const titre = document.createElement(niveauTitre);
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

// ===== Copier l'adresse email =====
document.querySelectorAll('[data-copier]').forEach((bouton) => {
  const texte = bouton.querySelector('.bouton-texte');
  const texteDeBase = texte.textContent;

  bouton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(bouton.dataset.copier);
      texte.textContent = 'Adresse copiée !';
    } catch {
      texte.textContent = 'Copie impossible';
    }
    setTimeout(() => {
      texte.textContent = texteDeBase;
    }, 2000);
  });
});
