import React, { useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authPages } from '../../../menu';
import { store } from '../../../store/store';
import { useTranslation } from 'react-i18next';

const ForgetPassword = (): JSX.Element => {
	const dispatch = useDispatch<any>();
	const navigate = useNavigate();
	const { t } = useTranslation(['authPage']);
	const [successSending, setSuccessSending] = useState(false);
	const [focusedField, setFocusedField] = useState<string | null>(null);

	const formik = useFormik({
		initialValues: { email: '' },
		validate: (values) => {
			const errors: { email?: string } = {};
			if (!values.email) {
				errors.email = t('Required');
			} else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
				errors.email = t('Invalid email address');
			}
			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			// Exact same call as the original working ForgetPassword
			const spaceId = {
				userid: values.email,
				authType: 'ep',
			};
			await dispatch.auth.getCustomerSpacesAsync(spaceId).then(() => {
				const { auth } = store.getState();
				if (auth.messageCode !== 'MSG_COMMON_0002') {
					setSuccessSending(true);
				} else {
					formik.setFieldError('email', auth.message);
				}
			});
		},
	});

	// login.path = '/' so we navigate to '/' directly — same as original `../${authPages.login.path}`
	const goToLogin = () => navigate(authPages.login.path);

	// ─────────────────────────────────────────────────────────────────────────────
	// Shared full-screen shell: background image + dark overlay + centred card
	// ─────────────────────────────────────────────────────────────────────────────
	const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				width: '100vw',
				height: '100vh',
				overflow: 'hidden',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}>
			{/* Background — identical to Login page */}
			<img
				src='/login-bg.png'
				alt=''
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					zIndex: 0,
					filter: 'brightness(1.15)',
				}}
			/>
			<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,10,0.40)', zIndex: 1 }} />

			{/* Glassmorphism card — always perfectly centred */}
			<div
				style={{
					position: 'relative',
					zIndex: 2,
					width: 440,
					maxWidth: '92vw',
					background: 'rgba(5,15,35,0.78)',
					backdropFilter: 'blur(18px)',
					WebkitBackdropFilter: 'blur(18px)',
					border: '1px solid rgba(0,200,255,0.22)',
					boxShadow: '0 0 50px rgba(0,180,255,0.18)',
					borderRadius: 18,
					padding: '40px 40px 36px',
				}}>
				{/* Ravity logo at the top of every state */}
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
					<img src='/ravity-logo.png' alt='Ravity' style={{ height: 60, width: 'auto', marginBottom: 10 }} />
					<p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>
						Fleet Intelligence Platform
					</p>
				</div>

				{children}
			</div>
		</div>
	);

	// ─────────────────────────────────────────────────────────────────────────────
	// SUCCESS state — replaces ConfirmPage (which was rendering off-centre)
	// ─────────────────────────────────────────────────────────────────────────────
	if (successSending) {
		return (
			<PageShell>
				<div style={{ textAlign: 'center' }}>
					{/* Green checkmark */}
					<div
						style={{
							width: 72,
							height: 72,
							borderRadius: '50%',
							border: '2.5px solid rgba(0,210,100,0.75)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							margin: '0 auto 22px',
							background: 'rgba(0,200,100,0.08)',
							boxShadow: '0 0 28px rgba(0,200,100,0.22)',
						}}>
						<svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
							<polyline
								points='7,18 14,25 27,10'
								stroke='rgba(0,230,110,0.9)'
								strokeWidth='3'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
					</div>

					<h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>
						SUCCESS
					</h2>
					<p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
						If your email address exists within the platform,
						<br />
						you will receive a reset link shortly.
						<br />
						Please check your inbox.
					</p>

					{/* "Return to Login" — uses same navigate as the rest of the app */}
					<button
						onClick={goToLogin}
						style={{
							width: '100%',
							padding: '13px',
							background: 'linear-gradient(135deg,#00c8ff,#0066ff)',
							border: 'none',
							borderRadius: 10,
							color: '#fff',
							fontWeight: 700,
							fontSize: 15,
							cursor: 'pointer',
							letterSpacing: 0.5,
							boxShadow: '0 4px 20px rgba(0,150,255,0.4)',
						}}>
						Return to Login
					</button>
				</div>
			</PageShell>
		);
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// FORM state
	// ─────────────────────────────────────────────────────────────────────────────
	const inputStyle: React.CSSProperties = {
		width: '100%',
		padding: '13px 16px',
		background: 'rgba(255,255,255,0.07)',
		border: `1px solid ${focusedField === 'email' ? 'rgba(0,200,255,0.8)' : 'rgba(0,200,255,0.3)'}`,
		borderRadius: 10,
		color: '#fff',
		fontSize: 14,
		outline: 'none',
		boxSizing: 'border-box' as const,
		transition: 'border-color 0.2s, box-shadow 0.2s',
		boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(0,200,255,0.15)' : 'none',
	};

	return (
		<PageShell>
			<h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
				{t('Forgot Password')}
			</h2>
			<p
				style={{
					color: 'rgba(255,255,255,0.45)',
					fontSize: 13,
					textAlign: 'center',
					marginBottom: 24,
					lineHeight: 1.55,
				}}>
				Enter your email and we'll send you a link
				<br />
				to reset your password.
			</p>

			{/* Validation error */}
			{formik.errors.email && formik.submitCount > 0 && (
				<div
					style={{
						background: 'rgba(244,67,54,0.15)',
						border: '1px solid rgba(244,67,54,0.4)',
						borderRadius: 8,
						padding: '10px 14px',
						marginBottom: 16,
						color: '#ff8a80',
						fontSize: 13,
					}}>
					⚠️ {formik.errors.email}
				</div>
			)}

			{/*
			  IMPORTANT: form uses onSubmit so formik.handleSubmit fires correctly.
			  The original used Bootstrap Button onClick={formik.handleSubmit} outside
			  a <form> — that caused the reset email to not send in some environments.
			  Using a proper <form> + type="submit" is the correct fix.
			*/}
			<form onSubmit={formik.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
				<div>
					<label
						htmlFor='fp-email'
						style={{
							display: 'block',
							color: 'rgba(255,255,255,0.7)',
							fontSize: 13,
							fontWeight: 600,
							marginBottom: 6,
						}}>
						Email Address
					</label>
					<input
						id='fp-email'
						name='email'
						type='email'
						value={formik.values.email}
						onChange={formik.handleChange}
						onFocus={() => setFocusedField('email')}
						onBlur={() => setFocusedField(null)}
						placeholder='Enter your email address'
						autoComplete='email'
						style={inputStyle}
					/>
				</div>

				<button
					type='submit'
					disabled={formik.isSubmitting}
					style={{
						width: '100%',
						padding: '13px',
						background: formik.isSubmitting
							? 'rgba(0,150,200,0.5)'
							: 'linear-gradient(135deg,#00c8ff,#0066ff)',
						border: 'none',
						borderRadius: 10,
						color: '#fff',
						fontWeight: 700,
						fontSize: 15,
						cursor: formik.isSubmitting ? 'not-allowed' : 'pointer',
						marginTop: 4,
						letterSpacing: 0.5,
						boxShadow: formik.isSubmitting ? 'none' : '0 4px 20px rgba(0,150,255,0.4)',
					}}>
					{formik.isSubmitting ? '⏳ Sending...' : 'Send Reset Link'}
				</button>
			</form>

			{/* Back to login */}
			<p
				style={{
					textAlign: 'center',
					marginTop: 22,
					marginBottom: 0,
					fontSize: 13,
					color: 'rgba(255,255,255,0.45)',
				}}>
				Remember your password?{' '}
				<span
					role='button'
					onClick={goToLogin}
					style={{ color: 'rgba(0,200,255,0.85)', cursor: 'pointer', fontWeight: 600 }}>
					Sign in
				</span>
			</p>
		</PageShell>
	);
};

export default ForgetPassword;
