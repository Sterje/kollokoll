<template>
  <div class="todos-wrapper">
    <button class="back-button" aria-label="Tillbaka">
      <ChevronLeft :size="30" />
    </button>
    <div class="todo-header-add">
      <div class="todo-header">
        <h2>{{ formatedDate(date) }}</h2>
        <button class="todo-card-add-btn" aria-label="Lägg till uppgift">
          <Plus :size="30" />
        </button>
      </div>
      <div class="todo-add-btn"></div>
    </div>
    <div class="todo-list">
      <div class="todo-item" v-for="todo in todos" :key="todo.id">
        <div class="todo-checkbox"></div>
        <div class="todo-content">
          <div class="todo-date-author-container">
            <div class="todo-date">
              {{ formatedCreatedAt(todo.created_at) }}
            </div>
            <div class="todo-author">Jesper</div>
          </div>
          <div class="todo-title">
            {{ todo.title }}
          </div>
          <div
            v-if="todo.todo_comments && todo.todo_comments.length > 0"
            class="comments-list"
          >
            <p
              v-for="comment in todo.todo_comments"
              :key="comment.id"
              class="comment"
            >
              <span v-if="comment.author" class="comment-author"
                >{{ comment.author }}:</span
              >
              {{ comment.comment }}
            </p>
          </div>
        </div>
        <div class="todo-comment-btn">
          <button
            class="todo-card-content-comment-button"
            aria-label="Kommentera"
          >
            <MessageCircleMore :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { createClient } from "@supabase/supabase-js";
import { ref } from "vue";
import { MessageCircleMore, Plus, ChevronLeft } from "lucide-vue-next";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const todos = ref<Todo[]>([]);
const date = new Date();

const formatedDate = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
  }).format(date);

const formatedCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(createdAt));

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
  author: string | null;
};

const fetchTodos = async () => {
  const { data, error } = await supabase
    .from("todos")
    .select(
      "id, title, is_completed, created_at, author, todo_comments(id, comment, author, created_at)",
    )
    .eq("is_tonight", true)
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
  font-family: Arial, sans-serif;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  color: #000000;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-card-add-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #000000;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  margin: 8px 0;
  border-radius: 20px;
  /* background-color: #f4f7ff; */
  background-color: #fff196;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.todo-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #89898b;
  background-color: #fff;
  border-radius: 50%;
  margin-right: 12px;
}

.todo-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.todo-date-author-container {
  display: flex;
}

.todo-author {
  font-size: 12px;
  color: #888;
  margin-left: 8px;
  font-weight: bold;
}

.todo-card-content-comment-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #000000;
}

.todo-date {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.todo-title {
  font-size: 16px;
}

.comments-list {
  margin-top: 8px;
}

.comment {
  font-size: 14px;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: bold;
  margin-right: 4px;
}
</style>
