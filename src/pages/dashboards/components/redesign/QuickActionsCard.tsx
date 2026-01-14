import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const QuickActionsCard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Card className='h-full border-none shadow-sm'>
            <CardHeader>
                <CardHeaderChild>
                    <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Accesos Rápidos</h3>
                </CardHeaderChild>
            </CardHeader>
            <CardBody className='grid grid-cols-1 gap-4 p-4'>
                <Button 
                    variant='solid' 
                    color='blue' 
                    icon='HeroClipboardDocumentCheck'
                    className='h-auto w-full flex-col py-4 text-center'
                    onClick={() => navigate('/technical-reviews/items')}
                >
                    <span className='mt-2 text-base font-semibold'>Modo B: Items</span>
                    <span className='text-xs opacity-90'>Ir a lista de revisiones</span>
                </Button>

                {/* Placeholder for future actions */}
                <Button 
                    variant='outline' 
                    color='emerald' 
                    icon='HeroQrCode'
                    className='h-auto w-full flex-col py-4 text-center'
                    onClick={() => navigate('/technical-reviews/batches')}
                >
                    <span className='mt-2 text-base font-semibold'>Modo A: Lotes</span>
                     <span className='text-xs opacity-90'>Gestión masiva</span>
                </Button>
            </CardBody>
        </Card>
    );
};

export default QuickActionsCard;
