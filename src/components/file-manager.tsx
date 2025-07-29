"use client";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { listFiles, uploadFile, deleteFile } from "@/lib/firebase-service";
import type { StoredFile, DbKey } from "@/types";
import { UploadCloud, File, Trash2, Download, Copy, Loader2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function FileManager() {
  const [selectedDb, setSelectedDb] = useState<DbKey>("db1");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async (dbKey: DbKey) => {
    setIsLoading(true);
    try {
      const fetchedFiles = await listFiles(dbKey);
      setFiles(fetchedFiles.sort((a,b) => new Date(b.created).getTime() - new Date(a.created).getTime()));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching files",
        description: `Could not retrieve file list from ${dbKey}.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFiles(selectedDb);
  }, [selectedDb, fetchFiles]);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const handleFileUpload = async (fileList: FileList) => {
    const file = fileList[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadFile(file, selectedDb, setUploadProgress);
      toast({
        title: "Upload Successful",
        description: `File "${file.name}" has been uploaded to ${selectedDb}.`,
        className: "bg-green-500 text-white",
      });
      fetchFiles(selectedDb); // Refresh the list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = (fileName: string) => {
      startDeleteTransition(async () => {
        try {
            await deleteFile(fileName, selectedDb);
            toast({
                title: "File Deleted",
                description: `"${fileName}" has been successfully deleted.`,
                className: "bg-green-500 text-white",
            });
            fetchFiles(selectedDb); // Refresh list
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error.message || "Could not delete the file.",
            });
        }
      });
  };

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

  return (
    <div 
        className={cn(
            "relative space-y-6 transition-colors rounded-lg",
            dragActive && "bg-primary/10 border-2 border-dashed border-primary"
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {dragActive && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
            <UploadCloud className="w-16 h-16 text-primary" />
            <p className="mt-4 text-lg font-semibold text-primary">Drop file to upload</p>
        </div>
      )}
      
       {isUploading && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4">
            <div className="max-w-xl mx-auto space-y-2 bg-background border rounded-lg shadow-2xl p-4">
                <p className="text-sm font-medium text-center">Uploading...</p>
                <Progress value={uploadProgress} className="w-full" />
            </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Stored Files</CardTitle>
             <div className="flex items-center gap-2">
                <Select onValueChange={(value) => setSelectedDb(value as DbKey)} defaultValue={selectedDb}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a storage" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="db1">Storage 1 (Android)</SelectItem>
                    <SelectItem value="db2">Storage 2 (iOS)</SelectItem>
                </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => fetchFiles(selectedDb)} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleUploadButtonClick} disabled={isUploading}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload File
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[64px]">Icon</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : files.length > 0 ? (
                           files.map((file) => (
                            <TableRow key={file.name}>
                                <TableCell>
                                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                                        <File className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{file.name}</TableCell>
                                <TableCell>{file.type}</TableCell>
                                <TableCell>{formatFileSize(file.size)}</TableCell>
                                <TableCell>{new Date(file.created).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(file.url)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
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
                                        This action cannot be undone. This will permanently delete the file "{file.name}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteFile(file.name)} disabled={isDeleting}>
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
                                <TableCell colSpan={6} className="h-24 text-center">
                                No files found in this storage.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
