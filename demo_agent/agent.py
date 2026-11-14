import os

from google.adk.agents import Agent
from google.adk.models import LiteLlm
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

os.environ["LITELLM_LOCAL_MODEL_COST_MAP"]="True"


root_agent = Agent(
    name='root_agent',
    model=LiteLlm(
        model='openai/llava:7b',
        # api_key="sk-2yhksq5o3yt0tpmh0d58dzi2lu9xeb8b",
        api_key="sk-c5rr8zgckd6a66gs2okr5biy2j70srbz",
        api_base="http://localhost:81/llm/"
    ),
    instruction='Answer user questions to the best of your knowledge',
    description='A helpful assistant for user questions.',
)

async def main():
    USER_ID = "user_123"
    APP_NAME = "demo_app"
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID
    )
    runner = Runner(
        app_name=APP_NAME,
        agent=root_agent,
        session_service=session_service        
    )

    events = runner.run_async(
        user_id=session.user_id,
        session_id=session.id,
        new_message=types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="What's eight plus eleven?")
            ]
        )
    )

    async for event in events:
        if event.content and event.content.parts and len(event.content.parts) > 0:
            for part in event.content.parts:
                if part.thought: continue
                print(f"\x1b[32m[{event.author}]:{part.text}\x1b[0m")


if __name__=="__main__":
    import asyncio
    asyncio.run(main())