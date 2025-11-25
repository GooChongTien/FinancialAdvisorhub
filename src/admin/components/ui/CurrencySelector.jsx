import React, { useEffect, useMemo, useState } from "react";
import { resolveSupabaseAuthToken } from "@/admin/utils/supabaseAuthToken";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from "./select";
import { Input } from "./input";

const LOCAL_STORAGE_KEY = "preferred_currency";
const DEFAULT_CURRENCY = "SGD";
const PERSISTABLE_CURRENCIES = new Set(["SGD", "USD", "MYR", "CNY", "INR", "EUR", "GBP"]);

const CURRENCIES = [
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "EUR", name: "Euro", symbol: "EUR" },
  { code: "GBP", name: "British Pound", symbol: "GBP" },
  { code: "JPY", name: "Japanese Yen", symbol: "JPY" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "CNY" },
  { code: "INR", name: "Indian Rupee", symbol: "INR" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
];

const SUPPORTED_CODES = new Set(CURRENCIES.map((c) => c.code));

function isSupported(code) {
  return typeof code === "string" && SUPPORTED_CODES.has(code.toUpperCase());
}

const COMMON_CODES = ["SGD", "USD", "MYR"];

export function CurrencySelector({
  value,
  onChange,
  persistSelection = true,
  defaultCurrency = DEFAULT_CURRENCY,
  className = "",
}) {
  const [internalValue, setInternalValue] = useState(null);
  const [search, setSearch] = useState("");

  // Load saved preference (local first, then server) on first mount when uncontrolled
  useEffect(() => {
    if (value !== undefined) return;
    let cancelled = false;

    const applySaved = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved && isSupported(saved)) {
          setInternalValue(saved);
          return true;
        }
      } catch {
        // ignore storage errors
      }
      setInternalValue(defaultCurrency);
      return false;
    };

    const fetchServerPreference = async () => {
      if (typeof fetch !== "function") return;
      const headers = {};
      const supabaseToken = resolveSupabaseAuthToken();
      if (supabaseToken) headers.Authorization = `Bearer ${supabaseToken}`;
      try {
        const res = await fetch("/api/preferences/currency", { method: "GET", headers });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const serverCurrency = typeof data?.currency === "string" ? data.currency.toUpperCase() : null;
        if (!serverCurrency || !isSupported(serverCurrency) || cancelled) return;
        setInternalValue(serverCurrency);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, serverCurrency);
        } catch {
          // ignore persistence errors
        }
      } catch {
        // ignore network failures
      }
    };

    applySaved();
    fetchServerPreference();

    return () => {
      cancelled = true;
    };
  }, [defaultCurrency, value]);

  const selectedValue = value !== undefined ? value : internalValue ?? defaultCurrency;

  const handleSelect = (code) => {
    setInternalValue(code);
    if (persistSelection) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, code);
      } catch {
        // ignore persistence errors in non-browser environments
      }
      if (typeof fetch === "function" && PERSISTABLE_CURRENCIES.has(code)) {
        const headers = { "Content-Type": "application/json" };
        const supabaseToken = resolveSupabaseAuthToken();
        if (supabaseToken) headers.Authorization = `Bearer ${supabaseToken}`;
        fetch("/api/preferences/currency", {
          method: "POST",
          headers,
          body: JSON.stringify({ currency: code }),
        }).catch(() => {
          // ignore network errors; local preference is already saved
        });
      }
    }
    onChange?.(code);
  };

  const filteredCurrencies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.symbol.toLowerCase().includes(term),
    );
  }, [search]);

  const commonCurrencies = filteredCurrencies.filter((c) => COMMON_CODES.includes(c.code));
  const otherCurrencies = filteredCurrencies.filter((c) => !COMMON_CODES.includes(c.code));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-slate-800">Select Currency</label>
      <Select value={selectedValue} onValueChange={handleSelect}>
        <SelectTrigger className="w-[220px]" data-testid="currency-trigger">
          <SelectValue placeholder="Choose currency" />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <Input
              data-testid="currency-search"
              placeholder="Search currency"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <SelectGroup>
            {commonCurrencies.length > 0 && (
              <>
                <SelectLabel>Common</SelectLabel>
                {commonCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code} data-testid={`currency-${currency.code}`}>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{currency.code}</span>
                      <span className="text-slate-600">{currency.name}</span>
                      <span className="ml-auto text-slate-500">{currency.symbol}</span>
                    </span>
                  </SelectItem>
                ))}
                <SelectSeparator />
              </>
            )}
            {otherCurrencies.length > 0 && (
              <>
                <SelectLabel>All</SelectLabel>
                {otherCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code} data-testid={`currency-${currency.code}`}>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{currency.code}</span>
                      <span className="text-slate-600">{currency.name}</span>
                      <span className="ml-auto text-slate-500">{currency.symbol}</span>
                    </span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectGroup>
          {filteredCurrencies.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500" data-testid="currency-empty">
              No currencies found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default CurrencySelector;
