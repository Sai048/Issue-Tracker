import { useEffect, useState, createContext } from "react";
import "./App.css";
import AppRoutes from "./components/routes/approutes";
import { supabase } from "./components/supabase-client";
import type { Session } from "@supabase/supabase-js";
import Loading from "./components/loading";

const SessionContext = createContext<Session | null | undefined>(undefined);

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div><Loading /></div>;
  }

  return (
    <SessionContext.Provider value={session}>
      <AppRoutes />
    </SessionContext.Provider>
  );
}

export default App;
