import { TreePine } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <TreePine className="h-8 w-8 text-green-600" />
        <span className="font-bold text-2xl text-green-800">CarbonFarm</span>
      </Link>
      {children}
    </div>
  );
}
