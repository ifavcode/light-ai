import { defineStore } from "pinia";
import { type User } from "../types/index";

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null);
  return {
    user,
  };
});
