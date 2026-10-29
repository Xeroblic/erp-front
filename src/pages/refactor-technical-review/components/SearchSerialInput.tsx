/**
 * SearchSerialInput - Input de búsqueda con debounce para números de serie
 */
import React, { useState, useEffect, useCallback } from 'react';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';

interface SearchSerialInputProps {
	onSearch: (query: string) => void;
	placeholder?: string;
	debounceMs?: number;
	disabled?: boolean;
	className?: string;
}

const SearchSerialInput: React.FC<SearchSerialInputProps> = ({
	onSearch,
	placeholder = 'Buscar por número de serie...',
	debounceMs = 500,
	disabled = false,
	className = '',
}) => {
	const [query, setQuery] = useState('');
	const [searching, setSearching] = useState(false);

	// Debounced search effect
	useEffect(() => {
		if (query.length === 0) {
			onSearch('');
			setSearching(false);
			return;
		}

		setSearching(true);
		const timer = setTimeout(() => {
			onSearch(query);
			setSearching(false);
		}, debounceMs);

		return () => clearTimeout(timer);
	}, [query, debounceMs, onSearch]);

	const handleClear = () => {
		setQuery('');
		onSearch('');
	};

	return (
		<div className={`relative ${className}`}>
			<div className='relative'>
				<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
					{searching ? (
						<Icon icon='HeroArrowPath' className='h-5 w-5 animate-spin text-gray-400' />
					) : (
						<Icon icon='HeroMagnifyingGlass' className='h-5 w-5 text-gray-400' />
					)}
				</div>
				<Input
					type='text'
					name='search'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
					className='pl-10 pr-10'
				/>
				{query && (
					<button
						type='button'
						onClick={handleClear}
						className='absolute inset-y-0 right-0 flex items-center pr-3'
						disabled={disabled}>
						<Icon
							icon='HeroXMark'
							className='h-5 w-5 text-gray-400 hover:text-gray-600'
						/>
					</button>
				)}
			</div>
		</div>
	);
};

export default SearchSerialInput;
