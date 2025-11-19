import React, { useMemo, useState, useEffect } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
import { useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { useUserBranches } from '@/pages/catalogos/productos/components/modals/hooks/userBranch';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';

export type ReportFiltersState = {
  dateFrom?: string;
  dateTo?: string;
  parameter?: string;
  priceMin?: number | '';
  priceMax?: number | '';
  subsidiary?: string;
  branch?: string;
  customer?: string;
};

interface ReportFiltersProps {
  initial?: ReportFiltersState;
  onApply: (filters: ReportFiltersState) => void;
  onReset?: () => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ initial, onApply, onReset }) => {
  const user = useAppSelector((state) => state.auth.user);
  const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
  const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
  const userId = user?.id ?? (user as any)?.pk ?? undefined;

  // Obtener branches del usuario
  const { branches } = useUserBranches(userId, { enabled: Boolean(userId) });

  // Obtener subsidiarias accesibles
  const accessibleSubsidiaries = useMemo(() => {
    const subsidiaries = new Set<{ id: number; name: string }>();
    (user as any)?.access?.subsidiaries?.forEach((sub: any) => {
      if (sub?.id && sub?.name) {
        subsidiaries.add({ id: sub.id, name: sub.name });
      } else if (typeof sub === 'number') {
        subsidiaries.add({ id: sub, name: `Subsidiaria ${sub}` });
      }
    });
    return Array.from(subsidiaries);
  }, [user]);

  // Filtrar branches por subsidiaria efectiva
  const filteredBranches = useMemo(() => {
    if (!effectiveSubsidiaryId) return branches;
    return branches.filter((branch) => branch.subsidiaryId === effectiveSubsidiaryId);
  }, [branches, effectiveSubsidiaryId]);

  const [filters, setFilters] = useState<ReportFiltersState>(
    initial ?? {
      dateFrom: '',
      dateTo: '',
      parameter: '',
      priceMin: '',
      priceMax: '',
      subsidiary: effectiveSubsidiaryId ? String(effectiveSubsidiaryId) : '',
      branch: personalizacionUsuario?.sucursal_principal ? String(personalizacionUsuario.sucursal_principal) : '',
      customer: '',
    },
  );

  // Actualizar branch cuando cambia la subsidiaria
  useEffect(() => {
    if (filters.subsidiary && effectiveSubsidiaryId) {
      const selectedSubsidiaryId = Number(filters.subsidiary);
      if (selectedSubsidiaryId !== effectiveSubsidiaryId) {
        // Si cambió la subsidiaria, resetear el branch
        setFilters((f) => ({ ...f, branch: '' }));
      }
    }
  }, [filters.subsidiary, effectiveSubsidiaryId]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      errors.push('El rango de fechas es inválido.');
    }
    if (
      filters.priceMin !== '' &&
      filters.priceMax !== '' &&
      Number(filters.priceMin) > Number(filters.priceMax)
    ) {
      errors.push('El rango de precios es inválido.');
    }
    return { isValid: errors.length === 0, errors };
  }, [filters]);

  const handleApply = () => {
    if (!validation.isValid) return;
    onApply(filters);
  };

  const handleReset = () => {
    const empty: ReportFiltersState = {
      dateFrom: '',
      dateTo: '',
      parameter: '',
      priceMin: '',
      priceMax: '',
      subsidiary: '',
      branch: '',
      customer: '',
    };
    setFilters(empty);
    onReset?.();
  };

  return (
    <Card className="border border-violet-200/60 bg-gradient-to-br from-violet-50 to-violet-50/60 dark:from-violet-900/10 dark:to-transparent">
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-zinc-500">Desde</label>
            <Input
              name="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Hasta</label>
            <Input
              name="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Parámetro</label>
            <Select
              name="parameter"
              value={filters.parameter}
              onChange={(e) => setFilters((f) => ({ ...f, parameter: e.target.value }))}
              placeholder="Selecciona un parámetro"
            >
              <option value="ventas">Ventas</option>
              <option value="stock">Stock</option>
              <option value="usuarios">Usuarios</option>
              <option value="movimientos">Movimientos</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500">Precio mín.</label>
              <Input
                name="priceMin"
                type="number"
                value={filters.priceMin}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, priceMin: e.target.value === '' ? '' : Number(e.target.value) }))
                }
                min={0}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Precio máx.</label>
              <Input
                name="priceMax"
                type="number"
                value={filters.priceMax}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, priceMax: e.target.value === '' ? '' : Number(e.target.value) }))
                }
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Subempresa</label>
            <Select
              name="subsidiary"
              value={filters.subsidiary || (effectiveSubsidiaryId ? String(effectiveSubsidiaryId) : '')}
              onChange={(e) => setFilters((f) => ({ ...f, subsidiary: e.target.value, branch: '' }))}
              placeholder="Todas"
            >
              <option value="">Todas</option>
              {accessibleSubsidiaries.map((sub) => (
                <option key={sub.id} value={String(sub.id)}>
                  {sub.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Sucursal</label>
            <Select
              name="branch"
              value={filters.branch}
              onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
              placeholder="Todas"
            >
              <option value="">Todas</option>
              {filteredBranches.map((branch) => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.name || `Sucursal ${branch.id}`}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Cliente</label>
            <Select
              name="customer"
              value={filters.customer}
              onChange={(e) => setFilters((f) => ({ ...f, customer: e.target.value }))}
              placeholder="Todos"
            >
              <option value="c-1">Cliente A</option>
              <option value="c-2">Cliente B</option>
            </Select>
          </div>
        </div>

        {!validation.isValid && (
          <div className="mt-3 rounded border-l-4 border-rose-400 bg-rose-50 p-2 text-sm text-rose-700">
            <ul className="list-disc pl-6">
              {validation.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button color="violet" variant="solid" icon="HeroFunnel" onClick={handleApply} isDisable={!validation.isValid}>
            Aplicar filtros
          </Button>
          <Button variant="outline" color="violet" rightIcon="HeroArrowPath" onClick={handleReset}>
            Limpiar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default ReportFilters;

