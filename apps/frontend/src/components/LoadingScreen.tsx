import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#6c63ff]" />
        <span className="text-sm text-[#6b6b85]">Loading...</span>
      </div>
    </div>
  );
}
