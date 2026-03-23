import React, { FC, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { authPages } from '../../../menu';
import AuthContext from '../../../contexts/authContext';
import { store } from '../../../store/store';

export interface LocationStateInterface {
	from: string;
	message?: string;
}

const Login: FC = () => {
	const { setUser } = useContext(AuthContext);
	const dispatch = useDispatch<any>();
	const navigate = useNavigate();
	const { t } = useTranslation(['authPage']);
	const [focusedField, setFocusedField] = useState<string | null>(null);

	const formik = useFormik({
		initialValues: {
			loginUsername: '',
			loginPassword: '',
		},
		validate: (values) => {
			const errors: { loginUsername?: string; loginPassword?: string } = {};
			if (!values.loginUsername) errors.loginUsername = t('Required');
			if (!values.loginPassword) errors.loginPassword = t('Required');
			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			// ── Uses the correct action from auth.ts: getLogin ────────────────
			await dispatch.auth
				.getLogin({
					userid: values.loginUsername,
					password: values.loginPassword,
				})
				.then(() => {
					const { auth } = store.getState();
					if (auth.user?.success || auth.token) {
						// Success — write username to AuthContext (localStorage 'token')
						if (setUser) setUser(values.loginUsername);
						navigate('/overview');
					} else {
						formik.setFieldError(
							'loginPassword',
							auth.message || t('Invalid credentials'),
						);
					}
				})
				.catch(() => {
					formik.setFieldError('loginPassword', t('Login failed. Please try again.'));
				});
		},
	});

	const handleGoogleLogin = () => alert('Google OAuth — wire up your SDK here');
	const handleMicrosoftLogin = () => alert('Microsoft MSAL — wire up your SDK here');

	const inputStyle = (field: string): React.CSSProperties => ({
		width: '100%',
		padding: '13px 16px',
		background: 'rgba(255,255,255,0.07)',
		border: `1px solid ${focusedField === field ? 'rgba(0,200,255,0.8)' : 'rgba(0,200,255,0.3)'}`,
		borderRadius: 10,
		color: '#fff',
		fontSize: 14,
		outline: 'none',
		boxSizing: 'border-box' as const,
		transition: 'border-color 0.2s, box-shadow 0.2s',
		boxShadow: focusedField === field ? '0 0 0 3px rgba(0,200,255,0.15)' : 'none',
	});

	return (
		<div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<img src='/login-bg.png' alt=''
				style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, filter: 'brightness(1.15)' }} />
			<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,10,0.35)', zIndex: 1 }} />
			<div style={{ position: 'relative', zIndex: 2, width: 440, maxWidth: '92vw', background: 'rgba(5,15,35,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,200,255,0.2)', boxShadow: '0 0 40px rgba(0,180,255,0.15)', borderRadius: 16, padding: '36px 36px 32px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
					<img src='/ravity-logo.png' alt='Ravity' style={{ height: 64, width: 'auto', marginBottom: 12 }} />
					<p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Fleet Intelligence Platform</p>
				</div>
				<h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 22, textAlign: 'center' }}>Sign In</h2>
				{formik.errors.loginPassword && formik.submitCount > 0 && (
					<div style={{ background: 'rgba(244,67,54,0.15)', border: '1px solid rgba(244,67,54,0.4)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ff8a80', fontSize: 13 }}>
						⚠️ {formik.errors.loginPassword}
					</div>
				)}
				<form onSubmit={formik.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div>
						{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
						<label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email Address</label>
						<input id='loginUsername' name='loginUsername' type='text'
							value={formik.values.loginUsername} onChange={formik.handleChange}
							onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
							placeholder='Enter your username or email' autoComplete='username'
							style={inputStyle('email')} />
					</div>
					<div>
						{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
						<label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
						<input id='loginPassword' name='loginPassword' type='password'
							value={formik.values.loginPassword} onChange={formik.handleChange}
							onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
							placeholder='Enter your password' autoComplete='current-password'
							style={inputStyle('password')} />
					</div>
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
						<Link to={`/${authPages.forgetPassword.path}`} style={{ color: 'rgba(0,200,255,0.8)', fontSize: 12, textDecoration: 'none' }}>
							Forgot Password? Click here
						</Link>
					</div>
					<button type='submit' disabled={formik.isSubmitting}
						style={{ width: '100%', padding: '13px', background: formik.isSubmitting ? 'rgba(0,150,200,0.5)' : 'linear-gradient(135deg,#00c8ff,#0066ff)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 15, cursor: formik.isSubmitting ? 'not-allowed' : 'pointer', marginTop: 4, letterSpacing: 0.5, boxShadow: formik.isSubmitting ? 'none' : '0 4px 20px rgba(0,150,255,0.4)' }}>
						{formik.isSubmitting ? '⏳ Signing in...' : 'SIGN IN'}
					</button>
				</form>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
					<div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
					<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>or continue with</span>
					<div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
				</div>
				<div style={{ display: 'flex', gap: 10 }}>
					<button type='button' onClick={handleGoogleLogin}
						style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
						onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.15)'; }}
						onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.08)'; }}>
						<svg width='16' height='16' viewBox='0 0 24 24'>
							<path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
							<path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
							<path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
							<path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
						</svg>
						Google
					</button>
					<button type='button' onClick={handleMicrosoftLogin}
						style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
						onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.15)'; }}
						onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.08)'; }}>
						<svg width='16' height='16' viewBox='0 0 21 21'>
							<rect x='1' y='1' width='9' height='9' fill='#f25022' />
							<rect x='11' y='1' width='9' height='9' fill='#7fba00' />
							<rect x='1' y='11' width='9' height='9' fill='#00a4ef' />
							<rect x='11' y='11' width='9' height='9' fill='#ffb900' />
						</svg>
						Microsoft
					</button>
				</div>
			</div>
		</div>
	);
};

export default Login;
