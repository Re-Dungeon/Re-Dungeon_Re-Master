from pathlib import Path
import sys

path = Path('src/components/PersonagemFichaDialog/PersonagemFichaDialog.jsx')
text = path.read_text(encoding='utf-8')
stack = []
pairs = {'{': '}', '(': ')', '[': ']'}
line = 1
col = 0
state = 'code'
escape = False
idx = 0
length = len(text)
while idx < length:
    ch = text[idx]
    col += 1
    if ch == '\n':
        line += 1
        col = 0
        if state == 'line_comment':
            state = 'code'
        idx += 1
        continue

    if state == 'code':
        if ch == '/' and idx + 1 < length:
            nxt = text[idx + 1]
            if nxt == '/':
                state = 'line_comment'
                idx += 2
                col += 1
                continue
            if nxt == '*':
                state = 'block_comment'
                idx += 2
                col += 1
                continue
        if ch == '"':
            state = 'string_double'
            idx += 1
            continue
        if ch == "'":
            state = 'string_single'
            idx += 1
            continue
        if ch == '`':
            state = 'template'
            idx += 1
            continue
        if ch in pairs:
            stack.append((ch, line, col, idx))
        elif ch in pairs.values():
            if not stack:
                print('Extra closing', ch, 'at line', line, 'col', col)
                sys.exit(0)
            o, l, p, pi = stack.pop()
            if pairs[o] != ch:
                print('Mismatch', o, 'at line', l, 'col', p, 'with', ch, 'at line', line, 'col', col)
                sys.exit(0)
    elif state == 'string_double':
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == '"':
            state = 'code'
    elif state == 'string_single':
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == "'":
            state = 'code'
    elif state == 'template':
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == '`':
            state = 'code'
    elif state == 'block_comment':
        if ch == '*' and idx + 1 < length and text[idx + 1] == '/':
            state = 'code'
            idx += 2
            col += 1
            continue
    idx += 1

print('stack len', len(stack))
if stack:
    o, l, p, pi = stack[-1]
    print('unmatched top', o, 'at line', l, 'col', p)
    start = max(0, l - 3)
    lines = text.splitlines()
    for i in range(start, min(len(lines), l + 2)):
        print(f'{i + 1}: {lines[i]}')
