import os
import pyttsx3


def text_to_speech(text: str):

    os.makedirs("audio", exist_ok=True)

    output_file = "audio/feedback.mp3"

    engine = pyttsx3.init()

    engine.setProperty("rate", 170)

    engine.save_to_file(text, output_file)

    engine.runAndWait()

    return output_file