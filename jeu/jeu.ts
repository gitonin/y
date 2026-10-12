/**
 * Le jeu du cheval des nuages, côté téléphone.
 *
 * Un seul état local — qui je suis, où en est la partie — et une boucle qui
 * demande au serveur, chaque seconde, ce qui a changé. Tout le reste en
 * découle : on ne décide rien ici, on affiche ce que le serveur dit.
 *
 * Le temps de réponse est mesuré entre l'affichage de la question et l'appui,
 * sur ce téléphone, et envoyé tel quel. Mesuré à l'arrivée au serveur, il
 * départagerait les joueurs selon leur opérateur.
 *
 * Le serveur est `jeu/api.php`, voisin de cette page, interrogé une fois par
 * seconde. Rien ici ne fonctionne sans lui — ce qui exclut l'aperçu GitHub
 * Pages, qui ne sert que des fichiers et n'exécute pas de PHP.
 */

type Textes = Record<string, string> & { niveaux: string[] };

interface Joueur {
  id: number;
  nom: string;
  score: number;
}

interface Etat {
  etat: 'salon' | 'question' | 'revelation' | 'fin';
  question: number;
  total: number;
  joueurs: Joueur[];
  reste: number | null;
  enonce?: Record<string, string>;
  reponses?: Record<string, string>[];
  ont_repondu?: number[];
  bonne?: number;
  explication?: Record<string, string>;
  detail?: { joueur: number; choix: number; points: number }[];
}

const TEINTES = ['var(--accent)', 'var(--accent-clair)', 'var(--olive)', 'var(--olive-soft)'];
const PERIODE_MS = 1000;

function lancerJeu(): void {
  const racine = document.querySelector<HTMLElement>('[data-jeu]');
  if (!racine || racine.dataset.lance === '1') return;
  racine.dataset.lance = '1';

  const brut = document.querySelector<HTMLElement>('[data-jeu-textes]')?.textContent;
  if (!brut) return;
  const T: Textes = JSON.parse(brut);
  const API = racine.dataset.api ?? '../api.php';
  const LANGUE = racine.dataset.langue ?? 'fr';

  const $ = <E extends HTMLElement = HTMLElement>(s: string) => racine.querySelector<E>(s);
  const ecrans = [...racine.querySelectorAll<HTMLElement>('[data-ecran]')];
  const montrer = (nom: string) => ecrans.forEach((e) => (e.hidden = e.dataset.ecran !== nom));

  const dire = (texte: string) => {
    const el = $('[data-erreur]');
    if (!el) return;
    el.textContent = texte;
    el.hidden = !texte;
  };

  /* --------------------------------------------------------------- *
   * Ce que ce téléphone sait de lui-même
   * --------------------------------------------------------------- */
  let code = '';
  let jetonHote = '';
  let jeton = '';
  let moi = 0;
  /* L'instant où la question est apparue ici : c'est de lui qu'on compte. */
  let affichee = 0;
  let repondu = -1;
  let derniereQuestion = -1;
  let minuteur: number | undefined;

  const api = async (action: string, corps?: unknown, params?: Record<string, string>) => {
    const url = `${API}?a=${action}${params ? '&' + new URLSearchParams(params) : ''}`;
    const rep = await fetch(url, corps ? { method: 'POST', body: JSON.stringify(corps) } : undefined);
    const data = await rep.json();
    if (!rep.ok) throw new Error(data?.erreur ?? T.erreurReseau);
    return data;
  };

  /* --------------------------------------------------------------- *
   * Affichage
   * --------------------------------------------------------------- */
  const ligneJoueur = (j: Joueur, rang: number, avecScore: boolean) => {
    const li = document.createElement('li');
    li.className = 'jeu__joueur' + (j.id === moi ? ' jeu__joueur--vous' : '');
    const pastille = document.createElement('span');
    pastille.className = 'jeu__pastille';
    pastille.style.setProperty('--teinte', TEINTES[rang % TEINTES.length]);
    const nom = document.createElement('span');
    nom.textContent = j.nom;
    if (j.id === moi) {
      const vous = document.createElement('span');
      vous.className = 'jeu__vous';
      vous.textContent = ` (${T.vous})`;
      nom.appendChild(vous);
    }
    const score = document.createElement('span');
    score.className = 'jeu__score';
    score.textContent = avecScore ? String(j.score) : '';
    li.append(pastille, nom, score);
    return li;
  };

  const remplirListe = (sel: string, joueurs: Joueur[], avecScore: boolean, trier: boolean) => {
    const ul = $(sel);
    if (!ul) return;
    const ordre = trier ? [...joueurs].sort((a, b) => b.score - a.score) : joueurs;
    ul.replaceChildren(
      ...ordre.map((j) => ligneJoueur(j, joueurs.findIndex((x) => x.id === j.id), avecScore)),
    );
  };

  const afficherSalon = (e: Etat) => {
    montrer('salon');
    const estHote = !!jetonHote;
    $('[data-code]')!.textContent = code;
    remplirListe('[data-joueurs]', e.joueurs, false, false);
    const lancer = $<HTMLButtonElement>('[data-lancer]')!;
    lancer.hidden = !estHote;
    lancer.disabled = e.joueurs.length === 0;
    $('[data-attente]')!.hidden = estHote;
    if (estHote && e.joueurs.length === 0) dire(T.attenteJoueurs);
    else dire('');
  };

  const afficherQuestion = (e: Etat) => {
    montrer('question');
    /* Nouvelle question : on remet le compteur du téléphone à zéro. */
    if (e.question !== derniereQuestion) {
      derniereQuestion = e.question;
      repondu = -1;
      affichee = performance.now();
    }

    $('[data-compteur]')!.textContent = T.questionSur
      .replace('{n}', String(e.question + 1))
      .replace('{total}', String(e.total));
    $('[data-enonce]')!.textContent = e.enonce?.[LANGUE] ?? '';

    const reste = Math.max(0, e.reste ?? 0);
    $('[data-chrono]')!.textContent = String(Math.ceil(reste / 1000));
    const jauge = $('[data-jauge]');
    if (jauge) jauge.style.transform = `scaleX(${Math.max(0, reste / 15000)})`;

    const zone = $('[data-reponses]')!;
    if (zone.childElementCount !== (e.reponses?.length ?? 0) || zone.dataset.q !== String(e.question)) {
      zone.dataset.q = String(e.question);
      zone.replaceChildren(
        ...(e.reponses ?? []).map((r, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'jeu__reponse';
          b.textContent = r[LANGUE] ?? '';
          b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', () => void repondre(i));
          return b;
        }),
      );
    }
    [...zone.children].forEach((b, i) => {
      const bouton = b as HTMLButtonElement;
      bouton.disabled = repondu >= 0;
      bouton.setAttribute('aria-pressed', String(repondu === i));
    });

    $('[data-attente-reponses]')!.textContent =
      repondu >= 0
        ? T.attenteReponses
            .replace('{n}', String(e.ont_repondu?.length ?? 0))
            .replace('{total}', String(e.joueurs.length))
        : '';
  };

  const afficherRevelation = (e: Etat) => {
    montrer('revelation');
    const mien = e.detail?.find((d) => d.joueur === moi);
    const juste = mien ? mien.choix === e.bonne : false;

    const verdict = $('[data-verdict]')!;
    verdict.textContent = !mien ? T.aucuneReponse : juste ? T.juste : T.faux;
    verdict.classList.toggle('est-faux', !juste);

    $('[data-enonce-rev]')!.textContent = e.enonce?.[LANGUE] ?? '';
    const bonne = e.reponses?.[e.bonne ?? 0]?.[LANGUE] ?? '';
    const gagnes = mien?.points ?? 0;
    $('[data-bonne]')!.textContent = gagnes > 0 ? `${bonne} — +${gagnes} ${T.points}` : bonne;
    $('[data-explication]')!.textContent = e.explication?.[LANGUE] ?? '';

    remplirListe('[data-classement]', e.joueurs, true, true);

    const suivante = $<HTMLButtonElement>('[data-suivante]')!;
    const dernier = e.question + 1 >= e.total;
    suivante.textContent = dernier ? T.voirResultat : T.suivante;
    suivante.hidden = !jetonHote;
    $('[data-attente-hote]')!.hidden = !!jetonHote;
  };

  const afficherFin = (e: Etat) => {
    montrer('fin');
    const mien = e.joueurs.find((j) => j.id === moi);
    /* Le barème suit la part du score maximal, non le nombre de questions :
       une partie en pose dix, le maximum est donc de dix mille. */
    const part = mien ? mien.score / (e.total * 1000) : 0;
    const seuils = [0.3, 0.6, 0.85];
    const niveau = T.niveaux[seuils.filter((s) => part >= s).length];
    $('[data-niveau]')!.textContent = mien ? niveau : '';
    /* On laisse `remplirListe` trier : la teinte d'un joueur est tirée de sa
       place dans la liste d'origine, pas de son rang. Lui passer une liste
       déjà triée lui ferait changer de couleur entre deux écrans. */
    remplirListe('[data-podium]', e.joueurs, true, true);
    $<HTMLButtonElement>('[data-rejouer]')!.hidden = false;
  };

  /* --------------------------------------------------------------- *
   * Boucle
   * --------------------------------------------------------------- */
  const peindre = (e: Etat) => {
    dire('');
    if (e.etat === 'salon') afficherSalon(e);
    else if (e.etat === 'question') afficherQuestion(e);
    else if (e.etat === 'revelation') afficherRevelation(e);
    else if (e.etat === 'fin') afficherFin(e);
  };

  const battre = async () => {
    if (!code) return;
    try {
      peindre(await api('etat', undefined, { code }));
    } catch (err) {
      dire(err instanceof Error ? err.message : T.erreurReseau);
    }
  };

  const suivre = () => {
    window.clearInterval(minuteur);
    minuteur = window.setInterval(() => void battre(), PERIODE_MS);
    void battre();
  };

  /* --------------------------------------------------------------- *
   * Gestes
   * --------------------------------------------------------------- */
  const repondre = async (choix: number) => {
    if (repondu >= 0) return;
    repondu = choix;
    const ms = Math.round(performance.now() - affichee);
    try {
      await api('repondre', { code, jeton, choix, ms });
    } catch (err) {
      repondu = -1;
      dire(err instanceof Error ? err.message : T.erreurReseau);
    }
    void battre();
  };

  const lienDePartie = () => {
    const u = new URL(window.location.href);
    u.search = `?p=${code}`;
    u.hash = '';
    return u.toString();
  };

  const dessinerQr = async () => {
    const boite = $('[data-qr]');
    const cible = $('[data-qr-image]');
    if (!boite || !cible) return;
    try {
      const { default: QRCode } = await import('qrcode');
      cible.innerHTML = await QRCode.toString(lienDePartie(), {
        type: 'svg',
        margin: 0,
        color: { dark: '#212121', light: '#fbfaf7' },
      });
      boite.hidden = false;
    } catch {
      /* Sans QR, le code et le lien suffisent. */
    }
  };

  /* Celui qui crée la partie y joue aussi : il passe par le même écran de
     prénom que les autres, et ne reçoit le bouton « lancer » qu'ensuite.
     Sans cela il resterait spectateur de sa propre partie. */
  $('[data-creer]')?.addEventListener('click', async () => {
    try {
      const p = await api('creer', {});
      code = p.code;
      jetonHote = p.jeton_hote;
      $('[data-code-rappel]')!.textContent = code;
      montrer('nom');
      racine.querySelector<HTMLInputElement>('#jeu-nom')?.focus();
    } catch (err) {
      dire(err instanceof Error ? err.message : T.erreurReseau);
    }
  });

  $('[data-form-code]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const saisi = new FormData(ev.target as HTMLFormElement).get('code');
    entrerDansLaPartie(String(saisi ?? '').trim().toUpperCase());
  });

  const entrerDansLaPartie = (saisi: string) => {
    if (!/^[A-Z2-9]{4}$/.test(saisi)) return;
    code = saisi;
    $('[data-code-rappel]')!.textContent = code;
    montrer('nom');
    racine.querySelector<HTMLInputElement>('#jeu-nom')?.focus();
  };

  $('[data-form-nom]')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const nom = String(new FormData(ev.target as HTMLFormElement).get('nom') ?? '').trim();
    if (!nom) return;
    try {
      const r = await api('rejoindre', { code, nom });
      jeton = r.jeton;
      moi = r.id;
      /* L'hôte emporte avec lui de quoi inviter : le lien et le QR. */
      if (jetonHote) {
        $<HTMLButtonElement>('[data-copier]')!.hidden = false;
        void dessinerQr();
      }
      suivre();
    } catch (err) {
      dire(err instanceof Error ? err.message : T.erreurReseau);
    }
  });

  $('[data-lancer]')?.addEventListener('click', async () => {
    try {
      await api('demarrer', { code, jeton_hote: jetonHote });
      void battre();
    } catch (err) {
      dire(err instanceof Error ? err.message : T.erreurReseau);
    }
  });

  $('[data-suivante]')?.addEventListener('click', async () => {
    try {
      await api('suivante', { code, jeton_hote: jetonHote });
      void battre();
    } catch (err) {
      dire(err instanceof Error ? err.message : T.erreurReseau);
    }
  });

  $('[data-copier]')?.addEventListener('click', async () => {
    const bouton = $('[data-copier]')!;
    try {
      await navigator.clipboard.writeText(lienDePartie());
      bouton.textContent = T.copie;
      window.setTimeout(() => (bouton.textContent = T.copier), 2000);
    } catch {
      /* Le presse-papiers peut être refusé : le code reste lisible à l'écran. */
    }
  });

  $('[data-rejouer]')?.addEventListener('click', () => {
    window.clearInterval(minuteur);
    window.location.search = '';
  });

  /* Un lien d'invitation porte le code : on saute l'accueil. */
  const invite = new URLSearchParams(window.location.search).get('p');
  if (invite) entrerDansLaPartie(invite.toUpperCase());
}

/* Le jeu est une page à lui seul : rien ne l'appelle, il se lance. Le modèle
   charge ce fichier en module, donc après l'analyse du document — l'écran est
   là, et attendre un évènement de plus ne servirait à rien. */
lancerJeu();
