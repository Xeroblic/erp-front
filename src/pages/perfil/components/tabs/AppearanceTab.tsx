import Label from '@/components/form/Label';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Radio, { RadioGroup } from '@/components/form/Radio';
import { ProfileFormik } from '../types';

type CurrentCompany = {
  name?: string | null;
  role?: string | null;
  is_primary?: boolean | null;
} | null;

type Props = {
  formik: ProfileFormik;
  currentCompany: CurrentCompany;
};

const AppearanceTab = ({ formik, currentCompany }: Props) => {
  return (
    <>
      <div className='text-4xl font-semibold'>Apariencia</div>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12'>
          <Label htmlFor='current-company'>Empresa Actual</Label>
          <div className='flex items-center gap-3 rounded-lg border bg-gray-50 p-3 dark:bg-gray-800'>
            <Icon icon='HeroBuildingOffice2' className='h-8 w-8 text-blue-600' />
            <div className='flex flex-col'>
              <span className='text-lg font-medium'>{currentCompany?.name || 'No seleccionada'}</span>
              <span className='text-sm text-gray-500'>Rol: {currentCompany?.role || 'N/A'}</span>
            </div>
            {currentCompany?.is_primary && (
              <Badge variant='outline' color='emerald' className='ml-auto'>
                Principal
              </Badge>
            )}
          </div>
        </div>
        <div className='col-span-12'>
          <Label htmlFor='theme'>Tema</Label>
          <RadioGroup isInline>
            <Radio name='theme' value='dark' selectedValue={formik.values.theme} onChange={formik.handleChange}>
              <div className='relative'>
                <div className='flex h-2 w-full items-center gap-1 bg-zinc-500 p-1'>
                  <div className='h-1 w-1 rounded-full bg-red-500' />
                  <div className='h-1 w-1 rounded-full bg-amber-500' />
                  <div className='h-1 w-1 rounded-full bg-emerald-500' />
                </div>
                <div className='flex aspect-video w-56 bg-zinc-950'>
                  <div className='h-full w-1/4 border-e border-zinc-800/50 bg-zinc-900/75' />
                  <div className='h-full w-3/4'>
                    <div className='h-4 w-full border-b border-zinc-800/50 bg-zinc-900/75' />
                    <div />
                  </div>
                </div>
              </div>
            </Radio>
            <Radio name='theme' value='light' selectedValue={formik.values.theme} onChange={formik.handleChange}>
              <div className='relative'>
                <div className='flex h-2 w-full items-center gap-1 bg-zinc-500 p-1'>
                  <div className='h-1 w-1 rounded-full bg-red-500' />
                  <div className='h-1 w-1 rounded-full bg-amber-500' />
                  <div className='h-1 w-1 rounded-full bg-emerald-500' />
                </div>
                <div className='flex aspect-video w-56 bg-zinc-100'>
                  <div className='h-full w-1/4 border-e border-zinc-300/25 bg-white' />
                  <div className='h-full w-3/4'>
                    <div className='h-4 w-full border-b border-zinc-300/25 bg-white' />
                    <div />
                  </div>
                </div>
              </div>
            </Radio>
            <Radio name='theme' value='system' selectedValue={formik.values.theme} onChange={formik.handleChange}>
              <div className='relative'>
                <div className='flex h-2 w-full items-center gap-1 bg-zinc-500 p-1'>
                  <div className='h-1 w-1 rounded-full bg-red-500' />
                  <div className='h-1 w-1 rounded-full bg-amber-500' />
                  <div className='h-1 w-1 rounded-full bg-emerald-500' />
                </div>
                <div className='flex aspect-video w-56'>
                  <div className='h-full w-1/2 bg-zinc-950'>
                    <div className='h-full w-1/4 border-e border-zinc-800/50 bg-zinc-900/75' />
                    <div className='h-full w-3/4'>
                      <div className='h-4 w-full border-b border-zinc-800/50 bg-zinc-900/75' />
                      <div />
                    </div>
                  </div>
                  <div className='h-full w-1/2 bg-zinc-100'>
                    <div className='h-full w-1/4 border-e border-zinc-300/25 bg-white' />
                    <div className='h-full w-3/4'>
                      <div className='h-4 w-full border-b border-zinc-300/25 bg-white' />
                      <div />
                    </div>
                  </div>
                </div>
              </div>
            </Radio>
          </RadioGroup>
        </div>
      </div>
    </>
  );
};

export default AppearanceTab;
