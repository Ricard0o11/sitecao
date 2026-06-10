# 🐶 Loja do Brinquedo Cão — SNORA

Site de venda de brinquedos para cães (projeto académico).

## Como abrir
Faz duplo clique em `index.html` — abre no browser, sem instalar nada.
**Importante:** mantém a pasta completa (o `index.html` precisa das pastas `assets/`, `css/` e `js/`).

## Estrutura
- `index.html` — estrutura da página
- `css/style.css` — estilos e animações
- `js/script.js` — carrinho, animações de scroll e modo de edição
- `assets/` — imagens e vídeo

## Produtos
Os cards de produto são gerados a partir da lista `PRODUTOS` no início de
`js/script.js`. Neste momento há um único brinquedo (o **Dogger**), com três
tamanhos (Pequeno, Médio e Grande) que ficam registados no carrinho.

Para adicionar um brinquedo novo, acrescenta um objeto à lista:

```js
{
  id: 'corda',                       // identificador único, sem espaços
  nome: 'Corda Reforçada',
  descricao: 'Fibras naturais de alta densidade para jogos de tração.',
  img: 'assets/corda.jpg',           // coloca a imagem na pasta assets/
  tamanhos: ['Pequeno', 'Grande'],   // ou [] se não tiver tamanhos
  destaque: false                    // true realça o card a azul
}
```

A grelha ajusta-se sozinha ao número de produtos (até 3 por linha).

## Modo de edição
Clica no botão **✏️ Editar site** (canto inferior direito) para alterar textos
e substituir imagens. **Guardar** mantém as alterações no teu navegador;
**Repor original** desfaz tudo.
