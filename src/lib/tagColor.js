const TAG_COLORS = ['tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5', 'tag-6']

export function tagColorClass(label) {
  if (!label) return 'tag-1'
  const sum = [...label].reduce((s, c) => s + c.charCodeAt(0), 0)
  return TAG_COLORS[sum % TAG_COLORS.length]
}

export const TAG_CLASSES = {
  'tag-1': 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  'tag-2': 'bg-cyan-50 text-cyan-800 border-cyan-200/70',
  'tag-3': 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200/70',
  'tag-4': 'bg-amber-50 text-amber-800 border-amber-200/70',
  'tag-5': 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  'tag-6': 'bg-rose-50 text-rose-800 border-rose-200/70',
}

export function getTagStyles(label) {
  const key = tagColorClass(label)
  return TAG_CLASSES[key] || TAG_CLASSES['tag-1']
}

