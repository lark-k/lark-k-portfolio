"""Copy original supplied media without cropping, masking, or recompression."""
from pathlib import Path
import subprocess
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'site/public/assets'
for kind in ['images', 'videos']:
    (PUBLIC / kind).mkdir(parents=True, exist_ok=True)
images = {
    'background.png': 'assets/mouse-follow/backgrounds/background-fixed.png',
    'workstation.png': 'assets/works/portfolio-workstation.png',
    'folder.png': 'assets/works/folders/portfolio-folder.png',
    'folder-expanded.png': 'assets/works/folders/portfolio-folder-expanded.png',
}
for direction in ['default', 'up', 'down', 'left', 'right']:
    images[f'portrait-{direction}.png'] = f'assets/mouse-follow/portraits/portrait-{direction}.png'
for name, source in images.items():
    shutil.copy2(ROOT / source, PUBLIC / 'images' / name)
videos = {
    'hero': 'assets/home/videos/home-loop.mp4',
    'transition': 'assets/home/videos/home-to-works-transition.mp4',
    'folder-hover': 'assets/works/videos/portfolio-folder-hover.mp4',
}
for name, source in videos.items():
    shutil.copy2(ROOT / source, PUBLIC / 'videos' / f'{name}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / source), '-frames:v', '1', str(PUBLIC / 'images' / f'{name}-poster.png')], check=True)
for obsolete in ['videos/folder-hover.webm', 'documents/resume-liangke.pdf']:
    (PUBLIC / obsolete).unlink(missing_ok=True)
(PUBLIC / 'videos/transition-return.mp4').unlink(missing_ok=True)
subprocess.run([sys.executable, str(Path(__file__).with_name('prepare-hero.py'))], check=True)
print('Original images and videos copied unchanged; preview posters extracted.')
