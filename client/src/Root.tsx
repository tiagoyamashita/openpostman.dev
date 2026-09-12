import { useEffect, useState } from "react";
import App from "./App";
import Landing from "./Landing";

function isAppRoute(): boolean {
  return window.location.hash.startsWith("#/app");
}

export default function Root() {
  const [appRoute, setAppRoute] = useState(isAppRoute);

  useEffect(() => {
    function sync() {
      setAppRoute(isAppRoute());
    }
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return appRoute ? <App /> : <Landing />;
}
