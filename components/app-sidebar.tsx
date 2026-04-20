"use client";

import {
  IconBadge,
  IconBell,
  IconChartBar,
  IconChevronDown,
  IconCreditCard,
  IconCreditCardPay,
  IconLayoutDashboard,
  IconLogout,
  IconPackages,
  IconPlane,
  IconSettings,
  IconShip,
  IconSparkles,
  IconUserCircle,
  IconWallet,
} from "@tabler/icons-react";
import Link from "next/link";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/auth-client";

const navData = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconLayoutDashboard,
    roles: ["user", "admin"],
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: IconUserCircle,
    roles: ["user", "admin"],
  },
  {
    title: "Air Shipment",
    url: "/dashboard/air-shipment",
    icon: IconPlane,
    roles: ["user", "admin"],
  },
  {
    title: "Sea Shipment",
    url: "/dashboard/sea-shipment",
    icon: IconShip,
    roles: ["user", "admin"],
  },
  {
    title: "Payment",
    url: "/dashboard/payment",
    icon: IconCreditCardPay,
    roles: ["user", "admin"],
  },
  {
    title: "Finances",
    url: "/dashboard/finances",
    icon: IconWallet,
    roles: ["user", "admin"],
  },
  {
    title: "Exchange Rate",
    url: "/dashboard/exchange-rates",
    icon: IconCreditCardPay,
    roles: ["admin"],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: IconChartBar,
    roles: ["admin"],
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
    roles: ["admin"],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "user" | "admin";
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function NavUser({ user }: { user: AppSidebarProps["user"] }) {
  const { isMobile } = useSidebar();
  const [isPending, setIsPending] = React.useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  const handleSignOut = async () => {
    setIsPending(true);
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 h-12 w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "User"} />
              <AvatarFallback className="rounded-lg text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user?.name ?? "Guest"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email ?? ""}
              </span>
            </div>
            <IconChevronDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.image ?? ""}
                      alt={user?.name ?? "User"}
                    />
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.name ?? "Guest"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email ?? ""}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconSparkles className="mr-2 size-4" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/dashboard/user-settings" className="w-full">
                <DropdownMenuItem>
                  <IconBadge className="mr-2 size-4" />
                  Account
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>
                <IconCreditCard className="mr-2 size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconBell className="mr-2 size-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isPending}
              className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <IconLogout className="mr-2 size-4" />
              {isPending ? "Signing out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ role = "user", user, ...props }: AppSidebarProps) {
  const userItems = navData.filter(
    (item) => item.roles.includes("user") && item.roles.includes("admin"),
  );
  const adminOnlyItems = navData.filter(
    (item) => item.roles.length === 1 && item.roles[0] === "admin",
  );

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard">
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconPackages className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">CargoFlow</span>
                  <span className="text-xs text-muted-foreground">
                    {role === "admin" ? "Admin Portal" : "User Portal"}
                  </span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "admin" && adminOnlyItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {adminOnlyItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Link href={item.url}>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mx-0" />
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
