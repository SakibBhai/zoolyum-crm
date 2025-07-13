"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  FolderKanban,
  CheckSquare,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

const routes = [
  {
    label: "Dashboard",
    icon: BarChart3,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Clients",
    icon: Users,
    href: "/dashboard/clients",
    color: "text-violet-500",
  },
  {
    label: "Projects",
    icon: FolderKanban,
    href: "/dashboard/projects",
    color: "text-pink-700",
  },
  {
    label: "Tasks",
    icon: CheckSquare,
    href: "/dashboard/tasks",
    color: "text-orange-500",
  },
  {
    label: "Content Calendar",
    icon: Calendar,
    href: "/dashboard/calendar",
    color: "text-emerald-500",
  },
  {
    label: "Team",
    icon: UserCheck,
    href: "/dashboard/team",
    color: "text-purple-500",
  },
  {
    label: "Invoices",
    icon: CreditCard,
    href: "/dashboard/invoices",
    color: "text-amber-500",
  },
  {
    label: "Reports",
    icon: FileText,
    href: "/dashboard/reports",
    color: "text-blue-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden absolute left-4 top-4 z-10">
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="flex flex-col h-full">
            <div className="px-3 py-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Zoolyum CRM</h2>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid items-start px-2 gap-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                      pathname === route.href ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <route.icon className={cn("h-5 w-5", route.color)} />
                    {route.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto border-t px-3 py-4">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="#">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background border-r">
        <div className="flex flex-col h-full">
          <div className="px-3 py-4 border-b">
            <h2 className="text-lg font-semibold">Zoolyum CRM</h2>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 gap-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                    pathname === route.href ? "bg-accent text-accent-foreground" : "transparent",
                  )}
                >
                  <route.icon className={cn("h-5 w-5", route.color)} />
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto border-t px-3 py-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="#">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
