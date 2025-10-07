import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';

type ParentOption = {
  id: number;
  name: string;
};

type CrearCategoriaProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  parentOptions: ParentOption[];
  isLoading?: boolean;
};

const CrearCategoria: React.FC<CrearCategoriaProps> = ({
  isOpen,
  setIsOpen,
  onSubmit,
  parentOptions,
  isLoading,
}) => {
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!isOpen) {
      setActive(true);
      const form = document.getElementById('createCategoryForm') as HTMLFormElement | null;
      form?.reset();
    }
  }, [isOpen]);

  const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = document.getElementById('createCategoryForm') as HTMLFormElement | null;
    form?.requestSubmit();
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg">
      <ModalHeader>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <Icon icon="HeroPlus" className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nueva categoria</h2>
            <p className="text-sm text-gray-600">Registra una categoria disponible para tus productos</p>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <form id="createCategoryForm" className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="create-name" className="required">
                Nombre
              </Label>
              <Input id="create-name" name="name" type="text" placeholder="Ej: Electronica" required />
            </div>
            <div>
              <Label htmlFor="create-parent">Categoria padre</Label>
              <Select id="create-parent" name="parent_id" defaultValue="">
                <option value="">Ninguna</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="create-description">Descripcion</Label>
            <Textarea id="create-description" name="description" rows={3} placeholder="Descripcion de la categoria" />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Categoria activa</p>
              <p className="text-xs text-gray-500">Controla si la categoria esta disponible en el catalogo.</p>
            </div>
            <Checkbox
              id="create-active"
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
          <Button color="emerald" onClick={handleSubmitClick} isDisable={isLoading}>
            {isLoading ? 'Creando...' : 'Crear categoria'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CrearCategoria;
