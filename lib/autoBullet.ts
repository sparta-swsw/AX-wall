export function handleBulletKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (v: string) => void
) {
  if (e.key !== ' ') return;
  const el = e.currentTarget;
  const pos = el.selectionStart ?? 0;
  const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
  const linePrefix = value.slice(lineStart, pos);

  if (linePrefix === '-') {
    e.preventDefault();
    const newVal = value.slice(0, lineStart) + '• ' + value.slice(pos);
    onChange(newVal);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = lineStart + 2;
    });
  }
}
