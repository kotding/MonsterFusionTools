"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";
import { Loader2, Copy, PlusCircle, Trash2, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addGiftCode } from "@/lib/firebase-service";
import { manualGiftCodeSchema, type GiftCode, type Reward } from "@/types";
import { REWARD_TYPES } from "@/types/rewards";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "./ui/separator";

type ManualCodeFormValues = z.infer<typeof manualGiftCodeSchema>;

export function ManualCodeCreator() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ManualCodeFormValues>({
    resolver: zodResolver(manualGiftCodeSchema),
    defaultValues: {
      code: "",
      listRewards: [{ rewardType: "DIAMOND", rewardAmount: 100 }],
      maxClaimCount: 1,
      expireDays: 365,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "listRewards",
  });

  const generateRandomCode = () => {
    const randomPart = Math.random().toString(36).substring(2, 7);
    form.setValue("code", `moonlight_${randomPart}`);
  };

  const handleCreateCode = (values: ManualCodeFormValues) => {
    startTransition(async () => {
      try {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + values.expireDays);

        const newCodeData: Omit<GiftCode, "id"> = {
          code: values.code,
          listRewards: values.listRewards.map(r => ({ ...r, monsterId: 0, artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" } })),
          maxClaimCount: values.maxClaimCount,
          currClaimCount: 0,
          day: 1,
          expire: expireDate.toISOString(),
        };

        const newCode = await addGiftCode(newCodeData);
        toast({
          title: "Success!",
          description: `Gift code "${newCode.code}" created successfully.`,
          variant: "default",
          className: "bg-green-500 text-white",
        });
        form.reset();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not create the gift code.",
        });
      }
    });
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
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="e.g., WELCOME2024" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateRandomCode}
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
                <FormLabel>Rewards</FormLabel>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md relative">
                        <FormField
                            control={form.control}
                            name={`listRewards.${index}.rewardType`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Reward Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a reward type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {REWARD_TYPES.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`listRewards.${index}.rewardAmount`}
                            render={({ field }) => (
                                <FormItem className="w-32">
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ rewardType: "GOLD", rewardAmount: 1000 })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Reward
                </Button>
            </div>

            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="maxClaimCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Claims</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="expireDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires in (days)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="365" {...field} />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Code"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
