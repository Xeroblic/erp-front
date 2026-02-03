import Icon from "@/components/icon/Icon";
import Container from "@/components/layouts/Container/Container";
import PageWrapper from "@/components/layouts/PageWrapper/PageWrapper";
import Subheader, { SubheaderLeft, SubheaderRight } from "@/components/layouts/Subheader/Subheader";
import Badge from "@/components/ui/Badge";
import Card, { CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";



const TrazabilidadSubsidiary = () => {
    
    
    
    return (
        <>
            <PageWrapper isProtectedRoute={true} name="trazabilidad-sucursal" title="Trazabilidad de Sucursal">
                <Subheader>
                    <SubheaderLeft>
                        <div className='flex flex-row px-2'>
                            <div className='flex items-center -ml-3 p-1'>
                                <Icon icon='DuoClip' className='h-8 w-8' />
                            </div>
                            <div className='flex flex-col justify-start items-start ml-2'>
                                <Badge className='text-xl font-bold'>Trazabilidad de Sucursal</Badge>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Consulta la trazabilidad de los productos en la sucursal seleccionada</p>
                            </div>
                        </div>
                    </SubheaderLeft>
                    <SubheaderRight>
                        agregar btnes de busqueda junto con nuevas funcionalidaddes
                    </SubheaderRight>
                </Subheader>
                <Container>
                    <>
                        <Card>
                            <CardHeader> 
                                <CardTitle>Lista de los ultimos movimientos en la Sucursal</CardTitle>
                            </CardHeader>
                            <CardBody>

                                <DataTable
                                    data={[]}
                                    columns={[]}
                                ></DataTable>
                            </CardBody>
                        </Card>
                    </>
                </Container>

            </PageWrapper>
        </>
    );
};

export default TrazabilidadSubsidiary;