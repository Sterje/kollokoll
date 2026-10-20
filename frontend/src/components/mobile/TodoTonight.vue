<template>
  <div class="todos-wrapper">
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
        <label class="checkbox-container">
          <input
            type="checkbox"
            class="todo-card-content-checkbox"
            :checked="todo.is_completed"
            @change="toggleTodo(todo, $event)"
          />
          <span class="checkmark"></span>
        </label>
        <div class="todo-content">
          <div class="todo-date-author-container">
            <div class="todo-date">
              <p class="todo-date-text">
                {{ formatedCreatedAt(todo.created_at) }}
              </p>
            </div>
            <div class="todo-author">
              <p class="todo-author-text">
                {{ todo.author }}
              </p>
            </div>
          </div>
          <div class="todo-title">
            <p class="todo-title-text">
              {{ todo.title }}
            </p>
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
            @click="openAddTodoCommentFunction(todo)"
          >
            <MessageCircleMore :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Todo Modal -->
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
  <!-- Complete one or more todos -->
  <Transition name="slide-up">
    <div
      v-if="todos.some((todo) => todo.is_completed)"
      class="completed-todos-btn-container"
    >
      <button
        type="button"
        @click="deleteCompletedTodos"
        class="action-btn btn-success"
      >
        Uppgift klar
      </button>
      <button
        type="button"
        @click="cancelCompletedTodos"
        class="action-btn btn-danger"
      >
        Avbryt
      </button>
    </div>
  </Transition>
  <!-- Add Todo Comment Modal -->
  <Transition name="fade">
    <div
      v-if="openAddTodoCommentModal"
      class="modal-overlay"
      @click.self="openAddTodoCommentModal = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Lägg till kommentar</h3>
        </div>
        <textarea
          v-model="newTodoComment"
          placeholder="Skriv din kommentar här..."
          class="modal-input modal-textarea"
        ></textarea>
        <input
          type="text"
          v-model="newTodoCommentAuthor"
          class="modal-input"
          placeholder="Ditt namn (frivilligt)"
        />
        <div class="modal-actions">
          <button type="button" @click="addTodoComment" class="btn btn-primary">
            Lägg till kommentar
          </button>
          <button
            type="button"
            @click="openAddTodoCommentModal = false"
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
import { MessageCircleMore, Plus } from "lucide-vue-next";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const todos = ref<Todo[]>([]);
const loading = ref(true);
const date = new Date();
const newTodoTitle = ref("");
const newTodoAuthor = ref("");
const openAddTodoCommentModal = ref(false);
const newTodoComment = ref("");
const newTodoCommentAuthor = ref("");
const selectedTodoId = ref<string | null>(null);

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

const toggleTodo = async (todo: Todo, event: Event) => {
  const nextValue = (event.target as HTMLInputElement).checked;
  todo.is_completed = nextValue;

  const { error } = await supabase
    .from("todos")
    .update({ is_completed: nextValue })
    .eq("id", todo.id);

  if (error) {
    todo.is_completed = !nextValue;
    console.error("Fel vid uppdatering av kvällens uppgift:", error);
  }
};

const deleteCompletedTodos = async () => {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("is_completed", true);

  if (error) {
    console.error("Fel vid borttagning av slutförda uppgifter:", error);
    return;
  }

  const toast = document.createElement("div");
  toast.textContent = "Slutförda uppgifter borttagna";
  toast.className = "custom-toast";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2500);

  await fetchTodos();
};

const cancelCompletedTodos = async () => {
  const completedTodoIds = todos.value
    .filter((todo) => todo.is_completed)
    .map((todo) => todo.id);

  if (completedTodoIds.length === 0) return;

  const { error } = await supabase
    .from("todos")
    .update({ is_completed: false })
    .in("id", completedTodoIds);

  if (error) {
    console.error("Fel vid återställning av slutförda uppgifter:", error);
    return;
  }

  await fetchTodos();
};

const openAddTodoCommentFunction = (todo: Todo) => {
  selectedTodoId.value = todo.id;
  openAddTodoCommentModal.value = true;
};

const addTodoComment = async () => {
  const comment = newTodoComment.value.trim();
  if (!comment || !selectedTodoId.value) return;

  const { data, error } = await supabase
    .from("todo_comments")
    .insert({
      comment,
      author: newTodoCommentAuthor.value,
      todo_id: selectedTodoId.value,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Fel vid tillägg av kommentar:", error);
    return;
  }

  await fetchTodos();
  newTodoComment.value = "";
  selectedTodoId.value = null;
  newTodoCommentAuthor.value = "";
  openAddTodoCommentModal.value = false;

  return data;
};

fetchTodos();
</script>

<style scoped>
.todos-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  font-family: Arial, sans-serif;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  color: #000000;
  margin-bottom: 12px;
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
  justify-content: space-evenly;
  padding: 12px;
  margin: 8px 0;
  border-radius: 20px;
  background-color: #fff196;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* Touch-anpassad kryssruta */
.checkbox-container {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}

.checkbox-container input {
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  width: 24px;
  background-color: #f1f5f9;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #10b981;
  border-color: #10b981;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.todo-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 8px;
}

.todo-date-author-container {
  display: flex;
}

.todo-date-text {
  font-size: 14px;
  color: #888;
  margin-bottom: 4px;
  font-style: italic;
}

.todo-author-text {
  font-size: 14px;
  color: #475569;
  margin-left: 8px;
  font-weight: 600;
  font-style: italic;
}

.todo-title-text {
  font-size: 16px;
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

.todo-title {
  font-size: 16px;
}

.comments-list {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment {
  font-size: 14px;
  color: #475569;
  margin: 0;
  line-height: 1.3;
  font-style: italic;
}

.comment-author {
  font-weight: 600;
  color: var(--text-main);
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
  font-family: Arial, Helvetica, sans-serif;
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
  font-size: 16px;
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

.completed-todos-btn-container {
  display: flex;
  gap: 10px;
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 16px;
  max-width: 476px;
  margin: 0 auto;
  z-index: 50;
  padding: 8px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.action-btn {
  flex: 1;
  border: none;
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 0.1s ease;
}

.action-btn:active {
  transform: scale(0.97);
}

.btn-success {
  background-color: #10b981;
  color: #ffffff;
}

.btn-danger {
  background-color: #f43f5e;
  color: #ffffff;
}

/* Animeringar */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
