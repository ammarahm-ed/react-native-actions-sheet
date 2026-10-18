<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import AnimatedLogo from './components/AnimatedLogo.vue';
import HomeSearch from './components/HomeSearch.vue';

const {Layout} = DefaultTheme;
</script>

<template>
  <Layout>
    <!-- Animated logo replaces the static hero image -->
    <template #home-hero-image>
      <AnimatedLogo />
    </template>

    <!-- Prominent search box under the hero actions -->
    <template #home-hero-after>
      <HomeSearch />
    </template>
  </Layout>
</template>
