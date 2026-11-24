# Auditoría del harness — {{projectName}}

**Topología:** {{topology}} ({{monorepoTool}}) · **Gestor:** {{pm}} · **Paquetes:** {{packagesSummary}}
{{unsupportedNote}}  <!-- solo si supported:false o algo no soportado: dilo y no adivines -->

Leyenda: ✅ listo · ⚠️ funciona pero mejorable · ❌ falta o roto

## 1. Sensores y scripts
| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|

## 2. Contexto (CLAUDE.md y rules)
| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|

## 3. Permisos
| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|

## 4. Hooks
| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|

## 5. Git hooks y commits
| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|

## 6. Tools
| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|

## 7. Observabilidad
| Item | Estado | Por qué importa | Arreglo |
|------|--------|-----------------|---------|

## Topología: {{topology}}
<!-- filas extra de la referencia de topología (puertos, shared de Module Federation, rules sin paths en monorepo…) -->

## Siguiente paso
<!-- capas en el orden de la receta (1→7); primero las que tienen ❌. Una línea por capa: qué generar. -->

## Hábitos de sesión (para ti, no para el agente)
- `/context` cuando la sesión vaya lenta: muestra qué ocupa el contexto (CLAUDE.md, rules, MCP, conversación).
- `/compact <qué conservar>` al terminar una subtarea y antes de empezar la siguiente.
- `/clear` al cambiar a trabajo no relacionado; antes, `/rename` para poder volver con `/resume`.
- `/mcp` para apagar servidores que esta tarea no usa.
