"use client";

import { useState, useEffect, useMemo, useTransition, FormEvent, useRef } from "react";
import Image from "next/image";
import { FixedSizeList } from 'react-window';
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
import { Loader2, ArrowUpDown, UserX, UserCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "MonsterLevel" | "NumDiamond" | "NumGold" | "default";

type UserManagerProps = {
    dbKey: DbKey;
};

export function UserManager({ dbKey }: UserManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [bannedAccounts, setBannedAccounts] = useState<BannedAccounts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, startActionTransition] = useTransition();
  
  const [inputValue, setInputValue] = useState("");
  const [filterText, setFilterText] = useState("");
  const [isFiltering, startFilteringTransition] = useTransition();
  
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const { toast } = useToast();
  const listRef = useRef<FixedSizeList>(null);

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

  useEffect(() => {
    // Reset scroll position when users change
    if (listRef.current) {
        listRef.current.scrollTo(0);
    }
  }, [filterText, sortKey, dbKey]);

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
        
        // Optimistically update the UI
        setBannedAccounts(prev => {
            const newBanned = { ...prev };
            if (user.isBanned) {
                delete newBanned[user.id];
            } else {
                newBanned[user.id] = "Banned";
            }
            return newBanned;
        });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Action Failed",
          description: error.message || "Could not perform the action.",
        });
        // Revert UI on failure
        fetchData();
      }
    });
  };
  
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    startFilteringTransition(() => {
        setFilterText(inputValue);
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
          (user.UserName &&
            user.UserName.toLowerCase().includes(filterText.toLowerCase())) ||
          (user.UID && user.UID.toLowerCase().includes(filterText.toLowerCase()))
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
  
  const truncateString = (str: string | undefined, num: number) => {
    if (!str || str.length <= num) {
      return str;
    }
    return str.slice(0, num) + '...';
  };
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const user = filteredAndSortedUsers[index];
    if (!user) return null;

    return (
        <div style={style} className={cn("flex items-center border-b", user.isBanned ? "bg-destructive/10" : "hover:bg-muted/50")}>
            <div className="p-4 w-[80px] shrink-0">
                <Image
                    src={user.AvatarUrl || `https://placehold.co/40x40.png`}
                    alt={user.UserName || 'User avatar'}
                    width={40}
                    height={40}
                    className="rounded-full"
                    unoptimized
                    data-ai-hint="avatar"
                />
            </div>
            <div className="p-4 flex-1 font-medium min-w-0">
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="truncate">{user.UserName}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{user.UserName}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="p-4 flex-1 font-mono text-xs text-muted-foreground min-w-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="truncate">{user.UID}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{user.UID}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="p-4 w-24 text-right shrink-0">{formatNumber(user.MonsterLevel)}</div>
            <div className="p-4 w-28 text-right text-blue-500 shrink-0">{formatNumber(user.NumDiamond)}</div>
            <div className="p-4 w-28 text-right text-amber-500 shrink-0">{formatNumber(user.NumGold)}</div>
            <div className="p-4 w-28 text-center shrink-0">
                {user.isBanned ? (
                   <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">Banned</span>
                ) : (
                   <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">Active</span>
                )}
            </div>
            <div className="p-4 w-32 text-right shrink-0">
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
            </div>
        </div>
    )
  }

  const ListHeader = () => (
     <div className="flex items-center sticky top-0 bg-background z-10 border-b font-medium text-muted-foreground h-12">
        <div className="p-4 w-[80px] shrink-0">Avatar</div>
        <div className="p-4 flex-1">Username</div>
        <div className="p-4 flex-1">UID</div>
        <div className="p-4 w-24 text-right shrink-0">Level</div>
        <div className="p-4 w-28 text-right shrink-0">Diamond</div>
        <div className="p-4 w-28 text-right shrink-0">Gold</div>
        <div className="p-4 w-28 text-center shrink-0">Status</div>
        <div className="p-4 w-32 text-right shrink-0">Actions</div>
    </div>
  )


  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <form onSubmit={handleSearchSubmit} className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
                placeholder="Search and press Enter..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="max-w-xs pl-10"
             />
        </form>
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
      <div className="rounded-md border h-[60vh] relative">
         {(isFiltering || isLoading) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
         )}
        
        { !isLoading && (
            <>
                <ListHeader />
                {filteredAndSortedUsers.length > 0 ? (
                    <FixedSizeList
                        ref={listRef}
                        height={_listHeight - 48} // 60vh minus header height
                        itemCount={filteredAndSortedUsers.length}
                        itemSize={73} // Row height + border
                        width="100%"
                        className="min-w-[1100px]" // Force horizontal scroll if needed
                    >
                        {Row}
                    </FixedSizeList>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No users found.
                    </div>
                )}
            </>
        )}
      </div>
    </TooltipProvider>
  );
}

// A bit of a hack to get the viewport height for the list
const _listHeight = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 500;
