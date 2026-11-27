import { createContext, useContext, useEffect, useState } from "react";

// Light, dark or follow the device. The choice is remembered per browser.
const ThemeContext = createContext({ theme: "system", resolved: "light", setTheme: () => {} });
const KEY = "palmadex-theme";

const read = () => {
  try { return localStorage.getItem(KEY) || "system"; } catch { return "system"; }
};
const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(read);
  const [resolved, setResolved] = useState(() => (read() === "dark" || (read() === "system" && systemDark()) ? "dark" : "light"));

  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && systemDark());
      document.documentElement.classList.toggle("dark", dark);
      setResolved(dark ? "dark" : "light");
    };
    apply();
    if (theme !== "system") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = (t) => {
    try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
    setThemeState(t);
  };

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
