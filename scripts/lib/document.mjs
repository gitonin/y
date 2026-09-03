/**
 * Écrit un document relisible et modifiable — version texte (.md) et version
 * Word (.docx) — à partir d'un plan de blocs. C'est le même format pour tous
 * les exports : un code stable entre crochets devant chaque texte, c'est lui
 * qui permet de réinjecter les modifications au bon endroit.
 *
 * Un plan est un tableau de blocs :
 *   { type: 'chapter' | 'section', title }
 *   { type: 'note', text }
 *   { type: 'field', code, label, lines: [...] }
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const AUJOURD_HUI = () => new Date().toLocaleDateString('fr-FR');

export function versMarkdown(doc, { titre, entete }) {
  const md = [`# ${titre}`, '', `_${entete}_`, ''];
  for (const item of doc) {
    if (item.type === 'chapter') md.push('', `## ${item.title}`, '');
    else if (item.type === 'section') md.push('', `### ${item.title}`, '');
    else if (item.type === 'note') md.push(`> ${item.text}`, '');
    else {
      md.push(`**${item.label}** \`[${item.code}]\``);
      md.push(...item.lines);
      md.push('');
    }
  }
  return md.join('\n');
}

async function versWord(doc, { titre, entete }) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx');
  const children = [
    new Paragraph({ text: titre, heading: HeadingLevel.TITLE }),
    new Paragraph({
      spacing: { after: 320 },
      children: [new TextRun({ text: entete, italics: true, color: '666660' })],
    }),
  ];
  for (const item of doc) {
    if (item.type === 'chapter') {
      children.push(
        new Paragraph({
          text: item.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 520, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9C3B4', space: 6 } },
        })
      );
    } else if (item.type === 'section') {
      children.push(new Paragraph({ text: item.title, heading: HeadingLevel.HEADING_2, spacing: { before: 340, after: 140 } }));
    } else if (item.type === 'note') {
      children.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: item.text, italics: true, color: '55524A' })] }));
    } else {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 40 },
          children: [
            new TextRun({ text: item.label, bold: true, size: 19, color: '55524A' }),
            new TextRun({ text: `   [${item.code}]`, size: 19, color: 'B95F2C' }),
          ],
        })
      );
      for (const line of item.lines) {
        children.push(new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: line, size: 22 })] }));
      }
      if (item.lines.length > 1) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: '↑ les retours à la ligne ci-dessus sont volontaires', size: 15, italics: true, color: '9A958A' })],
          })
        );
      }
    }
  }
  return Packer.toBuffer(
    new Document({
      creator: 'Yunma',
      title: titre,
      styles: { default: { document: { run: { font: 'Helvetica', size: 22, color: '212121' } } } },
      sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children }],
    })
  );
}

/** Écrit les deux fichiers et renvoie ce qui a été produit. */
export async function ecrire(doc, { dossier, nom, titre, consigne }) {
  const entete = `Document généré le ${AUJOURD_HUI()} à partir du site. ${consigne}`;
  await mkdir(dossier, { recursive: true });
  await writeFile(path.join(dossier, `${nom}.md`), versMarkdown(doc, { titre, entete }), 'utf8');
  let word = false;
  try {
    await writeFile(path.join(dossier, `${nom}.docx`), await versWord(doc, { titre, entete }));
    word = true;
  } catch (error) {
    console.warn('Document Word non généré (npm i -D docx pour l’activer) :', error.message);
  }
  return { champs: doc.filter((d) => d.type === 'field').length, word };
}
