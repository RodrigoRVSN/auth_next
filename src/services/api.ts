import axios, { AxiosError } from "axios";

import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "../errors/AuthTokenError";

let cookies = parseCookies();
let isRefreshing = false;
let failedQueue = [];

export function setupAPIClient(ctx = undefined) {
  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["authnext.token"]}`,
    },
  });

  api.interceptors.response.use(
    (res) => {
      return res;
    },
    (error: AxiosError) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === "token.expired") {
          cookies = parseCookies(ctx);

          const { "authnext.refreshToken": refreshToken } = cookies;
          const originalConfig = error.config;

          if (!isRefreshing) {
            isRefreshing = true;
            api
              .post("/refresh", {
                refreshToken,
              })
              .then((res) => {
                const { token } = res.data;

                setCookie(ctx, "authnext.token", token, {
                  maxAge: 60 * 60 * 24 * 30,
                  path: "/",
                });

                setCookie(ctx, "authnext.refreshToken", res.data.refreshToken, {
                  maxAge: 60 * 60 * 24 * 30,
                  path: "/",
                });

                api.defaults.headers["Authorization"] = `Bearer ${token}`;

                failedQueue.forEach((req) => req.resolve(token));

                failedQueue = [];
              })
              .catch((err) => {
                failedQueue.forEach((req) => req.reject(err));
                failedQueue = [];
              })
              .finally(() => {
                isRefreshing = false;
              });
          }

          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalConfig.headers["Authorization"] = `Bearer ${token}`;

                resolve(api(originalConfig));
              },
              reject: (err: AxiosError) => {
                reject(err);
              },
            });
          });
        } else {
          if (process.browser) {
            signOut();
          } else {
            return Promise.reject(new AuthTokenError());
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}
