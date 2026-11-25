"use strict";

const releases = "https://github.com/yjid/kensaku/releases";
const latest = releases + "/latest";
const endpoint = "https://api.github.com/repos/yjid/kensaku/releases/latest";

function highlightPlatform() {
  const agent = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || agent;

  if (navigator.userAgentData?.mobile ||
      /Android|iPhone|iPad|iPod|Windows Phone|CrOS|Mobile/i.test(agent) ||
      (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1)) {
    return;
  }

  let name;
  if (/Windows/i.test(platform)) name = "windows";
  else if (/macOS|Macintosh/i.test(platform)) name = "macos";
  else if (/Linux/i.test(platform)) name = "linux";

  if (name) {
    const card = document.querySelector(`[data-platform="${name}"]`);
    card.classList.add("recommended");
    card.querySelector(".platform-badge").hidden = false;
  }
}

function useReleasePage(link) {
  link.href = latest;
  link.removeAttribute("aria-label");
  link.textContent = link.textContent.trim().replace(/\s*↓$/, "") + " · Releases ↗";
}

async function updateDownloads() {
  const links = document.querySelectorAll("[data-asset]");
  const status = document.querySelector("[data-release-status]");

  try {
    const response = await fetch(endpoint, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: globalThis.AbortSignal?.timeout?.(4500),
    });
    if (!response.ok) throw new Error("Release lookup failed");

    const release = await response.json();
    if (!/^v\d+\.\d+\.\d+$/.test(release.tag_name) || !Array.isArray(release.assets)) {
      throw new Error("Unexpected release metadata");
    }

    const { tag_name: tag, assets } = release;
    const filenames = new Set(assets.map((asset) => asset?.name));
    for (const link of links) {
      const filename = link.dataset.asset.replace("{version}", tag.slice(1));
      if (filenames.has(filename)) {
        link.href = `${releases}/download/${tag}/${filename}`;
      } else {
        useReleasePage(link);
      }
    }
    status.textContent = `Release ${tag}`;
  } catch {
    for (const link of links) useReleasePage(link);
    status.textContent = "Latest release on GitHub";
  }
}

highlightPlatform();
updateDownloads();
