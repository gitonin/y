/**
 * Le paquet `qrcode` ne fournit pas ses propres types. On déclare le peu qu'on
 * en utilise : fabriquer un SVG à partir d'une adresse.
 */
declare module 'qrcode' {
  interface OptionsSvg {
    type: 'svg';
    margin?: number;
    color?: { dark?: string; light?: string };
  }
  const QRCode: {
    toString(texte: string, options: OptionsSvg): Promise<string>;
  };
  export default QRCode;
}
