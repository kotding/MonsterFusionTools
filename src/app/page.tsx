import { FirebaseConnector } from "@/components/firebase-connector";

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
          <span className="text-lg">Firebase Connector</span>
        </div>
      </header>
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <FirebaseConnector />
      </div>
      <footer className="border-t bg-background/80 px-4 py-4 text-center text-sm text-muted-foreground md:px-6">
        <p>Built with Next.js and ShadCN UI. This is a mock implementation.</p>
        <p className="mt-1">
          To connect your own data, replace the functions in{" "}
          <code className="font-mono text-xs">src/lib/firebase-service.ts</code>{" "}
          with your Firebase SDK calls.
        </p>
      </footer>
    </main>
  );
}
