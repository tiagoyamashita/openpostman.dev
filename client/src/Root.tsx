import { useEffect, useState } from "react";
import App from "./App";
import Landing from "./Landing";

const LANDING_TITLE = "OpenPostman — free open-source API client";
const APP_TITLE = "Workspace — OpenPostman";

function isAppRoute(): boolean {
  return window.location.hash.startsWith("#/app");
}

function setRobots(content: string): void {
  const existing = document.querySelector('meta[name="robots"]');
  if (existing) {
    existing.setAttribute("content", content);
    return;
  }
  const meta = document.createElement("meta");
  meta.setAttribute("name", "robots");
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
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

  useEffect(() => {
    document.title = appRoute ? APP_TITLE : LANDING_TITLE;
    setRobots(appRoute ? "noindex, nofollow" : "index, follow");
  }, [appRoute]);

  return appRoute ? <App /> : <Landing />;
}
