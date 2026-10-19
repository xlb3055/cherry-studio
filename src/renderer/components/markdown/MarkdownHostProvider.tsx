import { type ReactNode, useMemo } from 'react'

import { type MarkdownHost, MarkdownHostContext } from './useMarkdownHost'

interface MarkdownHostProviderProps extends MarkdownHost {
  children: ReactNode
}

export function MarkdownHostProvider({
  children,
  openFilePath,
  openExternalUrl,
  copyRichContent,
  exportTableAsExcel,
  notifySuccess,
  notifyError,
  resolveImageSrc
}: MarkdownHostProviderProps) {
  const value = useMemo(
    () => ({
      openFilePath,
      openExternalUrl,
      copyRichContent,
      exportTableAsExcel,
      notifySuccess,
      notifyError,
      resolveImageSrc
    }),
    [openFilePath, openExternalUrl, copyRichContent, exportTableAsExcel, notifySuccess, notifyError, resolveImageSrc]
  )
  return <MarkdownHostContext value={value}>{children}</MarkdownHostContext>
}
