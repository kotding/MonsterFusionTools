"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addGiftCode } from "@/lib/firebase-service";
import type { GiftCode } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";

const batchCodeSchema = z.object({
  prefix: z.string().max(10, "Prefix must be 10 characters or less."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1.").max(100, "Cannot create more than 100 codes at once."),
  reward: z.string().min(1, "Reward is required."),
});

type BatchCodeFormValues = z.infer<typeof batchCodeSchema>;

export function BatchCodeCreator() {
  const [isPending, startTransition] = useTransition();
  const [generatedCodes, setGeneratedCodes] = useState<GiftCode[]>([]);
  const { toast } = useToast();

  const form = useForm<BatchCodeFormValues>({
    resolver: zodResolver(batchCodeSchema),
    defaultValues: {
      prefix: "CODE",
      quantity: 10,
      reward: "",
    },
  });

  const generateRandomCode = (prefix: string) => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}${randomPart}`;
  }

  const handleBatchCreate = (values: BatchCodeFormValues) => {
    startTransition(async () => {
      try {
        const newCodes: GiftCode[] = [];
        for (let i = 0; i < values.quantity; i++) {
          const newCode = await addGiftCode({
            code: generateRandomCode(values.prefix),
            reward: values.reward,
          });
          newCodes.push(newCode);
        }
        setGeneratedCodes(newCodes);
        toast({
          title: "Success!",
          description: `${newCodes.length} gift codes created successfully.`,
        });
        form.reset();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not create the batch of gift codes.",
        });
      }
    });
  };
  
  const downloadCodes = () => {
    const text = generatedCodes.map(c => `${c.code}, ${c.reward}`).join('\n');
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gift-codes.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo code hàng loạt</CardTitle>
        <CardDescription>
          Tạo nhiều gift code cùng một lúc với cùng một phần thưởng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleBatchCreate)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code Prefix (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SUMMER" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 500 Diamonds" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Generating..." : "Generate Codes"}
            </Button>
          </form>
        </Form>
      </CardContent>
      {generatedCodes.length > 0 && (
         <CardFooter className="mt-6 flex flex-col items-start gap-4 rounded-lg border bg-secondary/50 p-4">
            <div className="flex w-full items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                    Generated Codes ({generatedCodes.length})
                </p>
                <Button variant="outline" size="sm" onClick={downloadCodes}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                </Button>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border bg-background p-2">
                <div className="p-2">
                    {generatedCodes.map((code) => (
                        <div key={code.id} className="flex justify-between border-b py-2 last:border-none">
                            <p className="font-mono text-sm text-primary">{code.code}</p>
                             <p className="text-sm text-muted-foreground">{code.reward}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </CardFooter>
      )}
    </Card>
  );
}
