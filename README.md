# embeddings-review

CRUD de embeddings: los textos se vectorizan con Gemini y se guardan en Qdrant. Las consultas por similitud se hacen desde la terminal.

## Requisitos

- Node.js >= 20.6 (ES modules, `--env-file`)
- Una instancia de Qdrant y una API key de Gemini

## Configuración

```bash
npm install
cp .env.example .env   # completa tus valores
```

| Variable | Descripción |
| --- | --- |
| `QDRANT_END_POINT` | URL de Qdrant |
| `QDRANT_API_KEY` | API key de Qdrant (nube) |
| `QDRANT_COLLECTION` | Nombre de la colección (default `embeddings`) |
| `GEMINI_API_KEY` | API key de Gemini |
| `EMBEDDING_MODEL` | Modelo (default `gemini-embedding-001`) |
| `EMBEDDING_DIM` | Dimensión del vector (default `768`) |

## Uso

### Menú interactivo (por defecto)

```bash
npm start
```

Se conecta a Qdrant y prepara la colección una sola vez; luego un menú numerado permite crear, buscar por similitud, ver el embedding de una palabra/frase, consultar por id, listar, actualizar y eliminar registros.

### Modo comandos

```bash
npm start -- init
npm start -- create "Node.js es un entorno de ejecución para JavaScript" --meta '{"tema":"js"}'
npm start -- list
npm start -- get <id>
npm start -- update <id> --text "nuevo texto"
npm start -- update <id> --meta '{"tema":"backend"}'
npm start -- search "runtime de JavaScript" --limit 3
npm start -- delete <id>
npm start -- help
```
