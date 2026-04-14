Your smart Hot Wheels car collection manager. With a free local AI assistant.

## Getting Started

First, setup project:

```bash
npm run setup
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## AI Assistant Local Configuration

1. Create .env.local in the project root: N8N_WEBHOOK_URL=http://localhost:5678/webhook/<your-webhook-id>

2. Download and install Ollama from ollama.com. Start the application. Pull a model to use (e.g., Llama 3 or Mistral).

```bash
ollama pull llama3
```

3. Set Up n8n with Docker. Run docker-compose in the same directory as docker-compose.yml. 

```bash
docker-compose up -d
```

4. Configure n8n to Chat with Ollama. Open n8n at http://localhost:5678. Create a new workflow.

## Creating AI Assistant workflow

Step 1 — Create a new workflow

  1. Open n8n at http://localhost:5678
  2. Click "New workflow" (top right or from the dashboard)
  3. Give it a name, e.g. Hot Wheels AI Assistant

Step 2 — Add and configure the Webhook node

  1. Click "+" to add a node, search for "Webhook"
  2. Set HTTP Method to POST
  3. Leave Path as auto-generated (e.g. hot-wheels-assitant) or set a custom one
  4. Set Response Mode to "Using 'Respond to Webhook' node" — this lets you control the response from a later node
  5. Copy the "Test URL" shown (e.g. http://localhost:5678/webhook-test/hot-wheels-assitant) — you'll use it in .env.local while developing. Switch to "Production URL" when going live.

Step 3 — Add the AI Agent

  1. Click "+" after Webhook, search for "AI Agent"
  2. In the AI Agent node settings:
    Source for Prompt (User Message): choose "Define below"
    Prompt (User Message): click the expression editor {} and enter:

    ```js
    {{ $json.body.message }}
    ```

    System Message: click the expression editor and enter:

    ```js
    You are a helpful assistant for a Hot Wheels car collection. Answer questions based on the collection data provided below.
    Collection (JSON):
    {{ JSON.stringify($json.body.collection) }}
    ```

    Include conversation history: if the field exists, you can pass (This depends on your n8n version — skip if not available.):

    ```js
    {{ $json.body.history }}
    ```

Step 4 — Add the Ollama Chat Model
  
  1. Click "+" under AI Agent for Chat Model, search for "Ollama Chat Model"
  2. Set Base URL to http://host.docker.internal:11434 (default Ollama address)
  3. Set Model to the one you have pulled, e.g. llama3.2, mistral, qwen2.5, etc.
  4. Optionally set Temperature (0.3–0.7 works well for Q&A)

Step 5 — Add the Respond to Webhook

  1. Click "+" after AI Agent, search for "Respond to Webhook"
  2. Set Respond With to "JSON"
  3. In the Response Body field, enter:

  ```js
  { "output": {{ JSON.stringify($json.output) }} }
  ```

  ▎ If $json.output is empty after testing, try $json.response or $json.text — the field name depends on your n8n + LangChain version.

Step 6 — Connect the nodes

  The final flow should look like:
  [Webhook] → [AI Agent] + [Ollama Chat Model] → [Respond to Webhook]

Step 7 — Test it

  1. Click "Execute workflow" in n8n to activate the test listener
  2. Add the test webhook URL to .env.local:
  N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/hot-wheels-assistant
  4. Restart the dev server (npm run dev) so it picks up the env variable
  5. Click "AI Assistant" in the app and send a message — n8n should show the execution in real time

Step 8 — Activate for production

  1. Click "Publish" (toggle in the top-right of the workflow editor)
  2. Switch the URL in .env.local from /webhook-test/... to /webhook/... (drop the -test)