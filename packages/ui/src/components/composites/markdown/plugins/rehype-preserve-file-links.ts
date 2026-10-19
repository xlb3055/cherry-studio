import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

export const FILE_LINK_MARKER_PROPERTY = 'dataMarkdownFileHref'
export const FILE_IMAGE_MARKER_PROPERTY = 'dataMarkdownFileSrc'

const URI_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i
const WINDOWS_DRIVE_PATH_PATTERN = /^[a-z]:[/\\]/i
const ASCII_CONTROL_CHARACTER_MAX_CODE = 0x1f
const ASCII_DELETE_CHARACTER_CODE = 0x7f

function containsAsciiControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= ASCII_CONTROL_CHARACTER_MAX_CODE || code === ASCII_DELETE_CHARACTER_CODE) return true
  }
  return false
}

function isFileLinkHref(href: unknown): href is string {
  if (
    typeof href !== 'string' ||
    !href ||
    href.startsWith('#') ||
    href.startsWith('//') ||
    href.startsWith(' ') ||
    containsAsciiControlCharacter(href)
  ) {
    return false
  }
  return WINDOWS_DRIVE_PATH_PATTERN.test(href) || !URI_SCHEME_PATTERN.test(href)
}

export function rehypePrepareFileLinks() {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element) => {
      delete node.properties[FILE_LINK_MARKER_PROPERTY]
      delete node.properties[FILE_IMAGE_MARKER_PROPERTY]

      if (node.tagName === 'a' && typeof node.properties.href === 'string') {
        if (node.properties.href.startsWith('//')) node.properties.href = `https:${node.properties.href}`
      }
      if (node.tagName === 'img' && typeof node.properties.src === 'string') {
        if (node.properties.src.startsWith('//')) node.properties.src = `https:${node.properties.src}`
        // A relative or drive-form image is a local file, same class as a schemeless link.
        // Leaving it as `img` lets harden's text-only image policy drop it, so park it as a
        // span the way file links are parked, and restore the img after harden.
        if (isFileLinkHref(node.properties.src)) {
          node.tagName = 'span'
          node.properties[FILE_IMAGE_MARKER_PROPERTY] = node.properties.src
          delete node.properties.src
        }
      }
      if (node.tagName !== 'a' || !isFileLinkHref(node.properties.href)) return

      node.tagName = 'span'
      node.properties[FILE_LINK_MARKER_PROPERTY] = node.properties.href
      delete node.properties.href
    })
  }
}

export function rehypeRestoreFileLinks() {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element) => {
      const imageSrc = node.properties[FILE_IMAGE_MARKER_PROPERTY]
      if (node.tagName === 'span' && typeof imageSrc === 'string') {
        node.tagName = 'img'
        node.properties.src = imageSrc
        delete node.properties[FILE_IMAGE_MARKER_PROPERTY]
      }

      const href = node.properties[FILE_LINK_MARKER_PROPERTY]
      if (node.tagName !== 'span' || typeof href !== 'string') return

      node.tagName = 'a'
      node.properties.href = href
      delete node.properties[FILE_LINK_MARKER_PROPERTY]
    })
  }
}
