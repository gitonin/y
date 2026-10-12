<?php
/**
 * Le serveur du jeu Yunma — un seul fichier, posé sur l'hébergement.
 *
 * Le site est fait de fichiers statiques : rien n'y tourne. Un jeu où quatre
 * téléphones partagent la même partie a besoin d'un endroit qui se souvienne,
 * et ce fichier est cet endroit.
 *
 * Les téléphones demandent « où en est la partie ? » une fois par seconde.
 * C'est assez pour un quiz, et cela évite d'installer quoi que ce soit : ni
 * service externe, ni abonnement, ni port à ouvrir.
 *
 * Base de données : SQLite par défaut — un fichier, rien à créer. Si
 * l'hébergement s'en accommode mal (certains montages réseau verrouillent
 * mal), renseigner les quatre constantes MySQL ci-dessous suffit à basculer,
 * sans toucher au reste.
 *
 * Aucun compte, aucune donnée personnelle : un prénom choisi par le joueur,
 * effacé avec la partie au bout de deux heures.
 */

declare(strict_types=1);

/* ------------------------------------------------------------------ *
 * Réglages
 * ------------------------------------------------------------------ */

/** Laisser vide pour SQLite. Sinon : hôte, base, utilisateur, mot de passe. */
const MYSQL = ['hote' => '', 'base' => '', 'utilisateur' => '', 'motdepasse' => ''];

/** Le fichier SQLite, à côté de ce script. Le .htaccess voisin le protège. */
const FICHIER_SQLITE = __DIR__ . '/parties.sqlite';

const QUESTIONS_PAR_PARTIE = 10;
const JOUEURS_MAX = 4;
const SECONDES_PAR_QUESTION = 15;
/** Marge accordée au réseau quand on recoupe le temps annoncé par le joueur.
 *  Assez large pour ne pas punir une mauvaise connexion, assez étroite pour
 *  qu'annoncer « zéro milliseconde » ne rapporte rien. */
const TOLERANCE_RESEAU_MS = 1500;
/** Une partie oubliée disparaît : personne n'a à faire le ménage. */
const DUREE_DE_VIE_HEURES = 2;

/* ------------------------------------------------------------------ *
 * Sortie
 * ------------------------------------------------------------------ */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function rendre(array $donnees, int $code = 200): never {
    http_response_code($code);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function refuser(string $raison, int $code = 400): never {
    rendre(['erreur' => $raison], $code);
}

/*
 * Une panne doit rester du JSON.
 *
 * Le téléphone attend du JSON et rien d'autre : il lit `erreur` et l'affiche.
 * Une exception non rattrapée lui renverrait la page d'erreur de PHP, qu'il ne
 * sait pas lire — et le joueur resterait devant « Connexion perdue » sans fin,
 * sans que personne sache pourquoi.
 *
 * Le joueur reçoit donc une phrase, et la raison technique part dans le
 * journal d'erreurs de l'hébergement : c'est là qu'on la cherche.
 */
set_exception_handler(function (Throwable $e): void {
    error_log('jeu yunma : ' . $e->getMessage());
    rendre(['erreur' => 'Le jeu est momentanément indisponible.'], 500);
});

/* ------------------------------------------------------------------ *
 * Base
 * ------------------------------------------------------------------ */

function base(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    if (MYSQL['hote'] !== '') {
        $pdo = new PDO(
            sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', MYSQL['hote'], MYSQL['base']),
            MYSQL['utilisateur'],
            MYSQL['motdepasse'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $auto = 'INTEGER PRIMARY KEY AUTO_INCREMENT';
    } else {
        /* Le premier lancement crée le fichier des parties. S'il ne peut pas,
           c'est presque toujours la même chose : le dossier déposé n'est pas
           inscriptible. On le dit, plutôt que de laisser PDO échouer sur une
           phrase que personne ne rattache aux droits d'un dossier. */
        if (!is_file(FICHIER_SQLITE) && !is_writable(__DIR__)) {
            error_log('jeu yunma : le dossier ' . __DIR__ . ' n\'est pas inscriptible');
            refuser('Le dossier du jeu n\'est pas inscriptible sur le serveur.', 500);
        }
        $pdo = new PDO('sqlite:' . FICHIER_SQLITE, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        /* WAL : un joueur qui lit ne bloque pas un joueur qui écrit. Sans lui,
           quatre téléphones qui interrogent chaque seconde se gêneraient. */
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 4000');
        $auto = 'INTEGER PRIMARY KEY AUTOINCREMENT';
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS parties (
        code         VARCHAR(8) PRIMARY KEY,
        etat         VARCHAR(16) NOT NULL,
        question     INTEGER NOT NULL DEFAULT 0,
        ordre        TEXT NOT NULL,
        melange      TEXT NOT NULL,
        ouverte_a    INTEGER NOT NULL DEFAULT 0,
        jeton_hote   VARCHAR(32) NOT NULL,
        creee        INTEGER NOT NULL
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS joueurs (
        id      $auto,
        code    VARCHAR(8) NOT NULL,
        nom     VARCHAR(24) NOT NULL,
        jeton   VARCHAR(32) NOT NULL,
        score   INTEGER NOT NULL DEFAULT 0,
        rejoint INTEGER NOT NULL
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS reponses (
        id       $auto,
        code     VARCHAR(8) NOT NULL,
        joueur   INTEGER NOT NULL,
        question INTEGER NOT NULL,
        choix    INTEGER NOT NULL,
        ms       INTEGER NOT NULL,
        points   INTEGER NOT NULL
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS i_joueurs ON joueurs (code)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS i_reponses ON reponses (code, question)");

    return $pdo;
}

/** Les parties oubliées s'effacent d'elles-mêmes. */
function faire_le_menage(): void {
    $limite = time() - DUREE_DE_VIE_HEURES * 3600;
    $vieilles = base()->prepare('SELECT code FROM parties WHERE creee < ?');
    $vieilles->execute([$limite]);
    foreach ($vieilles->fetchAll(PDO::FETCH_COLUMN) as $code) {
        foreach (['reponses', 'joueurs', 'parties'] as $table) {
            base()->prepare("DELETE FROM $table WHERE code = ?")->execute([$code]);
        }
    }
}

/* ------------------------------------------------------------------ *
 * Questions
 * ------------------------------------------------------------------ */

/*
 * Les questions sont livrées en PHP, et non en JSON, pour une seule raison :
 * elles portent les bonnes réponses. Un fichier `.json` posé à côté de ce
 * script est servi tel quel par le serveur — il suffisait d'en demander
 * l'adresse pour lire les quarante-deux réponses au milieu d'une partie.
 * Un `.php` est exécuté, jamais montré, sur n'importe quel hébergement, et
 * sans dépendre d'une règle de `.htaccess` qui peut être ignorée.
 *
 * Le fichier est fabriqué par `outils/construire-jeu.mjs` depuis
 * `contenu/jeu.json`, qui reste la seule chose à modifier pour changer une
 * question.
 */
function questions(): array {
    static $q = null;
    if ($q === null) {
        $fichier = __DIR__ . '/questions.php';
        if (!is_file($fichier)) refuser('questions introuvables', 500);
        $q = (require $fichier)['questions'] ?? [];
    }
    return $q;
}

/* ------------------------------------------------------------------ *
 * Petits outils
 * ------------------------------------------------------------------ */

/** Un code lisible à voix haute : ni O/0 ni I/1, qu'on confond en le dictant. */
function code_de_partie(): string {
    $lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $code = '';
        for ($i = 0; $i < 4; $i++) $code .= $lettres[random_int(0, strlen($lettres) - 1)];
        $pris = base()->prepare('SELECT 1 FROM parties WHERE code = ?');
        $pris->execute([$code]);
    } while ($pris->fetch());
    return $code;
}

function jeton(): string {
    return bin2hex(random_bytes(16));
}

function entree(): array {
    $brut = file_get_contents('php://input');
    $d = json_decode($brut ?: '[]', true);
    return is_array($d) ? $d : [];
}

function partie(string $code): array {
    $p = base()->prepare('SELECT * FROM parties WHERE code = ?');
    $p->execute([strtoupper($code)]);
    $ligne = $p->fetch(PDO::FETCH_ASSOC);
    if (!$ligne) refuser('partie introuvable', 404);
    return $ligne;
}

function joueurs_de(string $code): array {
    $p = base()->prepare('SELECT id, nom, score FROM joueurs WHERE code = ? ORDER BY rejoint');
    $p->execute([$code]);
    return array_map(
        fn($j) => ['id' => (int) $j['id'], 'nom' => $j['nom'], 'score' => (int) $j['score']],
        $p->fetchAll(PDO::FETCH_ASSOC)
    );
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

$action = $_GET['a'] ?? '';
faire_le_menage();

if ($action === 'creer') {
    $toutes = questions();
    if (count($toutes) === 0) refuser('aucune question', 500);

    /* On tire les questions au hasard, et l'on fixe pour toute la partie
       l'ordre des réponses : tous les joueurs doivent voir le même écran. */
    $indices = array_keys($toutes);
    shuffle($indices);
    $indices = array_slice($indices, 0, min(QUESTIONS_PAR_PARTIE, count($indices)));

    $melange = [];
    foreach ($indices as $i) {
        $places = range(0, count($toutes[$i]['reponses']) - 1);
        shuffle($places);
        $melange[] = $places;
    }

    $code = code_de_partie();
    $jeton_hote = jeton();
    base()->prepare('INSERT INTO parties (code, etat, question, ordre, melange, jeton_hote, creee)
                     VALUES (?, ?, 0, ?, ?, ?, ?)')
        ->execute([$code, 'salon', json_encode($indices), json_encode($melange), $jeton_hote, time()]);

    rendre(['code' => $code, 'jeton_hote' => $jeton_hote]);
}

if ($action === 'rejoindre') {
    $d = entree();
    $code = strtoupper(trim((string) ($d['code'] ?? '')));
    $nom = trim((string) ($d['nom'] ?? ''));
    if ($nom === '') refuser('prénom manquant');
    /* Un prénom trop long déborderait de l'écran des autres joueurs. */
    $nom = mb_substr($nom, 0, 16);

    $p = partie($code);
    if ($p['etat'] !== 'salon') refuser('la partie a déjà commencé', 409);
    if (count(joueurs_de($code)) >= JOUEURS_MAX) refuser('la partie est complète', 409);

    $jeton = jeton();
    base()->prepare('INSERT INTO joueurs (code, nom, jeton, rejoint) VALUES (?, ?, ?, ?)')
        ->execute([$code, $nom, $jeton, (int) (microtime(true) * 1000)]);

    rendre(['jeton' => $jeton, 'id' => (int) base()->lastInsertId(), 'code' => $code]);
}

if ($action === 'demarrer' || $action === 'suivante') {
    $d = entree();
    $p = partie((string) ($d['code'] ?? ''));
    if (!hash_equals($p['jeton_hote'], (string) ($d['jeton_hote'] ?? ''))) refuser('réservé à l’hôte', 403);

    $ordre = json_decode($p['ordre'], true);

    if ($action === 'demarrer') {
        if ($p['etat'] !== 'salon') refuser('déjà commencée', 409);
        if (count(joueurs_de($p['code'])) === 0) refuser('aucun joueur', 409);
        $question = 0;
    } else {
        if ($p['etat'] !== 'revelation') refuser('pas le moment', 409);
        $question = (int) $p['question'] + 1;
        if ($question >= count($ordre)) {
            base()->prepare('UPDATE parties SET etat = ? WHERE code = ?')->execute(['fin', $p['code']]);
            rendre(['ok' => true, 'etat' => 'fin']);
        }
    }

    base()->prepare('UPDATE parties SET etat = ?, question = ?, ouverte_a = ? WHERE code = ?')
        ->execute(['question', $question, (int) (microtime(true) * 1000), $p['code']]);
    rendre(['ok' => true, 'etat' => 'question', 'question' => $question]);
}

if ($action === 'repondre') {
    $d = entree();
    $p = partie((string) ($d['code'] ?? ''));
    if ($p['etat'] !== 'question') refuser('la question est close', 409);

    $j = base()->prepare('SELECT * FROM joueurs WHERE code = ? AND jeton = ?');
    $j->execute([$p['code'], (string) ($d['jeton'] ?? '')]);
    $joueur = $j->fetch(PDO::FETCH_ASSOC);
    if (!$joueur) refuser('joueur inconnu', 403);

    $question = (int) $p['question'];
    $deja = base()->prepare('SELECT 1 FROM reponses WHERE code = ? AND joueur = ? AND question = ?');
    $deja->execute([$p['code'], $joueur['id'], $question]);
    if ($deja->fetch()) refuser('déjà répondu', 409);

    $choix = (int) ($d['choix'] ?? -1);

    /* Le temps est mesuré par le téléphone, entre l'affichage de la question
       et l'appui — et non à l'arrivée ici. Autrement on départagerait les
       joueurs selon leur opérateur plutôt que selon leur rapidité.
       Le serveur borne tout de même ce qu'on lui annonce : un téléphone
       pourrait prétendre avoir répondu en zéro milliseconde. */
    $ms = max(0, (int) ($d['ms'] ?? SECONDES_PAR_QUESTION * 1000));
    $ecoule = (int) (microtime(true) * 1000) - (int) $p['ouverte_a'];
    /* Le serveur recoupe des deux côtés. Vers le haut, on ne peut pas avoir mis
       plus de temps que la question n'est ouverte. Vers le bas, on ne peut pas
       avoir répondu sensiblement plus vite que le temps écoulé ici : sans ce
       plancher, il suffirait d'annoncer zéro pour marquer le maximum. */
    $plancher = max(0, $ecoule - TOLERANCE_RESEAU_MS);
    $ms = max($ms, $plancher);
    $ms = min($ms, max(0, $ecoule), SECONDES_PAR_QUESTION * 1000);

    $ordre = json_decode($p['ordre'], true);
    $melange = json_decode($p['melange'], true);
    $q = questions()[$ordre[$question]];
    /* Le joueur a cliqué sur la case n ; dans le fichier des questions, cette
       case porte le numéro $melange[$question][$n]. */
    $reel = $melange[$question][$choix] ?? -1;
    $juste = $reel === $q['bonne'];

    $points = 0;
    if ($juste) {
        $limite = SECONDES_PAR_QUESTION * 1000;
        $points = 500 + (int) round(500 * max(0, $limite - $ms) / $limite);
    }

    base()->prepare('INSERT INTO reponses (code, joueur, question, choix, ms, points) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$p['code'], $joueur['id'], $question, $choix, $ms, $points]);
    base()->prepare('UPDATE joueurs SET score = score + ? WHERE id = ?')
        ->execute([$points, $joueur['id']]);

    /* Tout le monde a répondu : on révèle sans attendre la fin du chronomètre. */
    $n = base()->prepare('SELECT COUNT(*) FROM reponses WHERE code = ? AND question = ?');
    $n->execute([$p['code'], $question]);
    if ((int) $n->fetchColumn() >= count(joueurs_de($p['code']))) {
        base()->prepare('UPDATE parties SET etat = ? WHERE code = ?')->execute(['revelation', $p['code']]);
    }

    rendre(['ok' => true, 'juste' => $juste, 'points' => $points]);
}

if ($action === 'etat') {
    $p = partie((string) ($_GET['code'] ?? ''));
    $ordre = json_decode($p['ordre'], true);
    $melange = json_decode($p['melange'], true);
    $question = (int) $p['question'];
    $etat = $p['etat'];

    /* Le chronomètre est tenu par le serveur : un téléphone en veille ne peut
       pas retarder la partie pour les autres. */
    $reste = null;
    if ($etat === 'question') {
        $reste = SECONDES_PAR_QUESTION * 1000 - ((int) (microtime(true) * 1000) - (int) $p['ouverte_a']);
        if ($reste <= 0) {
            base()->prepare('UPDATE parties SET etat = ? WHERE code = ?')->execute(['revelation', $p['code']]);
            $etat = 'revelation';
            $reste = 0;
        }
    }

    $sortie = [
        'etat' => $etat,
        'question' => $question,
        'total' => count($ordre),
        'joueurs' => joueurs_de($p['code']),
        'reste' => $reste,
    ];

    if ($etat === 'question' || $etat === 'revelation') {
        $q = questions()[$ordre[$question]];
        $places = $melange[$question];
        $sortie['enonce'] = $q['enonce'];
        $sortie['reponses'] = array_map(fn($place) => $q['reponses'][$place], $places);
        /* Qui a répondu — sans dire quoi, tant que la question est ouverte. */
        $r = base()->prepare('SELECT joueur FROM reponses WHERE code = ? AND question = ?');
        $r->execute([$p['code'], $question]);
        $sortie['ont_repondu'] = array_map('intval', $r->fetchAll(PDO::FETCH_COLUMN));
    }

    if ($etat === 'revelation') {
        $q = questions()[$ordre[$question]];
        $sortie['bonne'] = array_search($q['bonne'], $melange[$question], true);
        $sortie['explication'] = $q['explication'];
        $r = base()->prepare('SELECT joueur, choix, points FROM reponses WHERE code = ? AND question = ?');
        $r->execute([$p['code'], $question]);
        $sortie['detail'] = array_map(
            fn($x) => ['joueur' => (int) $x['joueur'], 'choix' => (int) $x['choix'], 'points' => (int) $x['points']],
            $r->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    rendre($sortie);
}

refuser('action inconnue', 404);
