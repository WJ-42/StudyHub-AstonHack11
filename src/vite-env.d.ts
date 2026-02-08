/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'papaparse' {
  export function parse<T>(input: string, options?: { skipEmptyLines?: boolean }): { data: T[] }
}

declare module 'docx-preview' {
  interface RenderOptions {
    className?: string
    breakPages?: boolean
    inWrapper?: boolean
    ignoreLastRenderedPageBreak?: boolean
  }
  export function renderAsync(
    document: Blob | ArrayBuffer | Uint8Array,
    bodyContainer: HTMLElement,
    styleContainer: HTMLElement,
    options?: RenderOptions
  ): Promise<unknown>
}
