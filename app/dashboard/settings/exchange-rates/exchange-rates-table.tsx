"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconArrowsExchange,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { format } from "date-fns";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createExchangeRate,
  deleteExchangeRate,
  getExchangeRates,
  updateExchangeRate,
} from "@/app/actions/exchange-rates";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ExchangeRateInput,
  exchangeRateSchema,
} from "@/lib/validation/exchange-rates";

type Rate = Awaited<ReturnType<typeof getExchangeRates>>[number];
const CURRENCIES = ["USD", "RMB", "GHS"] as const;

// Currency display helpers
const CURRENCY_LABELS: Record<string, string> = {
  USD: "🇺 USD",
  RMB: "🇨 RMB",
  GHS: "🇬 GHS",
};

export function ExchangeRatesTable({ initialRates }: { initialRates: Rate[] }) {
  const [rates, setRates] = React.useState<Rate[]>(initialRates);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filterCurrency, setFilterCurrency] = React.useState<
    "ALL" | "USD" | "RMB" | "GHS"
  >("ALL");
  const [filterActive, setFilterActive] = React.useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<Rate | null>(null);
  const [deletingRate, setDeletingRate] = React.useState<Rate | null>(null);

  // --- Data Fetching ---
  const fetchRates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getExchangeRates(
        filterActive === "ACTIVE" ? { activeOnly: true } : undefined,
      );
      setRates(data);
    } catch {
      toast.error("Failed to fetch exchange rates");
    } finally {
      setIsLoading(false);
    }
  }, [filterActive]);

  // Client-side filter for currency (avoids extra server calls)
  const filteredRates = React.useMemo(() => {
    return rates.filter((r) => {
      const currencyMatch =
        filterCurrency === "ALL" || r.toCurrency === filterCurrency;
      const activeMatch =
        filterActive === "ALL" ||
        (filterActive === "ACTIVE" && r.isActive) ||
        (filterActive === "INACTIVE" && !r.isActive);
      return currencyMatch && activeMatch;
    });
  }, [rates, filterCurrency, filterActive]);

  // --- Shared Form ---
  const form = useForm<ExchangeRateInput>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      fromCurrency: "USD",
      toCurrency: "GHS",
      rate: "",
      effectiveFrom: new Date(),
      effectiveTo: null,
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (editingRate) {
      form.reset({
        fromCurrency: editingRate.fromCurrency as "USD" | "RMB" | "GHS",
        toCurrency: editingRate.toCurrency as "USD" | "RMB" | "GHS",
        rate: editingRate.rate,
        effectiveFrom: new Date(editingRate.effectiveFrom),
        effectiveTo: editingRate.effectiveTo
          ? new Date(editingRate.effectiveTo)
          : null,
        isActive: editingRate.isActive,
      });
    } else {
      form.reset({
        fromCurrency: "USD",
        toCurrency: "GHS",
        rate: "",
        effectiveFrom: new Date(),
        effectiveTo: null,
        isActive: true,
      });
    }
  }, [editingRate, form]);

  // --- Actions ---
  const onCreate = async (data: ExchangeRateInput) => {
    toast.promise(createExchangeRate(data), {
      loading: "Creating rate...",
      success: () => {
        setIsCreateOpen(false);
        fetchRates();
        return "Exchange rate created";
      },
      error: (err) => err.message || "Failed to create rate",
    });
  };

  const onUpdate = async (data: ExchangeRateInput) => {
    if (!editingRate) return;
    toast.promise(updateExchangeRate(editingRate.id, data), {
      loading: "Updating rate...",
      success: () => {
        setEditingRate(null);
        fetchRates();
        return "Exchange rate updated";
      },
      error: (err) => err.message || "Failed to update rate",
    });
  };

  const onDelete = async () => {
    if (!deletingRate) return;
    toast.promise(deleteExchangeRate(deletingRate.id), {
      loading: "Deleting rate...",
      success: () => {
        setDeletingRate(null);
        fetchRates();
        return "Exchange rate deleted";
      },
      error: (err) => err.message || "Failed to delete rate",
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Currency Filter */}
          <Select
            value={filterCurrency}
            onValueChange={(v) => setFilterCurrency(v as typeof filterCurrency)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All currencies</SelectItem>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active Filter */}
          <Select
            value={filterActive}
            onValueChange={(v) => setFilterActive(v as typeof filterActive)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active only</SelectItem>
              <SelectItem value="INACTIVE">Inactive only</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRates}
            disabled={isLoading}
          >
            <IconRefresh
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {/* Create Button (Removed asChild) */}
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) form.reset();
          }}
        >
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 cursor-pointer">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Rate
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create Exchange Rate</DialogTitle>
              <DialogDescription>
                Set a new currency exchange rate. It will be applied based on
                its effective dates.
              </DialogDescription>
            </DialogHeader>
            <RateForm form={form} onSubmit={onCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {CURRENCIES.map((currency) => {
          const activeRate = rates.find(
            (r) => r.toCurrency === currency && r.isActive,
          );
          return (
            <div key={currency} className="rounded-lg border p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                USD → {currency}
              </p>
              <p className="text-xl font-bold">
                {activeRate ? parseFloat(activeRate.rate).toFixed(4) : "—"}
              </p>
              {activeRate ? (
                <p className="text-xs text-muted-foreground">
                  Since{" "}
                  {format(new Date(activeRate.effectiveFrom), "MMM d, yyyy")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No active rate</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Effective To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <IconLoader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredRates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No exchange rates found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>{rate.fromCurrency}</span>
                      <IconArrowsExchange className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{rate.toCurrency}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {parseFloat(rate.rate).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(rate.effectiveFrom), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {rate.effectiveTo ? (
                      format(new Date(rate.effectiveTo), "MMM d, yyyy")
                    ) : (
                      <span className="text-muted-foreground">Ongoing</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rate.isActive ? (
                      <Badge variant="default" className="gap-1">
                        <IconCircleCheck className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <IconCircleX className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit */}
                      <Dialog
                        open={editingRate?.id === rate.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingRate(null);
                        }}
                      >
                        <DialogTrigger
                          onClick={() => setEditingRate(rate)}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer"
                        >
                          <IconPencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                          <DialogHeader>
                            <DialogTitle>Edit Exchange Rate</DialogTitle>
                            <DialogDescription>
                              Update the rate for{" "}
                              <span className="font-semibold">
                                {rate.fromCurrency} → {rate.toCurrency}
                              </span>
                              .
                            </DialogDescription>
                          </DialogHeader>
                          <RateForm form={form} onSubmit={onUpdate} />
                        </DialogContent>
                      </Dialog>

                      {/* Delete */}
                      <AlertDialog
                        open={deletingRate?.id === rate.id}
                        onOpenChange={(open) => {
                          if (!open) setDeletingRate(null);
                        }}
                      >
                        <AlertDialogTrigger
                          onClick={() => setDeletingRate(rate)}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 w-8 cursor-pointer"
                        >
                          <IconTrash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this rate?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the{" "}
                              <span className="font-semibold">
                                {rate.fromCurrency} → {rate.toCurrency}
                              </span>{" "}
                              rate of{" "}
                              <span className="font-semibold font-mono">
                                {parseFloat(rate.rate).toFixed(4)}
                              </span>
                              . This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setDeletingRate(null)}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={onDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredRates.length} rate{filteredRates.length !== 1 ? "s" : ""} shown
        {filterCurrency !== "ALL" || filterActive !== "ALL"
          ? " (filtered)"
          : ""}
      </p>
    </div>
  );
}

// --- Rate Form ---
function RateForm({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ExchangeRateInput>>;
  onSubmit: (data: ExchangeRateInput) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const fromCurrency = watch("fromCurrency");
  const toCurrency = watch("toCurrency");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {/* Currency Pair */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>From Currency</Label>
          <Controller
            control={control}
            name="fromCurrency"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as "USD" | "RMB" | "GHS")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CURRENCY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.fromCurrency && (
            <p className="text-sm text-destructive">
              {errors.fromCurrency.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>To Currency</Label>
          <Controller
            control={control}
            name="toCurrency"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as "USD" | "RMB" | "GHS")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CURRENCY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.toCurrency && (
            <p className="text-sm text-destructive">
              {errors.toCurrency.message}
            </p>
          )}
        </div>
      </div>

      {/* Rate */}
      <div className="space-y-2">
        <Label htmlFor="rate">
          Rate{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (1 {fromCurrency} = ? {toCurrency})
          </span>
        </Label>
        <Input id="rate" placeholder="e.g. 13.5500" {...register("rate")} />
        {errors.rate && (
          <p className="text-sm text-destructive">{errors.rate.message}</p>
        )}
      </div>

      {/* Effective From - Fixed Date Handling */}
      <div className="space-y-2">
        <Label htmlFor="effectiveFrom">Effective From</Label>
        <Controller
          control={control}
          name="effectiveFrom"
          render={({ field }) => (
            <Input
              id="effectiveFrom"
              type="date"
              value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value ? new Date(e.target.value) : undefined,
                )
              }
            />
          )}
        />
        {errors.effectiveFrom && (
          <p className="text-sm text-destructive">
            {errors.effectiveFrom.message}
          </p>
        )}
      </div>

      {/* Effective To - Fixed Date Handling */}
      <div className="space-y-2">
        <Label htmlFor="effectiveTo">
          Effective To{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (optional)
          </span>
        </Label>
        <Controller
          control={control}
          name="effectiveTo"
          render={({ field }) => (
            <Input
              id="effectiveTo"
              type="date"
              value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
              onChange={(e) =>
                field.onChange(e.target.value ? new Date(e.target.value) : null)
              }
            />
          )}
        />
        {errors.effectiveTo && (
          <p className="text-sm text-destructive">
            {errors.effectiveTo?.message}
          </p>
        )}
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">
            Only active rates are used in calculations
          </p>
        </div>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Rate"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
