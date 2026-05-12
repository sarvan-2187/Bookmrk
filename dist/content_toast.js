// Simple in-page toast for Bookmrk
(function() {
  function showToast(text, level = 'success') {
    try {
      const existing = document.getElementById('bookmrk-toast');
      if (existing) existing.remove();

      const div = document.createElement('div');
      div.id = 'bookmrk-toast';
      div.textContent = text;
      div.style.position = 'fixed';
      div.style.bottom = '24px';
      div.style.right = '24px';
      div.style.zIndex = 2147483647;
      div.style.padding = '10px 14px';
      div.style.borderRadius = '8px';
      div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      div.style.color = '#fff';
      div.style.fontFamily = 'sans-serif';
      div.style.fontSize = '14px';
      div.style.opacity = '0';
      div.style.transition = 'opacity 180ms ease, transform 200ms ease';
      if (level === 'success') {
        div.style.background = '#10b981';
      } else {
        div.style.background = '#ef4444';
      }

      document.documentElement.appendChild(div);
      // Force reflow
      void div.offsetWidth;
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';

      setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => { div.remove(); }, 220);
      }, 2800);
    } catch (e) {
      // ignore
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'bookmrk_toast') {
      showToast(msg.text || 'Saved', msg.level || 'success');
    }
  });
})();
