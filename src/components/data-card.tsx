"use client";

import { useState } from "react";
import { Pencil, Trash2, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { Data } from "@/types";
import { DataForm } from "./data-form";

interface DataCardProps {
  item: Data;
  onUpdate: (id: string, values: Omit<Data, "id" | "timestamp">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isPending: boolean;
}

export function DataCard({ item, onUpdate, onDelete, isPending }: DataCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleUpdate = async (values: Omit<Data, "id" | "timestamp">) => {
    await onUpdate(item.id, values);
    setIsEditDialogOpen(false);
  };

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Database className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{item.name}</CardTitle>
          <CardDescription>
            Updated {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="break-words text-2xl font-bold text-foreground">{item.value}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Item</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Entry</DialogTitle>
              <DialogDescription>
                Make changes to your Firebase data entry. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <DataForm
              initialData={item}
              onSubmit={handleUpdate}
              isPending={isPending}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Item</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the entry "{item.name}" from your database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(item.id)}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
