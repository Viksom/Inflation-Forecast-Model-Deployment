# Projeto de Previsão de Inflação - Portugal

Este repositório contém a aplicação web completa para a plataforma de previsão de inflação em Portugal.

## Estrutura do Projeto

```
/
├── frontend/                    # Aplicação Next.js completa
│   ├── src/                     # Código fonte
│   ├── package.json             # Dependências e scripts
│   ├── next.config.mjs          # Configuração Next.js
│   ├── tailwind.config.ts       # Configuração Tailwind CSS
│   └── tsconfig.json            # Configuração TypeScript
└── frontend_prompt_claude.txt   # Prompt original para desenvolvimento
```

## Como executar

1. Navegue para a pasta frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra http://localhost:3000 no navegador

## Funcionalidades

- **Dashboard**: Visão geral da inflação com gráficos e KPIs
- **Models**: Comparação de desempenho entre diferentes modelos de ML
- **Scenario Analysis**: Análise de cenários macroeconômicos
- **Variables**: Importância das variáveis macroeconômicas

## Tecnologias

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Zustand