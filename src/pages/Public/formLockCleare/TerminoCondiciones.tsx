import Button from '@/components/ui/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';

const agreementClauses = [
	{
		title: 'PRIMERO',
		content:
			'Este contrato corresponde al comprobante de recepcion del equipo y se considera documento abierto al portador. Es responsabilidad del cliente conservarlo en lugar seguro, ya que no se realizara la entrega del equipo sin este respaldo.',
	},
	{
		title: 'SEGUNDO',
		content:
			'Los equipos se reciben sin accesorios (cables, manuales, bolsos u otros), salvo notebooks y equipos portatiles, que deben ingresar con su cargador o transformador.',
	},
	{
		title: 'TERCERO',
		content:
			'Los despachos de equipos se realizaran de forma excepcional, con un cargo de 0,5 UF + IVA, sujeto a acuerdo previo entre las partes.',
	},
	{
		title: 'CUARTO',
		content:
			'Los despachos fuera de Santiago se gestionaran mediante la empresa de transporte indicada por el cliente o por la empresa designada por el servicio tecnico, con cargo al cliente y previa confirmacion escrita.',
	},
	{
		title: 'QUINTO',
		content:
			'La garantia cubre mano de obra y repuestos por fallas de hardware derivadas exclusivamente del uso normal del equipo.',
	},
	{
		title: 'SEXTO',
		content:
			'La garantia no cubre fallas de software, eventos fortuitos, piezas quebradas, danos por mala manipulacion del usuario ni intervenciones efectuadas por personal no autorizado.',
	},
	{
		title: 'SEPTIMO',
		content:
			'Seran cobrados los chequeos por mala operacion o desconocimiento del usuario, software danado, virus, uso de suministros reciclados y cualquier falla no atribuible al hardware de equipos en garantia.',
	},
	{
		title: 'OCTAVO',
		content:
			'Para gestionar garantias, el cliente debe presentar la factura de compra. No se procesaran solicitudes sin la documentacion requerida.',
	},
	{
		title: 'NOVENO',
		content:
			'El cliente encomienda al servicio tecnico la revision y/o reparacion de los equipos descritos en la orden de ingreso, conforme a las condiciones de este contrato.',
	},
	{
		title: 'DECIMO',
		content:
			'El horario de atencion del servicio tecnico es de lunes a viernes, entre 10:00 y 17:30 horas, exceptuando feriados.',
	},
	{
		title: 'DECIMO PRIMERO',
		content:
			'Al ingresar el equipo, el cliente debera indicar si solicita presupuesto previo o si autoriza la reparacion inmediata.',
	},
	{
		title: 'DECIMO SEGUNDO',
		content:
			'El tiempo estimado para diagnostico o reparacion inicial es de 48 horas, sujeto a disponibilidad tecnica y orden de trabajo. Este plazo es referencial y no constituye obligacion contractual. El informe y presupuesto se notificaran por correo electronico o WhatsApp, y deberan ser aprobados por el cliente por alguno de dichos medios.',
	},
	{
		title: 'DECIMO TERCERO',
		content:
			'Cuando el cliente solicite diagnostico tecnico y no apruebe el presupuesto, se cobrara por revision y diagnostico: 0,8 UF + IVA (simple), 1,2 UF + IVA (media) y 1,6 UF + IVA (compleja). Esta condicion no aplica a clientes con contrato de mantencion vigente.',
	},
	{
		title: 'DECIMO CUARTO',
		content:
			'El tiempo de reparacion se estima en 48 horas desde la aceptacion del presupuesto y sujeto a disponibilidad de repuestos. El plazo es referencial y no constituye obligacion contractual.',
	},
	{
		title: 'DECIMO QUINTO',
		content:
			'Las reparaciones de clientes sin contrato de mantencion deben pagarse en efectivo o cheque al retiro. Para clientes con contrato de mantencion, el pago se gestionara segun el procedimiento pactado, incluida orden de compra cuando corresponda.',
	},
	{
		title: 'DECIMO SEXTO',
		content:
			'El servicio tecnico no se responsabiliza por perdida de informacion en discos, unidades externas u otros medios de almacenamiento. El cliente declara contar con respaldo previo de su informacion y de los programas necesarios para su operacion.',
	},
	{
		title: 'DECIMO SEPTIMO',
		content:
			'Todo repuesto y trabajo realizado cuenta con garantia de 30 dias. Se efectuara una nueva intervencion sin costo cuando la falla provenga del mismo servicio o repuesto, excluyendo uso indebido, mala operacion, software danado, virus, insumos reciclados o intervenciones de terceros no autorizados.',
	},
	{
		title: 'DECIMO OCTAVO',
		content:
			'En servicios de desinfeccion de virus, no se responde por perdida de informacion causada por la accion del malware, ya sea detectada antes o durante el proceso.',
	},
	{
		title: 'DECIMO NOVENO',
		content:
			'Una vez informado que el equipo esta listo para retiro (por correo o WhatsApp), si no es retirado dentro de 10 dias habiles se aplicara un cargo de almacenamiento de 0,12 UF + IVA por dia, pagadero al momento del retiro.',
	},
	{
		title: 'VIGESIMO',
		content:
			'Transcurridos 60 dias desde el aviso de termino sin retiro del equipo, el servicio tecnico no respondera por danos o perdidas ocasionadas por caso fortuito o fuerza mayor. El total acumulado por servicios y almacenamiento debera ser pagado al contado para proceder al retiro.',
	},
	{
		title: 'VIGESIMO PRIMERO',
		content:
			'De conformidad con el articulo 42 de la Ley N 19.496, se entenderan abandonados a favor del servicio tecnico los equipos no retirados en un plazo de un ano.',
	},
	{
		title: 'VIGESIMO SEGUNDO',
		content:
			'El cliente acepta expresamente que no existira responsabilidad por danos o perdidas derivados de caso fortuito o fuerza mayor no imputables al servicio tecnico.',
	},
] as const;

interface TerminoCondicionesContentProps {
	className?: string;
}

interface TerminoCondicionesModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAccept?: () => void;
	title?: string;
	acceptText?: string;
	closeText?: string;
	showAcceptButton?: boolean;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const TerminoCondicionesContent = ({
	className = 'space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-700 shadow-sm sm:p-6',
}: TerminoCondicionesContentProps) => {
	return (
		<div className={className}>
			<header className='space-y-3'>
				<h2 className='text-xl font-bold text-zinc-900 sm:text-2xl'>
					Terminos y Condiciones del Servicio Tecnico
				</h2>
				<p className='text-sm leading-6 text-zinc-600'>
					En Santiago de Chile, entre Comercial Tr3s Marias SPA, con domicilio en Til Til
					2640, comuna de Macul, Santiago, y el cliente identificado en la orden de
					ingreso, se acuerda el presente contrato de servicio tecnico.
				</p>
			</header>

			<div className='space-y-4'>
				{agreementClauses.map((clause) => (
					<article
						key={clause.title}
						className='rounded-xl border border-zinc-200 bg-zinc-50/70 p-4'>
						<h3 className='text-sm font-bold uppercase tracking-wide text-zinc-800'>
							{clause.title}
						</h3>
						<p className='mt-2 text-sm leading-6 text-zinc-700'>{clause.content}</p>
					</article>
				))}
			</div>
		</div>
	);
};

const TerminoCondiciones = ({
	isOpen,
	onClose,
	onAccept,
	title = 'Terminos y Condiciones',
	acceptText = 'Aceptar',
	closeText = 'Cerrar',
	showAcceptButton = true,
	size = 'xl',
}: TerminoCondicionesModalProps) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size={size}>
			<ModalHeader>
				<div className='flex items-center gap-2'>{title}</div>
			</ModalHeader>

			<ModalBody className='max-h-[60vh] overflow-y-auto'>
				<TerminoCondicionesContent className='space-y-6 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-700 shadow-none sm:p-5' />
			</ModalBody>

			<ModalFooter className='bg-zinc-200 p-8'>
				<Button variant='outline' onClick={onClose}>
					{closeText}
				</Button>
				{showAcceptButton && (
					<Button
						color='emerald'
						onClick={() => {
							onAccept?.();
							onClose();
						}}>
						{acceptText}
					</Button>
				)}
			</ModalFooter>
		</Modal>
	);
};

export default TerminoCondiciones;
