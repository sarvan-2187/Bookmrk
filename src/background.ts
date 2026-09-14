// Bookmrk background service worker.
//
// Owns the "quick save active tab" flow (toolbar command + context menu) by
// writing straight into the same chrome.storage.local shape the newtab app
// reads (see src/shared/types.ts / src/storage/local.ts). Firefox implements
// the chrome.* namespace as a compatibility alias in MV3 background scripts,
// so this file runs unchanged on both browsers — no browser branching needed.

const STORAGE_KEY = 'bookmrk_data'

// Mirrors src/shared/types.ts (Bookmark/Board/Page/BookmrkData). Duplicated
// here rather than imported because the background service worker and the
// newtab app are separate manifest entry points/bundles.
type StoredBookmark = {
  id: string
  url: string
  title: string
  favicon?: string
  addedAt: number
}

type StoredBoard = {
  id: string
  name: string
  order: number
  bookmarks: StoredBookmark[]
}

type StoredPage = {
  id: string
  name: string
  order: number
  boards: StoredBoard[]
}

type StoredData = {
  version: number
  pages: StoredPage[]
  [key: string]: unknown
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-bookmrk',
    title: 'Save to Bookmrk',
    contexts: ['page']
  })

  // Tabs already open at install time won't have the declarative
  // content_script (toast UI) yet until they next navigate/reload — Quick
  // Save itself still works (it only writes to chrome.storage.local), they
  // just won't show the confirmation toast until refreshed. Not worth
  // hardcoding the bundler's compiled content-script filename to fix.
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-bookmrk' && tab) {
    saveTabToBookmrk(tab)
  }
})

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'quick-save') return

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) saveTabToBookmrk(tabs[0])
  })
})

function saveTabToBookmrk(tab: chrome.tabs.Tab) {
  if (!tab.url) return

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    let data = result[STORAGE_KEY] as StoredData | undefined

    if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
      data = {
        version: 1,
        pages: [{id: crypto.randomUUID(), name: 'Home', order: 0, boards: []}]
      }
    }

    let quickBoard: StoredBoard | undefined
    let quickBoardPage: StoredPage | undefined
    for (const page of data.pages) {
      const found = page.boards?.find((board) => board.name === 'Quick Saves')
      if (found) {
        quickBoard = found
        quickBoardPage = page
        break
      }
    }

    if (!quickBoard) {
      quickBoardPage = data.pages[0]
      quickBoard = {
        id: crypto.randomUUID(),
        name: 'Quick Saves',
        order: quickBoardPage.boards.length,
        bookmarks: []
      }
      quickBoardPage.boards.unshift(quickBoard)
    }

    try {
      const url = new URL(tab.url!)
      const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`

      if (quickBoard!.bookmarks.some((bookmark) => bookmark.url === tab.url)) {
        notifyTab(tab.id, 'error', 'Already in Quick Saves')
        return
      }

      quickBoard!.bookmarks.unshift({
        id: crypto.randomUUID(),
        url: tab.url!,
        title: tab.title || url.hostname,
        favicon,
        addedAt: Date.now()
      })

      chrome.storage.local.set({[STORAGE_KEY]: data}, () => {
        notifyTab(tab.id, 'success', 'Saved to Quick Saves')
      })
    } catch (error) {
      console.error('[Bookmrk] Failed to save bookmark:', error)
    }
  })
}

function notifyTab(tabId: number | undefined, level: 'success' | 'error', text: string) {
  if (!tabId) return
  chrome.tabs.sendMessage(tabId, {type: 'bookmrk_toast', level, text}, () => {
    // No listener in the tab (e.g. chrome:// page) — ignore.
    void chrome.runtime.lastError
  })
}
