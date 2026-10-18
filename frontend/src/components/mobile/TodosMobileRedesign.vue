<template>
  <div class="todos-wrapper">
    <div class="todo-header-add">
      <div class="todo-header"></div>
      <div class="todo-add-btn"></div>
    </div>
    <div class="todo-list">
      <div class="todo-item" v-for="todo in todos" :key="todo.id">
        <div class="todo-date">
          {{ todo.created_at }}
        </div>
        {{ todo.title }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { createClient } from "@supabase/supabase-js";
import { ref } from "vue";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const todos = ref<Todo[]>([]);

type TodoComment = {
  id?: string;
  comment: string;
  author: string | null;
};

type Todo = {
  created_at: string;
  id: string;
  title: string;
  is_completed: boolean;
  todo_comments: TodoComment[];
};

const fetchTodos = async () => {
  const { data, error } = await supabase
    .from("todos")
    .select(
      "id, title, is_completed, created_at, todo_comments(id, comment, author, created_at)",
    )
    .eq("is_tonight", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fel vid hämtning av todos:", error);
    return;
  }

  todos.value = (data || []).map((todo) => ({
    ...todo,
    is_completed: todo.is_completed === true,
  })) as Todo[];
};
fetchTodos();
</script>

<style>
.todos-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.todo-item {
  padding: 12px;
  margin: 8px 0;
  border-radius: 100px;
  background-color: #f0f0f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
</style>
