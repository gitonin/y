/**
 * La carte du relief de la ceinture caféière, côté navigateur.
 *
 * Le relief n'est pas envoyé en trois dimensions : la page reçoit une grille
 * de 200 × 200 octets — une altitude par maille, une vingtaine de kilooctets
 * compressés — et fabrique la maquette ici.
 *
 * Le dessin est celui d'une maquette découpée dans du papier épais : des
 * couches de 100 m empilées, blanches, et c'est l'ombre portée d'une couche
 * sur la suivante qui donne le relief. Aucun trait, aucune couleur — ni
 * courbe de niveau dessinée, ni teinte d'altitude. Une version antérieure
 * traçait les courbes dans le nuanceur ; elles grisaient la surface et ne
 * disaient pas le volume. L'ombre le dit.
 *
 * Les bords se fondent dans le papier. Sans cela, la maquette montre son
 * épaisseur et redevient un objet posé sur une page ; fondue, elle n'a plus
 * de fin et le regard porte au-delà.
 *
 * L'orange de la marque ne sert qu'à désigner les trois fermes.
 */
import {
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  Group,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Relief {
  zone: { ouest: number; est: number; sud: number; nord: number };
  mailles: number;
  pas: number;
  altitudeMin: number;
  altitudeMax: number;
  niveaux: string;
  fermes: { cle: string; i: number; j: number; altitudeRelevee: number; altitudeAnnoncee: [number, number] }[];
}

interface Ferme {
  nom: string;
  lieu: string;
  altitude: string;
  texte: string;
  cafes: string[];
}

type Textes = Record<string, string>;

/* Les teintes, reprises de carte.css. Les deux listes doivent rester
   identiques — la construction échoue sinon. */
const PAPIER = '#efebe2';
const SURFACE = '#fbfaf7';
const OMBRE = '#cfc9bd';
const TRAIT = '#212121';
const ACCENT = '#b95f2c';

/** Hauteur d'une marche, en mètres. C'est l'épaisseur d'une feuille.
    Le réglage se juge au rapport entre la hauteur d'une marche et la largeur
    d'une maille : trop fines, les marches ne font plus des couches mais une
    grêle, et leurs ombres couvrent la maquette de moucheture. */
const MARCHE = 150;
/** La bande où pousse le café, en mètres. */
const CEINTURE: [number, number] = [1000, 1900];

const COTE = 100;
/* Le relief réel serait invisible : 3 000 m sur 600 km de large, c'est une
   feuille de papier. L'exagération est assumée, et la page le dit. */
const HAUTEUR = 15;

const lire = <T,>(selecteur: string): T | null => {
  const el = document.querySelector<HTMLElement>(selecteur);
  return el?.textContent ? (JSON.parse(el.textContent) as T) : null;
};

const douceur = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function lancerCarte(): void {
  const trouvee = document.querySelector<HTMLElement>('[data-carte]');
  if (!trouvee) return;
  /* Repris dans une constante typée non nulle : `finirOuverture` est une
     déclaration de fonction, donc remontée avant ce test, et le typage y
     perdait la garantie acquise ici. */
  const racine: HTMLElement = trouvee;
  const toile = racine.querySelector<HTMLCanvasElement>('[data-toile]');
  const relief = lire<Relief>('[data-carte-relief]');
  const fermes = lire<Record<string, Ferme>>('[data-carte-fermes]');
  const T = lire<Textes>('[data-carte-textes]') ?? {};
  if (!toile || !relief || !fermes) return;

  const panne = (raison: string) => {
    const el = racine.querySelector<HTMLElement>('[data-panne]');
    if (el) el.hidden = false;
    toile.hidden = true;
    racine.querySelector<HTMLElement>('[data-legende]')?.setAttribute('hidden', '');
    console.warn('carte :', raison);
  };

  let rendu: WebGLRenderer;
  try {
    rendu = new WebGLRenderer({ canvas: toile, antialias: true, alpha: true });
  } catch (e) {
    panne(String(e));
    return;
  }
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  /* Les ombres sont le dessin : sans elles, les couches disparaissent. */
  rendu.shadowMap.enabled = true;
  rendu.shadowMap.type = PCFSoftShadowMap;

  /* ---------------------------------------------------------------- *
   * Les proportions réelles du terrain
   * ---------------------------------------------------------------- */
  const { zone, mailles: M, pas, altitudeMin, altitudeMax } = relief;
  const latMoyenne = ((zone.sud + zone.nord) / 2) * (Math.PI / 180);
  /* Un degré de longitude se raccourcit avec la latitude : sans ce cosinus la
     carte serait étirée d'un bon dixième en largeur. */
  const largeurKm = (zone.est - zone.ouest) * 111.32 * Math.cos(latMoyenne);
  const profondeurKm = (zone.nord - zone.sud) * 110.57;
  const echelle = COTE / Math.max(largeurKm, profondeurKm);
  const L = largeurKm * echelle;
  const P = profondeurKm * echelle;

  const octets = Uint8Array.from(atob(relief.niveaux), (c) => c.charCodeAt(0));
  const metres = (i: number, j: number) => altitudeMin + octets[j * M + i] * pas;
  const etendue = Math.max(1, altitudeMax - altitudeMin);
  const unites = (m: number) => ((m - altitudeMin) / etendue) * HAUTEUR;

  /* Le découpage : chaque maille est ramenée à sa marche. C'est ici, et nulle
     part ailleurs, que la maquette devient un empilement de feuilles. */
  const marches = Math.max(1, Math.round(etendue / MARCHE));
  const niveauDe = (i: number, j: number) =>
    Math.round(((metres(i, j) - altitudeMin) / etendue) * marches);
  const hauteurDe = (niveau: number) => (niveau / marches) * HAUTEUR;

  const xDe = (i: number) => -L / 2 + (i / (M - 1)) * L;
  const zDe = (j: number) => -P / 2 + (j / (M - 1)) * P;
  const cw = L / (M - 1);
  const cp = P / (M - 1);

  /* ---------------------------------------------------------------- *
   * La géométrie : un dessus par maille, un flanc à chaque marche
   * ---------------------------------------------------------------- */
  let quads = 0;
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      quads++;
      const n = niveauDe(i, j);
      if (i + 1 >= M || niveauDe(i + 1, j) < n) quads++;
      if (i - 1 < 0 || niveauDe(i - 1, j) < n) quads++;
      if (j + 1 >= M || niveauDe(i, j + 1) < n) quads++;
      if (j - 1 < 0 || niveauDe(i, j - 1) < n) quads++;
    }
  }

  const sommets = quads * 6;
  const positions = new Float32Array(sommets * 3);
  const normales = new Int8Array(sommets * 3);
  let p = 0;

  const poser = (
    a: Vector3, b: Vector3, c: Vector3, d: Vector3,
    nx: number, ny: number, nz: number,
  ) => {
    for (const v of [a, b, c, a, c, d]) {
      positions[p * 3] = v.x; positions[p * 3 + 1] = v.y; positions[p * 3 + 2] = v.z;
      normales[p * 3] = nx * 127; normales[p * 3 + 1] = ny * 127; normales[p * 3 + 2] = nz * 127;
      p++;
    }
  };
  const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
  /* Les bords descendent très bas et disparaissent dans le fondu : la
     maquette n'a pas de tranche visible, donc pas de fin. */
  const DESSOUS = -HAUTEUR * 1.4;

  for (let j = 0; j < M; j++) {
    const z0 = zDe(j) - cp / 2;
    const z1 = z0 + cp;
    for (let i = 0; i < M; i++) {
      const x0 = xDe(i) - cw / 2;
      const x1 = x0 + cw;
      const n = niveauDe(i, j);
      const y = hauteurDe(n);

      poser(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), 0, 1, 0);

      const voisin = (vi: number, vj: number) =>
        vi < 0 || vj < 0 || vi >= M || vj >= M ? null : niveauDe(vi, vj);

      const vE = voisin(i + 1, j);
      if (vE === null || vE < n) {
        const yb = vE === null ? DESSOUS : hauteurDe(vE);
        poser(V(x1, yb, z1), V(x1, yb, z0), V(x1, y, z0), V(x1, y, z1), 1, 0, 0);
      }
      const vO = voisin(i - 1, j);
      if (vO === null || vO < n) {
        const yb = vO === null ? DESSOUS : hauteurDe(vO);
        poser(V(x0, yb, z0), V(x0, yb, z1), V(x0, y, z1), V(x0, y, z0), -1, 0, 0);
      }
      const vS = voisin(i, j + 1);
      if (vS === null || vS < n) {
        const yb = vS === null ? DESSOUS : hauteurDe(vS);
        poser(V(x0, yb, z1), V(x1, yb, z1), V(x1, y, z1), V(x0, y, z1), 0, 0, 1);
      }
      const vN = voisin(i, j - 1);
      if (vN === null || vN < n) {
        const yb = vN === null ? DESSOUS : hauteurDe(vN);
        poser(V(x1, yb, z0), V(x0, yb, z0), V(x0, y, z0), V(x1, y, z0), 0, 0, -1);
      }
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('normal', new BufferAttribute(normales, 3, true));
  geo.computeBoundingSphere();

  /* ---------------------------------------------------------------- *
   * La matière : du papier, qui s'efface au loin et sur les bords
   * ---------------------------------------------------------------- */
  const uBrume = { value: new Vector2(95, 430) };
  const uBord = { value: new Vector2(0.86, 1.0) };
  const uPapier = { value: new Color(PAPIER) };

  /* Un remplacement qui ne trouve pas sa cible ne dit rien et ne fait rien :
     le nuanceur part sans la greffe, et la maquette montre son épaisseur sans
     qu'aucune erreur ne le signale. On s'arrête plutôt. */
  const remplacer = (source: string, cible: string, par: string) => {
    if (!source.includes(cible)) throw new Error(`nuanceur : « ${cible} » introuvable`);
    return source.replace(cible, par);
  };

  /* On greffe le fondu sur la matière de Three plutôt que d'écrire un
     nuanceur à soi : les ombres portées et l'éclairage restent ceux du moteur,
     et l'on n'ajoute que ce qui manque. */
  const greffer = (mat: MeshLambertMaterial) => {
    /* Sans cette clé, Three range les programmes compilés par type de
       matière : les billes, qui sont aussi du Lambert, pouvaient compiler les
       premières et le relief héritait de LEUR programme, sans la greffe. Le
       fondu disparaissait alors au gré de l'ordre de compilation. */
    mat.customProgramCacheKey = () => 'carte-papier';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uBrume = uBrume;
      shader.uniforms.uBord = uBord;
      shader.uniforms.uPapier = uPapier;
      shader.uniforms.uDemi = { value: new Vector2(L / 2, P / 2) };
      shader.vertexShader = remplacer(
        remplacer(shader.vertexShader, '#include <common>', '#include <common>\nvarying vec3 vMonde;\nvarying float vProf;'),
        '#include <project_vertex>',
        '#include <project_vertex>\nvMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvProf = -mvPosition.z;',
      );
      shader.fragmentShader = remplacer(
        remplacer(
          shader.fragmentShader,
          '#include <common>',
          '#include <common>\nvarying vec3 vMonde;\nvarying float vProf;\nuniform vec2 uBrume;\nuniform vec2 uBord;\nuniform vec2 uDemi;\nuniform vec3 uPapier;',
        ),
        '#include <colorspace_fragment>',
          `/* Le lointain, puis les bords. Les deux ramènent au papier : le
              fond de la page étant de cette couleur, ce qui s'y fond cesse
              d'exister sans qu'on ait à gérer de transparence.

              Le mélange se fait AVANT la conversion d'espace colorimétrique.
              Après, la couleur rendue est déjà en sRGB alors que la teinte du
              papier, comme toute couleur de Three, est tenue en linéaire : le
              mélange des deux donnait une dalle pâle au lieu d'une
              disparition, et l'épaisseur de la maquette restait visible. */
           float loin = smoothstep(uBrume.x, uBrume.y, vProf);
           vec2 q = abs(vMonde.xz) / uDemi;
           float bord = smoothstep(uBord.x, uBord.y, max(q.x, q.y));
           float efface = clamp(max(loin * 0.38, bord), 0.0, 1.0);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, uPapier, efface);
           #include <colorspace_fragment>`,
      );
    };
  };

  const matPapier = new MeshLambertMaterial({ color: new Color(SURFACE) });
  matPapier.shadowSide = BackSide;
  greffer(matPapier);

  const scene = new Scene();
  const terrain = new Mesh(geo, matPapier);
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  scene.add(terrain);

  /* ---------------------------------------------------------------- *
   * La lumière
   * ---------------------------------------------------------------- */
  /* Un soleil de trois quarts, assez haut. Plus rasant, chaque marche traînait
     une ombre longue et la maquette se couvrait de moucheture ; au zénith, elle
     redevient un aplat — ce dont on se sert d'ailleurs à l'ouverture. */
  const soleil = new DirectionalLight(0xfff8ef, 2.6);
  soleil.position.set(-COTE * 0.62, COTE * 1.05, COTE * 0.45);
  soleil.castShadow = true;
  /* Une carte d'ombres volontairement modeste : à cette échelle, le flou
     qu'elle apporte vaut mieux que la précision — on veut des ombres de
     papier, pas des arêtes de pierre. */
  soleil.shadow.mapSize.set(1024, 1024);
  const o = soleil.shadow.camera;
  o.left = -COTE * 0.95; o.right = COTE * 0.95;
  o.top = COTE * 0.95; o.bottom = -COTE * 0.95;
  o.near = 1; o.far = COTE * 3;
  /* La carte d'ombres est dessinée avec les faces ARRIÈRE du relief.
     Avec les faces avant, chaque marche s'ombrait elle-même et toute la
     maquette se couvrait de hachures diagonales — l'acné d'ombre classique,
     que des réglages de biais ne font que déplacer. Les faces arrière, elles,
     sont derrière la surface éclairée : il n'y a plus rien à confondre. */
  soleil.shadow.bias = -0.0004;
  soleil.shadow.normalBias = 0.02;
  scene.add(soleil);
  scene.add(soleil.target);

  /* Le ciel éclaire le dessus, le papier renvoie par en dessous : c'est ce
     qui empêche les flancs à l'ombre de tomber au noir. */
  scene.add(new HemisphereLight(0xffffff, new Color(OMBRE).getHex(), 1.0));
  scene.add(new AmbientLight(0xffffff, 0.32));

  /* ---------------------------------------------------------------- *
   * La caméra
   * ---------------------------------------------------------------- */
  const camera = new PerspectiveCamera(40, 1, 0.4, 2000);
  const CIBLE = new Vector3(0, HAUTEUR * 0.25, 0);
  const coins: Vector3[] = [];
  for (const x of [-L / 2, L / 2])
    for (const y of [0, HAUTEUR])
      for (const z of [-P / 2, P / 2]) coins.push(new Vector3(x, y, z));

  const direction = new Vector3(
    Math.sin(Math.PI * 0.24) * Math.cos(0.68),
    Math.sin(0.68),
    Math.cos(Math.PI * 0.24) * Math.cos(0.68),
  ).normalize();

  const distancePour = (dir: Vector3, marge: number) => {
    let d = Math.hypot(L, P);
    for (let tour = 0; tour < 3; tour++) {
      camera.position.copy(dir).multiplyScalar(d).add(CIBLE);
      camera.lookAt(CIBLE);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      let debord = 0;
      for (const c of coins) {
        const v = c.clone().project(camera);
        debord = Math.max(debord, Math.abs(v.x), Math.abs(v.y));
      }
      d *= debord / marge;
    }
    return d;
  };

  /* La vue de repos, et la vue à plat d'où part l'ouverture. */
  /* Pas tout à fait la verticale : à l'aplomb exact, le repère de la caméra
     devient dégénéré, la carte se présente en losange et laisse les quatre
     coins de l'écran vides. Un soupçon d'inclinaison, dans l'axe de la vue
     finale, garde l'aplat tout en cadrant droit. */
  const DESSUS = direction.clone().setY(direction.y * 7.5).normalize();
  let recul = 0;
  let reculPlat = 0;
  const poserVueDeRepos = () => {
    reculPlat = distancePour(DESSUS, 1.02);
    recul = distancePour(direction, 1.1);
    camera.position.copy(direction).multiplyScalar(recul).add(CIBLE);
    camera.lookAt(CIBLE);
  };
  poserVueDeRepos();

  const controles = new OrbitControls(camera, rendu.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.075;
  controles.target.copy(CIBLE);
  controles.minDistance = COTE * 0.08;
  controles.maxDistance = recul * 2.4;
  controles.minPolarAngle = 0.05;
  controles.maxPolarAngle = 1.46;
  controles.enablePan = false;
  controles.update();

  /* ---------------------------------------------------------------- *
   * Les fermes
   * ---------------------------------------------------------------- */
  const repères = new Group();
  scene.add(repères);
  /* Une matière qui reçoit la lumière, pas un aplat : c'est l'ombre sur la
     bille et celle qu'elle porte sur le relief qui lui donnent son volume. */
  const matBille = new MeshLambertMaterial({ color: new Color(ACCENT) });
  const matInvisible = new MeshLambertMaterial({ visible: false });
  /* Le rayon n'est pas fixe : il est recalculé à chaque image pour que la
     bille garde la même taille À L'ÉCRAN. Fixée dans le monde, elle ne pouvait
     pas convenir aux deux échelles de la page — un point invisible vu de haut,
     ou une boule plus haute que l'altitude de vol une fois dans la vallée. */
  const RAYON = 1;
  const TAILLE = 0.0125;
  /* Bornes de sûreté seulement : trop serrées, elles mordaient avant que la
     taille voulue ne soit atteinte, et les trois billes apparaissaient de
     tailles différentes selon leur éloignement — exactement ce que ce calcul
     devait éviter. */
  const RAYON_MIN = COTE * 0.0016;
  const RAYON_MAX = COTE * 0.06;
  const geoBille = new SphereGeometry(RAYON, 32, 24);
  /* La cible du pointage est bien plus large que la bille, et invisible : une
     sphère d'un demi-millimètre à l'écran ne s'attrape pas au doigt. Elle ne
     suit donc pas la taille de la bille, qui est réglée pour le survol. */
  const geoCible = new SphereGeometry(COTE * 0.026, 10, 8);

  const posés = relief.fermes
    .filter((f) => fermes[f.cle])
    .map((f) => {
      const x = xDe(f.i);
      const z = zDe(f.j);
      /* Le centre est posé sur la marche : la bille y est donc à demi
         enfoncée quelle que soit sa taille, comme une perle pressée dans le
         papier. Tenue en l'air par une tige, elle flottait au-dessus du
         paysage au lieu d'y être. */
      const y = hauteurDe(niveauDe(f.i, f.j));

      const bille = new Mesh(geoBille, matBille);
      bille.position.set(x, y, z);
      bille.castShadow = true;
      repères.add(bille);

      const cible = new Mesh(geoCible, matInvisible);
      cible.position.copy(bille.position);
      cible.userData.ferme = f;
      repères.add(cible);

      return { f, bille };
    });

  /* ---------------------------------------------------------------- *
   * La fiche
   * ---------------------------------------------------------------- */
  const fiche = racine.querySelector<HTMLElement>('[data-fiche]');
  const champ = (s: string) => racine.querySelector<HTMLElement>(s);

  let choisie: string | null = null;
  const cacherFiche = () => {
    if (fiche) fiche.hidden = true;
    choisie = null;
  };

  const montrerFiche = (cle: string, altitudeRelevee: number) => {
    const d = fermes[cle];
    if (!d || !fiche) return;
    const mettre = (s: string, v: string) => { const el = champ(s); if (el) el.textContent = v; };
    mettre('[data-fiche-lieu]', d.lieu);
    mettre('[data-fiche-nom]', d.nom);
    mettre('[data-fiche-alt]', d.altitude);
    mettre('[data-fiche-texte]', d.texte);
    const liste = champ('[data-fiche-cafes]');
    if (liste) {
      liste.textContent = '';
      for (const nom of d.cafes) {
        const li = document.createElement('li');
        li.textContent = nom;
        liste.appendChild(li);
      }
      const note = document.createElement('li');
      note.className = 'muted';
      /* On ne laisse pas croire à une précision qu'on n'a pas : le site donne
         la préfecture et l'altitude, jamais les coordonnées de la parcelle. */
      note.textContent = (T.approche ?? '').replace('{alt}', String(altitudeRelevee));
      liste.appendChild(note);
    }
    fiche.hidden = false;
    choisie = cle;
  };

  champ('[data-fermer]')?.addEventListener('click', cacherFiche);

  /* ---------------------------------------------------------------- *
   * Le vol : au creux des vallées, le regard vers l'horizon
   * ---------------------------------------------------------------- */
  const hauteurEn = (x: number, z: number) => {
    const fi = ((x + L / 2) / L) * (M - 1);
    const fj = ((z + P / 2) / P) * (M - 1);
    const i = Math.max(0, Math.min(M - 2, Math.floor(fi)));
    const j = Math.max(0, Math.min(M - 2, Math.floor(fj)));
    const ti = Math.min(1, Math.max(0, fi - i));
    const tj = Math.min(1, Math.max(0, fj - j));
    const h = (a: number, b: number) => unites(metres(a, b));
    return (h(i, j) * (1 - ti) + h(i + 1, j) * ti) * (1 - tj)
         + (h(i, j + 1) * (1 - ti) + h(i + 1, j + 1) * ti) * tj;
  };

  /* Le trajet part des trois fermes, puis descend chercher les vallées : à
     chaque point on regarde autour et l'on glisse vers le plus bas. Sans cette
     descente, la boucle coupait droit à travers les crêtes et le vol passait
     son temps au-dessus, sans jamais s'y enfoncer. Les fermes, elles, ne
     bougent pas — c'est le trajet du café. */
  const fermesXZ = relief.fermes.map((f) => new Vector3(xDe(f.i), 0, zDe(f.j)));
  const centre = fermesXZ
    .reduce((a, q) => a.add(q), new Vector3())
    .multiplyScalar(1 / Math.max(1, fermesXZ.length));
  fermesXZ.sort(
    (a, b) => Math.atan2(a.z - centre.z, a.x - centre.x) - Math.atan2(b.z - centre.z, b.x - centre.x),
  );

  const ECHANTILLONS = 96;
  const grossier = new CatmullRomCurve3(
    fermesXZ.flatMap((a, k) => {
      const b = fermesXZ[(k + 1) % fermesXZ.length];
      const milieu = a.clone().add(b).multiplyScalar(0.5);
      return [a.clone(), milieu.add(milieu.clone().sub(centre).multiplyScalar(0.42))];
    }),
    true, 'catmullrom', 0.5,
  );

  const jalons: Vector3[] = [];
  for (let k = 0; k < ECHANTILLONS; k++) {
    const q = grossier.getPointAt(k / ECHANTILLONS);
    /* Ancré si l'on est tout près d'une ferme. */
    const pres = fermesXZ.some((f) => f.distanceTo(q) < COTE * 0.05);
    if (pres) { jalons.push(q); continue; }
    let meilleur = q.clone();
    let bas = hauteurEn(q.x, q.z);
    const rayon = COTE * 0.055;
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * Math.PI * 2;
      for (const r of [rayon * 0.5, rayon]) {
        const c = new Vector3(q.x + Math.cos(angle) * r, 0, q.z + Math.sin(angle) * r);
        if (Math.abs(c.x) > L / 2 - cw || Math.abs(c.z) > P / 2 - cp) continue;
        const h = hauteurEn(c.x, c.z);
        if (h < bas) { bas = h; meilleur = c; }
      }
    }
    jalons.push(q.lerp(meilleur, 0.72));
  }
  const trajet = new CatmullRomCurve3(jalons, true, 'catmullrom', 0.5);

  /** Garde au-dessus du sol, en unités de la carte. */
  const GARDE = 1.9;
  /** Un tour complet, en secondes. */
  const TOUR = 165;

  /* On ne prend que le plus haut d'un tout petit bout de trajet devant soi :
     assez pour ne pas entrer dans un ressaut, trop peu pour se hisser
     au-dessus des crêtes — on reste dans la vallée. */
  const hauteurVol = (t: number) => {
    let h = -Infinity;
    for (let k = 0; k <= 4; k++) {
      const q = trajet.getPointAt((t + k * 0.0035) % 1);
      h = Math.max(h, hauteurEn(q.x, q.z));
    }
    return h + GARDE;
  };

  let enVol = false;
  let avancee = 0;
  const regard = new Vector3();
  const bouton = racine.querySelector<HTMLButtonElement>('[data-survol]');

  const majBouton = () => {
    if (!bouton) return;
    bouton.textContent = enVol ? T.arreter ?? '' : T.survoler ?? '';
    bouton.setAttribute('aria-pressed', String(enVol));
  };

  const pointDeRegard = (t: number) => {
    /* On vise loin devant, à la hauteur de la caméra : c'est ce qui met
       l'horizon dans le cadre. Visé plus bas, on ne voyait que le sol. */
    const q = trajet.getPointAt((t + 0.075) % 1);
    return new Vector3(q.x, hauteurVol((t + 0.075) % 1) + HAUTEUR * 0.035, q.z);
  };

  const demarrerVol = () => {
    if (enVol || ouverture !== null) return;
    enVol = true;
    controles.enabled = false;
    let meilleure = Infinity;
    for (let k = 0; k < 240; k++) {
      const t = k / 240;
      const d = trajet.getPointAt(t).distanceToSquared(controles.target);
      if (d < meilleure) { meilleure = d; avancee = t; }
    }
    regard.copy(pointDeRegard(avancee));
    majBouton();
  };

  const arreterVol = () => {
    if (!enVol) return;
    enVol = false;
    controles.target.copy(regard);
    controles.enabled = true;
    controles.update();
    majBouton();
  };

  bouton?.addEventListener('click', () => (enVol ? arreterVol() : demarrerVol()));

  /* ---------------------------------------------------------------- *
   * Le pointage : distinguer un tap d'une rotation
   * ---------------------------------------------------------------- */
  const rayon = new Raycaster();
  const souris = new Vector2();
  let départ: { x: number; y: number; t: number; pendant: boolean } | null = null;

  toile.addEventListener('pointerdown', (e) => {
    /* Un geste pendant l'ouverture la termine, et rien de plus : la caméra
       saute alors à sa place définitive, et viser une ferme sur l'image
       d'avant désignerait un point qui n'y est plus. */
    départ = { x: e.clientX, y: e.clientY, t: performance.now(), pendant: ouverture !== null };
  });

  toile.addEventListener('pointerup', (e) => {
    if (!départ) return;
    const bougé = Math.hypot(e.clientX - départ.x, e.clientY - départ.y);
    const durée = performance.now() - départ.t;
    const pendantOuverture = départ.pendant;
    départ = null;
    if (pendantOuverture || bougé > 12 || durée > 600) return;

    const r = toile.getBoundingClientRect();
    souris.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    souris.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    rayon.setFromCamera(souris, camera);
    const touché = rayon.intersectObjects(repères.children, false).find((h) => h.object.userData.ferme);
    if (touché) {
      const f = touché.object.userData.ferme as Relief['fermes'][number];
      montrerFiche(f.cle, f.altitudeRelevee);
    } else {
      cacherFiche();
    }
  });

  /* Un geste reprend la main sur le vol comme sur l'ouverture. */
  for (const ev of ['pointerdown', 'wheel'] as const) {
    toile.addEventListener(ev, () => { arreterVol(); finirOuverture(); }, { passive: true });
  }

  /* ---------------------------------------------------------------- *
   * La légende
   * ---------------------------------------------------------------- */
  const poserTexte = (s: string, texte: string) => {
    const el = racine.querySelector<HTMLElement>(s);
    if (el) el.textContent = texte;
  };
  poserTexte('[data-equidistance]', (T.equidistance ?? '').replace('{n}', String(MARCHE)));
  /* La hauteur de marche est écrite une fois, ici : le texte ne peut pas
     annoncer une valeur que le dessin ne tient plus. */
  poserTexte('[data-intro]', (T.intro ?? '').replace('{n}', String(MARCHE)));
  poserTexte('[data-ceinture]', (T.ceinture ?? '')
    .replace('{bas}', CEINTURE[0].toLocaleString('fr-FR'))
    .replace('{haut}', CEINTURE[1].toLocaleString('fr-FR')));
  poserTexte('[data-fermes]', T.fermes ?? '');
  majBouton();

  /* ---------------------------------------------------------------- *
   * L'ouverture : un aplat qui se déplie
   * ---------------------------------------------------------------- *
   * On commence à la verticale, où la maquette n'est qu'un dessin de
   * courbes — le soleil est au zénith, rien ne porte d'ombre. Puis la caméra
   * descend, le soleil s'incline, et le volume apparaît.
   */
  const sobre = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SOLEIL_FIN = soleil.position.clone();
  const SOLEIL_ZENITH = new Vector3(0.0001, COTE * 1.2, 0.0001);
  const OUVERTURE = 4.2;
  let ouverture: number | null = sobre ? null : 0;

  const poserOuverture = (t: number) => {
    const e = douceur(Math.min(1, t));
    const dir = DESSUS.clone().lerp(direction, e).normalize();
    const d = reculPlat + (recul - reculPlat) * e;
    camera.position.copy(dir).multiplyScalar(d).add(CIBLE);
    camera.lookAt(CIBLE);
    soleil.position.copy(SOLEIL_ZENITH).lerp(SOLEIL_FIN, e);
  };

  function finirOuverture() {
    if (ouverture === null) return;
    ouverture = null;
    racine.dataset.ouverte = '1';
    soleil.position.copy(SOLEIL_FIN);
    camera.position.copy(direction).multiplyScalar(recul).add(CIBLE);
    camera.lookAt(CIBLE);
    controles.enabled = true;
    controles.update();
  }

  if (ouverture !== null) {
    controles.enabled = false;
    poserOuverture(0);
  } else {
    racine.dataset.ouverte = '1';
  }

  /* ---------------------------------------------------------------- *
   * La boucle
   * ---------------------------------------------------------------- */
  let cadre = { w: 0, h: 0 };
  const redimensionner = () => {
    const { clientWidth: w, clientHeight: h } = racine;
    rendu.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    const avant = cadre.w >= cadre.h;
    const apres = w >= h;
    if (cadre.w === 0 || avant !== apres) {
      poserVueDeRepos();
      controles.maxDistance = recul * 2.4;
      if (ouverture === null) {
        controles.update();
      } else {
        poserOuverture(ouverture / OUVERTURE);
      }
    }
    cadre = { w, h };
  };
  redimensionner();
  window.addEventListener('resize', redimensionner);

  let dernier = performance.now();
  const boucle = () => {
    const maintenant = performance.now();
    /* Le temps écoulé, borné : revenir sur un onglet laissé de côté ferait
       sinon bondir la caméra de plusieurs minutes de trajet. Un quart de
       seconde, et non un vingtième : à cinq images par seconde, un plafond
       trop bas ralentissait l'animation elle-même, qui se jouait alors au
       ralenti sans jamais finir. */
    const dt = Math.min(0.25, (maintenant - dernier) / 1000);
    dernier = maintenant;

    if (ouverture !== null) {
      ouverture += dt;
      if (ouverture >= OUVERTURE) finirOuverture();
      else poserOuverture(ouverture / OUVERTURE);
    } else if (enVol) {
      avancee = (avancee + dt / TOUR) % 1;
      const q = trajet.getPointAt(avancee);
      const cible = new Vector3(q.x, hauteurVol(avancee), q.z);
      /* Tout est amorti : la caméra rejoint sa cible au lieu de s'y poser. */
      camera.position.lerp(cible, 1 - Math.exp(-dt * 1.5));
      regard.lerp(pointDeRegard(avancee), 1 - Math.exp(-dt * 1.1));
      camera.lookAt(regard);
    } else {
      controles.update();
    }

    /* La taille apparente est tenue constante : le rayon suit la distance. */
    for (const { f, bille } of posés) {
      const d = camera.position.distanceTo(bille.position);
      const r = Math.min(Math.max(d * TAILLE, RAYON_MIN), RAYON_MAX);
      bille.scale.setScalar((r / RAYON) * (f.cle === choisie ? 1.5 : 1));
    }

    rendu.render(scene, camera);
    requestAnimationFrame(boucle);
  };
  boucle();

  racine.dataset.prete = '1';
  racine.dataset.triangles = String(quads * 2);
  racine.dataset.marches = String(marches);
}

lancerCarte();
