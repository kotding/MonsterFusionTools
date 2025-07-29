"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { listFiles, uploadFile, deleteItem, createFolder } from "@/lib/firebase-service";
import type { StoredFile } from "@/types";
import { UploadCloud, File as FileIcon, Trash2, Download, Copy, Loader2, RefreshCw, Folder, FolderPlus, ChevronRight, Image as ImageIcon, Video, FileText, FileArchive, Music, FileQuestion } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5 text-pink-500" />;
    if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return <FileText className="h-5 w-5 text-green-500" />;
    if (mimeType.startsWith('application/vnd.android.package-archive')) return <FileIcon className="h-5 w-5 text-teal-500" />;
    if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-rar-compressed')) return <FileArchive className="h-5 w-5 text-orange-500" />;
    if (mimeType === 'application/octet-stream') return null; // Don't show icon for placeholder
    return <FileQuestion className="h-5 w-5 text-muted-foreground" />;
};


export function FileManager() {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setCreateFolderOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async (path: string) => {
    setIsLoading(true);
    try {
      const fetchedItems = await listFiles(path);
      const sortedItems = fetchedItems.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      // Filter out the placeholder file from the view
      setItems(sortedItems.filter(item => item.name !== '.placeholder'));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching files",
        description: `Could not retrieve file list from ${path}.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath, fetchFiles]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const uploadPromises = [];
    for (const file of fileList) {
        uploadPromises.push(uploadFile(file, currentPath, (progress) => {
            setUploadProgress(progress);
        }));
    }

    try {
        await Promise.all(uploadPromises);
        toast({
            title: "Upload Successful",
            description: `${fileList.length} file(s) have been uploaded.`,
            className: "bg-green-500 text-white",
        });
        fetchFiles(currentPath); // Refresh the list
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: error.message || "An unexpected error occurred during upload.",
        });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };
  
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (itemToDelete: StoredFile) => {
      startDeleteTransition(async () => {
        // Optimistically update UI
        setItems(prevItems => prevItems.filter(item => item.path !== itemToDelete.path));
        
        try {
            await deleteItem(itemToDelete.path, itemToDelete.isFolder);
            toast({
                title: "Item Deleted",
                description: `"${itemToDelete.name}" has been successfully deleted.`,
                className: "bg-green-500 text-white",
            });
            // No need to call fetchFiles, UI is already updated.
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error.message || `Could not delete "${itemToDelete.name}".`,
            });
            // Revert UI on failure
            fetchFiles(currentPath);
        }
      });
  };
  
  const handleCreateFolder = async () => {
      if (!newFolderName) {
          toast({ variant: "destructive", title: "Folder name cannot be empty." });
          return;
      }
      try {
          await createFolder(currentPath, newFolderName);
          toast({ title: "Folder Created", description: `Folder "${newFolderName}" created.`, className: "bg-green-500 text-white" });
          setNewFolderName("");
          setCreateFolderOpen(false);
          fetchFiles(currentPath);
      } catch (error: any) {
          toast({ variant: "destructive", title: "Folder creation failed", description: error.message });
      }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "The file URL has been copied to your clipboard." });
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setCurrentPath("")} className="hover:text-primary">FileStorage</button>
        {currentPath.split('/').filter(Boolean).map((part, i) => {
            const path = currentPath.split('/').slice(0, i + 1).join('/') + '/';
            return (
                <React.Fragment key={i}>
                    <ChevronRight className="h-4 w-4" />
                    <button onClick={() => setCurrentPath(path)} className="hover:text-primary">{part}</button>
                </React.Fragment>
            )
        })}
    </div>
  );

  return (
    <div 
        className={cn(
            "relative flex h-full flex-col space-y-4 rounded-lg border p-4 transition-colors",
            dragActive && "bg-primary/10"
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={isUploading} multiple />
      
      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary bg-background/80">
            <UploadCloud className="h-16 w-16 text-primary" />
            <p className="mt-4 text-lg font-semibold text-primary">Drop files to upload</p>
        </div>
      )}
      
       {isUploading && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4">
            <div className="mx-auto max-w-xl space-y-2 rounded-lg border bg-background p-4 shadow-2xl">
                <p className="text-center text-sm font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="w-full" />
            </div>
        </div>
      )}
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs />
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => fetchFiles(currentPath)} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && 'animate-spin')} />
            </Button>
            <Dialog open={isCreateFolderOpen} onOpenChange={setCreateFolderOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <FolderPlus className="mr-2 h-4 w-4" /> Create Folder
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>Enter a name for your new folder in the current directory.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="folder-name" className="text-right">Name</Label>
                         <Input id="folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="col-span-3" />
                       </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleCreateFolder}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button onClick={handleUploadButtonClick} disabled={isUploading} size="sm">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload File
            </Button>
        </div>
      </div>
      
      <div className="relative flex-1 overflow-auto rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : items.length > 0 ? (
                   items.map((item) => (
                    <TableRow key={item.path} onDoubleClick={() => item.isFolder && setCurrentPath(item.path)} className={cn(item.isFolder && "cursor-pointer")}>
                        <TableCell className="font-medium">
                           <div className="flex items-center gap-2">
                            {item.isFolder ? <Folder className="h-5 w-5 text-yellow-500" /> : getFileIcon(item.type)}
                            <span>{item.name}</span>
                           </div>
                        </TableCell>
                        <TableCell>{item.isFolder ? 'Folder' : item.type}</TableCell>
                        <TableCell>{item.isFolder ? '--' : formatFileSize(item.size)}</TableCell>
                        <TableCell>{new Date(item.created).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                        {!item.isFolder && (
                            <>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.url)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{item.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item)} disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </TableCell>
                    </TableRow>
                   ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        This folder is empty.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
