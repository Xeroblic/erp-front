import React, { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { Link } from 'react-router-dom';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
import useDomRect from '@/hooks/useDomRect';
import pagesConfig from '@/config/pages.config';
import Badge from '@/components/ui/Badge';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';

const flattenPages = (config: Record<string, any>) => {
	const result: any[] = [];

	Object.values(config).forEach((page: any) => {
		result.push({
			id: page.id,
			to: page.to,
			text: page.text,
			icon: page.icon,
			category: page.text ?? 'General',
		});

		if (page.subPages) {
			Object.values(page.subPages).forEach((sub: any) => {
				result.push({
					id: sub.id,
					to: sub.to,
					text: sub.text,
					icon: sub.icon,
					category: page.text ?? 'General',
				});
			});
		}
	});

	return result;
};

const SearchPartial = () => {
	const ref = useRef<HTMLDivElement>(null);
	const [domRect] = useDomRect(ref);

	const formik = useFormik({
		onSubmit(): void | Promise<never> {
			return undefined;
		},
		initialValues: {
			searchField: '',
		},
	});

	const leftContent = <Icon icon='HeroMagnifyingGlass' className='mx-2' />;
	const rightContent = formik.values.searchField ? (
		<Button
			icon='HeroXMark'
			color='red'
			size='sm'
			rounded='rounded-sm'
			className='rounded-xs'
			onClick={() => formik.setFieldValue('searchField', '')}
		/>
	) : (
		<Button variant='solid' size='sm' rounded='rounded-3xl' className='px-2! font-bold'>
			Alt + B
		</Button>
	);

	const list = flattenPages(pagesConfig);

	const result = list.filter(
		(item) =>
			item.text.toLowerCase().includes(formik.values.searchField.toLowerCase()) ||
			item.category.toLowerCase().includes(formik.values.searchField.toLowerCase()),
	);

	const [modalStatus, setModalStatus] = useState<boolean>(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const focusInput = () => {
		// En anchos chicos el input está oculto y la búsqueda vive en el modal.
		if (inputRef.current?.offsetParent) {
			inputRef.current.focus();
			return;
		}
		setModalStatus(true);
	};
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			// Validación defensiva: asegurar que event.key existe y es string
			if (!event.key || typeof event.key !== 'string') return;

			const key = event.key.toLowerCase();
			if ((event.metaKey && key === 'k') || (event.altKey && key === 'b')) {
				event.preventDefault();
				focusInput();
			}
		};

		document.addEventListener('keydown', handleKeyPress);

		return () => {
			document.removeEventListener('keydown', handleKeyPress);
		};
	}, []);

	return (
		<div className='relative'>
			<FieldWrap
				ref={ref}
				firstSuffix={leftContent}
				lastSuffix={rightContent}
				className='z-20 rounded-xl bg-white @max-5xl:hidden dark:bg-zinc-900'>
				<Input
					ref={inputRef}
					name='searchField'
					placeholder='Busca en el sistema...'
					className='min-h-[2.7rem] min-w-88 bg-white px-2 dark:bg-zinc-800/90'
					color='red'
					value={formik.values.searchField}
					onChange={formik.handleChange}
					autoComplete='off'
				/>
			</FieldWrap>
			{formik.values.searchField && (
				<div
					className='absolute top-0 z-10 h-auto w-full rounded-lg bg-white shadow-2xl ring-2 ring-gray-100 ring-offset-8 outline-8 outline-white outline-solid @max-5xl:hidden dark:bg-zinc-950 dark:ring-zinc-800/50 dark:outline-zinc-950'
					style={{ paddingTop: domRect?.height }}>
					<div className='max-h-96 divide-y divide-dashed divide-zinc-500/50 overflow-auto rounded-xs bg-white px-4 *:py-4 dark:bg-zinc-950'>
						{result.length ? (
							result.map((i) => (
								<Link
									key={i.id}
									to={`../${i.to}`}
									className='flex items-center gap-2'>
									<div className='grow'>
										<Button className='p-0!' icon={i.icon}>
											<span
												// eslint-disable-next-line react/no-danger
												dangerouslySetInnerHTML={{
													__html: i.text.replace(
														new RegExp(formik.values.searchField, 'gi'),
														`<span class='bg-amber-500/50 text-zinc-950'>$&</span>`,
													),
												}}
											/>
										</Button>
									</div>
									{i.category && (
										<div className='shrink-0'>
											<Badge
												variant='outline'
												className='border-transparent text-xs'>
												<span
													// eslint-disable-next-line react/no-danger
													dangerouslySetInnerHTML={{
														__html: i.category.replace(
															new RegExp(
																formik.values.searchField,
																'gi',
															),
															`<span class='bg-amber-500/50 text-zinc-950'>$&</span>`,
														),
													}}
												/>
											</Badge>
										</div>
									)}
								</Link>
							))
						) : (
							<div className='flex gap-2 text-zinc-500'>No result.</div>
						)}
					</div>
				</div>
			)}

			<Button
				icon='HeroMagnifyingGlass'
				className='flex h-10 w-10 items-center justify-center rounded-full! border border-white/60 bg-white p-0! text-sky-500 shadow-md shadow-sky-200/50 @5xl:hidden dark:border-white/10 dark:bg-zinc-800 dark:text-sky-300 dark:shadow-[0_4px_18px_rgba(0,0,0,0.55)]'
				onClick={() => setModalStatus(true)}
			/>
			<Modal isOpen={modalStatus} setIsOpen={setModalStatus}>
				<ModalHeader>Buscar</ModalHeader>
				<ModalBody>
					<FieldWrap firstSuffix={leftContent} lastSuffix={rightContent} className='z-20'>
						<Input
							name='searchField'
							placeholder='Busca en el sistema...'
							className='min-w-88'
							value={formik.values.searchField}
							onChange={formik.handleChange}
							autoComplete='off'
						/>
					</FieldWrap>
					{formik.values.searchField && (
						<div className='z-10 h-auto w-full bg-white dark:bg-zinc-950 dark:ring-zinc-800/50 dark:outline-zinc-950'>
							<div className='max-h-96 divide-y divide-dashed divide-zinc-500/50 overflow-auto bg-white *:py-4 dark:bg-zinc-950'>
								{result.length ? (
									result.map((i) => (
										<Link
											key={i.id}
											to={`../${i.to}`}
											className='flex items-center gap-2'>
											<div className='grow'>
												<Button className='p-0!' icon={i.icon}>
													<span
														dangerouslySetInnerHTML={{
															__html: i.text.replace(
																new RegExp(
																	formik.values.searchField,
																	'gi',
																),
																`<span class='bg-amber-500/50 text-zinc-950'>$&</span>`,
															),
														}}
													/>
												</Button>
											</div>
											{i.category && (
												<div className='shrink-0'>
													<Badge
														variant='outline'
														className='border-transparent text-xs'>
														<span
															dangerouslySetInnerHTML={{
																__html: i.category.replace(
																	new RegExp(
																		formik.values.searchField,
																		'gi',
																	),
																	`<span class='bg-amber-500/50 text-zinc-950'>$&</span>`,
																),
															}}
														/>
													</Badge>
												</div>
											)}
										</Link>
									))
								) : (
									<div className='flex gap-2 text-zinc-500'>No result.</div>
								)}
							</div>
						</div>
					)}
				</ModalBody>
			</Modal>
		</div>
	);
};

export default SearchPartial;
