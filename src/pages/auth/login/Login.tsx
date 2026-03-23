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

// ── Animated data badges that float over the image ────────────────────────────
const badges = [
	{ top: '12%',  left: '38%', label: 'Fuel Efficiency', value: '16.2 km/l',  icon: '⛽', color: '#e91e8c' },
	{ top: '8%',   left: '62%', label: 'DTC Faults',      value: '0 Active',   icon: '✅', color: '#4caf50' },
	{ top: '52%',  left: '72%', label: 'CO₂ Emissions',   value: '2.1 kg/trip',icon: '🌿', color: '#26c6da' },
	{ top: '72%',  left: '60%', label: 'Battery Voltage', value: '12.8 V',     icon: '🔋', color: '#ffa726' },
	{ top: '68%',  left: '36%', label: 'GPS Tracking',    value: 'Active',     icon: '📍', color: '#7c4dff' },
];

const Login: FC = () => {
	const { setUser }  = useContext(AuthContext);
	const dispatch     = useDispatch<any>();
	const navigate     = useNavigate();
	const { t }        = useTranslation(['authPage']);
	const [showPwd, setShowPwd] = useState(false);
	const [focused, setFocused] = useState<string | null>(null);

	const formik = useFormik({
		initialValues: { loginUsername: '', loginPassword: '' },
		validate: (values) => {
			const errors: { loginUsername?: string; loginPassword?: string } = {};
			if (!values.loginUsername) errors.loginUsername = t('Required');
			if (!values.loginPassword) errors.loginPassword = t('Required');
			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			await dispatch.auth
				.getLogin({ userid: values.loginUsername, password: values.loginPassword })
				.then(() => {
					const { auth } = store.getState();
					if (auth.user?.success || auth.token) {
						if (setUser) setUser(values.loginUsername);
						navigate('/dt/about');
					} else {
						formik.setFieldError('loginPassword', auth.message || t('Invalid credentials'));
					}
				})
				.catch(() => {
					formik.setFieldError('loginPassword', t('Login failed. Please try again.'));
				});
		},
	});

	const inp = (field: string): React.CSSProperties => ({
		width: '100%',
		padding: '12px 14px',
		background: focused === field ? '#fff' : '#f7f8fa',
		border: `1.5px solid ${
			(formik.errors as any)[field] && formik.submitCount > 0
				? '#ef5350'
				: focused === field
				? '#e91e8c'
				: '#e0e0e0'
		}`,
		borderRadius: 10,
		color: '#111',
		fontSize: 14,
		outline: 'none',
		boxSizing: 'border-box' as const,
		transition: 'border-color 0.2s, box-shadow 0.2s',
		boxShadow: focused === field ? '0 0 0 3px rgba(233,30,140,0.1)' : 'none',
	});

	return (
		<>
			<style>{`
				@keyframes loginFadeUp {
					from { opacity: 0; transform: translateY(24px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				@keyframes badgePulse {
					0%,100% { transform: translateY(0); }
					50%     { transform: translateY(-5px); }
				}
				.login-badge { animation: badgePulse 3s ease-in-out infinite; }
				.login-badge:nth-child(2) { animation-delay: 0.5s; }
				.login-badge:nth-child(3) { animation-delay: 1s; }
				.login-badge:nth-child(4) { animation-delay: 1.5s; }
				.login-badge:nth-child(5) { animation-delay: 2s; }
				.login-form-wrap { animation: loginFadeUp 0.55s ease both; }
				.login-sign-in-btn:hover:not(:disabled) {
					transform: translateY(-2px);
					box-shadow: 0 8px 28px rgba(233,30,140,0.45) !important;
				}
				.login-sign-in-btn { transition: all 0.2s !important; }
				@media (max-width: 767px) {
					.login-left-panel {
						width: 100% !important;
						min-width: 0 !important;
						max-width: 100% !important;
						padding: 32px 28px !important;
					}
					.login-right-panel { display: none !important; }
				}
				@media (min-width: 768px) and (max-width: 1024px) {
					.login-left-panel {
						width: 45% !important;
						min-width: 320px !important;
						padding: 36px 36px !important;
					}
				}
			`}</style>

			{/* ── Root: full-screen flex split ─────────────────────────────── */}
			<div style={{
				position: 'fixed', inset: 0,
				display: 'flex',
				fontFamily: "'Inter','Roboto',sans-serif",
				overflow: 'hidden',
			}}>

				{/* ══ LEFT PANEL — login form ══════════════════════════════════ */}
				<div className="login-left-panel" style={{
					width: '38%',
					minWidth: '360px',
					maxWidth: '460px',
					flexShrink: 0,
					height: '100%',
					background: '#ffffff',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					padding: '40px 44px',
					overflowY: 'auto',
					boxSizing: 'border-box' as const,
					boxShadow: '4px 0 32px rgba(0,0,0,0.10)',
					position: 'relative',
					zIndex: 2,
				}}>
					<div className="login-form-wrap">
						{/* ── Logo ── */}
						<div style={{ marginBottom: 24 }}>
							{/* Inline SVG — Ravity full logo, no external file needed */}
							<div style={{
								marginBottom: 16,
								padding: '8px 16px',
								background: '#ffffff',
								borderRadius: 10,
								border: '1.5px solid #f0f0f0',
								boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
								display: 'inline-block',
							}}>
								<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="60 400 990 320"
									style={{ height: 52, width: 'auto', display: 'block' }}>
									<defs><style>{`.cls-1{fill:none;}.cls-2{fill:#0bb4f1;}.cls-3{fill:#f00d69;}.cls-4{fill:#5d2ca4;}.cls-5{fill:#041f9b;}.cls-6{fill:#2c55ba;}.cls-7{fill:#29044d;}.cls-8{fill:#020348;}.cls-9{fill:#010a71;}.cls-10{fill:#00d3cf;}.cls-11{fill:#0095c4;}.cls-12{fill:#000237;}.cls-13{fill:#000234;}.cls-14{fill:#004697;}.cls-15{fill:#00328f;}.cls-16{fill:#000129;}.cls-17{fill:#111827;}`}</style></defs>
									<path className="cls-1" d="M220.71,536.58l29.5-51.1c.16-.29.33-.57.49-.85a34.55,34.55,0,1,0-60,0c.16.28.33.56.49.85Z"/>
									<path className="cls-1" d="M301.33,574h-59l29.6,51.27.05.1A34.55,34.55,0,1,0,302.9,574h-1.57Z"/>
									<path className="cls-1" d="M242.33,549.06h60.54a34.55,34.55,0,1,0-30.27-52.44c-.25.45-.51.9-.77,1.34Z"/>
									<path className="cls-1" d="M140.09,549.06h59L169.59,498c-.26-.44-.52-.89-.77-1.34a34.55,34.55,0,1,0-30.29,52.44Z"/>
									<path className="cls-1" d="M139.21,574h-.55a34.55,34.55,0,1,0,30.78,51.37l.1-.19L199.09,574H139.21Z"/>
									<path className="cls-2" d="M191.21,485.48c-.16-.29-.33-.57-.49-.85l.33.58.11.18,29.55,51.19h0Z"/>
									<path className="cls-2" d="M139.89,574h0Z"/>
									<path className="cls-2" d="M138.53,549.06a34.55,34.55,0,1,1,30.29-52.44,59.45,59.45,0,0,1-7.62-29.15,60.1,60.1,0,0,1,.54-8.07,59.52,59.52,0,0,0-59,102.14,59.62,59.62,0,0,1,35.76-12.48Z"/>
									<path className="cls-3" d="M338.65,561.54a61.06,61.06,0,0,1-6.72,4.51,59.53,59.53,0,0,1-29,8A34.55,34.55,0,1,1,272,625.39l-.05-.1L242.33,574H227.92l-7.21,12.48,29.5,51.1a59.52,59.52,0,0,0,103.5.73l-10.81-6.24,10.81,6.24a59.52,59.52,0,0,0-15.06-76.79Z"/>
									<path className="cls-3" d="M301.33,549.06h.31q.62,0,1.23,0Z"/>
									<path className="cls-4" d="M140.09,549.06h-1.56c.42,0,.83,0,1.25,0h.31Z"/>
									<path className="cls-4" d="M199.09,574,169.54,625.2l-.1.19A34.55,34.55,0,1,1,138.66,574a59.48,59.48,0,0,1-29.17-8,61.06,61.06,0,0,1-6.72-4.51,59.52,59.52,0,0,0,21.08,104.52,60,60,0,0,0,15.5,2.05,59.66,59.66,0,0,0,51.86-30.51l29.5-51.1L213.5,574Z"/>
									<path className="cls-5" d="M138.66,574h60.43l7.21-12.48-2-3.5-5.19-9H139.78c-.42,0-.83,0-1.25,0a59.62,59.62,0,0,0-35.76,12.48,61.06,61.06,0,0,0,6.72,4.51A59.48,59.48,0,0,0,138.66,574Z"/>
									<polygon className="cls-4" points="227.92 574.02 220.71 586.5 213.5 574.02 213.5 574.02 220.71 586.5 227.92 574.02 227.92 574.02"/>
									<polygon className="cls-4" points="204.28 558.04 206.3 561.54 206.3 561.54 204.28 558.04"/>
									<path className="cls-6" d="M301.64,574h0Z"/>
									<path className="cls-6" d="M272.6,496.62a34.55,34.55,0,1,1,30.27,52.44,59.62,59.62,0,0,1,35.78,12.48,59.52,59.52,0,0,0-59-102.14,59.77,59.77,0,0,1-7.08,37.22Z"/>
									<path className="cls-6" d="M220.71,536.58h0l29.6-51.28.06-.09.33-.58c-.16.28-.33.56-.49.85Z"/>
									<path className="cls-7" d="M302.87,549.06q-.62,0-1.23,0H242.33l-5.19,9-2,3.5L242.33,574H302.9a59.53,59.53,0,0,0,29-8,61.06,61.06,0,0,0,6.72-4.51,59.62,59.62,0,0,0-35.78-12.48Z"/>
									<polygon className="cls-8" points="242.33 574.02 235.12 561.54 227.92 574.02 242.33 574.02"/>
									<polygon className="cls-9" points="199.09 574.02 213.5 574.02 206.3 561.54 199.09 574.02"/>
									<polygon className="cls-6" points="235.12 561.54 237.14 558.04 235.12 561.54 235.12 561.54"/>
									<path className="cls-10" d="M271.83,498c.26-.44.52-.89.77-1.34-.21.35-.42.71-.62,1.07l-.1.19-29.55,51.18h0Z"/>
									<path className="cls-10" d="M190.72,484.63a34.55,34.55,0,1,1,60,0,59.81,59.81,0,0,1,29-25.23,59.52,59.52,0,0,0-117.94,0,59.81,59.81,0,0,1,29,25.23Z"/>
									<path className="cls-10" d="M199.09,549.06h0l-29.6-51.28-.05-.09c-.2-.36-.41-.72-.62-1.07.25.45.51.9.77,1.34Z"/>
									<path className="cls-11" d="M168.82,496.62c.21.35.42.71.62,1.07l.05.09,29.6,51.28H213.5l7.21-12.48-29.55-51.19-.11-.18-.33-.58a59.81,59.81,0,0,0-29-25.23,60.1,60.1,0,0,0-.54,8.07A59.45,59.45,0,0,0,168.82,496.62Z"/>
									<polygon className="cls-10" points="213.5 549.06 213.5 549.06 199.09 549.06 199.09 549.06 199.09 549.06 204.28 558.04 199.09 549.06 213.5 549.06"/>
									<polygon className="cls-12" points="213.5 574.02 220.71 586.5 227.92 574.02 220.71 574.02 213.5 574.02"/>
									<polygon className="cls-10" points="213.5 574.02 213.5 574.02 220.71 574.02 213.5 574.02"/>
									<polygon className="cls-13" points="213.5 549.06 199.09 549.06 204.28 558.04 206.3 561.54 213.5 549.06"/>
									<path className="cls-14" d="M250.7,484.63l-.33.58-.06.09-29.6,51.28,7.21,12.48h14.41l29.55-51.18.1-.19c.2-.36.41-.72.62-1.07a59.77,59.77,0,0,0,7.08-37.22,59.81,59.81,0,0,0-29,25.23Z"/>
									<polygon className="cls-15" points="227.92 549.06 220.71 536.58 220.71 536.58 220.71 536.58 213.5 549.06 220.71 549.06 227.92 549.06"/>
									<polygon className="cls-16" points="227.92 549.06 235.12 561.54 237.14 558.04 242.33 549.06 227.92 549.06"/>
									<polygon className="cls-17" points="227.92 549.06 220.71 549.06 213.5 549.06 206.3 561.54 213.5 574.02 220.71 574.02 227.92 574.02 235.12 561.54 227.92 549.06"/>
									<path className="cls-17" d="M520.65,558q9-12.9,9-31.1a59.36,59.36,0,0,0-3.92-22.07,38.65,38.65,0,0,0-12.21-16.43q-8.29-6.54-21.26-8.54a47,47,0,0,0-6.38-.66c-2.38-.1-4.27-.15-5.68-.15H419.13V623.79h27.34v-49H477l23.78,49h31l-26.13-53.62A35.55,35.55,0,0,0,520.65,558Zm-74.18-53.42H479c1.4,0,2.94.07,4.62.2a23.49,23.49,0,0,1,4.62.81,16.52,16.52,0,0,1,8.55,5.07A20.2,20.2,0,0,1,501,518.6a30.49,30.49,0,0,1,0,16.59,20.2,20.2,0,0,1-4.17,7.94,16.53,16.53,0,0,1-8.55,5.08,24.27,24.27,0,0,1-4.62.8c-1.68.13-3.22.2-4.62.2H446.47Z"/>
									<path className="cls-17" d="M635,531.92a31.93,31.93,0,0,0-16.88-15.28,69.08,69.08,0,0,0-25.54-4.42q-19.59,0-31,8.44a41.88,41.88,0,0,0-15.48,21.92l24.72,7.84a16.86,16.86,0,0,1,9.15-10.36,30.84,30.84,0,0,1,12.56-2.91q10.86,0,15.48,4.52c2.42,2.37,3.87,5.8,4.4,10.26l-13.14,2q-10.56,1.56-18.9,3.27a101.83,101.83,0,0,0-14.37,3.92,41.5,41.5,0,0,0-13.92,8,28.14,28.14,0,0,0-7.49,11,39.31,39.31,0,0,0-2.31,13.77,33.39,33.39,0,0,0,4.17,16.53,30.58,30.58,0,0,0,12.26,12q8.1,4.47,19.75,4.48,14.07,0,23.27-4.88a47.29,47.29,0,0,0,13.72-11.49v13.35h23.92V557.45q0-7.44-.6-13.47A32.26,32.26,0,0,0,635,531.92Zm-25.53,58.9a26.74,26.74,0,0,1-4.17,5.73,28.15,28.15,0,0,1-8.24,6.08,27.51,27.51,0,0,1-12.72,2.67,21.29,21.29,0,0,1-8.14-1.41,11.69,11.69,0,0,1-5.28-4.07,10.87,10.87,0,0,1-1.86-6.38,10.48,10.48,0,0,1,1.16-4.93,12.43,12.43,0,0,1,3.62-4.07,28,28,0,0,1,6.48-3.47,72.2,72.2,0,0,1,8.14-2.41q4.62-1.11,12.17-2.46c3.22-.58,7.1-1.26,11.6-2-.06,1.91-.15,4-.3,6.44A27.42,27.42,0,0,1,609.5,590.82Z"/>
									<polygon className="cls-17" points="699.16 590.42 673.43 515.24 646.09 515.24 685.49 623.79 712.83 623.79 752.23 515.24 724.89 515.24 699.16 590.42"/>
									<rect className="cls-17" x="766.9" y="515.24" width="27.34" height="108.55"/>
									<rect className="cls-17" x="766.9" y="476.04" width="27.34" height="24.12"/>
									<path className="cls-17" d="M852.74,485.08H825.4v30.16H806.91v21.1H825.4v41.42q0,9.75.2,17.44a33.32,33.32,0,0,0,4.22,15.12,25.8,25.8,0,0,0,12.92,11.51,52.64,52.64,0,0,0,19.3,3.82,105.78,105.78,0,0,0,22.06-1.86V601.08a89.32,89.32,0,0,1-17.59.8q-7.93-.51-11.56-6.23a15.93,15.93,0,0,1-2.06-8.09q-.15-5.09-.15-11.41V536.34H884.1v-21.1H852.74Z"/>
									<polygon className="cls-17" points="972.95 515.24 944.6 589.1 916.06 515.24 887.71 515.24 931.5 622.93 913.65 672.04 938.98 672.04 1000.29 515.24 972.95 515.24"/>
								</svg>
							</div>

							{/* Tagline with divider */}
							<div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
								<div style={{ width:3, height:22, background:'linear-gradient(180deg,#e91e8c,#c2185b)', borderRadius:2 }}/>
								<div>
									<div style={{ fontSize:19, fontWeight:800, color:'#111', letterSpacing:-0.3, lineHeight:1.2 }}>
										Vehicle Digital Twin
									</div>
									<div style={{ fontSize:13, color:'#777', fontWeight:500, marginTop:2 }}>
										Aftermarket Intelligence Platform
									</div>
								</div>
							</div>
						</div>

						{/* Heading */}
						<h2 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
							Welcome back
						</h2>
						<p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>
							Sign in to access your dashboard
						</p>

						{/* Error banner */}
						{formik.errors.loginPassword && formik.submitCount > 0 && (
							<div style={{
								background: '#ffebee', border: '1px solid #ef9a9a',
								borderRadius: 8, padding: '10px 14px', marginBottom: 20,
								color: '#c62828', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
							}}>
								⚠️ {formik.errors.loginPassword}
							</div>
						)}

						{/* Form */}
						<form onSubmit={formik.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

							{/* Email */}
							<div>
								<label htmlFor='loginUsername' style={{
									display: 'block', fontSize: 13, fontWeight: 600,
									color: '#444', marginBottom: 7,
								}}>
									Email Address
								</label>
								<input
									id='loginUsername' name='loginUsername' type='text'
									value={formik.values.loginUsername} onChange={formik.handleChange}
									onFocus={() => setFocused('loginUsername')}
									onBlur={() => setFocused(null)}
									placeholder='Enter your email or username'
									autoComplete='username'
									style={inp('loginUsername')}
								/>
								{formik.errors.loginUsername && formik.submitCount > 0 && (
									<span style={{ fontSize: 11, color: '#ef5350', marginTop: 4, display: 'block' }}>
										{formik.errors.loginUsername}
									</span>
								)}
							</div>

							{/* Password */}
							<div>
								<label htmlFor='loginPassword' style={{
									display: 'block', fontSize: 13, fontWeight: 600,
									color: '#444', marginBottom: 7,
								}}>
									Password
								</label>
								<div style={{ position: 'relative' }}>
									<input
										id='loginPassword' name='loginPassword'
										type={showPwd ? 'text' : 'password'}
										value={formik.values.loginPassword} onChange={formik.handleChange}
										onFocus={() => setFocused('loginPassword')}
										onBlur={() => setFocused(null)}
										placeholder='Enter your password'
										autoComplete='current-password'
										style={{ ...inp('loginPassword'), paddingRight: 44 }}
									/>
									{/* Show/hide toggle */}
									<button
										type='button'
										onClick={() => setShowPwd(p => !p)}
										style={{
											position: 'absolute', right: 12, top: '50%',
											transform: 'translateY(-50%)',
											border: 'none', background: 'none',
											cursor: 'pointer', fontSize: 16, color: '#aaa', padding: 0,
											lineHeight: 1,
										}}
										title={showPwd ? 'Hide password' : 'Show password'}
									>
										{showPwd ? '🙈' : '👁'}
									</button>
								</div>
								{formik.errors.loginPassword && formik.submitCount > 0 && !formik.errors.loginPassword.includes('Invalid') && (
									<span style={{ fontSize: 11, color: '#ef5350', marginTop: 4, display: 'block' }}>
										{formik.errors.loginPassword}
									</span>
								)}
							</div>

							{/* Forgot password */}
							<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
								<Link
									to={`/${authPages.forgetPassword.path}`}
									style={{
										color: '#e91e8c', fontSize: 13, fontWeight: 600,
										textDecoration: 'none',
									}}
									onMouseEnter={e => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
									onMouseLeave={e => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
								>
									Forgot password?
								</Link>
							</div>

							{/* Submit */}
							<button
								type='submit'
								disabled={formik.isSubmitting}
								className='login-sign-in-btn'
								style={{
									width: '100%',
									padding: '13px',
									background: formik.isSubmitting
										? '#f8bbd0'
										: 'linear-gradient(135deg,#e91e8c,#c2185b)',
									border: 'none',
									borderRadius: 10,
									color: '#fff',
									fontWeight: 700,
									fontSize: 15,
									cursor: formik.isSubmitting ? 'not-allowed' : 'pointer',
									letterSpacing: 0.5,
									boxShadow: '0 4px 20px rgba(233,30,140,0.3)',
									marginTop: 2,
								}}
							>
								{formik.isSubmitting ? '⏳ Signing in…' : 'Sign In →'}
							</button>
						</form>

						{/* Footer */}
						<p style={{
							marginTop: 32, fontSize: 12, color: '#bbb',
							textAlign: 'center', lineHeight: 1.6,
						}}>
							Vehicle Digital Twin · Aftermarket Intelligence<br />
							© {new Date().getFullYear()} Ravity. All rights reserved.
						</p>
					</div>
				</div>

				{/* ══ RIGHT PANEL — image + floating badges ════════════════════ */}
				<div className="login-right-panel" style={{
					flex: 1,
					height: '100%',
					position: 'relative',
					overflow: 'hidden',
				}}>
					{/* Background image */}
					<img
						src='/login-bg.png'
						alt='Vehicle Digital Twin'
						style={{
							position: 'absolute', inset: 0,
							width: '100%', height: '100%',
							objectFit: 'cover',
							objectPosition: 'left center',
						}}
					/>

					{/* Very light overlay to enhance badge readability without darkening the image */}
					<div style={{
						position: 'absolute', inset: 0,
						background: 'linear-gradient(to right, rgba(255,255,255,0.06) 0%, transparent 40%)',
					}} />

					{/* Floating data badges */}
					{badges.map((b, i) => (
						<div
							key={i}
							className='login-badge'
							style={{
								position: 'absolute',
								top: b.top,
								left: b.left,
								background: 'rgba(255,255,255,0.92)',
								backdropFilter: 'blur(10px)',
								WebkitBackdropFilter: 'blur(10px)',
								border: `1.5px solid ${b.color}33`,
								borderRadius: 12,
								padding: '10px 16px',
								minWidth: 130,
								boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px ${b.color}22`,
								zIndex: 10,
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
								<span style={{ fontSize: 16 }}>{b.icon}</span>
								<span style={{ fontSize: 10, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
									{b.label}
								</span>
							</div>
							<div style={{ fontSize: 16, fontWeight: 800, color: b.color, lineHeight: 1.1 }}>
								{b.value}
							</div>
						</div>
					))}

					{/* Bottom brand strip */}
					<div style={{
						position: 'absolute', bottom: 24, left: 0, right: 0,
						display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
					}}>
						<div style={{
							background: 'rgba(255,255,255,0.88)',
							backdropFilter: 'blur(8px)',
							borderRadius: 30,
							padding: '6px 20px',
							fontSize: 12,
							color: '#555',
							fontWeight: 600,
							boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
							display: 'flex', alignItems: 'center', gap: 8,
						}}>
							<span style={{
								width: 8, height: 8, borderRadius: '50%',
								background: '#4caf50',
								display: 'inline-block',
								boxShadow: '0 0 6px #4caf50',
							}}/>
							Live telematics · All systems nominal
						</div>
					</div>
				</div>

			</div>
		</>
	);
};

export default Login;
