import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/home-care")({ component: () => <Outlet /> });
