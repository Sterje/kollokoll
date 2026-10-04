import Login from "./views/mobile/LoginMobile.vue";
import MenuMobile from "./views/mobile/MenuMobile.vue";
import TodosMobile from "./components/mobile/TodosMobile.vue";
import TodoTonight from "./components/mobile/TodoTonight.vue";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

const supabase = createClient(supabaseUrl, supabasePublishableKey);

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Login",
    component: Login,
  },

  {
    path: "/todos",
    name: "TodosMobile",
    component: TodosMobile,
    meta: { showNavbar: true },
  },
  {
    path: "/tonight",
    name: "TodoTonight",
    component: TodoTonight,
    meta: { showNavbar: true },
  },

  {
    path: "/menu",
    name: "MenuMobile",
    component: MenuMobile,
    meta: {
      requiresAuth: true,
      showNavbar: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) {
    return true;
  }

  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    return {
      path: "/",
    };
  }

  return true;
});

export default router;
