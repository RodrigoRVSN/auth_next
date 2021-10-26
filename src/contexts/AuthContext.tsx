import { createContext, ReactNode, useEffect, useState } from "react";
import Router from "next/router";
import { api } from "../services/apiClient";

import { destroyCookie, parseCookies, setCookie } from "nookies";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type CredentialsProps = {
  email: string;
  password: string;
};

type AuthContextProps = {
  signIn: (credentials: CredentialsProps) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextProps);

let authChannel: BroadcastChannel;

export function signOut() {
  destroyCookie(undefined, "authnext.token");
  destroyCookie(undefined, "authnext.refreshToken");

  authChannel.postMessage("signOut");

  Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          signOut();
          authChannel.close();
          break;
        case "signIn":
          window.location.replace("http://localhost:3000/dashboard");
          authChannel.close();
          break;
        default:
          break;
      }
    };
  }, []);

  useEffect(() => {
    const { "authnext.token": token } = parseCookies();

    if (token) {
      api
        .get("/me")
        .then((res) => {
          const { email, permissions, roles } = res.data;
          setUser({ email, permissions, roles });
        })
        .catch(() => {
          if (process.browser) {
            signOut();
          }
        });
    }
  }, []);

  async function signIn({ email, password }: CredentialsProps) {
    try {
      authChannel = new BroadcastChannel("auth");

      const response = await api.post("/sessions", {
        email,
        password,
      });

      const { token, refreshToken, permissions, roles } = response.data;

      setCookie(undefined, "authnext.token", token, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      setCookie(undefined, "authnext.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      setUser({ email, permissions, roles });

      api.defaults.headers["Authorization"] = `Bearer ${token}`;
      
      authChannel.postMessage("signIn");
      Router.push("/dashboard");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
