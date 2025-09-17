import React from 'react'
import Card, { CardBody } from './Card'
import Icon from '../icon/Icon'

const Spinner = ({ nombre }: { nombre: string }) => {
  return (
      <Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
          <CardBody className='p-12 text-center'>
              <div
                  className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
                    <Icon
                        icon='HeroArrowPath'
                        className='h-10 w-10 animate-spin text-blue-600 dark:text-blue-400'
                    />
                </div>
                <h3 className='mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
                    Cargando {nombre}...
                </h3>
                <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                    Por favor espera mientras cargamos la información.
                </p>
            </CardBody>
        </Card>
  )
}

export default Spinner