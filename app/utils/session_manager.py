import uuid

current_session = None


def create_session():

    global current_session

    current_session = str(uuid.uuid4())[:8]

    return current_session


def get_session():

    return current_session