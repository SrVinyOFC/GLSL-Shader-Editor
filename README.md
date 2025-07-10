# 🎨 HLSL Shader Editor Interativo

Um editor de fragment shaders (GLSL) simples e poderoso, construído com HTML, CSS e JavaScript puro, que roda diretamente no seu navegador. Permite escrever e testar shaders em tempo real, com syntax highlighting, compilação automática e uma janela de preview instantânea.

![Placeholder para Screenshot](https://via.placeholder.com/800x400.png?text=Adicione+um+screenshot+do+seu+editor+aqui!)
*(Substitua a imagem acima por um screenshot do seu projeto em ação)*

---

## ✨ Funcionalidades

- **Editor de Código com Syntax Highlighting:** Um editor de texto que colore palavras-chave, tipos, funções e comentários de GLSL para melhor legibilidade.
- **Preview em Tempo Real:** Veja o resultado do seu shader renderizado instantaneamente em um canvas WebGL.
- **Compilação Automática:** O shader é recompilado automaticamente enquanto você digita, mostrando erros de compilação em tempo real.
- **Uniforms Disponíveis:** Acesso a `uniforms` úteis para criar animações dinâmicas:
  - `u_time`: Tempo decorrido em segundos.
  - `u_resolution`: A resolução (largura e altura) do canvas.
  - `u_mouse`: A posição do mouse (coordenadas normalizadas de 0.0 a 1.0).
- **Exemplos Prontos:** Carregue shaders de exemplo (Gradiente, Círculo, Ondas, Plasma) para começar a explorar.
- **Formatação de Código:** Um botão para formatar e indentar seu código automaticamente.
- **Design Responsivo:** Interface que se adapta a diferentes tamanhos de tela.

---

## 🚀 Como Usar

É muito simples! Como este é um projeto puramente front-end, você não precisa de um servidor ou de qualquer processo de build.

1.  **Clone este repositório** (ou simplesmente baixe os arquivos).
2.  **Abra o arquivo `inde.html`** no seu navegador de preferência (Google Chrome, Firefox, etc.).
3.  **Comece a programar!** Edite o código no painel esquerdo e veja a mágica acontecer no painel direito.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura da página.
- **CSS3:** Estilização, layout (Grid) e design responsivo.
- **JavaScript (ES6+):** Lógica do editor, compilação de shaders, renderização com WebGL e interatividade.
- **WebGL:** API utilizada para renderizar os gráficos 2D/3D baseados nos shaders.

---
