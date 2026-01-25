# 🤖 Ordinis AI

**Ordinis AI** é um assistente pessoal inteligente projetado para simplificar a organização de vida do usuário. Através de comandos de voz ou texto, a aplicação utiliza Inteligência Artificial para processar informações, categorizá-las e armazená-las automaticamente em planilhas do Google Sheets e banco de dados.

Este projeto é desenvolvido com foco em portfólio técnico, utilizando uma arquitetura moderna e práticas de desenvolvimento assíncrono com agentes de IA.

---

## 🚀 Funcionalidades Principais

* **Interface Estilo ChatGPT:** UI limpa com tema escuro, campo de entrada de chat e menu lateral (Sidebar) para navegação rápida entre Dashboard, Perfil e Configurações.
* **Processamento de Linguagem Natural (NLP):** Utiliza a API do Google Gemini para interpretar se uma mensagem é um gasto, um compromisso ou uma reunião.
* **Integração com Supabase e Google Sheets:** Armazena dados de forma persistente e estruturada.
* **Dashboard e Agenda:** Visualização gráfica de despesas e calendário de compromissos.
* **Autenticação:** Login social com Google via Supabase Auth.
* **Progressive Web App (PWA):** Desenvolvido para ser instalado no celular sem a necessidade de lojas de aplicativos.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | React.js + Tailwind CSS (Vite) |
| **Backend** | Python (FastAPI) |
| **IA/LLM** | Google Gemini 2.0 Flash (via `google-genai`) |
| **Armazenamento** | Supabase (PostgreSQL) / Google Sheets |
| **Deploy** | Vercel (Frontend) / Railway ou Render (Backend) |

---

## 🏃 Como Rodar o Projeto

Siga os passos abaixo para executar a aplicação localmente. Você precisará de dois terminais abertos.

### Pré-requisitos

1.  **Node.js** (v18+) e **npm** instalados.
2.  **Python** (v3.10+) instalado.
3.  Conta no **Supabase** e **Google AI Studio** (para chave da API Gemini).

### Configuração de Variáveis de Ambiente

1.  **Backend (`/api`):**
    *   Crie um arquivo `.env` na pasta `api/` com base no `.env.example`.
    *   Preencha as variáveis:
        ```env
        GEMINI_API_KEY=sua_chave_gemini
        SUPABASE_URL=sua_url_supabase
        SUPABASE_KEY=sua_chave_service_role_ou_anon
        GOOGLE_SHEETS_CREDENTIALS=./credentials.json (opcional se usar apenas Supabase)
        SPREADSHEET_ID=seu_id_planilha (opcional)
        ```

2.  **Frontend (`/app`):**
    *   Crie um arquivo `.env` na pasta `app/` com base no `.env.example`.
    *   Preencha as variáveis:
        ```env
        VITE_SUPABASE_URL=sua_url_supabase
        VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
        ```

### Passo 1: Iniciar o Backend

No primeiro terminal:

```bash
cd api
pip install -r requirements.txt
python main.py
```
O servidor estará rodando em `http://localhost:8000`.

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
meu-assessor-ai/
├── app/                # Frontend (React PWA)
│   ├── src/
│   │   ├── components/ # UI Components (Sidebar, Chat, Dashboard, Agenda)
│   │   └── context/    # Contexto de Autenticação
├── api/                # Backend (FastAPI)
│   ├── main.py         # Entrypoint da aplicação
│   ├── services/       # Integração com Gemini, Supabase e Sheets
│   └── schema.sql      # Estrutura do Banco de Dados
├── docs/               # Documentação
└── docker-compose.yml  # Configuração para desenvolvimento local
