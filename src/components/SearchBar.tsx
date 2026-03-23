import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Input from './bootstrap/forms/Input';
import Icon from './icon/Icon';

interface ISearchBarProps {
	search: string;
	setSearch: (search: string) => void;
	translation: string;
	list?: string[];
	text?: string;
	setCurrentPage?: (page: number) => void;
}
const SearchBar: FC<ISearchBarProps> = ({
	search,
	setSearch,
	translation,
	list,
	text,
	setCurrentPage,
}): JSX.Element => {
	const { t } = useTranslation([translation]);
	return (
		<div className='form-control d-flex local_Searchbar justify-content-between' data-tour='search'>
			<label className='border-0 bg-transparent cursor-pointer m-auto' htmlFor='searchInput'>
				<Icon icon='Search' size='2x' color='dark' className='me-3 mb-2' />
			</label>
			<Input
				id='searchInput'
				type='search'
				className='border-0 shadow-none bg-transparent p-0 local_Searchbar1'
				placeholder={t(text || 'Search')}
				onChange={(e: { target: { value: string } }) => {
					setSearch(e.target.value);
					if (setCurrentPage) setCurrentPage(1);
				}}
				value={search}
				autoComplete='off'
				list={list}
			/>
		</div>
	);
};

export default SearchBar;
