"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconChevronDown,
  IconChevronUp,
  IconLoader2,
  IconPackage,
  IconPencil,
  IconPlane,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShip,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { format } from "date-fns";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  assignShipmentsToBatch,
  createBatch,
  deleteBatch,
  getBatches,
  getUnassignedShipments,
  removeShipmentFromBatch,
  updateBatch,
} from "@/app/actions/batches";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  BATCH_STATUSES,
  type BatchInput,
  type BatchStatus,
  batchSchema,
} from "@/lib/validation/batches";

// ---- Types ----
type Batch = Awaited<ReturnType<typeof getBatches>>[number];
type UnassignedShipment = Awaited<
  ReturnType<typeof getUnassignedShipments>
>[number];

// ---- Constants ----
const STATUS_LABELS: Record<BatchStatus, string> = {
  RECEIVED_AT_WAREHOUSE: "At Warehouse",
  BATCHED: "Batched",
  IN_TRANSIT: "In Transit",
  ARRIVED_AT_PORT: "At Port",
  AVAILABLE_FOR_PICKUP: "Ready for Pickup",
  PICKED_UP: "Picked Up",
  DELIVERED: "Delivered",
};

const STATUS_VARIANTS: Record<
  BatchStatus,
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

const DEFAULT_VALUES: BatchInput = {
  batchNumber: "",
  type: "AIR",
  status: "RECEIVED_AT_WAREHOUSE",
  containerSize: "",
  estimatedDeparture: null,
  estimatedArrival: null,
  notes: "",
};

// ================================================================
// Main Component
// ================================================================
export function BatchesTable({
  initialBatches,
  userRole,
}: {
  initialBatches: Batch[];
  userRole: "admin" | "user";
}) {
  const isAdmin = userRole === "admin";

  const [batches, setBatches] = React.useState<Batch[]>(initialBatches);
  const [isLoading, setIsLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<"ALL" | "AIR" | "SEA">(
    "ALL",
  );
  const [filterStatus, setFilterStatus] = React.useState<"ALL" | BatchStatus>(
    "ALL",
  );
  const [expandedBatchId, setExpandedBatchId] = React.useState<string | null>(
    null,
  );

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingBatch, setEditingBatch] = React.useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = React.useState<Batch | null>(null);

  // Assign shipments state
  const [assigningBatch, setAssigningBatch] = React.useState<Batch | null>(
    null,
  );
  const [unassignedShipments, setUnassignedShipments] = React.useState<
    UnassignedShipment[]
  >([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = React.useState<
    string[]
  >([]);
  const [isAssignLoading, setIsAssignLoading] = React.useState(false);

  // ---- Fetch ----
  const fetchBatches = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBatches({ search: search || undefined });
      setBatches(data);
    } catch {
      toast.error("Failed to fetch batches");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  const filteredBatches = React.useMemo(
    () =>
      batches.filter((b) => {
        const typeMatch = filterType === "ALL" || b.type === filterType;
        const statusMatch = filterStatus === "ALL" || b.status === filterStatus;
        return typeMatch && statusMatch;
      }),
    [batches, filterType, filterStatus],
  );

  // ---- Open assign dialog ----
  const openAssignDialog = async (batch: Batch) => {
    setAssigningBatch(batch);
    setSelectedShipmentIds([]);
    setIsAssignLoading(true);
    try {
      const data = await getUnassignedShipments(batch.type as "AIR" | "SEA");
      setUnassignedShipments(data);
    } catch {
      toast.error("Failed to load unassigned shipments");
    } finally {
      setIsAssignLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningBatch || selectedShipmentIds.length === 0) return;
    toast.promise(
      assignShipmentsToBatch(assigningBatch.id, selectedShipmentIds),
      {
        loading: "Assigning shipments...",
        success: () => {
          setAssigningBatch(null);
          setSelectedShipmentIds([]);
          fetchBatches();
          return `${selectedShipmentIds.length} shipment(s) assigned`;
        },
        error: (err) => err.message || "Failed to assign shipments",
      },
    );
  };

  const handleRemoveShipment = async (shipmentId: string) => {
    toast.promise(removeShipmentFromBatch(shipmentId), {
      loading: "Removing shipment...",
      success: () => {
        fetchBatches();
        return "Shipment removed from batch";
      },
      error: (err) => err.message || "Failed to remove shipment",
    });
  };

  // ---- Form ----
  const form = useForm<BatchInput>({
    resolver: zodResolver(batchSchema),
    defaultValues: DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (editingBatch) {
      form.reset({
        batchNumber: editingBatch.batchNumber,
        type: editingBatch.type as "AIR" | "SEA",
        status: editingBatch.status as BatchStatus,
        containerSize: editingBatch.containerSize ?? "",
        estimatedDeparture: editingBatch.estimatedDeparture
          ? new Date(editingBatch.estimatedDeparture)
          : null,
        estimatedArrival: editingBatch.estimatedArrival
          ? new Date(editingBatch.estimatedArrival)
          : null,
        notes: editingBatch.notes ?? "",
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [editingBatch, form]);

  // ---- Actions ----
  const onCreate = async (data: BatchInput) => {
    toast.promise(createBatch(data), {
      loading: "Creating batch...",
      success: () => {
        setIsCreateOpen(false);
        form.reset(DEFAULT_VALUES);
        fetchBatches();
        return "Batch created";
      },
      error: (err) => err.message || "Failed to create batch",
    });
  };

  const onUpdate = async (data: BatchInput) => {
    if (!editingBatch) return;
    toast.promise(updateBatch(editingBatch.id, data), {
      loading: "Updating batch...",
      success: () => {
        setEditingBatch(null);
        fetchBatches();
        return "Batch updated";
      },
      error: (err) => err.message || "Failed to update batch",
    });
  };

  const onDelete = async () => {
    if (!deletingBatch) return;
    toast.promise(deleteBatch(deletingBatch.id), {
      loading: "Deleting batch...",
      success: () => {
        setDeletingBatch(null);
        fetchBatches();
        return "Batch deleted";
      },
      error: (err) => err.message || "Failed to delete batch",
    });
  };

  // ---- Summary counts ----
  const airCount = batches.filter((b) => b.type === "AIR").length;
  const seaCount = batches.filter((b) => b.type === "SEA").length;
  const inTransitCount = batches.filter(
    (b) => b.status === "IN_TRANSIT",
  ).length;
  const _totalShipments = batches.reduce(
    (acc, b) => acc + (b.shipments?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchBatches();
            }}
            className="relative"
          >
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batch #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </form>

          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as typeof filterType)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="AIR">AIR</SelectItem>
              <SelectItem value="SEA">SEA</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
          >
            <SelectTrigger className="w-[155px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {BATCH_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchBatches}
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
            if (!open) form.reset(DEFAULT_VALUES);
          }}
        >
          <DialogTrigger
            className={`${TRIGGER_CLS} bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 gap-2 cursor-pointer`}
          >
            <IconPlus className="h-4 w-4" />
            New Batch
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Batch</DialogTitle>
              <DialogDescription>
                Leave batch number blank to auto-generate one.
              </DialogDescription>
            </DialogHeader>
            <BatchForm form={form} onSubmit={onCreate} isAdmin={isAdmin} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Batches", value: batches.length },
          { label: "AIR", value: airCount },
          { label: "SEA", value: seaCount },
          { label: "In Transit", value: inTransitCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Batch #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Shipments</TableHead>
              <TableHead>Container</TableHead>
              <TableHead>Est. Departure</TableHead>
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
            ) : filteredBatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <IconPackage className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No batches found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBatches.map((batch) => (
                <React.Fragment key={batch.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/30">
                    {/* Expand toggle */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedBatchId(
                            expandedBatchId === batch.id ? null : batch.id,
                          )
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedBatchId === batch.id ? (
                          <IconChevronUp className="h-4 w-4" />
                        ) : (
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {batch.batchNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {batch.type === "AIR" ? (
                          <IconPlane className="h-3 w-3" />
                        ) : (
                          <IconShip className="h-3 w-3" />
                        )}
                        {batch.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {batch.shipments?.length ?? 0}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">
                        shipment
                        {(batch.shipments?.length ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      {batch.containerSize || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {batch.estimatedDeparture ? (
                        format(
                          new Date(batch.estimatedDeparture),
                          "MMM d, yyyy",
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {batch.estimatedArrival ? (
                        format(new Date(batch.estimatedArrival), "MMM d, yyyy")
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANTS[batch.status as BatchStatus]}
                      >
                        {STATUS_LABELS[batch.status as BatchStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Assign shipments */}
                        <button
                          type="button"
                          onClick={() => openAssignDialog(batch)}
                          className={`${TRIGGER_CLS} border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2.5 cursor-pointer text-xs gap-1`}
                        >
                          <IconPlus className="h-3.5 w-3.5" />
                          Assign
                        </button>

                        {/* Edit — admin only */}
                        {isAdmin && (
                          <Dialog
                            open={editingBatch?.id === batch.id}
                            onOpenChange={(open) => {
                              if (!open) setEditingBatch(null);
                            }}
                          >
                            <DialogTrigger
                              onClick={() => setEditingBatch(batch)}
                              className={`${TRIGGER_CLS} border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer`}
                            >
                              <IconPencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Batch</DialogTitle>
                                <DialogDescription>
                                  Updating{" "}
                                  <span className="font-mono font-semibold">
                                    {batch.batchNumber}
                                  </span>
                                </DialogDescription>
                              </DialogHeader>
                              <BatchForm
                                form={form}
                                onSubmit={onUpdate}
                                isAdmin={isAdmin}
                              />
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Delete — admin only */}
                        {isAdmin && (
                          <AlertDialog
                            open={deletingBatch?.id === batch.id}
                            onOpenChange={(open) => {
                              if (!open) setDeletingBatch(null);
                            }}
                          >
                            <AlertDialogTrigger
                              onClick={() => setDeletingBatch(batch)}
                              className={`${TRIGGER_CLS} bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 w-8 cursor-pointer`}
                            >
                              <IconTrash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete batch?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Permanently delete{" "}
                                  <span className="font-mono font-semibold">
                                    {batch.batchNumber}
                                  </span>
                                  . This will fail if shipments are still
                                  assigned.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={() => setDeletingBatch(null)}
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
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded shipments row */}
                  {expandedBatchId === batch.id && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={9} className="py-0">
                        <div className="py-3 px-2 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Assigned Shipments
                          </p>
                          {!batch.shipments || batch.shipments.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                              No shipments assigned. Click{" "}
                              <strong>Assign</strong> to add some.
                            </p>
                          ) : (
                            <div className="rounded-md border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tracking #</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>CBM</TableHead>
                                    <TableHead>Total (USD)</TableHead>
                                    <TableHead className="text-right">
                                      Remove
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {batch.shipments.map((s) => (
                                    <TableRow key={s.id}>
                                      <TableCell className="font-mono text-sm font-medium">
                                        {s.trackingNumber}
                                      </TableCell>
                                      <TableCell>
                                        {s.client?.name ?? "—"}
                                      </TableCell>
                                      <TableCell>
                                        {s.weight
                                          ? `${parseFloat(s.weight).toFixed(2)} kg`
                                          : "—"}
                                      </TableCell>
                                      <TableCell>
                                        {s.cbm
                                          ? `${parseFloat(s.cbm).toFixed(4)} m³`
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="font-mono">
                                        {s.totalChargeUSD
                                          ? `$${parseFloat(s.totalChargeUSD).toFixed(2)}`
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveShipment(s.id)
                                          }
                                          className={`${TRIGGER_CLS} text-destructive hover:bg-destructive/10 h-7 w-7 cursor-pointer rounded`}
                                        >
                                          <IconX className="h-3.5 w-3.5" />
                                          <span className="sr-only">
                                            Remove
                                          </span>
                                        </button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredBatches.length} batch{filteredBatches.length !== 1 ? "es" : ""}{" "}
        shown
        {filterType !== "ALL" || filterStatus !== "ALL" ? " (filtered)" : ""}
      </p>

      {/* Assign Shipments Dialog */}
      <Dialog
        open={!!assigningBatch}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningBatch(null);
            setSelectedShipmentIds([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Shipments</DialogTitle>
            <DialogDescription>
              Select unassigned{" "}
              <span className="font-semibold">{assigningBatch?.type}</span>{" "}
              shipments to add to batch{" "}
              <span className="font-mono font-semibold">
                {assigningBatch?.batchNumber}
              </span>
            </DialogDescription>
          </DialogHeader>

          {isAssignLoading ? (
            <div className="flex items-center justify-center h-32">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : unassignedShipments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <IconPackage className="h-8 w-8 opacity-40" />
              <p className="text-sm">
                No unassigned {assigningBatch?.type} shipments available.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select all */}
              <div className="flex items-center gap-2 pb-1">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedShipmentIds.length === unassignedShipments.length
                  }
                  onCheckedChange={(checked) => {
                    setSelectedShipmentIds(
                      checked ? unassignedShipments.map((s) => s.id) : [],
                    );
                  }}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Select all ({unassignedShipments.length})
                </label>
              </div>
              <Separator />
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {unassignedShipments.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-md border p-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      id={s.id}
                      checked={selectedShipmentIds.includes(s.id)}
                      onCheckedChange={(checked) => {
                        setSelectedShipmentIds((prev) =>
                          checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id),
                        );
                      }}
                    />
                    <label
                      htmlFor={s.id}
                      className="flex flex-1 items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold">
                          {s.trackingNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.client?.name ?? "Unknown client"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {s.weight && (
                          <p>{parseFloat(s.weight).toFixed(2)} kg</p>
                        )}
                        {s.cbm && <p>{parseFloat(s.cbm).toFixed(4)} m³</p>}
                        {s.totalChargeUSD && (
                          <p className="font-mono font-semibold text-foreground">
                            ${parseFloat(s.totalChargeUSD).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAssigningBatch(null);
                setSelectedShipmentIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedShipmentIds.length === 0 || isAssignLoading}
            >
              Assign{" "}
              {selectedShipmentIds.length > 0
                ? `${selectedShipmentIds.length} shipment${selectedShipmentIds.length !== 1 ? "s" : ""}`
                : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================================================================
// Batch Form
// ================================================================
function BatchForm({
  form,
  onSubmit,
  isAdmin,
}: {
  form: ReturnType<typeof useForm<BatchInput>>;
  onSubmit: (data: BatchInput) => void;
  isAdmin: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {/* Batch Number */}
      <div className="space-y-2">
        <Label htmlFor="batchNumber">
          Batch Number{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (leave blank to auto-generate)
          </span>
        </Label>
        <Input
          id="batchNumber"
          placeholder="e.g. AIR-LXK9Z-4F2A"
          {...register("batchNumber")}
        />
        {errors.batchNumber && (
          <p className="text-sm text-destructive">
            {errors.batchNumber.message}
          </p>
        )}
      </div>

      {/* Type + Status */}
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
                  {BATCH_STATUSES.map((s) => (
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
      </div>

      {/* Container Size */}
      <div className="space-y-2">
        <Label htmlFor="containerSize">
          Container Size{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Input
          id="containerSize"
          placeholder="e.g. 20ft, 40ft HQ"
          {...register("containerSize")}
        />
      </div>

      <Separator />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="estimatedDeparture">
            Est. Departure{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Controller
            control={control}
            name="estimatedDeparture"
            render={({ field }) => (
              <Input
                id="estimatedDeparture"
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedArrival">
            Est. Arrival{" "}
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
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : null,
                  )
                }
              />
            )}
          />
        </div>
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
          placeholder="Any notes about this batch..."
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
            "Save Batch"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
