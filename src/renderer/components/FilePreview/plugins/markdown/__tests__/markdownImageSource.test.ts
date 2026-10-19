import { describe, expect, it } from 'vitest'

import type { AbsoluteFilePath } from '@shared/types/file'

import { markdownDocumentDirectory, resolveMarkdownPreviewImageSrc } from '../markdownImageSource'

const documentPath = '/tmp/workspace/docs/note.md' as AbsoluteFilePath
const workspacePath = '/tmp/workspace' as AbsoluteFilePath

describe('resolveMarkdownPreviewImageSrc', () => {
  it('resolves a relative image against the document directory, not the workspace root', () => {
    expect(markdownDocumentDirectory(documentPath)).toBe('/tmp/workspace/docs')
    expect(resolveMarkdownPreviewImageSrc('./images/diagram.png', documentPath, workspacePath)).toBe(
      'file:///tmp/workspace/docs/images/diagram.png'
    )
    expect(resolveMarkdownPreviewImageSrc('images/icon.svg', documentPath, workspacePath)).toBe(
      'file:///tmp/workspace/docs/images/icon.svg'
    )
  })

  it('keeps full-width parentheses and the middle dot in the encoded file URL', () => {
    expect(resolveMarkdownPreviewImageSrc('./报告（终稿）·图.png', documentPath, workspacePath)).toBe(
      'file:///tmp/workspace/docs/%E6%8A%A5%E5%91%8A%EF%BC%88%E7%BB%88%E7%A8%BF%EF%BC%89%C2%B7%E5%9B%BE.png'
    )
  })

  it('passes remote and data sources through unchanged', () => {
    expect(resolveMarkdownPreviewImageSrc('https://example.com/a.png', documentPath, workspacePath)).toBe(
      'https://example.com/a.png'
    )
    expect(resolveMarkdownPreviewImageSrc('data:image/png;base64,aGVsbG8=', documentPath, workspacePath)).toBe(
      'data:image/png;base64,aGVsbG8='
    )
  })

  it('refuses a relative image that climbs out of the workspace', () => {
    expect(resolveMarkdownPreviewImageSrc('../../../../etc/passwd', documentPath, workspacePath)).toBeNull()
    expect(resolveMarkdownPreviewImageSrc('/etc/passwd', documentPath, workspacePath)).toBeNull()
  })

  it('keeps a Windows drive root when the document sits there', () => {
    expect(markdownDocumentDirectory('C:\\note.md' as AbsoluteFilePath)).toBe('C:\\')
    expect(markdownDocumentDirectory('C:/note.md' as AbsoluteFilePath)).toBe('C:/')
  })

  it('resolves a Windows drive image that stays inside the workspace', () => {
    const windowsDocument = 'C:/notes/docs/note.md' as AbsoluteFilePath
    const windowsWorkspace = 'C:/notes' as AbsoluteFilePath
    expect(resolveMarkdownPreviewImageSrc('./images/diagram.png', windowsDocument, windowsWorkspace)).toBe(
      'file:///C:/notes/docs/images/diagram.png'
    )
    expect(resolveMarkdownPreviewImageSrc('D:/other/secret.png', windowsDocument, windowsWorkspace)).toBeNull()
  })
})
