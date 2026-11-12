"""Swap the bundled game/ folder inside a PyInstaller one-file exe (CArchive) without rebuilding.

usage: repack.py inspect <exe>
       repack.py repack <src exe> <game dir> <out exe>
"""
import os, struct, sys, zlib, hashlib

MAGIC = b'MEI\014\013\012\013\016'
COOKIE_FMT = '!8sIIII64s'
COOKIE_LEN = struct.calcsize(COOKIE_FMT)
ENTRY_FMT = '!IIIIBc'
ENTRY_LEN = struct.calcsize(ENTRY_FMT)


def read_archive(path):
    data = open(path, 'rb').read()
    pos = data.rfind(MAGIC)
    assert pos >= 0, 'no PyInstaller cookie found'
    magic, pkg_len, toc_off, toc_len, pyver, pylib = struct.unpack(COOKIE_FMT, data[pos:pos + COOKIE_LEN])
    pkg_start = pos + COOKIE_LEN - pkg_len
    trailer = data[pos + COOKIE_LEN:]
    toc = data[pkg_start + toc_off: pkg_start + toc_off + toc_len]
    entries = []
    p = 0
    while p < len(toc):
        elen, off, clen, ulen, cflag, tc = struct.unpack(ENTRY_FMT, toc[p:p + ENTRY_LEN])
        name = toc[p + ENTRY_LEN:p + elen].rstrip(b'\0').decode('utf-8')
        entries.append(dict(name=name, off=off, clen=clen, ulen=ulen, cflag=cflag, tc=tc,
                            raw=data[pkg_start + off: pkg_start + off + clen]))
        p += elen
    return dict(data=data, pkg_start=pkg_start, pyver=pyver, pylib=pylib, entries=entries, trailer=trailer,
                toc_off=toc_off)


def write_archive(src, entries, out_path):
    body = bytearray()
    toc = bytearray()
    for e in entries:
        off = len(body)
        body += e['raw']
        name = e['name'].encode('utf-8')
        elen = ENTRY_LEN + len(name) + 1
        elen += (16 - elen % 16) % 16
        toc += struct.pack(ENTRY_FMT, elen, off, len(e['raw']), e['ulen'], e['cflag'], e['tc'])
        toc += name + b'\0' * (elen - ENTRY_LEN - len(name))
    toc_off = len(body)
    pkg_len = toc_off + len(toc) + COOKIE_LEN
    cookie = struct.pack(COOKIE_FMT, MAGIC, pkg_len, toc_off, len(toc), src['pyver'], src['pylib'])
    with open(out_path, 'wb') as f:
        f.write(src['data'][:src['pkg_start']])
        f.write(body); f.write(toc); f.write(cookie); f.write(src['trailer'])


def is_game(name):
    return name.replace('\\', '/').startswith('game/')


if sys.argv[1] == 'inspect':
    a = read_archive(sys.argv[2])
    es = a['entries']
    game = [e for e in es if is_game(e['name'])]
    print('pyver', a['pyver'], 'pylib', a['pylib'].rstrip(b'\0'), 'entries', len(es), 'game entries', len(game),
          'bootloader bytes', a['pkg_start'], 'trailer', len(a['trailer']))
    seen = {}
    for e in es:
        seen.setdefault((e['tc'], e['cflag'], is_game(e['name'])), []).append(e['name'])
    for k, v in seen.items():
        print(k, len(v), v[:3])
    if len(sys.argv) > 3:
        for e in game:
            if e['name'].replace('\\', '/') == sys.argv[3]:
                d = zlib.decompress(e['raw']) if e['cflag'] else e['raw']
                print(sys.argv[3], len(d), hashlib.sha256(d).hexdigest())
else:
    src_exe, game_dir, out = sys.argv[2:5]
    a = read_archive(src_exe)
    old_game = [e for e in a['entries'] if is_game(e['name'])]
    sep = '\\' if any('\\' in e['name'] for e in old_game) else '/'
    tc = old_game[0]['tc']
    keep = [e for e in a['entries'] if not is_game(e['name'])]
    first_game = next(i for i, e in enumerate(a['entries']) if is_game(e['name']))
    new = []
    for root, dirs, files in os.walk(game_dir):
        dirs.sort()
        for fn in sorted(files):
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, os.path.dirname(os.path.abspath(game_dir))).replace(os.sep, sep)
            raw = open(full, 'rb').read()
            new.append(dict(name=rel, raw=zlib.compress(raw, 9), ulen=len(raw), cflag=1, tc=tc))
    # keep the game block where it was in the table of contents
    n_before = sum(1 for e in a['entries'][:first_game] if not is_game(e['name']))
    entries = keep[:n_before] + new + keep[n_before:]
    write_archive(a, entries, out)
    old_names = {e['name'] for e in old_game}; new_names = {e['name'] for e in new}
    print('kept', len(keep), 'game old', len(old_game), 'game new', len(new))
    print('added', sorted(new_names - old_names)); print('removed', sorted(old_names - new_names))
