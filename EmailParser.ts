import { load } from "cheerio";

export class EmailContent {

  constructor() {
  }

  static getTemporaryPassword(html: string) {
    const $ = load(html);
    const $selector = $('p:contains("temporary password below")');
    if (!$selector.html()) return null;
    const [_, pwd] = $selector.html()!.trim().split(`<br>`);
    return pwd.match(/\[(.*?)\]/)![1];
  }
}
