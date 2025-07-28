"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Loader2, Copy } from "lucide-react";

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
import { giftCodeSchema, type GiftCode } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ManualCodeFormValues = z.infer<typeof giftCodeSchema>;

export function ManualCodeCreator() {
  const [isPending, startTransition] = useTransition();
  const [generatedCode, setGeneratedCode] = useState<GiftCode | null>(null);
  const { toast } = useToast();

  const form = useForm<ManualCodeFormValues>({
    resolver: zodResolver(giftCodeSchema),
    defaultValues: {
      code: "",
      reward: "",
    },
  });

  const handleCreateCode = (values: ManualCodeFormValues) => {
    startTransition(async () => {
      try {
        const newCode = await addGiftCode(values);
        setGeneratedCode(newCode);
        toast({
          title: "Success!",
          description: `Gift code "${newCode.code}" created successfully.`,
        });
        form.reset();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not create the gift code.",
        });
      }
    });
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      toast({ title: "Copied!", description: "Gift code copied to clipboard." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo code thủ công</CardTitle>
        <CardDescription>
          Tạo một gift code duy nhất với phần thưởng cụ thể.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreateCode)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gift Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., WELCOME2024" {...field} />
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
                    <Input placeholder="e.g., 100 Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Code"}
            </Button>
          </form>
        </Form>
      </CardContent>
      {generatedCode && (
        <CardFooter className="mt-6 flex flex-col items-start gap-4 rounded-lg border bg-secondary/50 p-4">
            <div className="w-full">
              <p className="text-sm font-semibold text-foreground">
                Generated Code:
              </p>
              <div className="mt-2 flex items-center justify-between gap-4 rounded-md bg-background p-3">
                 <p className="font-mono text-lg font-bold text-primary">{generatedCode.code}</p>
                 <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-5 w-5" />
                 </Button>
              </div>
            </div>
             <div className="w-full">
                <p className="text-sm font-semibold text-foreground">
                    Reward:
                </p>
                <p className="mt-1 font-medium">{generatedCode.reward}</p>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
