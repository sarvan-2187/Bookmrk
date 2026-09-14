// In-page toast for Quick Save feedback, triggered by background.ts via
// chrome.tabs.sendMessage({type: 'bookmrk_toast', ...}). Rendered directly on
// the page (not shadow-DOM isolated) because it's a single positioned div
// with inline styles, not a full UI surface — nothing here can collide with
// host-page CSS.
//
// Extension.js calls the default export on injection and calls the returned
// cleanup on HMR/teardown.
export default function initial() {
  const listener = (message: any) => {
    if (message?.type === 'bookmrk_toast') {
      showToast(message.text || 'Saved', message.level === 'error' ? 'error' : 'success')
    }
  }

  chrome.runtime.onMessage.addListener(listener)

  return () => {
    chrome.runtime.onMessage.removeListener(listener)
    document.getElementById('bookmrk-toast')?.remove()
  }
}

function showToast(text: string, level: 'success' | 'error') {
  document.getElementById('bookmrk-toast')?.remove()

  const toast = document.createElement('div')
  toast.id = 'bookmrk-toast'
  toast.textContent = text
  toast.setAttribute('role', 'status')
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    padding: 10px 14px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    color: #fff;
    font-family: sans-serif;
    font-size: 14px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 180ms ease, transform 200ms ease;
    background: ${level === 'success' ? '#10b981' : '#ef4444'};
  `

  document.documentElement.appendChild(toast)
  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  })

  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 220)
  }, 2800)
}
