import { UserRound } from "lucide-react";

export function Avatar({
  src,
  alt,
  size = 40,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar vem de qualquer domínio do Supabase Storage do usuário
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <UserRound size={Math.round(size * 0.5)} />
      )}
    </div>
  );
}
