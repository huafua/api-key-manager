import os

from google.adk.agents import Agent
from google.adk.models import LiteLlm
from dotenv import load_dotenv

load_dotenv()


root_agent = Agent(
    model=LiteLlm(
        # model='openai/glm4:9b',
        model='openai/gemma4:e2b',
        api_key=os.getenv('OPENAI_API_KEY'),
        api_base=os.getenv('OPENAI_API_BASE'),
    ),
    name='root_agent',
    instruction='Answer user questions to the best of your knowledge, you must always answer in Tranditional Chinese',
    description='A helpful assistant for user questions.',
)
