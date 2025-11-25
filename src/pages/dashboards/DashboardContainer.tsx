import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/Badge';
import { DashboardType, DASHBOARD_CONFIGS } from './types';
import { useAppSelector } from '@/store';

import FalabellaDashboard from './components/falabella/FalabellaDashboard';
import RipleyDashboard from './components/ripley/RipleyDashboard';
import ParisDashboard from './components/paris/ParisDashboard';
import EcoPCDashboard from './components/ecopc/EcoPCDashboard';
import EcoTIDashboard from './components/ecoti/EcoTIDashboard';
import SalesDashboard from '../reportes/SalesDashboard';

const STORAGE_KEY = 'zentria_selected_dashboard';

const DashboardContainer: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);

    const [selectedDashboard, setSelectedDashboard] = useState<DashboardType>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return (stored as DashboardType) || 'ecopc';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, selectedDashboard);
    }, [selectedDashboard]);

    const currentConfig = DASHBOARD_CONFIGS[selectedDashboard];

    const dashboardOptions = Object.values(DASHBOARD_CONFIGS).map(config => ({
        value: config.id,
        label: config.name
    }));

    const renderDashboard = () => {
        switch (selectedDashboard) {
            case 'falabella':
                return <FalabellaDashboard />;
            case 'ripley':
                return <RipleyDashboard />;
            case 'paris':
                return <ParisDashboard />;
            case 'ecopc':
                return <EcoPCDashboard />;
            case 'ecoti':
                return <EcoTIDashboard />;
            default:
                return <EcoPCDashboard />;
        }
    };

    return (
        <PageWrapper isProtectedRoute={true} title='Dashboard' name={`Dashboard ${currentConfig.name}`}>
            <Subheader className="border-b border-gray-200 dark:border-gray-700">
                <SubheaderLeft>
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            ¡Hola {user?.first_name || 'Usuario'}!
                        </h1>
                        <Badge
                            className={`text-white ${currentConfig.colors.background}`}
                        >
                            {currentConfig.name}
                        </Badge>
                    </div>
                </SubheaderLeft>
                {/* <SubheaderRight>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Seleccionar Dashboard:
                        </span>
                        <Select
                            name='dashboard-select'
                            value={selectedDashboard}
                            onChange={(e) => setSelectedDashboard(e.target.value as DashboardType)}
                            className="min-w-[150px]"
                        >
                            {dashboardOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </SubheaderRight> */}
            </Subheader>

            <Container className="py-6 p-0">
                <div
                    className="transition-all duration-300 ease-in-out"
                    style={{
                        '--dashboard-primary': currentConfig.colors.primary,
                        '--dashboard-secondary': currentConfig.colors.secondary,
                        '--dashboard-accent': currentConfig.colors.accent,
                        '--dashboard-background': currentConfig.colors.background,
                        '--dashboard-text': currentConfig.colors.text,
                    } as React.CSSProperties}
                >
                    {/* {renderDashboard()} */}
                    <SalesDashboard standalone={false} showHeader={false} />

                </div>
            </Container>
        </PageWrapper>
    );
};

export default DashboardContainer;
