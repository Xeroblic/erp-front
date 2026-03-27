import React, { useMemo, useRef, useState } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import { toast } from 'react-toastify';
import { useAppDispatch } from '@/store';
import { batchAdjustStock } from '@/store/slices/products/productStockSlice';
import type { ProductInventorySummary } from '@/interface/product.interface';
import { PRODUCT_EMPTY_INVENTORY_SUMMARY } from '@/constants/product.constant';
import InventoryCriticalSection from './InventoryCriticalSection';
import InventoryImportModal from './InventoryImportModal';
import type { CriticalItemRow, InventoryTabProps, SerialSegment } from './inventoryTab.types';
import { buildProductsById, buildVisibleInventoryRows, downloadInventoryCsv, formatNumber, getFriendlyDate } from './inventoryTab.utils';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const SerialsDistributionBar: React.FC<{ segments: SerialSegment[]; total: number }> = ({
  segments,
  total,
}) => {
  if (total <= 0) return null;
  return (
    <div className='flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800'>
      {segments.map((seg) => {
        const pct = (seg.value / total) * 100;
        if (pct <= 0) return null;
        return (
          <div
            key={seg.key}
            className={`${seg.color} transition-all duration-500 ease-out`}
            style={{ width: `${pct}%` }}
            title={`${seg.label}: ${formatNumber(seg.value)} (${pct.toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
};

const summaryStyles: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  total: {
    border: 'border-emerald-200/80 dark:border-emerald-500/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
  },
  average: {
    border: 'border-indigo-200/80 dark:border-indigo-500/40',
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-300',
  },
  low: {
    border: 'border-amber-200/80 dark:border-amber-500/40',
    iconBg: 'bg-amber-100 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-300',
  },
  out: {
    border: 'border-rose-200/80 dark:border-rose-500/40',
    iconBg: 'bg-rose-100 dark:bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-300',
  },
  default: {
    border: 'border-neutral-200 dark:border-neutral-700',
    iconBg: 'bg-neutral-100 dark:bg-neutral-800',
    iconColor: 'text-neutral-500 dark:text-neutral-300',
  },
};

const InventoryTab: React.FC<InventoryTabProps> = ({
  products = [],
  meta,
  summary = PRODUCT_EMPTY_INVENTORY_SUMMARY,
  criticalProducts = [],
  loading = false,
  branchName,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
  onShowLowStock,
  onViewProduct,
  subsidiaryId,
  selectedBranchId,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const criticalSectionRef = useRef<HTMLDivElement | null>(null);
  const [criticalSearch, setCriticalSearch] = useState('');
  const [showOnlyOutOfStock, setShowOnlyOutOfStock] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showOnlyChildren, setShowOnlyChildren] = useState(false);
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const localInventory = useMemo(() => {
    if (!products.length) {
      return {
        totalStock: 0,
        productCount: 0,
        serialTracked: 0,
        lowStockItems: [],
        outOfStockItems: [],
        averageStock: 0,
      } as {
        totalStock: number;
        productCount: number;
        serialTracked: number;
        lowStockItems: typeof products;
        outOfStockItems: typeof products;
        averageStock: number;
      };
    }

    let totalStock = 0;
    let serialTracked = 0;
    const lowStockItems = [] as typeof products;
    const outOfStockItems = [] as typeof products;

    products.forEach((product) => {
      const stock = Number(product.stock ?? 0);
      totalStock += stock > 0 ? stock : 0;
      if (product.serial_tracking) serialTracked += 1;

      if (stock <= 0) {
        outOfStockItems.push(product);
        return;
      }

      if (stock <= lowStockThreshold) {
        lowStockItems.push(product);
      }
    });

    const productCount = products.length;
    const averageStock = productCount ? totalStock / productCount : 0;

    return {
      totalStock,
      productCount,
      serialTracked,
      lowStockItems,
      outOfStockItems,
      averageStock,
    };
  }, [products, lowStockThreshold]);

  const hasServerSummary = summary.branchId !== null;

  const summaryData = useMemo<ProductInventorySummary>(() => {
    if (hasServerSummary) return summary;

    return {
      ...summary,
      stockTotal: localInventory.totalStock,
      stockAverage: localInventory.averageStock,
      lowStockCount: localInventory.lowStockItems.length,
      outOfStock: localInventory.outOfStockItems.length,
      withStockAvailable: Math.max(0, localInventory.productCount - localInventory.outOfStockItems.length),
      syncedProducts: localInventory.productCount,
      serialTrackingCount: localInventory.serialTracked,
      productsTotal: localInventory.productCount,
      totalChildrenProducts: 0,
      productsTotalAll: localInventory.productCount,
      withoutSerialTracking: localInventory.productCount - localInventory.serialTracked,
      stockWithoutSerials: 0,
      serialsAvailable: 0,
      serialsOnHold: 0,
      serialsReserved: 0,
      serialsInQuotation: 0,
      serialsSold: 0,
      serialsTotalApproved: 0,
      criticalThreshold: lowStockThreshold,
    };
  }, [hasServerSummary, summary, localInventory, lowStockThreshold]);

  const currentPageInventory = useMemo(() => {
    const parentCount = products.length;
    const childCount = products.reduce(
      (total, product) => total + (Array.isArray(product.children) ? product.children.length : 0),
      0,
    );
    const visibleStock = products.reduce((total, product) => {
      const parentStock = Number(product.stock ?? 0);
      const childrenStock = (product.children ?? []).reduce(
        (childTotal, child) => childTotal + Number(child.stock ?? 0),
        0,
      );
      return total + parentStock + childrenStock;
    }, 0);

    return {
      parentCount,
      childCount,
      visibleStock,
      from: meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1,
      to: Math.min(meta.current_page * meta.per_page, meta.total),
    };
  }, [meta.current_page, meta.per_page, meta.total, products]);

  const productsById = useMemo(() => buildProductsById(products), [products]);

  const visibleInventoryRows = useMemo(() => {
    const rows = buildVisibleInventoryRows(products, productsById);
    const query = inventorySearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (showOnlyChildren && row.isParent) return false;
      if (hideZeroStock && row.stock <= 0) return false;
      if (!query) return true;
      return [row.name, row.sku, row.brand, row.grade].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [products, productsById, inventorySearch, showOnlyChildren, hideZeroStock]);

  const criticalItems = useMemo<CriticalItemRow[]>(() => {
    let items: CriticalItemRow[];

    if (criticalProducts.length > 0) {
      items = criticalProducts
        .map((item) => {
          const product = productsById.get(item.id) ?? null;
          const stockSource = product?.stock ?? item.stock ?? 0;
          const numericStock = typeof stockSource === 'number' ? Number(stockSource) : 0;
          const status: 'low' | 'out' = numericStock <= 0 ? 'out' : 'low';

          return {
            product,
            id: item.id,
            name: item.name,
            sku: item.sku,
            brand: product?.brand?.name ?? item.brand_name ?? 'Sin marca',
            stock: numericStock,
            status,
            updatedAt: product?.updated_at ?? null,
          };
        })
        .sort((a, b) => {
          if (a.stock !== b.stock) return a.stock - b.stock;
          return a.name.localeCompare(b.name);
        });
    } else {
      const merged = [...localInventory.lowStockItems, ...localInventory.outOfStockItems];
      items = merged
        .map((product) => {
          const stockValue = Number(product.stock ?? 0);
          return {
            product,
            id: product.id,
            name: product.name,
            sku: product.sku,
            brand: product.brand?.name ?? 'Sin marca',
            stock: stockValue,
            status: stockValue <= 0 ? ('out' as const) : ('low' as const),
            updatedAt: product.updated_at,
          };
        })
        .sort((a, b) => {
          const stockDiff = a.stock - b.stock;
          if (stockDiff !== 0) return stockDiff;
          const aDate = a.updatedAt ? Date.parse(a.updatedAt) : 0;
          const bDate = b.updatedAt ? Date.parse(b.updatedAt) : 0;
          return bDate - aDate;
        });
    }

    let filtered = items;
    if (showOnlyOutOfStock) filtered = filtered.filter((item) => item.status === 'out');
    if (criticalSearch.trim()) {
      const query = criticalSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query),
      );
    }

    return filtered.slice(0, 10);
  }, [criticalProducts, productsById, localInventory, showOnlyOutOfStock, criticalSearch]);

  const handleLowStockClick = () => {
    if (criticalItems.length === 0) return;
    onShowLowStock?.();
    requestAnimationFrame(() => {
      criticalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleExportInventory = () => {
    if (visibleInventoryRows.length === 0) {
      toast.info('No hay datos visibles para exportar');
      return;
    }
    downloadInventoryCsv(visibleInventoryRows, branchName);
    toast.success('Inventario exportado correctamente');
  };

  const handleImportInventory = async (payload: {
    branch_id: number;
    reason: string;
    notes?: string;
    items: { product_id: number; quantity_change: number }[];
  }) => {
    if (!subsidiaryId) {
      toast.error('No se pudo resolver la subsidiaria para importar inventario');
      return;
    }
    setIsImporting(true);
    try {
      await dispatch(batchAdjustStock({ subsidiaryId, payload })).unwrap();
      await onRefresh?.();
      toast.success('Inventario importado correctamente');
    } catch (error: unknown) {
      const message = typeof error === 'string' && error.trim().length > 0 ? error : 'No se pudo importar el inventario';
      toast.error(message);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const summaryCards = [
    {
      id: 'total',
      icon: 'HeroCubeTransparent',
      label: 'Stock total',
      value: summaryData.stockTotal,
      description: `${formatNumber(summaryData.productsTotal)} padres · ${formatNumber(summaryData.totalChildrenProducts)} variantes`,
      valueClass: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      id: 'average',
      icon: 'HeroChartBarSquare',
      label: 'Stock promedio',
      value: Math.round(summaryData.stockAverage),
      description: `${formatNumber(summaryData.serialTrackingCount)} con tracking · ${formatNumber(summaryData.withoutSerialTracking)} sin tracking`,
      valueClass: 'text-indigo-600 dark:text-indigo-300',
    },
    {
      id: 'low',
      icon: 'HeroExclamationTriangle',
      label: `Stock bajo (≤ ${summaryData.criticalThreshold})`,
      value: summaryData.lowStockCount,
      description: summaryData.lowStockCount > 0 ? `${formatNumber(summaryData.withStockAvailable)} con disponibilidad` : 'Sin alertas por ahora',
      valueClass: 'text-amber-600 dark:text-amber-300',
    },
    {
      id: 'out',
      icon: 'HeroXCircle',
      label: 'Productos agotados',
      value: summaryData.outOfStock,
      description: summaryData.outOfStock > 0 ? 'Necesitan reposición' : 'Todos con stock disponible',
      valueClass: 'text-rose-600 dark:text-rose-300',
    },
  ];

  const serialSegments: SerialSegment[] = useMemo(
    () => [
      { key: 'available', label: 'Disponibles', value: summaryData.serialsAvailable, color: 'bg-emerald-500', bgClass: 'bg-emerald-100 dark:bg-emerald-500/10', textClass: 'text-emerald-600 dark:text-emerald-300', iconBgClass: 'bg-emerald-500/20', icon: 'HeroCheckCircle' },
      { key: 'quotation', label: 'En cotización', value: summaryData.serialsInQuotation, color: 'bg-sky-500', bgClass: 'bg-sky-100 dark:bg-sky-500/10', textClass: 'text-sky-600 dark:text-sky-300', iconBgClass: 'bg-sky-500/20', icon: 'HeroDocumentText' },
      { key: 'reserved', label: 'Reservados', value: summaryData.serialsReserved, color: 'bg-violet-500', bgClass: 'bg-violet-100 dark:bg-violet-500/10', textClass: 'text-violet-600 dark:text-violet-300', iconBgClass: 'bg-violet-500/20', icon: 'HeroLockClosed' },
      { key: 'on_hold', label: 'En espera', value: summaryData.serialsOnHold, color: 'bg-amber-500', bgClass: 'bg-amber-100 dark:bg-amber-500/10', textClass: 'text-amber-600 dark:text-amber-300', iconBgClass: 'bg-amber-500/20', icon: 'HeroClock' },
      { key: 'sold', label: 'Vendidos', value: summaryData.serialsSold, color: 'bg-rose-500', bgClass: 'bg-rose-100 dark:bg-rose-500/10', textClass: 'text-rose-600 dark:text-rose-300', iconBgClass: 'bg-rose-500/20', icon: 'HeroShoppingCart' },
    ],
    [summaryData],
  );

  const serialsTotal = summaryData.serialsTotalApproved;
  const hasSerialData = serialsTotal > 0 || summaryData.serialsAvailable > 0;
  const branchLabel = branchName ?? 'Todas las sucursales disponibles';
  const totalCriticalCount = criticalProducts.length > 0 ? criticalProducts.length : localInventory.lowStockItems.length + localInventory.outOfStockItems.length;
  const visibleRowsPreview = visibleInventoryRows.slice(0, 24);

  return (
    <div className='space-y-6'>
      <InventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        branchId={selectedBranchId ?? null}
        onSubmit={handleImportInventory}
        isSubmitting={isImporting}
      />

      <Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
        <CardHeader className='gap-1 px-4 pb-2 pt-3 sm:pb-1 sm:pt-3'>
          <CardHeaderChild className='flex flex-col items-start justify-start gap-1'>
            <CardTitle className='flex justify-start gap-2'>
              <Icon icon='HeroCubeTransparent' className='h-5 w-5 text-emerald-600 dark:text-emerald-300' />
              Gestión de Inventario
            </CardTitle>
            <p className='mt-0 text-sm text-neutral-500'>
              Resumen global del catálogo: {formatNumber(summaryData.productsTotalAll)} productos sincronizados para la sucursal seleccionada.
            </p>
          </CardHeaderChild>
          <CardHeaderChild className='flex justify-start sm:justify-end'>
            <Badge variant='outline' color='blue' className='whitespace-nowrap'>{branchLabel}</Badge>
          </CardHeaderChild>
        </CardHeader>
        <CardBody>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {summaryCards.map((card) => {
              const style = summaryStyles[card.id] ?? summaryStyles.default;
              return (
                <Card key={card.id} className={`h-full overflow-hidden rounded-xl border ${style.border} bg-white shadow-sm dark:bg-neutral-900/60`}>
                  <CardBody className='flex h-full flex-col justify-between gap-4 !p-5'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm text-neutral-500'>{card.label}</p>
                        {loading ? <div className='mt-3 h-7 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800' /> : <><p className={`text-2xl font-semibold ${card.valueClass}`}>{formatNumber(card.value)}</p>{card.description && <p className='mt-1 text-xs text-neutral-500'>{card.description}</p>}</>}
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg}`}>
                        <Icon icon={card.icon as string} className={`h-5 w-5 ${style.iconColor}`} />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          <div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700'>
            <div className='space-y-1 text-xs text-neutral-500'>
              <p>Inventario global: {formatNumber(summaryData.stockTotal)} unidades en {formatNumber(summaryData.productsTotalAll)} productos.</p>
              <p>Página actual: {formatNumber(currentPageInventory.parentCount)} padres, {formatNumber(currentPageInventory.childCount)} variantes y {formatNumber(currentPageInventory.visibleStock)} unidades visibles.</p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' icon='HeroArrowDownTray' size='sm' onClick={() => setIsImportModalOpen(true)} isDisable={!selectedBranchId || !subsidiaryId || isImporting}>Importar inventario</Button>
              <Button variant='outline' icon='HeroArrowUpTray' size='sm' onClick={handleExportInventory}>Exportar inventario</Button>
              <Button size='sm' color='amber' variant='outline' icon='HeroExclamationTriangle' onClick={handleLowStockClick} isDisable={totalCriticalCount === 0}>Ver productos críticos</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
        <CardHeader>
          <CardHeaderChild>
            <CardTitle className='flex items-center gap-2'>
              <Icon icon='HeroTableCells' className='h-5 w-5 text-sky-600 dark:text-sky-300' />
              Productos visibles en esta página
            </CardTitle>
          </CardHeaderChild>
          <CardHeaderChild>
            <Badge variant='outline' color='sky'>Página {formatNumber(meta.current_page)} de {formatNumber(meta.last_page)}</Badge>
          </CardHeaderChild>
        </CardHeader>
        <CardBody>
          <div className='mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]'>
            <div className='relative w-full'>
              <Input id='inventory-search' name='inventory-search' placeholder='Buscar padre o variante por nombre, SKU, marca o grado...' value={inventorySearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearch(e.target.value)} className='!py-2 !pl-9 !text-sm' />
              <Icon icon='HeroMagnifyingGlass' className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400' />
            </div>
            <button type='button' onClick={() => setShowOnlyChildren((prev) => !prev)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${showOnlyChildren ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300' : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}>Solo variantes</button>
            <button type='button' onClick={() => setHideZeroStock((prev) => !prev)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${hideZeroStock ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}>Ocultar stock 0</button>
          </div>

          <div className='mb-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900/30'>
            <p className='font-medium text-neutral-700 dark:text-neutral-200'>Mostrando padres paginados con sus variantes embebidas</p>
            <p className='mt-1 text-xs text-neutral-500'>La API pagina {formatNumber(meta.total)} productos padre. En esta página se están viendo del {formatNumber(currentPageInventory.from)} al {formatNumber(currentPageInventory.to)}, que despliegan {formatNumber(currentPageInventory.childCount)} variantes adicionales.</p>
          </div>

          {visibleRowsPreview.length === 0 ? (
            <div className='rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700'>No hay productos visibles para los filtros aplicados en esta página.</div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-dashed border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900/40'>
              <table className='min-w-full divide-y divide-neutral-200 dark:divide-neutral-800'>
                <thead className='bg-neutral-50 dark:bg-neutral-900/60'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>Producto</th>
                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>Tipo</th>
                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>Stock</th>
                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>Detalle</th>
                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>Acciones</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950/60'>
                  {visibleRowsPreview.map((row) => (
                    <tr key={row.id} className='hover:bg-neutral-100 dark:hover:bg-neutral-900/40'>
                      <td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
                        <div className='space-y-1'>
                          <p className={`font-medium ${row.isParent ? 'text-neutral-900 dark:text-neutral-100' : 'pl-4 text-neutral-800 dark:text-neutral-200'}`}>{row.isParent ? row.name : `↳ ${row.name}`}</p>
                          <p className='text-xs text-neutral-500 dark:text-neutral-400'>SKU: {row.sku} · Marca: {row.brand}</p>
                          <p className='text-xs text-neutral-400 dark:text-neutral-500'>Actualizado: {getFriendlyDate(row.updatedAt)}</p>
                        </div>
                      </td>
                      <td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
                        <div className='flex flex-wrap gap-2'>
                          <Badge color={row.isParent ? 'sky' : 'violet'} variant='outline'>{row.isParent ? 'Padre' : `Grado ${row.grade}`}</Badge>
                          {row.isParent && row.childrenCount > 0 && <Badge color='zinc' variant='outline'>{formatNumber(row.childrenCount)} variantes</Badge>}
                        </div>
                      </td>
                      <td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
                        <p className='font-semibold'>{formatNumber(row.stock)}</p>
                        <p className='text-xs text-neutral-500'>Disponibles: {formatNumber(row.available)}</p>
                      </td>
                      <td className='px-4 py-4 align-top text-xs text-neutral-500 dark:text-neutral-400'>
                        <div className='space-y-1'>
                          <p>Reservado: {formatNumber(row.reserved)}</p>
                          <p>En espera: {formatNumber(row.onHold)}</p>
                          <p>En cotización: {formatNumber(row.inQuotation)}</p>
                          <p>Vendidos: {formatNumber(row.sold)}</p>
                        </div>
                      </td>
                      <td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
                        <Button size='sm' variant='outline' icon='HeroEye' isDisable={!onViewProduct || !row.product} onClick={() => {
                          if (onViewProduct && row.product) onViewProduct(row.product);
                        }}>Ver producto</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {hasSerialData && (
        <Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
          <CardHeader>
            <CardHeaderChild>
              <CardTitle className='flex items-center gap-2'>
                <Icon icon='HeroFingerPrint' className='h-5 w-5 text-violet-600 dark:text-violet-300' />
                Distribución de Seriales
              </CardTitle>
            </CardHeaderChild>
            {!loading && <CardHeaderChild><Badge variant='outline' color='violet'>{formatNumber(serialsTotal)} seriales aprobados</Badge></CardHeaderChild>}
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className='space-y-4'>
                <div className='h-3 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800' />
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>{Array.from({ length: 5 }).map((_, i) => <div key={i} className='h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50' />)}</div>
              </div>
            ) : (
              <>
                <div className='mb-6'><SerialsDistributionBar segments={serialSegments} total={serialsTotal} /></div>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
                  {serialSegments.map((seg) => {
                    const pct = serialsTotal > 0 ? ((seg.value / serialsTotal) * 100).toFixed(1) : '0';
                    return (
                      <div key={seg.key} className={`flex flex-col gap-2 rounded-xl border border-neutral-200/80 p-3.5 transition-colors dark:border-neutral-700/60 ${seg.bgClass}`}>
                        <div className='flex items-center gap-2'>
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${seg.iconBgClass}`}><Icon icon={seg.icon} className={`h-4 w-4 ${seg.textClass}`} /></div>
                          <span className='text-xs font-medium text-neutral-600 dark:text-neutral-300'>{seg.label}</span>
                        </div>
                        <div className='flex items-baseline gap-1.5'><span className={`text-lg font-bold ${seg.textClass}`}>{formatNumber(seg.value)}</span><span className='text-[10px] text-neutral-400'>{pct}%</span></div>
                      </div>
                    );
                  })}
                </div>
                {summaryData.stockWithoutSerials > 0 && <div className='mt-4 flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2.5 dark:border-neutral-600 dark:bg-neutral-800/40'><Icon icon='HeroInformationCircle' className='h-4 w-4 text-neutral-400' /><span className='text-xs text-neutral-500 dark:text-neutral-400'>{formatNumber(summaryData.stockWithoutSerials)} unidades de stock sin seriales asignados</span></div>}
              </> 
            )}
          </CardBody>
        </Card>
      )}

      <InventoryCriticalSection
        containerRef={criticalSectionRef}
        criticalItems={criticalItems}
        totalCriticalCount={totalCriticalCount}
        loading={loading}
        criticalSearch={criticalSearch}
        showOnlyOutOfStock={showOnlyOutOfStock}
        onCriticalSearchChange={setCriticalSearch}
        onToggleOutOfStock={() => setShowOnlyOutOfStock((prev) => !prev)}
        onViewProduct={onViewProduct}
      />
    </div>
  );
};

export default InventoryTab;
