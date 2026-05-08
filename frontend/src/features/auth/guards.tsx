import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./api";

function FullScreenLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center text-muted-foreground">
      載入中…
    </div>
  );
}

export function RequireAuth() {
  const { user, isReady } = useAuth();
  const location = useLocation();
  if (!isReady) return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function RequireRole({ role }: { role: Role }) {
  const { user, isReady } = useAuth();
  if (!isReady) return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { user, isReady } = useAuth();
  if (!isReady) return <FullScreenLoading />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
