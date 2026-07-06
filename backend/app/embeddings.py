import librosa
import torch
from transformers import ClapModel, ClapProcessor

# Load the model and processor once at import time — loading is slow (~1GB download
# on first run), so we don't want to do it inside the function on every call.
processor = ClapProcessor.from_pretrained("laion/clap-htsat-unfused")
model = ClapModel.from_pretrained("laion/clap-htsat-unfused")
model.eval()


def embed_audio(file_path: str) -> list[float]:
    # Step 1: Load the audio file with librosa.
    # You want a mono (single-channel) numpy array sampled at 48000 Hz,
    # limited to the first 30 seconds.
    # Hint: librosa.load(path, sr=..., mono=..., duration=...)
    # It returns (audio_array, sample_rate).
    audio, sr = librosa.load(file_path, sr=48000, mono=True, duration=30.0)

    # Step 2: Run the audio through the CLAP processor.
    # The processor converts the raw numpy array into the tensor format the model expects.
    # Hint: processor(audio=..., sampling_rate=..., return_tensors="pt")
    # It returns a dict of tensors — call it `inputs`.
    inputs = processor(audio=audio, sampling_rate=sr, return_tensors="pt")
    
    # Step 3: Pass the tensors through the model to get the embedding.
    # Use torch.no_grad() so PyTorch doesn't waste memory tracking gradients
    # (we're not training, just running inference).
    # Hint: model.get_audio_features(**inputs) returns a tensor of shape (1, 512).
    with torch.no_grad():
        audio_features = model.get_audio_features(**inputs)

    # Step 4: Return the embedding as a plain Python list of floats.
    # Hint: tensor[0].tolist() converts the first (only) row to a list.
    return audio_features[0].tolist()