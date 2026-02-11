import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import tokenManager from '../tokenManager';

// Helper to create a fake JWT
const createFakeJwt = (payload: object) => {
    // Codificación básica en base64 para simular un JWT
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = 'fakeSignature';
    return `${header}.${body}.${signature}`;
};

describe('tokenManager', () => {
    beforeEach(() => {
        tokenManager.clearTokens();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should set and get access token', () => {
        const token = 'test-token';
        tokenManager.setAccessToken(token);
        expect(tokenManager.getAccessToken()).toBe(token);
    });

    it('should clear tokens', () => {
        tokenManager.setAccessToken('test-token');
        tokenManager.clearTokens();
        expect(tokenManager.getAccessToken()).toBeNull();
    });

    describe('isTokenValid', () => {
        it('should return true if token is not expired', () => {
            const now = Math.floor(Date.now() / 1000);
            const token = createFakeJwt({ exp: now + 3600 }); // Expira en 1 hora (Futuro)
            tokenManager.setAccessToken(token);
            expect(tokenManager.isTokenValid(token)).toBe(true);
        });

        it('should return false if token is expired', () => {
            const now = Math.floor(Date.now() / 1000);
            const token = createFakeJwt({ exp: now - 3600 }); // Expiró hace 1 hora (Pasado)
            // Probamos pasando el token como argumento directo
            expect(tokenManager.isTokenValid(token)).toBe(false);
        });

        it('should return false if token format is invalid', () => {
            expect(tokenManager.isTokenValid('invalid.token')).toBe(false);
        });
    });

    describe('canRefresh', () => {
        it('should return true if within refresh window', () => {
            const now = Math.floor(Date.now() / 1000);
            // iat fue hace 1 hora (dentro de los 7 días permitidos)
            const token = createFakeJwt({ iat: now - 3600 }); 
            expect(tokenManager.canRefresh(token)).toBe(true);
        });

        it('should return false if outside refresh window', () => {
            const now = Math.floor(Date.now() / 1000);

            // IMPORTANTE: Tu configuración real permite 7 días de refresh.
            // 7 días = 7 * 24 * 60 * 60 = 604,800 segundos.
            // Para probar el fallo, usamos un token de 8 DÍAS de antigüedad.
            
            const EIGHT_DAYS_IN_SECONDS = 8 * 24 * 60 * 60; // 691,200 segundos
            
            const token = createFakeJwt({ iat: now - EIGHT_DAYS_IN_SECONDS });
            
            expect(tokenManager.canRefresh(token)).toBe(false);
        });
    });
});