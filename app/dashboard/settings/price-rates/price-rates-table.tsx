"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconPencil,
  IconPlane,
  IconPlus,
  IconRefresh,
  IconShip,
  IconTrash,
} from "@tabler/icons-react";
import { format } from "date-fns";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { getExchangeRates } from "@/app/actions/exchange-rates";
import {
  createPriceRate,
  deletePriceRate,
  getPriceRates,
  updatePriceRate,
} from "@/app/actions/price-rates";
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
  type PriceRateInput,
  priceRateSchema,
} from "@/lib/validation/price-rates";

type PriceRate = Awaited<ReturnType<typeof getPriceRates>>[number];
type ExchangeRate = Awaited<ReturnType<typeof getExchangeRates>>[number];

const TYPE_FILTERS = ["ALL", "AIR", "SEA"] as const;

// Default values matching Zod schema requirements
const DEFAULT_VALUES: PriceRateInput = {
  type: "AIR",
  name: "",
  pricePerKgUSD: "",
  pricePerCbmUSD: "",
  minimumChargeUSD: "0",
  exchangeRateGHSId: "",
  exchangeRateRMBId: "",
  effectiveFrom: new Date(),
  effectiveTo: null,
  isActive: true,
};

// Shared trigger className for buttons without asChild
const triggerBase =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export function PriceRatesTable({
  initialRates,
  exchangeRates,
}: {
  initialRates: PriceRate[];
  exchangeRates: ExchangeRate[];
}) {
  const [rates, setRates] = React.useState<PriceRate[]>(initialRates);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filterType, setFilterType] = React.useState<"ALL" | "AIR" | "SEA">(
    "ALL",
  );
  const [filterActive, setFilterActive] = React.useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<PriceRate | null>(null);
  const [deletingRate, setDeletingRate] = React.useState<PriceRate | null>(
    null,
  );

  const fetchRates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPriceRates(
        filterType !== "ALL" ? { type: filterType } : undefined,
      );
      setRates(data);
    } catch {
      toast.error("Failed to fetch price rates");
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  const filteredRates = React.useMemo(() => {
    return rates.filter((r) => {
      const typeMatch = filterType === "ALL" || r.type === filterType;
      const activeMatch =
        filterActive === "ALL" ||
        (filterActive === "ACTIVE" && r.isActive) ||
        (filterActive === "INACTIVE" && !r.isActive);
      return typeMatch && activeMatch;
    });
  }, [rates, filterType, filterActive]);

  const form = useForm<PriceRateInput>({
    resolver: zodResolver(priceRateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (editingRate) {
      form.reset({
        type: editingRate.type as "AIR" | "SEA",
        name: editingRate.name,
        pricePerKgUSD: editingRate.pricePerKgUSD,
        pricePerCbmUSD: editingRate.pricePerCbmUSD,
        minimumChargeUSD: editingRate.minimumChargeUSD,
        exchangeRateGHSId: editingRate.exchangeRateGHSId,
        exchangeRateRMBId: editingRate.exchangeRateRMBId,
        effectiveFrom: new Date(editingRate.effectiveFrom),
        effectiveTo: editingRate.effectiveTo
          ? new Date(editingRate.effectiveTo)
          : null,
        isActive: editingRate.isActive,
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [editingRate, form]);

  const onCreate = async (data: PriceRateInput) => {
    toast.promise(createPriceRate(data), {
      loading: "Creating price rate...",
      success: () => {
        setIsCreateOpen(false);
        fetchRates();
        return "Price rate created";
      },
      error: (err) => err.message || "Failed to create price rate",
    });
  };

  const onUpdate = async (data: PriceRateInput) => {
    if (!editingRate) return;
    toast.promise(updatePriceRate(editingRate.id, data), {
      loading: "Updating price rate...",
      success: () => {
        setEditingRate(null);
        fetchRates();
        return "Price rate updated";
      },
      error: (err) => err.message || "Failed to update price rate",
    });
  };

  const onDelete = async () => {
    if (!deletingRate) return;
    toast.promise(deletePriceRate(deletingRate.id), {
      loading: "Deleting price rate...",
      success: () => {
        setDeletingRate(null);
        fetchRates();
        return "Price rate deleted";
      },
      error: (err) => err.message || "Failed to delete price rate",
    });
  };

  const ghsRates = exchangeRates.filter((r) => r.toCurrency === "GHS");
  const rmbRates = exchangeRates.filter((r) => r.toCurrency === "RMB");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as typeof filterType)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "ALL" ? "All types" : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

        {/* Create Button */}
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) form.reset(DEFAULT_VALUES);
          }}
        >
          <DialogTrigger
            className={`${triggerBase} bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 cursor-pointer`}
          >
            <IconPlus className="mr-2 h-4 w-4" />
            Add Rate
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Price Rate</DialogTitle>
              <DialogDescription>
                Define a new shipping price rate with associated exchange rates.
              </DialogDescription>
            </DialogHeader>
            <PriceRateForm
              form={form}
              onSubmit={onCreate}
              ghsRates={ghsRates}
              rmbRates={rmbRates}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {(["AIR", "SEA"] as const).map((type) => {
          const active = rates.filter((r) => r.type === type && r.isActive);
          return (
            <div key={type} className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                {type === "AIR" ? (
                  <IconPlane className="h-3.5 w-3.5" />
                ) : (
                  <IconShip className="h-3.5 w-3.5" />
                )}
                {type} Rates
              </div>
              <p className="text-xl font-bold">{active.length}</p>
              <p className="text-xs text-muted-foreground">
                active rate{active.length !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price/KG</TableHead>
              <TableHead>Price/CBM</TableHead>
              <TableHead>Min. Charge</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <IconLoader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredRates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No price rates found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {rate.type === "AIR" ? (
                        <IconPlane className="h-3 w-3" />
                      ) : (
                        <IconShip className="h-3 w-3" />
                      )}
                      {rate.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    ${parseFloat(rate.pricePerKgUSD).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono">
                    ${parseFloat(rate.pricePerCbmUSD).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono">
                    ${parseFloat(rate.minimumChargeUSD).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(rate.effectiveFrom), "MMM d, yyyy")}
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
                      {/* Edit Button */}
                      <Dialog
                        open={editingRate?.id === rate.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingRate(null);
                        }}
                      >
                        <DialogTrigger
                          onClick={() => setEditingRate(rate)}
                          className={`${triggerBase} border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer`}
                        >
                          <IconPencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Price Rate</DialogTitle>
                            <DialogDescription>
                              Update{" "}
                              <span className="font-semibold">{rate.name}</span>
                              .
                            </DialogDescription>
                          </DialogHeader>
                          <PriceRateForm
                            form={form}
                            onSubmit={onUpdate}
                            ghsRates={ghsRates}
                            rmbRates={rmbRates}
                          />
                        </DialogContent>
                      </Dialog>

                      {/* Delete Button */}
                      <AlertDialog
                        open={deletingRate?.id === rate.id}
                        onOpenChange={(open) => {
                          if (!open) setDeletingRate(null);
                        }}
                      >
                        <AlertDialogTrigger
                          onClick={() => setDeletingRate(rate)}
                          className={`${triggerBase} bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 w-8 cursor-pointer`}
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
                              This will permanently delete{" "}
                              <span className="font-semibold">{rate.name}</span>
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
        {filterType !== "ALL" || filterActive !== "ALL" ? " (filtered)" : ""}
      </p>
    </div>
  );
}

// --- Price Rate Form ---
function PriceRateForm({
  form,
  onSubmit,
  ghsRates,
  rmbRates,
}: {
  form: ReturnType<typeof useForm<PriceRateInput>>;
  onSubmit: (data: PriceRateInput) => void;
  ghsRates: ExchangeRate[];
  rmbRates: ExchangeRate[];
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {/* Type + Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AIR">
                    <span className="flex items-center gap-1.5">
                      <IconPlane className="h-3.5 w-3.5" /> AIR
                    </span>
                  </SelectItem>
                  <SelectItem value="SEA">
                    <span className="flex items-center gap-1.5">
                      <IconShip className="h-3.5 w-3.5" /> SEA
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g. Standard Air"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="pricePerKgUSD">Price/KG (USD)</Label>
          <Input
            id="pricePerKgUSD"
            placeholder="0.00"
            {...register("pricePerKgUSD")}
          />
          {errors.pricePerKgUSD && (
            <p className="text-sm text-destructive">
              {errors.pricePerKgUSD.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePerCbmUSD">Price/CBM (USD)</Label>
          <Input
            id="pricePerCbmUSD"
            placeholder="0.00"
            {...register("pricePerCbmUSD")}
          />
          {errors.pricePerCbmUSD && (
            <p className="text-sm text-destructive">
              {errors.pricePerCbmUSD.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumChargeUSD">Min. Charge (USD)</Label>
          <Input
            id="minimumChargeUSD"
            placeholder="0.00"
            {...register("minimumChargeUSD")}
          />
          {errors.minimumChargeUSD && (
            <p className="text-sm text-destructive">
              {errors.minimumChargeUSD.message}
            </p>
          )}
        </div>
      </div>

      {/* Exchange Rates - FIXED */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>GHS Exchange Rate</Label>
          <Controller
            control={control}
            name="exchangeRateGHSId"
            render={({ field }) => {
              // Find the selected object to display the rate instead of UUID
              const selectedRate = ghsRates.find((r) => r.id === field.value);

              return (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    {selectedRate ? (
                      <span className="truncate">
                        {parseFloat(selectedRate.rate).toFixed(4)} GHS
                        {selectedRate.effectiveFrom && (
                          <span className="text-muted-foreground ml-1">
                            ·{" "}
                            {format(
                              new Date(selectedRate.effectiveFrom),
                              "MMM d",
                            )}
                          </span>
                        )}
                      </span>
                    ) : (
                      <SelectValue placeholder="Select GHS rate" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {ghsRates.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No active GHS rates
                      </SelectItem>
                    ) : (
                      ghsRates.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {parseFloat(r.rate).toFixed(4)} GHS
                          {r.effectiveFrom &&
                            ` · ${format(new Date(r.effectiveFrom), "MMM d")}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.exchangeRateGHSId && (
            <p className="text-sm text-destructive">
              {errors.exchangeRateGHSId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>RMB Exchange Rate</Label>
          <Controller
            control={control}
            name="exchangeRateRMBId"
            render={({ field }) => {
              // Find the selected object to display the rate instead of UUID
              const selectedRate = rmbRates.find((r) => r.id === field.value);

              return (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    {selectedRate ? (
                      <span className="truncate">
                        {parseFloat(selectedRate.rate).toFixed(4)} RMB
                        {selectedRate.effectiveFrom && (
                          <span className="text-muted-foreground ml-1">
                            ·{" "}
                            {format(
                              new Date(selectedRate.effectiveFrom),
                              "MMM d",
                            )}
                          </span>
                        )}
                      </span>
                    ) : (
                      <SelectValue placeholder="Select RMB rate" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {rmbRates.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No active RMB rates
                      </SelectItem>
                    ) : (
                      rmbRates.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {parseFloat(r.rate).toFixed(4)} RMB
                          {r.effectiveFrom &&
                            ` · ${format(new Date(r.effectiveFrom), "MMM d")}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.exchangeRateRMBId && (
            <p className="text-sm text-destructive">
              {errors.exchangeRateRMBId.message}
            </p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
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
                value={
                  field.value ? format(field.value as Date, "yyyy-MM-dd") : ""
                }
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : null,
                  )
                }
              />
            )}
          />
          {errors.effectiveTo && (
            <p className="text-sm text-destructive">
              {errors.effectiveTo.message}
            </p>
          )}
        </div>
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
