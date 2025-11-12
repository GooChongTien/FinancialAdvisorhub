import React from "react";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * Unified Search/Filter/Sort Bar Component
 *
 * Usage:
 * <SearchFilterBar
 *   searchValue={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   filterButton={<PopoverTrigger asChild><Button>...</Button></PopoverTrigger>}
 *   sortButton={<PopoverTrigger asChild><Button>...</Button></PopoverTrigger>}
 *   rightActions={<Button>Custom Action</Button>}  // Optional: for view toggles etc
 * />
 */
export function SearchFilterBar({
  searchValue = "",
  onSearchChange,
  filterButton,
  sortButton,
  placeholder = "Search...",
  rightActions,
  className,
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange?.("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Button (passed as prop) */}
      {filterButton}

      {/* Sort Button (passed as prop) */}
      {sortButton}

      {/* Optional Right Actions (e.g., view mode toggle) */}
      {rightActions && <div className="flex-shrink-0">{rightActions}</div>}
    </div>
  );
}

export default SearchFilterBar;
