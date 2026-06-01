export interface ModuleItem {
  key: string
  label: string
  description: string
  defaultEnabled?: boolean
}

export interface ModuleSection {
  key: string
  title: string
  description: string
  modules: ModuleItem[]
}

/**
 * Módulos do Campus Template — versão educacional.
 * Aluno pode adicionar mais aqui e criar a página correspondente em
 * `app/(campus)/<key>/page.tsx`. O layout exibe automaticamente os 3
 * módulos abaixo na sidebar (ver app/(campus)/layout.tsx).
 */
export const MODULE_SECTIONS: ModuleSection[] = [
  {
    key: "fundamentos",
    title: "Fundamentos",
    description: "Conteúdo educacional inicial",
    modules: [
      {
        key: "comece-aqui",
        label: "Comece por aqui",
        description: "Orientação inicial do Campus Template",
        defaultEnabled: true,
      },
      {
        key: "guia-gratuito",
        label: "Guia Gratuito",
        description: "Sequência inicial de aulas",
        defaultEnabled: true,
      },
      {
        key: "newsletter",
        label: "Newsletter",
        description: "Edições anteriores da newsletter Movidos",
        defaultEnabled: true,
      },
    ],
  },
]

export const ALL_MODULE_KEYS = MODULE_SECTIONS.flatMap((s) => s.modules.map((m) => m.key))

export const DEFAULT_ENABLED_MODULES = MODULE_SECTIONS.flatMap((s) =>
  s.modules.filter((m) => m.defaultEnabled).map((m) => m.key),
)
