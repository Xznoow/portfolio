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
  if (competences) afficherCompetences();
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
const liensMenu = document.querySelectorAll('header nav a');

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
const liensNav = document.querySelectorAll('header nav a, .logo');

function majTitre() {
  const pageActive = document.querySelector('main section.active');
  if (pageActive) {
    document.title = `${pageActive.dataset.title} – Antoine Degeorges`;
  }
}

// Anciennes adresses redirigées vers les nouvelles
const ANCIENNES_ROUTES = { '/parcours': '/a-propos' };

function afficherPage() {
  let route = location.hash.slice(1) || '/';
  if (ANCIENNES_ROUTES[route]) {
    route = ANCIENNES_ROUTES[route];
    history.replaceState(null, '', '#' + route);
  }
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

// ===== Sommaire de la page À propos =====
const sommaire = document.querySelector('.sommaire');
const liensSommaire = sommaire.querySelectorAll('a[data-section]');

// Hauteur du header en variable CSS : sert à coller le sommaire juste dessous
function majHauteurHeader() {
  document.documentElement.style.setProperty('--hauteur-header', `${header.offsetHeight}px`);
}
window.addEventListener('resize', majHauteurHeader);
majHauteurHeader();

// Clic : défilement vers la section (les ancres classiques casseraient le routeur par hash)
liensSommaire.forEach((lien) => {
  lien.addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById(lien.dataset.section).scrollIntoView({ behavior: 'smooth' });
  });
});

// Met en évidence la section en cours de lecture
function activerLienSommaire(id) {
  liensSommaire.forEach((lien) => {
    const actif = lien.dataset.section === id;
    lien.classList.toggle('actif', actif);
    if (actif) {
      lien.setAttribute('aria-current', 'true');
      // Sur mobile, le sommaire défile horizontalement : on garde le lien actif visible
      const liste = sommaire.querySelector('ul');
      liste.scrollTo({ left: lien.offsetLeft - 16, behavior: 'smooth' });
    } else {
      lien.removeAttribute('aria-current');
    }
  });
}

const observateurSections = new IntersectionObserver((entrees) => {
  entrees.forEach((entree) => {
    if (entree.isIntersecting) activerLienSommaire(entree.target.id);
  });
}, { rootMargin: '-35% 0px -60% 0px' });

document.querySelectorAll('.sommaire-cible').forEach((section) => observateurSections.observe(section));

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

// ===== Compétences et langues =====
// Les données sont dans data/competences.json : pour ajouter une compétence
// ou changer un niveau, il suffit de modifier ce fichier.
const listeCompetences = document.querySelector('#liste-competences');
const listeLangues = document.querySelector('#liste-langues');
const legendeNiveaux = document.querySelector('#legende-niveaux');
const NIVEAU_MAX = 6;
const ECHELLE_LANGUES = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, natif: 6 };
let competences = null;

async function chargerCompetences() {
  try {
    const reponse = await fetch('data/competences.json');
    if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
    competences = await reponse.json();
    afficherCompetences();
  } catch (erreur) {
    console.error(erreur);
  }
}

// Jauge en segments : creerJauge(3, 6, 'Intermédiaire') → ■■■□□□
function creerJauge(valeur, max, libelle) {
  const jauge = document.createElement('span');
  jauge.className = 'jauge';
  jauge.setAttribute('role', 'img');
  jauge.setAttribute('aria-label', libelle);
  jauge.title = libelle;

  for (let i = 1; i <= max; i++) {
    const segment = document.createElement('span');
    segment.className = i <= valeur ? 'jauge-segment jauge-segment--plein' : 'jauge-segment';
    jauge.append(segment);
  }
  return jauge;
}

function libelleNiveau(niveau) {
  const secours = ['', 'Débutant', 'Notions', 'Intermédiaire', 'Confirmé', 'Avancé', 'Expert'];
  return t(`competences.niveaux.${niveau}`, secours[niveau]);
}

function afficherCompetences() {
  // Légende : 1 Débutant · 2 Notions · … · 6 Expert
  const elementsLegende = [];
  for (let niveau = 1; niveau <= NIVEAU_MAX; niveau++) {
    const item = document.createElement('span');
    item.className = 'legende-item';
    const numero = document.createElement('span');
    numero.className = 'legende-numero';
    numero.textContent = niveau;
    const texte = document.createElement('span');
    texte.textContent = libelleNiveau(niveau);
    item.append(numero, texte);
    elementsLegende.push(item);
  }
  legendeNiveaux.replaceChildren(...elementsLegende);

  // Une carte par catégorie
  listeCompetences.replaceChildren(...competences.techniques.map((groupe) => {
    const carte = document.createElement('li');
    carte.className = 'carte carte-competences';

    const titre = document.createElement('h3');
    titre.textContent = texteLocalise(groupe.categorie);

    const liste = document.createElement('ul');
    liste.className = 'liste-niveaux';
    groupe.items.forEach((item) => {
      const ligne = document.createElement('li');
      const nom = document.createElement('span');
      nom.textContent = texteLocalise(item.nom);
      ligne.append(nom, creerJauge(item.niveau, NIVEAU_MAX, libelleNiveau(item.niveau)));
      liste.append(ligne);
    });

    carte.append(titre, liste);
    return carte;
  }));

  // Une carte par langue
  listeLangues.replaceChildren(...competences.langues.map((langue) => {
    const carte = document.createElement('li');
    carte.className = 'carte carte-langue';

    const titre = document.createElement('h3');
    titre.textContent = texteLocalise(langue.nom);

    const libelle = t(`langues.niveaux.${langue.niveau}`, langue.niveau);
    const niveau = document.createElement('p');
    niveau.className = 'carte-sous-titre';
    niveau.textContent = libelle;

    carte.append(titre, niveau, creerJauge(ECHELLE_LANGUES[langue.niveau] ?? 0, 6, libelle));
    return carte;
  }));
}

chargerCompetences();

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