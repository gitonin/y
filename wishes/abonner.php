<?php
/* ---------------------------------------------------------------------------
   Le journal de la récolte — le relais
   ---------------------------------------------------------------------------
   Une adresse donnée dans l'arbre à vœux arrive ici, et nulle part ailleurs.
   Ce fichier existe pour une raison de sécurité, pas de confort : tout ce qui
   se trouve dans la page est public, donc la clé d'un service d'envoi n'a
   rien à y faire. Elle vit ici, du côté du serveur, et la page ne sait rien
   d'elle.

   Pour l'instant, aucune clé : on écrit dans un journal, à côté, que le
   .htaccess refuse de servir. C'est assez pour la période d'essai — savoir
   combien de personnes donnent leur adresse, et laquelle. Le jour où la
   liste à double confirmation existera, il n'y aura qu'un appel à ajouter à
   la fin de ce fichier ; la page, elle, ne changera pas d'une ligne.

   Ce qu'on garde, et rien de plus : l'adresse, la langue de lecture,
   l'instant, et la version exacte du texte qui a été montré — c'est cette
   dernière qui prouve à quoi la personne a consenti. L'adresse IP n'est
   gardée que hachée, et seulement pour pouvoir refuser un robot qui
   reviendrait cent fois.
   --------------------------------------------------------------------------- */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

/* Le fichier est appelé par la page qui est à côté de lui, par personne
   d'autre. Quand le navigateur le dit, on le croit ; quand il ne dit rien
   (vieux navigateurs), on laisse passer plutôt que de perdre une adresse. */
function refus($code, $quoi) {
  http_response_code($code);
  echo json_encode(array('non' => $quoi), JSON_UNESCAPED_UNICODE);
  exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') refus(405, 'methode');
$site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
if ($site !== '' && $site !== 'same-origin' && $site !== 'none') refus(403, 'origine');

$brut = file_get_contents('php://input', false, null, 0, 4096);
$d = json_decode((string) $brut, true);
if (!is_array($d)) refus(400, 'corps');

/* -------------------------------------------------- les robots
   Ni captcha ni devinette : deux pièges qui ne demandent rien à personne.
   Un champ que l'œil ne voit pas et que le doigt ne peut pas atteindre — s'il
   est rempli, ce n'est pas une main. Et le temps passé sur la page : il faut
   avoir lu la ligne, touché « par mail », écrit son adresse. Moins d'une
   seconde et demie, c'est une machine.

   Dans les deux cas on répond que c'est noté, et l'on n'écrit rien : un robot
   à qui l'on dit non recommence autrement. */
if (!empty($d['p'])) { http_response_code(204); exit; }
if (isset($d['d']) && is_numeric($d['d']) && (float) $d['d'] < 1500) { http_response_code(204); exit; }

/* -------------------------------------------------- l'adresse */
$mail = trim((string) ($d['m'] ?? ''));
if ($mail === '' || strlen($mail) > 180) refus(400, 'adresse');
if (!filter_var($mail, FILTER_VALIDATE_EMAIL)) refus(400, 'adresse');
$mail = strtolower($mail);
/* Le domaine doit pouvoir recevoir du courrier : une faute de frappe dans
   « gmial.com » s'arrête ici, et non en janvier 2027 devant une adresse qui
   rebondit.

   Mais on commence par demander à la machine si elle sait interroger le DNS,
   en lui posant la question pour un domaine qui existe à coup sûr. Sans ce
   sondage, un serveur dépourvu de résolveur refuserait toutes les adresses
   du monde en croyant bien faire — et l'on perdrait tout le monde. Mieux
   vaut une adresse douteuse qu'une adresse perdue. */
$dom = substr($mail, strpos($mail, '@') + 1);
if (function_exists('checkdnsrr') && @checkdnsrr('gmail.com', 'MX')) {
  $ok = @checkdnsrr($dom, 'MX') || @checkdnsrr($dom, 'A') || @checkdnsrr($dom, 'AAAA');
  if (!$ok) refus(400, 'domaine');
}

$lang = (string) ($d['l'] ?? '');
if (!in_array($lang, array('fr', 'en', 'zh'), true)) $lang = 'fr';
$version = preg_match('/^[a-z0-9-]{1,40}$/', (string) ($d['v'] ?? '')) ? $d['v'] : 'inconnue';

/* -------------------------------------------------- le journal
   À côté de ce fichier, avec une extension que le .htaccess refuse de
   servir. Verrou exclusif : deux personnes qui s'inscrivent dans la même
   seconde, un soir de fête, ne doivent pas s'écrire l'une sur l'autre. */
$journal = __DIR__ . '/abonnes.jsonl';
$ipHash = substr(hash('sha256', 'yunma-recolte|' . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
$maintenant = time();

$f = @fopen($journal, 'c+');
if ($f === false) refus(500, 'journal');
if (!flock($f, LOCK_EX)) { fclose($f); refus(500, 'verrou'); }

/* On relit la fin du journal : assez pour reconnaître une adresse déjà
   donnée et compter les envois d'une même machine dans l'heure, pas assez
   pour charger un fichier entier en mémoire. */
clearstatcache(true, $journal);
$taille = (int) filesize($journal);
$depuis = $taille > 120000 ? $taille - 120000 : 0;
fseek($f, $depuis);
$fin = (string) stream_get_contents($f);
$dejaLa = false;
$coups = 0;
foreach (explode("\n", $fin) as $ligne) {
  if ($ligne === '') continue;
  $e = json_decode($ligne, true);
  if (!is_array($e)) continue;
  if (($e['m'] ?? '') === $mail) $dejaLa = true;
  if (($e['ip'] ?? '') === $ipHash && ($e['t'] ?? 0) > $maintenant - 3600) $coups++;
}
if ($coups >= 5) { flock($f, LOCK_UN); fclose($f); refus(429, 'trop'); }

/* Une adresse donnée deux fois n'est pas une erreur du visiteur : il a
   peut-être changé de téléphone, ou effacé la mémoire de son navigateur. On
   lui répond que c'est noté, sans rien écrire de plus. */
if (!$dejaLa) {
  $e = array('m' => $mail, 'l' => $lang, 't' => $maintenant,
    'd' => gmdate('c', $maintenant), 'v' => $version, 'ip' => $ipHash, 's' => 'arbre-a-voeux');
  fseek($f, 0, SEEK_END);
  fwrite($f, json_encode($e, JSON_UNESCAPED_UNICODE) . "\n");
  fflush($f);
}
flock($f, LOCK_UN);
fclose($f);
@chmod($journal, 0600);

/* Ici viendra l'appel à la liste à double confirmation, le jour où elle
   existe : la clé sera lue dans un fichier voisin tenu hors du dossier
   public, et un échec de ce côté-là ne doit pas faire perdre l'adresse —
   elle est déjà dans le journal. */

http_response_code(204);
