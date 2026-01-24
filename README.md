# 🤖 Ordinis AI

**Ordinis AI** é um assistente pessoal inteligente projetado para simplificar a organização de vida do usuário. Através de comandos de voz ou texto, a aplicação utiliza Inteligência Artificial para processar informações, categorizá-las e armazená-las automaticamente em planilhas do Google Sheets.

Este projeto é desenvolvido com foco em portfólio técnico, utilizando uma arquitetura moderna e práticas de desenvolvimento assíncrono com agentes de IA.

---

## 🚀 Funcionalidades Principais

* **Interface Estilo ChatGPT:** UI limpa com tema escuro, campo de entrada de chat e menu lateral (Sidebar) para navegação rápida entre Dashboard, Perfil e Configurações.
* **Processamento de Linguagem Natural (NLP):** Utiliza a API do Google Gemini para interpretar se uma mensagem é um gasto, um compromisso ou uma reunião.
* **Entrada de Áudio:** Suporte para gravação de voz com conversão automática para texto (*Speech-to-Text*).
* **Integração com Google Sheets:** Atua como um banco de dados dinâmico e visual, onde cada categoria de informação é organizada em colunas específicas.
* **Progressive Web App (PWA):** Desenvolvido para ser instalado no celular sem a necessidade de lojas de aplicativos (App Store/Play Store).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | React.js + Tailwind CSS (Vite) |
| **Backend** | Python (FastAPI) |
| **IA/LLM** | Google Gemini 1.5 Pro / Flash |
| **Armazenamento** | Google Sheets API (gspread) |
| **Deploy** | Vercel (Frontend) / Railway ou Render (Backend) |

---

## 📂 Estrutura do Projeto

```text
meu-assessor-ai/
├── app/                # Frontend (React PWA)
│   ├── src/
│   │   ├── components/ # UI Components (Sidebar, Chat, etc)
│   │   └── hooks/      # Lógica de integração com a API
├── api/                # Backend (FastAPI)
│   ├── main.py         # Entrypoint da aplicação
│   ├── services/       # Integração com Gemini e Sheets
│   └── models/         # Definições de dados (Pydantic)
├── docs/               # Documentação e esquemas das planilhas
└── docker-compose.yml  # Configuração para desenvolvimento local
