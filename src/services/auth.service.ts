import { getAuth } from "@/src/firebase";

export const AuthService = {
  async getCurrentUser() {
    return getAuth().currentUser;
  },
};
