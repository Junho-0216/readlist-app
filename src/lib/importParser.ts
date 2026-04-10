import type { Bookmark } from './types'

type BookmarkDraft = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'read'>

export function parseNetscapeBookmarks(html: string): BookmarkDraft[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const links = Array.from(doc.querySelectorAll('a[href]'))

  return links
    .filter((a) => /^https?:\/\//.test((a as HTMLAnchorElement).href))
    .map((a) => {
      const el = a as HTMLAnchorElement
      const tagsAttr = el.getAttribute('TAGS') ?? el.getAttribute('tags') ?? ''
      return {
        url: el.href,
        title: el.textContent?.trim() || el.href,
        memo: '',
        tags: tagsAttr ? tagsAttr.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }
    })
}
