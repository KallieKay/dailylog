#The Lambda entry point
from mangum import Mangum
from app.main import app

#The lifespan ="off" avoids an asyncio edge case in Lambda, always use it.
handler = Mangum(app, lifespan="off")