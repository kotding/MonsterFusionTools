import Link from 'next/link';
import { Gift } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className="h-6 w-6 text-primary"
            fill="currentColor"
          >
            <path d="M139.52,223.58,128,240l-11.52-16.42a104,104,0,0,1-80.29-160.83l.23-.28,74.47-92.4a8,8,0,0,1,12.22,0l74.47,92.4.23.28A104,104,0,0,1,139.52,223.58ZM89.14,75.43l-45.3,56.19a88,88,0,0,0,111.45,123.8l.19.27L168.86,236,128,180.4,87.14,236,73.71,216.48l35.43-49.6a8,8,0,0,1,12.55-.26l28.69,35.6-.23-146.42Z" />
          </svg>
          <span className="text-lg">Admin Dashboard</span>
        </div>
      </header>
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground">
            Select a tool to get started.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Link href="/gift-code">
            <Card className="flex h-full flex-col transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Gift Code Creator</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>
                  Create and manage gift codes for your users.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      <footer className="border-t bg-background/80 px-4 py-4 text-center text-sm text-muted-foreground md:px-6">
        <p>Built with Next.js and ShadCN UI.</p>
      </footer>
    </main>
  );
}
