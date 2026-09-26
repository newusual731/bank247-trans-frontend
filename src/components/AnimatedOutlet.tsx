import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

/** Plays a visible page-enter animation on every route change. */
export function AnimatedOutlet() {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("anim-page");
    // Force reflow so the next animation always restarts
    void el.offsetWidth;
    el.classList.add("anim-page");
  }, [location.pathname, location.key]);

  return (
    <div ref={ref} className="anim-page" data-pathname={location.pathname}>
      <Outlet />
    </div>
  );
}
