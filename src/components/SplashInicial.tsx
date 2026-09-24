"use client";

import { useEffect, useState } from "react";
import { LiverSplash } from "@/components/LiverLoader";

// Pantalla de carga al abrir la app: dibuja el ícono una vez (~1.6 s) y se desvanece
export default function SplashInicial() {
  const [fase, setFase] = useState<"visible" | "saliendo" | "fuera">("visible");
  useEffect(() => {
    try {
      // tras "Reiniciar demo" se salta la pantalla de carga
      if (sessionStorage.getItem("liver-sin-splash")) {
        sessionStorage.removeItem("liver-sin-splash");
        setFase("fuera");
        return;
      }
    } catch {
      /* sin almacenamiento */
    }
    const a = setTimeout(() => setFase("saliendo"), 1700);
    const b = setTimeout(() => setFase("fuera"), 2200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  return fase === "fuera" ? null : <LiverSplash saliendo={fase === "saliendo"} />;
}
