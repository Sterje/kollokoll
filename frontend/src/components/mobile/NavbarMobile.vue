<template>
  <nav class="mobile-navbar">
    <div class="mobile-navbar-content">
      <div class="mobile-navbar-spacer"></div>
      <div class="mobile-navbar-logo">
        <img
          src="../../assets/apple-touch-icon.png"
          alt="Apple Touch Icon"
          class="mobile-navbar-logo-img"
        />
      </div>
      <div class="mobile-navbar-refresh">
        <button
          class="mobile-navbar-refresh-button"
          aria-label="Uppdatera"
          @click="$router.go(0)"
        >
          <RotateCw :size="30" />
        </button>
      </div>
    </div>
  </nav>
</template>
<script setup lang="ts">
import { RotateCw } from "lucide-vue-next";
</script>
<style scoped>
/* .mobile-navbar {
  background-color: #ffffff;
  padding: 0.5rem;

  .mobile-navbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .mobile-navbar-logo {
      width: 25%;
      .mobile-navbar-logo-img {
        height: 75px;
        width: auto;
      }
    }
    .mobile-navbar-header {
      width: 50%;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    .mobile-navbar-spacer {
      width: 25%;
    }
  }
} */

.mobile-navbar {
  background-color: #ffffff;
  padding: 0.5rem;
}

.mobile-navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-navbar-logo {
  width: 25%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mobile-navbar-logo-img {
  height: 75px;
  width: auto;
}

.mobile-navbar-spacer {
  width: 25%;
}

.mobile-navbar-refresh {
  width: 25%;
  display: flex;
  justify-content: flex-end;
}

.mobile-navbar-refresh-button {
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 1.5rem;
  color: #000000;
}
</style>
