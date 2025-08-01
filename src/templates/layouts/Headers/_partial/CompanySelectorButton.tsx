import React, { useState } from 'react';
import { useAppSelector } from '@/store';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import CompanySelector from '@/components/authorization/CompanySelector';

const CompanySelectorButton: React.FC = () => {
    const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);
    const user = useAppSelector((state) => state.auth.user);

    // Solo mostrar si el usuario tiene múltiples empresas o es super-admin
    const shouldShowSelector = user?.authority?.includes('super-admin') ||
        (user?.company && user.company.id);

    if (!shouldShowSelector) {
        return null;
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCompanySelectorOpen(true)}
                className="flex items-center gap-2"
            >
                <Icon icon="HeroBuildingOffice2" className="w-4 h-4" />
                <span className="hidden md:inline">
                    {user?.company?.name || 'Seleccionar Empresa'}
                </span>
                <Icon icon="HeroChevronDown" className="w-3 h-3" />
            </Button>

            <CompanySelector
                isOpen={isCompanySelectorOpen}
                onClose={() => setIsCompanySelectorOpen(false)}
            />
        </>
    );
};

export default CompanySelectorButton;
