export const ROUTES = {
  public: {
    login: "/login",
    forgotPassword: "/forgot-password",
  },
  private: {
    dashboard: "/dashboard",
    clients: {
      list: "/clients",
      new: "/clients/new",
      detail: (id: string) => `/clients/${id}`,
      edit: (id: string) => `/clients/${id}/edit`,
    },
    livreurs: {
      list: "/livreurs",
      new: "/livreurs/new",
      detail: (id: string) => `/livreurs/${id}`,
      edit: (id: string) => `/livreurs/${id}/edit`,
    },
    partenaires: {
      list: "/partenaires",
    },
    livraisons: {
      list: "/livraisons",
    },
    depenses: {
      list: "/depenses",
    },
    entrees: {
      list: "/entrees",
    },
    stock: {
      list: "/stock",
      new: "/stock/new",
      detail: (id: string) => `/stock/${id}`,
      edit: (id: string) => `/stock/${id}/edit`,
    },
    settings: "/settings",
    users: "/users",
    profile: "/profile",
  },
} as const;
