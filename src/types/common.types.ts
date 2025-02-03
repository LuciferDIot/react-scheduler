export interface Coordination {
  x: number;
  y: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}
