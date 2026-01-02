# Function Plotter

[![Tests](https://github.com/smartschat/plotter/actions/workflows/test.yml/badge.svg)](https://github.com/smartschat/plotter/actions/workflows/test.yml)
[![Lint](https://github.com/smartschat/plotter/actions/workflows/lint.yml/badge.svg)](https://github.com/smartschat/plotter/actions/workflows/lint.yml)

A web application for creating mathematical function graphs, designed for teachers creating worksheets.

## Features

- **Multiple input modes**
  - Standard syntax: `x^2 + sin(x)`, `sqrt(x)`
  - LaTeX syntax: `\frac{x^2}{2}`, `\sqrt{x}`, `\sin(x)`
  - Parametric curves: `x(t) = cos(t)`, `y(t) = sin(t)`

- **Plot up to 6 functions** with different colors

- **Customizable axes**
  - Adjustable x/y ranges
  - Pi scale option for trigonometric functions (displays -2π, -π, 0, π, 2π)
  - Grid toggle

- **Export options**
  - PNG (high resolution for printing)
  - SVG (vector format, scalable)

## Usage

1. Open `index.html` in a browser, or start a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Then visit http://localhost:8000

2. Enter a function (e.g., `sin(x)`, `x^2 - 4`)

3. Adjust settings as needed

4. Click **Plot**

5. Click **Export PNG** or **Export SVG** to download

## Examples

| Input | Description |
|-------|-------------|
| `x^2` | Parabola |
| `sin(x)` | Sine wave (enable π scale) |
| `1/x` | Hyperbola |
| `abs(x)` | Absolute value |
| `sqrt(x)` | Square root |
| `exp(-x^2)` | Gaussian curve |

### Parametric Examples

| x(t) | y(t) | Result |
|------|------|--------|
| `cos(t)` | `sin(t)` | Circle |
| `cos(3*t)` | `sin(2*t)` | Lissajous curve |
| `t*cos(t)` | `t*sin(t)` | Spiral |

## Supported Functions

`sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `sqrt`, `abs`, `log` (natural), `log10`, `exp`, `floor`, `ceil`, `sign`, `round`

### LaTeX Logarithms

In LaTeX mode, `\log` maps to the natural logarithm (consistent with `\ln` and math.js). For arbitrary bases, use `\log_{b}{x}`:

| LaTeX | Result |
|-------|--------|
| `\ln(x)` | Natural log |
| `\log(x)` | Natural log |
| `\log_{2}{x}` | Log base 2 |
| `\log_{10}{x}` | Log base 10 |

## Dependencies

All loaded via CDN (no installation required):

- [Plotly.js](https://plotly.com/javascript/) - Graphing
- [math.js](https://mathjs.org/) - Expression parsing
- [KaTeX](https://katex.org/) - LaTeX rendering

## Development

```bash
npm install              # Install dev dependencies
npm test                 # Run browser tests (Playwright)
npm run lint             # Run ESLint
```

## License

MIT
