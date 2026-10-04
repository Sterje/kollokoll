<template>
  <div class="menu-mobile-wrapper">
    <div class="menu-mobile-content">
      <div class="menu-mobile-item" id="one" @click="router.push('/tonight')">
        <span class="menu-mobile-badge">{{ tonightCount }}</span>
        <ListTodo :size="35" />
        <span class="menu-mobile-text">Kväll / Helg</span>
      </div>
      <div class="menu-mobile-item" id="two" @click="router.push('/todos')">
        <span class="menu-mobile-badge">{{ todosCount }}</span>
        <ListTodo :size="35" />
        <span class="menu-mobile-text">Att göra</span>
      </div>
    </div>
    <InfoMobile />
    <!-- Monteras dolda enbart för att få antalet todos via emit -->
    <div hidden>
      <TodoTonight @count="tonightCount = $event" />
      <TodosMobile @count="todosCount = $event" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import InfoMobile from "../../components/mobile/InfoMobile.vue";
import TodoTonight from "../../components/mobile/TodoTonight.vue";
import TodosMobile from "../../components/mobile/TodosMobile.vue";
import { ListTodo } from "lucide-vue-next";

const router = useRouter();
const tonightCount = ref(0);
const todosCount = ref(0);
</script>
<style scoped>
.menu-mobile-wrapper {
  display: flex;
  flex-direction: column;
}

.menu-mobile-content {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  justify-content: space-between;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
}

.menu-mobile-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 10px 0;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  width: calc(50% - 20px); /* Adjust the width as needed */
  height: 100px; /* Adjust the height as needed */
  box-sizing: border-box;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-family: Arial, Helvetica, sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

#two {
  background-color: #2843bb;
  color: #ffffff;
}
.menu-mobile-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 11px;
  background-color: #ffffff;
  color: #1e293b;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}

.menu-mobile-text {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 5px;
}
#one {
  background-color: #ca0b0b;
  color: #ffffff;
}
</style>
