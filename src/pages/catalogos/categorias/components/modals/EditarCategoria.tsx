import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import type { ICategory } from '../../types';

type ParentOption = {
  id: number;
  name: string;
};

type EditarCategoriaProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  category: ICategory | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  parentOptions: ParentOption[];
  isLoading?: boolean;
};

const EditarCategoria: React.FC<EditarCategoriaProps> = ({
  isOpen,
  setIsOpen,
  category,
  onSubmit,
  parentOptions,
  isLoading,
}) => {
  const [active, setActive] = React.useState<boolean>(category?.is_active ?? true);

  React.useEffect(() => {
    if (category) {
      setActive(category.is_active);
    }
  }, [category]);

  const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = document.getElementById('editCategoryForm') as HTMLFormElement | null;
    form?.requestSubmit();
  };

  if (!category) return null;

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg">
      <ModalHeader>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Icon icon="HeroPencilSquare" className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar categoria</h2>
            <p className="text-sm text-gray-600">Actualiza los datos principales de la categoria</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <form id="editCategoryForm" className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" name="id" value={category.id} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="edit-name" className="required">
                Nombre
              </Label>
              <Input id="edit-name" name="name" type="text" defaultValue={category.name} required />
            </div>
            <div>
              <Label htmlFor="edit-parent">Categoria padre</Label>
              <Select id="edit-parent" name="parent_id" defaultValue={category.parent_id ? String(category.parent_id) : ''}>
                <option value="">Ninguna</option>
                {parentOptions
                  .filter((option) => option.id !== category.id)
                  .map((option) => (
                    <option key={option.id} value={String(option.id)}>
                      {option.name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Descripcion</Label>
            <Textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={category.description ?? ''}
              placeholder="Descripcion de la categoria"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Categoria activa</p>
              <p className="text-xs text-gray-500">Controla si la categoria esta disponible en el catalogo.</p>
            </div>
            <Checkbox
              id="edit-active"
              name="is_active"
              checked={active}
              onChange={(event) => setActive(event.currentTarget.checked)}
            />
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button color="blue" onClick={handleSubmitClick} isDisable={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default EditarCategoria;
