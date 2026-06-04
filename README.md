# Nexora Food

MVP do cardapio digital multiempresa da Nexora.

Rotas:

- `/cardapio/savore`: cardapio publico
- `/admin`: painel simples

Antes de publicar, execute `sql/001_setup.sql` no Postgres.

Operacao:

- Antes de rodar SQL novo, faca backup do banco.
- Siga a rotina em `sql/README.md`.
- Depois de mergear um PR, rode o SQL necessario e faca deploy no EasyPanel.
- A raiz do sistema (`/`) abre o painel. Cada catalogo publico usa `/cardapio/slug-da-empresa`.
