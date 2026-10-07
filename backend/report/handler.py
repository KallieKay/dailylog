from app import run


def handler(event, context):
    run()
    return {"status": "ok"}