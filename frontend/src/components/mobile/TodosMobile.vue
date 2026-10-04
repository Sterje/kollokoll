<template>
  <div class="todos-wrapper">
    <button class="back-button" @click="$router.back()">
      <ChevronLeft :size="20" />
    </button>
    <div class="todos-header">
      <h2>Att göra</h2>
      <button
        class="todo-card-add-btn"
        aria-label="Lägg till uppgift"
        @click="openAddTodoModalFunction()"
      >
        <Plus :size="20" />
      </button>
    </div>

    <div
      class="todos-card"
      :class="{ 'todos-card-collapsed': !showAll && hasMoreTodos }"
    >
      <div
        v-if="isLoading"
        class="loader"
        role="status"
        aria-label="Laddar"
      ></div>
      <div
        v-else
        class="todo-card-content"
        v-for="todo in visibleTodos"
        :key="todo.id"
      >
        <label class="checkbox-container">
          <input
            type="checkbox"
            class="todo-card-content-checkbox"
            :checked="todo.is_completed"
            @change="toggleTodo(todo, $event)"
          />
          <span class="checkmark"></span>
        </label>

        <div class="todo-card-content-todo">
          <div class="todo-main-info">
            <span class="todo-created-at">{{
              formatCreatedAt(todo.created_at)
            }}</span>
            <p
              class="todo-title"
              :class="{ 'completed-text': todo.is_completed }"
            >
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

        <button
          class="todo-card-content-comment-button"
          aria-label="Kommentera"
          @click="openAddTodoCommentModalFunction(todo)"
        >
          <MessageCircleMore :size="20" />
        </button>
      </div>
    </div>

    <button
      v-if="hasMoreTodos"
      class="show-all-button"
      type="button"
      @click="showAll = !showAll"
    >
      {{ showAll ? "Visa färre" : "Visa alla" }}
    </button>
  </div>

  <!-- Modal: Lägg till todo -->
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

  <!-- Modal: Lägg till kommentar -->
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
          placeholder="Ditt namn"
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

  <!-- Sticky action bar vid markering -->
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { MessageCircleMore, Plus, ChevronLeft } from "lucide-vue-next";
import { createClient } from "@supabase/supabase-js";

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

const showAll = ref(false);
const openAddTodoModal = ref(false);
const openAddTodoCommentModal = ref(false);
const newTodoTitle = ref("");
const newTodoComment = ref("");
const newTodoCommentAuthor = ref("");
const selectedDepartmentId = ref("");
const selectedTodoId = ref<string | null>(null);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const todos = ref<Todo[]>([]);
const isLoading = ref(true);
const departments = ref<{ id: string; name: string }[]>([]);

const emit = defineEmits<{ count: [count: number] }>();
watch(
  () => todos.value.length,
  (n) => emit("count", n),
  { immediate: true },
);

const hasMoreTodos = computed(() => todos.value.length > 6);
const visibleTodos = computed(() =>
  showAll.value ? todos.value : todos.value.slice(0, 6),
);

const fetchDepartments = async () => {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Fel vid hämtning av avdelningar:", error);
    return;
  }

  departments.value = data || [];
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

const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(createdAt));

const openAddTodoModalFunction = () => {
  openAddTodoModal.value = true;
};

const addTodo = async () => {
  const title = newTodoTitle.value.trim();
  if (!title) return;

  const { data, error } = await supabase
    .from("todos")
    .insert({
      title,
      department_id: selectedDepartmentId.value || null,
      is_tonight: false,
      is_completed: false,
      created_by: "Mock user",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Fel vid tillägg av uppgift:", error);
    return;
  }

  await fetchTodos();
  newTodoTitle.value = "";
  selectedDepartmentId.value = "";
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
    console.error("Fel vid uppdatering av todo:", error);
  }
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

const openAddTodoCommentModalFunction = (todo: Todo) => {
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

onMounted(async () => {
  try {
    await Promise.all([fetchDepartments(), fetchTodos()]);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* Modern variabelstruktur */
.todos-wrapper {
  --primary-color: #2843bb;
  --primary-hover: #1f3496;
  --bg-gradient: linear-gradient(135deg, #2843bb 0%, #1a2a78 100%);
  --card-bg: #ffffff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --radius-lg: 16px;
  --radius-md: 10px;

  padding: 16px 12px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  max-width: 500px;
  margin: 0 auto;
}

.back-button {
  background-color: var(--primary-color);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(40, 67, 187, 0.3);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.back-button:active {
  transform: scale(0.92);
}
.todos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.todos-header h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.todo-card-add-btn {
  background-color: var(--primary-color);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(40, 67, 187, 0.3);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.todo-card-add-btn:active {
  transform: scale(0.92);
}

.todos-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-lg);
  background: var(--bg-gradient);
  box-shadow: 0 10px 25px -5px rgba(40, 67, 187, 0.4);
}

.todos-card-collapsed {
  max-height: 380px;
  overflow: hidden;
}

.todos-card-collapsed::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 80px;
  pointer-events: none;
  content: "";
  background: linear-gradient(to bottom, rgba(26, 42, 120, 0), #1a2a78);
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
}

.todo-card-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: var(--card-bg);
  border-radius: var(--radius-md);
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* Anpassad kryssruta för touch */
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
  border-radius: 6px;
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

.todo-card-content-todo {
  min-width: 0;
  flex: 1;
}

.todo-main-info {
  display: flex;
  flex-direction: column;
}

.todo-created-at {
  font-size: 0.725rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.todo-title {
  font-size: 0.95rem;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

.completed-text {
  text-decoration: line-through;
  color: var(--text-muted);
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
  font-size: 0.8rem;
  color: #475569;
  margin: 0;
  line-height: 1.3;
}

.comment-author {
  font-weight: 600;
  color: var(--text-main);
}

.todo-card-content-comment-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.todo-card-content-comment-button:active {
  background-color: #f1f5f9;
  color: var(--primary-color);
}

.show-all-button {
  display: block;
  margin: 16px auto 0;
  padding: 10px 20px;
  color: var(--primary-color);
  background-color: #eef2ff;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.show-all-button:active {
  background-color: #e0e7ff;
}

/* Modaler */
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

.modal-input,
.modal-select {
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
  border: 1px solid #ccc;
}

.modal-input:focus,
.modal-select:focus {
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

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}

/* Bottenfält för markerade uppgifter */
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
.loader {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin: 16px auto;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
/* Global style för toast med mjuk animering */
.custom-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
  background-color: #10b981;
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
  z-index: 200;
  animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.custom-toast.toast-hide {
  animation: toastOut 0.3s ease forwards;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}
</style>
