
declare module "hypher" {
  export default class Hypher {
    constructor(pattern: any);
    hyphenate(word: string): string[];
    hyphenateText(text: string): string;
  }
}

declare module "hyphenation.nl" {
  const patterns: any;
  export default patterns;
}
