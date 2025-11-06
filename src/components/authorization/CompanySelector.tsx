import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import Button from '../ui/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal';
import SelectReact, { TSelectOption } from '../form/SelectReact';
import Badge from '../ui/Badge';
import Icon from '../icon/Icon';
import { toast } from 'react-toastify';
import ApiService from '../../services/ApiService';
import { userMeThunk } from '../../store/slices/auth/authSlice';
import { useAppDispatch } from '../../store';

interface CompanySelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CompanyInfo {
    id: number;
    name: string;
    rut: string;
    role: string;
    is_primary: boolean;
    subsidiary_id: number;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [availableCompanies, setAvailableCompanies] = useState<CompanyInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [isSwitching, setIsSwitching] = useState(false);

    // Empresa actual del usuario
    const currentCompany = user?.subsidiary ? {
        id: user.subsidiary.id,
        name: user.subsidiary.name,
        rut: user.company?.rut || '',
        role: user.position || 'employee',
        is_primary: true,
        subsidiary_id: user.subsidiary.id
    } : null;

    // Obtener empresas disponibles desde personalización
    // const refreshCompanies = async () => {
    //     setIsLoading(true);
    //     try {
    //         const response = await ApiService.fetchData<{
    //             companies: Array<{
    //                 id: number;
    //                 company_name: string;
    //                 is_primary: number;
    //                 position_in_company: string;
    //                 subsidiaries_count: number;
    //                 branches_count: number;
    //             }>;
    //             current_company: {
    //                 id: number;
    //                 company_name: string;
    //                 subsidiaries: Array<{
    //                     id: number;
    //                     subsidiary_name: string;
    //                     branches_count: number;
    //                     branches: Array<{
    //                         id: number;
    //                         branch_name: string;
    //                     }>;
    //                 }>;
    //             } | null;
    //         }>({
    //             url: '/user/personalization',
    //             method: 'get'
    //         });

    //         // Si hay una empresa actual con subsidiarias, usamos esas
    //         if (response.data.current_company?.subsidiaries) {
    //             const subsidiaries = response.data.current_company.subsidiaries.map(subsidiary => ({
    //                 id: subsidiary.id,
    //                 name: subsidiary.subsidiary_name,
    //                 rut: '', // No viene en la respuesta
    //                 role: user?.position || 'employee',
    //                 is_primary: subsidiary.id === 1, // Asumir que la primera es primary
    //                 subsidiary_id: subsidiary.id
    //             }));
    //             setAvailableCompanies(subsidiaries);
    //         } else {
    //             setAvailableCompanies([]);
    //         }
    //     } catch (error: any) {
    //         toast.error('Error al cargar empresas disponibles');
    //         setAvailableCompanies([]);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // Cambiar empresa activa (cambiar subsidiaria)
    const switchCompany = async (subsidiaryId: string): Promise<boolean> => {
        setIsSwitching(true);
        try {
            const subsidiaryIdNum = parseInt(subsidiaryId, 10);
            // Para subsidiarias de la misma empresa, enviamos el company_id (1) y subsidiary_id
            await ApiService.fetchData({
                url: '/user/switch-company',
                method: 'post',
                data: {
                    company_id: 1, // ID de EcoTech SPA
                    subsidiary_id: subsidiaryIdNum // ID de la subsidiaria seleccionada
                }
            });
            
            // Actualizar personalización con la nueva subsidiaria principal
            const currentPersonalization = user?.personalizacion;
            if (currentPersonalization) {
                try {
                    await ApiService.fetchData({
                        url: '/user/personalization',
                        method: 'put',
                        data: {
                            tema: currentPersonalization.tema,
                            font_size: currentPersonalization.font_size,
                            sucursal_principal: subsidiaryIdNum
                        }
                    });
                } catch (personalizationError) {
                    console.warn('Error updating personalization:', personalizationError);
                    // No fallar el cambio de empresa si falla la actualización de personalización
                }
            }

            // Refrescar datos del usuario
            await dispatch(userMeThunk()).unwrap();

            toast.success('Empresa cambiada exitosamente');
            return true;
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al cambiar empresa');
            return false;
        } finally {
            setIsSwitching(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // refreshCompanies();
            setSelectedCompanyId(currentCompany?.id?.toString() || null);
        }
    }, [isOpen, currentCompany]);

    const handleSwitchCompany = async () => {
        if (!selectedCompanyId || selectedCompanyId === currentCompany?.id?.toString()) {
            onClose();
            return;
        }

        setIsSwitching(true);
        const success = await switchCompany(selectedCompanyId);
        if (success) {
            onClose();
            // Refrescar la página para aplicar cambios
            window.location.reload();
        }
        setIsSwitching(false);
    };

    const companyOptions: TSelectOption[] = availableCompanies.map(company => ({
        value: company.id.toString(),
        label: `${company.name} (${company.rut}) - ${company.role}`
    }));

    return (
        <Modal isOpen={isOpen} setIsOpen={onClose} size="lg">
            <ModalHeader>
                <div className="flex items-center gap-2">
                    <Icon icon="HeroBuildingOffice2" className="w-5 h-5" />
                    Seleccionar Empresa
                </div>
            </ModalHeader>

            <ModalBody>
                <div className="space-y-4">
                    {currentCompany && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon icon="HeroCheckCircle" className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-900">Empresa Actual</span>
                            </div>
                            <div className="text-blue-800">
                                <div className="font-medium">{currentCompany.name}</div>
                                <div className="text-sm">{currentCompany.rut}</div>
                                <Badge color="blue" className="mt-1">
                                    {currentCompany.role}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cambiar a empresa:
                        </label>
                        <SelectReact
                            name="company-selector"
                            options={companyOptions}
                            value={companyOptions.find(opt => opt.value === selectedCompanyId) || null}
                            onChange={(option) => {
                                const singleOption = option as TSelectOption;
                                setSelectedCompanyId(singleOption?.value || null);
                            }}
                            placeholder="Seleccionar empresa..."
                            isLoading={isLoading}
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 })
                            }}
                        />
                    </div>

                    {user?.authority?.includes('super-admin') && (
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Icon icon="HeroShieldCheck" className="w-4 h-4 text-amber-600" />
                                <span className="text-sm text-amber-800">
                                    Como Super Admin tienes acceso a todas las empresas del sistema
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </ModalBody>

            <ModalFooter>
                <Button variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    color="blue"
                    onClick={handleSwitchCompany}
                    isLoading={isSwitching}
                    isDisable={!selectedCompanyId || selectedCompanyId === currentCompany?.id?.toString()}
                >
                    {selectedCompanyId === currentCompany?.id?.toString() ? 'Empresa Actual' : 'Cambiar Empresa'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default CompanySelector;
