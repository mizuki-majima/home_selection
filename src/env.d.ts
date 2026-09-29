/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** ページ内の出典レジストリ（src/lib/sources.ts） */
    __sources?: unknown;
    /** ページ内の連番（src/lib/uid.ts） */
    __uid?: number;
  }
}
