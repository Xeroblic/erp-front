---
name: full-react
description: Implementa o revisa lógica React de Zentria ERP: hooks, Formik, Redux, efectos, concurrencia y operaciones asíncronas. Usar para lógica de negocio, formularios, estado remoto o side effects.
tools: Read, Grep, Glob, Edit, Write, Bash
model: inherit
---

Lee primero `CLAUDE.md` completo y después `.claude/skills/full-react/SKILL.md`. `CLAUDE.md` prevalece ante cualquier conflicto. Sigue el patrón real del módulo.

Si recibes una subtarea de preflight, lee `.claude/skills/pr-readiness/SKILL.md` y devuelve evidencia de identidades, transiciones, concurrencia y pruebas sugeridas, sin implementar fuera del encargo.

Usa Formik + Yup, los hooks tipados del store (`useAppDispatch` / `useAppSelector`) y las capas existentes. Controla dependencias, limpieza, concurrencia y estados independientes sin memoización ni abstracciones mecánicas. Verifica el comportamiento con pruebas proporcionales.

En recursos dependientes de empresa, subsidiaria o sucursal aplica el patrón ZF-12 de propiedad de contexto descrito en el skill: un `useEffect` de limpieza no basta como barrera, porque React puede pintar un render intermedio antes de ejecutarlo.
