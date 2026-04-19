"""Set up a smolagents CodeAgent backed by Hugging Face's Inference API.

This module wires up a ``CodeAgent`` powered by ``InferenceClientModel`` and
exposes :func:`build_agent` so other code (or the ``__main__`` block below) can
instantiate and run the agent.

The Hugging Face token is read from the ``HUGGINGFACE_API_TOKEN`` environment
variable; it is never hard-coded. See ``AGENTS.md`` for setup instructions.
"""

from __future__ import annotations

import os
from typing import Optional

from smolagents import CodeAgent, DuckDuckGoSearchTool, InferenceClientModel


# Default model. Override with the ``SMOLAGENTS_MODEL_ID`` environment
# variable if you want to point the agent at a different Hugging Face model.
DEFAULT_MODEL_ID = "Qwen/Qwen2.5-Coder-32B-Instruct"


def build_agent(model_id: Optional[str] = None) -> CodeAgent:
    """Create a ``CodeAgent`` with the DuckDuckGo search tool enabled.

    Parameters
    ----------
    model_id:
        Optional Hugging Face model id. Falls back to the
        ``SMOLAGENTS_MODEL_ID`` environment variable, then
        :data:`DEFAULT_MODEL_ID`.

    Returns
    -------
    CodeAgent
        A ready-to-run smolagents ``CodeAgent``.

    Raises
    ------
    EnvironmentError
        If ``HUGGINGFACE_API_TOKEN`` is not set in the environment.
    """

    token = os.environ.get("HUGGINGFACE_API_TOKEN")
    if not token:
        raise EnvironmentError(
            "HUGGINGFACE_API_TOKEN is not set. Add it to your environment "
            "(see .env.example) before running the agent."
        )

    resolved_model_id = (
        model_id
        or os.environ.get("SMOLAGENTS_MODEL_ID")
        or DEFAULT_MODEL_ID
    )

    model = InferenceClientModel(model_id=resolved_model_id, token=token)

    return CodeAgent(
        tools=[DuckDuckGoSearchTool()],
        model=model,
    )


def main() -> None:
    """Run the agent against a sample query and print the result."""

    query = (
        "How many seconds would it take for a leopard at full speed to run "
        "through Pont des Arts?"
    )

    agent = build_agent()
    result = agent.run(query)
    print(result)


if __name__ == "__main__":
    main()
