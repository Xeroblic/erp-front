import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  assignFeatures,
  fetchFeatures,
  selectFeaturesList,
  selectAssignLoading,
} from '@/store/slices/featuresSlice/featuresSlice';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify';

interface UsuarioLite {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
}

const Usuarios = () => {
  const dispatch = useAppDispatch();
  const isSaving = useAppSelector(selectAssignLoading);
  const currentFeatures = useAppSelector(selectFeaturesList);

  const [usuarios, setUsuarios] = useState<UsuarioLite[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // 1. Cargar lista de usuarios por empresa
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data } = await ApiService.fetchData<UsuarioLite[]>({
          url: '/users?include=company',
          method: 'get',
        });
        setUsuarios(data);
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Error al cargar usuarios');
      }
    };
    fetchUsuarios();
  }, []);

  // 2. Cuando cambia el usuario seleccionado, cargar sus features
  useEffect(() => {
    if (usuarioId !== null) {
      dispatch(fetchFeatures(usuarioId))
        .unwrap()
        .then((data) => setSelectedFeatures(data))
        .catch((e) => toast.error('Error al obtener features del usuario'));
    }
  }, [usuarioId]);

  const toggleFeature = (f: string) => {
    if (selectedFeatures.includes(f)) {
      setSelectedFeatures(selectedFeatures.filter((k) => k !== f));
    } else {
      setSelectedFeatures([...selectedFeatures, f]);
    }
  };

  const guardarCambios = async () => {
    if (!usuarioId) return;
    try {
      await dispatch(assignFeatures({ userId: usuarioId, features: selectedFeatures })).unwrap();
      toast.success('✅ Features actualizadas correctamente');
    } catch (err: any) {
      toast.error(`❌ Error: ${err}`);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Gestión de Features por Usuario</h2>

      {/* Selector de usuario */}
      <select
        className="mb-4 p-2 border rounded"
        value={usuarioId ?? ''}
        onChange={(e) => setUsuarioId(Number(e.target.value))}
      >
        <option value="">Selecciona un usuario</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>
            {u.first_name} {u.last_name} ({u.email}) {u.company_name ? ` - ${u.company_name}` : ''}
          </option>
        ))}
      </select>

      {/* Lista de checkboxes */}
      {usuarioId && (
        <>
          <div className="flex flex-col gap-2">
            {currentFeatures.map((feat) => (
              <label key={feat} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feat)}
                  onChange={() => toggleFeature(feat)}
                />
                {feat}
              </label>
            ))}
          </div>

          <button
            onClick={guardarCambios}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </>
      )}
    </div>
  );
};

export default Usuarios;
