# Acessos — Demo Media+

URL: http://localhost:3000/login

## Administrador

| E-mail | Senha |
|---|---|
| admin@mediamais.com | mediamais2026 |

## Estabelecimentos (Pontos de Mídia) — senha: `ponto123`

| Estabelecimento | E-mail | Código TV | Status |
|---|---|---|---|
| Academia Iron Fitness | academia@exemplo.com | 100001 | Ativo |
| Restaurante Villa Gourmet | restaurante@exemplo.com | 100002 | Ativo |
| Clínica OdontoCenter Premium | clinica@exemplo.com | 100003 | Ativo |
| Barbearia Don Corleone | barbearia@exemplo.com | 100004 | Ativo |
| Café & Bistrô Aroma | cafe@exemplo.com | 100005 | Pendente |
| Pet Shop & Vet Amigo Fiel | petshop@exemplo.com | 100006 | Ativo |
| Pousada Mar Azul | pousada@exemplo.com | 100007 | Ativo |
| Hub Coworking Ilha | coworking@exemplo.com | 100008 | Ativo |
| Padaria Pão Dourado | padaria@exemplo.com | 100009 | Ativo |
| Supermercado Bom Preço | mercado@exemplo.com | 100010 | Ativo |
| Studio Bella Estética | estetica@exemplo.com | 100011 | Ativo |
| Lava-Jato Brilho Total | lavajato@exemplo.com | 100012 | Inativo (login bloqueado) |
| Colégio e Cursos Saber | escola@exemplo.com | 100013 | Pendente |

## Anunciantes — senha: `anunciante123`

| Empresa | E-mail |
|---|---|
| MegaNutri Suplementos | suplementos@exemplo.com |
| AutoPrime Veículos | concessionaria@exemplo.com |
| Drogaria Bem Estar | farmacia@exemplo.com |
| Studio Vida Ativa | novamarca@exemplo.com |
| Pizzaria Forno di Napoli | pizzaria@exemplo.com |
| Burger House 48 | hamburgueria@exemplo.com |
| Ilha Prime Imóveis | imobiliaria@exemplo.com |
| Ótica Visão Clara | otica@exemplo.com |
| CodeLab Cursos de Tecnologia | cursos@exemplo.com |
| Credilha Cooperativa | cooperativa@exemplo.com |

## Player da TV

http://localhost:3000/player → digite o código da TV (ex.: `100001`)

## Recriar os dados

```bash
npm run db:seed      # apaga e recria todo o banco de demonstração
npm run demo:midia   # (opcional) regera fotos/vídeos em public/uploads/demo
```
