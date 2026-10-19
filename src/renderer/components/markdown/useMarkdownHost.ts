import { createContext, use } from 'react'

export interface MarkdownHost {
  openExternalUrl?: (url: string) => void | Promise<void>
  copyRichContent?: (
    content: { plainText: string; html: string },
    options?: { successMessage?: string }
  ) => void | Promise<void>
  exportTableAsExcel?: (data: string[][]) => boolean | Promise<boolean>
  notifySuccess?: (message: string) => void
  notifyError?: (message: string) => void
  /** Opens a schemeless Markdown link as a local file in the owning surface. */
  openFilePath?: (path: string) => void | Promise<void>
  /**
   * Resolves a schemeless image `src` to a URL the renderer can load.
   * Absent means local images stay unresolved — chat markdown must not read the filesystem.
   */
  resolveImageSrc?: (src: string) => string | null
}

export const MarkdownHostContext = createContext<MarkdownHost | null>(null)

export function useMarkdownHost(): MarkdownHost {
  return use(MarkdownHostContext) ?? {}
}
