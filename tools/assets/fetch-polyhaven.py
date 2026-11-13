#!/usr/bin/env python3
"""Download the photo-scanned CC0 assets from Poly Haven (https://polyhaven.com, CC0) and
prepare them for the web:
  textures -> assets/tex/<id>/{diff,nor,arm}.jpg   (1K, re-encoded)
  skies    -> assets/sky/<id>.hdr (1K, for lighting) + assets/sky/<id>.jpg (4096x2048 background)
  models   -> assets/models/<id>.glb  (simplified and quantised with gltf-transform)
Usage: python3 tools/assets/fetch-polyhaven.py [--only id,id] [--kind tex|sky|model]
Models need `npx gltf-transform` (npm i @gltf-transform/cli@3) on PATH or GLTF_TRANSFORM set."""
import json, os, sys, subprocess, urllib.request, concurrent.futures as cf, shutil, tempfile
from io import BytesIO
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets')
UA = {'User-Agent': 'sirah-asset-fetch/1.0'}

TEXTURES = """dense_sand gravelly_sand coast_sand_01 dry_ground_rocks mud_cracked_dry_03 dirt
rock_face rock_face_03 rock_boulder_dry dark_rock dry_riverbed_rock quarry_wall
clay_plaster brown_mud_dry clay_block_wall patterned_clay_plaster old_stone_wall plastered_stone_wall
marble_01 palm_tree_bark medieval_wood old_planks_02 rough_linen brown_leather""".split()
SKIES = """qwantani_dawn_puresky qwantani_sunrise_puresky qwantani_morning_puresky qwantani_noon_puresky
qwantani_late_afternoon_puresky qwantani_sunset_puresky qwantani_dusk_2_puresky qwantani_moonrise_puresky
qwantani_night_puresky kloofendal_43d_clear_puresky syferfontein_6d_clear_puresky""".split()
MODELS = {  # id: simplify ratio (fraction of triangles kept)
  'namaqualand_boulder_02': 0.06, 'namaqualand_boulder_04': 0.06, 'namaqualand_boulder_05': 0.06,
  'namaqualand_rocks_01': 0.08, 'namaqualand_stones_01': 0.1, 'namaqualand_cliff_01': 0.05,
  'rock_07': 0.08, 'boulder_01': 0.08, 'sand_rocks_small_01': 0.1,
  'dead_tree_trunk': 0.12, 'dry_branches_medium_01': 0.25, 'shrub_01': 0.3, 'shrub_03': 0.3,
  'wild_rooibos_bush': 0.3, 'grass_medium_01': 0.4,
  'stone_fire_pit': 0.2, 'wicker_basket_01': 0.25, 'ceramic_vase_01': 0.3, 'jug_01': 0.3,
  'brass_pot_01': 0.3, 'brass_diya_lantern': 0.35, 'vintage_oil_lamp': 0.35, 'wooden_bowl_01': 0.3,
  'food_pomegranate_01': 0.3,
}

LODS = set('boulder_01 dead_tree_trunk dry_branches_medium_01 grass_medium_01 namaqualand_boulder_02 namaqualand_boulder_04 namaqualand_boulder_05 namaqualand_rocks_01 namaqualand_stones_01 rock_07 sand_rocks_small_01 shrub_01 shrub_03 wild_rooibos_bush'.split())

def glb_triangles(path):
    b = open(path, 'rb').read(); n = int.from_bytes(b[12:16], 'little'); j = json.loads(b[20:20 + n])
    return sum(j['accessors'][p['indices']]['count'] // 3 for m in j['meshes'] for p in m['primitives'])

def get_json(u): return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60))
def get_bytes(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=600).read()

def jpg(data, path, size=None, q=82):
    im = Image.open(BytesIO(data)).convert('RGB')
    if size: im = im.resize(size, Image.LANCZOS)
    im.save(path, 'JPEG', quality=q, optimize=True, progressive=True)

def tex(i):
    d = get_json('https://api.polyhaven.com/files/' + i); o = os.path.join(OUT, 'tex', i); os.makedirs(o, exist_ok=True)
    for key, name in (('Diffuse', 'diff'), ('nor_gl', 'nor'), ('arm', 'arm')):
        if key in d: jpg(get_bytes(d[key]['1k']['jpg']['url']), os.path.join(o, name + '.jpg'), q=80 if name != 'nor' else 88)
    return i

def sky(i):
    d = get_json('https://api.polyhaven.com/files/' + i); o = os.path.join(OUT, 'sky'); os.makedirs(o, exist_ok=True)
    open(os.path.join(o, i + '.hdr'), 'wb').write(get_bytes(d['hdri']['1k']['hdr']['url']))
    jpg(get_bytes(d['tonemapped']['url']), os.path.join(o, i + '.jpg'), size=(4096, 2048), q=84)
    return i

def model(i):
    d = get_json('https://api.polyhaven.com/files/' + i)['gltf']['1k']['gltf']
    tmp = tempfile.mkdtemp(); src = os.path.join(tmp, i + '.gltf')
    open(src, 'wb').write(get_bytes(d['url']))
    for rel, f in d['include'].items():
        p = os.path.join(tmp, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(get_bytes(f['url']))
    os.makedirs(os.path.join(OUT, 'models'), exist_ok=True)
    dst = os.path.join(OUT, 'models', i + '.glb')
    gt = os.environ.get('GLTF_TRANSFORM', 'gltf-transform')
    a = os.path.join(tmp, 'a.glb'); b = os.path.join(tmp, 'b.glb'); c = os.path.join(tmp, 'c.glb')
    run = lambda *args: subprocess.run([gt, *args], check=True, capture_output=True)
    run('weld', src, a)
    run('simplify', a, b, '--ratio', str(MODELS.get(i, 0.2)), '--error', '0.002')
    run('resize', b, c, '--width', '1024', '--height', '1024')
    run('quantize', c, dst)
    # a light version for scattering by the hundred
    if i in LODS:
        tris = glb_triangles(dst)
        target = 2600 if any(k in i for k in ('shrub', 'bush', 'grass', 'branches')) else 1600
        run('simplify', dst, a, '--ratio', str(min(1, target / max(1, tris))), '--error', '0.08')
        run('resize', a, os.path.join(OUT, 'models', i + '.lod.glb'), '--width', '512', '--height', '512')
    shutil.rmtree(tmp, ignore_errors=True)
    return i

if __name__ == '__main__':
    args = sys.argv[1:]
    only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
    kind = args[args.index('--kind') + 1] if '--kind' in args else None
    jobs = []
    if kind in (None, 'tex'): jobs += [(tex, i) for i in TEXTURES]
    if kind in (None, 'sky'): jobs += [(sky, i) for i in SKIES]
    if kind in (None, 'model'): jobs += [(model, i) for i in MODELS]
    if only: jobs = [j for j in jobs if j[1] in only]
    with cf.ThreadPoolExecutor(6) as ex:
        futs = {ex.submit(f, i): i for f, i in jobs}
        for fu in cf.as_completed(futs):
            try: print('ok', fu.result(), flush=True)
            except Exception as e: print('FAILED', futs[fu], e, flush=True)
