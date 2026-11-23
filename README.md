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

## Estructura del proyecto

```
embeddings-review/
├── .env.example          Plantilla de variables de entorno
├── .gitignore            Ignorar archivos innecesarios.
├── package.json
└── src/
    ├── index.js          Punto de entrada: abre el menú o ejecuta un comando
    ├── config.js         Lee y valida las variables de entorno
    ├── modos/
    │   ├── menu.js       Menú interactivo (modo por defecto)
    │   └── comandos.js   Modo comandos (una operación por ejecución)
    ├── servicios/
    │   ├── embeddings.js Genera los vectores con Gemini
    │   └── qdrant.js     Colección, CRUD y búsqueda por similitud en Qdrant
    └── utils/
        ├── formato.js    Tablas, recortes y parseo de metadata
        └── entrada.js    Lectura de teclado para el menú
```

- **`modos/`**: las dos formas de usar la app. Solo se encargan de la interacción con el usuario y llaman a los servicios.
- **`servicios/`**: la lógica que habla con sistemas externos. No saben nada de menús ni de comandos.
- **`utils/`**: funciones auxiliares sin dependencias de Gemini ni de Qdrant.
- **`config.js`**: único lugar donde se leen las variables de entorno.
