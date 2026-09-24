```vue
<template>
  <main class="login-page">
    <div class="login-logo-container">
      <img
        src="../../assets/halla_logo.jpg"
        alt="Halla Logo"
        class="login-logo"
      />
    </div>
    <!-- Mock login, will implement real authentication later -->
    <div class="login-card">
      <h1>Kollo-Koll</h1>

      <p class="subtitle">Ange PIN-kod för att logga in</p>

      <form @submit.prevent="handleLogin">
        <input
          v-model="pin"
          type="password"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="6"
          placeholder="PIN-kod"
          autocomplete="off"
        />

        <p v-if="errorMessage" class="error">
          {{ errorMessage }}
        </p>

        <button type="submit" @click="handleLogin">Logga in</button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import router from "../../router";

const pin = ref("");
const errorMessage = ref("");

function handleLogin() {
  errorMessage.value = "";

  if (!pin.value) {
    errorMessage.value = "Ange din PIN-kod.";
    return;
  }

  router.push("/dashboard");

  console.log("PIN:", pin.value);
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  flex-direction: column;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background: #f5f5f5;
}

.login-logo-container {
  margin-bottom: 24px;
  text-align: center;
}

.login-logo {
  width: 120px;
  height: auto;
}

.login-card {
  width: 100%;
  max-width: 360px;
  padding: 32px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

h1 {
  margin: 0;
  text-align: center;
  font-size: 28px;
  color: #333;
}

.subtitle {
  margin: 10px 0 28px;
  text-align: center;
  color: #666;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

input {
  width: 100%;
  padding: 14px 16px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 4px;
  outline: none;
}

input:focus {
  border-color: #555;
}

button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #222;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

button:active {
  transform: scale(0.98);
}

.error {
  margin: 0;
  color: #c62828;
  text-align: center;
  font-size: 14px;
}
</style>
```
