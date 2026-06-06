/**
 * AdBlock detection using three independent local-only methods.
 * We deliberately avoid external ad-network URLs (e.g. googlesyndication)
 * to prevent false positives on corporate proxies and GDPR-heavy regions.
 */

const BAIT_CLASSES =
  "adsbox pub_300x250 ad-placement ad-header doubleclick sponsor-post ad-banner";

/** Method 1 — fetch bait: most reliable, catches network-level blocking */
async function fetchBait(): Promise<boolean> {
  try {
    const res = await fetch(`/ads.js?_=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
    });
    return !res.ok;
  } catch {
    return true;
  }
}

/** Method 2 — script bait: catches blockers that block script loads */
function scriptBait(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    // Flag is pre-set to true; /ads.js flips it to false on success
    (window as any).__adCheckFlag = true;
    script.src = `/ads.js?_s=${Date.now()}`;
    script.async = true;
    script.onload = () => resolve((window as any).__adCheckFlag === true);
    script.onerror = () => resolve(true);
    document.head.appendChild(script);
    setTimeout(() => {
      document.head.contains(script) && document.head.removeChild(script);
    }, 2000);
  });
}

/** Method 3 — DOM bait: catches cosmetic/CSS-based hiding */
function domBait(): Promise<boolean> {
  return new Promise((resolve) => {
    const bait = document.createElement("div");
    bait.innerHTML = "&nbsp;";
    bait.className = BAIT_CLASSES;
    Object.assign(bait.style, {
      position: "absolute",
      top: "-99999px",
      left: "-99999px",
      height: "10px",
      width: "10px",
      pointerEvents: "none",
    });
    document.body.appendChild(bait);

    // Allow a paint cycle so CSS rules from extensions can apply
    requestAnimationFrame(() => {
      setTimeout(() => {
        const s = window.getComputedStyle(bait);
        const hidden =
          bait.offsetHeight === 0 ||
          bait.offsetWidth === 0 ||
          s.display === "none" ||
          s.visibility === "hidden" ||
          s.opacity === "0";
        document.body.contains(bait) && document.body.removeChild(bait);
        resolve(hidden);
      }, 150);
    });
  });
}

/**
 * Run all three detection methods in parallel.
 * Returns true only if at least two methods agree (majority vote),
 * which minimises false positives from transient network glitches.
 */
export async function detectAdBlock(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const [fetch_, script_, dom_] = await Promise.all([
    fetchBait(),
    scriptBait(),
    domBait(),
  ]);

  const votes = [fetch_, script_, dom_].filter(Boolean).length;
  return votes >= 2;
}
