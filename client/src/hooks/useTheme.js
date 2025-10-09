import { useEffect, useState } from "react";

/** One hook that flips the WHOLE app.
 *  - Sets attribute on <html> (not just body) so every element inherits.
 *  - Removes any lingering Bootstrap bg classes that might force light.
 */
export function useTheme(){
  const [dark, setDark] = useState(() => localStorage.getItem("sg_theme") === "dark");

  useEffect(() => {
    const t = dark ? "dark" : "light";
    localStorage.setItem("sg_theme", t);
    const html = document.documentElement;
    html.setAttribute("data-bs-theme", t);

    // Defensive: remove legacy body classes that fight the theme
    document.body.classList.remove("bg-light", "text-dark");
    if (dark) document.body.classList.add("text-light"); else document.body.classList.remove("text-light");
  }, [dark]);

  return [dark, () => setDark(v => !v)];
}
