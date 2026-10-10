"""Extract lossless hero frames with the same HD color conversion as browser video."""
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'site/public/assets'
SOURCE = ROOT / 'assets/home/videos/home-loop.mp4'
# The source has no color tags. Browser HD video uses BT.709; swscale's default
# matrix and fast chroma conversion otherwise produce darker, less accurate RGB.
COLOR = 'scale=in_color_matrix=bt709:flags=accurate_rnd+full_chroma_int'
SEGMENTS = {'up': (0, 1.12), 'down': (2.5, 3.6), 'left': (5.5, 6.75), 'right': (8.5, 9.5)}

with tempfile.TemporaryDirectory(prefix='lark-hero-') as staging:
    staging = Path(staging)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(SOURCE), '-vf', COLOR,
                    '-frames:v', '1', str(staging / 'hero-poster.png')], check=True)
    for direction, (start, stop) in SEGMENTS.items():
        destination = staging / direction
        destination.mkdir()
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-i', str(SOURCE),
                        '-t', str(stop - start), '-vf', f'fps={32 / (stop - start)},{COLOR}',
                        '-frames:v', '32', '-c:v', 'libwebp', '-lossless', '1', '-compression_level', '2',
                        '-pix_fmt', 'bgra', str(destination / '%02d.webp')], check=True)
        if len(list(destination.glob('*.webp'))) != 32:
            raise RuntimeError(f'Incomplete frame sequence: {direction}')
        print(f'Prepared {direction}: 32 lossless frames', flush=True)
    # Publish only after every direction has been successfully prepared.
    for direction in SEGMENTS:
        shutil.copytree(staging / direction, PUBLIC / 'frames/1280' / direction, dirs_exist_ok=True)
    shutil.copy2(staging / 'hero-poster.png', PUBLIC / 'images/hero-poster.png')
print('Published 128 full-resolution BT.709 frames and the matching poster.', flush=True)
