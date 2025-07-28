"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { addData, deleteData, getData, updateData } from "@/lib/firebase-service";
import type { Data } from "@/types";
import { DataCard } from "./data-card";
import { DataForm } from "./data-form";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

export function FirebaseConnector() {
  const [data, setData] = useState<Data[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const fetchedData = await getData();
        setData(fetchedData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: "Could not load data from Firebase.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const handleAdd = (values: Omit<Data, "id" | "timestamp">) => {
    startTransition(async () => {
      try {
        const newData = await addData(values);
        setData((prev) => [newData, ...prev].sort((a,b) => b.timestamp - a.timestamp));
        toast({
          title: "Success",
          description: `Entry "${newData.name}" has been added.`,
        });
        setAddDialogOpen(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not add the new entry.",
        });
      }
    });
  };

  const handleUpdate = (id: string, values: Omit<Data, "id" | "timestamp">) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const updatedItem = await updateData(id, values);
          setData((prev) =>
            prev.map((item) => (item.id === id ? updatedItem : item)).sort((a,b) => b.timestamp - a.timestamp)
          );
          toast({
            title: "Success",
            description: `Entry "${updatedItem.name}" has been updated.`,
          });
          resolve();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update the entry.",
          });
          reject(error);
        }
      });
    });
  };

  const handleDelete = (id: string) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await deleteData(id);
          setData((prev) => prev.filter((item) => item.id !== id));
          toast({
            title: "Success",
            description: "The entry has been deleted.",
          });
          resolve();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the entry.",
          });
          reject(error);
        }
      });
    });
  };
  
  const renderSkeletons = () => (
    Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/3" />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </CardFooter>
      </Card>
    ))
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Data Dashboard</h1>
          <p className="text-muted-foreground">
            A real-time view of your Firebase data.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Entry</DialogTitle>
              <DialogDescription>
                Fill in the details for your new Firebase data entry.
              </DialogDescription>
            </DialogHeader>
            <DataForm onSubmit={handleAdd} isPending={isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {renderSkeletons()}
        </div>
      ) : data.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((item) => (
            <DataCard
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Data Found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You don't have any data yet. Start by adding a new entry.
          </p>
        </div>
      )}
    </div>
  );
}
