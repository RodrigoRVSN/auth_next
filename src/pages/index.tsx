import type { NextPage } from "next";
import { FormEvent, useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const data = {
      email,
      password,
    };

    signIn(data);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        placeholder="e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">enviar</button>
    </form>
  );
};

export default Home;
