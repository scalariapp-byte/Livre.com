import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Capture les erreurs de rendu pour éviter un écran blanc et proposer une récupération. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Livre — erreur inattendue', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-8 text-center">
        <h1 className="h-display text-2xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">Vos données sont intactes. Rechargez la page pour continuer.</p>
        <pre className="mt-4 max-w-md overflow-auto rounded-xl bg-surface-2 p-3 text-left text-xs text-muted">{this.state.error.message}</pre>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
          Recharger
        </button>
      </div>
    );
  }
}
