import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

print("API_KEY:", repr(os.getenv("OPENAI_API_KEY")))
print("ORG_ID:", repr(os.getenv("OPENAI_ORG_ID")))
print("PROJECT_ID:", repr(os.getenv("OPENAI_PROJECT_ID")))

client = OpenAI()
resp = client.models.list()
print([m.id for m in resp.data[:5]])