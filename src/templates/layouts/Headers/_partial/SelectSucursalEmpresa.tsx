import SelectReact, { TSelectGroups, TSelectOption } from '@/components/form/SelectReact';
import ApiService from '@/services/ApiService';
import { obtenerPersonalizacionThunk, useAppDispatch, useAppSelector } from '@/store';
// import { selectEmpresasThunk } from '@/store/slices/empresa/empresaSlice';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';


function SelectSucursalEmpresa() {
    const dispatch = useAppDispatch();
    const { personalizacionUsuario, access, isAuthenticated, listaGrupos } = useAppSelector((state) => state.auth);
    // const { selectEmpresas } = useAppSelector((state) => state.empresa);
    const [optionsEmpresas, setOptionsEmpresas] = useState<TSelectGroups>([]);
    const [selectedSucursal, setSelectedSucursal] = useState<{ value: string, label: string } | null>(null);

    // useEffect(() => {
    //     if (isAuthenticated) {
    //         dispatch(selectEmpresasThunk())
    //     }
    // }, [])

    // useEffect(() => {
    //     setOptionsEmpresas(
    //         selectEmpresas.map((emp) => {
    //             return {
    //                 label: emp.nombre,
    //                 options: emp.sucursales.map((suc) => {
    //                     return { value: suc.id.toString(), label: suc.nombre };
    //                 }),
    //             };
    //         })
    //     );
    // }, [selectEmpresas]);

    useEffect(() => {
        if (personalizacionUsuario && personalizacionUsuario.sucursal_principal && optionsEmpresas.length > 0) {
            // Buscar el label correspondiente al id de sucursal_principal
            for (const group of optionsEmpresas) {
                const sucursal = group.options.find(
                    (option) => option.value === personalizacionUsuario.sucursal_principal!.toString()
                );
                if (sucursal) {
                    setSelectedSucursal(sucursal);
                    break;
                }
            }
        }
    }, [personalizacionUsuario?.sucursal_principal, optionsEmpresas]);

    return (
        <div className='w-[20vw]'>
            {listaGrupos?.grupos.some(grupo => grupo === "superadmin" || grupo === "admin") && (
                <SelectReact
                    className='w-full'
                    noOptionsMessage={() => ("Sin Opciones")}
                    placeholder="Seleccion de Sucursal"
                    dimension="sm"
                    name="select_empresa"
                    value={selectedSucursal}
                    options={optionsEmpresas}
                    // onChange={ async (e) => {
                    //     try {
                    //         // const response = await ApiService.fetchData({url: `/api/personalizacion-usuarios/${personalizacionUsuario?.id}/`, method: 'patch', headers: {'Content-Type': 'application/json'}, data: JSON.stringify({sucursal_principal: parseInt((e as TSelectOption)?.value)})})
                    //         if (response.data) {
                    //             dispatch(obtenerPersonalizacionThunk({access}))
                    //         }
                    //     } catch (error: any) {
                    //         toast.error(error)
                    //     }
                    // }}
                />
            )}
        </div>
    );
}

export default SelectSucursalEmpresa;
