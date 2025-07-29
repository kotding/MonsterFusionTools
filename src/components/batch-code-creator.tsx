"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Loader2, Download, PlusCircle, Trash2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addGiftCode } from "@/lib/firebase-service";
import type { GiftCode } from "@/types";
import { batchGiftCodeSchema } from "@/types";
import { REWARD_TYPES, ARTIFACT_PIECE_TYPES, ARTIFACT_RARITIES, getClassCharForPieceType, IAP_PACKS } from "@/types/rewards";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

const batchCodeFormSchema = batchGiftCodeSchema;
type BatchCodeFormValues = z.infer<typeof batchCodeFormSchema>;

function RewardFields({ index, control, form }: { index: number, control: any, form: any }) {
  const rewardType = useWatch({
    control,
    name: `listRewards.${index}.rewardType`,
  });

  return (
    <div className="space-y-2">
      {rewardType === "ARTIFACT" && (
        <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/50 p-2">
          <FormField
              control={control}
              name={`listRewards.${index}.artifactInfo.Artifact_PieceType`}
              render={({ field }) => (
                  <FormItem>
                      <FormLabel className="sr-only">Piece Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select piece type" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {ARTIFACT_PIECE_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}
          />
          <FormField
              control={control}
              name={`listRewards.${index}.artifactInfo.Artifact_Rarity`}
              render={({ field }) => (
                  <FormItem>
                      <FormLabel className="sr-only">Rarity</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select rarity" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {ARTIFACT_RARITIES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}
          />
        </div>
      )}
      {rewardType === "MONSTER" && (
         <FormField
            control={control}
            name={`listRewards.${index}.monsterId`}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="sr-only">Monster ID</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Enter Monster ID" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value ?? 0} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
      )}
       {rewardType === "PURCHASE_PACK" && (
        <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/50 p-2">
           <FormField
              control={control}
              name={`listRewards.${index}.iapKey`}
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="sr-only">IAP Key</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter IAP Key" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />
             <Select onValueChange={(value) => form.setValue(`listRewards.${index}.iapKey`, value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Or select a pack" />
                </SelectTrigger>
                <SelectContent>
                    {IAP_PACKS.map(pack => (
                        <SelectItem key={pack} value={pack}>{pack}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      )}
    </div>
  );
}

export function BatchCodeCreator() {
  const [isPending, startTransition] = useTransition();
  const [generatedCodes, setGeneratedCodes] = useState<GiftCode[]>([]);
  const { toast } = useToast();

  const form = useForm<BatchCodeFormValues>({
    resolver: zodResolver(batchCodeFormSchema),
    defaultValues: {
      prefix: "moonlight",
      quantity: 10,
      listRewards: [{ 
          rewardType: "DIAMOND", 
          rewardAmount: 100,
          monsterId: 0,
          iapKey: "",
          artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" } 
      }],
      maxClaimCount: 1,
      expireDays: 365,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "listRewards",
  });

  const generateRandomCode = (prefix: string) => {
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${randomPart}`;
  };

  const handleBatchCreate = (values: BatchCodeFormValues) => {
    startTransition(async () => {
      const newCodes: GiftCode[] = [];
      const errors: string[] = [];
      
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + values.expireDays);
      const expireISO = expireDate.toISOString();

      const processedRewards = values.listRewards.map(r => {
        const reward = {
            rewardType: r.rewardType,
            rewardAmount: r.rewardAmount,
            monsterId: 0,
            iapKey: "",
            artifactInfo: { Artifact_PieceType: "None" as const, Artifact_Rarity: "None" as const, ClassChar: "A" }
        };

        if (r.rewardType === 'ARTIFACT') {
          reward.artifactInfo = {
            ...r.artifactInfo,
            ClassChar: getClassCharForPieceType(r.artifactInfo.Artifact_PieceType)
          };
        } else if (r.rewardType === 'MONSTER') {
            reward.monsterId = r.monsterId;
        } else if (r.rewardType === 'PURCHASE_PACK') {
            reward.iapKey = r.iapKey;
        }
        return reward;
      });

      for (let i = 0; i < values.quantity; i++) {
        const code = generateRandomCode(values.prefix);
        const newCodeData: Omit<GiftCode, "id"> = {
            code: code,
            listRewards: processedRewards,
            maxClaimCount: values.maxClaimCount,
            currClaimCount: 0,
            day: 1,
            expire: expireISO,
        };
        try {
            const newCode = await addGiftCode(newCodeData);
            newCodes.push(newCode);
        } catch (error: any) {
            errors.push(error.message || `Failed to create code ${code}`);
        }
      }
      
      setGeneratedCodes(newCodes);
      
      if(newCodes.length > 0) {
        toast({
          title: "Success!",
          description: `${newCodes.length} gift codes created successfully.`,
          variant: "default",
          className: "bg-green-500 text-white",
        });
      }

      if (errors.length > 0) {
         toast({
          variant: "destructive",
          title: "Some codes failed",
          description: `${errors.length} codes could not be created. They might already exist.`,
        });
      }
      
      form.reset({
        ...form.getValues(),
        prefix: values.prefix,
        quantity: values.quantity,
      });
    });
  };
  
  const downloadCodes = () => {
    if (generatedCodes.length === 0) return;
    const text = generatedCodes.map(c => c.code).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gift-codes.txt';
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
          Tạo nhiều gift code cùng một lúc với cùng một bộ phần thưởng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleBatchCreate)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., moonlight" {...field} />
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
                        <Input type="number" placeholder="e.g., 50" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="space-y-2">
                <FormLabel>Rewards</FormLabel>
                {fields.map((field, index) => (
                    <div key={field.id} className="space-y-2 rounded-md border p-3">
                        <div className="flex w-full items-start gap-2">
                            <FormField
                                control={form.control}
                                name={`listRewards.${index}.rewardType`}
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
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
                                        <FormControl>
                                            <Input type="number" placeholder="Amount" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value ?? 0} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove reward</span>
                            </Button>
                        </div>
                      <RewardFields index={index} control={form.control} form={form} />
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ 
                        rewardType: "GOLD", 
                        rewardAmount: 1000,
                        monsterId: 0, 
                        iapKey: "",
                        artifactInfo: { Artifact_PieceType: "None", Artifact_Rarity: "None", ClassChar: "A" } 
                    })}
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
                      <FormLabel>Max Claims Per Code</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value}/>
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
                        <Input type="number" placeholder="365" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value}/>
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

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
                <h3 className="text-lg font-semibold text-foreground">
                    Generated Codes ({generatedCodes.length})
                </h3>
                <Button variant="outline" size="sm" onClick={downloadCodes}>
                    <Download className="mr-2 h-4 w-4" />
                    Download (.txt)
                </Button>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border bg-background p-2">
                <div className="p-2 font-mono text-sm">
                    {generatedCodes.map((code) => (
                        <div key={code.id} className="border-b py-2 last:border-none">
                           {code.code}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </CardFooter>
      )}
    </Card>
  );
}
