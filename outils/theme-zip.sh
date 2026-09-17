#!/bin/sh
# Refabrique l'archive du thème de renvoi Shopify à partir de ses sources.
#
# L'archive est versionnée pour pouvoir se téléverser directement depuis
# GitHub, sans rien installer : Boutique en ligne › Thèmes › Importer un zip.
# À relancer après toute modification du thème.
set -eu
cd "$(dirname "$0")/.."
rm -f boutique-shopify/theme-renvoi-yunma.zip
cd boutique-shopify
zip -rqX theme-renvoi-yunma.zip layout templates snippets config locales assets -x '.*' '*/.*'
echo "boutique-shopify/theme-renvoi-yunma.zip : $(unzip -l theme-renvoi-yunma.zip | tail -1)"
