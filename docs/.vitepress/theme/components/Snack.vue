<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref} from 'vue';
import {useData} from 'vitepress';

const {isDark} = useData();
const mounted = ref(false);
let script: HTMLScriptElement | undefined;

onMounted(() => {
  mounted.value = true;
  script = document.createElement('script');
  script.src = 'https://snack.expo.dev/embed.js';
  script.async = true;
  document.body.appendChild(script);
});

onBeforeUnmount(() => {
  script?.remove();
});
</script>

<template>
  <ClientOnly>
    <div
      v-if="mounted"
      class="snack"
      data-snack-id="@ammarahmed/github.com-ammarahm-ed-react-native-actions-sheet:expo-example@develop"
      data-snack-platform="web"
      data-snack-preview="true"
      :data-snack-theme="isDark ? 'dark' : 'light'"
      :key="isDark ? 'dark' : 'light'" />
  </ClientOnly>
</template>

<style scoped>
.snack {
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  margin-top: 20px;
  height: 600px;
  width: 100%;
  touch-action: none;
}
</style>
