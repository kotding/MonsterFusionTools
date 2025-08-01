"use client";

import { useState, useEffect, useMemo, useTransition, useCallback, useRef } from "react";
import { FixedSizeList } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  getAllGiftCodes,
  deleteGiftCode,
  updateGiftCode,
} from "@/lib/firebase-service";
import type { GiftCode, EditCodeFormValues, DbKey } from "@/types";
import { Loader2, Trash2, FilePenLine, PlusCircle, Trash, RefreshCw } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { editCodeSchema } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REWARD_TYPES,
  ARTIFACT_PIECE_TYPES,
  ARTIFACT_RARITIES,
  IAP_PACKS,
} from "@/types/rewards";
import { differenceInDays, parseISO } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

const _listHeight = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 500;

function RewardFields({
  prefix,
  index,
  control,
  form,
}: {
  prefix: "listRewards" | `edit.${number}.listRewards`;
  index: number;
  control: any;
  form: any;
}) {
  const rewardType = useWatch({
    control,
    name: `${prefix}.${index}.rewardType`,
  });

  return (
    <div className="space-y-2">
      {rewardType === "ARTIFACT" && (
        <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/50 p-2">
          <FormField
            control={control}
            name={`${prefix}.${index}.artifactInfo.Artifact_PieceType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Piece Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select piece type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ARTIFACT_PIECE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.${index}.artifactInfo.Artifact_Rarity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Rarity</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rarity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ARTIFACT_RARITIES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
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
          name={`${prefix}.${index}.monsterId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Monster ID</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter Monster ID"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 0)
                  }
                  value={field.value ?? 0}
                />
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
              name={`${prefix}.${index}.iapKey`}
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
               <Select onValueChange={(value) => form.setValue(`${prefix}.${index}.iapKey`, value)}>
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

function EditCodeForm({
  code,
  onClose,
  dbKey,
}: {
  code: GiftCode;
  onClose: () => void;
  dbKey: DbKey;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<EditCodeFormValues>({
    resolver: zodResolver(editCodeSchema),
    defaultValues: {
      ...code,
      listRewards: code.listRewards.map(r => ({ ...r, iapKey: r.iapKey || "" })),
      expireDays: differenceInDays(parseISO(code.expire), new Date()),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "listRewards",
  });

  const handleUpdateCode = (values: EditCodeFormValues) => {
    startTransition(async () => {
      try {
        await updateGiftCode(code.id, values, dbKey);
        toast({
          title: "Success!",
          description: `Code "${code.code}" updated successfully on ${dbKey}.`,
          className: "bg-green-500 text-white",
        });
        onClose();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || `Failed to update code "${code.code}".`,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleUpdateCode)}
        className="space-y-4"
      >
        <DialogHeader>
          <DialogTitle>Edit Gift Code: {code.code}</DialogTitle>
          <DialogDescription>
            Modify the details of the gift code. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-4">
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reward type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REWARD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
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
                          <Input
                            type="number"
                            placeholder="Amount"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value, 10) || 0)
                            }
                            value={field.value ?? 0}
                          />
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
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <RewardFields
                  prefix="listRewards"
                  index={index}
                  control={form.control}
                  form={form}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  rewardType: "GOLD",
                  rewardAmount: 1000,
                  monsterId: 0,
                  iapKey: "",
                  artifactInfo: {
                    Artifact_PieceType: "None",
                    Artifact_Rarity: "None",
                    ClassChar: "A",
                  },
                })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currClaimCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Claims</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxClaimCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Claims</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="expireDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expires in (days from now)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function CodeListManager() {
  const [selectedDb, setSelectedDb] = useState<DbKey>("db1");
  const [cachedData, setCachedData] = useState<Record<DbKey, GiftCode[]>>({ db1: [], db2: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [filterText, setFilterText] = useState("");
  const [showExpired, setShowExpired] = useState(false);
  const [showMaxed, setShowMaxed] = useState(false);
  const [editingCode, setEditingCode] = useState<GiftCode | null>(null);
  const { toast } = useToast();
  const listRef = useRef<FixedSizeList>(null);


  const codes = useMemo(() => cachedData[selectedDb] || [], [cachedData, selectedDb]);

  const fetchCodes = useCallback(async (dbKey: DbKey, forceRefresh = false) => {
    if (!forceRefresh && cachedData[dbKey].length > 0) {
      // Data already cached, no need to fetch again unless forced
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedCodes = await getAllGiftCodes(dbKey);
      const sortedCodes = fetchedCodes.sort((a, b) => a.code.localeCompare(b.code));
      setCachedData(prev => ({ ...prev, [dbKey]: sortedCodes }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching codes",
        description: `Could not retrieve gift codes from ${dbKey}.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [cachedData, toast]);

  useEffect(() => {
    fetchCodes(selectedDb);
  }, [selectedDb, fetchCodes]);

   useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [filterText, selectedDb]);

  const handleRefresh = () => {
    fetchCodes(selectedDb, true);
  };

  const handleDelete = (codeId: string) => {
    startDeleteTransition(async () => {
      try {
        await deleteGiftCode(codeId, selectedDb);
        toast({
          title: "Code Deleted",
          description: `Code has been successfully deleted from ${selectedDb}.`,
          className: "bg-green-500 text-white",
        });
        fetchCodes(selectedDb, true); // Force refresh the list
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: error.message || `Could not delete code from ${selectedDb}.`,
        });
      }
    });
  };

  const filteredCodes = useMemo(() => {
    const now = new Date();
    return codes
      .filter((code) =>
        code.code.toLowerCase().includes(filterText.toLowerCase())
      )
      .filter((code) => (showExpired ? parseISO(code.expire) < now : true))
      .filter((code) =>
        showMaxed ? code.currClaimCount >= code.maxClaimCount : true
      );
  }, [codes, filterText, showExpired, showMaxed]);

  const handleDeleteFiltered = () => {
    startDeleteTransition(async () => {
        const codesToDelete = filteredCodes.map(c => c.id);
        if (codesToDelete.length === 0) {
            toast({ title: "No codes to delete."});
            return;
        }

        const promises = codesToDelete.map(id => deleteGiftCode(id, selectedDb));
        try {
            await Promise.all(promises);
            toast({
                title: "Bulk Delete Successful",
                description: `${codesToDelete.length} codes have been deleted from ${selectedDb}.`,
                className: "bg-green-500 text-white",
            });
            fetchCodes(selectedDb, true); // Refresh
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Bulk Delete Failed",
                description: `An error occurred while deleting codes from ${selectedDb}.`,
            });
        }
    });
  }

  const handleEditClose = () => {
    setEditingCode(null);
    fetchCodes(selectedDb, true); // Refresh list after editing
  };
  
  const ListHeader = () => (
     <div className="flex items-center sticky top-0 bg-background z-10 border-b font-medium text-muted-foreground h-12">
        <div className="p-4 flex-1">Code</div>
        <div className="p-4 w-28 text-center shrink-0">Claims</div>
        <div className="p-4 w-32 shrink-0">Expires</div>
        <div className="p-4 w-28 text-center shrink-0">Rewards</div>
        <div className="p-4 w-32 text-right shrink-0">Actions</div>
    </div>
  )

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const code = filteredCodes[index];
    if (!code) return null;

    return (
        <div style={style} className="flex items-center border-b hover:bg-muted/50">
           <div className="p-4 flex-1 font-mono min-w-0 truncate">{code.code}</div>
           <div className="p-4 w-28 text-center shrink-0">
              {code.currClaimCount} / {code.maxClaimCount}
            </div>
            <div className="p-4 w-32 shrink-0">
              {new Date(code.expire).toLocaleDateString()}
            </div>
            <div className="p-4 w-28 text-center shrink-0">
              {code.listRewards.length}
            </div>
            <div className="p-4 w-32 text-right shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCode(code)}
                >
                  <FilePenLine className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the code "{code.code}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(code.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
           </div>
        </div>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Gift Code List</CardTitle>
          <div className="flex items-center gap-4">
            <Select onValueChange={(value) => setSelectedDb(value as DbKey)} defaultValue={selectedDb}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select a database" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="db1">Database 1 (Android)</SelectItem>
                <SelectItem value="db2">Database 2 (iOS)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Filter codes..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showExpired"
                  checked={showExpired}
                  onCheckedChange={(checked) => setShowExpired(Boolean(checked))}
                />
                <label htmlFor="showExpired" className="text-sm font-medium">
                  Hết hạn
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showMaxed"
                  checked={showMaxed}
                  onCheckedChange={(checked) => setShowMaxed(Boolean(checked))}
                />
                <label htmlFor="showMaxed" className="text-sm font-medium">
                  Hết lượt nhập
                </label>
              </div>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={filteredCodes.length === 0 || isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa ({filteredCodes.length}) mã đã lọc
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete {filteredCodes.length} codes from {selectedDb}. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteFiltered} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
          <div className="rounded-md border h-[60vh] relative">
             {isLoading ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
             ) : (
                <>
                  <ListHeader />
                  {filteredCodes.length > 0 ? (
                      <FixedSizeList
                          ref={listRef}
                          height={_listHeight - 48} // container height minus header height
                          itemCount={filteredCodes.length}
                          itemSize={65} // Row height + border
                          width="100%"
                          className="min-w-[800px]"
                      >
                          {Row}
                      </FixedSizeList>
                  ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                          No codes found.
                      </div>
                  )}
              </>
            )}
          </div>

          <Dialog open={!!editingCode} onOpenChange={(open) => !open && handleEditClose()}>
            <DialogContent className="max-w-3xl">
              {editingCode && (
                <EditCodeForm code={editingCode} onClose={handleEditClose} dbKey={selectedDb} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
