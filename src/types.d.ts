declare module 'opentype.js' {
  export function load(url: string, callback: (err: any, font: any) => void): void;
  export function parse(buffer: ArrayBuffer): any;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}
