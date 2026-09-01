"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type AssinaturaPadHandle = {
  /** o usuário desenhou algo novo nesta sessão (depois de carregar a imagem inicial) */
  foiAlterado: () => boolean;
  /** o usuário limpou o traço e não desenhou nada depois */
  foiLimpo: () => boolean;
  limpar: () => void;
  paraBlob: () => Promise<Blob | null>;
};

type Props = { imagemInicial?: string | null };

const AssinaturaPad = forwardRef<AssinaturaPadHandle, Props>(function AssinaturaPad(
  { imagemInicial },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alteradoRef = useRef(false);
  const limpoRef = useRef(false);
  const desenhandoRef = useRef(false);
  const ultimoRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const escala = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * escala;
    canvas.height = rect.height * escala;
    ctx.scale(escala, escala);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#12171a";

    if (imagemInicial) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = imagemInicial;
    }
  }, [imagemInicial]);

  function posicao(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhandoRef.current = true;
    ultimoRef.current = posicao(e);
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhandoRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !ultimoRef.current) return;
    const p = posicao(e);
    ctx.beginPath();
    ctx.moveTo(ultimoRef.current.x, ultimoRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimoRef.current = p;
    alteradoRef.current = true;
    limpoRef.current = false;
  }

  function soltar() {
    desenhandoRef.current = false;
    ultimoRef.current = null;
  }

  useImperativeHandle(ref, () => ({
    foiAlterado: () => alteradoRef.current,
    foiLimpo: () => limpoRef.current,
    limpar: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      limpoRef.current = true;
      alteradoRef.current = false;
    },
    paraBlob: () =>
      new Promise((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas) return resolve(null);
        canvas.toBlob((b) => resolve(b), "image/png");
      }),
  }));

  return (
    <canvas
      ref={canvasRef}
      className="sigpad"
      onPointerDown={iniciar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
    />
  );
});

export default AssinaturaPad;
