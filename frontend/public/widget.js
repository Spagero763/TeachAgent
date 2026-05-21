/**
 * TeachAgent Widget
 * Drop verified Celo blockchain Q&A into any website with one line:
 *
 *   <script src="https://teach-agent.vercel.app/widget.js"></script>
 *
 * Optional config (set BEFORE the script tag):
 *   <script>
 *     window.TeachAgentConfig = {
 *       position: "bottom-right", // or "bottom-left"
 *       color: "#35D07F",          // accent color
 *       label: "Ask about Celo"    // launcher tooltip
 *     }
 *   </script>
 *
 * The panel embeds the live TeachAgent app, so wallet connection,
 * the free first question, and onchain payments all work as normal.
 *
 * Built by Afolabi Emmanuel (Spagero) · ERC-8004 Agent #9099
 */
(function () {
  if (window.__teachAgentWidgetLoaded) return
  window.__teachAgentWidgetLoaded = true

  var cfg = window.TeachAgentConfig || {}
  var APP_URL = cfg.appUrl || "https://teach-agent.vercel.app"
  var COLOR = cfg.color || "#35D07F"
  var POSITION = cfg.position === "bottom-left" ? "left" : "right"
  var LABEL = cfg.label || "Ask about Celo"

  var open = false

  // ── Launcher button ──
  var btn = document.createElement("button")
  btn.setAttribute("aria-label", LABEL)
  btn.style.cssText = [
    "position:fixed", "bottom:20px", POSITION + ":20px", "z-index:2147483000",
    "width:58px", "height:58px", "border-radius:50%", "border:none", "cursor:pointer",
    "background:linear-gradient(135deg," + COLOR + " 0%,#19B35A 100%)",
    "box-shadow:0 6px 20px rgba(53,208,127,0.4)", "display:flex",
    "align-items:center", "justify-content:center", "transition:transform .15s ease",
    "padding:0",
  ].join(";")
  btn.onmouseenter = function () { btn.style.transform = "scale(1.08)" }
  btn.onmouseleave = function () { btn.style.transform = "scale(1)" }

  // Logo mark (T) inside launcher
  btn.innerHTML =
    '<svg width="30" height="30" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="10" y="14" width="28" height="5" rx="2.5" fill="white"/>' +
    '<rect x="21.5" y="19" width="5" height="16" rx="2.5" fill="white"/>' +
    '<circle cx="24" cy="35" r="2.5" fill="rgba(255,255,255,0.7)"/></svg>'

  // ── Chat panel (iframe of the live app) ──
  var panel = document.createElement("div")
  panel.style.cssText = [
    "position:fixed", "bottom:90px", POSITION + ":20px", "z-index:2147483000",
    "width:390px", "max-width:calc(100vw - 40px)", "height:600px",
    "max-height:calc(100vh - 120px)", "background:#fff", "border-radius:18px",
    "box-shadow:0 12px 48px rgba(15,31,22,0.25)", "overflow:hidden",
    "border:1px solid #E2EAE5", "display:none", "flex-direction:column",
    "opacity:0", "transform:translateY(12px)", "transition:opacity .2s ease,transform .2s ease",
  ].join(";")

  // Header
  var header = document.createElement("div")
  header.style.cssText = [
    "display:flex", "align-items:center", "justify-content:space-between",
    "padding:12px 16px", "background:linear-gradient(135deg," + COLOR + " 0%,#19B35A 100%)",
    "flex-shrink:0",
  ].join(";")
  header.innerHTML =
    '<span style="color:#fff;font-weight:700;font-size:15px;font-family:system-ui,-apple-system,sans-serif">TeachAgent</span>'

  var closeBtn = document.createElement("button")
  closeBtn.setAttribute("aria-label", "Close")
  closeBtn.style.cssText = "background:rgba(255,255,255,0.2);border:none;color:#fff;width:26px;height:26px;border-radius:8px;cursor:pointer;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center"
  closeBtn.innerHTML = "&times;"
  closeBtn.onclick = toggle
  header.appendChild(closeBtn)

  var iframe = document.createElement("iframe")
  iframe.style.cssText = "border:none;width:100%;flex:1;background:#F0F4F1"
  iframe.title = "TeachAgent — Celo AI tutor"
  iframe.loading = "lazy"

  panel.appendChild(header)
  panel.appendChild(iframe)

  function toggle() {
    open = !open
    if (open) {
      if (!iframe.src) iframe.src = APP_URL
      panel.style.display = "flex"
      requestAnimationFrame(function () {
        panel.style.opacity = "1"
        panel.style.transform = "translateY(0)"
      })
    } else {
      panel.style.opacity = "0"
      panel.style.transform = "translateY(12px)"
      setTimeout(function () { if (!open) panel.style.display = "none" }, 200)
    }
  }

  btn.onclick = toggle

  function mount() {
    document.body.appendChild(btn)
    document.body.appendChild(panel)
  }
  if (document.body) mount()
  else document.addEventListener("DOMContentLoaded", mount)
})();
