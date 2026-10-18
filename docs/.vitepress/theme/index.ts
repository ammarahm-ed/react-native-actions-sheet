import type {Theme} from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import Snack from './components/Snack.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({app}) {
    app.component('Snack', Snack);
  },
} satisfies Theme;
