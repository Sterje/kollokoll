import DashboardMobile from "./views/mobile/DashboardMobile.vue";
import Login from "./views/mobile/LoginMobile.vue";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: Login,
  },

  {
    path: "/dashboard",
    name: "DashboardMobile",
    component: DashboardMobile,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
