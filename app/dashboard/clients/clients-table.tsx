"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconLoader2,
  IconMail,
  IconMapPin,
  IconPencil,
  IconPhone,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "@/app/actions/clients";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth/auth-client";
import { type ClientInput, clientSchema } from "@/lib/validation/clients";

type Client = Awaited<ReturnType<typeof getClients>>[number];

export function ClientsTable() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const role = session?.user?.role ?? "user";
  const isAdmin = role === "admin";

  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = React.useState<Client | null>(
    null,
  );

  // --- Data Fetching ---
  const fetchClients = React.useCallback(async (searchTerm?: string) => {
    setIsLoading(true);
    try {
      const data = await getClients(searchTerm);
      setClients(data);
    } catch {
      toast.error("Failed to fetch clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(search);
  };

  // --- Shared Form ---
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", phoneNumber: "", address: "" },
  });

  React.useEffect(() => {
    if (editingClient) {
      form.reset({
        name: editingClient.name,
        email: editingClient.email ?? "",
        phoneNumber: editingClient.phone ?? "",
        address: editingClient.address ?? "",
      });
    } else {
      form.reset({ name: "", email: "", phoneNumber: "", address: "" });
    }
  }, [editingClient, form]);

  // --- Actions ---
  const onCreate = async (data: ClientInput) => {
    toast.promise(createClient(data), {
      loading: "Creating client...",
      success: () => {
        setIsCreateOpen(false);
        fetchClients();
        return "Client created successfully";
      },
      error: (err) => err.message || "Failed to create client",
    });
  };

  const onUpdate = async (data: ClientInput) => {
    if (!editingClient) return;
    toast.promise(updateClient(editingClient.id, data), {
      loading: "Updating client...",
      success: () => {
        setEditingClient(null);
        fetchClients();
        return "Client updated successfully";
      },
      error: (err) => err.message || "Failed to update client",
    });
  };

  const onDelete = async () => {
    if (!deletingClient) return;
    toast.promise(deleteClient(deletingClient.id), {
      loading: "Deleting client...",
      success: () => {
        setDeletingClient(null);
        fetchClients();
        return "Client deleted successfully";
      },
      error: (err) => err.message || "Failed to delete client",
    });
  };

  if (sessionLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full max-w-sm"
        >
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </form>

        {/* Create Button (No asChild) */}
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) form.reset();
          }}
        >
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 cursor-pointer">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Client
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new client.
              </DialogDescription>
            </DialogHeader>
            <ClientForm form={form} onSubmit={onCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <IconLoader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email ?? "—"}</TableCell>
                  <TableCell>{client.phone ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {client.address ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit Button (No asChild) */}
                      <Dialog
                        open={editingClient?.id === client.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingClient(null);
                        }}
                      >
                        <DialogTrigger
                          onClick={() => setEditingClient(client)}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 cursor-pointer"
                        >
                          <IconPencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Client</DialogTitle>
                            <DialogDescription>
                              Update the details for{" "}
                              <span className="font-semibold">
                                {client.name}
                              </span>
                              .
                            </DialogDescription>
                          </DialogHeader>
                          <ClientForm form={form} onSubmit={onUpdate} />
                        </DialogContent>
                      </Dialog>

                      {/* Delete Button (Admin Only, No asChild) */}
                      {isAdmin && (
                        <AlertDialog
                          open={deletingClient?.id === client.id}
                          onOpenChange={(open) => {
                            if (!open) setDeletingClient(null);
                          }}
                        >
                          <AlertDialogTrigger
                            onClick={() => setDeletingClient(client)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 w-8 cursor-pointer"
                          >
                            <IconTrash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete{" "}
                                <span className="font-semibold">
                                  {client.name}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setDeletingClient(null)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role indicator */}
      <p className="text-xs text-muted-foreground">
        Signed in as{" "}
        <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
          {role}
        </Badge>
        {!isAdmin && " · Contact an admin to delete clients."}
      </p>
    </div>
  );
}

// --- Reusable Form ---
function ClientForm({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ClientInput>>;
  onSubmit: (data: ClientInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <div className="relative">
          <IconUser className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder="John Doe"
            className="pl-9"
            {...register("name")}
          />
        </div>
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            className="pl-9"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <div className="relative">
          <IconPhone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phoneNumber"
            placeholder="0241234567"
            className="pl-9"
            {...register("phoneNumber")}
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-sm text-destructive">
            {errors.phoneNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <IconMapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder="123 Main St, City"
            className="pl-9"
            {...register("address")}
          />
        </div>
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      <DialogFooter className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Client"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
