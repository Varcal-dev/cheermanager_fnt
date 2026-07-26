"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  HOME_ITEM,
  findNavItemForPath,
  findSectionForPath,
} from "./nav-config";

// -----------------------------------------------------------------------------
// Breadcrumbs: Inicio > Sección > Página actual
// Se deriva de NAV_SECTIONS (nav-config.ts), así que se mantiene en sync con
// el sidebar automáticamente. Si la ruta es "/", no se muestra nada.
// -----------------------------------------------------------------------------

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const section = findSectionForPath(pathname);
  const currentItem = findNavItemForPath(pathname);

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={HOME_ITEM.href}>{HOME_ITEM.label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {section && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="flex items-center gap-1 text-muted-foreground">
                <section.icon className="h-3.5 w-3.5" />
                {section.label}
              </span>
            </BreadcrumbItem>
          </>
        )}

        {currentItem && currentItem.href !== "/" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentItem.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default Breadcrumbs;