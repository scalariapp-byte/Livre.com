/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Numéro de compilation injecté par GitHub Actions (0 en local). */
  readonly VITE_APP_BUILD?: string;
}
