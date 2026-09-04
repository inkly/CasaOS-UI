// The backend always answers "All" but with count 0 when no registered store
// has a category-list.json matching its apps (e.g. only a third-party store).
// The menu filter drops it, so never leave the selection undefined
// (IceWhaleTech/CasaOS#2537).
export function categoryMenu(categories) {
  const menu = (categories || []).filter(item => item.count > 0)

  return { menu, current: menu[0] || { count: 0, font: 'apps', id: 0, name: 'All' } }
}
