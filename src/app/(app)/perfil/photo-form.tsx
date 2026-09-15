"use client";

import { useActionState, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { atualizarFoto, type FotoState } from "./actions";

const ESTADO_INICIAL: FotoState = {};

export function PhotoForm({ avatarUrl, apelido }: { avatarUrl: string | null; apelido: string }) {
  const [state, formAction, pending] = useActionState(atualizarFoto, ESTADO_INICIAL);
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaRecorte, setAreaRecorte] = useState<Area | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setImagemSelecionada(URL.createObjectURL(arquivo));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  function cancelar() {
    if (imagemSelecionada) URL.revokeObjectURL(imagemSelecionada);
    setImagemSelecionada(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function confirmarRecorte() {
    if (!imagemSelecionada || !areaRecorte) return;
    setEnviando(true);
    try {
      const blob = await gerarImagemRecortada(imagemSelecionada, areaRecorte);
      const formData = new FormData();
      formData.append("foto", blob, "avatar.jpg");
      await formAction(formData);
    } finally {
      setEnviando(false);
      cancelar();
    }
  }

  return (
    <div className="mx-auto w-fit">
      <div className="relative">
        <Avatar src={avatarUrl} alt={apelido} size={80} />
        <label
          aria-label="Alterar foto"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
        >
          <Camera size={14} />
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={selecionarArquivo}
          />
        </label>
      </div>

      {pending && <p className="mt-1 text-center text-xs text-muted">Enviando...</p>}
      {state.error && <p className="mt-1 max-w-[160px] text-center text-xs text-danger">{state.error}</p>}

      {imagemSelecionada && (
        <div className="fixed inset-0 z-30 flex flex-col bg-black">
          <div className="relative flex-1">
            <Cropper
              image={imagemSelecionada}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, areaPixels) => setAreaRecorte(areaPixels)}
            />
          </div>
          <div className="space-y-3 bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <p className="text-center text-xs text-muted">Arraste pra posicionar e use o controle pra dar zoom</p>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#16A34A]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelar}
                disabled={enviando}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                <X size={16} /> Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRecorte}
                disabled={enviando}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Check size={16} /> {enviando ? "Enviando..." : "Usar foto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function gerarImagemRecortada(src: string, area: Area, tamanho = 480): Promise<Blob> {
  const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Não foi possível carregar a imagem")));
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste navegador");
  ctx.drawImage(imagem, area.x, area.y, area.width, area.height, 0, 0, tamanho, tamanho);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem"))), "image/jpeg", 0.9);
  });
}
