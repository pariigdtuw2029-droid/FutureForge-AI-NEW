import speech_recognition as sr


def convert_audio_to_text(audio_path):

    recognizer = sr.Recognizer()

    try:

        with sr.AudioFile(audio_path) as source:

            audio = recognizer.record(source)

        text = recognizer.recognize_google(audio)

        return text

    except Exception as e:

        print("Speech Recognition Error:", e)

        return "Unable to recognize speech."