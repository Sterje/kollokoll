<template>
  <div class="todos-wrapper">
    <button class="back-button" aria-label="Tillbaka">
      <ChevronLeft :size="30" />
    </button>
    <div class="todo-header-add">
      <div class="todo-header">
        <h2>{{ formatedDate(date) }}</h2>
        <button
          class="todo-card-add-btn"
          aria-label="Lägg till uppgift"
          @click="openAddModalFunction()"
        >
          <Plus :size="30" />
        </button>
      </div>
      <div class="todo-add-btn"></div>
    </div>
    <div v-if="loading" class="loader-container">
      <div class="loader" role="status" aria-label="Laddar"></div>
    </div>
    <span v-else-if="!hasTodos && !loading" class="no-info">
      Inga uppgifter för tillfället, tryck på + knappen för att lägga till en
      uppgift.
    </span>
    <div v-else class="todo-list">
      <div class="todo-item" v-for="todo in todos" :key="todo.id">
        <div class="todo-checkbox"></div>
        <div class="todo-content">
          <div class="todo-date-author-container">
            <div class="todo-date">
              {{ formatedCreatedAt(todo.created_at) }}
            </div>
            <div class="todo-author">
              {{ todo.author }}
            </div>
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
  <Transition name="fade">
    <div
      v-if="openAddTodoModal"
      class="modal-overlay"
      @click.self="openAddTodoModal = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Lägg till uppgift</h3>
        </div>
        <textarea
          v-model="newTodoTitle"
          placeholder="Vad behöver göras?"
          class="modal-input modal-textarea"
        ></textarea>
        <input
          type="text"
          v-model="newTodoAuthor"
          class="modal-input"
          placeholder="Namn (frivilligt)"
        />
        <div class="modal-actions">
          <button type="button" @click="addTodo" class="btn btn-primary">
            Lägg till uppgift
          </button>
          <button
            type="button"
            @click="openAddTodoModal = false"
            class="btn btn-secondary"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import { createClient } from "@supabase/supabase-js";
import { ref, computed } from "vue";
import { MessageCircleMore, Plus, ChevronLeft } from "lucide-vue-next";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const todos = ref<Todo[]>([]);
const loading = ref(true);
const date = new Date();
const newTodoTitle = ref("");
const newTodoAuthor = ref("");

const openAddTodoModal = ref(false);

const hasTodos = computed(() => todos.value.length > 0);

const formatedDate = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
  }).format(date);

const formatedCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(createdAt));

const openAddModalFunction = () => {
  openAddTodoModal.value = true;
};

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
  loading.value = true;
  const { data, error } = await supabase
    .from("todos")
    .select(
      "id, title, is_completed, created_at, author, todo_comments(id, comment, author, created_at)",
    )
    .eq("is_tonight", true)
    .order("created_at", { ascending: false });

  loading.value = false;

  if (error) {
    console.error("Fel vid hämtning av todos:", error);
    return;
  }

  todos.value = (data || []).map((todo) => ({
    ...todo,
    is_completed: todo.is_completed === true,
  })) as Todo[];
};

const addTodo = async () => {
  const title = newTodoTitle.value.trim();
  const author = newTodoAuthor.value.trim();
  if (!title) return;

  const { data, error } = await supabase
    .from("todos")
    .insert({
      title,
      author,
      is_tonight: true,
      is_completed: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Fel vid tillägg av kvällens uppgift:", error);
    return;
  }
  await fetchTodos();
  newTodoTitle.value = "";
  openAddTodoModal.value = false;
  return data;
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

.loader-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.loader {
  width: 36px;
  height: 36px;
  border: 4px solid #e0e0e0;
  border-top-color: #000000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 100;
  padding: 0;
}

@media (min-width: 640px) {
  .modal-overlay {
    align-items: center;
    padding: 16px;
  }
}

.modal-card {
  width: 100%;
  max-width: 450px;
  background-color: var(--card-bg);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

@media (min-width: 640px) {
  .modal-card {
    border-radius: var(--radius-lg);
  }
}

.modal-header h3 {
  margin: 0 0 16px;
  font-size: 1.15rem;
  color: var(--text-main);
}

.modal-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  margin-bottom: 12px;
  box-sizing: border-box;
  background-color: #f8fafc;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s ease;
  border: 2px solid #ccc;
}

.modal-input:focus {
  border-color: var(--primary-color);
  background-color: #ffffff;
}

.modal-textarea {
  height: 110px;
  resize: none;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.btn {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-md);
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    opacity 0.2s ease;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: #3b82f6;
  color: #ffffff;
}
</style>
