import { Component, ErrorInfo, ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
		errorInfo: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorInfo: null };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);

		this.setState({
			error,
			errorInfo,
		});

		// Log to error tracking service if available
		if (import.meta.env.PROD) {
			// TODO: Add Sentry/DataDog error tracking here
			// Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
		}
	}

	private handleReload = () => {
		// Clear potentially corrupted state and reload
		window.location.reload();
	};

	private handleGoHome = () => {
		window.location.href = '/';
	};

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className='flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-900'>
					<div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-800'>
						<div className='mb-4 flex items-center justify-center'>
							<div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
								<svg
									className='h-8 w-8 text-red-600 dark:text-red-400'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
									strokeWidth={2}>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
									/>
								</svg>
							</div>
						</div>

						<h2 className='mb-2 text-center text-xl font-bold text-zinc-900 dark:text-zinc-100'>
							Algo salió mal
						</h2>

						<p className='mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400'>
							La página encontró un error inesperado. Puedes intentar recargar o volver
							al inicio.
						</p>

						<div className='flex gap-3'>
							<Button
								onClick={this.handleGoHome}
								variant='outline'
								className='flex-1'>
								Ir al inicio
							</Button>
							<Button onClick={this.handleReload} className='flex-1'>
								Recargar página
							</Button>
						</div>

						{import.meta.env.DEV && this.state.error && (
							<details className='mt-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900'>
								<summary className='cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300'>
									Ver detalles del error (desarrollo)
								</summary>
								<pre className='mt-2 overflow-auto text-xs text-red-600 dark:text-red-400'>
									{this.state.error.toString()}
									{this.state.errorInfo && (
										<code>{this.state.errorInfo.componentStack}</code>
									)}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
