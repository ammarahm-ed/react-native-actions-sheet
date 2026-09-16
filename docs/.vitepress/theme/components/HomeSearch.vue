<script setup lang="ts">
import {onMounted, ref} from 'vue';

const meta = ref('Ctrl');

onMounted(() => {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)) {
    meta.value = '⌘';
  }
});

function openSearch() {
  // Prefer clicking VitePress' own search button so we reuse its modal.
  const btn = document.querySelector<HTMLButtonElement>(
    '.VPNavBarSearch .DocSearch-Button, .VPNavBarSearch button, #local-search button',
  );
  if (btn) {
    btn.click();
    return;
  }
  // Fallback: fire the keyboard shortcut VitePress listens for.
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    }),
  );
}
</script>

<template>
  <div class="home-search">
    <button class="home-search__box" type="button" @click="openSearch" aria-label="Search the docs">
      <svg class="home-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <span class="home-search__label">Search the documentation…</span>
      <span class="home-search__kbd"><kbd>{{ meta }}</kbd><kbd>K</kbd></span>
    </button>
  </div>
</template>

<style scoped>
.home-search {
  margin-top: 28px;
  margin-bottom: 28px;
  display: flex;
  justify-content: center;
}

.home-search__box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 460px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.home-search__box:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 6px 22px -14px rgba(236, 43, 43, 0.6);
  background: var(--vp-c-bg);
}

.home-search__icon {
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.home-search__label {
  flex: 1;
  text-align: left;
  font-size: 14px;
}

.home-search__kbd {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.home-search__kbd kbd {
  font-family: var(--vp-font-family-base);
  font-size: 11px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
}
</style>
