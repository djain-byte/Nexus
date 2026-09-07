"use client";

import { useEffect, useRef } from "react";

export function MouseFallback() {
  const isDragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("nexus-mouse-rotate", {
          detail: { delta: e.deltaY * 0.001 },
        })
      );
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastX.current;
      window.dispatchEvent(
        new CustomEvent("nexus-mouse-rotate", {
          detail: { delta: dx * 0.003 },
        })
      );
      lastX.current = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        window.dispatchEvent(
          new CustomEvent("nexus-mouse-rotate", { detail: { delta: 0.3 } })
        );
      } else if (e.key === "ArrowRight") {
        window.dispatchEvent(
          new CustomEvent("nexus-mouse-rotate", { detail: { delta: -0.3 } })
        );
      }
    };

    // Attach to document level — always works
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
