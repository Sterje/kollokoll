<template>
  <nav class="mobile-navbar">
    <div class="mobile-navbar-content">
      <div class="mobile-navbar-logo">
        <img
          src="../../assets/halla_logo.jpg"
          alt="Halla Logo"
          class="mobile-navbar-logo-img"
        />
      </div>
      <div class="mobile-navbar-header">
        <h1>Kollo Koll</h1>
      </div>
      <div class="mobile-navbar-spacer">
        <img
          src="../../assets/apple-touch-icon.png"
          alt="Apple Touch Icon"
          class="mobile-navbar-spacer-img"
        />
      </div>
    </div>
  </nav>
</template>
<script setup lang="ts"></script>
<style scoped>
.mobile-navbar {
  background-color: #f8f8f8;
  padding: 0.5rem;

  .mobile-navbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .mobile-navbar-logo {
      width: 25%;
      .mobile-navbar-logo-img {
        width: 50px;
        height: auto;
      }
    }
    .mobile-navbar-header {
      width: 50%;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    .mobile-navbar-spacer {
      width: 25%;
      /* Place img on the right side */
      .mobile-navbar-spacer-img {
        width: 50px;
        height: auto;
        display: block;
        margin-left: auto;
      }
    }
  }
}
</style>
