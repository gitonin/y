/**
 * « Ne renversez pas » — le petit jeu d'équilibre de la v5.
 *
 * Trois entrées possibles, dans cet ordre de préférence :
 *   1. le gyroscope du téléphone, qui donne l'inclinaison réelle de l'appareil ;
 *   2. le doigt, sur un écran tactile sans capteur ;
 *   3. la souris, sur un ordinateur.
 * Aucune n'est indispensable : le jeu se joue dans les trois cas.
 *
 * La caméra, elle, n'est qu'un décor. Son flux est peint dans la page et
 * n'en sort jamais : rien n'est enregistré, rien n'est envoyé nulle part.
 * C'est la raison pour laquelle elle est facultative, et demandée franchement.
 */

export type Libelles = {
  score: string;
  best: string;
  spilled: string;
  again: string;
  howto: string;
  seconds: string;
  level: string;
  noCamera: string;
  noMotion: string;
};

type Etat = 'attente' | 'jeu' | 'renverse';

/* ----------------------------------------------------------------- réglages */

/** Le café penche d'autant plus vite que la tasse est pleine. */
const RAIDEUR = 0.055;
const AMORTISSEMENT = 0.14;
/** Ce que la tasse gagne en remplissage par seconde tenue : c'est de là que
    vient la difficulté, pas d'une main plus sévère au fil du temps. */
const MONTEE = 0.017;
/** Part du café perdue par seconde quand il déborde. */
const FUITE = 0.28;
/** Vitesse à laquelle la main suit la consigne : jamais d'à-coup. */
const SUIVI = 0.16;

/** L'angle que la tasse supporte, d'autant plus faible qu'elle est pleine.
    La pente reste douce : une tasse qui se vide pardonne un peu plus, mais
    jamais au point qu'un grand écart finisse par s'équilibrer tout seul. */
const tolerance = (remplissage: number) => 10 + 16 * (1 - remplissage);

const borne = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ------------------------------------------------------------------- gouttes */

type Goutte = { x: number; y: number; vx: number; vy: number; r: number; vie: number };

export function demarrerExperience(racine: HTMLElement, libelles: Libelles) {
  const toile = racine.querySelector<HTMLCanvasElement>('[data-toile]')!;
  const video = racine.querySelector<HTMLVideoElement>('[data-video]')!;
  const chrono = racine.querySelector<HTMLElement>('[data-chrono]')!;
  const record = racine.querySelector<HTMLElement>('[data-record]')!;
  const jauge = racine.querySelector<HTMLElement>('[data-jauge]')!;
  const consigne = racine.querySelector<HTMLElement>('[data-consigne]')!;
  const boutonDebut = racine.querySelector<HTMLButtonElement>('[data-debut]')!;
  const panneau = racine.querySelector<HTMLElement>('[data-panneau]')!;
  const fin = racine.querySelector<HTMLElement>('[data-fin]')!;
  const ctx = toile.getContext('2d')!;

  let etat: Etat = 'attente';
  let flux: MediaStream | null = null;

  /* Inclinaison demandée par le joueur, et celle que la tasse a réellement
     prise : la seconde rejoint la première en douceur, pour qu'un geste vif
     ne se traduise pas par un saut. */
  let inclinaisonCible = 0;
  let inclinaison = 0;
  /* Inclinaison du café dans la tasse : elle suit, avec du retard. */
  let surface = 0;
  let vitesseSurface = 0;
  let remplissage = 0.62;
  let debut = 0;
  let tenue = 0;
  let meilleur = 0;
  let gouttes: Goutte[] = [];
  let boucle = 0;
  let dernier = 0;

  try {
    meilleur = Number(localStorage.getItem('yunma-experience-record') ?? 0) || 0;
  } catch {
    meilleur = 0;
  }
  majRecord();

  /* --------------------------------------------------------------- entrées */

  const surInclinaison = (e: DeviceOrientationEvent) => {
    /* `gamma` est le roulis gauche-droite, en degrés. Sur un téléphone tenu
       en portrait, c'est exactement le geste de pencher la main. */
    if (e.gamma === null) return;
    inclinaisonCible = borne(e.gamma, -60, 60);
  };

  const surPointeur = (e: PointerEvent) => {
    const milieu = window.innerWidth / 2;
    inclinaisonCible = borne(((e.clientX - milieu) / milieu) * 45, -60, 60);
  };

  let capteurActif = false;

  async function brancherCapteur(): Promise<boolean> {
    const D = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
      | undefined;
    if (!D) return false;
    /* iOS ne livre l'orientation qu'après un accord explicite, et seulement si
       la demande part d'un geste de l'utilisateur — d'où le bouton. */
    if (typeof D.requestPermission === 'function') {
      try {
        if ((await D.requestPermission()) !== 'granted') return false;
      } catch {
        return false;
      }
    }
    return new Promise<boolean>((resolve) => {
      let recu = false;
      const sonde = (e: DeviceOrientationEvent) => {
        if (e.gamma === null) return;
        recu = true;
        window.removeEventListener('deviceorientation', sonde);
        window.addEventListener('deviceorientation', surInclinaison);
        resolve(true);
      };
      window.addEventListener('deviceorientation', sonde);
      /* Un capteur annoncé mais muet existe : on ne l'attend pas indéfiniment. */
      setTimeout(() => {
        if (recu) return;
        window.removeEventListener('deviceorientation', sonde);
        resolve(false);
      }, 700);
    });
  }

  async function brancherCamera(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      video.srcObject = flux;
      await video.play();
      racine.classList.add('is-camera');
      return true;
    } catch {
      return false;
    }
  }

  /* ---------------------------------------------------------------- dessin */

  function dimensionner() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const l = racine.clientWidth;
    const h = racine.clientHeight;
    toile.width = Math.round(l * dpr);
    toile.height = Math.round(h * dpr);
    toile.style.width = `${l}px`;
    toile.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function dessinerTasse(l: number, h: number) {
    const taille = Math.min(l * 0.62, h * 0.42);
    const demiL = taille / 2;
    const hauteur = taille * 0.78;
    const cx = l / 2;
    const cy = h * 0.62;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((inclinaison * Math.PI) / 180);

    /* --- l'ombre portée, qui ancre la tasse dans l'image --- */
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.filter = 'blur(12px)';
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(0, hauteur / 2 + 10, demiL * 0.95, taille * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* --- l'anse ---
       Elle est tracée avant le corps, qui viendra recouvrir sa naissance :
       c'est ce qui la fait tenir à la tasse au lieu de flotter à côté. */
    ctx.strokeStyle = 'rgba(248, 245, 239, 0.95)';
    ctx.lineWidth = taille * 0.05;
    ctx.beginPath();
    ctx.arc(demiL * 0.82, -hauteur * 0.08, taille * 0.16, -Math.PI / 2.1, Math.PI / 2.1);
    ctx.stroke();

    /* --- le corps, un tronc de cône adouci --- */
    const hautL = demiL;
    const basL = demiL * 0.74;
    const haut = -hauteur / 2;
    const bas = hauteur / 2;

    const corps = new Path2D();
    corps.moveTo(-hautL, haut);
    corps.lineTo(hautL, haut);
    corps.quadraticCurveTo(basL * 1.1, bas * 0.72, basL, bas - taille * 0.06);
    corps.quadraticCurveTo(basL, bas, basL - taille * 0.06, bas);
    corps.lineTo(-basL + taille * 0.06, bas);
    corps.quadraticCurveTo(-basL, bas, -basL, bas - taille * 0.06);
    corps.quadraticCurveTo(-basL * 1.1, bas * 0.72, -hautL, haut);
    corps.closePath();

    const porcelaine = ctx.createLinearGradient(-hautL, 0, hautL, 0);
    porcelaine.addColorStop(0, '#e6e2d8');
    porcelaine.addColorStop(0.35, '#fbfaf6');
    porcelaine.addColorStop(1, '#ddd8cd');
    ctx.fillStyle = porcelaine;
    ctx.fill(corps);

    /* --- le café, dont la surface reste horizontale dans le monde réel --- */
    ctx.save();
    ctx.clip(corps);
    const niveau = haut + hauteur * (1 - remplissage);
    const pente = Math.tan((surface * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-hautL * 1.4, niveau + pente * -hautL * 1.4);
    ctx.lineTo(hautL * 1.4, niveau + pente * hautL * 1.4);
    ctx.lineTo(hautL * 1.4, bas + hauteur);
    ctx.lineTo(-hautL * 1.4, bas + hauteur);
    ctx.closePath();
    const cafe = ctx.createLinearGradient(0, niveau, 0, bas);
    cafe.addColorStop(0, '#5b3a22');
    cafe.addColorStop(1, '#2e1c10');
    ctx.fillStyle = cafe;
    ctx.fill();

    /* la crème, une fine bande claire sur la surface */
    ctx.save();
    ctx.translate(0, niveau);
    ctx.rotate(Math.atan(pente));
    ctx.fillStyle = 'rgba(206, 160, 106, 0.55)';
    ctx.fillRect(-hautL * 1.4, 0, hautL * 2.8, taille * 0.022);
    ctx.restore();
    ctx.restore();

    /* --- l'épaisseur de la lèvre, par-dessus le café --- */
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = taille * 0.028;
    ctx.beginPath();
    ctx.moveTo(-hautL, haut);
    ctx.lineTo(hautL, haut);
    ctx.stroke();

    ctx.restore();
    return { cx, cy, demiL, hauteur, taille };
  }

  function dessinerGouttes() {
    for (const g of gouttes) {
      ctx.globalAlpha = borne(g.vie, 0, 1);
      ctx.fillStyle = '#3b2415';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, g.r * 0.7, g.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ----------------------------------------------------------------- moteur */

  function pas(t: number) {
    boucle = requestAnimationFrame(pas);
    const dt = Math.min((t - dernier) / 1000, 0.05) || 0;
    dernier = t;

    const l = racine.clientWidth;
    const h = racine.clientHeight;
    ctx.clearRect(0, 0, l, h);

    if (etat === 'jeu') {
      inclinaison += (inclinaisonCible - inclinaison) * SUIVI;

      /* Le café cherche l'horizontale : dans le repère de la tasse, cela veut
         dire l'inverse de l'inclinaison. Le ressort lui donne son ballant. */
      const cible = -inclinaison;
      vitesseSurface += (cible - surface) * RAIDEUR - vitesseSurface * AMORTISSEMENT;
      surface += vitesseSurface;

      /* Plus la tasse est pleine, moins elle pardonne. */
      const exces = Math.abs(surface) - tolerance(remplissage);

      if (exces > 0) {
        remplissage -= FUITE * dt * Math.min(exces / 12, 1.6);
        const cote = surface > 0 ? 1 : -1;
        if (Math.random() < 0.6) {
          const taille = Math.min(l * 0.62, h * 0.42);
          gouttes.push({
            x: l / 2 + cote * taille * 0.45,
            y: h * 0.62 - taille * 0.3,
            vx: cote * (40 + Math.random() * 90),
            vy: -30 + Math.random() * 40,
            r: 3 + Math.random() * 5,
            vie: 1,
          });
        }
        if (remplissage <= 0.12) terminer();
      } else {
        remplissage = Math.min(remplissage + MONTEE * dt, 0.93);
      }

      tenue = (performance.now() - debut) / 1000;
      chrono.textContent = tenue.toFixed(1);
      jauge.style.setProperty('--part', String(borne(remplissage, 0, 1)));
    }

    for (const g of gouttes) {
      g.vy += 900 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vie -= dt * 0.7;
    }
    gouttes = gouttes.filter((g) => g.vie > 0 && g.y < h + 40);

    dessinerTasse(l, h);
    dessinerGouttes();
  }

  function terminer() {
    etat = 'renverse';
    if (tenue > meilleur) {
      meilleur = tenue;
      try {
        localStorage.setItem('yunma-experience-record', String(meilleur));
      } catch {
        /* Le refus du stockage local n'empêche pas de jouer. */
      }
    }
    majRecord();
    fin.querySelector('[data-fin-score]')!.textContent = `${tenue.toFixed(1)} ${libelles.seconds}`;
    fin.hidden = false;
    racine.classList.add('is-fini');
  }

  function majRecord() {
    record.textContent = meilleur > 0 ? `${meilleur.toFixed(1)} ${libelles.seconds}` : '—';
  }

  function relancer() {
    remplissage = 0.62;
    surface = 0;
    vitesseSurface = 0;
    inclinaison = 0;
    inclinaisonCible = 0;
    gouttes = [];
    tenue = 0;
    debut = performance.now();
    etat = 'jeu';
    fin.hidden = true;
    racine.classList.remove('is-fini');
  }

  /* ---------------------------------------------------------------- départ */

  async function commencer() {
    boutonDebut.disabled = true;
    const [camera, capteur] = await Promise.all([brancherCamera(), brancherCapteur()]);
    capteurActif = capteur;
    if (!capteurActif) {
      window.addEventListener('pointermove', surPointeur);
      window.addEventListener('pointerdown', surPointeur);
    }

    const avis: string[] = [libelles.howto];
    if (!camera) avis.push(libelles.noCamera);
    if (!capteurActif) avis.push(libelles.noMotion);
    consigne.textContent = avis.join(' ');

    panneau.hidden = true;
    racine.classList.add('is-jeu');
    dimensionner();
    relancer();
    dernier = performance.now();
    boucle = requestAnimationFrame(pas);
  }

  boutonDebut.addEventListener('click', commencer);
  fin.querySelector<HTMLButtonElement>('[data-rejouer]')!.addEventListener('click', relancer);

  const surRedimensionnement = () => dimensionner();
  window.addEventListener('resize', surRedimensionnement);
  dimensionner();
  /* Une tasse posée, immobile, tant que l'on n'a pas commencé. */
  dessinerTasse(racine.clientWidth, racine.clientHeight);

  /** Coupe tout : la caméra d'abord, puis les écouteurs et la boucle. */
  return function arreter() {
    cancelAnimationFrame(boucle);
    window.removeEventListener('resize', surRedimensionnement);
    window.removeEventListener('deviceorientation', surInclinaison);
    window.removeEventListener('pointermove', surPointeur);
    window.removeEventListener('pointerdown', surPointeur);
    flux?.getTracks().forEach((piste) => piste.stop());
    flux = null;
    video.srcObject = null;
  };
}
