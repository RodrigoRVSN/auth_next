import { destroyCookie } from "nookies";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { AuthTokenError } from "../errors/AuthTokenError";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  return <h1>{user?.email}</h1>;
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);

  const response = await apiClient.get("/me");

  return {
    props: {},
  };
});
