import React, { useMemo, useState, useEffect } from 'react';
import classNames from 'classnames';
import { useAppDispatch } from '../../../../store';
import { useUserAccess, UserAccess, AccessBranch, AccessSubsidiary } from '../hooks/useUserAccess';
import { fetchMisSubsidiarias } from '../../../../store/slices/subempresa/subEmpresaSlice';
import { fetchMisSucursales } from '../../../../store/slices/sucursales/sucursalesSlice';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/form/Checkbox';

type Props = {
	userId?: number;
	editable?: boolean;
	onChange?: (next: UserAccess) => void;
	initialAccess?: UserAccess;
	availableAccess?: UserAccess;
	loading?: boolean;
};

export default function AccesoJerarquico({
	userId,
	editable = true,
	onChange,
	initialAccess,
	availableAccess,
	loading,
}: Props) {
	const dispatch = useAppDispatch();
	const fallback = useUserAccess(userId);
	const access = availableAccess ?? fallback.access;
	const isLoading = loading ?? fallback.isLoading;

	useEffect(() => {
		dispatch(fetchMisSubsidiarias());
		dispatch(fetchMisSucursales());
	}, [dispatch]);

	const availableBranches = useMemo<AccessBranch[]>(() => access.branches ?? [], [access.branches]);
	const availableSubs = useMemo<AccessSubsidiary[]>(() => access.subsidiaries ?? [], [access.subsidiaries]);

	const initialSelection = useMemo<UserAccess>(
		() => ({
			subsidiaries: initialAccess?.subsidiaries ?? [],
			branches: initialAccess?.branches ?? [],
		}),
		[initialAccess],
	);

	const [selectedBranchIds, setSelectedBranchIds] = useState<Set<number>>(
		new Set(initialSelection.branches.map((b) => b.id)),
	);

	const [selectedSubsIds, setSelectedSubsIds] = useState<Set<number>>(
		new Set(initialSelection.subsidiaries.map((s) => s.id)),
	);

	useEffect(() => {
		setSelectedBranchIds(new Set(initialSelection.branches.map((b) => b.id)));
		setSelectedSubsIds(new Set(initialSelection.subsidiaries.map((s) => s.id)));
	}, [initialSelection]);

	const branchesBySubs = useMemo(() => {
		const map = new Map<number, AccessBranch[]>();
		availableBranches.forEach((b) => {
			const sid = b.subsidiary?.id ?? 0;
			const arr = map.get(sid) ?? [];
			arr.push(b);
			map.set(sid, arr);
		});
		return map;
	}, [availableBranches]);

	const toggleBranch = (id: number) => {
		if (!editable) return;
		const next = new Set(selectedBranchIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		setSelectedBranchIds(next);
		emitChange(next, selectedSubsIds);
	};

	const toggleSubsidiary = (sid: number) => {
		if (!editable) return;
		const nextSubs = new Set(selectedSubsIds);
		const branches = branchesBySubs.get(sid) ?? [];

		if (nextSubs.has(sid)) {
			nextSubs.delete(sid);
			const nextBranches = new Set(selectedBranchIds);
			branches.forEach((b) => nextBranches.delete(b.id));
			setSelectedSubsIds(nextSubs);
			setSelectedBranchIds(nextBranches);
			emitChange(nextBranches, nextSubs);
		} else {
			nextSubs.add(sid);
			const nextBranches = new Set(selectedBranchIds);
			branches.forEach((b) => nextBranches.add(b.id));
			setSelectedSubsIds(nextSubs);
			setSelectedBranchIds(nextBranches);
			emitChange(nextBranches, nextSubs);
		}
	};

	function emitChange(branchSet: Set<number>, subsSet: Set<number>) {
		if (!onChange) return;
		const nextAccess: UserAccess = {
			subsidiaries: availableSubs.filter((s) => subsSet.has(s.id)),
			branches: availableBranches.filter((b) => branchSet.has(b.id)),
		};
		onChange(nextAccess);
	}

	const cards: { sid: number; title: string; company?: string; branches: AccessBranch[] }[] = [];

	const usedSubsIds = new Set<number>();
	availableSubs.forEach((s) => {
		const branches = branchesBySubs.get(s.id) ?? [];
		cards.push({
			sid: s.id,
			title: s.name,
			company: s.company?.name,
			branches,
		});
		usedSubsIds.add(s.id);
	});

	branchesBySubs.forEach((branches, sid) => {
		if (usedSubsIds.has(sid)) return;
		const title =
			sid === 0
				? 'Sin subsidiaria'
				: (branches[0].subsidiary?.name ?? 'Subsidiaria desconocida');
		cards.push({ sid, title, company: undefined, branches });
	});

	return (
		<div>
			<h3 className='mb-4 text-lg font-semibold'>Accesos Jerárquicos</h3>
			{!editable && (
				<p className='mb-3 text-sm text-zinc-500'>
					Solo puedes visualizar los accesos asignados. Los cambios requieren privilegios de administración.
				</p>
			)}
			{isLoading && <div className='px-3 py-2 text-zinc-500'>Cargando accesos...</div>}
			{!isLoading && (
				<>
					<div className='flex flex-wrap gap-4'>
						{cards.length === 0 && (
							<div className='px-3 py-2 text-zinc-500'>No hay accesos asignados.</div>
						)}
						{cards.map((card) => {
							const subsChecked = selectedSubsIds.has(card.sid);
							return (
								<Card
									key={card.sid}
									className='min-w-[280px] max-w-[420px] border border-zinc-200/70 bg-white transition-colors dark:border-zinc-700 dark:bg-zinc-900/60'>
									<CardBody className='p-3'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-3'>
												<div className='flex items-center gap-2'>
													<Checkbox
														checked={
															subsChecked ||
															card.branches.every((b) =>
																selectedBranchIds.has(b.id),
															)
														}
														onChange={() => toggleSubsidiary(card.sid)}
														disabled={
															!editable || card.branches.length === 0
														}
													/>
												</div>
												<div>
													<div className='font-semibold'>
														{card.title}
													</div>
													{card.company && (
														<div className='text-xs text-zinc-500'>
															{card.company}
														</div>
													)}
												</div>
											</div>
											<Badge className='text-xs'>
												{card.branches.length} sucursal
												{card.branches.length !== 1 ? 'es' : ''}
											</Badge>
										</div>

										<div className='mt-3 flex flex-col gap-2'>
											{card.branches.length === 0 && (
												<div className='text-sm text-zinc-500'>
													No hay sucursales en esta subsidiaria.
												</div>
											)}
											{card.branches.map((b) => {
												const checked = selectedBranchIds.has(b.id);
												return (
													<div
														key={b.id}
														className={classNames(
															'flex items-center justify-between rounded-md p-2 transition-colors',
															{
																'bg-blue-50 dark:bg-blue-900/30': checked,
																'hover:bg-zinc-100 dark:hover:bg-white/5': !checked,
															},
														)}>
														<div className='flex items-center gap-3'>
															<Checkbox
																checked={checked}
																onChange={() => toggleBranch(b.id)}
																disabled={!editable}
															/>
															<div>
																<div className='font-medium'>
																	{b.name}
																</div>
																<div className='text-xs text-zinc-500'>
																	{b.position
																		? b.position + ' · '
																		: ''}
																	{b.source ? b.source : ''}
																</div>
															</div>
														</div>
														<div className='flex items-center gap-2'>
															{b.is_primary && (
																<Badge color='emerald'>
																	Principal
																</Badge>
															)}
															<div className='text-xs text-zinc-400'>
																ID {b.id}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</CardBody>
								</Card>
							);
						})}
					</div>
					<div className='mt-3 text-sm text-zinc-500'>
						Usa los checkboxes para modificar accesos. Al cambiar se ejecutará onChange
						(si lo provees) con la nueva estructura.
					</div>
				</>
			)}
		</div>
	);
}
