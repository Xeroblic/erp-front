import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { ProfileFormik } from '../types';

type Props = {
  formik: ProfileFormik;
  regionOptions: TSelectOption[];
  provinceOptions: TSelectOption[];
  comunaOptions: TSelectOption[];
};

const ContactTab = ({ formik, regionOptions, provinceOptions, comunaOptions }: Props) => {
  return (
    <>
      <div className='text-4xl font-semibold'>Contacto</div>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12'>
          <Label htmlFor='direccion'>Direccion</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.direccion}
            invalidFeedback={formik.errors.direccion}>
            <Input
              id='direccion'
              name='direccion'
              value={formik.values.direccion || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Validation>
        </div>
      </div>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12'>
          <Label htmlFor='region'>Region</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.region}
            invalidFeedback={formik.errors.region}>
            <SelectReact
              id='region'
              name='region'
              isMulti={false}
              placeholder='Region'
              options={regionOptions}
              value={regionOptions.find((option) => option.value === formik.values.region) || null}
              onBlur={formik.handleBlur}
              onChange={(option) =>
                formik.setFieldValue('region', (option as TSelectOption | null)?.value || '')
              }
            />
          </Validation>
        </div>
      </div>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12'>
          <Label htmlFor='provincia'>Provincia</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.provincia}
            invalidFeedback={formik.errors.provincia}>
            <SelectReact
              id='provincia'
              name='provincia'
              isMulti={false}
              placeholder='Provincia'
              options={provinceOptions}
              value={provinceOptions.find((option) => option.value === formik.values.provincia) || null}
              onBlur={formik.handleBlur}
              onChange={(option) =>
                formik.setFieldValue('provincia', (option as TSelectOption | null)?.value || '')
              }
            />
          </Validation>
        </div>
      </div>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12'>
          <Label htmlFor='comuna'>Comuna</Label>
          <Validation
            isValid={formik.isValid}
            isTouched={formik.touched.comuna}
            invalidFeedback={formik.errors.comuna}>
            <SelectReact
              id='comuna'
              name='comuna'
              isMulti={false}
              placeholder='Comuna'
              options={comunaOptions}
              value={comunaOptions.find((option) => option.value === formik.values.comuna) || null}
              onBlur={formik.handleBlur}
              onChange={(option) =>
                formik.setFieldValue('comuna', (option as TSelectOption | null)?.value || '')
              }
            />
          </Validation>
        </div>
      </div>
    </>
  );
};

export default ContactTab;
