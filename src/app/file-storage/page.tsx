import Link from "next/link";
import { ChevronLeft, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileManager } from "@/components/file-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "File Storage",
};

export default function FileStoragePage() {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-semibold">
             <FolderKanban className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">File Storage</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
        <div className="mx-auto h-full w-full max-w-6xl">
            <FileManager />
        </div>
      </main>
    </div>
  );
}
