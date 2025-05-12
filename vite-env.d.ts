/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // agrega más variables si es necesario
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
