import { parseFileLinkHref } from '@renderer/utils/filePath'
import { normalizeFilePreviewPath } from '@renderer/utils/filePreview'
import { isPathInside, isSamePath, joinPath } from '@renderer/utils/path'
import { type AbsoluteFilePath, AbsoluteFilePathSchema } from '@shared/types/file'
import { toFileUrl } from '@shared/utils/file'

const REMOTE_IMAGE_SRC_PATTERN = /^(?:https?:|data:|blob:|cherry-media:)/i

/**
 * Directory a relative Markdown image resolves against: the document's own folder,
 * not the workspace root. `./images/a.png` next to `docs/note.md` is `docs/images/a.png`.
 */
export function markdownDocumentDirectory(filePath: AbsoluteFilePath): AbsoluteFilePath {
  const separator = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  if (separator <= 0) return AbsoluteFilePathSchema.parse(separator === 0 ? '/' : filePath)
  const dir = filePath.slice(0, separator)
  // `C:\note.md` and `C:/note.md` both sit in the drive root, which must keep its separator.
  if (/^[A-Za-z]:$/.test(dir)) return AbsoluteFilePathSchema.parse(`${dir}${filePath[separator]}`)
  return AbsoluteFilePathSchema.parse(dir)
}

/**
 * Turn a Markdown image `src` into a URL the preview `<img>` can load.
 *
 * Remote and data sources pass through. A schemeless or drive-form source is a local
 * file: resolve it against the document directory, then refuse anything outside the
 * workspace. The renderer cannot fetch a raw relative path, and `file://` is the
 * form Electron image loading already accepts for files the user opened.
 */
export function resolveMarkdownPreviewImageSrc(
  src: string,
  documentPath: AbsoluteFilePath,
  workspacePath: AbsoluteFilePath
): string | null {
  if (!src || REMOTE_IMAGE_SRC_PATTERN.test(src)) return src

  const filePath = parseFileLinkHref(src)
  if (!filePath) return null

  const absolute = AbsoluteFilePathSchema.safeParse(filePath).success
    ? filePath
    : joinPath(markdownDocumentDirectory(documentPath), filePath)

  let normalized: AbsoluteFilePath
  try {
    normalized = normalizeFilePreviewPath(absolute)
  } catch {
    return null
  }

  if (!isSamePath(normalized, workspacePath) && !isPathInside(normalized, workspacePath)) return null
  return toFileUrl(normalized)
}
