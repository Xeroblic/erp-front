import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import { useAppSelector } from '@/store';

/**
 * Dashboard principal del ERP EcoPC.
 * Muestra un banner de bienvenida y accesos rápidos a los módulos clave.
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
const { nombre, authority = [] } = useAppSelector(s => s.auth.user || {});
  return (
    <PageWrapper isProtectedRoute title="Inicio">
      {/* Encabezado */}
      <Subheader>
        <SubheaderLeft>
          <h1 className="text-2xl font-semibold leading-none">
            ¡Hola {user?.firstName ?? '👋'}!
          </h1>
          <Badge className="ml-4">Inicio</Badge>
        </SubheaderLeft>
      </Subheader>

      {/* Contenido principal */}
      <Container className="flex flex-col items-center w-full h-full">
        {/* Banner */}
        <div className="w-full max-w-9xl mb-8">
          <Card className="relative">
            <img
              className="w-full h-72 object-cover rounded-lg"
              src="https://placehold.co/1200x300/0E9F6E/FFFFFF?text=Bienvenid@+a+EcoPC+ERP"
              alt="Banner de bienvenida"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {/* <h2 className="text-4xl font-bold text-white drop-shadow-md">
                Bienvenid{user?.gender === 'F' ? 'a' : 'o'} {user?.firstName ?? ''}
              </h2> */}
            </div>
          </Card>
        </div>

        {/* Tarjetas de accesos rápidos */}
        <div className="grid w-full max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 mb-16">
          {/* Inventario */}
          <Card
            className="transition-transform duration-200 ease-in-out hover:scale-105 shadow-xl cursor-pointer"
            onClick={() => navigate('/inventario')}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white rounded-t-lg">
              <h3 className="text-xl font-semibold">Inventario</h3>
            </CardHeader>
            <CardBody className="p-6 flex flex-col gap-4">
              <div className="h-40 overflow-hidden rounded-lg">
                <img
                  className="h-full w-full object-cover"
                  src="https://placehold.co/600x300/047857/FFFFFF?text=Inventario"
                  alt="Inventario"
                />
              </div>
              <p className="text-gray-700 text-sm">
                Revisa y gestiona tus productos y bodegas.
              </p>
            </CardBody>
          </Card>

          {/* Órdenes de compra */}
          <Card
            className="transition-transform duration-200 ease-in-out hover:scale-105 shadow-xl cursor-pointer"
            onClick={() => navigate('/ordenes-compra')}
          >
            <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white rounded-t-lg">
              <h3 className="text-xl font-semibold">Órdenes de compra</h3>
            </CardHeader>
            <CardBody className="p-6 flex flex-col gap-4">
              <div className="h-40 overflow-hidden rounded-lg">
                <img
                  className="h-full w-full object-cover"
                  src="https://placehold.co/600x300/F97316/FFFFFF?text=Compras"
                  alt="Órdenes"
                />
              </div>
              <p className="text-gray-700 text-sm">
                Crea, aprueba y sigue el estado de tus órdenes.
              </p>
            </CardBody>
          </Card>
        </div>
      </Container>
    </PageWrapper>
  );
};

export default Dashboard;