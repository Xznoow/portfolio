// ===== Langue =====
const LANGUE_BASE = 'fr';
const LANGUES = ['fr', 'en'];
const choixLangue = document.querySelector('.choix-langue');
const boutonsLangue = choixLangue.querySelectorAll('button[data-langue]');
let langueActuelle = LANGUE_BASE;
let traductions = {};

// Mémorise le texte français d'origine, pour pouvoir y revenir
const textesOrigine = new Map();   // élément → texte
const attributsOrigine = new Map(); // élément → { attribut: valeur }

function memoriserTextesOrigine() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    textesOrigine.set(element, element.textContent);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    const valeurs = {};
    element.dataset.i18nAttr.split(';').forEach((paire) => {
      const [attribut] = paire.split(':').map((morceau) => morceau.trim());
      valeurs[attribut] = element.getAttribute(attribut);
    });
    attributsOrigine.set(element, valeurs);
  });
}

memoriserTextesOrigine();

function choisirLangueInitiale() {
  // Choix déjà fait par le visiteur
  const langueEnregistree = localStorage.getItem('langue');
  if (LANGUES.includes(langueEnregistree)) return langueEnregistree;

  // Paramètre dans l'URL (?lang=en)
  const langueUrl = new URLSearchParams(location.search).get('lang');
  if (LANGUES.includes(langueUrl)) return langueUrl;

  // Langue du navigateur
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

async function chargerLangue(lang) {
  // Le français est déjà dans la page : rien à charger
  if (lang === LANGUE_BASE) {
    traductions = {};
    return;
  }

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
  const enFrancais = langueActuelle === LANGUE_BASE;

  // Textes : data-i18n="cle"
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const texte = enFrancais ? textesOrigine.get(element) : traduire(element.dataset.i18n);
    if (texte != null) element.textContent = texte;
  });

  // Attributs : data-i18n-attr="attribut:cle" (plusieurs séparés par ;)
  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    element.dataset.i18nAttr.split(';').forEach((paire) => {
      const [attribut, cle] = paire.split(':').map((morceau) => morceau.trim());
      const texte = enFrancais ? attributsOrigine.get(element)?.[attribut] : traduire(cle);
      if (texte != null) element.setAttribute(attribut, texte);
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

function majHauteurHeader() {
  document.documentElement.style.setProperty('--hauteur-header', `${header.offsetHeight}px`);
}
window.addEventListener('resize', majHauteurHeader);
majHauteurHeader();

liensSommaire.forEach((lien) => {
  lien.addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById(lien.dataset.section).scrollIntoView({ behavior: 'smooth' });
  });
});

function activerLienSommaire(id) {
  liensSommaire.forEach((lien) => {
    const actif = lien.dataset.section === id;
    lien.classList.toggle('actif', actif);
    if (actif) {
      lien.setAttribute('aria-current', 'true');
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
const filtresTechnos = document.querySelector('#filtres-technos');
const messageVide = document.querySelector('#projets-vide');
let projets = [];
let filtreActif = null; // null = tous les projets

// Libellés écrits dans le JS (français) ; l'anglais est dans en.json
const CONTEXTES_FR = { sae: 'SAÉ', perso: 'Personnel', client: 'Client' };
const STATUTS_FR = { termine: 'Terminé', 'en-cours': 'En cours' };

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
  afficherFiltres();
  appliquerFiltre();
  if (modale.open && projetOuvert) remplirModale(projetOuvert);
}

function afficherErreur(liste) {
  const message = document.createElement('li');
  message.textContent = t('projets.erreur', 'Impossible de charger les projets.');
  liste.replaceChildren(message);
}

function libelleContexte(contexte) {
  return t(`projets.contextes.${contexte}`, CONTEXTES_FR[contexte] ?? contexte);
}

function libelleStatut(statut) {
  return t(`projets.statuts.${statut}`, STATUTS_FR[statut] ?? statut);
}

function libelleEquipe(equipe) {
  if (!equipe) return null;
  if (equipe === 1) return t('projets.solo', 'Projet solo');
  return t('projets.equipe', 'Équipe de {n}').replace('{n}', equipe);
}

// Visuel : la capture du projet, ou à défaut une vignette avec une icône
function creerVisuel(projet, classe) {
  const visuel = document.createElement('div');
  visuel.className = classe;

  if (projet.image) {
    const img = document.createElement('img');
    img.src = projet.image;
    img.alt = texteLocalise(projet.titre);
    img.loading = 'lazy';
    visuel.append(img);
  } else {
    visuel.classList.add('visuel-vide');
    const icone = document.createElement('span');
    icone.className = `icone icone--${projet.icone ?? 'serveur'}`;
    icone.setAttribute('aria-hidden', 'true');
    visuel.append(icone);
  }
  return visuel;
}

function creerLiensExternes(projet) {
  const liens = [];

  if (projet.lien) {
    const lien = document.createElement('a');
    lien.href = projet.lien;
    lien.textContent = t('projets.visiter', 'Visiter le projet');
    lien.target = '_blank';
    lien.rel = 'noopener';
    liens.push(lien);
  }

  if (projet.code) {
    const github = document.createElement('a');
    github.href = projet.code;
    github.textContent = t('projets.code', 'Voir le code');
    github.target = '_blank';
    github.rel = 'noopener';
    liens.push(github);
  }
  return liens;
}

function creerPastilles(technos) {
  const liste = document.createElement('ul');
  liste.className = 'pastilles';
  technos.forEach((techno) => {
    const li = document.createElement('li');
    li.textContent = techno;
    liste.append(li);
  });
  return liste;
}

function creerCarte(projet, niveauTitre) {
  const carte = document.createElement('li');
  carte.className = 'carte-projet';
  carte.dataset.technos = projet.technos.join('|');

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
  meta.textContent = `${libelleContexte(projet.contexte)} · ${projet.annee}`;

  const liens = document.createElement('div');
  liens.className = 'liens';

  const details = document.createElement('button');
  details.type = 'button';
  details.className = 'lien-details';
  details.textContent = t('projets.details', 'Voir le détail');
  details.addEventListener('click', () => ouvrirProjet(projet));

  liens.append(details, ...creerLiensExternes(projet));
  piedProjet.append(meta, creerPastilles(projet.technos), liens);
  corps.append(titre, description, piedProjet);
  carte.append(creerVisuel(projet, 'projet-visuel'), corps);

  carte.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return;
    ouvrirProjet(projet);
  });

  return carte;
}

// ===== Filtres par techno =====
function afficherFiltres() {
  // Nombre de projets par techno
  const compte = new Map();
  projets.forEach((projet) => {
    projet.technos.forEach((techno) => compte.set(techno, (compte.get(techno) ?? 0) + 1));
  });
  const technos = [...compte.keys()].sort((a, b) => compte.get(b) - compte.get(a) || a.localeCompare(b));

  if (filtreActif && !compte.has(filtreActif)) filtreActif = null;

  const creerBouton = (valeur, texte, nombre) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'filtre';
    bouton.setAttribute('aria-pressed', valeur === filtreActif);

    const libelle = document.createElement('span');
    libelle.textContent = texte;
    const total = document.createElement('span');
    total.className = 'filtre-nombre';
    total.textContent = nombre;

    bouton.append(libelle, total);
    bouton.addEventListener('click', () => {
      filtreActif = valeur;
      afficherFiltres();
      appliquerFiltre();
    });
    return bouton;
  };

  filtresTechnos.replaceChildren(
    creerBouton(null, t('projets.tous', 'Tous'), projets.length),
    ...technos.map((techno) => creerBouton(techno, techno, compte.get(techno))),
  );
}

function appliquerFiltre() {
  let visibles = 0;
  listeProjets.querySelectorAll('.carte-projet').forEach((carte) => {
    const garde = !filtreActif || carte.dataset.technos.split('|').includes(filtreActif);
    carte.hidden = !garde;
    if (garde) visibles++;
  });
  messageVide.hidden = visibles > 0;
}

// ===== Pop-up de détail =====
const modale = document.querySelector('#modale-projet');
const corpsModale = document.querySelector('#modale-corps');
let projetOuvert = null;

function ajouterSection(parent, titre, contenu) {
  if (!contenu || (Array.isArray(contenu) && !contenu.length)) return;

  const section = document.createElement('section');
  section.className = 'modale-section';
  const h3 = document.createElement('h3');
  h3.textContent = titre;
  section.append(h3);

  if (Array.isArray(contenu)) {
    const liste = document.createElement('ul');
    liste.className = 'modale-liste';
    contenu.forEach((texte) => {
      const li = document.createElement('li');
      li.textContent = texte;
      liste.append(li);
    });
    section.append(liste);
  } else if (contenu instanceof Node) {
    section.append(contenu);
  } else {
    const p = document.createElement('p');
    p.textContent = contenu;
    section.append(p);
  }
  parent.append(section);
}

function remplirModale(projet) {
  const elements = [];

  elements.push(creerVisuel(projet, 'modale-visuel'));

  const entete = document.createElement('div');
  entete.className = 'modale-entete';

  const titre = document.createElement('h2');
  titre.id = 'modale-titre';
  titre.textContent = texteLocalise(projet.titre);

  // Étiquettes
  const meta = document.createElement('ul');
  meta.className = 'modale-meta';
  [
    libelleContexte(projet.contexte),
    projet.annee,
    projet.statut ? libelleStatut(projet.statut) : null,
    libelleEquipe(projet.equipe),
  ].filter(Boolean).forEach((texte, index) => {
    const li = document.createElement('li');
    li.textContent = texte;
    if (index === 0) li.className = 'modale-meta-accent';
    meta.append(li);
  });

  const resume = document.createElement('p');
  resume.className = 'modale-resume';
  resume.textContent = texteLocalise(projet.description);

  entete.append(titre, meta, resume);
  elements.push(entete);

  const sections = document.createElement('div');
  sections.className = 'modale-sections';
  ajouterSection(sections, t('projets.sections.objectif', 'Contexte et objectif'), texteLocalise(projet.objectif));
  ajouterSection(sections, t('projets.sections.role', 'Mon rôle'), texteLocalise(projet.role));
  ajouterSection(sections, t('projets.sections.fonctionnalites', 'Fonctionnalités clés'), texteLocalise(projet.fonctionnalites));
  ajouterSection(sections, t('projets.sections.organisation', 'Organisation'), texteLocalise(projet.organisation));
  ajouterSection(sections, t('projets.sections.technos', 'Technologies'), creerPastilles(projet.technos));
  elements.push(sections);

  const liensExternes = creerLiensExternes(projet);
  if (liensExternes.length) {
    const liens = document.createElement('div');
    liens.className = 'liens modale-liens';
    liens.append(...liensExternes);
    elements.push(liens);
  }

  corpsModale.replaceChildren(...elements);
}

function ouvrirProjet(projet) {
  projetOuvert = projet;
  remplirModale(projet);
  modale.showModal();
  corpsModale.parentElement.scrollTop = 0;
  modale.querySelector('.modale-fermer').focus();
}

modale.querySelector('.modale-fermer').addEventListener('click', () => modale.close());

modale.addEventListener('click', (event) => {
  if (event.target === modale) modale.close();
});

modale.addEventListener('close', () => {
  projetOuvert = null;
});

chargerProjets();

// ===== Compétences et langues =====
// données charger depuis data/competences.json
const listeCompetences = document.querySelector('#liste-competences');
const listeLangues = document.querySelector('#liste-langues');
const legendeNiveaux = document.querySelector('#legende-niveaux');
const NIVEAU_MAX = 6;
const ECHELLE_LANGUES = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, natif: 6 };
const NIVEAUX_LANGUES_FR = {
  natif: 'Langue maternelle',
  A1: 'A1 – Débutant',
  A2: 'A2 – Élémentaire',
  B1: 'B1 – Intermédiaire',
  B2: 'B2 – Intermédiaire avancé',
  C1: 'C1 – Avancé',
  C2: 'C2 – Maîtrise',
};
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

    const libelle = t(`langues.niveaux.${langue.niveau}`, NIVEAUX_LANGUES_FR[langue.niveau] ?? langue.niveau);
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