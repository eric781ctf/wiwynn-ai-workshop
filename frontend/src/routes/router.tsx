import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth, RequireRole, RedirectIfAuthed } from "@/features/auth/guards";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { VehiclesPage } from "@/pages/VehiclesPage";
import { EmployeesPage } from "@/pages/EmployeesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthed />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "vehicles", element: <VehiclesPage /> },
          {
            element: <RequireRole role="admin" />,
            children: [{ path: "employees", element: <EmployeesPage /> }],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
