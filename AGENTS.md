# Agents

This repository ships with a [smolagents](https://huggingface.co/docs/smolagents/index)
based `CodeAgent` that can answer questions by writing Python and using the
DuckDuckGo search tool. The agent code lives in
[`agents/agent_setup.py`](agents/agent_setup.py).

## Prerequisites

- Python 3.10 or newer
- A Hugging Face account and access token
  ([create one here](https://huggingface.co/settings/tokens))

## Install dependencies

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate    # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

`requirements.txt` installs `smolagents[toolkit]`, which includes the default
toolkit (e.g. `DuckDuckGoSearchTool`) used by the agent.

## Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variable for the agent:

| Variable | Description |
| --- | --- |
| `HUGGINGFACE_API_TOKEN` | Hugging Face access token used by `InferenceClientModel`. |

Optional:

| Variable | Description |
| --- | --- |
| `SMOLAGENTS_MODEL_ID` | Override the default Hugging Face model id (defaults to `Qwen/Qwen2.5-Coder-32B-Instruct`). |

The token and model id are read from the environment via `os.environ` in
`agents/agent_setup.py` — they are **never** hard-coded. Make sure your `.env`
file is not committed (it is already covered by `.gitignore`).

## Run the example

Export the variables (or `source` your `.env`) and run the module directly:

```bash
export HUGGINGFACE_API_TOKEN="hf_xxx"
python -m agents.agent_setup
```

This builds a `CodeAgent` with the `DuckDuckGoSearchTool` enabled and runs a
sample query. You can also import `build_agent` from your own code:

```python
from agents.agent_setup import build_agent

agent = build_agent()
print(agent.run("What is the current weather in Paris?"))
```

See the [smolagents documentation](https://huggingface.co/docs/smolagents/index)
for the full list of available tools, models, and configuration options.
