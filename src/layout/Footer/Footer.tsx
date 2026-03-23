import React from 'react';
import { useMeasure } from 'react-use';
import Popovers from '../../components/bootstrap/Popovers';

const Footer = () => {
	const [ref, { height }] = useMeasure<HTMLDivElement>();

	const root = document.documentElement;
	root.style.setProperty('--footer-height', `${height}px`);

	return (
		<footer ref={ref} className='footer'>
			<div className='container-fluid'>
				<div className='row'>
					<div className='col'>
						<Popovers
							title='Footer.tsx'
							desc={<code>src/layout/Footer/Footer.tsx</code>}>
							Footer
						</Popovers>
						<code className='ps-3'>Footer.tsx</code>
					</div>
					<div className='col-auto'>
						<Popovers
							title='Footer.tsx'
							desc={<code>src/layout/Footer/Footer.tsx</code>}>
							Footer
						</Popovers>
						<code className='ps-3'>Footer.tsx</code>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
