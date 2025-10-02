import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Validation from '@/components/form/Validation';
import Radio, { RadioGroup } from '@/components/form/Radio';
import { ProfileFormik } from '../types';

type Props = {
  formik: ProfileFormik;
  onAvatarUpload: (file: File) => Promise<void> | void;
};

const EditProfileTab = ({ formik, onAvatarUpload }: Props) => {
  return (
    <>
      <div className='text-4xl font-semibold'>Editar Perfil</div>
      <div className='flex w-full gap-4'>
        <div className='flex grow items-center'>
          <div className='w-full'>
            <Label htmlFor='fileUpload' description='Esta permitido JPG o PNG.'>
              Sube una nueva imagen
            </Label>
            <Input
              id='fileUpload'
              name='fileUpload'
              type='file'
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  await onAvatarUpload(file);
                  event.target.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='email'>Email</Label>
          <FieldWrap firstSuffix={<Icon icon='HeroEnvelope' className='mx-2' />}>
            <Input
              id='email'
              name='email'
              value={formik.values.email || ''}
              readOnly
              autoComplete='email'
            />
          </FieldWrap>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='rut'>RUT</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.rut}
            invalidFeedback={formik.errors.rut}>
            <Input
              id='rut'
              name='rut'
              value={formik.values.rut || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='first_name'>Primer nombre</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.first_name}
            invalidFeedback={formik.errors.first_name}>
            <Input
              id='first_name'
              name='first_name'
              value={formik.values.first_name || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='second_name'>Segundo nombre</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.second_name}
            invalidFeedback={formik.errors.second_name}>
            <Input
              id='second_name'
              name='second_name'
              value={formik.values.second_name || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='last_name'>Primer apellido</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.last_name}
            invalidFeedback={formik.errors.last_name}>
            <Input
              id='last_name'
              name='last_name'
              value={formik.values.last_name || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='second_last_name'>Segundo apellido</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.second_last_name}
            invalidFeedback={formik.errors.second_last_name}>
            <Input
              id='second_last_name'
              name='second_last_name'
              value={formik.values.second_last_name || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='celular'>Celular</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.celular}
            invalidFeedback={formik.errors.celular}>
            <Input
              id='celular'
              name='celular'
              value={formik.values.celular || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='fono_fijo'>Telefono fijo</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.fono_fijo}
            invalidFeedback={formik.errors.fono_fijo}>
            <Input
              id='fono_fijo'
              name='fono_fijo'
              value={formik.values.fono_fijo || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label htmlFor='fecha_nacimiento'>Fecha de nacimiento</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.fecha_nacimiento}
            invalidFeedback={formik.errors.fecha_nacimiento}>
            <Input
              type='date'
              id='fecha_nacimiento'
              name='fecha_nacimiento'
              value={formik.values.fecha_nacimiento || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
        <div className='col-span-12 lg:col-span-6'>
          <Label>Genero</Label>
          <RadioGroup isInline>
            {[
              { value: '0', label: 'No Especificado' },
              { value: '1', label: 'Masculino' },
              { value: '2', label: 'Femenino' },
            ].map((option) => (
              <Radio
                key={option.value}
                label={option.label}
                name='genero'
                value={option.value}
                selectedValue={formik.values.genero ?? ''}
                onChange={formik.handleChange}
              />
            ))}
          </RadioGroup>
        </div>
      </div>
    </>
  );
};

export default EditProfileTab;
