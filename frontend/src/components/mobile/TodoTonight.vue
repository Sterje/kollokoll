<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ formatedDate(date) }}</h2>
      <button
        class="icon-button"
        aria-label="Lägg till uppgift"
        @click="openAddModalFunction()"
      >
        <Plus :size="30" />
      </button>
    </div>
    <div v-if="loading" class="loader-container">
      <div class="loader" role="status" aria-label="Laddar"></div>
    </div>
    <span v-else-if="!hasTodos && !loading" class="no-info">
      Inga uppgifter för tillfället, tryck på + knappen för att lägga till en
      uppgift.
    </span>
    <div v-else>
      <div class="list-item" v-for="todo in todos" :key="todo.id">
        <label class="checkbox-container">
          <input
            type="checkbox"
            :checked="todo.is_completed"
            @change="toggleTodo(todo, $event)"
          />
          <span class="checkmark"></span>
        </label>
        <div class="item-content">
          <div class="item-meta">
            <div class="item-date">
              {{ formatedCreatedAt(todo.created_at) }}
            </div>
            <div class="item-author">
              {{ todo.author }}
            </div>
          </div>
          <div class="item-title">
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
        <button
          class="icon-button"
          aria-label="Kommentera"
          @click="openAddTodoCommentFunction(todo)"
        >
          <MessageCircleMore :size="20" />
        </button>
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
    <div v-if="todos.some((todo) => todo.is_completed)" class="action-bar">
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
import { supabase } from "../../lib/supabase";
import { ref, computed } from "vue";
import { MessageCircleMore, Plus } from "lucide-vue-next";

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
.page {
  --item-bg: #fff196;
  height: auto;
  flex: 1;
}

.item-date,
.item-author {
  font-size: 14px;
  font-style: italic;
}

.item-author {
  color: #475569;
  font-weight: 600;
}

.comment {
  font-size: 14px;
  font-style: italic;
}
</style>
