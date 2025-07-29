"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { manualGiftCodeSchema, type GiftCode } from "@/types";
import { REWARD_TYPES, ARTIFACT_PIECE_TYPES, ARTIFACT_RARITIES, getClassCharForPieceType, IAP_PACKS } from "@/types/rewards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "./ui/separator";

type ManualCodeFormValues = z.infer<typeof manualGiftCodeSchema>;

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
        <div className="grid grid-cols-2 items-start gap-2 rounded-md border bg-muted/50 p-2">
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
            <FormItem>
              <FormLabel className="sr-only">Or select a pack</FormLabel>
              <Select onValueChange={(value) => form.setValue(`listRewards.${index}.iapKey`, value)}>
                  <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Or select a pack" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      {IAP_PACKS.map(pack => (
                          <SelectItem key={pack} value={pack}>{pack}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
               <FormMessage />
            </FormItem>
        </div>
      )}
    </div>
  );
}


export function ManualCodeCreator() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ManualCodeFormValues>({
    resolver: zodResolver(manualGiftCodeSchema),
    defaultValues: {
      code: "",
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

  const generateRandomCode = () => {
    const randomPart = Math.random().toString(36).substring(2, 7);
    form.setValue("code", `moonlight_${randomPart}`);
  };

  const copyCode = () => {
    const code = form.getValues("code");
    if (code) {
      navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: `Code "${code}" copied to clipboard.`,
      });
    }
  };


  const handleCreateCode = (values: ManualCodeFormValues) => {
    startTransition(async () => {
      try {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + values.expireDays);

        const newCodeData: Omit<GiftCode, "id"> = {
          code: values.code,
          listRewards: values.listRewards.map(r => {
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
          }),
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
                      aria-label="Generate random code"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyCode}
                      disabled={!field.value}
                      aria-label="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      <FormLabel>Max Claims</FormLabel>
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
              {isPending ? "Creating..." : "Create Code"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
