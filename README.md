# TapCash

Aplicação full stack de controle financeiro pessoal, desenvolvida para portfólio profissional. Permite gerenciar cartões, despesas parceladas e recorrentes, visualizar projeções financeiras e receber sugestões inteligentes de quitação.

## Descrição

O **TapCash** é uma solução completa para organização financeira pessoal. Com autenticação segura, cada usuário gerencia exclusivamente seus próprios dados — cartões, despesas e perfil financeiro — com dashboards visuais, projeção dos próximos 12 meses e recomendações de priorização de quitação.

## Tecnologias

### Frontend
- React 19 + Vite
- Tailwind CSS 4
- React Router 7
- Axios
- React Hook Form + Zod
- Zustand (estado global / autenticação)
- React Hot Toast
- Lucide React (ícones)

### Backend
- FastAPI
- SQLAlchemy 2
- Alembic (migrations)
- Pydantic v2
- JWT (python-jose)
- Bcrypt (passlib)
- PostgreSQL

## Funcionalidades

- **Autenticação**: cadastro, login, logout, JWT, rotas protegidas
- **Dashboard**: resumo financeiro com cards e próximas contas
- **Cartões**: CRUD completo de cartões de crédito
- **Despesas**: cadastro pontual/recorrente com cálculo automático de parcelas
- **Listagem**: filtros por cartão, status, tipo e busca por nome
- **Projeção**: visão dos próximos 12 meses com saldo estimado
- **Sugestões**: priorização de quitação por critérios inteligentes
- **Perfil**: configuração de salário mensal

## Objetivo do projeto

Este projeto foi desenvolvido como peça de portfólio para demonstrar competências em:

- Arquitetura full stack moderna e organizada
- Autenticação JWT com proteção de rotas
- CRUD completo com validação em ambas as camadas
- Lógica de negócio financeira (parcelas, projeções, sugestões)
- Containerização com Docker
- UI responsiva e profissional com Tailwind CSS

## Licença

MIT
