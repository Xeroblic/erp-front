import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import { useWarehouseManagement } from './hooks/useWarehouseManagement';
import WarehouseCapacityBar from './components/WarehouseCapacityBar';
import { toast } from 'react-toastify';

const WarehouseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.auth.user);
  const personal = useAppSelector((s) => s.personalizacion);
  const branchId =
    personal?.personalizacionUsuario?.sucursal_principal ||
    user?.branch?.id ||
    (user?.personalizacion?.sucursal_principal ?? 0);

  const { loadWarehouseDetail, handleAttachProducts, handleDetachProduct } =
    useWarehouseManagement(branchId);
  const warehouse = useAppSelector((s) => s.warehouse.warehouseDetail);
  const { items: allProducts, loading: productsLoading } = useAppSelector((s) => s.products);

  const [isEditable, setIsEditable] = useState(false);
  const [productToRemove, setProductToRemove] = useState<any | null>(null);
  const [updatingSyncIds, setUpdatingSyncIds] = useState<number[]>([]);

  // attach modal state
  const [attachProduct, setAttachProduct] = useState<any | null>(null);
  const [attachSync, setAttachSync] = useState(true);
  const [attachQty, setAttachQty] = useState<number>(1);
  const [attaching, setAttaching] = useState(false);

  // qty modal for turning OFF sync
  const [qtyModal, setQtyModal] = useState<{ open: boolean; productId: number | null; initialQty: number }>({
    open: false,
    productId: null,
    initialQty: 1,
  });
  const [qtyInput, setQtyInput] = useState<number>(1);

  useEffect(() => {
    if (branchId && id) {
      loadWarehouseDetail(Number(id));
      if (allProducts.length === 0) dispatch(fetchProducts({ branchId, params: { per_page: 5 } } as any));
    }
  }, [branchId, id]);

  const availableProducts = useMemo(
    () =>
      allProducts.filter(
        (p) => p.branch_id === branchId && !warehouse?.products?.some((wp) => wp.id === p.id),
      ),
    [allProducts, warehouse?.products, branchId],
  );

  const searchTimerRef = useRef<number | null>(null);
  const handleProductSearch = (val: string) => {
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      dispatch(fetchProducts({ branchId, params: { per_page: 5, search: val } } as any));
    }, 300) as unknown as number;
  };

  const openAttachModal = (p: any) => {
    setAttachProduct(p);
    setAttachSync(true);
    setAttachQty(1);
  };

  const confirmAttach = async () => {
    if (!attachProduct || !warehouse) return;
    setAttaching(true);
    try {
      const payload = {
        product_id: attachProduct.id,
        quantity: attachSync ? null : attachQty,
        sync_stock: attachSync,
      } as any;
      const success = await handleAttachProducts(warehouse.id, payload);
      if (success) {
        await loadWarehouseDetail(warehouse.id);
        setAttachProduct(null);
      }
    } finally {
      setAttaching(false);
    }
  };

  const confirmQtyModal = async () => {
    if (!qtyModal.productId || !warehouse) {
      setQtyModal({ open: false, productId: null, initialQty: 1 });
      return;
    }
    const qty = Number(qtyInput) || 0;
    if (qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    setUpdatingSyncIds((s) => [...s, qtyModal.productId!]);
    try {
      await handleAttachProducts(warehouse.id, {
        product_id: qtyModal.productId,
        quantity: qty,
        sync_stock: false,
      } as any);
      await loadWarehouseDetail(warehouse.id);
    } finally {
      setUpdatingSyncIds((s) => s.filter((id) => id !== qtyModal.productId));
      setQtyModal({ open: false, productId: null, initialQty: 1 });
    }
  };

  if (!warehouse)
    return (
      <PageWrapper>
        <Container>
          <div className="flex items-center justify-center py-12">
            <Icon icon="HeroExclamationCircle" className="size-12 text-red-500" />
            <div className="ml-3">Bodega no encontrada</div>
          </div>
        </Container>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <Subheader>
        <SubheaderLeft>
          <Button onClick={() => navigate('/catalogos/bodegas')} variant="outline" icon="HeroArrowLeft">
            Volver
          </Button>
          <span className="ml-3 text-lg font-semibold">{warehouse.name}</span>
        </SubheaderLeft>
        <SubheaderRight>
          <Button
            variant="solid"
            color={isEditable ? 'amber' : 'blue'}
            onClick={() => setIsEditable(!isEditable)}
            icon={isEditable ? 'HeroLockClosed' : 'HeroPencil'}
          >
            {isEditable ? 'Bloquear Edición' : 'Habilitar Edición'}
          </Button>
        </SubheaderRight>
      </Subheader>

      <Container>
        <div className="space-y-5">
          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-semibold">{warehouse.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Código</p>
                  <p className="font-mono">{warehouse.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sucursal</p>
                  <p className="font-semibold">{warehouse.branch_name || 'N/A'}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Capacidad */}
          <Card>
            <CardHeader>
              <CardTitle>Capacidad</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <WarehouseCapacityBar
                  current={warehouse.current_capacity || 0}
                  maximum={warehouse.maximum_capacity || 0}
                  size="lg"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">Actual</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {warehouse.current_capacity || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">Máxima</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {warehouse.maximum_capacity || '∞'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">Disponible</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {warehouse.available_capacity ?? '∞'}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Productos asociados */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Asociados ({warehouse.products?.length || 0})</CardTitle>
            </CardHeader>
            <CardBody>
              {(!warehouse.products || warehouse.products.length === 0) ? (
                <div className="py-8 text-center text-sm text-gray-600">No hay productos asociados</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Marca</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Stock</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cantidad</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Modo</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {warehouse.products.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-sm">{p.sku}</td>
                          <td className="px-4 py-2 text-sm">{p.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {p.brand_name ?? allProducts.find((x) => x.id === p.id)?.brand?.name ?? 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            {allProducts.find((x) => x.id === p.id)?.stock ?? 0}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">{p.quantity}</td>
                          <td className="px-4 py-2 text-center">
                            {p.sync_stock ? (
                              <Badge color="blue" variant="outline">Auto-Sync</Badge>
                            ) : (
                              <Badge color="gray" variant="outline">Manual</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {updatingSyncIds.includes(p.id) && <Icon icon="HeroArrowPath" className="animate-spin" />}
                              <Checkbox
                                variant="switch"
                                id={`sync-${p.id}`}
                                checked={p.sync_stock}
                                onChange={async (e) => {
                                  const turningOn = e.target.checked;
                                  if (!turningOn) {
                                    setQtyInput(p.quantity);
                                    setQtyModal({ open: true, productId: p.id, initialQty: p.quantity });
                                  } else {
                                    setUpdatingSyncIds((s) => [...s, p.id]);
                                    try {
                                      await handleAttachProducts(warehouse.id, { product_id: p.id, quantity: null, sync_stock: true } as any);
                                      await loadWarehouseDetail(warehouse.id);
                                    } finally {
                                      setUpdatingSyncIds((s) => s.filter((id) => id !== p.id));
                                    }
                                  }
                                }}
                              />
                              <Button size="sm" variant="outline" onClick={() => navigate(`/producto/${p.id}`)}>Ver</Button>
                              <Button size="sm" variant="outline" color="red" onClick={() => setProductToRemove(p)}>Quitar</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Productos disponibles */}
          {isEditable && (
            <Card>
              <CardHeader>
                <CardTitle>Productos Disponibles</CardTitle>
              </CardHeader>
              <CardBody>
                {productsLoading ? (
                  <div className="py-8 text-center">
                    <Icon icon="HeroArrowPath" className="animate-spin" />
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-600">No hay productos disponibles</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Marca</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Stock</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {availableProducts.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-sm">{p.sku}</td>
                            <td className="px-4 py-2 text-sm">{p.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{p.brand?.name ?? 'N/A'}</td>
                            <td className="px-4 py-2 text-right text-sm">{p.stock ?? 0}</td>
                            <td className="px-4 py-2 text-center">
                              <Button size="sm" variant="outline" color="blue" onClick={() => openAttachModal(p)}>
                                Asociar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </Container>

      {/* Modales */}
      {productToRemove && (
        <Modal isOpen={!!productToRemove} setIsOpen={() => setProductToRemove(null)} size="md">
          <ModalHeader>
            <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm">¿Estás seguro de quitar este producto de la bodega?</p>
            <div className="mt-3 rounded-lg border p-3">
              <p className="font-medium">Producto: {productToRemove.name}</p>
              <p className="text-sm text-gray-600">SKU: {productToRemove.sku}</p>
              <p className="text-sm text-gray-600">Cantidad: {productToRemove.quantity}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProductToRemove(null)}>Cancelar</Button>
              <Button color="red" onClick={async () => {
                const success = await handleDetachProduct(warehouse.id, { product_id: productToRemove.id } as any);
                if (success) setProductToRemove(null);
              }}>
                Sí, quitar
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {attachProduct && (
        <Modal isOpen={!!attachProduct} setIsOpen={() => setAttachProduct(null)} size="sm">
          <ModalHeader><h3 className="text-lg font-semibold">Asociar producto</h3></ModalHeader>
          <ModalBody>
            <p className="text-sm">Producto: <strong>{attachProduct.name}</strong></p>
            <div className="mt-3 flex items-center gap-3">
              <Checkbox id="attach-sync" variant="switch" checked={attachSync} onChange={(e) => setAttachSync(e.target.checked)} />
              <label htmlFor="attach-sync" className="text-sm">Sincronizar</label>
            </div>
            {!attachSync && (
              <div className="mt-3">
                <label className="text-sm block mb-1">Cantidad</label>
                <Input type="number" min="1" value={attachQty} onChange={(e) => setAttachQty(parseInt(e.target.value || '0'))} />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAttachProduct(null)}>Cancelar</Button>
              <Button color="blue" onClick={confirmAttach} isLoading={attaching}>Confirmar</Button>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {qtyModal.open && (
        <Modal isOpen={qtyModal.open} setIsOpen={() => setQtyModal({ open: false, productId: null, initialQty: 1 })} size="sm">
          <ModalHeader><h3 className="text-lg font-semibold">Cantidad manual</h3></ModalHeader>
          <ModalBody>
            <p className="text-sm">Ingrese la cantidad manual para este producto</p>
            <Input type="number" min="1" value={qtyInput} onChange={(e) => setQtyInput(parseInt(e.target.value || '0'))} />
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setQtyModal({ open: false, productId: null, initialQty: 1 })}>Cancelar</Button>
              <Button color="blue" onClick={confirmQtyModal}>Confirmar</Button>
            </div>
          </ModalFooter>
        </Modal>
      )}
    </PageWrapper>
  );
};

export default WarehouseDetailPage;
