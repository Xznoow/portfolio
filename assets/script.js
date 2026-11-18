// ===== Langue =====
// Section placée en premier : les autres sections utilisent traduire().
const LANGUES = ['fr', 'en'];
const choixLangue = document.querySelector('.choix-langue');
const boutonsLangue = choixLangue.querySelectorAll('button[data-langue]');
let langueActuelle = 'fr';
let traductions = {};

function choisirLangueInitiale() {
  // 1. Choix déjà fait par le visiteur
  const langueEnregistree = localStorage.getItem('langue');
  if (LANGUES.includes(langueEnregistree)) return langueEnregistree;

  // 2. Paramètre dans l'URL (?lang=en)
  const langueUrl = new URLSearchParams(location.search).get('lang');
  if (LANGUES.includes(langueUrl)) return langueUrl;

  // 3. Langue du navigateur
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

async function chargerLangue(lang) {
  const reponse = await fetch(`data/lang/${lang}.json`);
  if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
  traductions = await reponse.json();
}

// "nav.parcours" → traductions.nav.parcours (null si la clé n'existe pas)
function traduire(cle) {
  let valeur = traductions;

  for (const morceau of cle.split('.')) {
    valeur = valeur?.[morceau];
    if (valeur === undefined) {
      // Pas d'avertissement tant que le fichier de langue n'est pas chargé
      if (Object.keys(traductions).length) console.warn(`Clé de traduction manquante : ${cle}`);
      return null;
    }
  }

  return valeur;
}

// Pour les textes écrits dans le JS : traduction, ou texte français de secours
function t(cle, secours) {
  return traduire(cle) ?? secours;
}

// Pour les champs de projets.json : "texte" ou { "fr": "...", "en": "..." }
function texteLocalise(valeur) {
  if (typeof valeur === 'object' && valeur !== null) {
    return valeur[langueActuelle] ?? valeur.fr;
  }
  return valeur;
}

function appliquerTraductions() {
  // Textes : data-i18n="cle"
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const texte = traduire(element.dataset.i18n);
    if (texte !== null) element.textContent = texte;
  });

  // Attributs : data-i18n-attr="attribut:cle" (plusieurs séparés par ;)
  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    element.dataset.i18nAttr.split(';').forEach((paire) => {
      const [attribut, cle] = paire.split(':').map((morceau) => morceau.trim());
      const texte = traduire(cle);
      if (texte !== null) element.setAttribute(attribut, texte);
    });
  });

  document.documentElement.lang = langueActuelle;

  // Slider FR | EN
  choixLangue.dataset.langue = langueActuelle;
  boutonsLangue.forEach((bouton) => {
    bouton.setAttribute('aria-pressed', bouton.dataset.langue === langueActuelle);
  });

  // Ce qui dépend de la langue mais n'est pas dans le HTML
  majLabelBurger();
  majTitre();
  if (projets.length) afficherProjets();
}

async function changerLangue(lang) {
  try {
    await chargerLangue(lang);
    langueActuelle = lang; // mis à jour seulement si le chargement a réussi
    appliquerTraductions();
  } catch (erreur) {
    console.error(erreur);
  }
  // Active l'animation du slider après le premier affichage
  requestAnimationFrame(() => choixLangue.classList.add('pret'));
}

boutonsLangue.forEach((bouton) => {
  bouton.addEventListener('click', () => {
    const lang = bouton.dataset.langue;
    if (lang === langueActuelle) return;
    localStorage.setItem('langue', lang);
    changerLangue(lang);
  });
});

// ===== Menu burger =====
const header = document.querySelector('header');
const burger = document.querySelector('.burger');
const liensMenu = document.querySelectorAll('nav a');

function majLabelBurger() {
  if (header.classList.contains('ouvert')) {
    burger.setAttribute('aria-label', t('aria.fermerMenu', 'Fermer le menu'));
  } else {
    burger.setAttribute('aria-label', t('aria.ouvrirMenu', 'Ouvrir le menu'));
  }
}

function ouvrirMenu() {
  header.classList.add('ouvert');
  burger.setAttribute('aria-expanded', 'true');
  majLabelBurger();
}

function fermerMenu() {
  header.classList.remove('ouvert');
  burger.setAttribute('aria-expanded', 'false');
  majLabelBurger();
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

function majTitre() {
  const pageActive = document.querySelector('main section.active');
  if (pageActive) {
    document.title = `${pageActive.dataset.title} – Antoine Degeorges`;
  }
}

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

  majTitre();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', afficherPage);
afficherPage();

// ===== Projets =====
const listeProjets = document.querySelector('#liste-projets');   // page Projets : tous
const apercuProjets = document.querySelector('#apercu-projets'); // accueil : les 3 premiers
let projets = [];

async function chargerProjets() {
  try {
    const reponse = await fetch('data/projets.json');
    if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
    projets = await reponse.json();
    afficherProjets();
  } catch (erreur) {
    afficherErreur(listeProjets);
    afficherErreur(apercuProjets);
    console.error(erreur);
  }
}

// Appelée au chargement et à chaque changement de langue
function afficherProjets() {
  listeProjets.replaceChildren(...projets.map((projet) => creerCarte(projet, 'h2')));
  apercuProjets.replaceChildren(...projets.slice(0, 3).map((projet) => creerCarte(projet, 'h3')));
}

function afficherErreur(liste) {
  const message = document.createElement('li');
  message.textContent = t('projets.erreur', 'Impossible de charger les projets.');
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
  img.alt = texteLocalise(projet.titre);
  img.loading = 'lazy';
  visuel.append(img);

  // === corps ===
  const corps = document.createElement('div');
  corps.className = 'projet-corps';

  const titre = document.createElement(niveauTitre);
  titre.className = 'projet-titre';
  titre.textContent = texteLocalise(projet.titre);

  const description = document.createElement('p');
  description.className = 'projet-description';
  description.textContent = texteLocalise(projet.description);

  // === Pied ===
  const piedProjet = document.createElement('div');
  piedProjet.className = 'pied-projet';

  const meta = document.createElement('span');
  meta.className = 'projet-meta';
  meta.textContent = texteLocalise(projet.categorie) + ' · ' + projet.annee;

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
    lien.textContent = t('projets.visiter', 'Visiter le projet');
    lien.target = '_blank';
    lien.rel = 'noopener';
    liens.append(lien);
  }

  if (projet.code) {
    const github = document.createElement('a');
    github.href = projet.code;
    github.textContent = t('projets.code', 'Voir le code');
    github.target = '_blank';
    github.rel = 'noopener';
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

  bouton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(bouton.dataset.copier);
      texte.textContent = t('contact.copie', 'Adresse copiée !');
    } catch {
      texte.textContent = t('contact.copieImpossible', 'Copie impossible');
    }
    setTimeout(() => {
      texte.textContent = t('contact.copier', "Copier l'adresse");
    }, 2000);
  });
});

// ===== Démarrage =====
changerLangue(choisirLangueInitiale());