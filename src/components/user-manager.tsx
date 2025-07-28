"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Image from "next/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  getAllUsers,
  getBannedAccounts,
  banUser,
  unbanUser,
} from "@/lib/firebase-service";
import type { User, BannedAccounts, DbKey } from "@/types";
import { Loader2, ArrowUpDown, UserX, UserCheck } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

type SortKey = "MonsterLevel" | "NumDiamond" | "NumGold" | "default";

type UserManagerProps = {
    dbKey: DbKey;
};

export function UserManager({ dbKey }: UserManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [bannedAccounts, setBannedAccounts] = useState<BannedAccounts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, startActionTransition] = useTransition();
  const [filterText, setFilterText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userList, bannedList] = await Promise.all([
        getAllUsers(dbKey),
        getBannedAccounts(dbKey),
      ]);
      setUsers(userList);
      setBannedAccounts(bannedList);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: `Could not retrieve user or ban list from ${dbKey}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dbKey]);

  const handleBanToggle = (user: User) => {
    startActionTransition(async () => {
      try {
        if (user.isBanned) {
          await unbanUser(user.id, dbKey);
          toast({
            title: "User Unbanned",
            description: `${user.UserName} has been successfully unbanned on ${dbKey}.`,
            className: "bg-green-500 text-white",
          });
        } else {
          await banUser(user.id, dbKey);
          toast({
            title: "User Banned",
            description: `${user.UserName} has been successfully banned on ${dbKey}.`,
            variant: "destructive",
          });
        }
        fetchData(); // Refresh data after action
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Action Failed",
          description: error.message || "Could not perform the action.",
        });
      }
    });
  };

  const filteredAndSortedUsers = useMemo(() => {
    const usersWithBanStatus = users.map((user) => ({
      ...user,
      isBanned: !!bannedAccounts[user.id],
    }));

    let filtered = usersWithBanStatus;
    if (filterText) {
      filtered = usersWithBanStatus.filter(
        (user) =>
          user.UserName.toLowerCase().includes(filterText.toLowerCase()) ||
          user.UID.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (sortKey !== "default") {
      return [...filtered].sort((a, b) => b[sortKey] - a[sortKey]);
    }

    return filtered;
  }, [users, bannedAccounts, filterText, sortKey]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };
  
  const truncateString = (str: string, num: number) => {
    if (!str || str.length <= num) {
      return str;
    }
    return str.slice(0, num) + '...';
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Input
          placeholder="Search by Username or UID..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
           <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
           <Select onValueChange={(value) => setSortKey(value as SortKey)} defaultValue="default">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="MonsterLevel">Top Level</SelectItem>
                    <SelectItem value="NumDiamond">Top Diamond</SelectItem>
                    <SelectItem value="NumGold">Top Gold</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <ScrollArea className="h-[60vh] min-w-[800px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>UID</TableHead>
                <TableHead className="text-right">Level</TableHead>
                <TableHead className="text-right">Diamond</TableHead>
                <TableHead className="text-right">Gold</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedUsers.length > 0 ? (
                filteredAndSortedUsers.map((user) => (
                  <TableRow key={user.id} className={user.isBanned ? "bg-destructive/10" : ""}>
                    <TableCell>
                      <Image
                        src={user.AvatarUrl || `https://placehold.co/40x40.png`}
                        alt={user.UserName || 'User avatar'}
                        width={40}
                        height={40}
                        className="rounded-full"
                        unoptimized
                        data-ai-hint="avatar"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="w-40 inline-block">{truncateString(user.UserName, 40)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{user.UserName}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <span className="w-40 inline-block">{truncateString(user.UID, 40)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.UID}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(user.MonsterLevel)}</TableCell>
                    <TableCell className="text-right text-blue-500">{formatNumber(user.NumDiamond)}</TableCell>
                    <TableCell className="text-right text-amber-500">{formatNumber(user.NumGold)}</TableCell>
                    <TableCell className="text-center">
                        {user.isBanned ? (
                           <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">Banned</span>
                        ) : (
                           <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">Active</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button
                          variant={user.isBanned ? "default" : "destructive"}
                          size="sm"
                          onClick={() => handleBanToggle(user)}
                          disabled={isActionPending}
                        >
                          {isActionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                            user.isBanned ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />
                          }
                          <span className="ml-2">{user.isBanned ? 'Unban' : 'Ban'}</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
