class ShaderEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        this.shaderCode = document.getElementById('shaderCode');
        this.errorLog = document.getElementById('errorLog');
        this.compileBtn = document.getElementById('compileBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.highlightedCode = document.getElementById('highlightedCode');
        this.formatBtn = document.getElementById('formatBtn');
        
        this.program = null;
        this.startTime = Date.now();
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        this.defaultFragmentShader = `
            precision mediump float;
            uniform float u_time;
            uniform vec2 u_resolution;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                
                float r = sin(u_time * 2.0 + uv.x * 10.0) * 0.5 + 0.5;
                float g = sin(u_time * 3.0 + uv.y * 10.0) * 0.5 + 0.5;
                float b = sin(u_time * 4.0 + (uv.x + uv.y) * 5.0) * 0.5 + 0.5;
                
                gl_FragColor = vec4(r, g, b, 1.0);
            }
        `;
        
        this.exampleShaders = {
            gradient: `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 color = vec3(uv.x, uv.y, 0.5 + 0.5 * sin(u_time));
    gl_FragColor = vec4(color, 1.0);
}`,
            circle: `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);
    float radius = 0.3 + 0.1 * sin(u_time * 2.0);
    float circle = smoothstep(radius, radius - 0.01, dist);
    
    vec3 color = vec3(circle) * vec3(1.0, 0.5, 0.8);
    gl_FragColor = vec4(color, 1.0);
}`,
            wave: `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    float wave = sin(uv.x * 10.0 + u_time * 2.0) * 0.1;
    float line = smoothstep(0.01, 0.0, abs(uv.y - 0.5 - wave));
    
    vec3 color = vec3(line) * vec3(0.2, 0.8, 1.0);
    gl_FragColor = vec4(color, 1.0);
}`,
            plasma: `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    float x = uv.x * 8.0;
    float y = uv.y * 8.0;
    float t = u_time * 0.5;
    
    float v1 = sin(x + t);
    float v2 = sin(y + t);
    float v3 = sin(x + y + t);
    float v4 = sin(sqrt(x * x + y * y) + t);
    
    float final = (v1 + v2 + v3 + v4) / 4.0;
    
    vec3 color = vec3(
        sin(final * 3.14159),
        sin(final * 3.14159 + 2.0),
        sin(final * 3.14159 + 4.0)
    ) * 0.5 + 0.5;
    
    gl_FragColor = vec4(color, 1.0);
}`
        };
        
        this.init();
    }
    
    init() {
        if (!this.gl) {
            this.showError('WebGL não é suportado pelo seu navegador!');
            return;
        }
        
        this.setupEventListeners();
        this.setupCanvas();
        this.compileShader();
        this.render();
    }
    
     setupEventListeners() {
        this.compileBtn.addEventListener('click', () => this.compileShader());
        this.resetBtn.addEventListener('click', () => this.resetShader());
        this.formatBtn.addEventListener('click', () => this.formatCode());
        
        // Auto-compile e highlight quando parar de digitar
        let timeout;
        this.shaderCode.addEventListener('input', () => {
            this.updateHighlighting();
            clearTimeout(timeout);
            timeout = setTimeout(() => this.compileShader(), 1000);
        });
        
        // Sincronizar scroll
        this.shaderCode.addEventListener('scroll', () => {
            this.highlightedCode.scrollTop = this.shaderCode.scrollTop;
            this.highlightedCode.scrollLeft = this.shaderCode.scrollLeft;
        });
        
        // Highlight inicial
        this.updateHighlighting();
        
        // Mouse tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) / rect.width;
            this.mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
        });
        
        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const shader = btn.dataset.shader;
                this.loadExample(shader);
            });
        });

        this.updateUniformList();
    }

    updateHighlighting() {
        const code = this.shaderCode.value;
        const highlighted = this.highlightGLSL(code);
        this.highlightedCode.innerHTML = highlighted;
        
    }

    highlightGLSL(code) {
        const keywords = [
            'precision', 'mediump', 'highp', 'lowp', 'void', 'main', 'return', 
            'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'discard'
        ];
        
        const types = [
            'float', 'int', 'bool', 'vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4',
            'sampler2D', 'samplerCube', 'ivec2', 'ivec3', 'ivec4', 'bvec2', 'bvec3', 'bvec4'
        ];
        
        const builtins = [
            'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'pow', 'exp', 'log', 'exp2', 'log2',
            'sqrt', 'inversesqrt', 'abs', 'sign', 'floor', 'ceil', 'fract', 'mod', 'min', 'max',
            'clamp', 'mix', 'step', 'smoothstep', 'length', 'distance', 'dot', 'cross',
            'normalize', 'reflect', 'refract', 'texture2D', 'textureCube'
        ];
        
        const uniforms = ['uniform'];
        const attributes = ['attribute', 'varying'];
        const outputs = ['gl_FragColor', 'gl_Position', 'gl_FragCoord'];
        
        let highlighted = code;
        
        // Comentários
        highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="comment">$&</span>');
        highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
        
        // Números
        highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>');
        
        // Keywords
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
        });
        
        // Types
        types.forEach(type => {
            const regex = new RegExp(`\\b${type}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="type">${type}</span>`);
        });
        
        // Builtins
        builtins.forEach(builtin => {
            const regex = new RegExp(`\\b${builtin}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="builtin">${builtin}</span>`);
        });
        
        // Uniforms
        uniforms.forEach(uniform => {
            const regex = new RegExp(`\\b${uniform}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="uniform">${uniform}</span>`);
        });
        
        // Attributes
        attributes.forEach(attr => {
            const regex = new RegExp(`\\b${attr}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="attribute">${attr}</span>`);
        });
        
        // Outputs
        outputs.forEach(output => {
            const regex = new RegExp(`\\b${output}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="function">${output}</span>`);
        });
        
        return highlighted;
    }
    
    formatCode() {
        let code = this.shaderCode.value;
        
        // Remover espaços em branco extras
        code = code.replace(/\s+/g, ' ');
        
        // Adicionar quebras de linha após {
        code = code.replace(/\{/g, '{\n');
        
        // Adicionar quebras de linha antes de }
        code = code.replace(/\}/g, '\n}');
        
        // Adicionar quebras de linha após ;
        code = code.replace(/;/g, ';\n');
        
        // Quebrar linhas longas
        const lines = code.split('\n');
        const formattedLines = [];
        let indentLevel = 0;
        
        lines.forEach(line => {
            line = line.trim();
            if (line === '') return;
            
            // Diminuir indentação para }
            if (line.includes('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Adicionar indentação
            const indent = '    '.repeat(indentLevel);
            formattedLines.push(indent + line);
            
            // Aumentar indentação para {
            if (line.includes('{')) {
                indentLevel++;
            }
        });
        
        this.shaderCode.value = formattedLines.join('\n');
        this.updateHighlighting();
        this.compileShader();
    }
    
    resetShader() {
        this.shaderCode.value = this.defaultFragmentShader;
        this.updateHighlighting();
        this.compileShader();
    }
    
    loadExample(name) {
        if (this.exampleShaders[name]) {
            this.shaderCode.value = this.exampleShaders[name];
            this.updateHighlighting();
            this.compileShader();
        }
    }
    
    setupCanvas() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Criar um quadrado menor (ajuste o tamanho aqui)
        const size = 0.8; // 0.5 = metade do canvas, 0.3 = 30% do canvas
        
        const vertices = new Float32Array([
            -size, -size,  // inferior esquerdo
            size, -size,  // inferior direito
            -size,  size,  // superior esquerdo
            size,  size   // superior direito
        ]);
        
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Erro ao compilar shader: ${info}`);
        }
        
        return shader;
    }

    updateUniformList() {
        const code = this.shaderCode.value;
        const uniformRegex = /uniform\s+\w+\s+(\w+)\s*;/g;
        let match;
        const uniforms = [];

        while ((match = uniformRegex.exec(code)) !== null) {
            uniforms.push(match[1]);
        }

        const container = document.querySelector('.shader-info ul');
        container.innerHTML = ''; // Limpa lista

        if (uniforms.length === 0) {
            container.innerHTML = '<li><em>Nenhuma uniform encontrada.</em></li>';
            return;
        }

        uniforms.forEach(name => {
            const li = document.createElement('li');
            li.innerHTML = `<code>${name}</code>`;
            container.appendChild(li);
        });
    }
    
    compileShader() {
        try {
            const fragmentSource = this.shaderCode.value;
            
            const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
            const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
            
            const program = this.gl.createProgram();
            this.gl.attachShader(program, vertexShader);
            this.gl.attachShader(program, fragmentShader);
            this.gl.linkProgram(program);
            
            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                const info = this.gl.getProgramInfoLog(program);
                throw new Error(`Erro ao linkar programa: ${info}`);
            }
            
            // Delete old program
            if (this.program) {
                this.gl.deleteProgram(this.program);
            }
            
            this.program = program;
            
            // Get uniform locations
            this.uniforms = {
                u_time: this.gl.getUniformLocation(program, 'u_time'),
                u_resolution: this.gl.getUniformLocation(program, 'u_resolution'),
                u_mouse: this.gl.getUniformLocation(program, 'u_mouse')
            };
            
            // Get attribute location
            this.attributes = {
                a_position: this.gl.getAttribLocation(program, 'a_position')
            };
            
            this.showSuccess('Shader compilado com sucesso!');
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    render() {
        if (!this.program) {
            requestAnimationFrame(() => this.render());
            return;
        }
        
        const currentTime = (Date.now() - this.startTime) / 1000;
        
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.gl.useProgram(this.program);
        
        // Set uniforms
        if (this.uniforms.u_time) {
            this.gl.uniform1f(this.uniforms.u_time, currentTime);
        }
        
        if (this.uniforms.u_resolution) {
            this.gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
        }
        
        if (this.uniforms.u_mouse) {
            this.gl.uniform2f(this.uniforms.u_mouse, this.mouseX, this.mouseY);
        }
        
        // Set attributes
        if (this.attributes.a_position >= 0) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.enableVertexAttribArray(this.attributes.a_position);
            this.gl.vertexAttribPointer(this.attributes.a_position, 2, this.gl.FLOAT, false, 0, 0);
        }
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(() => this.render());
    }
    
    showError(message) {
        this.errorLog.textContent = message;
        this.errorLog.className = 'error';
    }
    
    showSuccess(message) {
        
        this.errorLog.textContent = message;
        this.errorLog.className = 'success';
        setTimeout(() => {
            this.errorLog.style.display = 'none';
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShaderEditor();
});