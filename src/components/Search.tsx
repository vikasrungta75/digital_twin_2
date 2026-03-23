import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import Icon from './icon/Icon';
import Input from './bootstrap/forms/Input';
import Modal, { ModalBody, ModalHeader } from './bootstrap/Modal';
import {
	dashboardMenu,
	settings,
} from '../menu';
import Button, { IButtonProps } from './bootstrap/Button';
import useDarkMode from '../hooks/useDarkMode';
import ThemeContext from '../contexts/themeContext';
import { useTranslation } from 'react-i18next';

const Search = () => {
	const { darkModeStatus } = useDarkMode();
	const { mobileDesign } = useContext(ThemeContext);
	const { t } = useTranslation(['common']);

	const refSearchInput = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	const [searchModalStatus, setSearchModalStatus] = useState(false);
	const [searchActive, setSearchActive] = useState(false);

	const styledBtn: IButtonProps = {
		color: darkModeStatus ? 'dark' : 'light',
		hoverShadow: 'default',
		isLight: !darkModeStatus,
		size: 'lg',
	};

	const formik = useFormik({
		initialValues: {
			searchInput: '',
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		onSubmit: (values) => {
			setSearchModalStatus(true);
		},
	});

	useEffect(() => {
		if (formik.values.searchInput) {
			setSearchModalStatus(true);
			refSearchInput?.current?.focus();
		}
		return () => {
			setSearchModalStatus(false);
		};
	}, [formik.values.searchInput]);

	// Only search Digital Twin pages and settings
	const searchPages: {
		[key: string]: {
			id: string;
			text: string;
			path: string;
			icon: string;
			searchable: boolean | undefined;
		};
	} = {
		...dashboardMenu,
		...settings,
	};

	const filterResult = Object.keys(searchPages)
		.filter(
			(key) =>
				(searchPages[key].searchable &&
					searchPages[key].text
						.toString()
						.toLowerCase()
						.includes(formik.values.searchInput.toLowerCase())) ||
				(searchPages[key].searchable &&
					searchPages[key].path
						.toString()
						.toLowerCase()
						.includes(formik.values.searchInput.toLowerCase())),
		)
		.map((i) => searchPages[i]);

	const clearFilter = () => {
		formik.setFieldValue('searchInput', '');
		setSearchModalStatus(!searchModalStatus);
	};

	return (
		<>
			{mobileDesign ? (
				<div className='d-flex align-items-center' data-tour='search'>
					<label className='border-0 bg-transparent cursor-pointer' htmlFor='searchInput'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>
					<Input
						id='searchInput'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder={t('Search')}
						onChange={formik.handleChange}
						value={formik.values.searchInput}
						autoComplete='off'
					/>
				</div>
			) : (
				<div
					className={`d-flex col-auto ${
						searchActive ? 'search-box-active' : 'search-box'
					}`}
					data-tour='search'>
					<Input
						id='searchInput'
						type='search'
						className={`border-0 shadow-none bg-transparent p-0 ${
							searchActive ? 'search-text-active' : 'search-text'
						}`}
						placeholder={t('Search')}
						onChange={formik.handleChange}
						value={formik.values.searchInput}
						autoComplete='off'
					/>
					<Button
						// eslint-disable-next-line react/jsx-props-no-spreading
						{...styledBtn}
						onClick={() => setSearchActive(!searchActive)}
						className='btn-only-icon search-btn'
						data-tour='dark-mode'>
						<Icon icon='Search' className='btn-icon' />
					</Button>
				</div>
			)}
			<Modal
				setIsOpen={setSearchModalStatus}
				isOpen={searchModalStatus}
				isStaticBackdrop
				isScrollable
				data-tour='search-modal'>
				<ModalHeader setIsOpen={clearFilter} className='pe-4'>
					<div className='d-flex form-control' data-tour='search'>
						<label
							className='border-0 bg-transparent cursor-pointer'
							htmlFor='searchInput'>
							<Icon icon='Search' size='2x' color='dark' className='me-3' />
						</label>
						<Input
							ref={refSearchInput}
							name='searchInput'
							className='border-0 shadow-none bg-transparent p-0'
							placeholder={t('Search')}
							onChange={formik.handleChange}
							value={formik.values.searchInput}
						/>
					</div>
				</ModalHeader>
				<ModalBody>
					<table className='table table-hover table-modern caption-top mb-0'>
						<caption>
							{t('Results')}: {filterResult.length}
						</caption>
						<thead className='position-sticky' style={{ top: -13 }}>
							{filterResult.length > 0 && (
								<tr>
									<th scope='col'>{t('Pages')}</th>
								</tr>
							)}
						</thead>
						<tbody>
							{filterResult.length ? (
								filterResult.map((item) => (
									<tr
										key={item.id}
										className='cursor-pointer'
										onClick={() => {
											navigate(`../${item.path}`);
											setSearchModalStatus(!searchModalStatus);
										}}>
										<td>
											{item.icon && (
												<Icon
													icon={item.icon}
													size='lg'
													className='me-2'
													color='secondary'
												/>
											)}
											{t(`${item.text}`)}
										</td>
									</tr>
								))
							) : (
								<tr className='table-active'>
									<td>
										{t('No result found for query')} "
										{formik.values.searchInput}"
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</ModalBody>
			</Modal>
		</>
	);
};

export default Search;
