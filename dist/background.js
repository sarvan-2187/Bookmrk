// Bookmrk Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("Bookmrk MVP Installed");
  
  // Register context menu
  chrome.contextMenus.create({
    id: "save-to-bookmrk",
    title: "Save to Bookmrk",
    contexts: ["page"]
  });
  
  // Inject content script into existing tabs so toasts work without reloading pages
  try {
    chrome.tabs.query({}, (tabs) => {
      for (const t of tabs) {
        try {
          if (!t.id || !t.url) continue;
          if (!t.url.startsWith('http')) continue;
          chrome.scripting.executeScript({
            target: { tabId: t.id },
            files: ['content_toast.js']
          }).catch(() => {});
        } catch (e) {
          // ignore
        }
      }
    });
  } catch (e) {
    // ignore
  }
});

// Ensure content script is injected into newly created tabs (some pages don't auto-inject)
chrome.tabs.onCreated.addListener((tab) => {
  try {
    if (!tab.id || !tab.url) return;
    if (!tab.url.startsWith('http')) return;
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content_toast.js'] }).catch(() => {});
  } catch (e) {}
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-bookmrk" && tab) {
    saveTabToBookmrk(tab);
  }
});

chrome.commands.onCommand.addListener((command) => {
  console.log("Command received:", command);
  if (command === "quick-save") {
    console.log("Quick save triggered");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("Active tabs:", tabs);
      if (tabs[0]) {
        saveTabToBookmrk(tabs[0]);
      }
    });
  }
});

function saveTabToBookmrk(tab) {
  console.log("saveTabToBookmrk called with tab:", tab);
  if (!tab.url) {
    console.log("No URL in tab");
    return;
  }
  
  // Basic implementation to read from chrome.storage.local, find first board or default
  chrome.storage.local.get(["bookmrk_data"], (result) => {
    console.log("Storage result:", result);
    let data = result["bookmrk_data"];
    // Ensure we have a valid data structure
    if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
      data = {
        version: 1,
        pages: [
          {
            id: crypto.randomUUID(),
            name: "Home",
            order: 0,
            boards: []
          }
        ]
      };
    }

    // Try to find an existing board named "Quick Saves" across pages
    let quickBoard = null;
    let quickBoardPage = null;
    for (const page of data.pages) {
      if (Array.isArray(page.boards)) {
        const found = page.boards.find((b) => b.name === "Quick Saves");
        if (found) {
          quickBoard = found;
          quickBoardPage = page;
          break;
        }
      }
    }

    // If not found, create the board under the first page
    if (!quickBoard) {
      quickBoardPage = data.pages[0];
      const newBoard = {
        id: crypto.randomUUID(),
        name: "Quick Saves",
        order: quickBoardPage.boards.length,
        bookmarks: []
      };
      quickBoardPage.boards.unshift(newBoard);
      quickBoard = newBoard;
      console.log('Created new "Quick Saves" board');
    }

    // Build the bookmark entry
    try {
      const newUrl = new URL(tab.url);
      const favicon = `https://www.google.com/s2/favicons?domain=${newUrl.hostname}&sz=64`;

      const newBookmark = {
        id: crypto.randomUUID(),
        url: tab.url,
        title: tab.title || newUrl.hostname,
        favicon: favicon,
        addedAt: Date.now()
      };

      // Check for duplicate by URL
      if (!Array.isArray(quickBoard.bookmarks)) quickBoard.bookmarks = [];
      const exists = quickBoard.bookmarks.find((b) => b.url === tab.url);
      if (exists) {
        // Notify tab of duplicate
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'bookmrk_toast', level: 'error', text: 'Already in Quick Saves' }, () => {});
        }
        console.log('Bookmark already exists in Quick Saves');
        return;
      }

      quickBoard.bookmarks.unshift(newBookmark);

      // Persist and notify
      chrome.storage.local.set({ "bookmrk_data": data }, () => {
        console.log("Saved to Quick Saves:", newBookmark);
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'bookmrk_toast', level: 'success', text: 'Saved to Quick Saves' }, () => {});
        }
      });
    } catch (err) {
      console.error('Failed to save bookmark:', err);
    }
  });
}
