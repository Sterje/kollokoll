<template>
  <div id="app">
    <NavbarMobile v-if="route.meta.showNavbar" />
    <RouterView />
  </div>
</template>
<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";
import NavbarMobile from "./components/mobile/NavbarMobile.vue";

const route = useRoute();
</script>
<style scoped></style>
