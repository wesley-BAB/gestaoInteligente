# WES - Gestão Inteligente

O **WES** é uma aplicação web moderna e responsiva desenvolvida para a gestão de contratos, serviços avulsos, agendamentos e controle financeiro. O sistema foca em uma interface limpa, minimalista (com identidade visual em tons de verde) e alta usabilidade.

## 🚀 Funcionalidades Principais

### 1. Painel de Controle (Dashboard)
*   **Resumo Geral:** Visualização rápida da quantidade de contratos ativos e receita mensal estimada.
*   **Próximos Agendamentos:** Lista dos próximos 10 compromissos.
*   **Checklist:** Funcionalidade de marcar agendamentos como "Concluídos" ou "Pendentes" diretamente na tela inicial.

### 2. Gestão de Contratos e Serviços
*   **Dois Modos de Registro:**
    *   **Recorrente:** Contratos mensais ou anuais com cálculo automático de parcelas.
    *   **Avulso:** Serviços pontuais com data única.
*   **Edição Completa:** Permite alterar dados de contratos existentes.
*   **Filtros:** Busca por nome do cliente, serviço e filtro por categoria (Todos, Recorrentes, Avulsos).

### 3. Gestão Financeira (Baixa de Parcelas)
*   **Geração Automática:** O sistema projeta as parcelas futuras baseadas nas regras do contrato (dia de vencimento, periodicidade).
*   **Baixa de Pagamento:** Controle de status "Pendente" vs "Pago" com registro da data de pagamento.

### 4. Calendário e Agendamentos
*   **Calendário Visual:** Visualização mensal dos agendamentos de um contrato específico.
*   **CRUD de Agendamentos:** Criação, edição e exclusão de notas/agendamentos em datas específicas.
*   **Status:** Marcar agendamentos como realizados diretamente no calendário.

### 5. Provisão de Receita
*   **Filtro por Período:** Seleção de data inicial e final para projetar o fluxo de caixa.
*   **Cálculo Inteligente:** Soma contratos recorrentes e serviços avulsos que caem dentro do período selecionado.
*   **Relatório Detalhado:** Tabela discriminando cliente, serviço, tipo e valor de cada entrada prevista.

### 6. Cadastros Auxiliares
*   **Clientes:** Cadastro completo com Nome, Email e Telefone.
*   **Tipos de Serviço:** Categorização dos serviços prestados (ex: Consultoria, Desenvolvimento).
*   **Usuários:** Controle de acesso com criptografia de senha (SHA-256).

---

## 🛠 Tecnologias e Bibliotecas

O projeto foi construído utilizando uma stack moderna focada em performance e simplicidade:

### Frontend
*   **[React](https://react.dev/) (v19):** Biblioteca principal para construção da interface.
*   **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática para maior segurança e manutenibilidade do código.
*   **[Tailwind CSS](https://tailwindcss.com/):** Framework de estilização utilitária para design responsivo e customização do tema (Paleta Primary Green).

### Backend / Banco de Dados
*   **[Supabase](https://supabase.com/):** Utilizado como Backend-as-a-Service (BaaS).
    *   Banco de dados PostgreSQL.
    *   Integração via `@supabase/supabase-js`.

### Bibliotecas Auxiliares
*   **[Lucide React](https://lucide.dev/):** Conjunto de ícones leves e consistentes (ex: `FileSignature`, `DollarSign`, `Calendar`).
*   **[date-fns](https://date-fns.org/):** Manipulação robusta de datas (formatação, cálculos de intervalos, adição de meses/anos).
*   **Web Crypto API:** Utilizada nativamente para hashing de senhas (SHA-256) no front-end antes do envio ao banco.

---

## 🗄 Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas no Supabase:

1.  **`tb_usuarios`**: Armazena credenciais (username e hash da senha).
2.  **`tb_clientes`**: Dados cadastrais dos clientes vinculados ao usuário.
3.  **`tb_tipos_servico`**: Lista de categorias de serviços.
4.  **`tb_contratos`**: Tabela central que armazena contratos recorrentes e serviços avulsos.
5.  **`tb_agendamentos`**: Compromissos e observações vinculados a um contrato.
6.  **`tb_financeiro`**: Registro de parcelas e status de pagamento (baixa).

---

## 📱 Layout e Design

*   **Responsividade:** O sistema adapta-se perfeitamente a dispositivos móveis e desktops.
*   **Sidebar Inteligente:** Menu lateral que pode ser fixado ou recolhido (apenas ícones), otimizando o espaço de tela.
*   **Largura Otimizada:** Telas configuradas para utilizar 90% da largura disponível para melhor visualização de dados.
*   **Botões Flutuantes (FAB):** Acesso rápido para criação de registros em todas as telas principais.
*   **Feedback Visual:** Sistema de "Toasts" (notificações) para feedback de sucesso, erro ou informações.

---

## 🔒 Segurança

*   **Isolamento de Dados:** Todos os registros (clientes, contratos, receitas) são vinculados ao `id` do usuário logado.
*   **Hashing:** As senhas não são salvas em texto plano; são convertidas em hash SHA-256 antes de serem comparadas ou salvas.
