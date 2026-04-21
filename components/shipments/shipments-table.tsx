"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBox,
  IconLoader2,
  IconPackage,
  IconPencil,
  IconPlane,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShip,
  IconTrash,
  IconWeight,
} from "@tabler/icons-react";
import { format } from "date-fns";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { getClients } from "@/app/actions/clients";
import type { getPriceRates } from "@/app/actions/price-rates";
import {
  createShipment,
  deleteShipment,
  getShipments,
  updateShipment,
} from "@/app/actions/shipments";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateShippingCost,
  type ShippingCostBreakdown,
} from "@/lib/utils/pricing";
import {
  type ShipmentInput,
  type ShipmentStatus,
  shipmentSchema,
} from "@/lib/validation/shipments";

// ---- Types ----
type Shipment = Awaited<ReturnType<typeof getShipments>>[number];
type PriceRate = Awaited<ReturnType<typeof getPriceRates>>[number];
type Client = Awaited<ReturnType<typeof getClients>>[number];

// ---- Constants ----
const STATUSES: ShipmentStatus[] = [
  "RECEIVED_AT_WAREHOUSE",
  "BATCHED",
  "IN_TRANSIT",
  "ARRIVED_AT_PORT",
  "AVAILABLE_FOR_PICKUP",
  "PICKED_UP",
  "DELIVERED",
];

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  RECEIVED_AT_WAREHOUSE: "At Warehouse",
  BATCHED: "Batched",
  IN_TRANSIT: "In Transit",
  ARRIVED_AT_PORT: "At Port",
  AVAILABLE_FOR_PICKUP: "Ready for Pickup",
  PICKED_UP: "Picked Up",
  DELIVERED: "Delivered",
};

const STATUS_VARIANTS: Record<
  ShipmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  RECEIVED_AT_WAREHOUSE: "secondary",
  BATCHED: "outline",
  IN_TRANSIT: "default",
  ARRIVED_AT_PORT: "default",
  AVAILABLE_FOR_PICKUP: "default",
  PICKED_UP: "secondary",
  DELIVERED: "secondary",
};

const TRIGGER_CLS =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const DEFAULT_VALUES: ShipmentInput = {
  trackingNumber: "",
  itemNumber: "",
  clientId: "",
  batchId: null,
  priceRateId: "",
  packages: "1",
  weight: "",
  cbm: "",
  estimatedArrival: null,
  notes: "",
  status: "RECEIVED_AT_WAREHOUSE",
};

// ---- Summary card data ----
const SUMMARY_FILTERS: {
  label: string;
  status: ShipmentStatus | "ALL";
}[] = [
  { label: "Total", status: "ALL" },
  { label: "In Transit", status: "IN_TRANSIT" },
  { label: "At Port", status: "ARRIVED_AT_PORT" },
  { label: "Ready for Pickup", status: "AVAILABLE_FOR_PICKUP" },
];

// ================================================================
// Main Component
// ================================================================
export function ShipmentsTable({
  shipmentType,
  initialShipments,
  clients,
  priceRates,
  userRole,
}: {
  shipmentType: "AIR" | "SEA";
  initialShipments: Shipment[];
  clients: Client[];
  priceRates: PriceRate[];
  userRole: "admin" | "user";
}) {
  const isAdmin = userRole === "admin";

  const [shipments, setShipments] =
    React.useState<Shipment[]>(initialShipments);
  const [isLoading, setIsLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<
    ShipmentStatus | "ALL"
  >("ALL");

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingShipment, setEditingShipment] = React.useState<Shipment | null>(
    null,
  );
  const [deletingShipment, setDeletingShipment] =
    React.useState<Shipment | null>(null);
  const [costPreview, setCostPreview] =
    React.useState<ShippingCostBreakdown | null>(null);

  // ---- Fetch ----
  const fetchShipments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getShipments({ search: search || undefined });
      setShipments(data.filter((s) => s.priceRate?.type === shipmentType));
    } catch {
      toast.error("Failed to fetch shipments");
    } finally {
      setIsLoading(false);
    }
  }, [search, shipmentType]);

  const filteredShipments = React.useMemo(
    () =>
      shipments.filter((s) =>
        filterStatus === "ALL" ? true : s.status === filterStatus,
      ),
    [shipments, filterStatus],
  );

  // ---- Form ----
  const form = useForm<ShipmentInput>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const watchedPriceRateId = form.watch("priceRateId");
  const watchedWeight = form.watch("weight");
  const watchedCbm = form.watch("cbm");

  // Live cost preview
  React.useEffect(() => {
    const rate = priceRates.find((r) => r.id === watchedPriceRateId);
    if (rate && (watchedWeight || watchedCbm)) {
      setCostPreview(
        calculateShippingCost(rate, {
          weight: watchedWeight || null,
          cbm: watchedCbm || null,
        }),
      );
    } else {
      setCostPreview(null);
    }
  }, [watchedPriceRateId, watchedWeight, watchedCbm, priceRates]);

  // Populate form when editing
  React.useEffect(() => {
    if (editingShipment) {
      form.reset({
        trackingNumber: editingShipment.trackingNumber,
        itemNumber: editingShipment.itemNumber ?? "",
        clientId: editingShipment.clientId,
        batchId: editingShipment.batchId ?? null,
        priceRateId: editingShipment.priceRateId,
        packages: editingShipment.packages ?? "1",
        weight: editingShipment.weight ?? "",
        cbm: editingShipment.cbm ?? "",
        estimatedArrival: editingShipment.estimatedArrival
          ? new Date(editingShipment.estimatedArrival)
          : null,
        notes: editingShipment.notes ?? "",
        status: editingShipment.status,
      });
    } else {
      form.reset(DEFAULT_VALUES);
      setCostPreview(null);
    }
  }, [editingShipment, form]);

  // ---- Actions ----
  const onCreate = async (data: ShipmentInput) => {
    toast.promise(createShipment(data), {
      loading: "Creating shipment...",
      success: () => {
        setIsCreateOpen(false);
        form.reset(DEFAULT_VALUES);
        setCostPreview(null);
        fetchShipments();
        return "Shipment created";
      },
      error: (err) => err.message || "Failed to create shipment",
    });
  };

  const onUpdate = async (data: ShipmentInput) => {
    if (!editingShipment) return;
    toast.promise(updateShipment(editingShipment.id, data), {
      loading: "Updating shipment...",
      success: () => {
        setEditingShipment(null);
        fetchShipments();
        return "Shipment updated";
      },
      error: (err) => err.message || "Failed to update shipment",
    });
  };

  const onDelete = async () => {
    if (!deletingShipment) return;
    toast.promise(deleteShipment(deletingShipment.id), {
      loading: "Deleting shipment...",
      success: () => {
        setDeletingShipment(null);
        fetchShipments();
        return "Shipment deleted";
      },
      error: (err) => err.message || "Failed to delete shipment",
    });
  };

  // ---- Render ----
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchShipments();
            }}
            className="relative"
          >
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracking #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </form>

          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchShipments}
            disabled={isLoading}
          >
            <IconRefresh
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {/* Create — both roles */}
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              form.reset(DEFAULT_VALUES);
              setCostPreview(null);
            }
          }}
        >
          <DialogTrigger
            className={`${TRIGGER_CLS} bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 gap-2 cursor-pointer`}
          >
            <IconPlus className="h-4 w-4" />
            Add Shipment
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {shipmentType === "AIR" ? (
                  <IconPlane className="h-5 w-5" />
                ) : (
                  <IconShip className="h-5 w-5" />
                )}
                New {shipmentType === "AIR" ? "Air" : "Sea"} Shipment
              </DialogTitle>
              <DialogDescription>
                Fill in the details. Total charge is calculated automatically.
              </DialogDescription>
            </DialogHeader>
            <ShipmentForm
              form={form}
              onSubmit={onCreate}
              clients={clients}
              priceRates={priceRates}
              costPreview={costPreview}
              isAdmin={isAdmin}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {SUMMARY_FILTERS.map(({ label, status }) => (
          <button
            type="button"
            key={label}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg border p-3 text-left space-y-1 transition-colors hover:bg-muted/50 ${
              filterStatus === status ? "border-primary bg-muted/30" : ""
            }`}
          >
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-xl font-bold">
              {status === "ALL"
                ? shipments.length
                : shipments.filter((s) => s.status === status).length}
            </p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Pkgs</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>CBM</TableHead>
              <TableHead>Total (USD)</TableHead>
              <TableHead>Est. Arrival</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <IconLoader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <IconPackage className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No shipments found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>
                    <p className="font-mono font-medium text-sm">
                      {shipment.trackingNumber}
                    </p>
                    {shipment.itemNumber && (
                      <p className="text-xs text-muted-foreground">
                        #{shipment.itemNumber}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{shipment.client?.name ?? "—"}</TableCell>
                  <TableCell>{shipment.packages ?? "—"}</TableCell>
                  <TableCell>
                    {shipment.weight
                      ? `${parseFloat(shipment.weight).toFixed(2)} kg`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {shipment.cbm
                      ? `${parseFloat(shipment.cbm).toFixed(4)} m³`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono">
                    {shipment.totalChargeUSD
                      ? `$${parseFloat(shipment.totalChargeUSD).toFixed(2)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {shipment.estimatedArrival
                      ? format(
                          new Date(shipment.estimatedArrival),
                          "MMM d, yyyy",
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[shipment.status]}>
                      {STATUS_LABELS[shipment.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit — admin only */}
                      {isAdmin && (
                        <Dialog
                          open={editingShipment?.id === shipment.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingShipment(null);
                          }}
                        >
                          <DialogTrigger
                            onClick={() => setEditingShipment(shipment)}
                            className={`${TRIGGER_CLS} border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer`}
                          >
                            <IconPencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Shipment</DialogTitle>
                              <DialogDescription>
                                Updating{" "}
                                <span className="font-mono font-semibold">
                                  {shipment.trackingNumber}
                                </span>
                              </DialogDescription>
                            </DialogHeader>
                            <ShipmentForm
                              form={form}
                              onSubmit={onUpdate}
                              clients={clients}
                              priceRates={priceRates}
                              costPreview={costPreview}
                              isAdmin={isAdmin}
                              isEditing={true}
                            />
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Delete — admin only */}
                      {isAdmin && (
                        <AlertDialog
                          open={deletingShipment?.id === shipment.id}
                          onOpenChange={(open) => {
                            if (!open) setDeletingShipment(null);
                          }}
                        >
                          <AlertDialogTrigger
                            onClick={() => setDeletingShipment(shipment)}
                            className={`${TRIGGER_CLS} bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 w-8 cursor-pointer`}
                          >
                            <IconTrash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete shipment?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Permanently delete{" "}
                                <span className="font-mono font-semibold">
                                  {shipment.trackingNumber}
                                </span>
                                . This will fail if an invoice is attached.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setDeletingShipment(null)}
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
                      )}

                      {!isAdmin && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredShipments.length} shipment
        {filteredShipments.length !== 1 ? "s" : ""} shown
        {filterStatus !== "ALL" ? " (filtered)" : ""}
      </p>
    </div>
  );
}

// ================================================================
// Shipment Form
// ================================================================
function ShipmentForm({
  form,
  onSubmit,
  clients,
  priceRates,
  costPreview,
  isAdmin,
  isEditing,
}: {
  form: ReturnType<typeof useForm<ShipmentInput>>;
  onSubmit: (data: ShipmentInput) => void;
  clients: Client[];
  priceRates: PriceRate[];
  costPreview: ShippingCostBreakdown | null;
  isAdmin: boolean;
  isEditing: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
      {/* Tracking + Item */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="trackingNumber">Tracking Number</Label>
          <Input
            id="trackingNumber"
            placeholder="e.g. CN123456789"
            {...register("trackingNumber")}
          />
          {errors.trackingNumber && (
            <p className="text-sm text-destructive">
              {errors.trackingNumber.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemNumber">
            Item Number{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id="itemNumber"
            placeholder="e.g. ITEM-001"
            {...register("itemNumber")}
          />
        </div>
      </div>

      {/* Client — Fixed to show Name instead of UUID */}
      <div className="space-y-2">
        <Label>Client</Label>
        <Controller
          control={control}
          name="clientId"
          render={({ field }) => {
            const selectedClient = clients.find((c) => c.id === field.value);
            return (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  {selectedClient ? (
                    <span>{selectedClient.name}</span>
                  ) : (
                    <SelectValue placeholder="Select a client" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-medium">{c.name}</span>
                      {c.phone && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {c.phone}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
        {errors.clientId && (
          <p className="text-sm text-destructive">{errors.clientId.message}</p>
        )}
      </div>

      {/* Price Rate — Fixed to show Name instead of UUID */}
      <div className="space-y-2">
        <Label>Price Rate</Label>
        <Controller
          control={control}
          name="priceRateId"
          render={({ field }) => {
            const selectedRate = priceRates.find((r) => r.id === field.value);
            return (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  {selectedRate ? (
                    <span className="truncate">
                      {selectedRate.name}{" "}
                      <span className="text-muted-foreground font-normal text-xs ml-1">
                        (${parseFloat(selectedRate.pricePerKgUSD).toFixed(2)}
                        /kg)
                      </span>
                    </span>
                  ) : (
                    <SelectValue placeholder="Select a rate" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {priceRates.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="font-medium">{r.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ${parseFloat(r.pricePerKgUSD).toFixed(2)}/kg · ${" "}
                        {parseFloat(r.pricePerCbmUSD).toFixed(2)}/cbm
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
        {errors.priceRateId && (
          <p className="text-sm text-destructive">
            {errors.priceRateId.message}
          </p>
        )}
      </div>

      <Separator />

      {/* Packages + Weight + CBM */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="packages">
            <IconBox className="inline h-3.5 w-3.5 mr-1" />
            Packages
          </Label>
          <Input id="packages" placeholder="1" {...register("packages")} />
          {errors.packages && (
            <p className="text-sm text-destructive">
              {errors.packages.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">
            <IconWeight className="inline h-3.5 w-3.5 mr-1" />
            Weight (kg)
          </Label>
          <Input id="weight" placeholder="0.00" {...register("weight")} />
          {errors.weight && (
            <p className="text-sm text-destructive">{errors.weight.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbm">CBM (m³)</Label>
          <Input id="cbm" placeholder="0.0000" {...register("cbm")} />
          {errors.cbm && (
            <p className="text-sm text-destructive">{errors.cbm.message}</p>
          )}
        </div>
      </div>

      {/* Cost Preview */}
      {costPreview && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cost Preview
            </p>
            <Badge variant="outline" className="text-xs">
              {costPreview.chargeSource === "MINIMUM"
                ? "Minimum floor applied"
                : costPreview.chargeSource === "WEIGHT"
                  ? "Charged by weight"
                  : "Charged by volume"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Weight</p>
              <p
                className={`font-mono font-semibold text-sm ${
                  costPreview.chargeSource === "WEIGHT" ? "text-primary" : ""
                }`}
              >
                ${costPreview.weightCharge.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p
                className={`font-mono font-semibold text-sm ${
                  costPreview.chargeSource === "CBM" ? "text-primary" : ""
                }`}
              >
                ${costPreview.cbmCharge.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total (USD)</p>
              <p className="font-mono font-bold text-sm text-primary">
                ${costPreview.totalCharge.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Status — admin edit only */}
      {isEditing && isAdmin && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      )}

      {/* Estimated Arrival */}
      <div className="space-y-2">
        <Label htmlFor="estimatedArrival">
          Estimated Arrival{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Controller
          control={control}
          name="estimatedArrival"
          render={({ field }) => (
            <Input
              id="estimatedArrival"
              type="date"
              value={
                field.value ? format(field.value as Date, "yyyy-MM-dd") : ""
              }
              onChange={(e) =>
                field.onChange(e.target.value ? new Date(e.target.value) : null)
              }
            />
          )}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          Notes{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes..."
          rows={3}
          {...register("notes")}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Shipment"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
