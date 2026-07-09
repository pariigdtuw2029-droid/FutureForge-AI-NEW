import os


def get_audio_metadata(file_path: str, upload_file):

    return {

        "filename": upload_file.filename,

        "content_type": upload_file.content_type,

        "file_size_bytes": os.path.getsize(file_path),

        "format": os.path.splitext(upload_file.filename)[1].replace(".", "")

    }