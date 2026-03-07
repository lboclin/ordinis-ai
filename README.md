# 🤖 Ordinis AI

**Ordinis AI** é um assistente pessoal inteligente projetado para simplificar a organização de vida do usuário. Através de comandos de texto ou voz, a aplicação utiliza Inteligência Artificial para processar informações do dia a dia, categorizá-las e armazená-las automaticamente.

💡 **Sobre o Projeto:** Este projeto tem um **objetivo educacional** (desenvolvido como forma de aprendizado prático de novas tecnologias) e para **uso pessoal**. Atualmente, o Ordinis AI encontra-se em **fase de testes (MVP)** e funciona em formato de **Progressive Web App (PWA)** para facilitar o uso no celular.

---

## 🚀 Funcionalidades Principais

* **Interface Estilo ChatGPT:** UI limpa com tema escuro, campo de entrada de chat e menu lateral (Sidebar) para navegação rápida entre Dashboard, Perfil e Configurações.
* **Processamento de Linguagem Natural (NLP):** Utiliza a API da **OpenAI (GPT-4o-mini)** para interpretar a intenção do usuário, diferenciando um gasto financeiro de um agendamento de compromisso.
* **Armazenamento Seguro:** Integração com o Supabase para salvar dados de forma persistente e estruturada (PostgreSQL) com Row Level Security (RLS).
* **Dashboard e Agenda:** Visualização gráfica de despesas e calendário de compromissos para acompanhamento em tempo real.
* **Autenticação:** Sistema de login seguro e criação de contas via Supabase Auth (Email/Senha e Google).
* **Progressive Web App (PWA):** Desenvolvido para ser instalado diretamente na tela inicial do celular, oferecendo uma experiência de aplicativo nativo sem a necessidade de lojas de aplicativos.
* **Integração com Google Sheets:** *(Objetivo Futuro)* Exportação e espelhamento inteligente de dados para planilhas do Google.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| **Frontend** | React.js + Tailwind CSS (Vite) |
| **Backend** | Python (FastAPI) |
| **IA/LLM** | OpenAI GPT-4o-mini |
| **Armazenamento** | Supabase (PostgreSQL) |
| **Deploy** | Vercel (Frontend) / Render (Backend) |

---

## 🏃 Como Rodar o Projeto

Siga os passos abaixo para executar a aplicação localmente. Você precisará de dois terminais abertos.

### Pré-requisitos

1. **Node.js** (v18+) e **npm** instalados.
2. **Python** (v3.10+) instalado.
3. Conta no **Supabase** (para o banco de dados) e plataforma da **OpenAI** (para a chave da API).

### Configuração de Variáveis de Ambiente

1. **Backend (`/api`):**
* Crie um arquivo `.env` na pasta `api/` com base no `.env.example`.
* Preencha as variáveis:
```env
OPENAI_API_KEY=sua_chave_openai
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase

```




2. **Frontend (`/app`):**
* Crie um arquivo `.env` na pasta `app/` com base no `.env.example`.
* Preencha as variáveis:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
VITE_API_URL=http://localhost:10000 # Ou a URL do seu backend em produção

```





### Passo 1: Iniciar o Backend

No primeiro terminal:

```bash
cd api
pip install -r requirements.txt
python main.py

```

O servidor estará rodando em `http://localhost:10000` (ou a porta configurada).

### Passo 2: Iniciar o Frontend

No segundo terminal:

```bash
cd app
npm install
npm run dev

```

Acesse a aplicação em `http://localhost:5173`.

---

## 📂 Estrutura do Projeto

```text
ordinis-ai/
├── app/                # Frontend (React PWA)
│   ├── src/
│   │   ├── components/ # UI Components (Sidebar, Chat, Dashboard, Agenda, etc.)
│   │   └── context/    # Contexto de Autenticação e Estados Globais
├── api/                # Backend (FastAPI)
│   ├── main.py         # Entrypoint da aplicação e Rotas
│   ├── services/       # Integração com OpenAI e Supabase
│   └── requirements.txt# Dependências do Python
└── .gitignore          # Arquivos e pastas ignorados pelo Git

```
