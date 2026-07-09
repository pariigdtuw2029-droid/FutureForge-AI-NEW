from pydub import AudioSegment
import os


def convert_to_wav(input_file: str):

    output_file = os.path.splitext(input_file)[0] + ".wav"

    audio = AudioSegment.from_file(input_file)

    audio.export(
        output_file,
        format="wav"
    )

    return output_file