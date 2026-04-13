const LoadingScreen = ({ message = 'Cargando...' }: { message?: string }) => (
	<div className='flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900'>
		<div className='flex flex-col items-center gap-4'>
			{/* Spinner */}
			<div className='relative h-16 w-16'>
				<div className='absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-700' />
				<div className='absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin' />
			</div>

			{/* Message */}
			<p className='animate-pulse text-sm text-zinc-600 dark:text-zinc-400'>{message}</p>
		</div>
	</div>
);

export default LoadingScreen;
