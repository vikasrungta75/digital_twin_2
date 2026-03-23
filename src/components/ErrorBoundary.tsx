/**
 * ErrorBoundary.tsx — Generic React error boundary
 * FIX FEAT-05 / FIX 6B: Wraps FleetCopilot (and other critical components)
 * so that API/render failures show a user-friendly retry UI instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary fallback={<MyErrorFallback onRetry={...} />}>
 *     <FleetCopilotContent />
 *   </ErrorBoundary>
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
// FIX CODE-03: logger replaces console calls
import { logger } from '../utils/logger';

interface Props {
	children: ReactNode;
	/** Custom fallback UI. If omitted, a default retry card is shown. */
	fallback?: ReactNode;
	/** Called when the error boundary catches an error */
	onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		this.props.onError?.(error, info);
		// In production you could forward to Sentry here:
		// Sentry.captureException(error, { extra: info });
		if (process.env.NODE_ENV !== 'production') {
			logger.error('[ErrorBoundary] Caught error:', error, info);
		}
	}

	handleRetry = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback;

			return (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '48px 24px',
						textAlign: 'center',
					}}>
					<span
						className='material-icons'
						style={{ fontSize: 48, color: '#f00d69', marginBottom: 16 }}>
						error_outline
					</span>
					<h5 style={{ color: '#1f1e1e', marginBottom: 8 }}>
						Something went wrong
					</h5>
					<p style={{ color: '#888', marginBottom: 24, maxWidth: 360 }}>
						{this.state.error?.message ?? 'An unexpected error occurred.'}
					</p>
					<button
						onClick={this.handleRetry}
						style={{
							background: '#f00d69',
							color: '#fff',
							border: 'none',
							borderRadius: 8,
							padding: '10px 28px',
							fontWeight: 600,
							cursor: 'pointer',
						}}>
						Retry
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
