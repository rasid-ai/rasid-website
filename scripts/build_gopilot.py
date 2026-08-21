"""Build GoPilot studio use-case imagery from raw_data/gopilot.

For each case: read the base GeoTIFF, reproject its geojson into the base's
pixel grid (rasterio georeferencing → exact alignment), draw the overlay, and
write a base + transparent-overlay pair to public/gopilot/<id>-{base,overlay}.webp
(both cover-cropped identically to 1280x800). Raster overlays (DINOv3 PCA) and
single-band bases (NDWI) are handled specially. Not shipped; run offline.
"""
import os, json, math
import numpy as np
import rasterio
from rasterio.warp import transform as warp_transform
from PIL import Image, ImageDraw

RAW = 'raw_data/gopilot'
OUT = 'public/gopilot'
os.makedirs(OUT, exist_ok=True)
TW, TH = 1280, 800


def hex_rgba(h, a):
    h = (h or '#39d39a').lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def read_base(path):
    with rasterio.open(path) as d:
        arr = d.read()
        return arr, d.crs, d.transform, d.width, d.height


def base_to_rgb(arr):
    if arr.shape[0] >= 3:
        return np.transpose(arr[:3], (1, 2, 0)).astype('uint8')
    b = arr[0].astype('float64')
    v = b[np.isfinite(b)]
    lo, hi = np.percentile(v, 2), np.percentile(v, 98)
    g = np.clip((b - lo) / (hi - lo + 1e-9), 0, 1)
    return (np.dstack([g * 90 + 20, g * 120 + 28, g * 150 + 40])).astype('uint8')


def to_px(lon, lat, crs, T):
    if crs and str(crs) != 'EPSG:4326':
        xs, ys = warp_transform('EPSG:4326', crs, [lon], [lat])
        x, y = xs[0], ys[0]
    else:
        x, y = lon, lat
    col, row = ~T * (x, y)
    return col, row


def rings_of(geom):
    """Yield outer rings (lists of [lon,lat]) for Polygon / MultiPolygon."""
    if not geom:
        return
    c = geom.get('coordinates') or []
    if geom['type'] == 'Polygon':
        if c and c[0]:
            yield c[0]
    elif geom['type'] == 'MultiPolygon':
        for poly in c:
            if poly and poly[0]:
                yield poly[0]


def draw_overlay(gjpath, crs, T, W, H, default='#39d39a', fill_a=90, stroke_a=235, width=2, use_props=True):
    g = json.load(open(gjpath, encoding='utf8'))
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(ov)
    for f in g['features']:
        p = f.get('properties') or {}
        col = (p.get('fill') or p.get('color') or default) if use_props else default
        stroke_col = (p.get('stroke') or col) if use_props else default
        fill = hex_rgba(col, fill_a)
        stroke = hex_rgba(stroke_col, stroke_a)
        for ring in rings_of(f['geometry']):
            pts = [to_px(x, y, crs, T) for x, y in ring]
            if len(pts) < 3:
                continue
            dr.polygon(pts, fill=fill)
            dr.line(pts + [pts[0]], fill=stroke, width=width, joint='curve')
    return ov


def cover(img, resample):
    w, h = img.size
    sc = max(TW / w, TH / h)
    nw, nh = int(round(w * sc)), int(round(h * sc))
    img = img.resize((nw, nh), resample)
    l, t = (nw - TW) // 2, (nh - TH) // 2
    return img.crop((l, t, l + TW, t + TH))


def save_pair(cid, base_img, ov_img):
    b = cover(base_img.convert('RGB'), Image.LANCZOS)
    o = cover(ov_img, Image.LANCZOS)
    b.save(f'{OUT}/{cid}-base.webp', 'WEBP', quality=84)
    o.save(f'{OUT}/{cid}-overlay.webp', 'WEBP', quality=88)
    print('built', cid)


def vector_case(cid, base_tif, gj, **kw):
    arr, crs, T, W, H = read_base(base_tif)
    base = Image.fromarray(base_to_rgb(arr))
    ov = draw_overlay(gj, crs, T, W, H, **kw)
    save_pair(cid, base, ov)


# 1) scene parsing (VHR, EPSG:3857) — per-class colours from props
vector_case('scene-parse', f'{RAW}/scene parsing/0800872d70a5440d87cdc348e7b5ddad.tif',
            f'{RAW}/scene parsing/5e5a34a97b9e4c4f95b4b0fd27a1e009.geojson',
            fill_a=110, stroke_a=200, width=1)

# 2) solar panels (Datong)
vector_case('solar', f'{RAW}/solarpanels/datong_panda_head_z18.tif',
            f'{RAW}/solarpanels/datong_panda_solar_panels_area.geojson',
            default='#37E0A6', fill_a=70, stroke_a=245, width=2)

# 3) tree counting (5-band base → first 3)
vector_case('trees', f'{RAW}/treecounting/tree.tiff',
            f'{RAW}/treecounting/polygons.geojson',
            default='#37E0A6', fill_a=60, stroke_a=235, width=2, use_props=False)

# 4) water bodies — Sentinel-2 RGB base + NDWI blue tint (dark=water) + lakes
def water():
    d = f'{RAW}/waterbodymonitoring'
    with rasterio.open(f'{d}/lakeland_s2_20260711.tif') as s2:
        a = s2.read().astype('float32')  # bands: B, G, R, NIR
        crs, T, W, H = s2.crs, s2.transform, s2.width, s2.height

    def st(band):
        v = band[np.isfinite(band) & (band > 0)]
        lo, hi = np.percentile(v, 2), np.percentile(v, 98)
        return np.clip((band - lo) / (hi - lo + 1e-9), 0, 1)

    rgb = (np.dstack([st(a[2]), st(a[1]), st(a[0])]) * 255).astype('uint8')  # true colour
    base = Image.fromarray(rgb)

    # NDWI resampled onto the S2 grid → blue tint: dark blue = water (high NDWI),
    # light blue = land (low NDWI). Semi-transparent so the RGB texture shows.
    with rasterio.open(f'{d}/lakeland_ndwi.tif') as dn:
        nd = dn.read(1, out_shape=(H, W)).astype('float64'); ndno = dn.nodata
    m = np.isfinite(nd) & (nd != (ndno if ndno is not None else -9999))
    v = nd[m]; lo, hi = np.percentile(v, 5), np.percentile(v, 95)
    t = np.clip((nd - lo) / (hi - lo + 1e-9), 0, 1); t[~m] = 0
    R = 175 - 165 * t; G = 212 - 178 * t; B = 240 - 165 * t   # light blue → dark blue
    A = (0.28 + 0.5 * t) * 255                                 # water more opaque
    ov = Image.fromarray(np.dstack([R, G, B, A]).astype('uint8'), 'RGBA')

    # detected lakes outline on top
    dr = ImageDraw.Draw(ov)
    g = json.load(open(f'{d}/lakeland_lakes_filtered.geojson', encoding='utf8'))
    for f in g['features']:
        for ring in rings_of(f['geometry']):
            pts = [to_px(x, y, crs, T) for x, y in ring]
            if len(pts) >= 3:
                dr.line(pts + [pts[0]], fill=(200, 248, 255, 235), width=2, joint='curve')

    # crop the S2 nodata border (black rotated corners) to the valid data box
    lum = rgb.sum(axis=2)
    cs, rs = (lum > 30).sum(axis=0), (lum > 30).sum(axis=1)
    cols, rows = np.where(cs > 0.5 * H)[0], np.where(rs > 0.5 * W)[0]
    if cols.size and rows.size:
        box = (int(cols.min()), int(rows.min()), int(cols.max()) + 1, int(rows.max()) + 1)
        base = base.crop(box); ov = ov.crop(box)
    save_pair('water', base, ov)
water()

# 5) wildfire — dNBR burn-severity difference map over post-fire RGB
def wildfire():
    d = f'{RAW}/wildfiremadrid'
    arr, crs, T, W, H = read_base(f'{d}/madrid_postfire_rgb_uint8.tif')
    base = Image.fromarray(base_to_rgb(arr))
    with rasterio.open(f'{d}/madrid_prefire_nbr.tif') as ds:
        pre = ds.read(1).astype('float64'); nd = ds.nodata
    with rasterio.open(f'{d}/madrid_postfire_nbr.tif') as ds:
        post = ds.read(1).astype('float64')
    m = np.isfinite(pre) & np.isfinite(post)
    if nd is not None:
        m &= (pre != nd) & (post != nd)
    dnbr = np.where(m, pre - post, np.nan)  # high dNBR = severe burn
    # burn severity ramp: unburned(transparent) -> yellow -> orange -> red -> dark red
    T0 = 0.10                       # below this = essentially unburned
    hi = np.nanpercentile(dnbr, 99)
    t = np.clip((dnbr - T0) / (max(hi - T0, 1e-6)), 0, 1)
    t = np.nan_to_num(t, nan=0.0)
    # colour stops
    def lerp(a, b, k): return a + (b - a) * k
    R = np.where(t < 0.5, lerp(250, 250, t / .5), lerp(250, 150, (t - .5) / .5))
    G = np.where(t < 0.5, lerp(220, 130, t / .5), lerp(130, 20, (t - .5) / .5))
    B = np.where(t < 0.5, lerp(70, 25, t / .5), lerp(25, 15, (t - .5) / .5))
    A = np.power(t, 0.7) * 225
    ov_arr = np.dstack([R, G, B, A]).astype('uint8')
    ov = Image.fromarray(ov_arr, 'RGBA')
    # burn perimeter outline for definition
    dr = ImageDraw.Draw(ov)
    g = json.load(open(f'{d}/madrid_burn_area.geojson', encoding='utf8'))
    for f in g['features']:
        for ring in rings_of(f['geometry']):
            pts = [to_px(x, y, crs, T) for x, y in ring]
            if len(pts) >= 3:
                dr.line(pts + [pts[0]], fill=(255, 240, 210, 220), width=2, joint='curve')
    save_pair('wildfire', base, ov)
    hs = float(np.mean(t[np.isfinite(dnbr)] > 0.66)) * 100
    print('  wildfire dNBR hi=%.3f  high-severity=%.1f%%' % (hi, hs))
wildfire()

# 6) DINOv3 embeddings (mapbox base + PCA raster overlay, both same bounds)
def dinov3():
    arr, crs, T, W, H = read_base(f'{RAW}/dinov3/mapbox_z16_bbox_55.09448_25.08376_55.16999_25.14831.tif')
    base = Image.fromarray(base_to_rgb(arr))
    with rasterio.open(f'{RAW}/dinov3/b0019995-81f3-4147-9856-851181bc86e9.tif') as d:
        pca = d.read().astype('float64')  # (3,h,w) float
    chans = []
    for i in range(3):
        c = pca[i]; v = c[np.isfinite(c)]
        lo, hi = np.percentile(v, 2), np.percentile(v, 98)
        chans.append(np.clip((c - lo) / (hi - lo + 1e-9), 0, 1))
    rgb = (np.dstack(chans) * 255).astype('uint8')
    ov = Image.fromarray(rgb).resize((W, H), Image.LANCZOS).convert('RGBA')
    ov.putalpha(190)
    save_pair('dinov3', base, ov)
dinov3()

# 7) Eiffel buildings — footprints over the HQ Mapbox base (georeferenced)
def eiffel():
    from affine import Affine
    tif = f'{RAW}/eiffeltowerbuildings/eiffel_tower_mapbox_hq.tif'
    with rasterio.open(tif) as d:
        crs = d.crs
        ow = 2400  # downsample from ~10k px via overviews
        oh = int(round(d.height * ow / d.width))
        arr = d.read(out_shape=(d.count, oh, ow))
        T = d.transform * Affine.scale(d.width / ow, d.height / oh)
    base = Image.fromarray(np.transpose(arr[:3], (1, 2, 0)).astype('uint8'))
    ov = Image.new('RGBA', (ow, oh), (0, 0, 0, 0))
    dr = ImageDraw.Draw(ov)
    buf = json.load(open(f'{RAW}/eiffeltowerbuildings/eiffel_2km_buffer.geojson', encoding='utf8'))
    bld = json.load(open(f'{RAW}/eiffeltowerbuildings/eiffel_buildings_within_2km.geojson', encoding='utf8'))
    for f in bld['features']:  # building footprints
        for ring in rings_of(f['geometry']):
            pts = [to_px(x, y, crs, T) for x, y in ring]
            if len(pts) >= 3:
                dr.polygon(pts, fill=(55, 224, 166, 90), outline=(120, 245, 200, 235))
    for f in buf['features']:  # 2km buffer ring on top
        for ring in rings_of(f['geometry']):
            pts = [to_px(x, y, crs, T) for x, y in ring]
            dr.line(pts + [pts[0]], fill=(55, 224, 166, 200), width=3, joint='curve')
    save_pair('buildings', base, ov)
eiffel()

print('ALL DONE')
