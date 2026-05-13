import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { privatePages, PageConfig, dashboardQuickLinksConfig } from '@/config/pages.config';
import Icon from '@/components/icon/Icon';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import Card from '@/components/ui/Card';

// Importaciones para Drag and Drop
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useThemeColor from '@/hooks/useThemeColor';

const SESSION_ORDER_KEY = 'dashboard_quicklinks_order';

const SortableSectionCard = ({ id, section, subPagesToShow }: { id: string, section: PageConfig, subPagesToShow: PageConfig[] }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 50 : 1,
    };

	const { themeColor } = useThemeColor();

    return (
        <div ref={setNodeRef} style={style} className={`h-full ${isDragging ? 'relative' : ''}`}>
            <Card className='flex h-full flex-col overflow-hidden border border-gray-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/80'>
                <div 
                    {...attributes} 
                    {...listeners} 
                    className='flex cursor-grab items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-4 active:cursor-grabbing dark:border-gray-700/50 dark:bg-gray-900/20'
                >
                    <div className='flex items-center gap-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200/50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400'>
                            <Icon color={themeColor} icon={section.icon} className='text-lg' />
                        </div>
                        <h3 className='text-base font-bold text-gray-800 dark:text-gray-100'>
                            {section.text}
                        </h3>
                    </div>
                    <div className='text-gray-300 transition-colors hover:text-gray-500 dark:text-gray-600'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
                        </svg>
                    </div>
                </div>

                <div className='flex-grow p-5'>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        {subPagesToShow.map((subPage) => (
                            <PermissionGuard key={subPage.id} permission={subPage.authority} role={subPage.roles}>
                                <Link to={subPage.to} className='group block h-full'>
                                    <div className='flex h-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm dark:border-gray-700/50 dark:bg-gray-900/40 dark:hover:border-blue-500/40 dark:hover:bg-gray-800'>
                                        <div className='flex items-center gap-3'>
                                            <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-transform duration-300 group-hover:scale-105 dark:bg-gray-800'>
                                                <Icon color={themeColor} icon={subPage.icon} className='text-xl transition-colors duration-300 group-hover:text-blue-600 dark:text-red-400 dark:group-hover:text-blue-400' />
                                            </div>
                                            <span className='text-sm font-semibold text-gray-600 transition-colors duration-300 group-hover:text-blue-700 dark:text-gray-300 dark:group-hover:text-blue-400'>
                                                {subPage.text}
                                            </span>
                                        </div>
                                        <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center text-gray-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14"></path>
                                                <path d="m12 5 7 7-7 7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            </PermissionGuard>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

// Interface para recibir la cantidad de columnas desde el padre
interface QuickLinksProps {
    columnCount: number;
}

// --- COMPONENTE PRINCIPAL ---
const QuickLinks: React.FC<QuickLinksProps> = ({ columnCount }) => {
    
    // Estado para el orden guardado en caché
    const [sections, setSections] = useState(() => {
        const savedOrder = sessionStorage.getItem(SESSION_ORDER_KEY);
        if (savedOrder) {
            try {
                const parsedIds = JSON.parse(savedOrder);
                return [...dashboardQuickLinksConfig].sort((a, b) => {
                    const indexA = parsedIds.indexOf(a.section);
                    const indexB = parsedIds.indexOf(b.section);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            } catch (error) {
                return dashboardQuickLinksConfig;
            }
        }
        return dashboardQuickLinksConfig;
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((item) => item.section === active.id);
                const newIndex = items.findIndex((item) => item.section === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(newOrder.map(i => i.section)));
                return newOrder;
            });
        }
    };

    const getGridColsClass = (cols: number) => {
        switch (cols) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-1 xl:grid-cols-2';
            case 3: return 'grid-cols-1 xl:grid-cols-3';
            case 4: return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4';
            default: return 'grid-cols-1 xl:grid-cols-3';
        }
    };

    return (
        <div className="w-full">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className={`grid w-full items-start gap-6 transition-all duration-500 ${getGridColsClass(columnCount)}`}>
                    <SortableContext items={sections.map(s => s.section)} strategy={rectSortingStrategy}>
                        {sections.map((config, index) => {
                            const section = (privatePages as Record<string, PageConfig>)[config.section];
                            if (!section || !section.subPages) return null;

                            let subPagesToShow: PageConfig[] = [];
                            if (config.items && config.items.length > 0) {
                                subPagesToShow = config.items
                                    .map((key) => section.subPages![key] || Object.values(section.subPages!).find(sp => sp.id === key))
                                    .filter(Boolean) as PageConfig[];
                            } else {
                                subPagesToShow = Object.values(section.subPages);
                            }

                            subPagesToShow = subPagesToShow.filter((sp) => !sp.to.includes(':'));
                            if (subPagesToShow.length === 0) return null;

                            return (
                                <PermissionGuard key={section.id || index} permission={section.authority} role={section.roles}>
                                    <SortableSectionCard id={config.section} section={section} subPagesToShow={subPagesToShow} />
                                </PermissionGuard>
                            );
                        })}
                    </SortableContext>
                </div>
            </DndContext>
        </div>
    );
};

export default QuickLinks;