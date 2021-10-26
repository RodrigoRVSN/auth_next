import { ReactNode } from "react";
import { useCan } from "../hooks/useCan";

interface CanProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
}

export function Can({ children, roles, permissions }: CanProps) {
  const userCanSeeComponents = useCan({ roles, permissions });

  if (!userCanSeeComponents) {
    return null;
  }
  
  return <>{children}</>;
}
