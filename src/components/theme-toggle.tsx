import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let preference: string | null = null;
    try { preference = localStorage.getItem("nutritrack-theme"); } catch { /* Storage may be disabled. */ }
    const next = preference ? preference === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try { localStorage.setItem("nutritrack-theme", next ? "dark" : "light"); } catch { /* Keep the switch working without storage. */ }
  }

  return (
    <div className="flex justify-end border-b bg-background px-4 py-1 text-foreground">
      <Button variant="ghost" size="sm" onClick={toggle} aria-label="Dark mode" aria-pressed={dark} title={dark ? "Switch to light mode" : "Switch to dark mode"}>
        {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        {dark ? "Light mode" : "Dark mode"}
      </Button>
    </div>
  );
}