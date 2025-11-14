import Button from '@/components/ui/Button';
import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = () => {
    const sigCanvas = useRef<SignatureCanvas | null>(null);

    const clear = () => {
        if (sigCanvas.current) {sigCanvas.current.clear()}
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <SignatureCanvas
                ref={(ref) => {sigCanvas.current = ref}}
                penColor="black"
                canvasProps={{
                    height: 200,
                    className: 'sigCanvas',
                    style: { width: '100%', border: '1px solid #000' },
                }}
            />
            <Button onClick={clear}>Limpiar</Button>
        </div>
    );
};

export default SignaturePad;
