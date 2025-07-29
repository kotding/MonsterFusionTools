import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualCodeCreator } from "@/components/manual-code-creator";
import { BatchCodeCreator } from "@/components/batch-code-creator";
import { CodeListManager } from "@/components/code-list-manager";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GiftCodePage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-4">
           <Link href="/" passHref>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back to Home</span>
              </Button>
           </Link>
          <div className="flex items-center gap-2 font-semibold">
             <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              className="h-6 w-6 text-primary"
              fill="currentColor"
            >
              <path d="M139.52,223.58,128,240l-11.52-16.42a104,104,0,0,1-80.29-160.83l.23-.28,74.47-92.4a8,8,0,0,1,12.22,0l74.47,92.4.23.28A104,104,0,0,1,139.52,223.58ZM89.14,75.43l-45.3,56.19a88,88,0,0,0,111.45,123.8l.19.27L168.86,236,128,180.4,87.14,236,73.71,216.48l35.43-49.6a8,8,0,0,1,12.55-.26l28.69,35.6-.23-146.42Z" />
            </svg>
            <h1 className="text-lg font-semibold">Gift Code Creator</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <Tabs defaultValue="manual">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">Tạo code thủ công</TabsTrigger>
              <TabsTrigger value="batch">Tạo code hàng loạt</TabsTrigger>
              <TabsTrigger value="list">Danh sách Gift Code</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
               <div className="mx-auto max-w-2xl">
                <ManualCodeCreator />
              </div>
            </TabsContent>
            <TabsContent value="batch">
               <div className="mx-auto max-w-2xl">
                <BatchCodeCreator />
              </div>
            </TabsContent>
            <TabsContent value="list">
              <Tabs defaultValue="db1">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="db1">Database 1 (Android)</TabsTrigger>
                  <TabsTrigger value="db2">Database 2 (iOS)</TabsTrigger>
                </TabsList>
                <TabsContent value="db1">
                  <Card className="mt-4">
                     <CardHeader>
                        <CardTitle>Gift Code List - Database 1</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CodeListManager key="db1" dbKey="db1" />
                      </CardContent>
                  </Card>
                </TabsContent>
                 <TabsContent value="db2">
                  <Card className="mt-4">
                     <CardHeader>
                        <CardTitle>Gift Code List - Database 2</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CodeListManager key="db2" dbKey="db2" />
                      </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
