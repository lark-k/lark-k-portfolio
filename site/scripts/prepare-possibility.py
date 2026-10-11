"""Preserve native framing and frame rate, with short GOPs for wheel scrubbing."""
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets/possibility/videos/transition-original.mp4"
PUBLIC = ROOT / "site/public/assets"

for kind in ("images", "videos"):
    (PUBLIC / kind).mkdir(parents=True, exist_ok=True)

def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)

browser_clip = PUBLIC / "videos/preview-to-possibility.mp4"
ffmpeg("-i", SOURCE, "-map", "0:v:0", "-c:v", "libx264", "-preset", "fast", "-crf", "16",
       "-g", "6", "-keyint_min", "6", "-sc_threshold", "0", "-an", "-movflags", "+faststart", browser_clip)
ffmpeg("-i", browser_clip, "-frames:v", "1", "-update", "1", PUBLIC / "images/possibility-start.png")
ffmpeg("-sseof", "-0.10", "-i", browser_clip, "-vf", "reverse", "-frames:v", "1", "-update", "1",
       PUBLIC / "images/possibility-end.png")
archive = ROOT / "assets/possibility/images"
archive.mkdir(parents=True, exist_ok=True)
shutil.copy2(PUBLIC / "images/possibility-end.png", archive / "possibility-end.png")
shutil.copy2(archive / "endframe-reference.png", PUBLIC / "images/possibility-backdrop.png")
print("Ending video prepared at native resolution/frame rate; first and last frames extracted.")
