import { ReactNode } from "react";

export interface Coordination {
  x: number;
  y: number;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
}
