import asyncio
import logging

logging.basicConfig(level=logging.INFO)

from server.replay import sync_from_bucket

sync_from_bucket()

from server.ws import main

asyncio.run(main())
